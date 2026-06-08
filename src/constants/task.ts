import type { TaskPriority, TaskSortBy, TaskStatus } from "../types/task";

export const DB_NAME = "worklog_db";
export const DB_VERSION = 2;
export const TASK_STORE = "tasks";
export const UI_PREFS_STORE = "ui_prefs";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "未开始",
  doing: "进行中",
  done: "已完成",
  paused: "搁置"
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "低",
  medium: "中",
  high: "高"
};

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1
};

export const STATUS_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "未开始", value: "todo" },
  { label: "进行中", value: "doing" },
  { label: "已完成", value: "done" },
  { label: "搁置", value: "paused" }
] as const;

export const PRIORITY_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "高", value: "high" },
  { label: "中", value: "medium" },
  { label: "低", value: "low" }
] as const;

export const TASK_STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  label,
  value: value as TaskStatus
}));

export const TASK_PRIORITY_OPTIONS = Object.entries(PRIORITY_LABEL).map(([value, label]) => ({
  label,
  value: value as TaskPriority
}));

export const SORT_OPTIONS: Array<{ label: string; value: TaskSortBy }> = [
  { label: "最近更新", value: "updated_desc" },
  { label: "最早更新", value: "updated_asc" },
  { label: "创建时间", value: "created_desc" },
  { label: "截止时间", value: "due_asc" },
  { label: "优先级", value: "priority_desc" }
];

export const PAGE_SIZE_OPTIONS = [
  { label: "10 / 页", value: "10" },
  { label: "20 / 页", value: "20" },
  { label: "50 / 页", value: "50" }
] as const;
