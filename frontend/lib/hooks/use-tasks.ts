"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi, type TaskFilters, type CreateTaskData, type UpdateTaskData, type Task, type TaskListResult } from "@/lib/api/tasks";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (filters: TaskFilters) => ["tasks", "list", filters] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
  stats: ["tasks", "stats"] as const,
};

// Separate key so it can be invalidated independently
export const activityKey = ["activity"] as const;

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => tasksApi.list(filters).then((r) => r.data),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: taskKeys.stats,
    queryFn: () => tasksApi.stats().then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskData) => tasksApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: activityKey });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      tasksApi.update(id, data).then((r) => r.data),

    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: taskKeys.all });
      const snapshots = qc.getQueriesData<TaskListResult>({ queryKey: ["tasks", "list"] });
      qc.setQueriesData<TaskListResult>({ queryKey: ["tasks", "list"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) =>
            t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t
          ),
        };
      });
      qc.setQueryData<Task>(taskKeys.detail(id), (old) =>
        old ? { ...old, ...data, updated_at: new Date().toISOString() } : old
      );
      return { snapshots };
    },

    onError: (_err, _vars, context) => {
      context?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: activityKey });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: taskKeys.all });
      const snapshots = qc.getQueriesData<TaskListResult>({ queryKey: ["tasks", "list"] });
      qc.setQueriesData<TaskListResult>({ queryKey: ["tasks", "list"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.filter((t) => t.id !== id),
          pagination: { ...old.pagination, total: old.pagination.total - 1 },
        };
      });
      return { snapshots };
    },

    onError: (_err, _vars, context) => {
      context?.snapshots?.forEach(([key, value]) => qc.setQueryData(key, value));
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: activityKey });
    },
  });
}
