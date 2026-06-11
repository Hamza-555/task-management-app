"use client";

import { useTaskEvents } from "@/lib/hooks/use-task-events";

export function TaskEventsProvider() {
  useTaskEvents();
  return null;
}
