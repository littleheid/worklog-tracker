import { defineStore } from "pinia";
import { i18n } from "../i18n";
import { PAGE_SIZE_OPTIONS } from "../constants/task";
import { taskApi, prefsApi } from "../repositories/api/taskApi";
import type { DashboardStats, Task, TaskDraft, TaskPriority, TaskSortBy, TaskStatus } from "../types/task";
import { currentMonth, previousMonth } from "../utils/date";
import { useUiStore } from "./uiStore";

const t = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params as any);

const emptyDashboard: DashboardStats = {
  total: 0, done: 0, doing: 0, overdue: 0,
  statusDistribution: { todo: 0, doing: 0, done: 0, paused: 0 },
  priorityDistribution: { high: 0, medium: 0, low: 0 },
  recentUpdates: []
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const useTaskStore = defineStore("tasks", {
  state: () => ({
    initialized: false,
    loading: false,
    saving: false,
    recentLimit: 8,
    loadError: null as string | null,
    refreshToken: 0,
    availableMonths: [currentMonth()] as string[],
    items: [] as Task[],
    query: {
      month: currentMonth(),
      status: "all" as "all" | TaskStatus,
      priority: "all" as "all" | TaskPriority,
      keyword: "",
      sortBy: "updated_desc" as TaskSortBy,
      visibility: "" as "" | "work" | "personal",
      category: "",
      page: 1,
      pageSize: 10
    },
    pagination: {
      total: 0, page: 1, pageSize: 10, totalPages: 1,
      pageSizeOptions: PAGE_SIZE_OPTIONS.map((item) => Number(item.value))
    },
    stats: { total: 0, done: 0, undone: 0 },
    dashboard: emptyDashboard
  }),

  getters: {
    hasItems(state) { return state.pagination.total > 0; }
  },

  actions: {
    async initialize() {
      if (this.initialized) return;
      try {
        const [pageSize, rl] = await Promise.all([
          prefsApi.get<number>("pageSize"),
          prefsApi.get<number>("recentLimit")
        ]);
        if (pageSize && this.pagination.pageSizeOptions.includes(pageSize)) {
          this.query.pageSize = pageSize;
          this.pagination.pageSize = pageSize;
        }
        if (rl) this.recentLimit = rl;
        const refreshed = await this.refreshForQuery(
          { ...this.query },
          { errorPrefix: t("toast.initRefreshFailed", { message: "" }), notifyOnError: false }
        );
        this.initialized = refreshed;
      } catch (error) {
        const message = getErrorMessage(error, t("toast.unknownError"));
        this.loadError = message;
        useUiStore().pushToast(message, "error");
      }
    },

    async refreshForQuery(
      querySnapshot: {
        month: string; status: "all" | TaskStatus; priority: "all" | TaskPriority;
        keyword: string; sortBy: TaskSortBy; page: number; pageSize: number;
      },
      options: { errorPrefix?: string; notifyOnError?: boolean } = {}
    ) {
      const { errorPrefix = t("toast.listRefreshFailed", { message: "" }), notifyOnError = true } = options;
      const requestId = ++this.refreshToken;
      this.loading = true;
      this.loadError = null;

      try {
        const uiStore = useUiStore();
        const visibility = uiStore.visibilityMode || "";
        const [paged, stats, dashboard, availableMonths] = await Promise.all([
          taskApi.listPaged({ ...querySnapshot, visibility }),
          taskApi.monthlyStats(querySnapshot.month, visibility),
          taskApi.dashboardStats(querySnapshot.month, this.recentLimit, visibility),
          taskApi.listAvailableMonths()
        ]);

        if (requestId !== this.refreshToken) return false;

        this.items = paged.items;
        this.pagination = { ...this.pagination, total: paged.total, page: paged.page, pageSize: paged.pageSize, totalPages: paged.totalPages };
        this.query.page = paged.page;
        this.stats = stats;
        this.dashboard = dashboard;
        this.availableMonths = [...new Set([querySnapshot.month, ...availableMonths])].sort((l, r) => l < r ? 1 : l > r ? -1 : 0);
        return true;
      } catch (error) {
        if (requestId !== this.refreshToken) return false;
        const message = `${errorPrefix}${getErrorMessage(error, t("toast.unknownError"))}`;
        this.loadError = message;
        if (notifyOnError) useUiStore().pushToast(message, "error");
        return false;
      } finally {
        if (requestId === this.refreshToken) this.loading = false;
      }
    },

    async setQuery(patch: Partial<{
      month: string; status: "all" | TaskStatus; priority: "all" | TaskPriority;
      keyword: string; sortBy: TaskSortBy; page: number; pageSize: number;
      category?: string;
    }>) {
      const shouldResetPage = patch.page === undefined &&
        ["month","status","priority","keyword","sortBy","pageSize","category"].some(k => Object.prototype.hasOwnProperty.call(patch, k));
      const nextPage = patch.page ?? (shouldResetPage ? 1 : this.query.page);
      this.query = { ...this.query, ...patch, page: nextPage };
      if (patch.pageSize) await prefsApi.set("pageSize", patch.pageSize);
      await this.refreshForQuery({ ...this.query }, { errorPrefix: t("toast.listRefreshFailed", { message: "" }), notifyOnError: true });
    },

    async setPage(page: number) { await this.setQuery({ page }); },
    async setPageSize(pageSize: number) { await this.setQuery({ pageSize }); },

    async createTask(payload: TaskDraft) {
      this.saving = true;
      try {
        await taskApi.create(payload);
        const refreshed = await this.refreshForQuery({ ...this.query }, { errorPrefix: t("toast.createRefreshFailed"), notifyOnError: false });
        if (!refreshed) throw new Error(t("toast.createRefreshFailed"));
        useUiStore().pushToast(t("toast.taskCreated"), "success");
      } catch (error) {
        useUiStore().pushToast(t("toast.createFailed", { message: getErrorMessage(error, t("toast.unknownError")) }), "error");
        throw error;
      } finally { this.saving = false; }
    },

    async updateTask(id: string, payload: Partial<TaskDraft>) {
      this.saving = true;
      try {
        await taskApi.update(id, payload);
        const refreshed = await this.refreshForQuery({ ...this.query }, { errorPrefix: t("toast.updateRefreshFailed"), notifyOnError: false });
        if (!refreshed) throw new Error(t("toast.updateRefreshFailed"));
        useUiStore().pushToast(t("toast.taskUpdated"), "success");
      } catch (error) {
        useUiStore().pushToast(t("toast.updateFailed", { message: getErrorMessage(error, t("toast.unknownError")) }), "error");
        throw error;
      } finally { this.saving = false; }
    },

    async removeTask(id: string) {
      this.saving = true;
      try {
        await taskApi.delete(id);
        const refreshed = await this.refreshForQuery({ ...this.query }, { errorPrefix: t("toast.deleteRefreshFailed"), notifyOnError: false });
        if (!refreshed) throw new Error(t("toast.deleteRefreshFailed"));
        useUiStore().pushToast(t("toast.taskDeleted"), "success");
      } catch (error) {
        useUiStore().pushToast(t("toast.deleteFailed", { message: getErrorMessage(error, t("toast.unknownError")) }), "error");
        throw error;
      } finally { this.saving = false; }
    },

    async changeStatus(id: string, status: TaskStatus) { await this.updateTask(id, { status }); },

    async carryOverPreviousMonth() {
      try {
        const count = await taskApi.carryOver(previousMonth(this.query.month), this.query.month);
        const refreshed = await this.refreshForQuery({ ...this.query }, { errorPrefix: t("toast.carryFailed", { message: "" }), notifyOnError: false });
        if (!refreshed) throw new Error(t("toast.carryFailed", { message: "" }));
        if (count === 0) { useUiStore().pushToast(t("toast.noCarryItems"), "info"); return; }
        useUiStore().pushToast(t("toast.carriedOver", { count }), "success");
      } catch (error) {
        useUiStore().pushToast(t("toast.carryFailed", { message: getErrorMessage(error, t("toast.unknownError")) }), "error");
        throw error;
      }
    },

    async importJson(raw: unknown[], mode: "merge" | "replace") {
      try {
        const result = await taskApi.bulkImport(raw, mode);
        const refreshed = await this.refreshForQuery({ ...this.query }, { errorPrefix: t("toast.importFailed", { message: "" }), notifyOnError: false });
        if (!refreshed) throw new Error(t("toast.importFailed", { message: "" }));
        useUiStore().pushToast(t("toast.importDone", { imported: result.imported, skipped: result.skipped }), "success");
        return result;
      } catch (error) {
        useUiStore().pushToast(t("toast.importFailed", { message: getErrorMessage(error, t("toast.unknownError")) }), "error");
        throw error;
      }
    },

    async importDemoData() {
      try {
        const count = await taskApi.seedDemoData();
        const refreshed = await this.refreshForQuery({ ...this.query }, { errorPrefix: t("toast.seedFailed", { message: "" }), notifyOnError: false });
        if (!refreshed) throw new Error(t("toast.seedFailed", { message: "" }));
        if (count === 0) { useUiStore().pushToast(t("toast.seedExists"), "info"); return; }
        useUiStore().pushToast(t("toast.seedDone", { count }), "success");
      } catch (error) {
        useUiStore().pushToast(t("toast.seedFailed", { message: getErrorMessage(error, t("toast.unknownError")) }), "error");
        throw error;
      }
    },

    async exportJson() {
      try {
        const uiStore = useUiStore();
        return await taskApi.getAll(uiStore.visibilityMode || "");
      } catch (error) {
        useUiStore().pushToast(t("toast.exportFailed", { message: getErrorMessage(error, t("toast.unknownError")) }), "error");
        throw error;
      }
    }
  }
});
