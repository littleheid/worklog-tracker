<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { prefsApi, taskApi } from "../repositories/api/taskApi";
import { useUiStore } from "../stores/uiStore";
import { useTaskStore } from "../stores/taskStore";
import MenuSelect from "../components/common/MenuSelect.vue";

const { t } = useI18n();
const uiStore = useUiStore();
const taskStore = useTaskStore();

const recentLimit = ref(8);
const pageSize = ref(10);
const showResetConfirm = ref(false);

const recentOptions = [
  { label: "3", value: "3" },
  { label: "5", value: "5" },
  { label: "8", value: "8" },
  { label: "12", value: "12" },
];

const pageSizeOptions = [
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
];

onMounted(async () => {
  const rl = await prefsApi.get<number>("recentLimit");
  if (rl) recentLimit.value = rl;
  const ps = await prefsApi.get<number>("pageSize");
  if (ps) pageSize.value = ps;
});

async function saveRecentLimit(value: string) {
  const n = Number(value);
  recentLimit.value = n;
  await prefsApi.set("recentLimit", n);
  taskStore.recentLimit = n;
  uiStore.pushToast(t("settings.saved"), "success");
  await taskStore.refreshForQuery({ ...taskStore.query }, { notifyOnError: false });
}

async function savePageSize(value: string) {
  const n = Number(value);
  pageSize.value = n;
  await prefsApi.set("pageSize", n);
  taskStore.setPageSize(n);
  uiStore.pushToast(t("settings.saved"), "success");
}

async function handleReset() {
  try {
    const all = await taskApi.getAll();
    for (const task of all) {
      await taskApi.delete(task.id);
    }
    await prefsApi.set("activePage", "dashboard");
    await prefsApi.set("locale", uiStore.locale);
    await prefsApi.set("recentLimit", 8);
    await prefsApi.set("pageSize", 10);
    uiStore.activePage = "dashboard";
    uiStore.pushToast(t("settings.resetDone"), "success");
    showResetConfirm.value = false;
    await taskStore.refreshForQuery({ ...taskStore.query, month: taskStore.query.month }, { notifyOnError: false });
  } catch (error) {
    uiStore.pushToast(String(error), "error");
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Recent limit -->
    <div class="glass rounded-2xl p-5">
      <div class="mb-4">
        <h3 class="text-[16px] font-extrabold text-stone-800">{{ t("settings.recentLimit") }}</h3>
        <p class="mt-1 text-[13px] text-stone-500">{{ t("settings.recentLimitDesc") }}</p>
      </div>
      <div class="max-w-[200px]">
        <MenuSelect
          :model-value="String(recentLimit)"
          :options="recentOptions"
          full-width
          @update:model-value="saveRecentLimit"
        />
      </div>
    </div>

    <!-- Page size -->
    <div class="glass rounded-2xl p-5">
      <div class="mb-4">
        <h3 class="text-[16px] font-extrabold text-stone-800">{{ t("settings.pageSize") }}</h3>
        <p class="mt-1 text-[13px] text-stone-500">{{ t("settings.pageSizeDesc") }}</p>
      </div>
      <div class="max-w-[200px]">
        <MenuSelect
          :model-value="String(pageSize)"
          :options="pageSizeOptions"
          full-width
          @update:model-value="savePageSize"
        />
      </div>
    </div>

    <!-- Reset data -->
    <div class="glass rounded-2xl p-5">
      <div class="mb-4">
        <h3 class="text-[16px] font-extrabold text-red-600">{{ t("settings.resetData") }}</h3>
        <p class="mt-1 text-[13px] text-stone-500">{{ t("settings.resetDataDesc") }}</p>
      </div>

      <div v-if="!showResetConfirm">
        <button type="button"
          class="inline-flex h-10 items-center rounded-xl bg-red-50 px-4 text-[14px] font-semibold text-red-600 transition-all hover:bg-red-100"
          @click="showResetConfirm = true">
          {{ t("settings.resetData") }}
        </button>
      </div>
      <div v-else class="flex items-center gap-3">
        <span class="text-[14px] font-semibold text-red-600">{{ t("settings.resetWarning") }}</span>
        <button type="button" class="btn-accent inline-flex h-10 items-center rounded-xl px-4 text-[13px]"
          style="background: linear-gradient(135deg, #ef4444, #dc2626);" @click="handleReset">
          {{ t("settings.resetConfirm") }}
        </button>
        <button type="button" class="btn-ghost inline-flex h-10 items-center rounded-xl px-4 text-[13px]"
          @click="showResetConfirm = false">
          {{ t("confirm.cancel") }}
        </button>
      </div>
    </div>
  </div>
</template>
