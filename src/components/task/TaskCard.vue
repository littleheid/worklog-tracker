<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTaskOptions } from "../../composables/useTaskOptions";
import type { Task, TaskStatus } from "../../types/task";
import { formatDateTime } from "../../utils/date";
import MenuSelect from "../common/MenuSelect.vue";

const props = defineProps<{ task: Task; density: "compact" | "comfortable"; }>();
const emit = defineEmits<{
  edit: [task: Task]; delete: [task: Task];
  "status-change": [payload: { id: string; status: TaskStatus }];
  click: [task: Task];
}>();
const { t } = useI18n();
const { taskStatusOptions } = useTaskOptions();

const statusDot = computed(() => {
  const m: Record<string, string> = { todo: "bg-amber-400", doing: "bg-blue-400", done: "bg-emerald-400", paused: "bg-stone-300" };
  return m[props.task.status] ?? "bg-stone-300";
});
const priorityLabel = computed(() => {
  const m: Record<string, string> = { high: "text-red-600", medium: "text-amber-600", low: "text-emerald-600" };
  return m[props.task.priority] ?? "";
});
const dueInfo = computed(() => {
  if (!props.task.dueDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  const due = props.task.dueDate;
  if (props.task.status === 'done') return { style: 'bg-stone-100/70 text-stone-500', label: 'Due' };
  if (due < today) return { style: 'bg-red-100/80 text-red-700 shadow-sm', label: 'Overdue' };
  if (due === today) return { style: 'bg-amber-100/80 text-amber-800 shadow-sm', label: 'Today' };
  return { style: 'bg-amber-50/70 text-amber-700', label: 'Due' };
});

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) { hash = ((hash << 5) - hash) + tag.charCodeAt(i); hash |= 0; }
  return `tag-${Math.abs(hash) % 8}`;
}
</script>

<template>
  <article class="glass card-lift rounded-2xl px-5 py-4 group cursor-pointer flex flex-col" @click="emit('click', task)">
    <!-- 主内容区 -->
    <div class="flex-1">
    <!-- 状态 + 时间（始终可见） -->
    <div class="flex items-center justify-between mb-1.5">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="statusDot"></span>
        <span class="text-[13px] font-semibold text-stone-600">{{ t(`status.${task.status}`) }}</span>
        <span class="text-[12px] font-medium" :class="priorityLabel">&middot; {{ t(`priority.${task.priority}`) }}</span>
      </div>
      <span class="text-[11px] text-stone-400 shrink-0">{{ formatDateTime(task.updatedAt) }}</span>
    </div>

    <!-- 标题 -->
    <h3 class="text-[17px] font-bold text-stone-800 leading-7 line-clamp-2">{{ task.title }}</h3>

    <!-- 描述 -->
    <p class="mt-2 whitespace-pre-line text-[14px] leading-6 text-stone-500">
      {{ task.detail || t("taskCard.noDescription") }}
    </p>

    <!-- 截止日期 + 标签 -->
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <span v-if="dueInfo" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold" :class="dueInfo.style">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" /></svg>
        {{ dueInfo.label }} {{ task.dueDate }}
      </span>
      <span v-if="task.carryFrom" class="text-[12px] text-stone-400">&middot; {{ t("taskCard.from") }} {{ task.carryFrom }}</span>
      <span v-for="tag in (task.tags ?? [])" :key="tag"
        class="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold"
        :class="tagColor(tag)" style="border-color: currentColor; border-opacity: 0.25; background: transparent;">
        {{ tag }}
      </span>
    </div>

    </div>

    <!-- 操作栏（hover 显示，始终占位） -->
    <div class="mt-3 pt-3 border-t border-white/20 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <MenuSelect :model-value="task.status" :options="taskStatusOptions" compact align="left"
        :panel-title="t('taskCard.changeStatus')"
        @update:model-value="emit('status-change', { id: task.id, status: $event as TaskStatus })" />
      <button type="button"
        class="btn-ghost inline-flex h-7 items-center rounded-lg px-2.5 text-[11px] font-semibold"
        @click.stop="emit('edit', task)">
        {{ t("taskCard.edit") }}
      </button>
      <button type="button"
        class="inline-flex h-7 items-center rounded-lg bg-red-50/80 px-2.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
        @click.stop="emit('delete', task)">
        {{ t("taskCard.delete") }}
      </button>
    </div>
  </article>
</template>
