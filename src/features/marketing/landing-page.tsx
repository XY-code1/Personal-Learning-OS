import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Check,
  CircleDot,
  FileText,
  FlaskConical,
  FolderKanban,
  GitBranch,
  Lightbulb,
  Menu,
  Search,
  Sparkles,
  Tag,
  Target,
} from "lucide-react";

import { Wordmark } from "@/components/brand/wordmark";
import { LandingMotion } from "@/features/marketing/landing-motion";
import { Reveal } from "@/features/marketing/landing-reveal";

const flow = [
  { label: "记录", english: "Capture", text: "留下正在发生的想法", icon: CircleDot },
  { label: "整理", english: "Organize", text: "让线索有一个可以回来的位置", icon: BookOpen },
  { label: "实践", english: "Practice", text: "把理解放进项目与实验", icon: FlaskConical },
  { label: "反思", english: "Reflect", text: "看见自己为什么改变", icon: Lightbulb },
  { label: "成长", english: "Grow", text: "让一次次修正连成路径", icon: GitBranch },
];

function LandingNav({ startHref }: { startHref: string }) {
  return (
    <header className="landing-header">
      <nav className="landing-nav" aria-label="公开页面导航">
        <Wordmark />
        <div className="landing-nav-links">
          <a href="#product">产品</a>
          <a href="#method">工作方式</a>
          <a href="#about">关于</a>
        </div>
        <div className="landing-nav-actions">
          <Link href="/login" className="landing-nav-login">登录</Link>
          <Link href={startHref} className="landing-nav-cta">开始使用</Link>
        </div>
        <details className="landing-mobile-menu">
          <summary aria-label="打开菜单"><Menu aria-hidden="true" /></summary>
          <div className="landing-mobile-popover">
            <a href="#product">产品</a>
            <a href="#method">工作方式</a>
            <a href="#about">关于</a>
            <Link href="/login">登录</Link>
            <Link href={startHref} className="landing-mobile-cta">开始使用</Link>
          </div>
        </details>
      </nav>
    </header>
  );
}

function WorkspacePreview() {
  return (
    <div className="workspace-preview-wrap">
      <div className="collage-note collage-note-top landing-parallax">今天先理解，不急着整理</div>
      <div className="collage-stroke collage-stroke-left" aria-hidden="true" />
      <div className="collage-node collage-node-right landing-parallax" aria-hidden="true"><span /><span /><span /></div>
      <div className="workspace-preview">
        <div className="workspace-topbar">
          <div className="workspace-brand"><span>P</span><strong>Personal Learning OS</strong></div>
          <div className="workspace-topbar-right"><span className="workspace-status"><i /> Saved just now</span><Search aria-hidden="true" /></div>
        </div>
        <div className="workspace-body">
          <aside className="workspace-sidebar">
            <div className="workspace-space-label">MY LEARNING SPACE</div>
            <div className="workspace-sidebar-group">
              <div className="workspace-sidebar-item is-active"><CircleDot aria-hidden="true" /> Overview</div>
              <div className="workspace-sidebar-item"><FileText aria-hidden="true" /> Notes <small>12</small></div>
              <div className="workspace-sidebar-item"><BookOpen aria-hidden="true" /> Knowledge <small>08</small></div>
              <div className="workspace-sidebar-item"><Lightbulb aria-hidden="true" /> Reflections <small>03</small></div>
              <div className="workspace-sidebar-item"><FolderKanban aria-hidden="true" /> Projects <small>02</small></div>
            </div>
            <div className="workspace-sidebar-footer"><Tag aria-hidden="true" /> Topics</div>
          </aside>
          <div className="workspace-main">
            <div className="workspace-heading">
              <div><p className="workspace-kicker">WEDNESDAY · 30 AUGUST</p><h3>继续昨天的学习</h3><p>从一条还没整理的想法开始</p></div>
              <button type="button" className="workspace-add-button">＋ 新记录</button>
            </div>
            <div className="workspace-grid">
              <article className="workspace-capture workspace-panel-wide">
                <div className="workspace-panel-label"><span className="workspace-icon workspace-icon-terracotta"><FileText aria-hidden="true" /></span><span>QUICK CAPTURE</span><span className="workspace-label-muted">⌘ K</span></div>
                <p className="workspace-capture-copy">记录一个刚刚出现的问题、观察或想法……</p>
                <div className="workspace-capture-line" />
              </article>
              <article className="workspace-card workspace-note-card">
                <div className="workspace-panel-label"><FileText aria-hidden="true" /><span>RECENT NOTE</span></div>
                <h4>关于「理解」的一点记录</h4>
                <p>复述一个概念，不代表真的能在项目里使用它。</p>
                <span className="workspace-tag">未整理</span>
              </article>
              <article className="workspace-card workspace-knowledge-card">
                <div className="workspace-panel-label"><BookOpen aria-hidden="true" /><span>KNOWLEDGE</span></div>
                <h4>检索不是理解</h4>
                <div className="workspace-knowledge-meter"><span style={{ width: "68%" }} /></div>
                <div className="workspace-card-footer"><span>掌握程度</span><strong>正在形成</strong></div>
              </article>
              <article className="workspace-card workspace-reflection-card">
                <div className="workspace-panel-label"><Lightbulb aria-hidden="true" /><span>REFLECTION</span><span className="workspace-label-muted">v2</span></div>
                <h4>检索到，不等于理解了</h4>
                <div className="workspace-version-line"><span>v1</span><i /><span className="is-current">v2</span><i /><span>v3</span></div>
                <div className="workspace-card-footer"><span>最近更新</span><strong>刚刚</strong></div>
              </article>
              <article className="workspace-card workspace-task-card">
                <div className="workspace-panel-label"><Target aria-hidden="true" /><span>NEXT TASK</span></div>
                <div className="workspace-task-row"><span className="workspace-checkbox"><Check aria-hidden="true" /></span><span>验证检索结果的引用边界</span></div>
                <div className="workspace-task-row muted"><span className="workspace-checkbox" /><span>记录一次失败样例</span></div>
              </article>
            </div>
          </div>
        </div>
      </div>
      <div className="collage-paper collage-paper-bottom landing-parallax" aria-hidden="true"><span>notes</span><span>ideas</span><span>practice</span></div>
    </div>
  );
}

