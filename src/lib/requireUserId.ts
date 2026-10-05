/**
 * Returns the signed-in user's id or throws. Use inside queries that only run
 * for signed-in users, so a missing id fails loudly instead of silently
 * querying for "undefined".
 */
export function requireUserId(userId: string | null | undefined): string {
  if (!userId) throw new Error("You need to be signed in to do this.");
  return userId;
}
