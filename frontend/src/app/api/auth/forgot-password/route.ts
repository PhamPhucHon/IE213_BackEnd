import { backendJson, jsonFromBackend, readJsonBody } from "@/lib/auth/route-utils";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const result = await backendJson<null>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body)
  });

  return jsonFromBackend(result);
}
