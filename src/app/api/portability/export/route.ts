import { createMarkdownExport, getWorkspaceExport } from "@/server/portability/export";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "markdown") {
    return Response.json({ error: "unsupported_format" }, { status: 400 });
  }

  try {
    const result = await getWorkspaceExport();
    if (result.status !== "ready") {
      return Response.json({ error: result.status === "unconfigured" ? "supabase_not_configured" : "unauthenticated" }, { status: result.status === "unconfigured" ? 503 : 401 });
    }

    if (format === "markdown") {
      return new Response(createMarkdownExport(result.snapshot), {
        headers: {
          "content-type": "text/markdown; charset=utf-8",
          "content-disposition": "attachment; filename=\"personal-learning-os.md\"",
          "cache-control": "no-store",
        },
      });
    }

    return new Response(JSON.stringify(result.snapshot, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": "attachment; filename=\"personal-learning-os.json\"",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[portability export]", error);
    return Response.json({ error: "export_failed" }, { status: 500 });
  }
}
