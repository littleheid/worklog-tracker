<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  page: number;
  totalPages: number;
  total: number;
}>();

const emit = defineEmits<{
  change: [page: number];
}>();

const { t } = useI18n();

const visiblePages = computed(() => {
  if (props.totalPages <= 5) {
    return Array.from({ length: props.totalPages }, (_, index) => index + 1);
  }
  const start = Math.max(1, Math.min(props.page - 2, props.totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
});
</script>

<template>
  <div class="glass rounded-2xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div class="text-[13px] font-semibold text-slate-500">
      {{ t("pagination.info", { total, page, totalPages }) }}
    </div>

    <div v-if="totalPages > 1" class="flex items-center gap-1.5">
      <button type="button" class="btn-ghost inline-flex h-8 items-center rounded-lg px-3 text-[12px]" :disabled="page <= 1" @click="emit('change', page - 1)">
        {{ t("pagination.prev") }}
      </button>
      <button
        v-for="pageNumber in visiblePages"
        :key="pageNumber"
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold transition-all duration-200"
        :class="pageNumber === page ? 'btn-accent' : 'btn-ghost'"
        @click="emit('change', pageNumber)"
      >
        {{ pageNumber }}
      </button>
      <button type="button" class="btn-ghost inline-flex h-8 items-center rounded-lg px-3 text-[12px]" :disabled="page >= totalPages" @click="emit('change', page + 1)">
        {{ t("pagination.next") }}
      </button>
    </div>
  </div>
</template>
