-- =====================================================================
-- Home Mockup · Furniture schemes & scheme combinations
-- A furniture scheme  = category · colour · style · material + other tags
--                      e.g. "lounge chair · emerald · eclectic modern · leather · cane"
-- A scheme combination = 2 or more schemes used together, scored by signals
--                      (kept / changed / liked / bought together / expert verdicts)
-- Depends on: 20261012090000_designing_my_home_v2.sql
-- =====================================================================

-- ---------------------------------------------------------------
-- 1. One controlled vocabulary for every descriptor
-- ---------------------------------------------------------------
CREATE TYPE public.term_facet AS ENUM ('category', 'color', 'style', 'material', 'finish', 'shape', 'pattern', 'mood', 'room_type', 'other');

CREATE TABLE public.taxonomy_terms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facet       public.term_facet NOT NULL,
  slug        text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label       text NOT NULL,
  parent_id   uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,  -- chair → seating, emerald → green
  hex         char(7) CHECK (hex IS NULL OR hex ~ '^#[0-9A-Fa-f]{6}$'),     -- colours only
  synonyms    text[] NOT NULL DEFAULT '{}',                                   -- maps free text from AI / catalogues
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facet, slug),
  UNIQUE (id, facet),                                   -- target of the facet-checked foreign keys below
  CHECK (hex IS NULL OR facet = 'color')
);
CREATE INDEX idx_taxonomy_synonyms ON public.taxonomy_terms USING gin (synonyms);

-- Same facet for parent and child (a colour can't sit under a material).
CREATE OR REPLACE FUNCTION public.check_term_parent_facet() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND (SELECT facet FROM public.taxonomy_terms WHERE id = NEW.parent_id) <> NEW.facet THEN
    RAISE EXCEPTION 'parent term must have the same facet (%)', NEW.facet;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_term_parent_facet BEFORE INSERT OR UPDATE ON public.taxonomy_terms
  FOR EACH ROW EXECUTE FUNCTION public.check_term_parent_facet();

-- Free text ("Dark Walnut", "emerald green") → term id. Used when backfilling catalogue and AI data.
CREATE OR REPLACE FUNCTION public.resolve_term(_facet public.term_facet, _text text)
RETURNS uuid LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT id FROM taxonomy_terms
  WHERE facet = _facet AND is_active
    AND (slug = regexp_replace(lower(trim(_text)), '[^a-z0-9]+', '-', 'g')
         OR lower(label) = lower(trim(_text))
         OR lower(trim(_text)) = ANY (synonyms))
  ORDER BY (slug = regexp_replace(lower(trim(_text)), '[^a-z0-9]+', '-', 'g')) DESC
  LIMIT 1;
$$;

-- ---------------------------------------------------------------
-- 2. Furniture schemes
-- ---------------------------------------------------------------
CREATE TABLE public.furniture_schemes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid NOT NULL,
  category_facet  public.term_facet NOT NULL DEFAULT 'category' CHECK (category_facet = 'category'),
  color_id        uuid,
  color_facet     public.term_facet NOT NULL DEFAULT 'color'    CHECK (color_facet = 'color'),
  style_id        uuid,
  style_facet     public.term_facet NOT NULL DEFAULT 'style'    CHECK (style_facet = 'style'),
  material_id     uuid,
  material_facet  public.term_facet NOT NULL DEFAULT 'material' CHECK (material_facet = 'material'),
  tag_signature   text NOT NULL DEFAULT '',       -- sorted "facet:slug" of extra tags, kept by trigger
  label           text,                            -- optional human name, e.g. "Plum curved velvet sofa"
  source          text NOT NULL DEFAULT 'curated' CHECK (source IN ('curated', 'catalog', 'ai_extracted', 'user')),
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (category_id, category_facet) REFERENCES public.taxonomy_terms (id, facet),
  FOREIGN KEY (color_id, color_facet)       REFERENCES public.taxonomy_terms (id, facet),
  FOREIGN KEY (style_id, style_facet)       REFERENCES public.taxonomy_terms (id, facet),
  FOREIGN KEY (material_id, material_facet) REFERENCES public.taxonomy_terms (id, facet)
);
-- The same descriptor exists once.
CREATE UNIQUE INDEX furniture_schemes_identity ON public.furniture_schemes
  (category_id, color_id, style_id, material_id, tag_signature) NULLS NOT DISTINCT;
