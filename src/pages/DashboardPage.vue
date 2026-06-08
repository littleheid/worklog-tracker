<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTaskStore } from "../stores/taskStore";
import { formatDateTime } from "../utils/date";

const taskStore = useTaskStore();
const { t } = useI18n();

const statusItems = computed(() => Object.entries(taskStore.dashboard.statusDistribution));
const priorityItems = computed(() => Object.entries(taskStore.dashboard.priorityDistribution));
function ratio(v: number): number { return taskStore.dashboard.total === 0 ? 0 : Math.round((v / taskStore.dashboard.total) * 100); }
</script>

<template>
  <div class="mt-4 space-y-4">
    <!-- KPI Row -->
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="glass card-lift kpi-total rounded-2xl p-5">
        <div class="text-[13px] font-bold text-stone-500">{{ t("dashboard.total") }}</div>
        <div class="mt-3 text-[36px] font-extrabold tracking-tight text-stone-800">{{ taskStore.dashboard.total }}</div>
        <div class="mt-1 h-1.5 w-full rounded-full bg-stone-100"><div class="h-full rounded-full bg-stone-300" :style="{ width: '100%' }"></div></div>
      </div>
      <div class="glass card-lift kpi-done rounded-2xl p-5">
        <div class="text-[13px] font-bold text-stone-500">{{ t("dashboard.done") }}</div>
        <div class="mt-3 text-[36px] font-extrabold tracking-tight text-emerald-600">{{ taskStore.dashboard.done }}</div>
        <div class="mt-1 h-1.5 w-full rounded-full bg-stone-100"><div class="h-full rounded-full bg-emerald-400 transition-all" :style="{ width: `${ratio(taskStore.dashboard.done)}%` }"></div></div>
      </div>
      <div class="glass card-lift kpi-doing rounded-2xl p-5">
        <div class="text-[13px] font-bold text-stone-500">{{ t("dashboard.inProgress") }}</div>
        <div class="mt-3 text-[36px] font-extrabold tracking-tight text-blue-600">{{ taskStore.dashboard.doing }}</div>
        <div class="mt-1 h-1.5 w-full rounded-full bg-stone-100"><div class="h-full rounded-full bg-blue-400 transition-all" :style="{ width: `${ratio(taskStore.dashboard.doing)}%` }"></div></div>
      </div>
      <div class="glass card-lift kpi-overdue rounded-2xl p-5">
        <div class="text-[13px] font-bold text-stone-500">{{ t("dashboard.overdue") }}</div>
        <div class="mt-3 text-[36px] font-extrabold tracking-tight text-red-500">{{ taskStore.dashboard.overdue }}</div>
        <div class="mt-1 h-1.5 w-full rounded-full bg-stone-100"><div class="h-full rounded-full bg-red-400 transition-all" :style="{ width: `${ratio(taskStore.dashboard.overdue)}%` }"></div></div>
      </div>
    </div>

    <!-- Distribution Row -->
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="glass rounded-2xl p-5">
        <h3 class="text-[16px] font-extrabold text-stone-800 mb-5">{{ t("dashboard.status") }}</h3>
        <div class="mt-3 space-y-4">
          <div v-for="[key, value] in statusItems" :key="key" class="space-y-1.5">
            <div class="flex items-center justify-between text-[13px]">
              <span class="font-bold text-stone-600">{{ t(`status.${key}`) }}</span>
              <span class="text-stone-400 font-semibold">{{ value }} · {{ ratio(value) }}%</span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div class="h-full rounded-full transition-all duration-500" :class="`bar-${key}`" :style="{ width: `${ratio(value)}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="glass rounded-2xl p-5">
        <h3 class="text-[16px] font-extrabold text-stone-800 mb-5">{{ t("dashboard.priority") }}</h3>
        <div class="mt-3 space-y-4">
          <div v-for="[key, value] in priorityItems" :key="key" class="space-y-1.5">
            <div class="flex items-center justify-between text-[13px]">
              <span class="font-bold text-stone-600">{{ t(`priority.${key}`) }}</span>
              <span class="text-stone-400 font-semibold">{{ value }} · {{ ratio(value) }}%</span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div class="h-full rounded-full transition-all duration-500" :class="`bar-${key}`" :style="{ width: `${ratio(value)}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Tasks Grid -->
    <section class="glass rounded-2xl p-5">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-[16px] font-extrabold text-stone-800">{{ t("dashboard.recentUpdates") }}</h2>
          <p class="mt-1 text-[13px] text-stone-500">{{ t("dashboard.recentSubtitle") }}</p>
        </div>
        <span class="badge-soft bg-white/60 text-stone-500 font-bold">{{ taskStore.dashboard.recentUpdates.length }}</span>
      </div>

      <div v-if="taskStore.dashboard.recentUpdates.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/40">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        </div>
        <p class="text-[14px] text-stone-500 font-semibold">{{ t("dashboard.noRecent") }}</p>
      </div>

      <div v-else class="stagger-list grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="task in taskStore.dashboard.recentUpdates" :key="task.id"
          class="card-lift glass rounded-xl p-4 cursor-pointer">
          <!-- status dot + time -->
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="{'bg-amber-400':task.status==='todo','bg-blue-400':task.status==='doing','bg-emerald-400':task.status==='done','bg-stone-300':task.status==='paused'}"></span>
              <span class="text-[12px] font-semibold text-stone-600">{{ t(`status.${task.status}`) }}</span>
            </div>
            <span class="text-[11px] text-stone-400">{{ formatDateTime(task.updatedAt) }}</span>
          </div>

          <h3 class="text-[15px] font-bold text-stone-800 line-clamp-1">{{ task.title }}</h3>
          <p class="line-clamp-2 mt-1.5 text-[13px] leading-5 text-stone-500">{{ task.detail || t("dashboard.noDescription") }}</p>

          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <span v-if="task.dueDate" class="inline-flex items-center gap-1 rounded-md bg-amber-100/70 px-2 py-0.5 text-[11px] shadow-sm font-semibold text-amber-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" /></svg>
              {{ task.dueDate }}
            </span>
            <span v-for="tag in (task.tags ?? [])" :key="tag"
              class="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold"
              :class="`tag-${Math.abs(tag.split('').reduce((h:number,c:string)=>((h<<5)-h+c.charCodeAt(0))|0,0))%8}`"
              style="border-color: currentColor; border-opacity: 0.25; background: transparent;">{{ tag }}</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
