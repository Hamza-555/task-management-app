import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: { access_token: string; token_type: string };
}

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>("/api/v1/auth/signup", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/api/v1/auth/login", data),

  me: () => apiClient.get<User>("/api/v1/auth/me"),
};
