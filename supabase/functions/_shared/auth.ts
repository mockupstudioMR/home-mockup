import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Caller verification for edge functions.
 *
 * Functions run with the service-role key, so they bypass row-level security.
 * The platform's default JWT check also accepts the public (anon/publishable)
 * key, which means "verify_jwt" alone does NOT prove a user is signed in.
 * Every function that spends AI credits or touches user data must call
 * `requireUser` (or `requireAdmin`) before doing any work.
 */

export type AuthedCaller =
  | { kind: "user"; userId: string; email: string | null }
  | { kind: "service" };

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

const bearer = (req: Request) => {
  const header = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
};

const adminClient = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/**
 * Returns the signed-in caller, or a 401 Response to return immediately.
 * Server-to-server calls that present the service-role key are allowed.
 */
export async function requireUser(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AuthedCaller | Response> {
  const token = bearer(req);
  if (!token) return json({ error: "Please sign in to continue." }, 401, corsHeaders);

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && token === serviceKey) return { kind: "service" };

  try {
    const { data, error } = await adminClient().auth.getUser(token);
    if (error || !data?.user) {
      return json({ error: "Your session has expired. Please sign in again." }, 401, corsHeaders);
    }
    return { kind: "user", userId: data.user.id, email: data.user.email ?? null };
  } catch (e) {
    console.error("[auth] user verification failed", e);
    return json({ error: "Could not verify your session. Please try again." }, 401, corsHeaders);
  }
}

/** True when the caller is the service role or has the admin role. */
export async function isAdmin(caller: AuthedCaller): Promise<boolean> {
  if (caller.kind === "service") return true;
  const { data, error } = await adminClient().rpc("has_role", {
    _user_id: caller.userId,
    _role: "admin",
  });
  return !error && data === true;
}

/** Like requireUser, but only admins (or the service role) get through. */
export async function requireAdmin(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AuthedCaller | Response> {
  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;
  if (!(await isAdmin(caller))) return json({ error: "Admins only." }, 403, corsHeaders);
  return caller;
}

/**
 * Returns a 403/404 Response unless the caller owns the design (admins and the
 * service role may act on any design). Returns null when access is allowed.
 * Needed because these functions write with the service-role key.
 */
export async function forbidUnlessDesignOwner(
  caller: AuthedCaller,
  designId: string | undefined | null,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  if (!designId || caller.kind === "service") return null;
  const { data, error } = await adminClient()
    .from("generated_designs")
    .select("user_id")
    .eq("id", designId)
    .maybeSingle();
  if (error) {
    console.error("[auth] design ownership lookup failed", error);
    return json({ error: "Could not check access to this design." }, 500, corsHeaders);
  }
  if (!data) return json({ error: "Design not found." }, 404, corsHeaders);
  if (data.user_id === caller.userId) return null;
  if (await isAdmin(caller)) return null;
  return json({ error: "You can only change your own designs." }, 403, corsHeaders);
}
