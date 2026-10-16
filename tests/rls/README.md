# RLS tests

`tests/rls/rls.test.ts` checks the Row-Level Security policies in `./drizzle` against a real
Postgres database: anon vs. a signed-in user with no profile vs. editor vs. owner. It is
**skipped** unless `RLS_TEST_DATABASE_URL` is set, so `pnpm test` stays DB-free.

> Use a **throwaway** database. The suite inserts fixtures into `auth.users` and public
> tables, then removes them, but never point it at production.

The connecting user must be able to `SET ROLE anon/authenticated` and bypass RLS for fixture
setup. `postgres` on the Supabase image (BYPASSRLS) and a vanilla superuser both work.

## Option A: Supabase Postgres image (closest to production)

```bash
docker run -d --rm --name tmn-rls -e POSTGRES_PASSWORD=postgres -p 54329:5432 \
  public.ecr.aws/supabase/postgres:15.19.0.002
# wait ~15 s for init (auth schema, anon/authenticated roles are built in)
DIRECT_URL=postgres://postgres:postgres@localhost:54329/postgres pnpm db:migrate
RLS_TEST_DATABASE_URL=postgres://postgres:postgres@localhost:54329/postgres pnpm vitest run tests/rls
docker stop tmn-rls
```

`supabase start` (Supabase CLI) works too: use its DB URL (port 54322).

## Option B: plain Postgres + stubs

```bash
docker run -d --rm --name tmn-rls -e POSTGRES_PASSWORD=postgres -p 54330:5432 postgres:16-alpine
docker exec -i tmn-rls psql -U postgres -v ON_ERROR_STOP=1 < tests/rls/auth-stub.sql
DIRECT_URL=postgres://postgres:postgres@localhost:54330/postgres pnpm db:migrate
RLS_TEST_DATABASE_URL=postgres://postgres:postgres@localhost:54330/postgres pnpm vitest run tests/rls
docker stop tmn-rls
```

`auth-stub.sql` creates the `anon`/`authenticated`/`service_role` roles, an `auth.users` table
and `auth.uid()`. Never run it against Supabase.

## How identities are simulated

Each test runs in its own transaction, which is rolled back afterwards:

```sql
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"<uuid>"}', true);
set local role authenticated;   -- or anon
```

`request.jwt.claim.sub` is also set, for older `auth.uid()` implementations.
