import { apiClient } from "./client";

export interface Attachment {
  id: string;
  task_id: string;
  user_id: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
}

export const attachmentsApi = {
  list: (taskId: string) =>
    apiClient.get<{ attachments: Attachment[] }>(`/api/v1/tasks/${taskId}/attachments`),

  upload: (taskId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<Attachment>(`/api/v1/tasks/${taskId}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  downloadUrl: (taskId: string, attId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${taskId}/attachments/${attId}`,

  delete: (taskId: string, attId: string) =>
    apiClient.delete(`/api/v1/tasks/${taskId}/attachments/${attId}`),
};
