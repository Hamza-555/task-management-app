"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useCreateTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { attachmentsApi } from "@/lib/api/attachments";
import { AttachmentSection } from "@/components/tasks/attachment-section";
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
  due_time: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TaskFormProps {
  task?: Task;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskForm({ task }: TaskFormProps) {
  const router = useRouter();
  const create = useCreateTask();
  const update = useUpdateTask();
  const isEditing = !!task;
  const isPending = create.isPending || update.isPending;

  // staged files for new-task flow
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      due_date: task?.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "",
      due_time: task?.due_time ?? "",
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
        due_time: task.due_time ?? "",
      });
    }
  }, [task, reset]);

  function stageFiles(files: FileList | null) {
    if (!files?.length) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 1024 * 1024) {
        alert(`"${f.name}" exceeds the 1 MB limit and was skipped.`);
      } else {
        valid.push(f);
      }
    }
    setStagedFiles((prev) => [...prev, ...valid]);
  }

  function removeStagedFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      due_date: data.due_date ? new Date(data.due_date + "T00:00:00").toISOString() : undefined,
      due_time: data.due_time || undefined,
    };

    if (isEditing) {
      update.mutate({ id: task.id, data: payload }, { onSuccess: () => router.push("/tasks") });
    } else {
      create.mutate(payload, {
        onSuccess: async (newTask) => {
          if (stagedFiles.length > 0) {
            setUploading(true);
            await Promise.allSettled(
              stagedFiles.map((f) => attachmentsApi.upload(newTask.id, f))
            );
            setUploading(false);
          }
          router.push("/tasks");
        },
      });
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
        <p className="text-muted-foreground text-sm mt-1">
          {isEditing ? "Update the task details below." : "Fill in the details to create a new task."}
        </p>
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Due date" error={undefined}>
            <Input {...register("due_date")} type="date" />
          </Field>
          <Field label="Due time" error={undefined}>
            <Input {...register("due_time")} type="time" />
          </Field>
        </div>

        {/* staged attachment zone — only for new tasks */}
        {!isEditing && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Attachments</label>

            <div
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); stageFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => stageFiles(e.target.files)}
              />
              <p className="text-sm text-muted-foreground">
                Drop files or <span className="text-primary font-medium">click to browse</span>
                <span className="block text-xs mt-0.5">Max 1 MB per file · uploaded on save</span>
              </p>
            </div>

            <AnimatePresence initial={false}>
              {stagedFiles.map((f, i) => (
                <motion.div
                  key={`${f.name}-${i}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50 group"
                >
                  <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                  <span className="flex-1 text-sm text-foreground truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatBytes(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeStagedFile(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {errorMsg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl">
            {errorMsg}
          </motion.p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={() => router.push("/tasks")} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isPending || uploading} className="flex-1">
            {uploading ? "Uploading…" : isEditing ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>

      {/* live attachment section for existing tasks */}
      {isEditing && (
        <div className="bg-card border border-border rounded-2xl p-6 mt-6">
          <AttachmentSection taskId={task!.id} />
        </div>
      )}
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
