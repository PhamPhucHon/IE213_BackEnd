import { NextResponse, type NextRequest } from "next/server";
import { authApi } from "@/lib/api/auth";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/session";
import { clearAuthCookies } from "@/lib/auth/route-utils";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  try {
    await authApi.logout(accessToken, refreshToken);
    const response = NextResponse.json({
      success: true,
      message: "Logged out",
      data: null
    });
    clearAuthCookies(response);
    return response;
  } catch {
    const response = NextResponse.json(
      {
        success: false,
        message: "Backend logout failed, local session cleared",
        data: null
      },
      { status: 502 }
    );
    clearAuthCookies(response);
    return response;
  }
}
