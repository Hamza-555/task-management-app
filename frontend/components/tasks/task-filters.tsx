"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function TaskFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`/tasks?${next.toString()}`);
    },
    [params, router]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          placeholder="Search tasks…"
          defaultValue={params.get("search") ?? ""}
          onChange={(e) => update("search", e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="sm:w-40"
      >
        <option value="">All statuses</option>
        <option value="todo">Todo</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </Select>

      <Select
        value={params.get("sort_by") ?? ""}
        onChange={(e) => update("sort_by", e.target.value)}
        className="sm:w-44"
      >
        <option value="">Sort: Newest</option>
        <option value="due_date">Sort: Due date</option>
        <option value="priority">Sort: Priority</option>
        <option value="created_at">Sort: Created</option>
      </Select>
    </div>
  );
}
