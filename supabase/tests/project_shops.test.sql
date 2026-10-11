-- Checks for 20261012090600_project_shop_functions.sql (step 5.0 own shops).
-- Run on a fresh scratch database with every migration applied. Prints PASS / FAIL.
\set ON_ERROR_STOP 0
\pset tuples_only on
\pset format unaligned

INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-0000000000f1', 'shop-a@test.local'),
                                          ('00000000-0000-0000-0000-0000000000f2', 'shop-b@test.local');

SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f1', false);
INSERT INTO projects (id, owner_id, intent) VALUES ('90000000-0000-0000-0000-000000000001', auth.uid(), 'exploring');
SELECT CASE WHEN domain = 'studio-oak.example' AND status = 'pending' THEN 'PASS' ELSE 'FAIL' END || ' O1 a pasted link becomes a pending shop'
FROM add_project_shop('90000000-0000-0000-0000-000000000001', 'https://www.Studio-Oak.example/sofas?x=1');
RESET ROLE;

SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f2', false);
INSERT INTO projects (id, owner_id, intent) VALUES ('90000000-0000-0000-0000-000000000002', auth.uid(), 'exploring');
SELECT CASE WHEN domain = 'studio-oak.example' THEN 'PASS' ELSE 'FAIL' END || ' O2 the same shop added by another user is reused'
FROM add_project_shop('90000000-0000-0000-0000-000000000002', 'studio-oak.example');
DO $$ BEGIN
  PERFORM add_project_shop('90000000-0000-0000-0000-000000000002', 'not a link');
  RAISE NOTICE 'FAIL O3 a non-link was accepted';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PASS O3 a non-link is refused';
END $$;
DO $$ BEGIN
  PERFORM add_project_shop('90000000-0000-0000-0000-000000000001', 'other.example');
  RAISE NOTICE 'FAIL O4 a user added a shop to someone else''s project';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PASS O4 only the project owner adds shops';
END $$;
RESET ROLE;

SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END || ' O5 one shop row for one domain' FROM shops WHERE domain = 'studio-oak.example';
SELECT CASE WHEN can_read_shop((SELECT id FROM shops WHERE domain = 'studio-oak.example'), '00000000-0000-0000-0000-0000000000f2')
            THEN 'PASS' ELSE 'FAIL' END || ' O6 a project owner may read a shop they added';
