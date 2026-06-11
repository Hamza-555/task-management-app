"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "@/lib/hooks/use-tasks";
import { useAuthStore } from "@/store/auth.store";

export function useTaskEvents() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const es = new EventSource(`${base}/api/v1/tasks/events`, { withCredentials: true });

    const invalidate = () => qc.invalidateQueries({ queryKey: taskKeys.all });

    es.addEventListener("task.created", invalidate);
    es.addEventListener("task.updated", invalidate);
    es.addEventListener("task.deleted", invalidate);

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [isAuthenticated, qc]);
}
