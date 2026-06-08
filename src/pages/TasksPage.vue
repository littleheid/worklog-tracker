<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import ConfirmModal from "../components/task/ConfirmModal.vue";
import TaskCard from "../components/task/TaskCard.vue";
import TaskFormModal from "../components/task/TaskFormModal.vue";
import MenuSelect from "../components/common/MenuSelect.vue";
import { useTasksPageInteractions } from "../composables/useTasksPageInteractions";
import { useTaskStore } from "../stores/taskStore";
import { useUiStore } from "../stores/uiStore";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, SORT_OPTIONS } from "../constants/task";
import { buildMonthOptions, buildYearOptions, monthToParts } from "../utils/date";
import type { Task } from "../types/task";

const taskStore = useTaskStore();
const uiStore = useUiStore();
const { t } = useI18n();
const { items, loading, pagination, query, saving } = storeToRefs(taskStore);

const {
  deleteMessage, deletingTask, editingTask, modalOpen,
  closeDeleteModal, closeFormModal, confirmDelete,
  handleExport, handleImport,
  handlePriorityFilterChange, handleSeedDemo, handleSortChange,
  handleStatusChange, handleStatusFilterChange,
  openCreateModal, openEditModal, submitTask
} = useTasksPageInteractions(taskStore as any, uiStore as any);

// 从其他页面点击 +Add 后自动打开新增弹窗
watch(() => uiStore.pendingCreate, (val) => {
  if (val) { uiStore.pendingCreate = false; openCreateModal(); }
}, { immediate: true });

// Click card → open edit modal directly
function onCardClick(task: Task) { openEditModal(task); }

// Compact filter
const monthParts = computed(() => monthToParts(query.value.month));
const yearOptions = computed(() => {
  const years = taskStore.availableMonths.map((m: string) => m.slice(0, 4));
  return buildYearOptions(undefined, [...years, monthParts.value.year]);
});
const monthOptions = computed(() => buildMonthOptions());
function updateYear(y: string) { taskStore.setQuery({ month: `${y}-${monthParts.value.month}` }); }
function updateMonth(m: string) { taskStore.setQuery({ month: `${monthParts.value.year}-${m}` }); }
function onKeywordInput(e: Event) { taskStore.setQuery({ keyword: (e.target as HTMLInputElement).value }); }
</script>

<template>
  <div class="mt-4 space-y-4">
    <!-- Compact Filter Bar -->
    <div class="glass rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2.5">
      <div class="flex items-center gap-2">
        <MenuSelect :model-value="monthParts.year" :options="yearOptions" compact :panel-columns="2" @update:model-value="updateYear" />
        <MenuSelect :model-value="monthParts.month" :options="monthOptions" compact :panel-columns="3" @update:model-value="updateMonth" />
      </div>
      <div class="h-5 w-px bg-stone-200/60 hidden md:block"></div>
      <div class="flex items-center gap-2">
        <MenuSelect :model-value="query.status" :options="STATUS_OPTIONS" compact @update:model-value="handleStatusFilterChange" />
        <MenuSelect :model-value="query.priority" :options="PRIORITY_OPTIONS" compact @update:model-value="handlePriorityFilterChange" />
        <MenuSelect :model-value="query.sortBy" :options="SORT_OPTIONS" compact @update:model-value="handleSortChange" />
      </div>
      <div class="h-5 w-px bg-stone-200/60 hidden md:block"></div>
      <input :value="query.keyword" type="text" :placeholder="t('search.placeholder')"
        class="input-glass h-8 flex-1 min-w-[140px] rounded-lg px-3 text-[13px] text-stone-800 placeholder:text-stone-400"
        @input="onKeywordInput" />
      <span class="badge-soft bg-white/60 text-stone-500 font-bold text-[12px]">{{ pagination.total }}</span>
      <button type="button" class="btn-accent inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[12px]" @click="openCreateModal">
        <span class="text-[14px] leading-none">+</span>
      </button>
    </div>

    <!-- Card Grid using TaskCard component -->
    <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 6" :key="i" class="skeleton-glass h-44 rounded-2xl"></div>
    </div>

    <div v-else-if="items.length === 0" class="glass rounded-2xl flex flex-col items-center justify-center py-20 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 11h6m-6 4h3m6 4H6a2 2 0 0 1-2-2V7.5A2.5 2.5 0 0 1 6.5 5H9l1.2 1.6c.38.5.97.8 1.6.8H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2Z" /></svg>
      </div>
      <h3 class="text-[18px] font-extrabold text-stone-800">{{ t("taskList.emptyTitle") }}</h3>
      <p class="mt-2 max-w-sm text-[14px] leading-5 text-stone-500">{{ t("taskList.emptyDesc") }}</p>
    </div>

    <div v-else class="stagger-list grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <TaskCard v-for="task in items" :key="task.id" :task="task" density="comfortable"
        @click="onCardClick" @edit="openEditModal" @delete="deletingTask = $event" @status-change="handleStatusChange" />
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="glass rounded-2xl px-4 py-3 flex items-center justify-between">
      <div class="text-[13px] font-semibold text-stone-500">{{ t("pagination.info", { total: pagination.total, page: pagination.page, totalPages: pagination.totalPages }) }}</div>
      <div class="flex items-center gap-1.5">
        <button type="button" class="btn-ghost inline-flex h-8 items-center rounded-lg px-3 text-[12px]" :disabled="pagination.page <= 1" @click="taskStore.setPage(pagination.page - 1)">{{ t("pagination.prev") }}</button>
        <button v-for="p in Math.min(pagination.totalPages, 5)" :key="p" type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold transition-all duration-200"
          :class="p === pagination.page ? 'btn-accent' : 'btn-ghost'" @click="taskStore.setPage(p)">{{ p }}</button>
        <button type="button" class="btn-ghost inline-flex h-8 items-center rounded-lg px-3 text-[12px]" :disabled="pagination.page >= pagination.totalPages" @click="taskStore.setPage(pagination.page + 1)">{{ t("pagination.next") }}</button>
      </div>
    </div>

    <!-- Form modal -->
    <TaskFormModal :open="modalOpen" :month="query.month" :saving="saving"
      :model="editingTask" @close="closeFormModal" @submit="submitTask" />

    <!-- Confirm -->
    <ConfirmModal :open="Boolean(deletingTask)" :title="'Delete task?'" :message="deleteMessage"
      @close="closeDeleteModal" @confirm="confirmDelete" />
  </div>
</template>
