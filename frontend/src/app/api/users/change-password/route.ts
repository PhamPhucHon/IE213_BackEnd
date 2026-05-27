import { type NextRequest } from "next/server";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

export async function PUT(request: NextRequest) {
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<null>(request, "/users/change-password", {
    method: "PUT",
    body: JSON.stringify(body)
  });
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
