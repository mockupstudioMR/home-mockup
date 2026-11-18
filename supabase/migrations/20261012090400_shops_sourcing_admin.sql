-- =====================================================================
-- Shops, sourcing choices, custom-made requests and the admin scan pipeline
-- Builds on 20261012090000–090300. Safe on live data: only new tables,
-- new nullable or defaulted columns, and a backfill of shops from
-- existing shop_products.
-- =====================================================================

-- ---------------------------------------------------------------
-- 1. Shops: one place for partner shops and shops users paste in
-- ---------------------------------------------------------------
CREATE TYPE public.shop_kind AS ENUM ('partner', 'user_added');
CREATE TYPE public.shop_status AS ENUM ('pending', 'approved', 'rejected', 'unreadable');

CREATE TABLE public.shops (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  domain           text,                                   -- "studio-oak.example", lower case, no www
  url              text,
  kind             public.shop_kind NOT NULL DEFAULT 'user_added',
  status           public.shop_status NOT NULL DEFAULT 'pending',
  owner_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,   -- retailer account, if any
  added_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  terms_checked    boolean NOT NULL DEFAULT false,
  product_count    integer NOT NULL DEFAULT 0,
  last_scraped_at  timestamptz,
  reviewed_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX shops_domain_key ON public.shops (lower(domain)) WHERE domain IS NOT NULL;
CREATE UNIQUE INDEX shops_owner_key ON public.shops (owner_user_id) WHERE owner_user_id IS NOT NULL;

-- Existing retailer shops become approved partner shops.
INSERT INTO public.shops (name, url, domain, kind, status, owner_user_id, terms_checked, product_count)
SELECT coalesce(bp.business_name, 'Shop ' || left(sp.shop_id::text, 8)),
       bp.website_url,
       nullif(lower(regexp_replace(regexp_replace(coalesce(bp.website_url, ''), '^https?://(www\.)?', ''), '/.*$', '')), ''),
       'partner', 'approved', sp.shop_id, true, sp.n
FROM (SELECT shop_id, count(*)::int AS n FROM public.shop_products GROUP BY shop_id) sp
LEFT JOIN LATERAL (SELECT business_name, website_url FROM public.business_profiles b
                   WHERE b.user_id = sp.shop_id ORDER BY b.created_at LIMIT 1) bp ON true
ON CONFLICT DO NOTHING;

ALTER TABLE public.shop_products ADD COLUMN shop_ref uuid REFERENCES public.shops(id) ON DELETE CASCADE;
UPDATE public.shop_products p SET shop_ref = s.id FROM public.shops s WHERE s.owner_user_id = p.shop_id AND p.shop_ref IS NULL;
CREATE INDEX idx_shop_products_shop_ref ON public.shop_products (shop_ref);

CREATE TABLE public.shop_scrape_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  status          text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'done', 'failed')),
  products_found  integer NOT NULL DEFAULT 0,
  error           text,
  started_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_shop_scrape_runs_shop ON public.shop_scrape_runs (shop_id, started_at DESC);

-- ---------------------------------------------------------------
-- 2. Where a project shops (screen 5.0) and the shops it added
-- ---------------------------------------------------------------
CREATE TABLE public.project_shop_choices (
  project_id       uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  use_suggested    boolean NOT NULL DEFAULT true,
  use_custom_made  boolean NOT NULL DEFAULT false,
  use_own_shops    boolean NOT NULL DEFAULT false,
  own_shops_first  boolean NOT NULL DEFAULT true,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (use_suggested OR use_custom_made OR use_own_shops)
);

CREATE TABLE public.project_shops (
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  shop_id     uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  added_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, shop_id)
);
CREATE INDEX idx_project_shops_shop ON public.project_shops (shop_id);

-- ---------------------------------------------------------------
-- 3. Products ↔ schemes, and the source of each room item
-- ---------------------------------------------------------------
CREATE TABLE public.product_scheme_links (
  product_id  uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  scheme_id   uuid NOT NULL REFERENCES public.furniture_schemes(id) ON DELETE CASCADE,
  confidence  numeric(3,2) CHECK (confidence BETWEEN 0 AND 1),
  source      text NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'admin')),
  confirmed   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, scheme_id)
);
CREATE INDEX idx_product_scheme_links_scheme ON public.product_scheme_links (scheme_id);

