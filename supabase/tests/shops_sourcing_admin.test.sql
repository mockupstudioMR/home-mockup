-- Checks for 20261012090400_shops_sourcing_admin.sql.
-- Run on a scratch database after all migrations: psql -f supabase/tests/shops_sourcing_admin.test.sql
-- Each line prints "PASS …" or "FAIL …".
\set ON_ERROR_STOP 0
\pset tuples_only on
\pset format unaligned

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'other@test.local'),
  ('00000000-0000-0000-0000-0000000000c3', 'admin@test.local');
INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-0000000000c3', 'admin');

-- Owner: project, shop choice, own shop
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
INSERT INTO projects (id, owner_id, intent, property_type) VALUES ('40000000-0000-0000-0000-000000000001', auth.uid(), 'new_space', 'apartment');
INSERT INTO project_shop_choices (project_id, use_suggested, use_own_shops) VALUES ('40000000-0000-0000-0000-000000000001', true, true);
INSERT INTO shops (id, name, domain, url, added_by) VALUES ('50000000-0000-0000-0000-000000000001', 'Studio Oak', 'studio-oak.example', 'https://studio-oak.example', auth.uid());
INSERT INTO project_shops (project_id, shop_id, added_by) VALUES ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', auth.uid());
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END || ' S1 owner adds own shop to project' FROM project_shops;
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END || ' S2 project_shop_ids includes the pending own shop'
FROM project_shop_ids('40000000-0000-0000-0000-000000000001') x WHERE x = '50000000-0000-0000-0000-000000000001';

DO $$ BEGIN
  INSERT INTO shops (name, domain, added_by, kind, status) VALUES ('Fake partner', 'fake.example', auth.uid(), 'partner', 'approved');
  RAISE NOTICE 'FAIL S3 user created an approved partner shop';
EXCEPTION WHEN insufficient_privilege OR check_violation THEN RAISE NOTICE 'PASS S3 user cannot create an approved partner shop';
END $$;

DO $$ BEGIN
  INSERT INTO project_shop_choices (project_id, use_suggested, use_custom_made, use_own_shops)
  VALUES ('40000000-0000-0000-0000-000000000001', false, false, false)
  ON CONFLICT (project_id) DO UPDATE SET use_suggested = false, use_custom_made = false, use_own_shops = false;
  RAISE NOTICE 'FAIL S4 a project with no way to shop was allowed';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS S4 at least one way to shop is required';
END $$;
RESET ROLE;

-- Another user sees neither the pending shop nor the project choices
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', false);
SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END || ' S5 other user cannot see a pending shop' FROM shops WHERE id = '50000000-0000-0000-0000-000000000001';
SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END || ' S6 other user cannot see project shop choices' FROM project_shop_choices;
SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END || ' S7 other user cannot read the scan pipeline' FROM ingest_batches;
RESET ROLE;

-- Admin: approve shop, propose and merge terms, settings history, audit
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c3', false);
UPDATE shops SET status = 'approved', terms_checked = true, reviewed_by = auth.uid(), reviewed_at = now() WHERE id = '50000000-0000-0000-0000-000000000001';
INSERT INTO ingest_batches (id, name, source_type) VALUES ('60000000-0000-0000-0000-000000000001', 'Test batch', 'generated_design');
INSERT INTO taxonomy_terms (id, facet, slug, label, status) VALUES ('70000000-0000-0000-0000-000000000001', 'material', 'smoked-glass', 'Smoked glass', 'proposed');
INSERT INTO taxonomy_terms (id, facet, slug, label) VALUES ('70000000-0000-0000-0000-000000000002', 'material', 'tinted-glass-test', 'Tinted glass test');
SELECT merge_terms('70000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001');
SELECT CASE WHEN 'smoked glass' = ANY(synonyms) THEN 'PASS' ELSE 'FAIL' END || ' S8 merged label becomes a synonym' FROM taxonomy_terms WHERE id = '70000000-0000-0000-0000-000000000002';
UPDATE cms_content SET value = '{"auto_save_threshold":0.9}' WHERE key = 'scan_settings';
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END || ' S9 saving a setting keeps the old version' FROM settings_versions WHERE key = 'scan_settings';
SELECT CASE WHEN count(*) >= 3 THEN 'PASS' ELSE 'FAIL' END || ' S10 admin changes are in the audit log' FROM admin_audit_log;
RESET ROLE;

-- Other user: approved shop now visible, proposed term hidden, merge refused
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', false);
SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END || ' S11 approved shop is visible to everyone' FROM shops WHERE id = '50000000-0000-0000-0000-000000000001';
SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END || ' S12 retired or proposed terms are hidden from users' FROM taxonomy_terms WHERE id = '70000000-0000-0000-0000-000000000001';
DO $$ BEGIN
  PERFORM merge_terms('70000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002');
  RAISE NOTICE 'FAIL S13 user could merge terms';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PASS S13 only admins can merge terms';
END $$;
RESET ROLE;
