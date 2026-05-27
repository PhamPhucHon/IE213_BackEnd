import { type NextRequest } from "next/server";
import type { Product } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  backendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

export async function GET(request: NextRequest) {
  const result = await backendJson<Product[]>(`/products${request.nextUrl.search}`, {
    method: "GET"
  });

  return jsonFromBackend(result);
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Product>(request, "/products", {
    method: "POST",
    body: JSON.stringify(body)
  });
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
