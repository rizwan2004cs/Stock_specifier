import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-normal transition-transform disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--action-blue)] px-[22px] py-[11px] text-white hover:bg-[#0071e3]",
        secondary:
          "border border-[var(--action-blue)] bg-transparent px-[22px] py-[11px] text-[var(--action-blue)]",
        ghost:
          "bg-transparent px-3 py-2 text-[var(--action-blue)] hover:text-[#0071e3]",
        utility:
          "rounded-lg bg-[var(--ink)] px-[15px] py-2 text-sm text-white",
        pearl:
          "rounded-[11px] border-[3px] border-[#f0f0f0] bg-[var(--pearl)] px-4 py-2 text-sm text-[#333333]"
      },
      size: {
        default: "h-11",
        sm: "h-9 text-sm",
        icon: "h-11 w-11 rounded-full p-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
