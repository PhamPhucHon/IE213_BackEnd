import { apiEnvelope, apiRequest } from "./http";
import type { Address, User } from "@/types/models";

export type ProfilePayload = {
  name?: string;
  phone?: string;
  avatar?: string;
};

export type AddressPayload = {
  label?: string;
  address: string;
  isDefault?: boolean;
};

export const usersApi = {
  profile(token?: string) {
    return apiRequest<User>("/users/profile", {
      method: "GET",
      token
    });
  },
  updateProfile(payload: ProfilePayload, token?: string) {
    return apiRequest<User>("/users/profile", {
      method: "PUT",
      token,
      body: payload
    });
  },
  changePassword(currentPassword: string, newPassword: string, token?: string) {
    return apiEnvelope<null>("/users/change-password", {
      method: "PUT",
      token,
      body: { currentPassword, newPassword }
    });
  },
  addresses(token?: string) {
    return apiRequest<Address[]>("/users/addresses", {
      method: "GET",
      token
    });
  },
  addAddress(payload: AddressPayload, token?: string) {
    return apiRequest<Address[]>("/users/addresses", {
      method: "POST",
      token,
      body: payload
    });
  },
  updateAddress(id: string, payload: Partial<AddressPayload>, token?: string) {
    return apiRequest<Address[]>(`/users/addresses/${id}`, {
      method: "PUT",
      token,
      body: payload
    });
  },
  setDefaultAddress(id: string, token?: string) {
    return apiRequest<Address[]>(`/users/addresses/${id}/set-default`, {
      method: "PUT",
      token
    });
  },
  removeAddress(id: string, token?: string) {
    return apiRequest<Address[]>(`/users/addresses/${id}`, {
      method: "DELETE",
      token
    });
  },
  deleteOwnAccount(token?: string) {
    return apiEnvelope<null>("/users/me", {
      method: "DELETE",
      token
    });
  }
};
