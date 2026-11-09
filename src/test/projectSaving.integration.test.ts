// @vitest-environment node
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Opt-in live regression test; use a minted standard-user session, never an admin.
// PROJECT_RLS_SESSION_FILE=... bunx vitest run src/test/projectSaving.integration.test.ts
const sessionFile = process.env.PROJECT_RLS_SESSION_FILE;
describe.skipIf(!sessionFile)("project saving and privacy (live database)", () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const owner = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const anonymous = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  let ownerId = "";
  let projectId: string | undefined;

  beforeAll(async () => {
    if (!sessionFile) throw new Error("A standard-user session file is required");
    const { session } = JSON.parse(readFileSync(sessionFile, "utf8"));
    const { error } = await owner.auth.setSession(session);
    expect(error).toBeNull();
    const { data: { user } } = await owner.auth.getUser();
    if (!user) throw new Error("The session must be signed in");
    ownerId = user.id;
    const roles = await owner.from("user_roles").select("role").eq("user_id", ownerId);
    expect(roles.error).toBeNull();
    expect(roles.data?.some((row) => row.role === "admin")).toBe(false);
  });

  afterAll(async () => {
    if (projectId) {
      const { error } = await owner.from("projects").delete().eq("id", projectId);
      expect(error).toBeNull();
    }
  });

  it("lets a standard owner insert with RETURNING and read the saved project", async () => {
    const { data, error } = await owner.from("projects")
      .insert({ owner_id: ownerId, name: "Project saving regression test", intent: "exploring" })
      .select("id").single();
    projectId = data?.id;
    expect(error).toBeNull();
    expect(projectId).toEqual(expect.any(String));
    const saved = await owner.from("projects").select("owner_id").eq("id", projectId).single();
    expect(saved.error).toBeNull();
    expect(saved.data?.owner_id).toBe(ownerId);
  });

  it("rejects creating a project owned by another user", async () => {
    const result = await owner.from("projects")
      .insert({ owner_id: "00000000-0000-0000-0000-00000000000b", intent: "exploring" })
      .select("id").single();
    expect(result.error?.code).toBe("42501");
    expect(result.data).toBeNull();
  });

  it("does not expose the saved project to signed-out visitors", async () => {
    expect(projectId).toEqual(expect.any(String));
    const result = await anonymous.from("projects").select("id").eq("id", projectId);
    expect(result.data ?? []).toEqual([]);
  });
});