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

function userResponse(user: Awaited<ReturnType<typeof authApi.me>>) {
  return NextResponse.json({
    success: true,
    message: "Success",
    data: user
  });
}

async function refreshAndRetry(refreshToken?: string, clearStaleCookies = false) {
  if (!refreshToken) {
    const response = NextResponse.json(
      { success: false, message: "Not authenticated", data: null },
      { status: 401 }
    );

    if (clearStaleCookies) {
      clearAuthCookies(response);
    }

    return response;
  }

  try {
    const tokens = await authApi.refreshToken(refreshToken);
    const user = await authApi.me(tokens.token);
    const response = userResponse(user);

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
    const response = NextResponse.json(
      { success: false, message: "Session is invalid or expired", data: null },
      { status: 401 }
    );
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
    return userResponse(user);
  } catch {
    return refreshAndRetry(refreshToken, true);
  }
}
