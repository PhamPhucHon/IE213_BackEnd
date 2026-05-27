export type ApiMeta = {
  timestamp?: string;
  requestId?: string;
  [key: string]: unknown;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  meta?: ApiMeta;
  errors?: unknown;
  details?: unknown;
};

export type QueryValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryValue>;

export type PageQuery = {
  page?: number;
  limit?: number;
};
