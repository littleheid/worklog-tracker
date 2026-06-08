export type ActivePage = "dashboard" | "tasks" | "insights" | "settings";
export type ListDensity = "compact" | "comfortable";
export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

export interface PageMeta {
  key: ActivePage;
  navLabel: string;
  title: string;
  description: string;
}
