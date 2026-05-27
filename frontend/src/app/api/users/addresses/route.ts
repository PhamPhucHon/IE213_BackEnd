import { type NextRequest } from "next/server";
import type { Address } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

export async function GET(request: NextRequest) {
  const result = await authenticatedBackendJson<Address[]>(request, "/users/addresses", {
    method: "GET"
  });
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Address[]>(request, "/users/addresses", {
    method: "POST",
    body: JSON.stringify(body)
  });
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
