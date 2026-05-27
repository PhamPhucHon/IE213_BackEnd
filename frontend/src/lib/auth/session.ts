export const ACCESS_TOKEN_COOKIE = "ie213_access_token";
export const REFRESH_TOKEN_COOKIE = "ie213_refresh_token";

export const accessTokenMaxAge = 60 * 60 * 24 * 7;
export const refreshTokenMaxAge = 60 * 60 * 24 * 30;

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/"
};
