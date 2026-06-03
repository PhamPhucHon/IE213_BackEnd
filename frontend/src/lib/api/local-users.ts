import type { AddressPayload, ProfilePayload } from "@/lib/api/users";
import type { ApiResponse } from "@/types/api";
import type { Address, User } from "@/types/models";
import {
  getLocalErrorMessage,
  jsonRequest,
  LocalApiError,
  localEnvelope
} from "./local-client";

export class LocalUserError<T = unknown> extends LocalApiError<T> {
  constructor(message: string, status: number, payload?: ApiResponse<T> | null) {
    super(message, status, payload, "LocalUserError");
  }
}

export type UploadImageResult = {
  imageUrl: string;
  publicId?: string;
  format?: string;
  optimized?: boolean;
};

function createUserError<T>(
  message: string,
  status: number,
  payload: ApiResponse<T> | null
) {
  return new LocalUserError<T>(message, status, payload);
}

export function getLocalUserErrorMessage(error: unknown) {
  return getLocalErrorMessage(error, "Account request failed. Please try again.");
}

export async function getProfile() {
  const response = await localEnvelope<User>("/api/users/profile", {}, createUserError);
  return response.data as User;
}

export async function updateProfile(payload: ProfilePayload) {
  const response = await jsonRequest<User>("/api/users/profile", payload, "PUT", createUserError);
  return response.data as User;
}

export async function uploadProfileAvatar(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await localEnvelope<UploadImageResult>(
    "/api/uploads/images",
    {
      method: "POST",
      body: formData
    },
    createUserError
  );
  return response.data as UploadImageResult;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return jsonRequest<null>(
    "/api/users/change-password",
    { currentPassword, newPassword },
    "PUT",
    createUserError
  );
}

export async function deleteOwnAccount() {
  return localEnvelope<null>(
    "/api/users/me",
    {
      method: "DELETE"
    },
    createUserError
  );
}

export async function getAddresses() {
  const response = await localEnvelope<Address[]>("/api/users/addresses", {}, createUserError);
  return response.data ?? [];
}

export async function addAddress(payload: AddressPayload) {
  const response = await jsonRequest<Address[]>(
    "/api/users/addresses",
    payload,
    "POST",
    createUserError
  );
  return response.data ?? [];
}

export async function updateAddress(id: string, payload: Partial<AddressPayload>) {
  const response = await jsonRequest<Address[]>(
    `/api/users/addresses/${encodeURIComponent(id)}`,
    payload,
    "PUT",
    createUserError
  );
  return response.data ?? [];
}

export async function setDefaultAddress(id: string) {
  const response = await jsonRequest<Address[]>(
    `/api/users/addresses/${encodeURIComponent(id)}/set-default`,
    undefined,
    "PUT",
    createUserError
  );
  return response.data ?? [];
}

export async function removeAddress(id: string) {
  const response = await localEnvelope<Address[]>(
    `/api/users/addresses/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    },
    createUserError
  );
  return response.data ?? [];
}
