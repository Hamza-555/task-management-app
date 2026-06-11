"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTaskStats, useTasks } from "@/lib/hooks/use-tasks";
import { useAuthStore } from "@/store/auth.store";
import { ActivityFeed } from "@/components/tasks/activity-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isToday, isPast } from "date-fns";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function StatCard({
  label, value, color, icon, delay,
}: {
  label: string;
  value: number | undefined;
  color: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-card border border-border rounded-2xl p-5 flex items-center gap-4`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value ?? "—"}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useTaskStats();
  const { data: todayData } = useTasks({
    due_today: true,
    sort_by: "priority",
    page_size: 10,
  });

  const todayTasks = todayData?.tasks ?? [];
  const sortedToday = [...todayTasks].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what's going on with your tasks today.</p>
      </motion.div>

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats?.total} delay={0.05}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard label="To Do" value={stats?.todo} delay={0.08}
          color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /></svg>}
        />
        <StatCard label="In Progress" value={stats?.in_progress} delay={0.11}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Done" value={stats?.done} delay={0.14}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Due Today" value={stats?.due_today} delay={0.17}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard label="Overdue" value={stats?.overdue} delay={0.20}
          color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
        />
      </div>

      {/* bottom columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* today's tasks — 2/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Today's tasks
              {sortedToday.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {sortedToday.filter((t) => t.status !== "done").length} remaining
                </span>
              )}
            </h2>
            <Link href="/tasks?due_today=true">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </div>

          {sortedToday.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-sm font-medium text-foreground">Nothing due today!</p>
              <p className="text-xs text-muted-foreground mt-1">Enjoy your clear schedule.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sortedToday.map((task, i) => {
                const overdue = task.due_date && task.status !== "done" && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                return (
                  <motion.li
                    key={task.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.28 + i * 0.04 }}
                  >
                    <Link
                      href={`/tasks/${task.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        task.priority === "high" ? "bg-rose-500" :
                        task.priority === "medium" ? "bg-amber-500" : "bg-sky-400"
                      }`} />
                      <span className={`flex-1 text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </span>
                      <Badge variant={task.status} />
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.div>

        {/* activity feed — 1/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ActivityFeed limit={10} />
        </motion.div>
      </div>
    </div>
  );
}
