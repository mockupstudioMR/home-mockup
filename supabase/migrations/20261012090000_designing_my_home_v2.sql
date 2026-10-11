-- =====================================================================
-- Home Mockup · "Designing my home" 10-step flow — data model v2
-- Target: Supabase PostgreSQL (15+). Additive: no existing table is
-- dropped or renamed. Existing RoomSpec JSON (rooms.walls, rooms.layout,
-- rooms.furniture) stays as the generator cache/export; the tables below
-- hold the user's decisions in queryable form.
-- =====================================================================

-- ---------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------
CREATE TYPE public.project_intent      AS ENUM ('new_space', 'redesign', 'exploring');
CREATE TYPE public.property_type       AS ENUM ('apartment', 'house', 'studio', 'loft');
CREATE TYPE public.room_starting_state AS ENUM ('core_shell', 'empty', 'partially_furnished', 'redo_all');
CREATE TYPE public.scope_mode          AS ENUM ('in_scope', 'on_request', 'kept_as_is');
CREATE TYPE public.step_status         AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
CREATE TYPE public.keep_change         AS ENUM ('keep', 'change', 'skip');
CREATE TYPE public.remark_category     AS ENUM ('interior_finishes', 'furniture', 'colours_materials', 'decor', 'lighting');
CREATE TYPE public.item_source         AS ENUM ('existing_kept', 'proposed', 'user_added');
CREATE TYPE public.item_action         AS ENUM ('buy', 'keep', 'custom', 'own_or_buy', 'buy_or_keep');
CREATE TYPE public.size_kind           AS ENUM ('standard', 'available', 'approved');
CREATE TYPE public.size_status         AS ENUM ('standard', 'edited', 'measured', 'approved');
CREATE TYPE public.feature_kind        AS ENUM ('window', 'door', 'balcony_door', 'archway', 'radiator', 'column', 'built_in',
                                                'socket_switch', 'water_supply_drain', 'soil_stack', 'ac_unit_vent', 'fuse_box_meter', 'other');
CREATE TYPE public.service_kind        AS ENUM ('electrical', 'water', 'ac_ventilation', 'heating', 'data_tv_sound');
CREATE TYPE public.point_status        AS ENUM ('existing', 'proposed', 'tbc', 'confirmed');
CREATE TYPE public.light_layer         AS ENUM ('overall', 'task', 'accent');
CREATE TYPE public.wall_review_status  AS ENUM ('to_review', 'kept', 'changed');
CREATE TYPE public.sample_status       AS ENUM ('none', 'requested', 'received', 'approved');
CREATE TYPE public.collaborator_role   AS ENUM ('designer', 'joiner', 'electrician', 'plumber', 'ac_installer',
                                                'flooring_curtains', 'decorator', 'other');
CREATE TYPE public.task_status         AS ENUM ('todo', 'in_progress', 'done', 'blocked');
CREATE TYPE public.deliverable_kind    AS ENUM ('design_review', 'buying_pack', 'installation_pack', 'project_checklist', 'moodboard');
CREATE TYPE public.deliverable_status  AS ENUM ('ready', 'needs_sizes', 'after_survey', 'generating');
CREATE TYPE public.media_subject       AS ENUM ('room', 'inspiration', 'room_item', 'room_feature', 'room_wall', 'room_service');

