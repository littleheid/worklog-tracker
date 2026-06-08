import { defineStore } from "pinia";
import { prefsApi } from "../repositories/api/taskApi";
import type { ActivePage, ListDensity, ToastItem, ToastKind } from "../types/ui";
import type { Locale } from "../i18n";
import { i18n } from "../i18n";

export const useUiStore = defineStore("ui", {
  state: () => ({
    activePage: "dashboard" as ActivePage,
    listDensity: "comfortable" as ListDensity,
    locale: "zh-CN" as Locale,
    pendingCreate: false,
    toasts: [] as ToastItem[]
  }),

  actions: {
    async initialize() {
      const [activePage, listDensity, locale] = await Promise.all([
        prefsApi.get<ActivePage>("activePage"),
        prefsApi.get<ListDensity>("listDensity"),
        prefsApi.get<Locale>("locale")
      ]);
      if (activePage) this.activePage = activePage;
      if (listDensity) this.listDensity = listDensity;
      if (locale) { this.locale = locale; i18n.global.locale.value = locale; }
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
    }
  }
});
