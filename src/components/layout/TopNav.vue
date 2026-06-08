<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ActivePage } from "../../types/ui";
import type { Locale } from "../../i18n";

defineProps<{ activePage: ActivePage; locale: Locale; }>();
const emit = defineEmits<{
  navigate: [value: ActivePage];
  "locale-change": [value: Locale];
  create: [];
}>();

const { t } = useI18n();
const pages: Array<{ key: ActivePage; label: string }> = [
  { key: "dashboard", label: "nav.dashboard" },
  { key: "tasks", label: "nav.tasks" },
  { key: "insights", label: "nav.insights" },
  { key: "settings", label: "nav.settings" }
];
</script>

<template>
  <nav class="glass rounded-2xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <!-- Left: logo + tabs -->
    <div class="flex items-center gap-6">
      <button class="text-accent-gradient text-lg font-extrabold tracking-tight shrink-0" @click="emit('navigate', 'dashboard')">
        {{ t("sidebar.logo") }}
      </button>

      <div class="flex items-center gap-1">
        <button v-for="page in pages" :key="page.key" type="button"
          class="rounded-xl px-3.5 py-2 text-[14px] font-bold transition-all duration-200"
          :class="activePage === page.key
            ? 'select-active'
            : 'text-stone-500 hover:text-stone-800 hover:bg-white/50'"
          @click="emit('navigate', page.key)">
          {{ t(page.label) }}
        </button>
      </div>
    </div>

    <!-- Right: actions -->
    <div class="flex items-center gap-2">
      <div class="flex gap-0.5 mr-1">
        <button type="button"
          class="rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all duration-200"
          :class="locale === 'zh-CN' ? 'select-active' : 'text-stone-400 hover:text-stone-600 hover:bg-white/40'"
          @click="emit('locale-change', 'zh-CN')">中文</button>
        <button type="button"
          class="rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all duration-200"
          :class="locale === 'en' ? 'select-active' : 'text-stone-400 hover:text-stone-600 hover:bg-white/40'"
          @click="emit('locale-change', 'en')">EN</button>
      </div>

      <button type="button" class="btn-accent inline-flex h-9 items-center gap-1 rounded-xl px-4 text-[13px]" @click="emit('create')">
        <span class="text-[16px] leading-none">+</span><span>{{ t("filter.addTask") }}</span>
      </button>
    </div>
  </nav>
</template>
