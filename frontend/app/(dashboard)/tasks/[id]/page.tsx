"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useTask, useDeleteTask } from "@/lib/hooks/use-tasks";
import { AttachmentSection } from "@/components/tasks/attachment-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(id);
  const remove = useDeleteTask();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!task) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <p className="text-muted-foreground">Task not found.</p>
      <Link href="/tasks"><Button variant="ghost" className="mt-4">Back to tasks</Button></Link>
    </div>
  );

  const isOverdue =
    task.due_date && task.status !== "done" &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-5"
      >
        {/* back nav */}
        <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to tasks
        </Link>

        {/* main card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* title row */}
          <div className="flex items-start justify-between gap-4">
            <h1 className={`text-xl font-bold text-foreground leading-snug ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </h1>
            <div className="flex gap-2 shrink-0">
              <Link href={`/tasks/${id}/edit`}>
                <Button variant="secondary" size="sm">Edit</Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
                Delete
              </Button>
            </div>
          </div>

          {/* badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={task.status} />
            <Badge variant={task.priority} />
            {isOverdue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                Overdue
              </span>
            )}
          </div>

          {/* description */}
          {task.description ? (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{task.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description.</p>
          )}

          {/* meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Due date</p>
              <p className={`text-sm font-medium ${isOverdue ? "text-destructive" : "text-foreground"}`}>
                {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Due time</p>
              <p className="text-sm font-medium text-foreground">
                {task.due_time
                  ? format(new Date(`2000-01-01T${task.due_time}`), "h:mm a")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created</p>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(task.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Last updated</p>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(task.updated_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* attachments */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <AttachmentSection taskId={id} />
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete task"
        message={`"${task.title}" will be permanently deleted.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          remove.mutate(id, {
            onSuccess: () => router.push("/tasks"),
            onError: () => setConfirmOpen(false),
          })
        }
        loading={remove.isPending}
      />
    </>
  );
}
