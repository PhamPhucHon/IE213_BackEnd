import { type NextRequest } from "next/server";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend
} from "@/lib/auth/route-utils";

type ReviewLikeRouteContext = {
  params: Promise<{ id: string }>;
};

type ReviewLikeResult = {
  likes: number;
};

export async function POST(request: NextRequest, { params }: ReviewLikeRouteContext) {
  const { id } = await params;
  const result = await authenticatedBackendJson<ReviewLikeResult>(
    request,
    `/reviews/${encodeURIComponent(id)}/like`,
    {
      method: "POST"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
