"use client";

import { ShieldCheck } from "lucide-react";

export function AuthControls() {
  return (
    <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm text-[#333333]">
      <ShieldCheck className="size-4 text-[var(--action-blue)]" />
      Advice only
    </span>
  );
}
