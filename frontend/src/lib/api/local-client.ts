import type { ApiResponse } from "@/types/api";

export class LocalApiError<T = unknown> extends Error {
  status: number;
  payload?: ApiResponse<T> | null;

  constructor(
    message: string,
    status: number,
    payload?: ApiResponse<T> | null,
    name = "LocalApiError"
  ) {
    super(message);
    this.name = name;
    this.status = status;
    this.payload = payload;
  }
}

type ErrorFactory<T> = (
  message: string,
  status: number,
  payload: ApiResponse<T> | null
) => LocalApiError<T>;

export async function readPayload<T>(response: Response) {
  return (await response.json().catch(() => null)) as ApiResponse<T> | null;
}

export function responseErrorMessage<T>(response: Response, payload: ApiResponse<T> | null) {
  return payload?.message || response.statusText || "Request failed";
}

export async function localEnvelope<T>(
  path: string,
  init: RequestInit = {},
  createError?: ErrorFactory<T>
) {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "include"
  });
  const payload = await readPayload<T>(response);

  if (!response.ok || !payload?.success) {
    const message = responseErrorMessage(response, payload);
    throw createError
      ? createError(message, response.status, payload)
      : new LocalApiError<T>(message, response.status, payload);
  }

  return payload;
}

export async function jsonRequest<T>(
  path: string,
  body?: unknown,
  method = "POST",
  createError?: ErrorFactory<T>
) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  return localEnvelope<T>(
    path,
    {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    },
    createError
  );
}

export function getLocalErrorMessage(error: unknown, fallback: string) {
  if (error instanceof LocalApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
