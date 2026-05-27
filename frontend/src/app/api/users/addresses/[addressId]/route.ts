import { type NextRequest } from "next/server";
import type { Address } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

type AddressRouteContext = {
  params: Promise<{ addressId: string }>;
};

export async function PUT(request: NextRequest, { params }: AddressRouteContext) {
  const { addressId } = await params;
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Address[]>(
    request,
    `/users/addresses/${encodeURIComponent(addressId)}`,
    {
      method: "PUT",
      body: JSON.stringify(body)
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}

export async function DELETE(request: NextRequest, { params }: AddressRouteContext) {
  const { addressId } = await params;
  const result = await authenticatedBackendJson<Address[]>(
    request,
    `/users/addresses/${encodeURIComponent(addressId)}`,
    {
      method: "DELETE"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
