import { apiRequest } from "./http";
import type { User } from "@/types/models";

export type AuthResult = {
  user: User;
  token: string;
  refreshToken: string;
};

export type RefreshResult = {
  token: string;
  refreshToken?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

export const authApi = {
  register(payload: RegisterPayload) {
    return apiRequest<AuthResult>("/auth/register", {
      method: "POST",
      body: payload
    });
  },
  login(payload: LoginPayload) {
    return apiRequest<AuthResult>("/auth/login", {
      method: "POST",
      body: payload
    });
  },
  me(token?: string) {
    return apiRequest<User>("/auth/me", {
      method: "GET",
      token
    });
  },
  forgotPassword(email: string) {
    return apiRequest<null>("/auth/forgot-password", {
      method: "POST",
      body: { email }
    });
  },
  resetPassword(token: string, newPassword: string) {
    return apiRequest<null>("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword }
    });
  },
  refreshToken(refreshToken: string) {
    return apiRequest<RefreshResult>("/auth/refresh-token", {
      method: "POST",
      body: { refreshToken }
    });
  },
  logout(token?: string, refreshToken?: string) {
    return apiRequest<null>("/auth/logout", {
      method: "POST",
      token,
      body: { refreshToken }
    });
  }
};