-- ---------------------------------------------------------------
-- 2. Projects (step 1) — the missing layer above rooms
-- ---------------------------------------------------------------
CREATE TABLE public.projects (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                   text NOT NULL DEFAULT 'My home',
  intent                 public.project_intent NOT NULL,
  property_type          public.property_type,
  budget_min             numeric(12,2) CHECK (budget_min >= 0),
  budget_max             numeric(12,2) CHECK (budget_max IS NULL OR budget_max >= coalesce(budget_min, 0)),
  currency               char(3) NOT NULL DEFAULT 'EUR',
  target_timing          text CHECK (target_timing IN ('1_month', '1_3_months', '3_6_months', '6_plus_months')),
  city_or_postcode       text,
  renovation_restriction text CHECK (renovation_restriction IN ('none_owner', 'rented_limited', 'building_rules', 'not_sure')),
  step1_completed_at     timestamptz,
  archived_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_owner ON public.projects (owner_id, created_at DESC);

-- Rooms join a project, get an order and a starting state.
ALTER TABLE public.rooms
  ADD COLUMN project_id        uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN sequence_no       smallint CHECK (sequence_no BETWEEN 1 AND 50),
  ADD COLUMN starting_state    public.room_starting_state,
  ADD COLUMN current_step      smallint NOT NULL DEFAULT 2 CHECK (current_step BETWEEN 2 AND 10),
  ADD COLUMN ceiling_height_cm integer CHECK (ceiling_height_cm BETWEEN 150 AND 1000),
  ADD COLUMN scale_reference   jsonb,          -- {"ref":"wall_A","length_m":3.75,"source":"floorplan"}
  ADD COLUMN inspiration_note  text,
  ADD COLUMN floor_plan_analysis_id uuid REFERENCES public.floor_plan_analyses(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX rooms_project_sequence_key ON public.rooms (project_id, sequence_no) WHERE project_id IS NOT NULL;

-- What each starting state lets the design change (scope panel, step 1.5).
CREATE TABLE public.room_scope (
  room_id        uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  area           text NOT NULL CHECK (area IN ('furniture','walls_finishes','floors','lighting','built_ins',
                                               'electrical','water_plumbing','ac_ventilation','heating','data_tv_sound')),
  mode           public.scope_mode NOT NULL,
  allow_changes  boolean NOT NULL DEFAULT false,  -- "Allow small changes inside the walls"
  note           text,
  PRIMARY KEY (room_id, area)
);

-- Step progress + the frozen "Here's where we stand" summary per step.
CREATE TABLE public.step_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id       uuid REFERENCES public.rooms(id) ON DELETE CASCADE,   -- NULL only for step 1
  step_no       smallint NOT NULL CHECK (step_no BETWEEN 1 AND 10),
  status        public.step_status NOT NULL DEFAULT 'not_started',
  sub_step      text,
  summary       jsonb NOT NULL DEFAULT '{}'::jsonb,   -- decisions + still-open items at completion
  started_at    timestamptz,
  completed_at  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK ((step_no = 1) = (room_id IS NULL))
);
CREATE UNIQUE INDEX step_progress_key ON public.step_progress (project_id, room_id, step_no) NULLS NOT DISTINCT;

-- ---------------------------------------------------------------
-- 3. Inspiration (step 2)
-- ---------------------------------------------------------------
CREATE TABLE public.style_matches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  style_slug     text NOT NULL,
  style_label    text NOT NULL,
  match_pct      smallint NOT NULL CHECK (match_pct BETWEEN 0 AND 100),
  keywords       text[] NOT NULL DEFAULT '{}',
  kept_keywords  text[] NOT NULL DEFAULT '{}',
  is_selected    boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, style_slug)
);

-- Preview versions already live in generated_designs (room_id, parent_design_id).
ALTER TABLE public.generated_designs
  ADD COLUMN version_no     smallint,
  ADD COLUMN is_kept        boolean NOT NULL DEFAULT false,
  ADD COLUMN change_request text;
CREATE UNIQUE INDEX generated_designs_one_kept_per_room ON public.generated_designs (room_id) WHERE is_kept AND room_id IS NOT NULL;

-- AI read-out of each preview: one remark per category, keep/change (screen 2.7).
CREATE TABLE public.design_remarks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id     uuid NOT NULL REFERENCES public.generated_designs(id) ON DELETE CASCADE,
  category      public.remark_category NOT NULL,
  remark        text NOT NULL,
  keywords      text[] NOT NULL DEFAULT '{}',
  decision      public.keep_change NOT NULL DEFAULT 'keep',
  change_note   text,
  pin_x_pct     numeric(5,2) CHECK (pin_x_pct BETWEEN 0 AND 100),
  pin_y_pct     numeric(5,2) CHECK (pin_y_pct BETWEEN 0 AND 100),
  model         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (design_id, category),
  CHECK (decision <> 'change' OR change_note IS NOT NULL)
);

