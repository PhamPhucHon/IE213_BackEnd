import { NextResponse, type NextRequest } from "next/server";
import type { ApiResponse } from "@/types/api";
import { authApi, type AuthResult, type RefreshResult } from "@/lib/api/auth";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenMaxAge,
  authCookieOptions,
  refreshTokenMaxAge
} from "./session";

const configuredBackendApiUrl =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  "http://localhost:5001/api";

const backendApiUrl = configuredBackendApiUrl.replace(/\/+$/, "");
const backendUnavailableMessage =
  "Cannot reach server. Please make sure the backend is running and try again.";

type BackendResult<T> = {
  status: number;
  payload: ApiResponse<T> | null;
};

type AuthenticatedBackendResult<T> = BackendResult<T> & {
  refreshedTokens?: RefreshResult;
  shouldClearCookies?: boolean;
};

export async function readJsonBody(request: Request) {
  return request.json().catch(() => ({}));
}

export function hasAuthSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ||
      request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  );
}

export function unauthenticatedJson(message = "Not authenticated") {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null
    },
    { status: 401 }
  );
}

export async function backendJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<BackendResult<T>> {
  const headers = new Headers(init.headers);

  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${backendApiUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store"
    });

    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    return { status: response.status, payload };
  } catch {
    return {
      status: 502,
      payload: {
        success: false,
        message: backendUnavailableMessage,
        data: null
      }
    };
  }
}

export function jsonFromBackend<T>({ status, payload }: BackendResult<T>) {
  return NextResponse.json(
    payload ?? {
      success: false,
      message: "Backend did not return JSON",
      data: null
    },
    { status }
  );
}

export function setAuthCookies(response: NextResponse, payload: ApiResponse<AuthResult> | null) {
  const data = payload?.data;

  if (data?.token) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, data.token, {
      ...authCookieOptions,
      maxAge: accessTokenMaxAge
    });
  }

  if (data?.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, data.refreshToken, {
      ...authCookieOptions,
      maxAge: refreshTokenMaxAge
    });
  }
}

export function setRefreshCookies(response: NextResponse, tokens?: RefreshResult) {
  if (!tokens?.token) return;

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.token, {
    ...authCookieOptions,
    maxAge: accessTokenMaxAge
  });

  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...authCookieOptions,
      maxAge: refreshTokenMaxAge
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...authCookieOptions,
    maxAge: 0
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...authCookieOptions,
    maxAge: 0
  });
}

function withAuthorization(init: RequestInit, token: string) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return {
    ...init,
    headers
  };
}

function unauthenticatedResult<T>(): AuthenticatedBackendResult<T> {
  return {
    status: 401,
    payload: {
      success: false,
      message: "Not authenticated",
      data: null
    }
  };
}

export async function authenticatedBackendJson<T>(
  request: NextRequest,
  path: string,
  init: RequestInit = {}
): Promise<AuthenticatedBackendResult<T>> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return unauthenticatedResult<T>();
  }

  if (accessToken) {
    const result = await backendJson<T>(path, withAuthorization(init, accessToken));

    if (result.status !== 401) {
      return result;
    }

    if (!refreshToken) {
      return {
        ...result,
        shouldClearCookies: true
      };
    }
  }

  if (!refreshToken) {
    return unauthenticatedResult<T>();
  }

  try {
    const refreshedTokens = await authApi.refreshToken(refreshToken);
    const result = await backendJson<T>(path, withAuthorization(init, refreshedTokens.token));

    return {
      ...result,
      refreshedTokens
    };
  } catch {
    return {
      status: 401,
      payload: {
        success: false,
        message: "Session is invalid or expired",
        data: null
      },
      shouldClearCookies: true
    };
  }
}

export function applyAuthProxyCookies(
  response: NextResponse,
  result: AuthenticatedBackendResult<unknown>
) {
  if (result.shouldClearCookies) {
    clearAuthCookies(response);
    return;
  }

  setRefreshCookies(response, result.refreshedTokens);
}
