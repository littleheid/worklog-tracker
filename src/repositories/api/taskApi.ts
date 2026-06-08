import type {
  DashboardStats,
  Task,
  TaskDraft,
  TaskPagedQuery,
  TaskPagedResult,
  TaskQuery
} from "../../types/task";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json();
}

function buildQuery(q: TaskQuery | TaskPagedQuery): string {
  const params = new URLSearchParams();
  if (q.month) params.set("month", q.month);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.priority && q.priority !== "all") params.set("priority", q.priority);
  if (q.keyword) params.set("keyword", q.keyword);
  if (q.sortBy) params.set("sortBy", q.sortBy);
  if ("page" in q && q.page) params.set("page", String(q.page));
  if ("pageSize" in q && q.pageSize) params.set("pageSize", String(q.pageSize));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const taskApi = {
  async listPaged(query: TaskPagedQuery): Promise<TaskPagedResult> {
    return request(`${BASE}/tasks${buildQuery(query)}`);
  },

  async getById(id: string): Promise<Task> {
    return request(`${BASE}/tasks/${id}`);
  },

  async create(input: TaskDraft): Promise<Task> {
    return request(`${BASE}/tasks`, { method: "POST", body: JSON.stringify(input) });
  },

  async update(id: string, input: Partial<TaskDraft>): Promise<Task> {
    return request(`${BASE}/tasks/${id}`, { method: "PUT", body: JSON.stringify(input) });
  },

  async delete(id: string): Promise<void> {
    await request(`${BASE}/tasks/${id}`, { method: "DELETE" });
  },

  async getAll(): Promise<Task[]> {
    return request(`${BASE}/tasks/export`);
  },

  async dashboardStats(month: string, recentLimit = 10): Promise<DashboardStats> {
    return request(`${BASE}/dashboard?month=${encodeURIComponent(month)}&limit=${recentLimit}`);
  },

  async monthlyStats(_month: string): Promise<{ total: number; done: number; undone: number }> {
    const stats = await this.dashboardStats(_month);
    return { total: stats.total, done: stats.done, undone: stats.total - stats.done };
  },

  async listAvailableMonths(): Promise<string[]> {
    return request(`${BASE}/months`);
  },

  async carryOver(fromMonth: string, toMonth: string): Promise<number> {
    const res = await request<{ count: number }>(`${BASE}/tasks/carry-over`, {
      method: "POST",
      body: JSON.stringify({ fromMonth, toMonth })
    });
    return res.count;
  },

  async bulkImport(items: unknown[], mode: "merge" | "replace"): Promise<{ imported: number; skipped: number }> {
    return request(`${BASE}/tasks/import`, {
      method: "POST",
      body: JSON.stringify({ items, mode })
    });
  },

  async seedDemoData(): Promise<number> {
    const res = await request<{ count: number }>(`${BASE}/tasks/seed`, { method: "POST" });
    return res.count;
  }
};

export const prefsApi = {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const res = await request<{ key: string; value: string }>(`${BASE}/prefs/${key}`);
      return JSON.parse(res.value) as T;
    } catch {
      return undefined;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    await request(`${BASE}/prefs/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value: JSON.stringify(value) })
    });
  }
};