-- ---------------------------------------------------------------
-- 4. Daily life (step 3)
-- ---------------------------------------------------------------
CREATE TABLE public.room_activity_choices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  activity_id    uuid REFERENCES public.room_activities(id) ON DELETE SET NULL,
  custom_label   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (activity_id IS NOT NULL OR custom_label IS NOT NULL)
);
CREATE UNIQUE INDEX room_activity_choices_key ON public.room_activity_choices (room_id, activity_id) WHERE activity_id IS NOT NULL;

CREATE TABLE public.room_priorities (
  room_id        uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  rank           smallint NOT NULL CHECK (rank BETWEEN 1 AND 2),
  priority_key   text NOT NULL CHECK (priority_key IN ('comfortable_seating','instrument_space','guest_seating',
                                                       'storage','calm_clutter_free','easy_to_clean','other')),
  label          text,
  PRIMARY KEY (room_id, rank),
  UNIQUE (room_id, priority_key)
);

-- Fixed features ("What can't move?") — one row per instance, placed or not.
CREATE TABLE public.room_features (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  kind           public.feature_kind NOT NULL,
  label          text NOT NULL,                      -- "Door 2"
  wall_id        text,                               -- matches rooms.walls[].id
  position_pct   numeric(5,2) CHECK (position_pct BETWEEN 0 AND 100),
  plan_x_pct     numeric(5,2) CHECK (plan_x_pct BETWEEN 0 AND 100),
  plan_y_pct     numeric(5,2) CHECK (plan_y_pct BETWEEN 0 AND 100),
  width_cm       integer CHECK (width_cm > 0),
  is_movable     boolean NOT NULL DEFAULT false,
  status         public.point_status NOT NULL DEFAULT 'existing',
  source         text NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'ai_photo', 'floorplan')),
  is_placed      boolean GENERATED ALWAYS AS (plan_x_pct IS NOT NULL AND plan_y_pct IS NOT NULL) STORED,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_room_features_room ON public.room_features (room_id, kind);

-- ---------------------------------------------------------------
-- 5. Reference sizes — extend furniture_specs into a size database
-- ---------------------------------------------------------------
ALTER TABLE public.furniture_specs
  ADD COLUMN category       text,                   -- seating, tables, storage, instruments, beds, lighting, decor
  ADD COLUMN variant        text NOT NULL DEFAULT 'standard',
  ADD COLUMN height_cm      integer CHECK (height_cm > 0),
  ADD COLUMN extra_dims     jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {"seat_height_cm":45,"bench":{"w":56,"d":36,"h":49}}
  ADD COLUMN is_default     boolean NOT NULL DEFAULT false,
  ADD COLUMN source         text;
ALTER TABLE public.furniture_specs DROP CONSTRAINT IF EXISTS furniture_specs_name_key;
ALTER TABLE public.furniture_specs ADD CONSTRAINT furniture_specs_name_variant_key UNIQUE (name, variant);
CREATE UNIQUE INDEX furniture_specs_one_default ON public.furniture_specs (name) WHERE is_default;

-- ---------------------------------------------------------------
-- 6. Layout options (step 4)
-- ---------------------------------------------------------------
CREATE TABLE public.room_layout_options (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  option_no     smallint NOT NULL CHECK (option_no >= 1),
  name          text NOT NULL,                     -- "Relax + piano"
  description   text,
  items         jsonb NOT NULL DEFAULT '[]'::jsonb, -- same shape as RoomSpec.layout.items
  seats         smallint,
  pros          text[] NOT NULL DEFAULT '{}',
  cons          text[] NOT NULL DEFAULT '{}',
  is_chosen     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, option_no)
);
CREATE UNIQUE INDEX room_layout_options_one_chosen ON public.room_layout_options (room_id) WHERE is_chosen;

-- layout_feedback was never linked to a room.
ALTER TABLE public.layout_feedback ADD COLUMN room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE;
CREATE INDEX idx_layout_feedback_room ON public.layout_feedback (room_id);

