import { type NextRequest } from "next/server";
import type { Category } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  backendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

type CategoryRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: CategoryRouteContext) {
  const { id } = await params;
  const result = await backendJson<Category>(`/categories/${encodeURIComponent(id)}`, {
    method: "GET"
  });

  return jsonFromBackend(result);
}

export async function PUT(request: NextRequest, { params }: CategoryRouteContext) {
  const { id } = await params;
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Category>(
    request,
    `/categories/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(body)
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}

export async function DELETE(request: NextRequest, { params }: CategoryRouteContext) {
  const { id } = await params;
  const result = await authenticatedBackendJson<null>(
    request,
    `/categories/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
