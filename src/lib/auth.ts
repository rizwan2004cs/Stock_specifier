/**
 * Returns a stable user ID.
 * Authentication is not required — the app works in advice-only mode.
 */
export async function requireUserId(): Promise<string> {
  return "anonymous-user";
}
