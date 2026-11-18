-- =====================================================================
-- Scan pipeline functions: save a detected piece as a scheme, build the
-- combination for a scanned design, keep batch counts, and only resolve
-- words to active terms.
-- =====================================================================

-- Proposed and retired terms never resolve; only active ones do.
CREATE OR REPLACE FUNCTION public.resolve_term(_facet public.term_facet, _text text)
RETURNS uuid LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT id FROM taxonomy_terms
  WHERE facet = _facet AND is_active AND status = 'active'
    AND (slug = regexp_replace(lower(trim(_text)), '[^a-z0-9]+', '-', 'g')
         OR lower(label) = lower(trim(_text))
         OR lower(trim(_text)) = ANY (synonyms))
  ORDER BY (slug = regexp_replace(lower(trim(_text)), '[^a-z0-9]+', '-', 'g')) DESC
  LIMIT 1;
$$;

-- A word the AI used that is not a term yet: reuse the proposed term or create one.
CREATE OR REPLACE FUNCTION public.propose_term(_facet public.term_facet, _text text, _piece uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _slug text := trim(both '-' from regexp_replace(lower(trim(_text)), '[^a-z0-9]+', '-', 'g')); _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'admins only';
  END IF;
  IF _slug = '' THEN RETURN NULL; END IF;
  SELECT id INTO _id FROM taxonomy_terms WHERE facet = _facet AND slug = _slug;
  IF _id IS NULL THEN
    INSERT INTO taxonomy_terms (facet, slug, label, status, proposed_from)
    VALUES (_facet, _slug, initcap(trim(_text)), 'proposed', _piece)
    RETURNING id INTO _id;
  END IF;
  RETURN _id;
END $$;

-- Save one detected piece: match the scheme with the same descriptor, or create it.
CREATE OR REPLACE FUNCTION public.save_detected_piece(_piece uuid, _confirmed boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p detected_pieces; _sig text; _scheme uuid; _batch uuid; _actor uuid := auth.uid();
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'admins only';
  END IF;
  SELECT * INTO p FROM detected_pieces WHERE id = _piece FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'piece not found'; END IF;
  IF p.category_id IS NULL THEN RAISE EXCEPTION 'a piece needs a category before it can be saved'; END IF;
  IF EXISTS (SELECT 1 FROM taxonomy_terms t
             WHERE t.id IN (p.category_id, p.color_id, p.style_id, p.material_id) AND t.status <> 'active')
     OR EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.id = ANY (p.tag_ids) AND t.status <> 'active') THEN
    RAISE EXCEPTION 'accept, map or reject the new words before saving';
  END IF;

  _sig := coalesce((SELECT string_agg(t.facet || ':' || t.slug, ',' ORDER BY t.facet, t.slug)
                    FROM taxonomy_terms t WHERE t.id = ANY (p.tag_ids)), '');
  SELECT id INTO _scheme FROM furniture_schemes
  WHERE category_id = p.category_id
    AND color_id IS NOT DISTINCT FROM p.color_id AND style_id IS NOT DISTINCT FROM p.style_id
    AND material_id IS NOT DISTINCT FROM p.material_id AND tag_signature = _sig;

  IF _scheme IS NULL THEN
    INSERT INTO furniture_schemes (category_id, color_id, style_id, material_id, tag_signature, source, created_by)
    VALUES (p.category_id, p.color_id, p.style_id, p.material_id, _sig,
            CASE WHEN _confirmed THEN 'curated' ELSE 'ai_extracted' END, _actor)
    RETURNING id INTO _scheme;
    INSERT INTO furniture_scheme_tags (scheme_id, term_id) SELECT _scheme, unnest(p.tag_ids) ON CONFLICT DO NOTHING;
  ELSIF _confirmed THEN
    UPDATE furniture_schemes SET source = 'curated' WHERE id = _scheme AND source = 'ai_extracted';
  END IF;

  UPDATE detected_pieces
     SET scheme_id = _scheme,
         status = CASE WHEN _confirmed THEN 'confirmed' ELSE 'saved' END,
         review_reason = CASE WHEN _confirmed THEN NULL ELSE review_reason END,
         reviewed_by = CASE WHEN _confirmed THEN _actor ELSE reviewed_by END,
         reviewed_at = CASE WHEN _confirmed THEN now() ELSE reviewed_at END
   WHERE id = _piece;

  SELECT i.batch_id INTO _batch FROM ingest_items i WHERE i.id = p.item_id;
  PERFORM public.save_ingest_combination(p.item_id);
  PERFORM public.refresh_ingest_batch(_batch);
  RETURN _scheme;
END $$;

-- Once no piece of a scanned design is waiting, save its pieces as one combination.
CREATE OR REPLACE FUNCTION public.save_ingest_combination(_item uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _schemes uuid[]; _sig text; _comb uuid; b ingest_batches; _style uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'admins only';
  END IF;
  IF EXISTS (SELECT 1 FROM detected_pieces WHERE item_id = _item AND status = 'waiting') THEN RETURN NULL; END IF;
  SELECT array_agg(DISTINCT scheme_id ORDER BY scheme_id) INTO _schemes
  FROM detected_pieces WHERE item_id = _item AND scheme_id IS NOT NULL AND status IN ('saved', 'confirmed', 'merged');
  IF coalesce(array_length(_schemes, 1), 0) < 2 THEN RETURN NULL; END IF;

  SELECT b2.* INTO b FROM ingest_batches b2 JOIN ingest_items i ON i.batch_id = b2.id WHERE i.id = _item;
  SELECT coalesce(i.detected_style_id, b.style_hint_id) INTO _style FROM ingest_items i WHERE i.id = _item;
  _sig := array_to_string(_schemes, ',');
  SELECT id INTO _comb FROM scheme_combinations
  WHERE member_signature = _sig AND room_type_id IS NOT DISTINCT FROM b.room_type_id;

  IF _comb IS NULL THEN
    INSERT INTO scheme_combinations (name, room_type_id, style_id, source, created_by, ingest_batch_id)
    VALUES (b.name, b.room_type_id, _style, 'curated', b.created_by, b.id) RETURNING id INTO _comb;
    INSERT INTO scheme_combination_members (combination_id, scheme_id) SELECT _comb, unnest(_schemes);
  END IF;

  -- One curated signal per scanned design.
  IF NOT EXISTS (SELECT 1 FROM combination_signals WHERE combination_id = _comb AND signal = 'curated'
                 AND note = 'ingest_item:' || _item::text) THEN
    INSERT INTO combination_signals (combination_id, signal, note) VALUES (_comb, 'curated', 'ingest_item:' || _item::text);
  END IF;
  RETURN _comb;
END $$;

-- Keep a batch's counts and status in step with its items and pieces.
CREATE OR REPLACE FUNCTION public.refresh_ingest_batch(_batch uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _queued int; _failed int; _found int; _saved int; _waiting int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'admins only';
  END IF;
  SELECT count(*) FILTER (WHERE status IN ('queued', 'detecting')), count(*) FILTER (WHERE status = 'failed')
    INTO _queued, _failed FROM ingest_items WHERE batch_id = _batch;
  SELECT count(*), count(*) FILTER (WHERE p.status IN ('saved', 'confirmed', 'merged')), count(*) FILTER (WHERE p.status = 'waiting')
    INTO _found, _saved, _waiting
    FROM detected_pieces p JOIN ingest_items i ON i.id = p.item_id WHERE i.batch_id = _batch;
  UPDATE ingest_batches SET
    found_count = _found, saved_count = _saved, waiting_count = _waiting, failed_count = _failed,
    status = CASE WHEN status = 'undone' THEN 'undone'
                  WHEN _queued > 0 THEN 'detecting'
                  WHEN _waiting > 0 THEN 'needs_review'
                  WHEN _found = 0 AND _failed > 0 THEN 'failed'
                  ELSE 'done' END,
    finished_at = CASE WHEN _queued = 0 THEN coalesce(finished_at, now()) ELSE NULL END
  WHERE id = _batch;
END $$;

-- Undo a batch: remove the combinations it created and the AI-saved schemes nothing else uses.
CREATE OR REPLACE FUNCTION public.undo_ingest_batch(_batch uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admins only'; END IF;
  DELETE FROM combination_signals s USING ingest_items i
   WHERE i.batch_id = _batch AND s.note = 'ingest_item:' || i.id::text;
  DELETE FROM scheme_combinations c WHERE c.ingest_batch_id = _batch
    AND NOT EXISTS (SELECT 1 FROM combination_signals s WHERE s.combination_id = c.id);
  DELETE FROM furniture_schemes s
   WHERE s.source = 'ai_extracted'
     AND s.id IN (SELECT p.scheme_id FROM detected_pieces p JOIN ingest_items i ON i.id = p.item_id WHERE i.batch_id = _batch)
     AND NOT EXISTS (SELECT 1 FROM detected_pieces p2 JOIN ingest_items i2 ON i2.id = p2.item_id
                     WHERE p2.scheme_id = s.id AND i2.batch_id <> _batch)
     AND NOT EXISTS (SELECT 1 FROM scheme_combination_members m WHERE m.scheme_id = s.id)
     AND NOT EXISTS (SELECT 1 FROM product_scheme_links l WHERE l.scheme_id = s.id)
     AND NOT EXISTS (SELECT 1 FROM room_items r WHERE r.scheme_id = s.id);
  UPDATE detected_pieces p SET status = 'dropped', scheme_id = NULL
    FROM ingest_items i WHERE i.id = p.item_id AND i.batch_id = _batch;
  UPDATE ingest_batches SET status = 'undone' WHERE id = _batch;
  INSERT INTO admin_audit_log (actor_id, table_name, row_id, action) VALUES (auth.uid(), 'ingest_batches', _batch::text, 'undo');
END $$;

REVOKE EXECUTE ON FUNCTION public.propose_term(public.term_facet, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_detected_piece(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_ingest_combination(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_ingest_batch(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.undo_ingest_batch(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_ingest_combination(uuid), public.refresh_ingest_batch(uuid) TO service_role;

-- Admins can find users by email (Users & invites, Projects support).
CREATE POLICY "Admins read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Editable prompt for the scan pipeline (detect-schemes edge function).
INSERT INTO public.prompt_templates (template_key, template_label, template, description)
VALUES ('detect_schemes', 'Detect furniture schemes', $prompt$You are cataloguing furniture in an interior design image for a design library.
List every piece of furniture, lighting, rug and large decor item that is clearly visible. Do not list walls, floors, ceilings or anything you cannot see.
For each piece give:
- category: what it is (e.g. "curved sofa", "lounge chair", "pendant", "rug")
- color: its main colour
- style: its design style
- material: its main material
- tags: up to 3 short extra words about finish, shape or pattern (e.g. "fluted", "brushed", "tufted")
- confidence: 0 to 1, how sure you are about the whole description
- box: where it is, as fractions of the image: {"x": left, "y": top, "w": width, "h": height}
Prefer these words when they fit:
{{VOCABULARY}}
Also give the overall style of the room.
Answer with JSON only: {"style": "...", "pieces": [{"category": "...", "color": "...", "style": "...", "material": "...", "tags": ["..."], "confidence": 0.9, "box": {"x": 0.1, "y": 0.5, "w": 0.3, "h": 0.4}}]}$prompt$,
        'Admin Scan & upload: finds furniture pieces in a design image. {{VOCABULARY}} is replaced with the active terms.')
ON CONFLICT (template_key) DO NOTHING;

-- Admins refresh combination scores from the Schemes & combinations screen.
CREATE OR REPLACE FUNCTION public.admin_refresh_scores()
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admins only'; END IF;
  PERFORM public.refresh_scheme_scores();
  RETURN now();
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_refresh_scores() FROM PUBLIC, anon;
