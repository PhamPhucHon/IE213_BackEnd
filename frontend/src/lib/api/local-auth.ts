import type { AuthResult, LoginPayload, RefreshResult, RegisterPayload } from "@/lib/api/auth";
import type { User } from "@/types/models";
import {
  getLocalErrorMessage,
  jsonRequest,
  LocalApiError,
  readPayload,
  responseErrorMessage
} from "./local-client";

export { LocalApiError };

export function getLocalApiErrorMessage(error: unknown) {
  return getLocalErrorMessage(error, "Something went wrong. Please try again.");
}

export async function getCurrentUser() {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "include"
  });
  const payload = await readPayload<User>(response);

  if (response.status === 401) {
    return null;
  }

  if (!response.ok || !payload?.success) {
    throw new LocalApiError<User>(
      responseErrorMessage(response, payload),
      response.status,
      payload
    );
  }

  return payload.data;
}

export async function login(payload: LoginPayload) {
  const response = await jsonRequest<AuthResult>("/api/auth/login", payload);
  return response.data;
}

export async function register(payload: RegisterPayload) {
  const response = await jsonRequest<AuthResult>("/api/auth/register", payload);
  return response.data;
}

export async function forgotPassword(email: string) {
  return jsonRequest<null>("/api/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string) {
  return jsonRequest<null>("/api/auth/reset-password", { token, newPassword });
}

export async function refreshSession() {
  return jsonRequest<RefreshResult>("/api/auth/refresh");
}

export async function logout() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
    credentials: "include"
  });
  const payload = await readPayload<null>(response);

  if (!response.ok && response.status !== 502) {
    throw new LocalApiError<null>(
      responseErrorMessage(response, payload),
      response.status,
      payload
    );
  }

  return payload;
}
