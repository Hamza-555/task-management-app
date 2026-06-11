"use client";

import { useState, useEffect } from "react";
import { useTaskParams } from "@/lib/hooks/use-task-params";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function TaskFilters() {
  const { filters, isFiltered, setParam, clearAll } = useTaskParams();

  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    setParam("search", debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // sync if URL search param is cleared externally (e.g. clearAll)
  useEffect(() => {
    if (!filters.search) setSearchInput("");
  }, [filters.search]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search tasks…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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

        <Select
          value={filters.sort_by ?? ""}
          onChange={(e) => setParam("sort_by", e.target.value)}
          className="sm:w-44"
        >
          <option value="">Sort: Newest</option>
          <option value="due_date">Sort: Due date</option>
          <option value="priority">Sort: Priority</option>
          <option value="created_at">Sort: Created</option>
        </Select>
      </div>

      {isFiltered && (
        <div className="flex items-center gap-2">
          <ActiveChips filters={filters} onRemove={setParam} />
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground ml-auto">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

function ActiveChips({
  filters,
  onRemove,
}: {
  filters: ReturnType<typeof useTaskParams>["filters"];
  onRemove: (key: string, value: string) => void;
}) {
  const chips: { key: string; label: string }[] = [];

  if (filters.search) chips.push({ key: "search", label: `"${filters.search}"` });
  if (filters.status) chips.push({ key: "status", label: filters.status.replace("_", " ") });
  if (filters.sort_by) chips.push({ key: "sort_by", label: `sort: ${filters.sort_by.replace("_", " ")}` });

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
        >
          {c.label}
          <button
            onClick={() => onRemove(c.key, "")}
            className="hover:text-primary/60 transition-colors"
            aria-label={`Remove ${c.key} filter`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