-- ---------------------------------------------------------------
-- 7. Items: kept pieces, furniture, decor, lights = one buying list (steps 3, 5–9)
-- ---------------------------------------------------------------
CREATE TABLE public.room_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id            uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  label              text NOT NULL,                        -- "Plum curved sofa"
  item_type          text NOT NULL,                        -- sofa, chair, piano, rug, pendant…
  source             public.item_source NOT NULL DEFAULT 'proposed',
  action             public.item_action NOT NULL DEFAULT 'buy',
  quantity           numeric(8,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  quantity_note      text,                                 -- "1 set", "2–4"
  furniture_spec_id  uuid REFERENCES public.furniture_specs(id) ON DELETE SET NULL,
  wall_id            text,
  plan_x_pct         numeric(5,2) CHECK (plan_x_pct BETWEEN 0 AND 100),
  plan_y_pct         numeric(5,2) CHECK (plan_y_pct BETWEEN 0 AND 100),
  rotation_deg       smallint CHECK (rotation_deg BETWEEN 0 AND 359),
  position_fixed     boolean NOT NULL DEFAULT false,
  light_layer        public.light_layer,                   -- set for lights only
  decision           public.keep_change NOT NULL DEFAULT 'keep',
  material_label     text,
  product_id         uuid REFERENCES public.products(id) ON DELETE SET NULL,
  shop_product_id    uuid REFERENCES public.shop_products(id) ON DELETE SET NULL,
  supplier           text,
  unit_price         numeric(12,2) CHECK (unit_price >= 0),
  currency           char(3) NOT NULL DEFAULT 'EUR',
  lead_time_days     integer CHECK (lead_time_days >= 0),
  delivery_notes     text,
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (product_id IS NULL OR shop_product_id IS NULL)
);
CREATE INDEX idx_room_items_room ON public.room_items (room_id, action);

-- Three sizes kept apart: standard (from size DB) → available (measured space) → approved (product).
CREATE TABLE public.room_item_sizes (
  item_id      uuid NOT NULL REFERENCES public.room_items(id) ON DELETE CASCADE,
  kind         public.size_kind NOT NULL,
  width_cm     numeric(7,1) CHECK (width_cm > 0),
  depth_cm     numeric(7,1) CHECK (depth_cm > 0),
  height_cm    numeric(7,1) CHECK (height_cm > 0),
  diameter_cm  numeric(7,1) CHECK (diameter_cm > 0),
  extra        jsonb NOT NULL DEFAULT '{}'::jsonb,
  status       public.size_status NOT NULL DEFAULT 'standard',
  measured_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  measured_at  timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, kind)
);

-- ---------------------------------------------------------------
-- 8. Colours & materials (step 6)
-- ---------------------------------------------------------------
CREATE TABLE public.room_materials (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  slot                smallint NOT NULL CHECK (slot BETWEEN 1 AND 8),
  label               text NOT NULL,                  -- "Plum velvet"
  hex                 char(7) CHECK (hex ~ '^#[0-9A-Fa-f]{6}$'),
  material_visual_id  uuid REFERENCES public.material_visuals(id) ON DELETE SET NULL,
  applies_to          text[] NOT NULL DEFAULT '{}',   -- {"sofa","curtains"}
  sample_status       public.sample_status NOT NULL DEFAULT 'none',
  UNIQUE (room_id, slot)
);

