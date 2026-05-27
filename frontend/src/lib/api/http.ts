import type { ApiResponse, QueryParams } from "@/types/api";

const configuredApiBaseUrl =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  "http://localhost:5001/api";

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");

export class ApiError<T = unknown> extends Error {
  status: number;
  payload?: ApiResponse<T> | null;

  constructor(message: string, status: number, payload?: ApiResponse<T> | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type JsonBody = object | null;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  query?: QueryParams;
  token?: string;
  body?: BodyInit | JsonBody;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export const publicCatalogFetchOptions = {
  cache: "force-cache" as const,
  next: {
    revalidate: 60
  }
} satisfies Pick<ApiRequestOptions, "cache" | "next">;

function buildUrl(path: string, query?: QueryParams) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function prepareBody(body: ApiRequestOptions["body"], headers: Headers) {
  if (body === undefined) return undefined;

  if (body instanceof FormData || typeof body === "string") {
    return body;
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return JSON.stringify(body);
}

export async function apiEnvelope<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, query, token, ...fetchOptions } = options;
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, query), {
    ...fetchOptions,
    cache: fetchOptions.cache ?? "no-store",
    headers,
    body: prepareBody(body, headers)
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError<T>(
      payload?.message || response.statusText || "Request failed",
      response.status,
      payload
    );
  }

  return payload;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const payload = await apiEnvelope<T>(path, options);
  return payload.data as T;
}
