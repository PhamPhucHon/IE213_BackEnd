import { type NextRequest } from "next/server";
import type { Address } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend
} from "@/lib/auth/route-utils";

type SetDefaultAddressRouteContext = {
  params: Promise<{ addressId: string }>;
};

export async function PUT(request: NextRequest, { params }: SetDefaultAddressRouteContext) {
  const { addressId } = await params;
  const result = await authenticatedBackendJson<Address[]>(
    request,
    `/users/addresses/${encodeURIComponent(addressId)}/set-default`,
    {
      method: "PUT"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
