import { type NextRequest } from "next/server";
import type { Review } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  backendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

type ProductReviewsRouteContext = {
  params: Promise<{ productId: string }>;
};

export async function GET(request: NextRequest, { params }: ProductReviewsRouteContext) {
  const { productId } = await params;
  const result = await backendJson<Review[]>(
    `/products/${encodeURIComponent(productId)}/reviews${request.nextUrl.search}`,
    {
      method: "GET"
    }
  );

  return jsonFromBackend(result);
}

export async function POST(request: NextRequest, { params }: ProductReviewsRouteContext) {
  const { productId } = await params;
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Review>(
    request,
    `/products/${encodeURIComponent(productId)}/reviews`,
    {
      method: "POST",
      body: JSON.stringify(body)
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
