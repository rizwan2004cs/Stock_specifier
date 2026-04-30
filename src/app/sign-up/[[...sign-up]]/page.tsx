import { SignUp } from "@clerk/nextjs";

export default function Page() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--parchment)] p-6">
        <div className="rounded-[18px] border border-[var(--hairline)] bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold">Local mode</h1>
          <p className="mt-3 text-sm text-[#7a7a7a]">
            Add Clerk keys to enable sign up.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--parchment)] p-6">
      <SignUp />
    </main>
  );
}
