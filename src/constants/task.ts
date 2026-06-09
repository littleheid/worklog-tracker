import type { TaskPriority } from "../types/task";

// 保留：被 store/composable 引用
export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const PAGE_SIZE_OPTIONS = [
  { label: "10 / 页", value: "10" },
  { label: "20 / 页", value: "20" },
  { label: "50 / 页", value: "50" },
] as const;
