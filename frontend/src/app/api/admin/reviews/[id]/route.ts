import { type NextRequest } from "next/server";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend
} from "@/lib/auth/route-utils";

type AdminReviewRouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, { params }: AdminReviewRouteContext) {
  const { id } = await params;
  const result = await authenticatedBackendJson<null>(
    request,
    `/admin/reviews/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
