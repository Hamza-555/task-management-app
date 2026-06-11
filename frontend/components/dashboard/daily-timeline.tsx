"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useTasks, useUpdateTask } from "@/lib/hooks/use-tasks";
import type { Task } from "@/lib/api/tasks";

const START_HOUR = 6;
const END_HOUR = 23;
const SLOT_H = 80;

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

function UnscheduledTask({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState("");
  const update = useUpdateTask();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSetTime(e: React.FormEvent) {
    e.preventDefault();
    if (!time) { setEditing(false); return; }
    update.mutate(
      { id: task.id, data: { due_time: time } },
      { onSettled: () => setEditing(false) }
    );
  }

  if (editing) {
    return (
      <form onSubmit={handleSetTime} className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          autoFocus
          className="text-xs h-7 rounded-lg border border-border bg-input px-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={update.isPending}
          className="text-xs px-2 h-7 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
        >
          {update.isPending ? "…" : "Set"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs px-2 h-7 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
        >
          ✕
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <Link href={`/tasks/${task.id}`} className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity ${PRIORITY_PILL[task.priority]} ${task.status === "done" ? "opacity-40" : ""}`}>
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            task.priority === "high" ? "bg-rose-500" :
            task.priority === "medium" ? "bg-amber-500" : "bg-sky-400"
          }`} />
          <span className={task.status === "done" ? "line-through" : ""}>{task.title}</span>
        </div>
      </Link>
      <button
        onClick={() => setEditing(true)}
        title="Set time"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 rounded-md hover:bg-muted shrink-0"
      >
        + time
      </button>
    </div>
  );
}

export function DailyTimeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const nowHour = now.getHours();
  const nowMin = now.getMinutes();

  const { data, isLoading } = useTasks({ due_today: true, page_size: 100 });

  const timed: Task[] = [];
  const untimed: Task[] = [];
  for (const t of data?.tasks ?? []) {
    if (t.due_time) timed.push(t);
    else untimed.push(t);
  }

  const nowTop =
    nowHour >= START_HOUR && nowHour <= END_HOUR
      ? (nowHour - START_HOUR) * SLOT_H + (nowMin / 60) * SLOT_H
      : -1;

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
            Unscheduled · hover to set a time
          </p>
          <div className="flex flex-col gap-1.5">
            {untimed.map((t) => (
              <UnscheduledTask key={t.id} task={t} />
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

        <div className="relative" style={{ height: `${HOURS.length * SLOT_H}px` }}>
          {HOURS.map((h) => {
            const isCurrentHour = h === nowHour;
            return (
              <div
                key={h}
                className="absolute left-0 right-0 flex"
                style={{ top: `${(h - START_HOUR) * SLOT_H}px`, height: `${SLOT_H}px` }}
              >
                <div className={`w-14 pt-2.5 pr-3 text-right text-xs shrink-0 select-none ${
                  isCurrentHour ? "text-primary font-semibold" : "text-muted-foreground"
                }`}>
                  {format(new Date(2000, 0, 1, h), "h a")}
                </div>
                <div className="flex-1 border-t border-border/40 pt-1 pr-3 relative" />
              </div>
            );
          })}

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
                      {format(new Date(`2000-01-01T${task.due_time}`), "h:mm a")}
                    </span>
                    <span className={`truncate ${task.status === "done" ? "line-through" : ""}`}>
                      {task.title}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}

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
