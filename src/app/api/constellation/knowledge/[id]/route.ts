import { getKnowledgeInspector } from "@/server/constellation/queries";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "invalid_id" }, { status: 400 });

  try {
    const result = await getKnowledgeInspector(id);
    if ("status" in result) {
      if (result.status === "not_found") return Response.json({ error: "not_found" }, { status: 404 });
      if (result.status === "unauthenticated") return Response.json({ error: "unauthenticated" }, { status: 401 });
      return Response.json({ error: "unconfigured" }, { status: 503 });
    }
    return Response.json(result);
  } catch (error) {
    console.error("[constellation inspector]", error);
    return Response.json({ error: "inspector_unavailable" }, { status: 500 });
  }
}
