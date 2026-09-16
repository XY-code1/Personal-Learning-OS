"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Brain, FileSearch, Lightbulb, MessageCircleQuestion, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import type { AssistantAnswer, AssistantSource } from "@/types/ai-assistant";

const capabilities = [
  { icon: FileSearch, title: "搜索个人资料", text: "从当前 Workspace 的笔记、知识、项目、Reflection 和 Timeline 中找上下文。" },
  { icon: Brain, title: "帮助整理理解", text: "基于已有记录总结，不把普通聊天里的猜测当成你的知识。" },
  { icon: Lightbulb, title: "观察认知变化", text: "回答会保留来源，方便回到原始记录继续判断。" },
];

function sourceHref(source: AssistantSource) {
  if (source.type === "knowledge") return "/knowledge/" + source.id;
  if (source.type === "timeline") return "/timeline";
  if (source.type === "project") return "/projects";
  if (source.type === "reflection") return "/reflections";
  return "/notes";
}

function sourceLabel(type: AssistantSource["type"]) {
  return { note: "Note", knowledge: "Knowledge", project: "Project", reflection: "Reflection", timeline: "Timeline" }[type];
}

export function AssistantWorkspace() {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setMessage("先写下一个想问自己的问题。");
      setAnswer(null);
      return;
    }
    setPending(true);
    setMessage(null);
    setAnswer(null);
    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion }),
      });
      const payload = await response.json() as { error?: string; message?: string; answer?: string; sources?: AssistantSource[] };
      if (!response.ok) {
        const errors: Record<string, string> = {
          ai_not_configured: "AI Provider 尚未配置",
          no_matching_sources: "当前 Workspace 没有找到相关记录",
          unauthenticated: "请先登录后再搜索个人知识",
          ai_provider_unavailable: "AI Provider 暂时不可用",
        };
        throw new Error(payload.message || errors[payload.error ?? ""] || "暂时无法回答，请稍后再试。");
      }
      setAnswer({ answer: payload.answer ?? "", sources: payload.sources ?? [] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "暂时无法回答，请稍后再试。");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-7">
      <Card className="overflow-hidden border-primary/15 bg-primary text-primary-foreground">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div><div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white/15"><Sparkles className="size-5" aria-hidden="true" /></div><h2 className="text-xl font-semibold tracking-tight">让自己的知识回答你</h2><p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/75">这是一个只读助手。它只会根据你的 Workspace 上下文回答，并返回可以回看的来源。</p></div>
          <ArrowRight className="hidden size-6 text-primary-foreground/60 sm:block" aria-hidden="true" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircleQuestion className="size-4 text-primary" />问问你的学习记录</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={ask} className="grid gap-3">
            <label htmlFor="assistant-question" className="text-xs font-semibold">你的问题</label>
            <Textarea id="assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="例如：我对 RAG 的理解发生过什么变化？" aria-describedby="assistant-help" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p id="assistant-help" className="text-xs text-muted-foreground">只读检索当前 Workspace 的真实记录，不会自动修改任何内容。</p>
              <Button type="submit" disabled={pending}>{pending ? "整理上下文…" : "开始回答"}<ArrowRight className="size-4" /></Button>
            </div>
          </form>
          {message ? <div className="mt-5"><EmptyState icon={Sparkles} title={message} description={message === "AI Provider 尚未配置" ? "请在服务端配置 AI_API_KEY 或 AI_PROVIDER_KEY，以及 AI_MODEL_KEY。配置后重新提问。" : "可以调整问题关键词，或先在 Notes、Knowledge 中记录更多上下文。"} className="min-h-40 rounded-lg" /></div> : null}
          {answer ? <section className="mt-6 grid gap-5 border-t pt-6" aria-live="polite"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary"><Sparkles className="size-3.5" />AI 回答</div><p className="whitespace-pre-wrap text-sm leading-7">{answer.answer}</p></div><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><FileSearch className="size-3.5" />Sources · {answer.sources.length}</div>{answer.sources.length === 0 ? <p className="text-xs text-muted-foreground">模型没有返回可验证来源，请重新提问。</p> : <div className="grid gap-2 sm:grid-cols-2">{answer.sources.map((source) => <Link key={source.id} href={sourceHref(source)} className="group rounded-lg border bg-muted/25 p-3 transition-colors hover:border-primary/30 hover:bg-accent/40"><div className="flex items-start justify-between gap-3"><div><p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">{sourceLabel(source.type)}</p><p className="mt-1 text-sm font-semibold">{source.title}</p></div><ArrowRight className="mt-0.5 size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></div>{source.excerpt ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{source.excerpt}</p> : null}</Link>)}</div>}</div></section> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">{capabilities.map(({ icon: Icon, title, text }) => <Card key={title}><CardHeader><div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" aria-hidden="true" /></div><CardTitle className="mt-3">{title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{text}</p></CardContent></Card>)}</div>
    </div>
  );
}
