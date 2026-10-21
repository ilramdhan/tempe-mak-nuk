/**
 * RLS integration tests. Run only when RLS_TEST_DATABASE_URL points at a THROWAWAY database
 * that has had `pnpm db:migrate` applied (see tests/rls/README.md). Every test runs in a
 * transaction that is rolled back; fixtures are created in beforeAll and removed in afterAll.
 */
import { randomUUID } from "node:crypto";

import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.RLS_TEST_DATABASE_URL;

type Tx = postgres.TransactionSql;
type Who = { role: "anon" } | { role: "authenticated"; userId: string };

class Rollback extends Error {}

const DENIED = /row-level security|permission denied/i;

describe.skipIf(!url)("RLS policies", () => {
  let sql: postgres.Sql;
  const ownerId = randomUUID();
  const editorId = randomUUID();
  const strangerId = randomUUID(); // authenticated user without a profile row
  const tag = randomUUID().slice(0, 8);
  const ids = {
    publishedPage: randomUUID(),
    draftPage: randomUUID(),
    activeProduct: randomUUID(),
    inactiveProduct: randomUUID(),
    publishedPost: randomUUID(),
    draftPost: randomUUID(),
    futurePost: randomUUID(),
  };

  /** Run `fn` as the given role with Supabase-style JWT claims, then roll back. */
  async function as<T>(who: Who, fn: (tx: Tx) => Promise<T>): Promise<T> {
    let result: T | undefined;
    let failure: unknown;
    await sql
      .begin(async (tx) => {
        const claims =
          who.role === "anon"
            ? { role: "anon" }
            : { role: "authenticated", sub: who.userId };
        // Modern auth.uid() reads request.jwt.claims; older images read request.jwt.claim.sub.
        await tx`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true),
          set_config('request.jwt.claim.sub', ${who.role === "anon" ? "" : who.userId}, true),
          set_config('request.jwt.claim.role', ${claims.role}, true)`;
        await tx.unsafe(`set local role ${who.role}`);
        try {
          result = await fn(tx);
        } catch (err) {
          failure = err;
        }
        throw new Rollback();
      })
      .catch((err: unknown) => {
        if (!(err instanceof Rollback)) throw err;
      });
    if (failure) throw failure;
    return result as T;
  }

  const anon: Who = { role: "anon" };
  const owner: Who = { role: "authenticated", userId: ownerId };
  const editor: Who = { role: "authenticated", userId: editorId };
  const stranger: Who = { role: "authenticated", userId: strangerId };

  beforeAll(async () => {
    sql = postgres(url!, { max: 1, prepare: false, onnotice: () => {} });
    // auth.users insert fires on_auth_user_created (bootstrap owner only). Profiles are then
    // upserted so the suite does not depend on whether the DB already had an owner.
    await sql`insert into auth.users (id, email) values
      (${ownerId}, ${`owner-${tag}@test.local`}),
      (${editorId}, ${`editor-${tag}@test.local`})`;
    await sql`insert into public.profiles (id, role) values
      (${ownerId}, 'owner'), (${editorId}, 'editor') on conflict (id) do nothing`;
    await sql`update public.profiles set role = 'owner' where id = ${ownerId}`;
    await sql`update public.profiles set role = 'editor' where id = ${editorId}`;

    await sql`insert into public.pages (id, slug, title, status) values
      (${ids.publishedPage}, ${`pub-${tag}`}, 'Published', 'published'),
      (${ids.draftPage}, ${`draft-${tag}`}, 'Draft', 'draft')`;
    await sql`insert into public.page_sections (page_id, type, visible) values
      (${ids.publishedPage}, 'hero', true),
      (${ids.publishedPage}, 'cta', false),
      (${ids.draftPage}, 'hero', true)`;
    await sql`insert into public.products (id, slug, name, variant, is_active) values
      (${ids.activeProduct}, ${`active-${tag}`}, 'Active', 'classic', true),
      (${ids.inactiveProduct}, ${`inactive-${tag}`}, 'Inactive', 'skinless', false)`;
    await sql`insert into public.posts (id, slug, title, status, published_at) values
      (${ids.publishedPost}, ${`post-pub-${tag}`}, 'Pub', 'published', now() - interval '1 day'),
      (${ids.draftPost}, ${`post-draft-${tag}`}, 'Draft', 'draft', null),
      (${ids.futurePost}, ${`post-future-${tag}`}, 'Future', 'scheduled', now() + interval '7 days')`;
    await sql`insert into public.settings (key, value, "group") values
      (${`public.${tag}`}, '"ok"', 'business'),
      (${`private.${tag}`}, '"secret"', 'private')`;
  });

  afterAll(async () => {
    if (!sql) return;
    await sql`delete from public.posts where id in ${sql(Object.values(ids))}`;
    await sql`delete from public.products where id in ${sql(Object.values(ids))}`;
    await sql`delete from public.pages where id in ${sql(Object.values(ids))}`;
    await sql`delete from public.settings where key in (${`public.${tag}`}, ${`private.${tag}`})`;
    await sql`delete from auth.users where id in (${ownerId}, ${editorId})`;
    await sql.end();
  });

  describe("helper functions", () => {
    it("is_admin() / has_role() reflect the JWT subject", async () => {
      const check = (tx: Tx) =>
        tx<{ admin: boolean; owner: boolean }[]>`
          select public.is_admin() as admin, public.has_role('owner') as owner`;
      expect((await as(anon, check))[0]).toEqual({
        admin: false,
        owner: false,
      });
      expect((await as(stranger, check))[0]).toEqual({
        admin: false,
        owner: false,
      });
      expect((await as(editor, check))[0]).toEqual({
        admin: true,
        owner: false,
      });
      expect((await as(owner, check))[0]).toEqual({ admin: true, owner: true });
    });
  });

  describe("anon", () => {
    it("reads only published pages and visible sections of published pages", async () => {
      const pages = await as(
        anon,
        (tx) =>
          tx`select id from public.pages where id in (${ids.publishedPage}, ${ids.draftPage})`,
      );
      expect(pages.map((r) => r.id)).toEqual([ids.publishedPage]);

      const sections = await as(
        anon,
        (tx) =>
          tx`select type from public.page_sections where page_id in (${ids.publishedPage}, ${ids.draftPage})`,
      );
      expect(sections.map((r) => r.type)).toEqual(["hero"]);
    });

    it("cannot read drafts or scheduled-in-future posts", async () => {
      const rows = await as(
        anon,
        (tx) =>
          tx`select id from public.posts where id in ${tx(Object.values(ids))}`,
      );
      expect(rows.map((r) => r.id)).toEqual([ids.publishedPost]);
    });

    it("reads only active products", async () => {
      const rows = await as(
        anon,
        (tx) =>
          tx`select id from public.products where id in (${ids.activeProduct}, ${ids.inactiveProduct})`,
      );
      expect(rows.map((r) => r.id)).toEqual([ids.activeProduct]);
    });

    it("cannot read settings in the private group", async () => {
      const rows = await as(
        anon,
        (tx) =>
          tx`select key from public.settings where key in (${`public.${tag}`}, ${`private.${tag}`})`,
      );
      expect(rows.map((r) => r.key)).toEqual([`public.${tag}`]);
    });

    it("cannot insert, update or delete products", async () => {
      await expect(
        as(
          anon,
          (tx) =>
            tx`insert into public.products (slug, name, variant) values ('x', 'x', 'classic')`,
        ),
      ).rejects.toThrow(DENIED);
      await expect(
        as(
          anon,
          (tx) =>
            tx`update public.products set name = 'hacked' where id = ${ids.activeProduct}`,
        ),
      ).rejects.toThrow(DENIED);
      await expect(
        as(
          anon,
          (tx) =>
            tx`delete from public.products where id = ${ids.activeProduct}`,
        ),
      ).rejects.toThrow(DENIED);
    });

    it("cannot read profiles or audit_log", async () => {
      await expect(
        as(anon, (tx) => tx`select id from public.profiles`),
      ).resolves.toHaveLength(0);
      await expect(
        as(anon, (tx) => tx`select id from public.audit_log`),
      ).resolves.toHaveLength(0);
    });

    it("can insert wa_clicks but not read them, and length checks apply", async () => {
      await expect(
        as(
          anon,
          (tx) =>
            tx`insert into public.wa_clicks (source, variant, kind) values ('/produk', 'a', 'order')`,
        ),
      ).resolves.toBeDefined();
      await expect(
        as(
          anon,
          (tx) =>
            tx`insert into public.wa_clicks (source, kind) values (${"x".repeat(201)}, 'general')`,
        ),
      ).rejects.toThrow(DENIED);
      await expect(
        as(
          anon,
          (tx) =>
            tx`insert into public.wa_clicks (source, kind) values ('', 'general')`,
        ),
      ).rejects.toThrow(DENIED);
      const visible = await as(anon, async (tx) => {
        await tx`insert into public.wa_clicks (source, kind) values ('/', 'general')`;
        return tx`select id from public.wa_clicks`;
      });
      expect(visible).toHaveLength(0);
    });
  });

  describe("authenticated non-admin (no profile row)", () => {
    it("cannot write content or read drafts", async () => {
      await expect(
        as(
          stranger,
          (tx) =>
            tx`insert into public.products (slug, name, variant) values ('y', 'y', 'classic')`,
        ),
      ).rejects.toThrow(DENIED);
      const rows = await as(
        stranger,
        (tx) => tx`select id from public.posts where id = ${ids.draftPost}`,
      );
      expect(rows).toHaveLength(0);
    });
  });

  describe("editor", () => {
    it("can create, update and delete content and read drafts", async () => {
      const result = await as(editor, async (tx) => {
        const [p] = await tx<{ id: string }[]>`
          insert into public.products (slug, name, variant, is_active)
          values (${`editor-${tag}`}, 'By editor', 'classic', false) returning id`;
        await tx`update public.products set name = 'Edited' where id = ${p.id}`;
        const drafts =
          await tx`select id from public.posts where id = ${ids.draftPost}`;
        const deleted =
          await tx`delete from public.products where id = ${p.id} returning id`;
        return { drafts: drafts.length, deleted: deleted.length };
      });
      expect(result).toEqual({ drafts: 1, deleted: 1 });
    });

    it("can read the private settings group and audit_log, but not insert audit_log", async () => {
      const rows = await as(
        editor,
        (tx) =>
          tx`select key from public.settings where key = ${`private.${tag}`}`,
      );
      expect(rows).toHaveLength(1);
      await expect(
        as(editor, (tx) => tx`select id from public.audit_log`),
      ).resolves.toBeDefined();
      await expect(
        as(
          editor,
          (tx) =>
            tx`insert into public.audit_log (action, entity) values ('x', 'y')`,
        ),
      ).rejects.toThrow(DENIED);
    });

    it("cannot change their own role", async () => {
      await expect(
        as(
          editor,
          (tx) =>
            tx`update public.profiles set role = 'owner' where id = ${editorId}`,
        ),
      ).rejects.toThrow(DENIED);
    });

    it("can update their own display name", async () => {
      const rows = await as(
        editor,
        (tx) =>
          tx`update public.profiles set display_name = 'Ed' where id = ${editorId} returning id`,
      );
      expect(rows).toHaveLength(1);
    });

    it("cannot modify other profiles", async () => {
      const rows = await as(
        editor,
        (tx) =>
          tx`update public.profiles set display_name = 'pwned' where id = ${ownerId} returning id`,
      );
      expect(rows).toHaveLength(0);
    });
  });

  describe("owner", () => {
    it("can change other users' roles", async () => {
      const rows = await as(
        owner,
        (tx) =>
          tx`update public.profiles set role = 'owner' where id = ${editorId} returning role`,
      );
      expect(rows).toEqual([{ role: "owner" }]);
    });

    it("sees all profiles", async () => {
      const rows = await as(
        owner,
        (tx) =>
          tx`select id from public.profiles where id in (${ownerId}, ${editorId})`,
      );
      expect(rows).toHaveLength(2);
    });
  });

  describe("auth trigger", () => {
    it("creates NO profile (no admin access) for a new auth user once an owner exists", async () => {
      const id = randomUUID();
      const rows = await sql
        .begin(async (tx) => {
          await tx`insert into auth.users (id, email) values (${id}, ${`new-${tag}@test.local`})`;
          const r =
            await tx`select role, display_name from public.profiles where id = ${id}`;
          throw Object.assign(new Rollback(), { rows: r });
        })
        .catch((err: Rollback & { rows: unknown }) => err.rows);
      expect(rows).toEqual([]);
    });
  });
});
