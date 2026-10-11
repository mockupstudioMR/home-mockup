# Database tests

SQL checks for the Designing-my-home schema. Each file prints `PASS …` / `FAIL …`
(or the expected error) per check.

| File | Covers |
|---|---|
| `projects_rooms_rls.test.sql` | Projects, rooms, step progress, buying list view, collaborator access |
| `furniture_schemes.test.sql` | Vocabulary, schemes, combinations, signals, scores |
| `shops_sourcing_admin.test.sql` | Shops, step 5.0 shop choice, scan pipeline access, term merge, settings history, audit log |

Run them against a scratch database that has every migration applied (never against production):

```bash
psql "$SCRATCH_DB_URL" -f supabase/tests/projects_rooms_rls.test.sql
psql "$SCRATCH_DB_URL" -f supabase/tests/furniture_schemes.test.sql
psql "$SCRATCH_DB_URL" -f supabase/tests/shops_sourcing_admin.test.sql
```

The files create their own test users and rows, so use a fresh database each time.
