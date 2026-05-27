import { NextResponse, type NextRequest } from "next/server";
import { authApi } from "@/lib/api/auth";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenMaxAge,
  authCookieOptions,
  refreshTokenMaxAge
} from "@/lib/auth/session";
import { clearAuthCookies, readJsonBody } from "@/lib/auth/route-utils";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const refreshToken =
    typeof body.refreshToken === "string"
      ? body.refreshToken
      : request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: "Missing refresh token", data: null },
      { status: 401 }
    );
  }

  try {
    const data = await authApi.refreshToken(refreshToken);
    const response = NextResponse.json({
      success: true,
      message: "Token refreshed",
      data
    });

    response.cookies.set(ACCESS_TOKEN_COOKIE, data.token, {
      ...authCookieOptions,
      maxAge: accessTokenMaxAge
    });

    if (data.refreshToken) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, data.refreshToken, {
        ...authCookieOptions,
        maxAge: refreshTokenMaxAge
      });
    }

    return response;
  } catch {
    const response = NextResponse.json(
      { success: false, message: "Refresh token is invalid or expired", data: null },
      { status: 401 }
    );
    clearAuthCookies(response);
    return response;
  }
}
