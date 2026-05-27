import { type NextRequest } from "next/server";
import type { User } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

export async function GET(request: NextRequest) {
  const result = await authenticatedBackendJson<User>(request, "/users/profile", {
    method: "GET"
  });
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}

export async function PUT(request: NextRequest) {
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<User>(request, "/users/profile", {
    method: "PUT",
    body: JSON.stringify(body)
  });
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
