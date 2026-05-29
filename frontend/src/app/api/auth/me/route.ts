import { NextResponse, type NextRequest } from "next/server";
import { authApi } from "@/lib/api/auth";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenMaxAge,
  authCookieOptions,
  refreshTokenMaxAge
} from "@/lib/auth/session";
import { clearAuthCookies } from "@/lib/auth/route-utils";

function sessionResponse(user: Awaited<ReturnType<typeof authApi.me>> | null) {
  return NextResponse.json({
    success: true,
    message: user ? "Success" : "Not authenticated",
    data: user
  });
}

async function refreshAndRetry(refreshToken?: string, clearStaleCookies = false) {
  if (!refreshToken) {
    const response = sessionResponse(null);

    if (clearStaleCookies) {
      clearAuthCookies(response);
    }

    return response;
  }

  try {
    const tokens = await authApi.refreshToken(refreshToken);
    const user = await authApi.me(tokens.token);
    const response = sessionResponse(user);

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

    return response;
  } catch {
    const response = sessionResponse(null);
    clearAuthCookies(response);
    return response;
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!token) {
    return refreshAndRetry(refreshToken);
  }

  try {
    const user = await authApi.me(token);
    return sessionResponse(user);
  } catch {
    return refreshAndRetry(refreshToken, true);
  }
}
