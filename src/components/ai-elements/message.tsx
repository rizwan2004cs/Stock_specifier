"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function MessageResponse({
  children,
  className
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none text-[15px] leading-7 prose-headings:font-semibold prose-a:text-[var(--action-blue)] prose-strong:font-semibold prose-li:my-1",
        className
      )}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
