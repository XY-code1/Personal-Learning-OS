export type NavigationItem = {
  label: string;
  href: string;
  icon: string;
  description: string;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", description: "看见今天的学习全貌" },
  { label: "Inbox", href: "/inbox", icon: "inbox", description: "收集还未整理的想法" },
  { label: "Notes", href: "/notes", icon: "notes", description: "原始笔记与思考素材" },
  { label: "Knowledge", href: "/knowledge", icon: "knowledge", description: "整理后的可复用知识" },
  { label: "Explore / 探索", href: "/explore", icon: "explore", description: "探索你的 Knowledge Constellation" },
  { label: "Topics / Tags", href: "/topics", icon: "topics", description: "组织你的学习主题" },
  { label: "Projects", href: "/projects", icon: "projects", description: "把知识放进实践上下文" },
  { label: "Tasks", href: "/tasks", icon: "tasks", description: "下一步要完成的行动" },
  { label: "Experiments", href: "/experiments", icon: "experiments", description: "记录实践与验证结果" },
  { label: "Reflections", href: "/reflections", icon: "reflections", description: "追踪错误和认知变化" },
  { label: "Timeline", href: "/timeline", icon: "timeline", description: "回看学习事件和轨迹" },
  { label: "Global Search", href: "/search", icon: "search", description: "跨内容查找线索" },
  { label: "AI Assistant", href: "/ai", icon: "ai", description: "未来的个人知识助手" },
  { label: "Import / Export", href: "/import-export", icon: "transfer", description: "保持数据可迁移" },
];
