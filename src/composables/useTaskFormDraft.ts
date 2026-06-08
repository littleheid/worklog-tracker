import { reactive, watch } from "vue";
import type { Task, TaskDraft } from "../types/task";

interface UseTaskFormDraftOptions {
  open: () => boolean;
  month: () => string;
  model: () => Task | null | undefined;
}

export function useTaskFormDraft(options: UseTaskFormDraftOptions) {
  const form = reactive<TaskDraft>({
    title: "",
    detail: "",
    month: options.month(),
    status: "todo",
    priority: "medium",
    dueDate: null,
    tags: []
  });

  watch(
    () => [options.open(), options.model(), options.month()],
    () => {
      form.title = options.model()?.title ?? "";
      form.detail = options.model()?.detail ?? "";
      form.month = options.model()?.month ?? options.month();
      form.status = options.model()?.status ?? "todo";
      form.priority = options.model()?.priority ?? "medium";
      form.dueDate = options.model()?.dueDate ?? null;
      form.tags = options.model()?.tags ?? [];
    },
    { immediate: true }
  );

  function toDraft(): TaskDraft {
    return {
      ...form,
      title: form.title.trim(),
      detail: form.detail.trim(),
      dueDate: form.dueDate || null
    };
  }

  return {
    form,
    toDraft
  };
}
