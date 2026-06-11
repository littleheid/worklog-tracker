import { defineStore } from "pinia";
import { prefsApi, authApi, categoryApi } from "../repositories/api/taskApi";
import type { ActivePage, ListDensity, ToastItem, ToastKind } from "../types/ui";
import type { CategoryGroup } from "../types/task";
import type { Locale } from "../i18n";
import { i18n } from "../i18n";

export const useUiStore = defineStore("ui", {
  state: () => ({
    activePage: "dashboard" as ActivePage,
    listDensity: "comfortable" as ListDensity,
    locale: "zh-CN" as Locale,
    pendingCreate: false,
    showUnlockModal: false,
    isPasswordSet: false,
    isUnlocked: false,
    visibilityMode: "" as "" | "work" | "personal",
    categoryOptions: [] as CategoryGroup[],
    toasts: [] as ToastItem[]
  }),

  actions: {
    async initialize() {
      const [activePage, listDensity, locale, pwdStatus, cats] = await Promise.all([
        prefsApi.get<ActivePage>("activePage"),
        prefsApi.get<ListDensity>("listDensity"),
        prefsApi.get<Locale>("locale"),
        authApi.status().catch(() => ({ isSet: false })),
        categoryApi.getAll().catch(() => [] as CategoryGroup[])
      ]);
      if (activePage) this.activePage = activePage;
      if (listDensity) this.listDensity = listDensity;
      if (locale) { this.locale = locale; i18n.global.locale.value = locale; }
      this.isPasswordSet = pwdStatus.isSet;
      this.categoryOptions = cats;
    },

    async setActivePage(page: ActivePage) {
      this.activePage = page;
      await prefsApi.set("activePage", page);
    },

    async setDensity(mode: ListDensity) {
      this.listDensity = mode;
      await prefsApi.set("listDensity", mode);
    },

    async setLocale(locale: Locale) {
      this.locale = locale;
      i18n.global.locale.value = locale;
      await prefsApi.set("locale", locale);
    },

    pushToast(message: string, kind: ToastKind = "info") {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
      this.toasts.push({ id, message, kind });
      window.setTimeout(() => this.dismissToast(id), 2600);
    },

    dismissToast(id: string) {
      this.toasts = this.toasts.filter((item) => item.id !== id);
    },

    openUnlockModal() { this.showUnlockModal = true; },
    closeUnlockModal() { this.showUnlockModal = false; },

    lock() {
      this.isUnlocked = false;
      this.visibilityMode = "";
    },

    async unlock(password: string): Promise<boolean> {
      const result = await authApi.verifyPassword(password);
      if (result.ok) {
        this.isUnlocked = true;
        this.visibilityMode = "work";
        this.showUnlockModal = false;
        return true;
      }
      return false;
    },

    async setPassword(newPassword: string): Promise<boolean> {
      await authApi.setPassword("", newPassword);
      this.isPasswordSet = true;
      this.isUnlocked = true;
      this.visibilityMode = "work";
      this.showUnlockModal = false;
      return true;
    },

    setVisibilityMode(mode: "work" | "personal") {
      this.visibilityMode = mode;
    },

    async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
      await authApi.setPassword(oldPassword, newPassword);
      this.pushToast("密码已更新", "success");
      return true;
    },

    async refreshCategoryOptions() {
      const cats = await categoryApi.getAll().catch(() => [] as CategoryGroup[]);
      this.categoryOptions = cats;
    },

    async saveCategoryOptions(cats: CategoryGroup[]) {
      await categoryApi.save(cats);
      this.categoryOptions = cats;
    }
  }
});
