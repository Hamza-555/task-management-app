"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TaskFilters } from "@/lib/api/tasks";

export function useTaskParams() {
  const router = useRouter();
  const params = useSearchParams();

  const filters: TaskFilters = {
    status: (params.get("status") as TaskFilters["status"]) || undefined,
    search: params.get("search") || undefined,
    sort_by: (params.get("sort_by") as TaskFilters["sort_by"]) || undefined,
    page: Number(params.get("page") || 1),
    page_size: 10,
  };

  const isFiltered = !!(filters.status || filters.search || filters.sort_by);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`/tasks?${next.toString()}`);
    },
    [params, router]
  );

  const setPage = useCallback(
    (page: number) => {
      const next = new URLSearchParams(params.toString());
      next.set("page", String(page));
      router.push(`/tasks?${next.toString()}`);
    },
    [params, router]
  );

  const clearAll = useCallback(() => {
    router.push("/tasks");
  }, [router]);

  return { filters, isFiltered, setParam, setPage, clearAll };
}
