<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useOverlayPanel } from "../../composables/useOverlayPanel";

const props = withDefaults(defineProps<{
  label: string; disabled?: boolean; align?: "left" | "right";
  side?: "top" | "bottom"; compact?: boolean; menuClass?: string;
}>(), { disabled: false, align: "right", side: "bottom", compact: false, menuClass: "" });

const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const { open, toggle, close } = useOverlayPanel([root, panel]);
const panelStyle = ref<Record<string, string>>({});
const panelId = `am-${Math.random().toString(36).slice(2, 10)}`;
const restoreFocus = ref<HTMLElement | null>(null);

function updatePanelPosition() {
  if (!root.value) return;
  const r = root.value.getBoundingClientRect();
  const vp = 12; const width = Math.max(r.width, 208);
  let left = props.align === "left" ? r.left : r.right - width;
  left = Math.min(left, window.innerWidth - width - vp); left = Math.max(vp, left);
  const top = props.side === "top" ? Math.max(vp, r.top - 12) : r.bottom + 8;
  panelStyle.value = { position: "fixed", left: `${left}px`, minWidth: `${width}px`, width: `${width}px`,
    ...(props.side === "top" ? { bottom: `${window.innerHeight - r.top + 12}px` } : { top: `${top}px` }) };
}

watch(open, async (v) => { if (!v) { restoreFocus.value?.focus(); restoreFocus.value = null; return; } restoreFocus.value = trigger.value; await nextTick(); updatePanelPosition(); panel.value?.querySelector<HTMLElement>("button:not(:disabled)")?.focus(); });
onMounted(() => { window.addEventListener("resize", updatePanelPosition); window.addEventListener("scroll", updatePanelPosition, true); });
onBeforeUnmount(() => { window.removeEventListener("resize", updatePanelPosition); window.removeEventListener("scroll", updatePanelPosition, true); });
</script>

<template>
  <div ref="root" class="relative">
    <button ref="trigger" type="button"
      class="btn-ghost inline-flex items-center justify-between gap-2 rounded-xl font-semibold"
      :class="compact ? 'h-8 px-3 text-[13px]' : 'h-10 px-3.5 text-[14px]'"
      :disabled="disabled" :aria-expanded="open" :aria-controls="panelId" aria-haspopup="menu" @click.stop="toggle">
      <slot name="trigger">{{ label }}</slot>
    </button>

    <Teleport to="body">
      <div v-if="open" ref="panel" :id="panelId" class="glass-strong z-[90] rounded-2xl p-1.5" :class="props.menuClass" :style="panelStyle" role="menu" :aria-label="label">
        <slot :close="close"></slot>
      </div>
    </Teleport>
  </div>
</template>