-- ---------------------------------------------------------------
-- 9. Inside the walls + lighting power (steps 3, 7, 8)
-- ---------------------------------------------------------------
CREATE TABLE public.room_service_points (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  service         public.service_kind NOT NULL,
  point_type      text NOT NULL CHECK (point_type IN ('socket','switch','dimmer','blind_power','light_outlet','data','tv',
                                                      'speaker','water_supply','drain','ac_unit','vent','radiator','underfloor_manifold')),
  point_code      text,                                -- "D-E1"
  wall_id         text,
  position_pct    numeric(5,2) CHECK (position_pct BETWEEN 0 AND 100),
  height_cm       integer CHECK (height_cm >= 0),
  quantity        smallint NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status          public.point_status NOT NULL DEFAULT 'proposed',
  serves_item_id  uuid REFERENCES public.room_items(id) ON DELETE SET NULL,
  confirmed_by    public.collaborator_role,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX room_service_points_code ON public.room_service_points (room_id, point_code) WHERE point_code IS NOT NULL;

-- ---------------------------------------------------------------
-- 10. Wall-by-wall review (step 8)
-- ---------------------------------------------------------------
CREATE TABLE public.room_walls (
  room_id           uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  wall_id           text NOT NULL,                  -- same ids as rooms.walls[]
  name              text,                           -- "Sofa wall"
  finish            text,
  status            public.wall_review_status NOT NULL DEFAULT 'to_review',
  change_note       text,
  elevation_ready   boolean NOT NULL DEFAULT false,
  reviewed_at       timestamptz,
  PRIMARY KEY (room_id, wall_id)
);

-- ---------------------------------------------------------------
-- 11. Photos for anything (steps 3, 4, 8)
-- ---------------------------------------------------------------
CREATE TABLE public.media_assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id         uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  subject         public.media_subject NOT NULL,
  subject_id      uuid,                              -- room_items / room_features / … id
  storage_bucket  text NOT NULL DEFAULT 'room-uploads',
  storage_path    text NOT NULL,
  capture         text NOT NULL DEFAULT 'upload' CHECK (capture IN ('camera', 'upload', 'pinterest')),
  ai_analysis     jsonb,                             -- detected sockets, pipes, vents…
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (subject IN ('room','inspiration') OR subject_id IS NOT NULL)
);
CREATE INDEX idx_media_assets_subject ON public.media_assets (subject, subject_id);
CREATE INDEX idx_media_assets_room ON public.media_assets (room_id);

-- ---------------------------------------------------------------
-- 12. Make it happen (step 9) and deliverables (step 10)
-- ---------------------------------------------------------------
CREATE TABLE public.measurement_checks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  check_group   text NOT NULL CHECK (check_group IN ('room_survey','furniture_fit','built_ins_finishes',
                                                      'curtains_art_mirror','lighting_electricity','delivery_access')),
  check_key     text NOT NULL,
  label         text NOT NULL,
  value_numeric numeric(10,2),
  unit          text,
  item_id       uuid REFERENCES public.room_items(id) ON DELETE SET NULL,
  is_done       boolean NOT NULL DEFAULT false,
  done_at       timestamptz,
  UNIQUE (room_id, check_key)
);

CREATE TABLE public.project_collaborators (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email          text,
  role           public.collaborator_role NOT NULL,
  invite_status  public.invite_status NOT NULL DEFAULT 'pending',
  invite_token   text UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_at     timestamptz NOT NULL DEFAULT now(),
  accepted_at    timestamptz,
  CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);
CREATE INDEX idx_project_collaborators_user ON public.project_collaborators (user_id) WHERE user_id IS NOT NULL;

CREATE TABLE public.project_tasks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id        uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  stage_no       smallint NOT NULL CHECK (stage_no BETWEEN 1 AND 7),
  title          text NOT NULL,
  owner_role     public.collaborator_role,          -- NULL = the homeowner
  collaborator_id uuid REFERENCES public.project_collaborators(id) ON DELETE SET NULL,
  status         public.task_status NOT NULL DEFAULT 'todo',
  due_date       date,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_tasks_project ON public.project_tasks (project_id, stage_no, sort_order);

CREATE TABLE public.project_deliverables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id       uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  kind          public.deliverable_kind NOT NULL,
  status        public.deliverable_status NOT NULL DEFAULT 'generating',
  storage_path  text,
  generated_at  timestamptz,
  UNIQUE (project_id, room_id, kind)
);

-- ---------------------------------------------------------------
-- 13. Access helpers (owner or accepted collaborator)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_project(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM projects p WHERE p.id = _project_id AND p.owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM project_collaborators c
                 WHERE c.project_id = _project_id AND c.user_id = auth.uid() AND c.invite_status = 'accepted')
      OR public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM projects p WHERE p.id = _project_id AND p.owner_id = auth.uid());
$$;

-- Rooms without a project keep the old "own rows" rule.
CREATE OR REPLACE FUNCTION public.can_access_room(_room_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM rooms r
                 WHERE r.id = _room_id
                   AND (r.user_id = auth.uid() OR (r.project_id IS NOT NULL AND public.can_access_project(r.project_id))));
$$;

