import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "todo" | "in_progress" | "done" | "low" | "medium" | "high";

const styles: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  todo: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  low: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const labels: Record<BadgeVariant, string> = {
  default: "",
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
  low: "Low",
  medium: "Medium",
  high: "High",
};

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ variant, className, children }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", styles[variant], className)}>
      {children ?? labels[variant]}
    </span>
  );
}
