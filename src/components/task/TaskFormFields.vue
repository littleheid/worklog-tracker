<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTaskOptions } from "../../composables/useTaskOptions";
import { useUiStore } from "../../stores/uiStore";
import type { TaskDraft, TaskPriority, TaskStatus, TaskVisibility } from "../../types/task";
import DateValuePicker from "../common/DateValuePicker.vue";
import MenuSelect, { type OptionItem } from "../common/MenuSelect.vue";
import TagInput from "../common/TagInput.vue";

const form = defineModel<TaskDraft>({ required: true });
defineProps<{ error?: boolean }>();
const { t } = useI18n();
const uiStore = useUiStore();
const { taskStatusOptions, taskPriorityOptions } = useTaskOptions();

const visibilityOptions = [
  { label: t("visibility.work"), value: "work" },
  { label: t("visibility.personal"), value: "personal" }
];

const hasCategories = computed(() => uiStore.categoryOptions.length > 0);

// 扁平化：按组渲染带视觉层次的选项列表
// 分组标题用 disabled 禁止选中，子项缩进排列
const flatCategoryOptions = computed<OptionItem[]>(() => {
  const result: OptionItem[] = [{ label: t("category.uncategorized"), value: "" }];
  for (const group of uiStore.categoryOptions) {
    if (group.items.length === 0) continue;
    result.push({ label: `━━ ${group.group} ━━`, value: `__group__${group.group}`, disabled: true });
    for (const item of group.items) {
      result.push({ label: `　${item}`, value: item });
    }
  }
  return result;
});

function goToSettings() {
  uiStore.setActivePage("settings");
}

// 私人模式下自动设 visibility 为 personal；工作模式默认为 work
watch(() => uiStore.visibilityMode, (mode) => {
  if (mode === "personal") {
    form.value.visibility = "personal";
  } else if (mode === "work" && form.value.visibility === "personal") {
    form.value.visibility = "work";
  }
});
</script>

<template>
  <div class="mt-5 grid gap-4 md:grid-cols-2">
    <!-- 标题 -->
    <label class="md:col-span-2">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[13px] font-semibold" :class="error && !form.title.trim() ? 'text-red-500' : 'text-stone-700'">
          {{ t("form.title") }} <span class="text-red-400">*</span>
        </span>
      </div>
      <input :value="form.title" type="text" maxlength="200"
        class="h-10 w-full rounded-xl px-3.5 text-[14px] text-stone-800 placeholder:text-stone-400 transition-colors"
        :class="error && !form.title.trim() ? 'bg-red-50/60 border border-red-300' : 'input-glass'"
        :placeholder="t('form.titlePlaceholder')"
        @input="form.title = ($event.target as HTMLInputElement).value" />
    </label>

    <!-- 内容说明 -->
    <label class="md:col-span-2">
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("form.description") }}</span>
      <textarea :value="form.detail" rows="4" maxlength="5000"
        class="input-glass min-h-[120px] w-full rounded-xl px-3.5 py-2.5 text-[14px] leading-6 text-stone-800 placeholder:text-stone-400"
        :placeholder="t('form.descPlaceholder')"
        @input="form.detail = ($event.target as HTMLTextAreaElement).value"></textarea>
    </label>

    <!-- 状态 -->
    <label>
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("form.status") }}</span>
      <MenuSelect :model-value="form.status" :options="taskStatusOptions" full-width :panel-title="t('form.selectStatus')"
        @update:model-value="form.status = $event as TaskStatus" />
    </label>

    <!-- 优先级 -->
    <label>
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("form.priority") }}</span>
      <MenuSelect :model-value="form.priority" :options="taskPriorityOptions" full-width :panel-title="t('form.selectPriority')"
        @update:model-value="form.priority = $event as TaskPriority" />
    </label>

    <!-- 标签 -->
    <label class="md:col-span-2">
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">标签</span>
      <TagInput :model-value="form.tags ?? []" @update:model-value="form.tags = $event" />
    </label>

    <!-- 可见性 -->
    <label>
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("visibility.label") }}</span>
      <MenuSelect :model-value="form.visibility ?? 'work'" :options="visibilityOptions" full-width
        @update:model-value="form.visibility = ($event as TaskVisibility)" />
    </label>

    <!-- 分类 -->
    <label class="md:col-span-2">
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("category.label") }}</span>
      <div v-if="!hasCategories" class="rounded-xl bg-amber-50/60 border border-amber-200 px-4 py-3 text-[13px] text-amber-700">
        {{ t("category.noCategories") }}
      </div>
      <div v-else>
        <MenuSelect
          :model-value="form.category ?? ''"
          :options="flatCategoryOptions"
          full-width
          :placeholder="t('category.select')"
          @update:model-value="form.category = ($event as string)" />
      </div>
    </label>

    <!-- 截止日期 -->
    <label class="md:col-span-2">
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("form.dueDate") }}</span>
      <div class="rounded-xl bg-white/30 p-3">
        <DateValuePicker v-model="form.dueDate" :placeholder="t('form.dueDatePlaceholder')" />
      </div>
    </label>
  </div>
</template>
