"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useTasks } from "@/lib/hooks/use-tasks";
import type { Task } from "@/lib/api/tasks";

const START_HOUR = 6;   // 6 AM
const END_HOUR = 23;    // 11 PM
const SLOT_H = 80;      // px per hour

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

const PRIORITY_PILL: Record<Task["priority"], string> = {
  high:   "bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400",
  medium: "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  low:    "bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-400",
};

function parseHour(t: string): number {
  return parseInt(t.split(":")[0], 10);
}
function parseMinute(t: string): number {
  return parseInt(t.split(":")[1], 10);
}
function timeToTop(t: string): number {
  const h = parseHour(t) - START_HOUR;
  const m = parseMinute(t);
  return h * SLOT_H + (m / 60) * SLOT_H;
}

export function DailyTimeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const nowHour = now.getHours();
  const nowMin = now.getMinutes();

  const { data, isLoading } = useTasks({ due_today: true, page_size: 100 });

  // separate tasks with / without a time
  const timed: Task[] = [];
  const untimed: Task[] = [];
  for (const t of data?.tasks ?? []) {
    if (t.due_time) timed.push(t);
    else untimed.push(t);
  }

  // now-line position
  const nowTop =
    nowHour >= START_HOUR && nowHour <= END_HOUR
      ? (nowHour - START_HOUR) * SLOT_H + (nowMin / 60) * SLOT_H
      : -1;

  // auto-scroll to current hour on mount
  useEffect(() => {
    if (!scrollRef.current || nowHour < START_HOUR) return;
    const target = (nowHour - START_HOUR) * SLOT_H - 60;
    scrollRef.current.scrollTop = Math.max(0, target);
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full">
      {/* header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-semibold text-foreground text-sm">
            {format(now, "EEEE, MMMM d")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {timed.length + untimed.length === 0
              ? "No tasks today"
              : `${timed.length + untimed.length} task${timed.length + untimed.length !== 1 ? "s" : ""} today`}
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-lg">
          {format(now, "h:mm a")}
        </span>
      </div>

      {/* unscheduled section */}
      {untimed.length > 0 && (
        <div className="px-4 py-3 border-b border-border/60 bg-muted/30 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Unscheduled
          </p>
          <div className="flex flex-col gap-1.5">
            {untimed.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`}>
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity ${PRIORITY_PILL[t.priority]} ${t.status === "done" ? "opacity-40" : ""}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    t.priority === "high" ? "bg-rose-500" :
                    t.priority === "medium" ? "bg-amber-500" : "bg-sky-400"
                  }`} />
                  <span className={t.status === "done" ? "line-through" : ""}>{t.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* scrollable timeline */}
      <div ref={scrollRef} className="overflow-y-auto flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* hour grid */}
        <div className="relative" style={{ height: `${HOURS.length * SLOT_H}px` }}>
          {HOURS.map((h) => {
            const isCurrentHour = h === nowHour;
            return (
              <div
                key={h}
                className="absolute left-0 right-0 flex"
                style={{ top: `${(h - START_HOUR) * SLOT_H}px`, height: `${SLOT_H}px` }}
              >
                {/* hour label */}
                <div className={`w-14 pt-2.5 pr-3 text-right text-xs shrink-0 select-none ${
                  isCurrentHour ? "text-primary font-semibold" : "text-muted-foreground"
                }`}>
                  {format(new Date(2000, 0, 1, h), "h a")}
                </div>
                {/* slot area */}
                <div className="flex-1 border-t border-border/40 pt-1 pr-3 relative" />
              </div>
            );
          })}

          {/* task pills — positioned absolutely */}
          {timed.map((task) => {
            if (!task.due_time) return null;
            const th = parseHour(task.due_time);
            if (th < START_HOUR || th > END_HOUR) return null;
            const top = timeToTop(task.due_time);

            return (
              <div
                key={task.id}
                className="absolute left-14 right-3 z-10"
                style={{ top: `${top + 4}px` }}
              >
                <Link href={`/tasks/${task.id}`}>
                  <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium max-w-full shadow-sm transition-opacity ${PRIORITY_PILL[task.priority]} ${task.status === "done" ? "opacity-40" : ""}`}>
                    <span className="text-[10px] font-mono opacity-70 shrink-0">
                      {task.due_time}
                    </span>
                    <span className={`truncate ${task.status === "done" ? "line-through" : ""}`}>
                      {task.title}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}

          {/* now indicator */}
          {nowTop >= 0 && (
            <div
              className="absolute left-14 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${nowTop}px` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 -ml-1.5 shadow" />
              <div className="flex-1 h-px bg-primary opacity-70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
