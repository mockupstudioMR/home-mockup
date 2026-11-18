-- Checks for 20261012090500_scan_pipeline_functions.sql. Run on a fresh scratch database
-- with every migration applied. Prints "PASS …" / "FAIL …".
\set ON_ERROR_STOP 0
\pset tuples_only on
\pset format unaligned

INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000e1', 'scan-admin@test.local'),
                                          ('00000000-0000-0000-0000-0000000000e2', 'scan-user@test.local');
INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-0000000000e1', 'admin');

SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);

INSERT INTO ingest_batches (id, name, source_type, room_type_id, style_hint_id, created_by)
VALUES ('80000000-0000-0000-0000-000000000001', 'Living rooms test', 'generated_design',
        term('room_type', 'living-room'), term('style', 'eclectic-modern'), auth.uid());
INSERT INTO ingest_items (id, batch_id, status) VALUES ('81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'done');

-- Two sure pieces and one with a new word
INSERT INTO detected_pieces (id, item_id, category_id, color_id, style_id, material_id, tag_ids, confidence, status) VALUES
 ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', term('category','curved-sofa'), term('color','plum'),
  term('style','eclectic-modern'), term('material','velvet'), ARRAY[term('shape','curved')], 0.93, 'waiting'),
 ('82000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000001', term('category','lounge-chair'), term('color','emerald'),
  term('style','mid-century-modern'), term('material','leather'), '{}', 0.91, 'waiting');
INSERT INTO detected_pieces (id, item_id, category_id, color_id, confidence, review_reason, status) VALUES
 ('82000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000001', term('category','pendant'), term('color','brass-gold'),
  0.88, 'new_word', 'waiting');
UPDATE detected_pieces SET material_id = propose_term('material', 'Smoked glass test', id) WHERE id = '82000000-0000-0000-0000-000000000003';

SELECT CASE WHEN resolve_term('material', 'smoked glass test') IS NULL THEN 'PASS' ELSE 'FAIL' END || ' P1 a proposed word does not resolve yet';

SELECT save_detected_piece('82000000-0000-0000-0000-000000000001') IS NOT NULL;
SELECT save_detected_piece('82000000-0000-0000-0000-000000000002') IS NOT NULL;
SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END || ' P2 no combination while a piece still waits'
FROM scheme_combinations WHERE ingest_batch_id = '80000000-0000-0000-0000-000000000001';

DO $$ BEGIN
  PERFORM save_detected_piece('82000000-0000-0000-0000-000000000003');
  RAISE NOTICE 'FAIL P3 a piece with an unaccepted word was saved';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PASS P3 a piece with an unaccepted word cannot be saved';
END $$;

UPDATE taxonomy_terms SET status = 'active' WHERE slug = 'smoked-glass-test';
SELECT save_detected_piece('82000000-0000-0000-0000-000000000003', true) IS NOT NULL;
SELECT CASE WHEN member_count = 3 THEN 'PASS' ELSE 'FAIL' END || ' P4 combination saved with all three pieces once nothing waits'
FROM scheme_combinations WHERE ingest_batch_id = '80000000-0000-0000-0000-000000000001';
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END || ' P5 one curated signal for the design'
FROM combination_signals s JOIN scheme_combinations c ON c.id = s.combination_id
WHERE c.ingest_batch_id = '80000000-0000-0000-0000-000000000001' AND s.signal = 'curated';
SELECT CASE WHEN found_count = 3 AND saved_count = 3 AND waiting_count = 0 AND status = 'done' THEN 'PASS' ELSE 'FAIL' END
       || ' P6 batch counts and status are kept up to date'
FROM ingest_batches WHERE id = '80000000-0000-0000-0000-000000000001';

-- Same sofa in a second design matches the existing scheme instead of duplicating it
INSERT INTO ingest_items (id, batch_id, status) VALUES ('81000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', 'done');
INSERT INTO detected_pieces (id, item_id, category_id, color_id, style_id, material_id, tag_ids, confidence, status) VALUES
 ('82000000-0000-0000-0000-000000000004', '81000000-0000-0000-0000-000000000002', term('category','curved-sofa'), term('color','plum'),
  term('style','eclectic-modern'), term('material','velvet'), ARRAY[term('shape','curved')], 0.95, 'waiting');
SELECT CASE WHEN save_detected_piece('82000000-0000-0000-0000-000000000004') = (SELECT scheme_id FROM detected_pieces WHERE id = '82000000-0000-0000-0000-000000000001')
            THEN 'PASS' ELSE 'FAIL' END || ' P7 the same descriptor matches the existing scheme';

SELECT undo_ingest_batch('80000000-0000-0000-0000-000000000001');
SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END || ' P8 undo removes the batch combination'
FROM scheme_combinations WHERE ingest_batch_id = '80000000-0000-0000-0000-000000000001';
SELECT CASE WHEN status = 'undone' THEN 'PASS' ELSE 'FAIL' END || ' P9 undone batch is marked' FROM ingest_batches WHERE id = '80000000-0000-0000-0000-000000000001';
RESET ROLE;

SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', false);
DO $$ BEGIN
  PERFORM save_detected_piece('82000000-0000-0000-0000-000000000001');
  RAISE NOTICE 'FAIL P10 a user could save a detected piece';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PASS P10 only admins save detected pieces';
END $$;
RESET ROLE;
