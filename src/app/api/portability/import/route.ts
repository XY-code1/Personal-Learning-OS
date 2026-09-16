import { importPortableFile, ImportValidationError } from "@/server/portability/import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ error: "file_required" }, { status: 400 });
    const result = await importPortableFile(file.name, await file.text());
    if ("status" in result) {
      return Response.json({ error: result.status === "unconfigured" ? "supabase_not_configured" : "unauthenticated" }, { status: result.status === "unconfigured" ? 503 : 401 });
    }
    return Response.json(result);
  } catch (error) {
    if (error instanceof ImportValidationError) return Response.json({ error: "invalid_import", message: error.message }, { status: 400 });
    console.error("[portability import]", error);
    return Response.json({ error: "import_failed" }, { status: 500 });
  }
}
