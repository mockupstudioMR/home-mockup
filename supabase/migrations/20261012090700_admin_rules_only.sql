-- Admin E1 "Only with" rules: a word (e.g. Rattan) that should only be offered with certain styles.
-- Pairs stay stored once (term_a_id < term_b_id); for 'only' the non-style word is the subject.
ALTER TABLE public.compatibility_rules DROP CONSTRAINT IF EXISTS compatibility_rules_verdict_check;
ALTER TABLE public.compatibility_rules ADD CONSTRAINT compatibility_rules_verdict_check CHECK (verdict IN ('works', 'avoid', 'neutral', 'only'));

-- Admin F1: scope defaults can differ per room type ('any' = every room).
ALTER TABLE public.scope_defaults ADD COLUMN IF NOT EXISTS room_type text NOT NULL DEFAULT 'any';
ALTER TABLE public.scope_defaults DROP CONSTRAINT IF EXISTS scope_defaults_pkey;
ALTER TABLE public.scope_defaults ADD PRIMARY KEY (room_type, starting_state, area);

CREATE OR REPLACE FUNCTION public.apply_scope_defaults(_room_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  INSERT INTO room_scope (room_id, area, mode)
  SELECT DISTINCT ON (d.area) r.id, d.area, d.mode
  FROM rooms r JOIN scope_defaults d ON d.starting_state = r.starting_state
   AND d.room_type IN ('any', r.room_type, replace(r.room_type, '_', '-'))
  WHERE r.id = _room_id
  ORDER BY d.area, (d.room_type = 'any')
  ON CONFLICT (room_id, area) DO UPDATE SET mode = EXCLUDED.mode;
$$;
