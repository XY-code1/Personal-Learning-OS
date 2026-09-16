"use client";

import { useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, FileJson, FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ImportResult = { ok: boolean; message: string; details?: string };

export function ImportExportWorkspace() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setResult({ ok: false, message: "请选择一个 Markdown、TXT 或 JSON 文件。" });
      return;
    }
    setPending(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/portability/import", { method: "POST", body: formData });
      const payload = await response.json() as { error?: string; message?: string; imported?: Array<{ table: string; count: number }>; noteTitle?: string };
      if (!response.ok) throw new Error(payload.message || (payload.error === "unauthenticated" ? "请先登录后再导入。" : "导入失败，请检查文件格式。"));
      const details = payload.noteTitle
        ? "已新增 Note「" + payload.noteTitle + "」。"
        : (payload.imported ?? []).map((item) => item.table + " " + item.count).join(" · ");
      setResult({ ok: true, message: "导入完成。", details });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : "导入失败，请稍后再试。" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><ArrowUpFromLine className="size-5" aria-hidden="true" /></div>
          <CardTitle className="mt-3">导入数据</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">Markdown 和 TXT 会作为新的 Note 保存。Personal Learning OS JSON 会按原始 ID、版本和关系追加导入，不会覆盖已有记录。</p>
          <form onSubmit={handleImport} className="mt-6 grid gap-3">
            <label htmlFor="portable-file" className="grid gap-2 text-xs font-semibold">
              选择文件
              <input ref={inputRef} id="portable-file" type="file" accept=".md,.markdown,.txt,.json,application/json,text/markdown,text/plain" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="flex h-auto w-full cursor-pointer rounded-md border bg-background px-3 py-2 text-xs outline-none file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15" />
            </label>
            <p className="text-xs leading-5 text-muted-foreground">{file ? "已选择：" + file.name : "单个文件最多 8 MB。JSON 导入最多 2000 条记录。"}</p>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending || !file}>{pending ? "导入中…" : "导入到当前 Workspace"}<Upload className="size-4" /></Button>
              {result ? <p role={result.ok ? "status" : "alert"} className={result.ok ? "text-xs text-emerald-700" : "text-xs text-destructive"}>{result.message}{result.details ? " " + result.details : ""}</p> : null}
            </div>
          </form>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><FileText className="size-3.5" aria-hidden="true" />Markdown / TXT → Note</span><span className="inline-flex items-center gap-2"><FileJson className="size-3.5" aria-hidden="true" />JSON → 完整迁移</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><ArrowDownToLine className="size-5" aria-hidden="true" /></div>
          <CardTitle className="mt-3">导出数据</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">导出只读取当前 Workspace。JSON 保留实体、版本、稳定 ID 和关系；Markdown 生成可读的学习资料副本。</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" render={<a href="/api/portability/export?format=markdown" />}><FileText className="size-4" />导出 Markdown</Button>
            <Button variant="outline" render={<a href="/api/portability/export?format=json" />}><FileJson className="size-4" />导出 JSON</Button>
          </div>
          <div className="mt-7 border-t border-[var(--line-soft)] pt-5 text-xs leading-5 text-muted-foreground"><p className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-700" aria-hidden="true" />不导出 auth.users 和服务端密钥</p><p className="mt-2">JSON 是完整迁移格式，Markdown 适合阅读、编辑和长期保存。</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
