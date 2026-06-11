"use client";

import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useTaskParams } from "@/lib/hooks/use-task-params";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Button } from "@/components/ui/button";

function TasksPageContent() {
  const { filters, isFiltered, setPage } = useTaskParams();
  const { data, isLoading, isError } = useTasks(filters);

  return (
    <div className="space-y-6">
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <TaskFilters />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        {isLoading ? (
          <TaskSkeleton />
        ) : isError ? (
          <ErrorState />
        ) : data ? (
          <TaskList
            data={data}
            page={filters.page!}
            onPageChange={setPage}
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
        <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
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
