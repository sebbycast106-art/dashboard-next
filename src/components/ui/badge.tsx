import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-blue-700 text-blue-100",
        secondary:   "border-transparent bg-gray-700 text-gray-300",
        destructive: "border-transparent bg-red-800 text-red-100",
        outline:     "border-gray-600 text-gray-400",
        success:     "border-transparent bg-green-800 text-green-100",
        warning:     "border-transparent bg-yellow-800 text-yellow-100",
        purple:      "border-transparent bg-purple-800 text-purple-100",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