ALTER TABLE public.room_items
  ADD COLUMN sourcing          text CHECK (sourcing IN ('suggested', 'own_shop', 'custom_made', 'keep_existing')),
  ADD COLUMN chosen_product_id uuid REFERENCES public.shop_products(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------
-- 4. Custom-made pieces
-- ---------------------------------------------------------------
CREATE TABLE public.custom_made_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_item_id  uuid NOT NULL REFERENCES public.room_items(id) ON DELETE CASCADE,
  spec          jsonb NOT NULL DEFAULT '{}'::jsonb,       -- sizes, materials, finish, notes
  drawing_path  text,                                     -- storage path of the spec drawing
  maker_name    text,
  maker_contact text,
  quote_amount  numeric(12,2) CHECK (quote_amount >= 0),
  currency      char(3) NOT NULL DEFAULT 'EUR',
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'requested', 'quoted', 'accepted', 'declined')),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_custom_made_item ON public.custom_made_requests (room_item_id);

-- ---------------------------------------------------------------
-- 5. Status on the library
-- ---------------------------------------------------------------
CREATE TYPE public.term_status AS ENUM ('proposed', 'active', 'retired');
ALTER TABLE public.taxonomy_terms
  ADD COLUMN status        public.term_status NOT NULL DEFAULT 'active',
  ADD COLUMN proposed_from uuid;                           -- detected_pieces.id, set below
UPDATE public.taxonomy_terms SET status = 'retired' WHERE NOT is_active;

ALTER TABLE public.furniture_schemes
  ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired'));
ALTER TABLE public.scheme_combinations
  ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pinned', 'retired'));

-- ---------------------------------------------------------------
-- 6. Admin scan pipeline
-- ---------------------------------------------------------------
CREATE TABLE public.ingest_batches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  source_type      text NOT NULL CHECK (source_type IN ('room_photo', 'catalogue_page', 'generated_design', 'retailer_link')),
  room_type_id     uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,
  style_hint_id    uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,
  source_credit    text,
  source_url       text,
  threshold        numeric(3,2) NOT NULL DEFAULT 0.85 CHECK (threshold BETWEEN 0.5 AND 1),
  review_all       boolean NOT NULL DEFAULT false,
  status           text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'detecting', 'needs_review', 'done', 'failed', 'undone')),
  found_count      integer NOT NULL DEFAULT 0,
  saved_count      integer NOT NULL DEFAULT 0,
  waiting_count    integer NOT NULL DEFAULT 0,
  failed_count     integer NOT NULL DEFAULT 0,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  finished_at      timestamptz
);

CREATE TABLE public.ingest_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         uuid NOT NULL REFERENCES public.ingest_batches(id) ON DELETE CASCADE,
  storage_path     text,                                   -- admin-scans bucket
  source_url       text,
  file_hash        text,
  page_no          smallint,
  status           text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'detecting', 'done', 'failed', 'duplicate')),
  error            text,
  detected_style_id uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ingest_items_batch ON public.ingest_items (batch_id);
CREATE UNIQUE INDEX ingest_items_hash_key ON public.ingest_items (file_hash) WHERE file_hash IS NOT NULL AND status <> 'duplicate';

ALTER TABLE public.scheme_combinations
  ADD COLUMN ingest_batch_id uuid REFERENCES public.ingest_batches(id) ON DELETE SET NULL;

