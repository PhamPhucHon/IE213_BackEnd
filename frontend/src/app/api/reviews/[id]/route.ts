import { type NextRequest } from "next/server";
import type { Review } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

type ReviewRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: ReviewRouteContext) {
  const { id } = await params;
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Review>(
    request,
    `/reviews/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(body)
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}

export async function DELETE(request: NextRequest, { params }: ReviewRouteContext) {
  const { id } = await params;
  const result = await authenticatedBackendJson<null>(
    request,
    `/reviews/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
