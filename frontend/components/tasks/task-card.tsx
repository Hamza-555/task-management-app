"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUpdateTask, useDeleteTask } from "@/lib/hooks/use-tasks";
import type { Task } from "@/lib/api/tasks";

export function TaskCard({ task }: { task: Task }) {
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isOverdue =
    task.due_date &&
    task.status !== "done" &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  const toggleDone = () =>
    update.mutate({
      id: task.id,
      data: { status: task.status === "done" ? "todo" : "done" },
    });

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="group bg-card border border-border rounded-2xl p-5 hover:border-ring/40 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start gap-3">
          {/* complete toggle */}
          <button
            onClick={toggleDone}
            className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
            style={{
              borderColor: task.status === "done" ? "hsl(var(--success))" : "hsl(var(--border))",
              backgroundColor: task.status === "done" ? "hsl(var(--success))" : "transparent",
            }}
          >
            {task.status === "done" && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/tasks/${task.id}`}
                className={`font-medium text-foreground hover:text-primary transition-colors truncate ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}
              >
                {task.title}
              </Link>

              {/* actions — visible on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Link href={`/tasks/${task.id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setConfirmOpen(true)}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant={task.status} />
              <Badge variant={task.priority} />
              {task.due_date && (
                <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {isOverdue ? "Overdue · " : ""}{format(new Date(task.due_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete task"
        message={`"${task.title}" will be permanently deleted.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          remove.mutate(task.id, { onSettled: () => setConfirmOpen(false) });
        }}
        loading={remove.isPending}
      />
    </>
  );
}
