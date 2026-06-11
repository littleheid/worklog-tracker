import type {
  CategoryGroup,
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
  if (q.visibility) params.set("visibility", q.visibility);
  if (q.category) params.set("category", q.category);
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

  async getAll(visibility = ""): Promise<Task[]> {
    const qs = visibility ? `?visibility=${encodeURIComponent(visibility)}` : "";
    return request(`${BASE}/tasks/export${qs}`);
  },

  async dashboardStats(month: string, recentLimit = 10, visibility = ""): Promise<DashboardStats> {
    return request(`${BASE}/dashboard?month=${encodeURIComponent(month)}&limit=${recentLimit}${visibility ? "&visibility=" + encodeURIComponent(visibility) : ""}`);
  },

  async monthlyStats(_month: string, visibility = ""): Promise<{ total: number; done: number; undone: number }> {
    const stats = await this.dashboardStats(_month, 8, visibility);
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

export const authApi = {
  async status(): Promise<{ isSet: boolean }> {
    return request(`${BASE}/auth/status`);
  },

  async verifyPassword(password: string): Promise<{ ok: boolean }> {
    return request(`${BASE}/auth/verify-password`, {
      method: "POST",
      body: JSON.stringify({ password })
    });
  },

  async setPassword(oldPassword: string, newPassword: string): Promise<{ ok: string }> {
    return request(`${BASE}/auth/set-password`, {
      method: "PUT",
      body: JSON.stringify({ oldPassword, newPassword })
    });
  }
};

export const categoryApi = {
  async getAll(): Promise<CategoryGroup[]> {
    return request(`${BASE}/categories`);
  },

  async save(categories: CategoryGroup[]): Promise<{ ok: string }> {
    return request(`${BASE}/categories`, {
      method: "PUT",
      body: JSON.stringify(categories)
    });
  }
};
