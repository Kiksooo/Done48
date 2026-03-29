import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900",
        secondary:
          "border-transparent bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
        outline: "border-neutral-300 text-neutral-800 dark:border-neutral-700 dark:text-neutral-200",
        success: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
        warning: "border-transparent bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100",
        danger: "border-transparent bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
