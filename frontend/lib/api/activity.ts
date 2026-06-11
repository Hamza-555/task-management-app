import { apiClient } from "./client";

export interface ActivityLog {
  id: string;
  user_id: string;
  task_id: string | null;
  task_title: string | null;
  action: "task.created" | "task.updated" | "task.deleted";
  meta: Record<string, string> | null;
  created_at: string;
}

export const activityApi = {
  list: (limit = 20) =>
    apiClient.get<{ logs: ActivityLog[] }>(`/api/v1/activity?limit=${limit}`),
};
