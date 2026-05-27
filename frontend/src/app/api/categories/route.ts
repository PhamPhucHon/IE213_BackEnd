import { type NextRequest } from "next/server";
import type { Category } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  backendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

export async function GET() {
  const result = await backendJson<Category[]>("/categories", {
    method: "GET"
  });

  return jsonFromBackend(result);
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Category>(request, "/categories", {
    method: "POST",
    body: JSON.stringify(body)
  });
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
