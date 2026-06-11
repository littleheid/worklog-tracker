<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useOverlayPanel } from "../../composables/useOverlayPanel";

export interface OptionItem { label: string; value: string; disabled?: boolean; }

const props = withDefaults(defineProps<{
  modelValue: string;
  options: readonly OptionItem[];
  placeholder?: string;
  fullWidth?: boolean;
  compact?: boolean;
  disabled?: boolean;
  align?: "left" | "right";
  menuClass?: string;
  panelTitle?: string;
  panelColumns?: 1 | 2 | 3;
}>(), {
  placeholder: "", fullWidth: false, compact: false, disabled: false,
  align: "left", menuClass: "", panelTitle: "", panelColumns: 1
});

const emit = defineEmits<{ "update:modelValue": [value: string]; }>();

const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const { open, toggle, close } = useOverlayPanel([root, panel]);
const isMobileSheet = ref(false);
const desktopPanelStyle = ref<Record<string, string>>({});
const panelId = `ms-${Math.random().toString(36).slice(2, 10)}`;
const restoreFocus = ref<HTMLElement | null>(null);
const { t } = useI18n();

const resolvedPlaceholder = computed(() => props.placeholder || t("menu.select"));
const currentLabel = computed(() => props.options.find((o) => o.value === props.modelValue)?.label ?? resolvedPlaceholder.value);

const panelWidth = computed(() => props.fullWidth ? "min-w-full" : "min-w-44");
const optionGridClass = computed(() => props.panelColumns === 3 ? "grid-cols-3" : props.panelColumns === 2 ? "grid-cols-2" : "grid-cols-1");

function syncViewportMode() { isMobileSheet.value = window.innerWidth < 768; if (open.value && !isMobileSheet.value) updatePanelPos(); }
function updatePanelPos() {
  if (!root.value || isMobileSheet.value) return;
  const r = root.value.getBoundingClientRect();
  const vp = 12;
  const mw = props.panelColumns === 3 ? 240 : props.panelColumns === 2 ? 224 : 176;
  const pw = Math.max(r.width, mw);
  let left = props.align === "right" ? r.right - pw : r.left;
  left = Math.min(left, window.innerWidth - pw - vp);
  left = Math.max(vp, left);
  desktopPanelStyle.value = { position: "fixed", top: `${r.bottom + 8}px`, left: `${left}px`, width: props.fullWidth ? `${r.width}px` : `${pw}px`, minWidth: `${pw}px` };
}
function selectValue(v: string) { emit("update:modelValue", v); close(); }
function focusCurrent() { (panel.value?.querySelector<HTMLElement>('[data-option-current="true"]') ?? panel.value?.querySelector<HTMLElement>('[data-option-index="0"]'))?.focus(); }

onMounted(() => { syncViewportMode(); window.addEventListener("resize", syncViewportMode); window.addEventListener("scroll", updatePanelPos, true); });
onBeforeUnmount(() => { window.removeEventListener("resize", syncViewportMode); window.removeEventListener("scroll", updatePanelPos, true); });
watch(open, async (v) => { if (!v) { restoreFocus.value?.focus(); restoreFocus.value = null; return; } restoreFocus.value = trigger.value; await nextTick(); if (isMobileSheet.value) { focusCurrent(); return; } updatePanelPos(); focusCurrent(); });
</script>

<template>
  <div ref="root" class="relative" :class="fullWidth ? 'w-full' : ''">
    <button ref="trigger" type="button"
      class="btn-ghost inline-flex w-full items-center justify-between gap-2 rounded-xl font-semibold"
      :class="compact ? 'h-8 px-3 text-[13px]' : 'h-10 px-3.5 text-[14px]'"
      :disabled="disabled" :aria-expanded="open" :aria-controls="panelId" aria-haspopup="listbox" @click.stop="toggle">
      <span class="truncate">{{ currentLabel }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0 text-orange-300 transition-transform" :class="open ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>

    <div v-if="open && isMobileSheet" class="fixed inset-0 z-[80]">
      <button type="button" class="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]" @click="close" aria-label="Close"></button>
      <div ref="panel" :id="panelId" class="glass-strong absolute inset-x-3 bottom-3 rounded-2xl p-3" role="listbox" :aria-label="panelTitle || resolvedPlaceholder">
        <div class="mb-3 flex items-center justify-between px-1">
          <div class="text-[15px] font-extrabold text-slate-800">{{ panelTitle || resolvedPlaceholder }}</div>
          <button type="button" class="rounded-full px-3 py-1 text-[13px] font-semibold text-orange-600 hover:bg-orange-50" @click="close">{{ t("menu.close") }}</button>
        </div>
        <div class="grid max-h-[50vh] gap-1 overflow-y-auto" :class="optionGridClass">
          <button v-for="(item, index) in options" :key="item.value" type="button"
            class="rounded-lg px-3 py-2.5 text-left text-[14px] font-semibold transition-all duration-150"
            :class="item.disabled ? 'col-span-full -mx-1.5 rounded-none border-t border-stone-200/60 pt-3 pb-1.5 text-[11px] font-extrabold text-stone-400 tracking-widest' : item.value === modelValue ? 'select-active' : 'text-slate-600 hover:bg-orange-50/60'"
            role="option" :aria-selected="item.value === modelValue"
            :data-option-current="item.value === modelValue" :data-option-index="index"
            :disabled="item.disabled" :tabindex="item.disabled ? -1 : 0"
            @click="!item.disabled && selectValue(item.value)">{{ item.label }}</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="open && !isMobileSheet" ref="panel" :id="panelId"
        class="glass-strong z-[90] max-h-72 overflow-y-auto rounded-2xl p-1.5"
        :class="panelWidth" :style="desktopPanelStyle" role="listbox" :aria-label="panelTitle || resolvedPlaceholder">
        <div class="grid gap-0.5" :class="optionGridClass">
          <button v-for="(item, index) in options" :key="item.value" type="button"
            class="rounded-lg px-3 py-2.5 text-left text-[14px] font-semibold transition-all duration-150"
            :class="item.disabled ? 'col-span-full -mx-1.5 rounded-none border-t border-stone-200/60 pt-3 pb-1.5 text-[11px] font-extrabold text-stone-400 tracking-widest' : item.value === modelValue ? 'select-active' : 'text-slate-600 hover:bg-orange-50/60'"
            role="option" :aria-selected="item.value === modelValue"
            :data-option-current="item.value === modelValue" :data-option-index="index"
            :disabled="item.disabled" :tabindex="item.disabled ? -1 : 0"
            @click="!item.disabled && selectValue(item.value)">{{ item.label }}</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