CREATE INDEX idx_schemes_category ON public.furniture_schemes (category_id);
CREATE INDEX idx_schemes_style ON public.furniture_schemes (style_id);

-- "Other tags": secondary colours, finishes, shapes, patterns, moods …
CREATE TABLE public.furniture_scheme_tags (
  scheme_id  uuid NOT NULL REFERENCES public.furniture_schemes(id) ON DELETE CASCADE,
  term_id    uuid NOT NULL REFERENCES public.taxonomy_terms(id) ON DELETE CASCADE,
  PRIMARY KEY (scheme_id, term_id)
);

CREATE OR REPLACE FUNCTION public.refresh_scheme_signature() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE _sid uuid := coalesce(NEW.scheme_id, OLD.scheme_id);
BEGIN
  UPDATE public.furniture_schemes s
  SET tag_signature = coalesce((SELECT string_agg(t.facet || ':' || t.slug, ',' ORDER BY t.facet, t.slug)
                                FROM public.furniture_scheme_tags st JOIN public.taxonomy_terms t ON t.id = st.term_id
                                WHERE st.scheme_id = _sid), '')
  WHERE s.id = _sid;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_scheme_tags_signature AFTER INSERT OR DELETE ON public.furniture_scheme_tags
  FOR EACH ROW EXECUTE FUNCTION public.refresh_scheme_signature();

-- ---------------------------------------------------------------
-- 3. Scheme combinations (2 or more schemes)
-- ---------------------------------------------------------------
CREATE TABLE public.scheme_combinations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text,                              -- "Eclectic Modern lounge"
  room_type_id    uuid,
  room_type_facet public.term_facet NOT NULL DEFAULT 'room_type' CHECK (room_type_facet = 'room_type'),
  style_id        uuid,                              -- the overall style the combination is meant for
  style_facet     public.term_facet NOT NULL DEFAULT 'style' CHECK (style_facet = 'style'),
  member_signature text NOT NULL DEFAULT '',         -- sorted scheme ids, kept by trigger
  member_count    smallint NOT NULL DEFAULT 0,
  source          text NOT NULL DEFAULT 'curated' CHECK (source IN ('curated', 'ai_generated', 'observed', 'user')),
  notes           text,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (room_type_id, room_type_facet) REFERENCES public.taxonomy_terms (id, facet),
  FOREIGN KEY (style_id, style_facet)         REFERENCES public.taxonomy_terms (id, facet)
);
-- One row per distinct set of schemes in a given room type.
CREATE UNIQUE INDEX scheme_combinations_identity ON public.scheme_combinations (member_signature, room_type_id) NULLS NOT DISTINCT
  WHERE member_signature <> '';

CREATE TABLE public.scheme_combination_members (
  combination_id  uuid NOT NULL REFERENCES public.scheme_combinations(id) ON DELETE CASCADE,
  scheme_id       uuid NOT NULL REFERENCES public.furniture_schemes(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'supporting' CHECK (role IN ('anchor', 'accent', 'supporting', 'decor', 'lighting')),
  PRIMARY KEY (combination_id, scheme_id)
);
CREATE INDEX idx_combination_members_scheme ON public.scheme_combination_members (scheme_id);

CREATE OR REPLACE FUNCTION public.refresh_combination_signature() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE _cid uuid := coalesce(NEW.combination_id, OLD.combination_id);
BEGIN
  UPDATE public.scheme_combinations c
  SET member_signature = coalesce((SELECT string_agg(m.scheme_id::text, ',' ORDER BY m.scheme_id)
                                   FROM public.scheme_combination_members m WHERE m.combination_id = _cid), ''),
      member_count = (SELECT count(*) FROM public.scheme_combination_members m WHERE m.combination_id = _cid)
  WHERE c.id = _cid;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_combination_members_signature AFTER INSERT OR DELETE ON public.scheme_combination_members
  FOR EACH ROW EXECUTE FUNCTION public.refresh_combination_signature();

-- A combination must end every transaction with at least 2 members.
CREATE OR REPLACE FUNCTION public.check_combination_size() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE _cid uuid := coalesce(NEW.combination_id, OLD.combination_id); _n int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.scheme_combinations WHERE id = _cid) THEN RETURN NULL; END IF;  -- whole combination deleted
  SELECT count(*) INTO _n FROM public.scheme_combination_members WHERE combination_id = _cid;
  IF _n < 2 THEN RAISE EXCEPTION 'a scheme combination needs at least 2 schemes (has %)', _n; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER trg_combination_min_size AFTER INSERT OR DELETE ON public.scheme_combination_members
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_combination_size();

