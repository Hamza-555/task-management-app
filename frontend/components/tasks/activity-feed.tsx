"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { activityApi, type ActivityLog } from "@/lib/api/activity";
import { activityKey } from "@/lib/hooks/use-tasks";

const ACTION_LABELS: Record<ActivityLog["action"], string> = {
  "task.created": "created",
  "task.updated": "updated",
  "task.deleted": "deleted",
};

const ACTION_COLORS: Record<ActivityLog["action"], string> = {
  "task.created": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "task.updated": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "task.deleted": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

export function ActivityFeed({ limit = 15 }: { limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: activityKey,
    queryFn: () => activityApi.list(limit).then((r) => r.data.logs),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" style={{ opacity: 1 - i * 0.18 }} />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">No activity yet.</p>
      ) : (
        <ul className="space-y-1">
          <AnimatePresence initial={false} mode="popLayout">
            {data.map((log) => (
              <motion.li
                key={log.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="flex items-start gap-2.5 py-2 border-b border-border/50 last:border-0"
              >
                <span className={`mt-0.5 shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${ACTION_COLORS[log.action]}`}>
                  {ACTION_LABELS[log.action]}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-foreground truncate">
                    {log.task_title ?? (log.meta?.title as string) ?? "a task"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(log.created_at)}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
