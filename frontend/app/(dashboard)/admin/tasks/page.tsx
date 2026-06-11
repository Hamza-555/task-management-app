"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { tasksApi, type TaskFilters } from "@/lib/api/tasks";
import { useAuthStore } from "@/store/auth.store";
import { useTaskParams } from "@/lib/hooks/use-task-params";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

function AdminTasksContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  if (user && user.role !== "admin") {
    router.replace("/tasks");
    return null;
  }

  return <AdminTasksTable />;
}

function AdminTasksTable() {
  const { filters, setParam, setPage } = useTaskParams();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "tasks", filters],
    queryFn: () => tasksApi.adminList(filters).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin — All Tasks</h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.pagination.total} tasks across all users
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search tasks…"
            defaultValue={filters.search ?? ""}
            onChange={(e) => setParam("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.status ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
          className="sm:w-40"
        >
          <option value="">All statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </Select>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ) : data && data.tasks.length > 0 ? (
          <>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">User</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Due</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false} mode="popLayout">
                    {data.tasks.map((task, i) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className={`font-medium text-foreground ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div>
                            <p className="text-foreground font-medium">{task.user_name}</p>
                            <p className="text-xs text-muted-foreground">{task.user_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={task.status} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant={task.priority} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                            : "—"}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {data.pagination.total_pages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  page={data.pagination.page}
                  totalPages={data.pagination.total_pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center text-muted-foreground">No tasks found.</div>
        )}
      </motion.div>
    </div>
  );
}

export default function AdminTasksPage() {
  return (
    <Suspense>
      <AdminTasksContent />
    </Suspense>
  );
}
