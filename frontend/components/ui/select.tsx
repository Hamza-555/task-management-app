import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full px-4 py-2.5 rounded-xl border bg-input/50 text-foreground",
        "outline-none transition-all duration-200 text-sm cursor-pointer",
        "focus:ring-2 focus:ring-ring focus:border-transparent",
        error
          ? "border-destructive ring-1 ring-destructive"
          : "border-border hover:border-ring/50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
