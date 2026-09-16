"use client";

import { AlertCircle, CheckCircle2, FileCheck2, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { createKnowledgeGapAction } from "@/server/cognitive/actions";
import { approveUnderstandingReviewAction } from "@/server/ai/actions";
import type { UnderstandingReview, UnderstandingReviewVerdict } from "@/types/ai-review";
import type { ActionResult, KnowledgeDetailSnapshot } from "@/types/records";

type ReviewState = { status: "idle" | "loading" } | { status: "error"; message: string } | { status: "ready"; data: UnderstandingReview };

const verdictLabels: Record<UnderstandingReviewVerdict, string> = {
  sound: "整体可靠",
  needs_revision: "需要修订",
  incomplete: "理解不完整",
  unclear: "暂时无法判断",
};

function isReview(value: unknown): value is UnderstandingReview {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<UnderstandingReview>;
  return item.kind === "understanding_review" && typeof item.knowledgeId === "string" && typeof item.knowledgeVersionId === "string" && typeof item.versionNo === "number" && typeof item.verdict === "string" && typeof item.confidence === "number" && Array.isArray(item.correctPoints) && Array.isArray(item.issues) && Array.isArray(item.missingPoints) && typeof item.suggestedRevision === "string";
}

function apiErrorMessage(code: string | undefined) {
  if (code === "ai_not_configured") return "AI Review 当前还没有配置服务端模型。请配置 AI_API_KEY、AI_BASE_URL 和 AI_MODEL_KEY 后重试。";
  if (code === "ai_provider_unavailable") return "AI Review 服务暂时不可用，请稍后重试。";
  if (code === "unauthenticated") return "登录状态已失效，请重新登录。";
  if (code === "not_found") return "这条 Understanding Version 不存在或不属于当前 Workspace。";
  return "AI Review 暂时无法完成，请稍后重试。";
}

function ReviewList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <section><p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">{title}</p>{items.length === 0 ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{empty}</p> : <ul className="mt-2 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-foreground/85"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />{item}</li>)}</ul>}</section>;
}

export function UnderstandingReview({ snapshot }: { snapshot: KnowledgeDetailSnapshot }) {
  const router = useRouter();
  const [versionId, setVersionId] = useState(snapshot.versions[0]?.id ?? "");
  const [state, setState] = useState<ReviewState>({ status: "idle" });
  const [revisedBody, setRevisedBody] = useState("");
  const [changeReason, setChangeReason] = useState("根据 AI Review 重新审视当前理解");
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  async function requestReview() {
    if (!versionId) return;
    setActionResult(null);
    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/knowledge/${snapshot.knowledge.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const payload = await response.json() as unknown;
      if (!response.ok || !isReview(payload)) {
        const code = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : undefined;
        throw new Error(apiErrorMessage(code));
      }
      setRevisedBody(payload.suggestedRevision);
      setState({ status: "ready", data: payload });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "AI Review 暂时无法完成，请稍后重试。" });
    }
  }

  function approveRevision(review: UnderstandingReview) {
    const form = new FormData();
    form.set("knowledge_id", review.knowledgeId);
    form.set("knowledge_version_id", review.knowledgeVersionId);
    form.set("base_version_no", String(review.versionNo));
    form.set("revised_body_markdown", revisedBody);
    form.set("change_reason", changeReason);
    setActionResult(null);
    startTransition(async () => {
      const result = await approveUnderstandingReviewAction(form);
      setActionResult(result);
      if (result.ok) router.refresh();
    });
  }

  function createGap(review: UnderstandingReview) {
    const form = new FormData();
    const issueText = review.issues.length ? `问题：\n${review.issues.map((item) => `- ${item}`).join("\n")}` : "问题：AI Review 未能确认这条理解足够完整。";
    const missingText = review.missingPoints.length ? `缺少：\n${review.missingPoints.map((item) => `- ${item}`).join("\n")}` : "";
    form.set("knowledge_id", review.knowledgeId);
    form.set("title", `AI Review：${review.issues[0] || "继续验证这条理解"}`.slice(0, 200));
    form.set("description", `${issueText}\n\n${missingText}`.trim().slice(0, 5000));
    form.set("gap_type", "concept");
    form.set("severity", review.verdict === "incomplete" ? "high" : "medium");
    form.set("status", "open");
    form.set("confidence", String(review.confidence));
    setActionResult(null);
    startTransition(async () => {
      const result = await createKnowledgeGapAction(form);
      setActionResult(result);
      if (result.ok) router.refresh();
    });
  }

  const selectedVersion = snapshot.versions.find((version) => version.id === versionId);
  return <Card className="border-primary/20 bg-[var(--surface-soft)]"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" />让 AI 检查我的理解</CardTitle><p className="max-w-2xl text-sm leading-6 text-muted-foreground">Review 只读取选中的 Understanding Version 和关联 Evidence，不会自动修改 Knowledge。</p></CardHeader><CardContent className="space-y-5">
    {snapshot.versions.length === 0 ? <EmptyState icon={FileCheck2} title="还没有 Understanding Version" description="先保存一条 Knowledge 理解版本，再让 AI 帮你检查。" /> : <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="grid min-w-0 flex-1 gap-1.5 text-xs font-semibold">选择要检查的版本<select value={versionId} onChange={(event) => { setVersionId(event.target.value); setState({ status: "idle" }); setActionResult(null); }} className="h-11 rounded-md border bg-background px-3.5 text-sm font-normal outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15">{snapshot.versions.map((version) => <option key={version.id} value={version.id}>Understanding V{version.version_no}</option>)}</select></label><Button type="button" onClick={requestReview} disabled={state.status === "loading" || !versionId}>{state.status === "loading" ? "检查中…" : "开始 Review"}<Lightbulb className="size-4" /></Button></div>
      {selectedVersion ? <p className="border-l-2 border-primary/35 pl-3 text-xs leading-5 text-muted-foreground">当前版本：{selectedVersion.body_markdown || selectedVersion.summary || selectedVersion.title}</p> : null}
      {state.status === "error" ? <div role="alert" className="flex gap-3 border-l-2 border-destructive/60 bg-destructive/5 p-4 text-sm leading-6 text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p>{state.message}</p></div> : null}
      {state.status === "ready" ? <ReviewProposal review={state.data} revisedBody={revisedBody} setRevisedBody={setRevisedBody} changeReason={changeReason} setChangeReason={setChangeReason} onApprove={() => approveRevision(state.data)} onCreateGap={() => createGap(state.data)} pending={isPending} actionResult={actionResult} /> : null}
    </>}
  </CardContent></Card>;
}

