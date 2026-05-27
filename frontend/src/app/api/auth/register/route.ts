import { backendJson, jsonFromBackend, readJsonBody, setAuthCookies } from "@/lib/auth/route-utils";
import type { AuthResult } from "@/lib/api/auth";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const result = await backendJson<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body)
  });

  const response = jsonFromBackend(result);
  setAuthCookies(response, result.payload);
  return response;
}