CREATE OR REPLACE FUNCTION public.can_edit_room(_room_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM rooms r
                 WHERE r.id = _room_id
                   AND (r.user_id = auth.uid() OR (r.project_id IS NOT NULL AND public.is_project_owner(r.project_id))));
$$;

-- ---------------------------------------------------------------
-- 14. RLS — owner edits, collaborators read
-- ---------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members read"   ON public.projects FOR SELECT TO authenticated USING (public.can_access_project(id));
CREATE POLICY "Owner inserts project"  ON public.projects FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner updates project"  ON public.projects FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes project"  ON public.projects FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Collaborators can also read the rooms of projects they joined.
CREATE POLICY "Collaborators read project rooms" ON public.rooms FOR SELECT TO authenticated
  USING (project_id IS NOT NULL AND public.can_access_project(project_id));

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['room_scope','style_matches','room_activity_choices','room_priorities','room_features',
                           'room_layout_options','room_items','room_materials','room_service_points','room_walls',
                           'measurement_checks'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Members read" ON public.%I FOR SELECT TO authenticated USING (public.can_access_room(room_id))', t);
    EXECUTE format('CREATE POLICY "Owner writes" ON public.%I FOR ALL TO authenticated USING (public.can_edit_room(room_id)) WITH CHECK (public.can_edit_room(room_id))', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['step_progress','project_tasks','project_deliverables','media_assets'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Members read" ON public.%I FOR SELECT TO authenticated USING (public.can_access_project(project_id))', t);
    EXECUTE format('CREATE POLICY "Owner writes" ON public.%I FOR ALL TO authenticated USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id))', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- Sizes and remarks hang off items / designs.
ALTER TABLE public.room_item_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read" ON public.room_item_sizes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.room_items i WHERE i.id = item_id AND public.can_access_room(i.room_id)));
CREATE POLICY "Owner writes" ON public.room_item_sizes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.room_items i WHERE i.id = item_id AND public.can_edit_room(i.room_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.room_items i WHERE i.id = item_id AND public.can_edit_room(i.room_id)));

ALTER TABLE public.design_remarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Design owner manages remarks" ON public.design_remarks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.generated_designs d WHERE d.id = design_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.generated_designs d WHERE d.id = design_id AND d.user_id = auth.uid()));

ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages team" ON public.project_collaborators FOR ALL TO authenticated
  USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id));
CREATE POLICY "Collaborator sees own invite" ON public.project_collaborators FOR SELECT TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects, public.room_item_sizes, public.design_remarks, public.project_collaborators TO authenticated;
GRANT ALL ON public.projects, public.room_item_sizes, public.design_remarks, public.project_collaborators TO service_role;

-- ---------------------------------------------------------------
-- 15. updated_at triggers (existing helper)
-- ---------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects','step_progress','design_remarks','room_features','room_items','room_item_sizes',
                           'room_service_points','project_tasks'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------
-- 16. Buying list view (replaces hand-built shopping_lists.list JSON over time)
-- ---------------------------------------------------------------
CREATE VIEW public.v_buying_list WITH (security_invoker = true) AS
SELECT i.room_id, r.project_id, i.id AS item_id, i.label, i.item_type, i.action, i.quantity, i.quantity_note, i.wall_id,
       s.width_cm  AS std_w, s.depth_cm  AS std_d, s.height_cm  AS std_h,
       a.width_cm  AS avail_w, a.depth_cm AS avail_d, a.height_cm AS avail_h,
       p.width_cm  AS appr_w, p.depth_cm  AS appr_d, p.height_cm  AS appr_h,
       coalesce(p.status, a.status, s.status, 'standard') AS size_status,
       i.unit_price, i.currency, i.lead_time_days, i.supplier
FROM public.room_items i
JOIN public.rooms r ON r.id = i.room_id
LEFT JOIN public.room_item_sizes s ON s.item_id = i.id AND s.kind = 'standard'
LEFT JOIN public.room_item_sizes a ON a.item_id = i.id AND a.kind = 'available'
LEFT JOIN public.room_item_sizes p ON p.item_id = i.id AND p.kind = 'approved';
GRANT SELECT ON public.v_buying_list TO authenticated;
