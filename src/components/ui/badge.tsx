import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "blue" | "green" | "amber" | "red" | "dark";
}) {
  const tones = {
    neutral: "bg-[#f5f5f7] text-[#333333]",
    blue: "bg-[rgba(0,102,204,0.1)] text-[var(--action-blue)]",
    green: "bg-[rgba(0,128,68,0.1)] text-[#006d3c]",
    amber: "bg-[rgba(180,110,0,0.12)] text-[#8a5300]",
    red: "bg-[rgba(180,35,24,0.1)] text-[#b42318]",
    dark: "bg-[#1d1d1f] text-white"
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full px-3 text-sm leading-none",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
