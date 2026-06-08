<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "../../constants/task";
import type { TaskDraft, TaskPriority, TaskStatus } from "../../types/task";
import DateValuePicker from "../common/DateValuePicker.vue";
import MenuSelect from "../common/MenuSelect.vue";
import TagInput from "../common/TagInput.vue";

const form = defineModel<TaskDraft>({ required: true });
const { t } = useI18n();
</script>

<template>
  <div class="mt-5 grid gap-4 md:grid-cols-2">
    <!-- 标题 -->
    <label class="md:col-span-2">
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("form.title") }}</span>
      <input :value="form.title" type="text" maxlength="120"
        class="input-glass h-10 w-full rounded-xl px-3.5 text-[14px] text-stone-800 placeholder:text-stone-400"
        :placeholder="t('form.titlePlaceholder')"
        @input="form.title = ($event.target as HTMLInputElement).value" />
    </label>

    <!-- 内容说明 -->
    <label class="md:col-span-2">
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("form.description") }}</span>
      <textarea :value="form.detail" rows="4" maxlength="2000"
        class="input-glass min-h-[120px] w-full rounded-xl px-3.5 py-2.5 text-[14px] leading-6 text-stone-800 placeholder:text-stone-400"
        :placeholder="t('form.descPlaceholder')"
        @input="form.detail = ($event.target as HTMLTextAreaElement).value"></textarea>
    </label>

    <!-- 状态 -->
    <label>
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("form.status") }}</span>
      <MenuSelect :model-value="form.status" :options="TASK_STATUS_OPTIONS" full-width :panel-title="t('form.selectStatus')"
        @update:model-value="form.status = $event as TaskStatus" />
    </label>

    <!-- 优先级 -->
    <label>
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("form.priority") }}</span>
      <MenuSelect :model-value="form.priority" :options="TASK_PRIORITY_OPTIONS" full-width :panel-title="t('form.selectPriority')"
        @update:model-value="form.priority = $event as TaskPriority" />
    </label>

    <!-- 标签 -->
    <label class="md:col-span-2">
      <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">标签</span>
      <TagInput :model-value="form.tags ?? []" @update:model-value="form.tags = $event" />
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
