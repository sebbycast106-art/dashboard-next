"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-500",
        destructive: "bg-red-700 text-white hover:bg-red-600",
        outline: "border border-gray-600 bg-transparent hover:bg-gray-800 text-gray-200",
        secondary: "bg-gray-700 text-gray-100 hover:bg-gray-600",
        ghost: "hover:bg-gray-800 text-gray-300 hover:text-gray-100",
        link: "text-blue-400 underline-offset-4 hover:underline p-0 h-auto",
        success: "bg-green-700 text-white hover:bg-green-600",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-xs rounded",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
        xs: "h-6 px-2 text-xs rounded",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
