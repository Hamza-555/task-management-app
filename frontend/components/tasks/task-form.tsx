"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useCreateTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/api/tasks";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(2000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TaskFormProps {
  task?: Task;
}

export function TaskForm({ task }: TaskFormProps) {
  const router = useRouter();
  const create = useCreateTask();
  const update = useUpdateTask();
  const isEditing = !!task;
  const isPending = create.isPending || update.isPending;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      due_date: task?.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "",
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? undefined,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "",
      });
    }
  }, [task, reset]);

  const onSubmit = (data: FormData) => {
    const payload = { ...data, due_date: data.due_date || undefined };
    if (isEditing) {
      update.mutate({ id: task.id, data: payload }, { onSuccess: () => router.push("/tasks") });
    } else {
      create.mutate(payload, { onSuccess: () => router.push("/tasks") });
    }
  };

  const apiError = (create.error || update.error) as any;
  const errorMsg = apiError?.response?.data?.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{isEditing ? "Edit task" : "New task"}</h1>
        <p className="text-muted-foreground text-sm mt-1">{isEditing ? "Update the task details below." : "Fill in the details to create a new task."}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <Field label="Title" error={errors.title?.message}>
          <Input {...register("title")} placeholder="What needs to be done?" error={!!errors.title} autoFocus />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea
            {...register("description")}
            placeholder="Add more details (optional)"
            rows={3}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border bg-input/50 text-foreground placeholder:text-muted-foreground",
              "outline-none transition-all duration-200 text-sm resize-none",
              "focus:ring-2 focus:ring-ring focus:border-transparent border-border hover:border-ring/50"
            )}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" error={errors.status?.message}>
            <Select {...register("status")}>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </Select>
          </Field>

          <Field label="Priority" error={errors.priority?.message}>
            <Select {...register("priority")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
        </div>

        <Field label="Due date" error={undefined}>
          <Input {...register("due_date")} type="date" />
        </Field>

        {errorMsg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl">
            {errorMsg}
          </motion.p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={() => router.push("/tasks")} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isPending} className="flex-1">
            {isEditing ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
