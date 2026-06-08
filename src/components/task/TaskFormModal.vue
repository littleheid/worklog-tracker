<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTaskFormDraft } from "../../composables/useTaskFormDraft";
import type { Task, TaskDraft } from "../../types/task";
import TaskFormFields from "./TaskFormFields.vue";

const props = defineProps<{ open: boolean; month: string; saving: boolean; model?: Task | null; }>();
const emit = defineEmits<{ close: []; submit: [payload: TaskDraft]; }>();
const { t } = useI18n();
const { form, toDraft } = useTaskFormDraft({ open: () => props.open, month: () => props.month, model: () => props.model });

const validationError = ref("");

function submitForm() {
  if (!form.title.trim()) {
    validationError.value = t("form.title") + t("form.titleRequired");
    return;
  }
  validationError.value = "";
  emit("submit", toDraft());
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto modal-overlay p-4 md:items-center">
      <div class="glass-strong modal-panel my-4 w-full max-w-[680px] overflow-y-auto rounded-2xl p-6">
        <div class="flex items-start justify-between gap-4 border-b border-white/30 pb-4">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <h3 class="text-[18px] font-extrabold text-slate-800">{{ props.model ? t("form.editTask") : t("form.newTask") }}</h3>
              <span class="badge-soft bg-white/60 text-slate-500 font-bold">{{ form.month }}</span>
            </div>
            <p class="text-[13px] leading-5 text-slate-500">{{ t("form.desc") }}</p>
          </div>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600" :aria-label="t('form.close')" @click="emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Validation error -->
        <div v-if="validationError" class="mt-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-[13px] font-semibold text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          {{ validationError }}
        </div>

        <TaskFormFields v-model="form" :error="validationError !== ''" />

        <div class="mt-5 flex flex-wrap justify-end gap-2.5 border-t border-white/30 pt-4">
          <button type="button" class="btn-ghost inline-flex h-10 items-center rounded-xl px-4 text-[14px]" @click="emit('close')">{{ t("form.cancel") }}</button>
          <button type="button" class="btn-accent inline-flex h-10 items-center rounded-xl px-5 text-[14px]" :disabled="props.saving" @click="submitForm">{{ props.saving ? t("form.saving") : t("form.save") }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