CREATE TABLE public.detected_pieces (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          uuid NOT NULL REFERENCES public.ingest_items(id) ON DELETE CASCADE,
  box              jsonb,                                  -- {"x":0.57,"y":0.68,"w":0.42,"h":0.31} as share of image
  crop_path        text,
  category_id      uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,
  color_id         uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,
  style_id         uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,
  material_id      uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,
  tag_ids          uuid[] NOT NULL DEFAULT '{}',
  raw              jsonb NOT NULL DEFAULT '{}'::jsonb,     -- the AI's own words per facet
  confidence       numeric(3,2) CHECK (confidence BETWEEN 0 AND 1),
  review_reason    text CHECK (review_reason IN ('low_confidence', 'new_word', 'possible_duplicate', 'reported', 'spot_check')),
  status           text NOT NULL DEFAULT 'waiting' CHECK (status IN ('saved', 'waiting', 'confirmed', 'merged', 'dropped')),
  scheme_id        uuid REFERENCES public.furniture_schemes(id) ON DELETE SET NULL,
  reviewed_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_detected_pieces_item ON public.detected_pieces (item_id);
CREATE INDEX idx_detected_pieces_waiting ON public.detected_pieces (created_at) WHERE status = 'waiting';

ALTER TABLE public.taxonomy_terms
  ADD CONSTRAINT taxonomy_terms_proposed_from_fkey FOREIGN KEY (proposed_from) REFERENCES public.detected_pieces(id) ON DELETE SET NULL;

CREATE TABLE public.detection_corrections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id     uuid NOT NULL REFERENCES public.detected_pieces(id) ON DELETE CASCADE,
  facet        text NOT NULL,
  ai_value     text,
  fixed_value  text,
  fixed_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- 7. Audit log and settings history
-- ---------------------------------------------------------------
CREATE TABLE public.admin_audit_log (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name  text NOT NULL,
  row_id      text,
  action      text NOT NULL,                 -- insert, update, delete, merge, undo, approve…
  before      jsonb,
  after       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_log_table ON public.admin_audit_log (table_name, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_admin_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO admin_audit_log (actor_id, table_name, row_id, action, before, after)
  VALUES (auth.uid(), TG_TABLE_NAME,
          coalesce((to_jsonb(NEW) ->> 'id'), (to_jsonb(OLD) ->> 'id')),
          lower(TG_OP),
          CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
          CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END);
  RETURN coalesce(NEW, OLD);
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['taxonomy_terms', 'furniture_schemes', 'scheme_combinations', 'compatibility_rules',
                           'palettes', 'style_definitions', 'signal_weights', 'furniture_specs', 'scope_defaults',
                           'shops', 'cms_content'] LOOP
    EXECUTE format('CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON public.%I
                    FOR EACH ROW WHEN (auth.uid() IS NOT NULL) EXECUTE FUNCTION public.log_admin_change()', t, t);
  END LOOP;
END $$;

CREATE TABLE public.settings_versions (
  id          bigserial PRIMARY KEY,
  key         text NOT NULL,
  value       text NOT NULL,
  content_type text,
  saved_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  saved_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_settings_versions_key ON public.settings_versions (key, saved_at DESC);

CREATE OR REPLACE FUNCTION public.keep_settings_version()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO settings_versions (key, value, content_type, saved_by) VALUES (OLD.key, OLD.value, OLD.content_type, auth.uid());
  RETURN NEW;
END $$;
CREATE TRIGGER cms_content_keep_version BEFORE UPDATE ON public.cms_content
  FOR EACH ROW WHEN (OLD.value IS DISTINCT FROM NEW.value) EXECUTE FUNCTION public.keep_settings_version();

-- Default scan settings, editable in CMS & settings.
INSERT INTO public.cms_content (key, content_type, value)
VALUES ('scan_settings', 'json', '{"auto_save_threshold":0.85,"max_pages_per_pdf":20,"spot_check_sample":10,"undo_days":14}')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------
-- 8. Helpers
-- ---------------------------------------------------------------
-- Shops a project may search: approved shops plus the ones the project added.
CREATE OR REPLACE FUNCTION public.project_shop_ids(_project_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id FROM shops s
  WHERE public.can_access_project(_project_id)
    AND (s.status = 'approved'
         OR EXISTS (SELECT 1 FROM project_shops ps WHERE ps.project_id = _project_id AND ps.shop_id = s.id));
$$;

-- Merge two terms: every reference moves to the kept term; the old label becomes a synonym.
CREATE OR REPLACE FUNCTION public.merge_terms(_keep uuid, _drop uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k taxonomy_terms; d taxonomy_terms;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admins only'; END IF;
  SELECT * INTO k FROM taxonomy_terms WHERE id = _keep;
  SELECT * INTO d FROM taxonomy_terms WHERE id = _drop;
  IF k.id IS NULL OR d.id IS NULL OR k.facet <> d.facet THEN RAISE EXCEPTION 'both terms must exist and share a facet'; END IF;
  UPDATE furniture_schemes SET category_id = _keep WHERE category_id = _drop;
  UPDATE furniture_schemes SET color_id    = _keep WHERE color_id    = _drop;
  UPDATE furniture_schemes SET style_id    = _keep WHERE style_id    = _drop;
  UPDATE furniture_schemes SET material_id = _keep WHERE material_id = _drop;
  UPDATE furniture_scheme_tags t SET term_id = _keep WHERE term_id = _drop
    AND NOT EXISTS (SELECT 1 FROM furniture_scheme_tags x WHERE x.scheme_id = t.scheme_id AND x.term_id = _keep);
  DELETE FROM furniture_scheme_tags WHERE term_id = _drop;
  UPDATE compatibility_rules SET term_a_id = _keep WHERE term_a_id = _drop;
  UPDATE compatibility_rules SET term_b_id = _keep WHERE term_b_id = _drop;
  UPDATE taxonomy_terms SET parent_id = _keep WHERE parent_id = _drop;
  UPDATE detected_pieces SET category_id = _keep WHERE category_id = _drop;
  UPDATE detected_pieces SET color_id    = _keep WHERE color_id    = _drop;
  UPDATE detected_pieces SET style_id    = _keep WHERE style_id    = _drop;
  UPDATE detected_pieces SET material_id = _keep WHERE material_id = _drop;
  UPDATE taxonomy_terms
     SET synonyms = (SELECT array_agg(DISTINCT s) FROM unnest(k.synonyms || d.synonyms || ARRAY[lower(d.label)]) s)
   WHERE id = _keep;
  UPDATE taxonomy_terms SET status = 'retired', is_active = false WHERE id = _drop;
  INSERT INTO admin_audit_log (actor_id, table_name, row_id, action, before, after)
  VALUES (auth.uid(), 'taxonomy_terms', _drop::text, 'merge', to_jsonb(d), jsonb_build_object('merged_into', _keep));
END $$;
REVOKE EXECUTE ON FUNCTION public.merge_terms(uuid, uuid) FROM PUBLIC, anon;

-- ---------------------------------------------------------------
-- 9. Access
-- ---------------------------------------------------------------
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read approved or own project shops" ON public.shops FOR SELECT TO authenticated
  USING (status = 'approved' OR added_by = auth.uid() OR owner_user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM project_shops ps WHERE ps.shop_id = shops.id AND public.can_access_project(ps.project_id))
         OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users add shops for review" ON public.shops FOR INSERT TO authenticated
  WITH CHECK (added_by = auth.uid() AND kind = 'user_added' AND status = 'pending' AND NOT terms_checked);
CREATE POLICY "Admins manage shops" ON public.shops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT ON public.shops TO authenticated;

ALTER TABLE public.shop_scrape_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read runs of visible shops" ON public.shop_scrape_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM shops s WHERE s.id = shop_id));
CREATE POLICY "Admins manage runs" ON public.shop_scrape_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.shop_scrape_runs TO authenticated;

ALTER TABLE public.project_shop_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members read choices" ON public.project_shop_choices FOR SELECT TO authenticated
  USING (public.can_access_project(project_id));
CREATE POLICY "Owner sets choices" ON public.project_shop_choices FOR ALL TO authenticated
  USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_shop_choices TO authenticated;

ALTER TABLE public.project_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members read shops" ON public.project_shops FOR SELECT TO authenticated
  USING (public.can_access_project(project_id));
CREATE POLICY "Owner adds and removes shops" ON public.project_shops FOR ALL TO authenticated
  USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id) AND added_by = auth.uid());
CREATE POLICY "Admins manage project shops" ON public.project_shops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, DELETE ON public.project_shops TO authenticated;

ALTER TABLE public.product_scheme_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads links" ON public.product_scheme_links FOR SELECT USING (true);
CREATE POLICY "Admins manage links" ON public.product_scheme_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.product_scheme_links TO anon, authenticated;

ALTER TABLE public.custom_made_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room members read requests" ON public.custom_made_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM room_items i WHERE i.id = room_item_id AND public.can_access_room(i.room_id)));
CREATE POLICY "Room editors manage requests" ON public.custom_made_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM room_items i WHERE i.id = room_item_id AND public.can_edit_room(i.room_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM room_items i WHERE i.id = room_item_id AND public.can_edit_room(i.room_id)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_made_requests TO authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ingest_batches', 'ingest_items', 'detected_pieces', 'detection_corrections',
                           'admin_audit_log', 'settings_versions'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Admins only" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;
GRANT USAGE ON SEQUENCE public.admin_audit_log_id_seq, public.settings_versions_id_seq TO authenticated;

-- Proposed and retired terms are hidden from users; admins see everything.
DROP POLICY IF EXISTS "Anyone reads" ON public.taxonomy_terms;
CREATE POLICY "Anyone reads active terms" ON public.taxonomy_terms FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------
-- 10. Storage for admin scans (private)
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-scans', 'admin-scans', false)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Admins read scans" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'admin-scans' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload scans" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-scans' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete scans" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-scans' AND public.has_role(auth.uid(), 'admin'));