-- ---------------------------------------------------------------
-- 4. Signals: how we learn which combinations work
-- ---------------------------------------------------------------
CREATE TYPE public.combination_signal AS ENUM ('curated', 'generated', 'kept_in_design', 'changed_in_design',
                                                'liked', 'disliked', 'bought_together', 'expert_approved', 'expert_rejected');

CREATE TABLE public.signal_weights (
  signal  public.combination_signal PRIMARY KEY,
  weight  numeric(4,2) NOT NULL CHECK (weight BETWEEN -5 AND 5)
);
INSERT INTO public.signal_weights VALUES
 ('curated', 1), ('generated', 0), ('kept_in_design', 1), ('changed_in_design', -1), ('liked', 1),
 ('disliked', -1), ('bought_together', 3), ('expert_approved', 2), ('expert_rejected', -2);

CREATE TABLE public.combination_signals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combination_id  uuid NOT NULL REFERENCES public.scheme_combinations(id) ON DELETE CASCADE,
  signal          public.combination_signal NOT NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  design_id       uuid REFERENCES public.generated_designs(id) ON DELETE SET NULL,
  room_id         uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_combination_signals_combo ON public.combination_signals (combination_id, signal);

-- Explicit rules for cold start: "walnut + brass works", "chrome + brass avoid".
CREATE TABLE public.compatibility_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_a_id   uuid NOT NULL REFERENCES public.taxonomy_terms(id) ON DELETE CASCADE,
  term_b_id   uuid NOT NULL REFERENCES public.taxonomy_terms(id) ON DELETE CASCADE,
  verdict     text NOT NULL CHECK (verdict IN ('works', 'avoid', 'neutral')),
  strength    smallint NOT NULL DEFAULT 3 CHECK (strength BETWEEN 1 AND 5),
  reason      text,
  source      text NOT NULL DEFAULT 'expert' CHECK (source IN ('expert', 'learned', 'ai')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (term_a_id < term_b_id),              -- store each pair once
  UNIQUE (term_a_id, term_b_id)
);

-- ---------------------------------------------------------------
-- 5. What feeds a design
-- ---------------------------------------------------------------
-- Style definitions: what a style means for prompts and defaults.
CREATE TABLE public.style_definitions (
  style_id          uuid PRIMARY KEY,
  style_facet       public.term_facet NOT NULL DEFAULT 'style' CHECK (style_facet = 'style'),
  description       text,
  prompt_fragment   text,                     -- inserted into generation prompts
  mood_keywords     text[] NOT NULL DEFAULT '{}',
  default_palette_id uuid,
  FOREIGN KEY (style_id, style_facet) REFERENCES public.taxonomy_terms (id, facet) ON DELETE CASCADE
);

-- Reusable palettes (a moodboard's colours, a style's default colours).
CREATE TABLE public.palettes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  style_id    uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,
  source      text NOT NULL DEFAULT 'curated' CHECK (source IN ('curated', 'moodboard', 'ai')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.palette_colors (
  palette_id  uuid NOT NULL REFERENCES public.palettes(id) ON DELETE CASCADE,
  position    smallint NOT NULL CHECK (position BETWEEN 1 AND 12),
  color_id    uuid NOT NULL,
  color_facet public.term_facet NOT NULL DEFAULT 'color' CHECK (color_facet = 'color'),
  role        text CHECK (role IN ('main', 'accent', 'neutral', 'wood', 'metal')),
  PRIMARY KEY (palette_id, position),
  FOREIGN KEY (color_id, color_facet) REFERENCES public.taxonomy_terms (id, facet)
);
ALTER TABLE public.style_definitions ADD FOREIGN KEY (default_palette_id) REFERENCES public.palettes(id) ON DELETE SET NULL;

-- Which schemes / combinations went into a generated design, and which were detected in it.
CREATE TABLE public.design_scheme_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       uuid NOT NULL REFERENCES public.generated_designs(id) ON DELETE CASCADE,
  scheme_id       uuid REFERENCES public.furniture_schemes(id) ON DELETE CASCADE,
  combination_id  uuid REFERENCES public.scheme_combinations(id) ON DELETE CASCADE,
  direction       text NOT NULL CHECK (direction IN ('input', 'detected')),
  design_item_id  uuid REFERENCES public.design_items(id) ON DELETE SET NULL,
  confidence      numeric(3,2) CHECK (confidence BETWEEN 0 AND 1),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (scheme_id IS NOT NULL OR combination_id IS NOT NULL)
);
CREATE INDEX idx_design_scheme_links_design ON public.design_scheme_links (design_id, direction);

