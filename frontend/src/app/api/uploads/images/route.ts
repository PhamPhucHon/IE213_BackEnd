import { type NextRequest } from "next/server";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  hasAuthSessionCookie,
  jsonFromBackend,
  unauthenticatedJson
} from "@/lib/auth/route-utils";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_BODY_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif"
]);

function uploadError(message: string, status: number) {
  return Response.json(
    {
      success: false,
      message,
      data: null
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  if (!hasAuthSessionCookie(request)) {
    return unauthenticatedJson();
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BODY_BYTES) {
    return uploadError("Image upload is too large.", 413);
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return uploadError("Image file is required.", 400);
  }

  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    return uploadError("Only JPG, PNG, WEBP, and AVIF images are allowed.", 415);
  }

  if (image.size > MAX_IMAGE_SIZE_BYTES) {
    return uploadError("Image must be 5MB or smaller.", 413);
  }

  const result = await authenticatedBackendJson<{ imageUrl: string; publicId?: string }>(
    request,
    "/uploads/images",
    {
      method: "POST",
      body: formData
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
