/**
 * Returns the authenticated user ID, or a stable anonymous ID if
 * Clerk is not configured. Authentication is optional — the app works
 * in advice-only mode for anyone.
 */
export async function requireUserId(): Promise<string> {
  if (!process.env.CLERK_SECRET_KEY) {
    return "anonymous-user";
  }

  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return userId ?? "anonymous-user";
  } catch {
    return "anonymous-user";
  }
}
