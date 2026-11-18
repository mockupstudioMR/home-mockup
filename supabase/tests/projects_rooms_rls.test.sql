\set ON_ERROR_STOP 0
\pset tuples_only on
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-00000000000a', 'owner@x.test'), ('00000000-0000-0000-0000-00000000000b', 'electrician@x.test');

-- as owner A
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
INSERT INTO projects (id, owner_id, intent, property_type) VALUES ('10000000-0000-0000-0000-000000000001', auth.uid(), 'new_space', 'apartment');
INSERT INTO rooms (id, user_id, name, room_type, project_id, sequence_no, starting_state)
VALUES ('20000000-0000-0000-0000-000000000001', auth.uid(), 'Living room', 'living-room', '10000000-0000-0000-0000-000000000001', 1, 'core_shell'),
       ('20000000-0000-0000-0000-000000000002', auth.uid(), 'Bedroom', 'bedroom', '10000000-0000-0000-0000-000000000001', 2, 'empty');
SELECT public.apply_scope_defaults('20000000-0000-0000-0000-000000000001');
SELECT 'T1 scope rows for core_shell = 10: ' || count(*) FROM room_scope WHERE room_id = '20000000-0000-0000-0000-000000000001';
INSERT INTO step_progress (project_id, room_id, step_no, status) VALUES ('10000000-0000-0000-0000-000000000001', NULL, 1, 'completed');
INSERT INTO step_progress (project_id, room_id, step_no, status) VALUES ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2, 'completed');
\echo 'T2 expect unique violation (second step-1 row, NULL room):'
INSERT INTO step_progress (project_id, room_id, step_no) VALUES ('10000000-0000-0000-0000-000000000001', NULL, 1);
\echo 'T3 expect check violation (step 1 with a room):'
INSERT INTO step_progress (project_id, room_id, step_no) VALUES ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1);
INSERT INTO room_items (id, room_id, label, item_type, source, action, furniture_spec_id)
SELECT '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Upright piano', 'piano', 'existing_kept', 'keep', id
FROM furniture_specs WHERE name = 'upright piano' AND is_default;
INSERT INTO room_item_sizes (item_id, kind, width_cm, depth_cm, height_cm, status)
SELECT '30000000-0000-0000-0000-000000000001', 'standard', width_cm, depth_cm, height_cm, 'standard' FROM furniture_specs WHERE name='upright piano' AND is_default;
INSERT INTO room_item_sizes (item_id, kind, width_cm, depth_cm, height_cm, status) VALUES ('30000000-0000-0000-0000-000000000001', 'available', 160, 70, NULL, 'measured');
SELECT 'T4 buying list: ' || label || ' std ' || std_w || 'x' || std_d || 'x' || std_h || ' avail ' || avail_w || ' status ' || size_status FROM v_buying_list;
INSERT INTO room_features (room_id, kind, label, wall_id) VALUES ('20000000-0000-0000-0000-000000000001', 'door', 'Door 2', NULL);
SELECT 'T5 unplaced features: ' || count(*) FROM room_features WHERE NOT is_placed;
INSERT INTO project_collaborators (project_id, user_id, role, invite_status) VALUES ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'electrician', 'pending');
RESET ROLE;

-- as outsider B (invite still pending)
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
SELECT 'T6 B sees projects (pending invite) = 0: ' || count(*) FROM projects;
SELECT 'T7 B sees rooms (pending invite) = 0: ' || count(*) FROM rooms;
SELECT 'T8 B sees items (pending invite) = 0: ' || count(*) FROM room_items;
RESET ROLE;
UPDATE project_collaborators SET invite_status = 'accepted';

-- B again, accepted
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
SELECT 'T9 B sees rooms (accepted) = 2: ' || count(*) FROM rooms;
SELECT 'T10 B sees item sizes (accepted) = 2: ' || count(*) FROM room_item_sizes;
\echo 'T11 B tries to edit an item (expect 0 rows updated):'
UPDATE room_items SET label = 'hacked';
\echo 'T12 B tries to add an item (expect RLS violation):'
INSERT INTO room_items (room_id, label, item_type) VALUES ('20000000-0000-0000-0000-000000000001', 'x', 'x');
\echo 'T13 B tries to add a project for A (expect RLS violation):'
INSERT INTO projects (owner_id, intent) VALUES ('00000000-0000-0000-0000-00000000000a', 'exploring');
RESET ROLE;
SELECT 'T14 piano label unchanged: ' || label FROM room_items;
