"use client";

import { useParams } from "next/navigation";
import { useTask } from "@/lib/hooks/use-tasks";
import { TaskForm } from "@/components/tasks/task-form";
import { AttachmentSection } from "@/components/tasks/attachment-section";

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const { data: task, isLoading } = useTask(id);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-muted rounded-xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <TaskForm task={task} />
      <AttachmentSection taskId={id} />
    </div>
  );
}
