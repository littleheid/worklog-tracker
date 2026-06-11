<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import TopNav from "./components/layout/TopNav.vue";
import ToastStack from "./components/common/ToastStack.vue";
import PasswordModal from "./components/common/PasswordModal.vue";
import DashboardPage from "./pages/DashboardPage.vue";
import InsightsPage from "./pages/InsightsPage.vue";
import SettingsPage from "./pages/SettingsPage.vue";
import TasksPage from "./pages/TasksPage.vue";
import { useTaskStore } from "./stores/taskStore";
import { useUiStore } from "./stores/uiStore";
import type { ActivePage } from "./types/ui";

const { t } = useI18n();
const uiStore = useUiStore();
const taskStore = useTaskStore();

const pageComponentMap: Record<ActivePage, typeof DashboardPage> = {
  dashboard: DashboardPage,
  tasks: TasksPage,
  insights: InsightsPage,
  settings: SettingsPage
};

const activePageComponent = computed(() => pageComponentMap[uiStore.activePage]);

function handleNavigate(page: ActivePage) { uiStore.setActivePage(page); }
function handleCreate() {
  uiStore.pendingCreate = true;
  uiStore.setActivePage("tasks");
}

onMounted(async () => {
  try {
    await uiStore.initialize();
    await taskStore.initialize();
  } catch (error) {
    const msg = error instanceof Error ? error.message : t("toast.unknownError");
    uiStore.pushToast(t("toast.initFailed", { message: msg }), "error");
  }
});
</script>

<template>
  <div class="mx-auto min-h-screen max-w-[1440px] px-4 py-4 md:px-6 md:py-5">
    <TopNav
      :active-page="uiStore.activePage"
      :locale="uiStore.locale"
      @navigate="handleNavigate"
      @locale-change="uiStore.setLocale"
      @create="handleCreate"
    />

    <div class="relative mt-5">
      <Transition name="page-fade" mode="out-in">
        <component :is="activePageComponent" :key="uiStore.activePage" />
      </Transition>
    </div>

    <ToastStack :items="uiStore.toasts" @dismiss="uiStore.dismissToast" />
    <PasswordModal v-if="uiStore.showUnlockModal" @close="uiStore.closeUnlockModal" />
  </div>
</template>
