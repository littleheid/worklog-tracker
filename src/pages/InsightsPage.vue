<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import VChart from "vue-echarts";
import * as echarts from "echarts";
import { useTaskStore } from "../stores/taskStore";

const taskStore = useTaskStore();
const { t } = useI18n();

const ready = ref(false);
onMounted(async () => {
  await nextTick();
  setTimeout(() => { ready.value = true; }, 100);
});

const STATUS_COLORS: Record<string, string> = {
  done: "#10b981", doing: "#3b82f6", todo: "#eab308", paused: "#94a3b8"
};
const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444", medium: "#f59e0b", low: "#10b981"
};

const completionRate = computed(() =>
  taskStore.dashboard.total === 0 ? 0 : Math.round((taskStore.dashboard.done / taskStore.dashboard.total) * 100)
);

const statusDonut = computed(() => ({
  tooltip: { trigger: "item" as const },
  legend: { bottom: 0, textStyle: { fontSize: 12, color: "#78716c" } },
  series: [{
    type: "pie", radius: ["55%", "80%"], center: ["50%", "45%"],
    itemStyle: { borderRadius: 6, borderColor: "transparent", borderWidth: 3 },
    label: { show: false },
    emphasis: { scale: true, scaleSize: 8 },
    data: (["todo", "doing", "done", "paused"] as const).map(k => ({
      name: t(`status.${k}`),
      value: (taskStore.dashboard.statusDistribution as Record<string, number>)[k] ?? 0,
      itemStyle: { color: STATUS_COLORS[k] }
    })).filter(d => d.value > 0)
  }]
}));

const priorityBar = computed(() => {
  const data = (["high", "medium", "low"] as const).map(k => ({
    key: k,
    value: (taskStore.dashboard.priorityDistribution as Record<string, number>)[k] ?? 0,
  }));

  return {
    tooltip: { trigger: "axis" as const },
    grid: { left: 10, right: 30, top: 5, bottom: 5 },
    xAxis: {
      type: "value" as const,
      axisLabel: { fontSize: 11, color: "#a8a29e" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.3)" } }
    },
    yAxis: {
      type: "category" as const,
      data: data.map(d => t(`priority.${d.key}`)),
      axisLabel: { fontSize: 12, fontWeight: "bold", color: "#57534e" },
      axisLine: { show: false }, axisTick: { show: false }
    },
    series: [{
      type: "bar", barWidth: 16,
      itemStyle: { borderRadius: [0, 8, 8, 0] },
      data: data.map(d => ({
        value: d.value,
        itemStyle: { color: PRIORITY_COLORS[d.key] }
      })),
      label: { show: true, position: "right" as const, fontSize: 12, fontWeight: "bold", color: "#57534e" }
    }]
  };
});

const gaugeOption = computed(() => ({
  series: [{
    type: "gauge",
    startAngle: 210, endAngle: -30,
    center: ["50%", "55%"], radius: "85%",
    min: 0, max: 100,
    axisLine: {
      lineStyle: {
        width: 16,
        color: [[0.35, "#ef4444"], [0.7, "#f59e0b"], [1, "#10b981"]]
      }
    },
    pointer: { length: "55%", width: 5, itemStyle: { color: "#44403c" } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { distance: -40, fontSize: 11, color: "#a8a29e" },
    detail: {
      valueAnimation: true, fontSize: 32, fontWeight: "bold",
      color: "#292524", offsetCenter: [0, "65%"]
    },
    data: [{ value: completionRate.value, name: "%" }]
  }]
}));

const detailRows = computed(() =>
  (["todo", "doing", "done", "paused"] as const).map(k => ({
    key: k,
    label: t(`status.${k}`),
    value: (taskStore.dashboard.statusDistribution as Record<string, number>)[k] ?? 0,
    color: STATUS_COLORS[k]
  }))
);
</script>

<template>
  <div class="mt-4 space-y-4">
    <!-- Row 1: Gauge + Donut -->
    <div class="grid gap-5 lg:grid-cols-2">
      <div class="glass rounded-2xl p-5">
        <h3 class="text-[16px] font-extrabold text-stone-800">{{ t("insights.completionRate") }}</h3>
        <p class="text-[13px] text-stone-500 mt-0.5">{{ t("insights.completionDesc") }}</p>
        <div class="h-[260px] overflow-hidden">
          <v-chart v-if="ready" :option="gaugeOption" :echarts="echarts" :key="`g-${completionRate}`" class="h-full w-full" />
        </div>
      </div>

      <div class="glass rounded-2xl p-5">
        <h3 class="text-[16px] font-extrabold text-stone-800">{{ t("insights.statusBreakdown") }}</h3>
        <p class="text-[13px] text-stone-500 mt-0.5">当前月份各状态事项的数量占比。</p>
        <div class="h-[260px] overflow-hidden">
          <v-chart v-if="ready" :option="statusDonut" :echarts="echarts" :key="`s-${taskStore.dashboard.total}`" class="h-full w-full" />
        </div>
      </div>
    </div>

    <!-- Row 2: Priority + Summary -->
    <div class="grid gap-5 lg:grid-cols-[1fr_260px]">
      <div class="glass rounded-2xl p-5">
        <h3 class="text-[16px] font-extrabold text-stone-800">{{ t("insights.priorityBreakdown") }}</h3>
        <p class="text-[13px] text-stone-500 mt-0.5">优先级分布帮助判断本月主要精力投入方向。</p>
        <div class="h-[180px] overflow-hidden mt-2">
          <v-chart v-if="ready" :option="priorityBar" :echarts="echarts" :key="`p-${taskStore.dashboard.total}`" class="h-full w-full" />
        </div>
      </div>

      <div class="glass rounded-2xl p-5">
        <h3 class="text-[16px] font-extrabold text-stone-800 mb-4">总览</h3>
        <div class="mt-3 space-y-1.5">
          <div v-for="row in detailRows" :key="row.key"
            class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/30">
            <div class="flex items-center gap-2.5">
              <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: row.color }"></span>
              <span class="text-[14px] font-bold text-stone-700">{{ row.label }}</span>
            </div>
            <span class="text-[18px] font-extrabold text-stone-800 tabular-nums">{{ row.value }}</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-white/30 flex items-center justify-between">
          <span class="text-[13px] font-bold text-stone-500">合计</span>
          <span class="text-[22px] font-extrabold text-stone-800">{{ taskStore.dashboard.total }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