-- Put a scheme on everything that describes a physical piece.
ALTER TABLE public.room_items     ADD COLUMN scheme_id uuid REFERENCES public.furniture_schemes(id) ON DELETE SET NULL;
ALTER TABLE public.design_items   ADD COLUMN scheme_id uuid REFERENCES public.furniture_schemes(id) ON DELETE SET NULL;
ALTER TABLE public.products       ADD COLUMN scheme_id uuid REFERENCES public.furniture_schemes(id) ON DELETE SET NULL;
ALTER TABLE public.shop_products  ADD COLUMN scheme_id uuid REFERENCES public.furniture_schemes(id) ON DELETE SET NULL;
ALTER TABLE public.furniture_specs ADD COLUMN category_term_id uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL;
ALTER TABLE public.material_visuals ADD COLUMN term_id uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL;
ALTER TABLE public.style_matches  ADD COLUMN style_term_id uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL;
ALTER TABLE public.room_materials ADD COLUMN color_term_id uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL,
                                  ADD COLUMN material_term_id uuid REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL;
CREATE INDEX idx_room_items_scheme ON public.room_items (scheme_id);
CREATE INDEX idx_shop_products_scheme ON public.shop_products (scheme_id);
CREATE INDEX idx_products_scheme ON public.products (scheme_id);

-- ---------------------------------------------------------------
-- 6. Readable views and learned scores
-- ---------------------------------------------------------------
-- "chair · emerald · eclectic modern · leather · cane"
CREATE VIEW public.v_furniture_schemes WITH (security_invoker = true) AS
SELECT s.id, s.label, s.source,
       c.label AS category, col.label AS color, col.hex, st.label AS style, m.label AS material,
       coalesce((SELECT array_agg(t.label ORDER BY t.facet, t.label) FROM public.furniture_scheme_tags x
                 JOIN public.taxonomy_terms t ON t.id = x.term_id WHERE x.scheme_id = s.id), '{}') AS other_tags,
       concat_ws(' · ', c.label, col.label, st.label, m.label,
                 (SELECT string_agg(t.label, ', ' ORDER BY t.facet, t.label) FROM public.furniture_scheme_tags x
                  JOIN public.taxonomy_terms t ON t.id = x.term_id WHERE x.scheme_id = s.id)) AS descriptor
FROM public.furniture_schemes s
JOIN public.taxonomy_terms c ON c.id = s.category_id
LEFT JOIN public.taxonomy_terms col ON col.id = s.color_id
LEFT JOIN public.taxonomy_terms st ON st.id = s.style_id
LEFT JOIN public.taxonomy_terms m ON m.id = s.material_id;

-- Score per combination: Laplace-smoothed share of positive weight.
CREATE MATERIALIZED VIEW public.mv_combination_scores AS
SELECT c.id AS combination_id, c.name, c.member_count,
       coalesce(sum(w.weight) FILTER (WHERE w.weight > 0), 0)  AS positive,
       coalesce(-sum(w.weight) FILTER (WHERE w.weight < 0), 0) AS negative,
       count(DISTINCT sg.user_id)                               AS users,
       round((coalesce(sum(w.weight) FILTER (WHERE w.weight > 0), 0) + 1)
           / (coalesce(sum(abs(w.weight)), 0) + 2), 3)          AS score,
       max(sg.created_at)                                       AS last_signal_at
FROM public.scheme_combinations c
LEFT JOIN public.combination_signals sg ON sg.combination_id = c.id
LEFT JOIN public.signal_weights w ON w.signal = sg.signal
GROUP BY c.id, c.name, c.member_count;
CREATE UNIQUE INDEX mv_combination_scores_id ON public.mv_combination_scores (combination_id);

-- Every pair of schemes inside every combination, with the evidence summed across combinations.
CREATE MATERIALIZED VIEW public.mv_scheme_pair_scores AS
SELECT a.scheme_id AS scheme_a, b.scheme_id AS scheme_b,
       count(DISTINCT a.combination_id)                         AS combinations,
       coalesce(sum(w.weight) FILTER (WHERE w.weight > 0), 0)   AS positive,
       coalesce(-sum(w.weight) FILTER (WHERE w.weight < 0), 0)  AS negative,
       round((coalesce(sum(w.weight) FILTER (WHERE w.weight > 0), 0) + 1)
           / (coalesce(sum(abs(w.weight)), 0) + 2), 3)          AS score
