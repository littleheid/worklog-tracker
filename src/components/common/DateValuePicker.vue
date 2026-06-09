<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { buildMonthOptions, buildYearOptions, pad2 } from "../../utils/date";
import MenuSelect from "./MenuSelect.vue";

const props = defineProps<{ modelValue: string | null; placeholder?: string; }>();
const emit = defineEmits<{ "update:modelValue": [value: string | null]; }>();
const { t, locale } = useI18n();

function daysInMonth(y: string, m: string): number { return new Date(Number(y), Number(m), 0).getDate(); }

const parsed = computed(() => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(props.modelValue ?? "");
  if (!m) { const td = new Date(); return { year: String(td.getFullYear()), month: pad2(td.getMonth() + 1), day: pad2(td.getDate()), hasValue: false }; }
  return { year: m[1], month: m[2], day: m[3], hasValue: true };
});

const monthOptions = computed(() =>
  buildMonthOptions(
    Array.from({ length: 12 }, (_, i) =>
      new Intl.DateTimeFormat(locale.value, { month: "short" }).format(new Date(2024, i, 1))
    )
  )
);

const yearOptions = computed(() =>
  buildYearOptions(Number(parsed.value.year), [parsed.value.year]).map(o => ({
    label: `${o.value}${t("datePicker.yearSuffix")}`,
    value: o.value
  }))
);
const dayOptions = computed(() => Array.from({ length: daysInMonth(parsed.value.year, parsed.value.month) }, (_, i) => ({ label: `${pad2(i + 1)}`, value: pad2(i + 1) })));
const previewLabel = computed(() => !parsed.value.hasValue || !props.modelValue ? (props.placeholder ?? t("datePicker.noDate")) : `${t("datePicker.due")}: ${props.modelValue}`);

function updatePart(p: "year" | "month" | "day", v: string) {
  const n = { year: parsed.value.year, month: parsed.value.month, day: parsed.value.day }; n[p] = v;
  const md = daysInMonth(n.year, n.month); if (Number(n.day) > md) n.day = pad2(md);
  emit("update:modelValue", `${n.year}-${n.month}-${n.day}`);
}
function clearValue() { emit("update:modelValue", null); }
</script>

<template>
  <div class="space-y-2.5">
    <div class="grid gap-2.5 md:grid-cols-3">
      <MenuSelect :model-value="parsed.year" :options="yearOptions" full-width compact :panel-title="t('filter.selectYear')" :panel-columns="2" @update:model-value="updatePart('year', $event)" />
      <MenuSelect :model-value="parsed.month" :options="monthOptions" full-width compact :panel-title="t('filter.selectMonth')" :panel-columns="3" @update:model-value="updatePart('month', $event)" />
      <MenuSelect :model-value="parsed.day" :options="dayOptions" full-width compact :panel-title="t('filter.selectDay')" @update:model-value="updatePart('day', $event)" />
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="text-[13px] leading-5 text-slate-500">{{ previewLabel }}</span>
      <button type="button" class="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-semibold text-orange-600 transition-colors hover:bg-orange-50 disabled:opacity-40" :disabled="!parsed.hasValue" @click="clearValue">{{ t("datePicker.clear") }}</button>
    </div>
  </div>
</template>
