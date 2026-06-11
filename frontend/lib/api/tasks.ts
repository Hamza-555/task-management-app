import { apiClient } from "./client";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResult {
  tasks: Task[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface TaskFilters {
  status?: TaskStatus;
  search?: string;
  sort_by?: "due_date" | "priority" | "created_at";
  page?: number;
  page_size?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface AdminTask extends Task {
  user_name: string;
  user_email: string;
}

export interface AdminTaskListResult {
  tasks: AdminTask[];
  pagination: TaskListResult["pagination"];
}

export const tasksApi = {
  list: (filters: TaskFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.sort_by) params.set("sort_by", filters.sort_by);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.page_size) params.set("page_size", String(filters.page_size));
    return apiClient.get<TaskListResult>(`/api/v1/tasks?${params}`);
  },

  get: (id: string) => apiClient.get<Task>(`/api/v1/tasks/${id}`),

  create: (data: CreateTaskData) => apiClient.post<Task>("/api/v1/tasks", data),

  update: (id: string, data: UpdateTaskData) =>
    apiClient.patch<Task>(`/api/v1/tasks/${id}`, data),

  delete: (id: string) => apiClient.delete(`/api/v1/tasks/${id}`),

  adminList: (filters: TaskFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.sort_by) params.set("sort_by", filters.sort_by);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.page_size) params.set("page_size", String(filters.page_size));
    return apiClient.get<AdminTaskListResult>(`/api/v1/admin/tasks?${params}`);
  },
};
