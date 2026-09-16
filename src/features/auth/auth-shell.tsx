import Link from "next/link";
import { ArrowLeft, BookOpen, Lightbulb, MoveUpRight } from "lucide-react";

import { Wordmark } from "@/components/brand/wordmark";

type AuthMode = "login" | "register" | "forgot";

const formCopy: Record<AuthMode, { eyebrow: string; title: string; description: string }> = {
  login: { eyebrow: "YOUR PERSONAL LEARNING SPACE", title: "欢迎回来。", description: "继续你的学习。" },
  register: { eyebrow: "YOUR PERSONAL LEARNING SPACE", title: "建立你的学习空间。", description: "从今天开始记录。" },
  forgot: { eyebrow: "YOUR PERSONAL LEARNING SPACE", title: "找回你的学习空间。", description: "我们会把下一步发到你的邮箱。" },
};

export function AuthShell({ children, mode }: { children: React.ReactNode; mode: AuthMode }) {
  const copy = formCopy[mode];

  return (
    <main className="auth-page">
      <div className="auth-organic auth-organic-one" aria-hidden="true" />
      <div className="auth-organic auth-organic-two" aria-hidden="true" />
      <header className="auth-topbar">
        <Wordmark />
        <Link href="/" className="auth-home-link"><ArrowLeft aria-hidden="true" />回到首页</Link>
      </header>
      <div className="auth-layout">
        <section className="auth-story" aria-labelledby="auth-story-title">
          <div className="auth-story-inner">
            <p className="auth-eyebrow">YOUR PERSONAL LEARNING SPACE</p>
            <h1 id="auth-story-title">给想法一个<br /><em>长期的地方。</em></h1>
            <p className="auth-story-description">从一条记录开始，慢慢建立属于自己的知识体系。</p>
            <div className="auth-story-thread">
              <div><BookOpen aria-hidden="true" /><span>从原始笔记，走向真正可复用的理解。</span></div>
              <div><Lightbulb aria-hidden="true" /><span>记录观点如何改变，而不是覆盖过去。</span></div>
            </div>
          </div>
          <div className="auth-story-line" aria-hidden="true" />
          <p className="auth-story-quote">“今天的一个想法，也许会成为未来知识体系的一部分。”</p>
        </section>
        <section className="auth-form-region" aria-labelledby="auth-form-title">
          <div className="auth-form-heading">
            <p className="auth-eyebrow">{copy.eyebrow}</p>
            <h1 id="auth-form-title">{copy.title}</h1>
            <p>{copy.description}</p>
          </div>
          {children}
          <div className="auth-trust"><span>你的数据属于你的 Workspace。</span><MoveUpRight aria-hidden="true" /></div>
        </section>
      </div>
    </main>
  );
}
