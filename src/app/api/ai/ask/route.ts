import { AIProviderError } from "@/server/ai/provider";
import { askPersonalKnowledge, AssistantInputError } from "@/server/ai/assistant";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const question = isRecord(payload) && typeof payload.question === "string" ? payload.question : "";

  try {
    const result = await askPersonalKnowledge(question);
    if (result.status !== "ready") {
      if (result.status === "unauthenticated") return Response.json({ error: "unauthenticated" }, { status: 401 });
      if (result.status === "unconfigured") return Response.json({ error: "ai_not_configured" }, { status: 503 });
      return Response.json({ error: "no_matching_sources" }, { status: 404 });
    }
    return Response.json(result.answer, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof AssistantInputError) return Response.json({ error: "invalid_question", message: error.message }, { status: 400 });
    console.error("[ai assistant]", error);
    return Response.json({ error: error instanceof AIProviderError ? "ai_provider_unavailable" : "assistant_unavailable" }, { status: error instanceof AIProviderError ? 502 : 500 });
  }
}
