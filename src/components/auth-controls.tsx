"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!hasClerk) {
    return (
      <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm text-[#333333]">
        <ShieldCheck className="size-4 text-[var(--action-blue)]" />
        Local mode
      </span>
    );
  }

  return <ClerkAuthControls />;
}

function ClerkAuthControls() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <span className="h-11 w-24 rounded-full bg-white/20" />;
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="utility">Sign in</Button>
      </SignInButton>
    );
  }

  return (
    <div className="flex h-11 items-center rounded-full bg-white px-2">
      <UserButton />
    </div>
  );
}
