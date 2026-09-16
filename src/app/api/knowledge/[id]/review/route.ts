import { AIProviderError } from "@/server/ai/provider";
import { reviewUnderstandingVersion } from "@/server/ai/understanding-review";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "invalid_id" }, { status: 400 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const versionId = isRecord(payload) && typeof payload.versionId === "string" ? payload.versionId : "";
  if (!uuidPattern.test(versionId)) return Response.json({ error: "invalid_version_id" }, { status: 400 });

  try {
    const result = await reviewUnderstandingVersion(id, versionId);
    if ("status" in result) {
      if (result.status === "not_found") return Response.json({ error: "not_found" }, { status: 404 });
      if (result.status === "unauthenticated") return Response.json({ error: "unauthenticated" }, { status: 401 });
      return Response.json({ error: "ai_not_configured" }, { status: 503 });
    }
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[understanding review]", error);
    return Response.json({ error: error instanceof AIProviderError ? "ai_provider_unavailable" : "review_unavailable" }, { status: error instanceof AIProviderError ? 502 : 500 });
  }
}
