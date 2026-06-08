import { computed, ref } from "vue";
import { downloadJson } from "../utils/export";
import type { Task, TaskDraft, TaskPriority, TaskSortBy, TaskStatus } from "../types/task";

interface TaskStoreActions {
  query: { month: string };
  saving: boolean;
  updateTask(id: string, payload: TaskDraft): Promise<void>;
  createTask(payload: TaskDraft): Promise<void>;
  removeTask(id: string): Promise<void>;
  importJson(items: unknown[], mode: "merge" | "replace"): Promise<{ imported: number; skipped: number }>;
  changeStatus(id: string, status: TaskStatus): Promise<void>;
  setQuery(patch: Partial<{ status: "all" | TaskStatus; priority: "all" | TaskPriority; sortBy: TaskSortBy }>): Promise<void>;
  exportJson(): Promise<unknown[]>;
  importDemoData(): Promise<void>;
}

interface UiStoreActions {
  pushToast(message: string, kind?: "success" | "error" | "info"): void;
}

export function useTasksPageInteractions(taskStore: TaskStoreActions, uiStore: UiStoreActions) {
  const editingTask = ref<Task | null>(null);
  const deletingTask = ref<Task | null>(null);
  const modalOpen = ref(false);

  const deleteMessage = computed(() => {
    if (!deletingTask.value) {
      return "";
    }
    return `删除后不可恢复：${deletingTask.value.title}`;
  });

  function openCreateModal() {
    editingTask.value = null;
    modalOpen.value = true;
  }

  function openEditModal(task: Task) {
    editingTask.value = task;
    modalOpen.value = true;
  }

  function closeFormModal() {
    modalOpen.value = false;
    editingTask.value = null;
  }

  function closeDeleteModal() {
    deletingTask.value = null;
  }

  async function submitTask(payload: TaskDraft) {
    if (editingTask.value) {
      await taskStore.updateTask(editingTask.value.id, payload);
    } else {
      await taskStore.createTask(payload);
    }
    closeFormModal();
  }

  async function confirmDelete() {
    if (!deletingTask.value) {
      return;
    }
    await taskStore.removeTask(deletingTask.value.id);
    closeDeleteModal();
  }

  async function handleImport(payload: { mode: "merge" | "replace"; items: unknown[] }) {
    await taskStore.importJson(payload.items, payload.mode);
  }

  async function handleStatusChange(payload: { id: string; status: TaskStatus }) {
    await taskStore.changeStatus(payload.id, payload.status);
  }

  function handleStatusFilterChange(value: string) {
    taskStore.setQuery({ status: value as "all" | TaskStatus });
  }

  function handlePriorityFilterChange(value: string) {
    taskStore.setQuery({ priority: value as "all" | TaskPriority });
  }

  function handleSortChange(value: string) {
    taskStore.setQuery({ sortBy: value as TaskSortBy });
  }

  async function handleExport() {
    const allTasks = await taskStore.exportJson();
    downloadJson(allTasks, `worklog-backup-${taskStore.query.month}.json`);
    uiStore.pushToast("JSON 已导出", "success");
  }

  async function handleSeedDemo() {
    await taskStore.importDemoData();
  }

  return {
    deleteMessage,
    deletingTask,
    editingTask,
    modalOpen,
    closeDeleteModal,
    closeFormModal,
    confirmDelete,
    handleExport,
    handleImport,
    handlePriorityFilterChange,
    handleSeedDemo,
    handleSortChange,
    handleStatusChange,
    handleStatusFilterChange,
    openCreateModal,
    openEditModal,
    submitTask
  };
}
