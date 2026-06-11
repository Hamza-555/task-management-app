"use client";

import { AnimatePresence } from "framer-motion";
import { TaskCard } from "./task-card";
import { TaskEmpty } from "./task-empty";
import { Pagination } from "@/components/ui/pagination";
import type { TaskListResult } from "@/lib/api/tasks";

interface TaskListProps {
  data: TaskListResult;
  page: number;
  onPageChange: (p: number) => void;
  isFiltered: boolean;
}

export function TaskList({ data, page, onPageChange, isFiltered }: TaskListProps) {
  if (data.tasks.length === 0) return <TaskEmpty filtered={isFiltered} />;

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {data.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </AnimatePresence>

      <Pagination
        page={page}
        totalPages={data.pagination.total_pages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