function FlowSection() {
  return (
    <section id="method" className="landing-section landing-flow-section">
      <div className="landing-container">
        <Reveal className="landing-section-intro">
          <p className="landing-eyebrow">LEARNING FLOW</p>
          <h2>学习不止于笔记</h2>
          <p className="flow-intro-copy">一条记录如何变成可用的理解</p>
        </Reveal>
        <div className="learning-flow" aria-label="记录到成长的学习路径">
          {flow.map(({ label, english, text, icon: Icon }, index) => (
            <Reveal key={label} className="learning-flow-item" delay={index * 80}>
              <div className="learning-flow-top"><span className="learning-flow-icon"><Icon aria-hidden="true" /></span>{index < flow.length - 1 ? <span className="learning-flow-connector" aria-hidden="true" /> : null}</div>
              <p className="learning-flow-english">{english}</p>
              <h3>{label}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function NotesStory() {
  return (
    <section id="about" className="landing-story landing-story-notes">
      <div className="landing-container landing-story-grid">
        <Reveal className="landing-story-copy">
          <p className="landing-eyebrow">CAPTURE · NOTES</p>
          <h2>从一个念头开始</h2>
          <p className="note-materials">灵感　疑问　阅读摘录　课堂笔记</p>
          <p>先留下，再整理。记录不需要等到完美，重要的是让它之后还能被找回来。</p>
          <Link href="/register" className="landing-text-link">从一条笔记开始 <ArrowRight aria-hidden="true" /></Link>
        </Reveal>
        <Reveal className="story-visual story-note-visual" delay={120}>
          <div className="story-note-sheet note-product-preview">
            <div className="story-note-meta"><span>NOTE · UNSORTED</span><FileText aria-hidden="true" /></div>
            <h3>关于「理解」的一点记录</h3>
            <p>我发现自己经常收藏一个概念，却没有真正把它和已有知识连接起来。</p>
            <div className="story-note-tags"><span>#学习方法</span><span>#认知</span><span>待整理</span></div>
            <div className="note-preview-footer"><span>关联主题</span><strong>理解 · 检索 · 实践</strong></div>
            <div className="story-note-underline" aria-hidden="true" />
          </div>
          <div className="story-note-index">01 / 12</div>
        </Reveal>
      </div>
    </section>
  );
}

function ReflectionStory() {
  return (
    <section className="landing-reflection">
      <div className="landing-container landing-reflection-grid">
        <Reveal className="reflection-intro">
          <p className="landing-eyebrow">REFLECTION · 认知版本</p>
          <h2>看见认知的变化</h2>
          <p>好的知识系统 应该允许理解发生变化</p>
          <Link href="/register" className="landing-light-link">建立第一条 Reflection <ArrowRight aria-hidden="true" /></Link>
        </Reveal>
        <Reveal className="reflection-timeline" delay={140}>
          <div className="reflection-line" aria-hidden="true" />
          <div className="reflection-version is-first">
            <span className="reflection-dot" />
            <p><span className="reflection-date">03 / 12</span><span className="reflection-stage">最初理解</span></p>
            <h3>RAG 就是把资料放进向量数据库</h3>
            <small>把重点放在存储方式，忽略了检索上下文如何影响回答。</small>
            <span className="reflection-transition" aria-hidden="true">↓</span>
          </div>
          <div className="reflection-version is-current">
            <span className="reflection-dot" />
            <p><span className="reflection-date">04 / 08</span><span className="reflection-stage">实践之后</span></p>
            <h3>第一次做项目后发现 Chunking 会直接影响召回效果</h3>
            <small>开始记录失败样例、错误原因，以及下一次验证要做什么。</small>
            <span className="reflection-transition" aria-hidden="true">↓</span>
          </div>
          <div className="reflection-version">
            <span className="reflection-dot" />
            <p><span className="reflection-date">05 / 17</span><span className="reflection-stage">现在的理解</span></p>
            <h3>RAG 不只是向量数据库 而是一套检索与上下文构建流程</h3>
            <small>理解还在继续，下一步是在真实项目里验证这套工作假设。</small>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ProjectStory() {
  return (
    <section className="landing-projects">
      <div className="landing-container project-story-grid">
        <Reveal className="project-copy">
          <p className="landing-eyebrow">PRACTICE · PROJECTS</p>
          <h2>把理解带进实践</h2>
          <p>项目和实验会告诉你，哪些知识已经能用，哪些仍然只是熟悉的句子。</p>
          <Link href="/register" className="landing-text-link">连接一个项目 <ArrowRight aria-hidden="true" /></Link>
        </Reveal>
        <Reveal className="project-preview" delay={130}>
          <div className="project-preview-head">
            <div><p className="project-preview-kicker">PROJECT · IN PROGRESS</p><h3>RAG Learning Assistant</h3></div>
            <span className="project-status">进行中</span>
          </div>
          <div className="project-progress-label"><span>Progress</span><strong>72%</strong></div>
          <div className="project-progress"><span /></div>
          <div className="project-stats">
            <div><strong>12</strong><span>Knowledge</span></div>
            <div><strong>6</strong><span>Experiments</span></div>
            <div><strong>3</strong><span>Reflections</span></div>
          </div>
          <div className="project-experiment">
            <div className="project-experiment-meta"><span><FlaskConical aria-hidden="true" /> 最近实验</span><span>08 / 30</span></div>
            <h4>Chunk Size 500 <b>→</b> 800</h4>
            <div className="project-experiment-result"><span>Recall</span><strong>68% <b>→</b> 80%</strong></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const timelineEvents = [
  { date: "01 / 08", title: "第一次学习", text: "把问题放进 Inbox，给它一个可以继续的起点", icon: CircleDot },
  { date: "01 / 14", title: "记录笔记", text: "留下还没有整理完的想法和疑问", icon: FileText },
  { date: "02 / 02", title: "建立知识", text: "将重复出现的线索整理成可复用理解", icon: BookOpen },
  { date: "03 / 12", title: "做项目", text: "在真实上下文里验证知识是否真的能用", icon: FolderKanban },
  { date: "04 / 08", title: "发现错误", text: "记录失败样例、错误原因和下一次行动", icon: FlaskConical },
  { date: "05 / 17", title: "修改理解", text: "让新的认知版本接住之前留下的线索", icon: Lightbulb },
];

function TimelineStory() {
  return (
    <section className="landing-timeline-section">
      <div className="landing-container">
        <div className="timeline-heading">
          <p className="landing-eyebrow">TIMELINE · 学习事件</p>
          <h2>看见学习留下的轨迹</h2>
        </div>
        <div className="learning-timeline">
          <div className="timeline-line" aria-hidden="true" />
          {timelineEvents.map(({ date, title, text, icon: Icon }) => (
            <div key={title} className="timeline-event">
              <span className="timeline-marker"><Icon aria-hidden="true" /></span>
              <div className="timeline-event-copy"><p>{date}</p><h3>{title}</h3><span>{text}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiStory() {
  return (
    <section className="landing-ai">
      <div className="landing-container">
        <Reveal className="landing-ai-heading"><p className="landing-eyebrow">AI ASSISTANT · 后置能力</p><h2>让自己的知识回答你</h2><p>AI 建立在你的 Notes、Knowledge 和 Reflection 之上，并把引用放在回答旁边。</p></Reveal>
        <Reveal className="ai-window" delay={120}>
          <div className="ai-window-sidebar"><div className="ai-window-title"><Sparkles aria-hidden="true" /> Ask your archive</div><p>搜索你的个人知识库</p><div className="ai-query">我对 RAG 的理解发生过什么变化</div><div className="ai-scope"><span>搜索范围</span><strong>Notes + Knowledge + Reflection</strong></div></div>
          <div className="ai-answer"><div className="ai-answer-meta"><span className="ai-avatar">P</span><span>Personal Learning OS · Answer</span><span className="ai-answer-time">just now</span></div><p>你最初把 RAG 理解为把资料放进向量数据库，后来在实践中发现 Chunking 会影响召回效果。现在你把它理解为一套检索与上下文构建流程。</p><div className="ai-sources"><span>Sources</span><a href="#about"><FileText aria-hidden="true" /> 03 / 12 · RAG 初学笔记</a><a href="#about"><FlaskConical aria-hidden="true" /> 04 / 08 · RAG Experiment</a><a href="#about"><Lightbulb aria-hidden="true" /> 05 / 17 · Reflection</a></div></div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingPage({ startHref = "/register" }: { startHref?: string }) {
  return (
    <LandingMotion>
      <main className="landing-page">
        <LandingNav startHref={startHref} />
        <section id="product" className="landing-hero">
          <div className="hero-organic hero-organic-one" aria-hidden="true" />
          <div className="hero-organic hero-organic-two" aria-hidden="true" />
          <div className="landing-container hero-container">
            <div className="hero-copy">
              <p className="landing-eyebrow hero-eyebrow">Personal Learning OS · Knowledge Garden</p>
              <h1 className="hero-title"><span className="hero-title-line">让零散的思考</span><span className="hero-title-line hero-title-line-emphasis"><em>慢慢长成自己的知识</em></span></h1>
              <p className="hero-subtitle">记录想法　整理知识　投入实践　持续反思</p>
              <div className="hero-actions"><Link href={startHref} className="hero-primary">开始记录 <ArrowRight aria-hidden="true" /></Link><a href="#method" className="hero-secondary">看看它如何工作 <ArrowDownRight aria-hidden="true" /></a></div>
            </div>
            <WorkspacePreview />
          </div>
        </section>
        <FlowSection />
        <NotesStory />
        <ReflectionStory />
        <ProjectStory />
        <TimelineStory />
        <AiStory />
        <section className="landing-final-cta"><div className="landing-container"><Reveal><p className="landing-eyebrow">KEEP THE THREAD</p><h2>让学习真正留下来</h2><Link href={startHref} className="hero-primary">建立我的学习空间 <ArrowRight aria-hidden="true" /></Link></Reveal></div></section>
        <footer className="landing-footer"><div className="landing-container landing-footer-inner"><Wordmark inverse /><div className="landing-footer-links"><a href="#product">产品</a><a href="#method">工作方式</a><a href="#about">关于</a><Link href="/login">登录</Link></div><p>为长期学习保留线索</p></div></footer>
      </main>
    </LandingMotion>
  );
}
