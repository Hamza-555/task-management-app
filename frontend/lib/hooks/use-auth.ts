"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth.store";

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token.access_token);
      router.push("/tasks");
    },
  });
}

export function useSignup() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token.access_token);
      router.push("/tasks");
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  return () => {
    clearAuth();
    router.push("/login");
  };
}
