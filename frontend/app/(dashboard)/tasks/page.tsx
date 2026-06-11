"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTasks } from "@/lib/hooks/use-tasks";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Button } from "@/components/ui/button";
import type { TaskFilters as Filters } from "@/lib/api/tasks";

function TasksPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const filters: Filters = {
    status: (params.get("status") as Filters["status"]) || undefined,
    search: params.get("search") || undefined,
    sort_by: (params.get("sort_by") as Filters["sort_by"]) || undefined,
    page: Number(params.get("page") || 1),
    page_size: 10,
  };

  const { data, isLoading, isError } = useTasks(filters);

  const isFiltered = !!(filters.status || filters.search || filters.sort_by);

  const handlePageChange = (page: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(page));
    router.push(`/tasks?${next.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.pagination.total} task{data.pagination.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Link href="/tasks/new">
          <Button size="md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New task
          </Button>
        </Link>
      </motion.div>

      {/* filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <TaskFilters />
      </motion.div>

      {/* content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        {isLoading ? (
          <TaskSkeleton />
        ) : isError ? (
          <ErrorState />
        ) : data ? (
          <TaskList
            data={data}
            page={filters.page!}
            onPageChange={handlePageChange}
            isFiltered={isFiltered}
          />
        ) : null}
      </motion.div>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="py-20 text-center">
      <p className="text-muted-foreground">Failed to load tasks. Please refresh.</p>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksPageContent />
    </Suspense>
  );
}
