export type TaskStatus = "todo" | "doing" | "done" | "paused";
export type TaskPriority = "low" | "medium" | "high";
export type TaskSortBy =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "due_asc"
  | "priority_desc";

export interface Task {
  id: string;
  title: string;
  detail: string;
  month: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  carryFrom: string | null;
  sourceTaskId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TaskDraft {
  title: string;
  detail: string;
  month: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  carryFrom?: string | null;
  sourceTaskId?: string | null;
  tags?: string[];
}

export interface TaskQuery {
  month?: string;
  status?: "all" | TaskStatus;
  priority?: "all" | TaskPriority;
  keyword?: string;
  sortBy?: TaskSortBy;
}

export interface TaskPagedQuery extends TaskQuery {
  page: number;
  pageSize: number;
}

export interface TaskPagedResult {
  items: Task[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MonthlyStats {
  total: number;
  done: number;
  undone: number;
}

export interface TaskSummaryStats {
  total: number;
  done: number;
  undone: number;
}

export interface DashboardStats {
  total: number;
  done: number;
  doing: number;
  overdue: number;
  statusDistribution: Record<TaskStatus, number>;
  priorityDistribution: Record<TaskPriority, number>;
  recentUpdates: Task[];
}

export interface UiPrefs {
  activePage?: "dashboard" | "tasks" | "insights";
  listDensity?: "compact" | "comfortable";
  pageSize?: number;
}
