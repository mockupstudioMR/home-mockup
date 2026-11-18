/**
 * Loosely-typed database access for screens whose tables are defined in migrations
 * that are not applied to this backend yet (admin scan/review/schemes, project data).
 * Queries against missing tables fail at runtime and callers fall back gracefully.
 */
import { supabase as typed } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = typed as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Rows may carry columns from unapplied migrations, so keep them open.
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export type Tables<T extends string> = Record<string, any>;
export type { Json };
