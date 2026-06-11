import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-2.5 rounded-xl border bg-input/50 text-foreground placeholder:text-muted-foreground",
        "outline-none transition-all duration-200 text-sm",
        "focus:ring-2 focus:ring-ring focus:border-transparent",
        error
          ? "border-destructive ring-1 ring-destructive"
          : "border-border hover:border-ring/50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
