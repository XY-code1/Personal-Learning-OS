"use client";

import { Clock3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { TimelineEventItem } from "@/types/records";

const eventLabels: Record<string, string> = {
  note_created: "新增笔记",
  note_updated: "更新笔记",
  note_archived: "归档笔记",
  knowledge_created: "新增知识",
  knowledge_updated: "更新知识",
  knowledge_archived: "归档知识",
  knowledge_review_approved: "确认 AI Review 建议",
  reflection_created: "新增 Reflection",
  evidence_added: "添加 Evidence",
  knowledge_gap_created: "发现 Knowledge Gap",
  knowledge_task_linked: "关联 Next Action",
  task_created: "创建任务",
  task_updated: "更新任务",
  task_completed: "完成任务",
  task_archived: "归档任务",
};

const filters = [
  { key: "all", label: "全部" },
  { key: "note", label: "笔记" },
  { key: "knowledge", label: "知识" },
  { key: "task", label: "任务" },
  { key: "reflection", label: "Reflection" },
  { key: "other", label: "其他" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

function eventCategory(event: TimelineEventItem): FilterKey {
  if (event.entity_type === "note") return "note";
  if (event.entity_type === "knowledge") return "knowledge";
  if (event.entity_type === "task") return "task";
  if (event.entity_type === "reflection") return "reflection";
  return "other";
}

function eventHref(event: TimelineEventItem): string | null {
  if (event.entity_type === "knowledge") return "/knowledge/" + event.entity_id;
  if (event.entity_type === "note") return "/notes";
  if (event.entity_type === "task") return "/tasks";
  return null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
}

export function TimelineWorkspace({ events }: { events: TimelineEventItem[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const visible = filter === "all" ? events : events.filter((event) => eventCategory(event) === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="按类型筛选时间线">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filter === item.key ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title={events.length === 0 ? "时间线还没有事件" : "这个分类下还没有事件"}
          description={events.length === 0 ? "当你开始记录和实践，重要的创建、完成、复盘和版本变化会汇聚到这里。" : "换个分类看看，或先创建一条记录。"}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((event) => {
            const href = eventHref(event);
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="mt-1 text-[0.68rem] text-muted-foreground">{eventLabels[event.event_type] ?? event.event_type} · {formatDate(event.occurred_at)}</p>
                  </div>
                  {href ? <span className="shrink-0 text-xs font-semibold text-primary">查看</span> : null}
                </div>
                {event.summary ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.summary}</p> : null}
              </>
            );
            const className = "block rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/35";
            return href ? (
              <Link key={event.id} href={href} className={className}>{content}</Link>
            ) : (
              <div key={event.id} className={className}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
