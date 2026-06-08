import { PRIORITY_WEIGHT } from "../constants/task";
import type {
  DashboardStats,
  MonthlyStats,
  Task,
  TaskDraft,
  TaskPagedQuery,
  TaskPagedResult,
  TaskPriority,
  TaskQuery,
  TaskSortBy,
  TaskStatus
} from "../types/task";
import { currentMonth, isDateString, isMonthString, todayDateString } from "./date";

export function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function validateTaskInput(input: TaskDraft): void {
  const title = normalizeText(input.title);
  const detail = normalizeText(input.detail);

  if (!title) {
    throw new Error("标题不能为空");
  }
  if (title.length > 120) {
    throw new Error("标题不能超过 120 个字符");
  }
  if (detail.length > 2000) {
    throw new Error("内容不能超过 2000 个字符");
  }
  if (!isMonthString(input.month)) {
    throw new Error("月份格式必须为 YYYY-MM");
  }
  if (!["todo", "doing", "done", "paused"].includes(input.status)) {
    throw new Error("状态非法");
  }
  if (!["low", "medium", "high"].includes(input.priority)) {
    throw new Error("优先级非法");
  }
  if (!isDateString(input.dueDate)) {
    throw new Error("截止日期格式必须为 YYYY-MM-DD");
  }
}

export function normalizeTaskPatch(task: Task): Task {
  return {
    ...task,
    title: normalizeText(task.title),
    detail: normalizeText(task.detail),
    dueDate: task.dueDate ?? null,
    carryFrom: task.carryFrom ?? null,
    sourceTaskId: task.sourceTaskId ?? null
  };
}

export function filterTasks(tasks: Task[], query: TaskQuery): Task[] {
  const keyword = normalizeText(query.keyword).toLowerCase();

  return tasks.filter((task) => {
    if (query.month && task.month !== query.month) {
      return false;
    }
    if (query.status && query.status !== "all" && task.status !== query.status) {
      return false;
    }
    if (query.priority && query.priority !== "all" && task.priority !== query.priority) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return task.title.toLowerCase().includes(keyword) || task.detail.toLowerCase().includes(keyword);
  });
}

export function sortTasks(tasks: Task[], sortBy: TaskSortBy = "updated_desc"): Task[] {
  const items = [...tasks];
  items.sort((left, right) => {
    if (sortBy === "updated_asc") {
      return left.updatedAt - right.updatedAt;
    }
    if (sortBy === "created_desc") {
      return right.createdAt - left.createdAt;
    }
    if (sortBy === "due_asc") {
      const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return leftDue - rightDue || right.updatedAt - left.updatedAt;
    }
    if (sortBy === "priority_desc") {
      return PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority] || right.updatedAt - left.updatedAt;
    }
    return right.updatedAt - left.updatedAt;
  });
  return items;
}

export function paginateTasks(tasks: Task[], query: TaskPagedQuery): TaskPagedResult {
  const total = tasks.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * query.pageSize;

  return {
    items: tasks.slice(start, start + query.pageSize),
    total,
    page,
    pageSize: query.pageSize,
    totalPages
  };
}

export function monthlyStats(tasks: Task[], month: string): MonthlyStats {
  const monthItems = tasks.filter((task) => task.month === month);
  const done = monthItems.filter((task) => task.status === "done").length;
  return {
    total: monthItems.length,
    done,
    undone: monthItems.length - done
  };
}

export function dashboardStats(tasks: Task[], month: string): DashboardStats {
  const monthItems = tasks.filter((task) => task.month === month);
  const today = todayDateString();
  const total = monthItems.length;
  const done = monthItems.filter((task) => task.status === "done").length;
  const doing = monthItems.filter((task) => task.status === "doing").length;
  const overdue = monthItems.filter((task) => task.status !== "done" && task.dueDate !== null && task.dueDate < today).length;

  const statusDistribution: Record<TaskStatus, number> = {
    todo: 0,
    doing: 0,
    done: 0,
    paused: 0
  };
  const priorityDistribution: Record<TaskPriority, number> = {
    high: 0,
    medium: 0,
    low: 0
  };

  for (const task of monthItems) {
    statusDistribution[task.status] += 1;
    priorityDistribution[task.priority] += 1;
  }

  return {
    total,
    done,
    doing,
    overdue,
    statusDistribution,
    priorityDistribution,
    recentUpdates: sortTasks(monthItems, "updated_desc").slice(0, 5)
  };
}

export function normalizeImportedTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Partial<Task>;
  const now = Date.now();
  const title = normalizeText(item.title);
  const month = normalizeText(item.month);
  const status = normalizeText(item.status as string);
  const priority = normalizeText(item.priority as string);

  if (!title || !month || !status || !priority) {
    return null;
  }

  const normalized: Task = {
    id: normalizeText(item.id) || makeId(),
    title,
    detail: normalizeText(item.detail),
    month,
    status: status as TaskStatus,
    priority: priority as TaskPriority,
    dueDate: item.dueDate ?? null,
    carryFrom: item.carryFrom ?? null,
    sourceTaskId: item.sourceTaskId ?? null,
    createdAt: typeof item.createdAt === "number" ? item.createdAt : now,
    updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : now,
    tags: Array.isArray(item.tags) ? item.tags : []
  };

  try {
    validateTaskInput(normalized);
    return normalized;
  } catch {
    return null;
  }
}

export function createSeedTasks(): Task[] {
  const month = currentMonth();
  const previous = (() => {
    const [year, mm] = month.split("-").map(Number);
    const date = new Date(year, mm - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return currentMonth(date);
  })();
  const now = Date.now();

  const seeds: Array<Omit<Task, "id" | "createdAt" | "updatedAt">> = [
    {
      title: "跟进跨部门联调问题",
      detail: "收敛接口差异点并记录确认项，形成联调清单。",
      month, status: "paused", priority: "high",
      dueDate: `${month}-18`, carryFrom: null, sourceTaskId: null, tags: ["后端", "联调"]
    },
    {
      title: "验证导出备份流程",
      detail: "执行一次 JSON 导出并抽样核对关键字段。",
      month, status: "todo", priority: "low",
      dueDate: `${month}-08`, carryFrom: null, sourceTaskId: null, tags: ["工具", "测试"]
    },
    {
      title: "整理月度复盘素材",
      detail: "梳理本月上线项、延期项和风险事项，准备复盘会议。",
      month, status: "doing", priority: "medium",
      dueDate: `${month}-25`, carryFrom: null, sourceTaskId: null, tags: ["管理", "报告"]
    },
    {
      title: "结转上月未完成需求",
      detail: "核对上一月份遗留问题并安排新的截止时间。",
      month: previous, status: "todo", priority: "high",
      dueDate: `${previous}-28`, carryFrom: null, sourceTaskId: null, tags: ["结转"]
    }
  ];

  return seeds.map((seed, index) => ({
    ...seed,
    id: makeId(),
    createdAt: now - index * 3600_000,
    updatedAt: now - index * 1200_000
  }));
}