function ReviewProposal({ review, revisedBody, setRevisedBody, changeReason, setChangeReason, onApprove, onCreateGap, pending, actionResult }: { review: UnderstandingReview; revisedBody: string; setRevisedBody: (value: string) => void; changeReason: string; setChangeReason: (value: string) => void; onApprove: () => void; onCreateGap: () => void; pending: boolean; actionResult: ActionResult | null }) {
  const suggestedRevisionAvailable = revisedBody.trim().length > 0;
  return <div className="space-y-6 rounded-lg border border-border/70 bg-background/60 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">AI Review Proposal · Understanding V{review.versionNo}</p><p className="mt-2 text-lg font-semibold tracking-[-.03em]">{verdictLabels[review.verdict]}</p></div><span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">Confidence {Math.round(review.confidence * 100)}%</span></div><div className="grid gap-5 md:grid-cols-3"><ReviewList title="正确点" items={review.correctPoints} empty="AI 没有列出明确的正确点。" /><ReviewList title="问题" items={review.issues} empty="没有发现明确问题。" /><ReviewList title="缺少" items={review.missingPoints} empty="没有发现明显缺失。" /></div><section className="border-t border-border/70 pt-5"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden="true" /><p className="text-sm font-semibold">建议修订</p></div><p className="mt-1 text-xs leading-5 text-muted-foreground">你可以先编辑建议内容。它不会写入数据库，直到你明确确认创建新版本。</p><Textarea value={revisedBody} onChange={(event) => setRevisedBody(event.target.value)} maxLength={200000} className="mt-3 min-h-36 bg-background" aria-label="AI 建议的 Understanding 修订内容" placeholder="AI 没有给出修订内容" /></section><div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="grid gap-1.5 text-xs font-semibold">变化原因<input value={changeReason} onChange={(event) => setChangeReason(event.target.value)} maxLength={1000} className="h-10 rounded-md border bg-background px-3 text-sm font-normal outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15" /></label><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={onCreateGap} disabled={pending}><FileCheck2 className="size-4" />记录为 Knowledge Gap</Button><Button type="button" onClick={onApprove} disabled={pending || !suggestedRevisionAvailable}><CheckCircle2 className="size-4" />{pending ? "处理中…" : "确认创建新版本"}</Button></div></div>{actionResult ? <p role={actionResult.ok ? "status" : "alert"} className={actionResult.ok ? "text-xs text-emerald-700" : "text-xs text-destructive"}>{actionResult.message}</p> : null}</div>;
}
