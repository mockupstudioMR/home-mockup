\set ON_ERROR_STOP 0
\pset tuples_only on
\echo 'S1 a colour in the material slot (expect FK violation):'
INSERT INTO furniture_schemes (category_id, material_id) VALUES (term('category','sofa'), term('color','plum'));
\echo 'S2 same descriptor twice (expect unique violation):'
INSERT INTO furniture_schemes (category_id, color_id, style_id, material_id)
VALUES (term('category','console'), term('color','dark-walnut'), term('style','eclectic-modern'), term('material','walnut'));
INSERT INTO furniture_schemes (category_id, color_id, style_id, material_id)
VALUES (term('category','console'), term('color','dark-walnut'), term('style','eclectic-modern'), term('material','walnut'));
\echo 'S2b ...but the tagged console (fluted) is a different scheme, so the plain one above was allowed once.'
\echo 'S3 combination with one scheme (expect: needs at least 2):'
BEGIN;
INSERT INTO scheme_combinations (id, name) VALUES ('40000000-0000-0000-0000-000000000001', 'Too small');
INSERT INTO scheme_combination_members (combination_id, scheme_id) SELECT '40000000-0000-0000-0000-000000000001', id FROM furniture_schemes LIMIT 1;
COMMIT;
\echo 'S4 same member set twice in a room type (expect unique violation):'
BEGIN;
INSERT INTO scheme_combinations (id, name, room_type_id) VALUES ('40000000-0000-0000-0000-000000000002', 'Dup', term('room_type','living-room'));
INSERT INTO scheme_combination_members (combination_id, scheme_id)
SELECT '40000000-0000-0000-0000-000000000002', scheme_id FROM scheme_combination_members m JOIN scheme_combinations c ON c.id = m.combination_id WHERE c.name = 'Sofa + walnut table';
COMMIT;
\echo 'S5 child term under a parent of another facet (expect exception):'
INSERT INTO taxonomy_terms (facet, slug, label, parent_id) VALUES ('color', 'odd', 'Odd', term('material','wood'));
SELECT 'S6 resolve "Emerald Green" -> ' || label FROM taxonomy_terms WHERE id = resolve_term('color', 'Emerald Green');
SELECT 'S7 resolve "rattan" -> ' || label FROM taxonomy_terms WHERE id = resolve_term('material', 'rattan');
SELECT 'S8 resolve "Dark Walnut" -> ' || label FROM taxonomy_terms WHERE id = resolve_term('color', 'Dark Walnut');

-- user signals
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
INSERT INTO combination_signals (combination_id, signal, user_id) SELECT id, 'liked', auth.uid() FROM scheme_combinations WHERE name = 'Sofa + walnut table';
SELECT 'S9 user can add a like: ' || count(*) FROM combination_signals WHERE user_id = auth.uid();
\echo 'S10 user tries to fake "bought_together" (expect RLS violation):'
INSERT INTO combination_signals (combination_id, signal, user_id) SELECT id, 'bought_together', auth.uid() FROM scheme_combinations WHERE name = 'Sofa + walnut table';
\echo 'S11 user tries to add a scheme (expect RLS violation):'
INSERT INTO furniture_schemes (category_id) VALUES (term('category','rug'));
SELECT 'S12 user can read scores: ' || count(*) FROM mv_combination_scores;
\echo 'S13 user tries to refresh scores (expect permission denied):'
SELECT refresh_scheme_scores();
RESET ROLE;
SELECT refresh_scheme_scores();
SELECT 'S14 after the like, Sofa + walnut table score: ' || score FROM mv_combination_scores WHERE name = 'Sofa + walnut table';
SELECT 'S15 schemes linked to the size DB: ' || count(*) FROM furniture_specs WHERE category_term_id IS NOT NULL;
