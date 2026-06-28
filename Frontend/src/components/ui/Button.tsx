import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden rounded-premium font-bold transition-all duration-[220ms] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 before:absolute before:inset-0 before:translate-y-full before:bg-white/10 before:transition-transform before:duration-[220ms] hover:before:translate-y-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-soft hover:bg-secondary",
        secondary: "bg-background text-primary hover:bg-soft-accent/25",
        outline: "border border-border bg-surface text-primary hover:border-accent hover:bg-accent/5",
        ghost: "bg-transparent text-primary hover:bg-accent/8",
        danger: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-12 px-5 text-sm",
        lg: "h-14 px-6 text-base",
        xl: "h-16 px-7 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = "primary",
  size,
  loading, 
  className,
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {loading ? (
        <div className="relative z-10 flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Please wait...</span>
        </div>
      ) : (
        <span className="relative z-10 inline-flex items-center justify-center">{children}</span>
      )}
    </button>
  );
};
