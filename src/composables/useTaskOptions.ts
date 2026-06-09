import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { TaskPriority, TaskSortBy, TaskStatus } from "../types/task";

export function useTaskOptions() {
  const { t } = useI18n();

  const statusLabel = computed<Record<TaskStatus, string>>(() => ({
    todo: t("status.todo"),
    doing: t("status.doing"),
    done: t("status.done"),
    paused: t("status.paused"),
  }));

  const priorityLabel = computed<Record<TaskPriority, string>>(() => ({
    high: t("priority.high"),
    medium: t("priority.medium"),
    low: t("priority.low"),
  }));

  const statusOptions = computed(() => [
    { label: t("filter.all"), value: "all" as const },
    { label: t("status.todo"), value: "todo" as const },
    { label: t("status.doing"), value: "doing" as const },
    { label: t("status.done"), value: "done" as const },
    { label: t("status.paused"), value: "paused" as const },
  ]);

  const priorityOptions = computed(() => [
    { label: t("filter.all"), value: "all" as const },
    { label: t("priority.high"), value: "high" as const },
    { label: t("priority.medium"), value: "medium" as const },
    { label: t("priority.low"), value: "low" as const },
  ]);

  const taskStatusOptions = computed(() => [
    { label: t("status.todo"), value: "todo" as TaskStatus },
    { label: t("status.doing"), value: "doing" as TaskStatus },
    { label: t("status.done"), value: "done" as TaskStatus },
    { label: t("status.paused"), value: "paused" as TaskStatus },
  ]);

  const taskPriorityOptions = computed(() => [
    { label: t("priority.high"), value: "high" as TaskPriority },
    { label: t("priority.medium"), value: "medium" as TaskPriority },
    { label: t("priority.low"), value: "low" as TaskPriority },
  ]);

  const sortOptions = computed<Array<{ label: string; value: TaskSortBy }>>(() => [
    { label: t("sort.updated_desc"), value: "updated_desc" },
    { label: t("sort.updated_asc"), value: "updated_asc" },
    { label: t("sort.created_desc"), value: "created_desc" },
    { label: t("sort.due_asc"), value: "due_asc" },
    { label: t("sort.priority_desc"), value: "priority_desc" },
  ]);

  const pageSizeOptions = computed(() => [
    { label: `10 ${t("filter.perPage")}`, value: "10" },
    { label: `20 ${t("filter.perPage")}`, value: "20" },
    { label: `50 ${t("filter.perPage")}`, value: "50" },
  ]);

  return {
    statusLabel,
    priorityLabel,
    statusOptions,
    priorityOptions,
    taskStatusOptions,
    taskPriorityOptions,
    sortOptions,
    pageSizeOptions,
  };
}
