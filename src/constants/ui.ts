import type { PageMeta } from "../types/ui";

export const PAGE_META: Record<PageMeta["key"], PageMeta> = {
  dashboard: {
    key: "dashboard",
    navLabel: "统一面板",
    title: "统一面板",
    description: "聚合查看本月状态、逾期风险与最近更新。"
  },
  tasks: {
    key: "tasks",
    navLabel: "事项列表",
    title: "事项列表",
    description: "记录、筛选并维护每月工作事项与未完成项。"
  },
  insights: {
    key: "insights",
    navLabel: "数据洞察",
    title: "数据洞察",
    description: "按状态与优先级拆解任务分布，辅助月度复盘。"
  },
  settings: {
    key: "settings",
    navLabel: "设置",
    title: "设置",
    description: "个性化偏好，调整显示和行为选项。"
  }
};

export const PAGE_ORDER = [
  PAGE_META.dashboard,
  PAGE_META.tasks,
  PAGE_META.insights,
  PAGE_META.settings
] as const;
