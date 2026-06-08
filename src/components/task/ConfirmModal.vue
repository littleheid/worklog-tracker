<script setup lang="ts">
import { useI18n } from "vue-i18n";
defineProps<{ open: boolean; title: string; message: string; confirmText?: string; }>();
defineEmits<{ close: []; confirm: []; }>();
const { t } = useI18n();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
      <div class="glass-strong modal-panel w-full max-w-md rounded-2xl p-6">
        <h3 class="text-[18px] font-extrabold text-slate-800">{{ title }}</h3>
        <p class="mt-3 text-[14px] leading-6 text-slate-600">{{ message }}</p>
        <div class="mt-5 flex justify-end gap-2.5">
          <button type="button" class="btn-ghost inline-flex h-10 items-center rounded-xl px-4 text-[14px]" @click="$emit('close')">{{ t("confirm.cancel") }}</button>
          <button type="button" class="btn-accent inline-flex h-10 items-center rounded-xl px-4 text-[14px]" @click="$emit('confirm')">{{ confirmText ?? t("confirm.confirm") }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
