import { Settings } from "lucide-react";

import { ModuleEmptyPage } from "@/components/layout/module-empty-page";

export default function SettingsPage() {
  return <ModuleEmptyPage eyebrow="Workspace" title="Settings" description="管理个人资料、工作区偏好、数据迁移和未来的 AI 配置。" emptyTitle="工作区设置即将开放" emptyDescription="Phase 1 先建立工作区边界和配置入口，真实设置将在数据层接入后启用。" icon={Settings} secondaryNote="当前没有读取或修改任何外部账户信息。" />;
}
