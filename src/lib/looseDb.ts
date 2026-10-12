/**
 * Loosely-typed database access for screens whose tables are defined in migrations
 * that are not applied to this backend yet (admin scan/review/schemes, project data).
 * Queries against missing tables fail at runtime and callers fall back gracefully.
 */
import { supabase as typed } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = typed as any;

type Known = Database["public"]["Tables"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tables<T extends string> = T extends keyof Known ? Known[T]["Row"] : Record<string, any>;
export type { Json };