FROM public.scheme_combination_members a
JOIN public.scheme_combination_members b ON b.combination_id = a.combination_id AND a.scheme_id < b.scheme_id
LEFT JOIN public.combination_signals sg ON sg.combination_id = a.combination_id
LEFT JOIN public.signal_weights w ON w.signal = sg.signal
GROUP BY a.scheme_id, b.scheme_id;
CREATE UNIQUE INDEX mv_scheme_pair_scores_key ON public.mv_scheme_pair_scores (scheme_a, scheme_b);

-- Pairs of descriptor terms across different pieces ("walnut + brass", "plum + emerald"): the general lessons.
CREATE MATERIALIZED VIEW public.mv_term_pair_scores AS
WITH scheme_terms AS (
  SELECT s.id AS scheme_id, x.term_id
  FROM public.furniture_schemes s
  CROSS JOIN LATERAL (VALUES (s.color_id), (s.style_id), (s.material_id)) x(term_id)
  WHERE x.term_id IS NOT NULL
  UNION
  SELECT scheme_id, term_id FROM public.furniture_scheme_tags
), combo_terms AS (
  SELECT DISTINCT m.combination_id, m.scheme_id, st.term_id
  FROM public.scheme_combination_members m JOIN scheme_terms st ON st.scheme_id = m.scheme_id
), pairs AS (            -- each term pair counted once per combination
  SELECT DISTINCT a.combination_id, a.term_id AS term_a, b.term_id AS term_b
  FROM combo_terms a
  JOIN combo_terms b ON b.combination_id = a.combination_id AND a.scheme_id <> b.scheme_id AND a.term_id < b.term_id
)
SELECT p.term_a, p.term_b,
       count(DISTINCT p.combination_id)                          AS combinations,
       coalesce(sum(w.weight) FILTER (WHERE w.weight > 0), 0)    AS positive,
       coalesce(-sum(w.weight) FILTER (WHERE w.weight < 0), 0)   AS negative,
       round((coalesce(sum(w.weight) FILTER (WHERE w.weight > 0), 0) + 1)
           / (coalesce(sum(abs(w.weight)), 0) + 2), 3)           AS score
FROM pairs p
LEFT JOIN public.combination_signals sg ON sg.combination_id = p.combination_id
LEFT JOIN public.signal_weights w ON w.signal = sg.signal
GROUP BY p.term_a, p.term_b;
CREATE UNIQUE INDEX mv_term_pair_scores_key ON public.mv_term_pair_scores (term_a, term_b);

CREATE OR REPLACE FUNCTION public.refresh_scheme_scores() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_combination_scores;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_scheme_pair_scores;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_term_pair_scores;
$$;
REVOKE EXECUTE ON FUNCTION public.refresh_scheme_scores() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------
-- 7. Access: catalogue is public, curation is admin/server, signals are per user
-- ---------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['taxonomy_terms','furniture_schemes','furniture_scheme_tags','scheme_combinations',
                           'scheme_combination_members','signal_weights','compatibility_rules','style_definitions',
                           'palettes','palette_colors'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Anyone reads" ON public.%I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "Admins curate" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

ALTER TABLE public.combination_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users add own signals" ON public.combination_signals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND signal IN ('kept_in_design', 'changed_in_design', 'liked', 'disliked'));
CREATE POLICY "Users read own signals" ON public.combination_signals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage signals" ON public.combination_signals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT ON public.combination_signals TO authenticated;
GRANT ALL ON public.combination_signals TO service_role;

ALTER TABLE public.design_scheme_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Design owner reads links" ON public.design_scheme_links FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.generated_designs d WHERE d.id = design_id AND d.user_id = auth.uid()));
GRANT SELECT ON public.design_scheme_links TO authenticated;
GRANT ALL ON public.design_scheme_links TO service_role;

-- Scores are aggregates only — no user data — so they are readable by everyone.
REVOKE ALL ON public.mv_combination_scores, public.mv_scheme_pair_scores, public.mv_term_pair_scores FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.mv_combination_scores, public.mv_scheme_pair_scores, public.mv_term_pair_scores TO anon, authenticated;
GRANT SELECT ON public.v_furniture_schemes TO anon, authenticated;
