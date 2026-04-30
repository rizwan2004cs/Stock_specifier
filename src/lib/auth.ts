export async function requireUserId() {
  if (!process.env.CLERK_SECRET_KEY) {
    return "local-dev-user";
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId;
}
