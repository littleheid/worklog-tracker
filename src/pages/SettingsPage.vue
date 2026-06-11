<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { prefsApi, taskApi, authApi, categoryApi } from "../repositories/api/taskApi";
import { useUiStore } from "../stores/uiStore";
import { useTaskStore } from "../stores/taskStore";
import type { CategoryGroup } from "../types/task";
import MenuSelect from "../components/common/MenuSelect.vue";

const { t } = useI18n();
const uiStore = useUiStore();
const taskStore = useTaskStore();

const recentLimit = ref(8);
const pageSize = ref(10);
const showResetConfirm = ref(false);

// Password
const oldPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const passwordError = ref("");
const passwordLoading = ref(false);
const showPasswordSection = ref(false);

// Categories
const categories = ref<CategoryGroup[]>([]);
const newGroupName = ref("");
const newItemNames = ref<Record<number, string>>({});

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
  const [rl, ps, pwdStatus, cats] = await Promise.all([
    prefsApi.get<number>("recentLimit"),
    prefsApi.get<number>("pageSize"),
    authApi.status().catch(() => ({ isSet: false })),
    categoryApi.getAll().catch(() => [] as CategoryGroup[])
  ]);
  if (rl) recentLimit.value = rl;
  if (ps) pageSize.value = ps;
  uiStore.isPasswordSet = pwdStatus.isSet;
  categories.value = cats;
  uiStore.categoryOptions = cats;
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

async function handleSetPassword() {
  passwordError.value = "";
  if (!newPassword.value || newPassword.value.length < 4) {
    passwordError.value = t("password.minLength");
    return;
  }
  if (newPassword.value !== confirmNewPassword.value) {
    passwordError.value = t("password.mismatch");
    return;
  }
  passwordLoading.value = true;
  try {
    if (uiStore.isPasswordSet) {
      if (!oldPassword.value) {
        passwordError.value = t("password.oldRequired");
        passwordLoading.value = false;
        return;
      }
      await authApi.setPassword(oldPassword.value, newPassword.value);
    } else {
      await authApi.setPassword("", newPassword.value);
    }
    uiStore.isPasswordSet = true;
    uiStore.pushToast(t("password.saved"), "success");
    oldPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
    showPasswordSection.value = false;
  } catch (e: any) {
    passwordError.value = e?.message ?? t("password.error");
  } finally {
    passwordLoading.value = false;
  }
}

// Category management
const editingGroupIndex = ref(-1);
const editingGroupName = ref("");
const editingItemGroup = ref(-1);
const editingItemIndex = ref(-1);
const editingItemName = ref("");

async function addGroup() {
  const name = newGroupName.value.trim();
  if (!name || name.length > 50) return;
  if (categories.value.some(g => g.group === name)) {
    uiStore.pushToast(t("category.groupExists"), "error");
    return;
  }
  categories.value = [...categories.value, { group: name, items: [] }];
  await saveCategories();
  newGroupName.value = "";
}

function startEditGroup(gi: number) {
  editingGroupIndex.value = gi;
  editingGroupName.value = categories.value[gi].group;
}

async function saveEditGroup() {
  const name = editingGroupName.value.trim();
  if (!name || name.length > 50) { cancelEditGroup(); return; }
  const gi = editingGroupIndex.value;
  if (gi >= 0) {
    categories.value[gi] = { ...categories.value[gi], group: name };
    await saveCategories();
  }
  cancelEditGroup();
}

function cancelEditGroup() {
  editingGroupIndex.value = -1;
  editingGroupName.value = "";
}

function addItem(groupIndex: number) {
  const val = (newItemNames.value[groupIndex] ?? "").trim();
  if (!val || val.length > 50) return;
  const group = categories.value[groupIndex];
  if (group.items.includes(val)) {
    uiStore.pushToast(t("category.itemExists"), "error");
    return;
  }
  group.items = [...group.items, val];
  categories.value[groupIndex] = { ...group };
  newItemNames.value[groupIndex] = "";
  saveCategories();
}

function startEditItem(gi: number, ii: number) {
  editingItemGroup.value = gi;
  editingItemIndex.value = ii;
  editingItemName.value = categories.value[gi].items[ii];
}

async function saveEditItem() {
  const name = editingItemName.value.trim();
  if (!name || name.length > 50) { cancelEditItem(); return; }
  const gi = editingItemGroup.value;
  const ii = editingItemIndex.value;
  if (gi >= 0 && ii >= 0) {
    categories.value[gi].items[ii] = name;
    categories.value[gi] = { ...categories.value[gi] };
    await saveCategories();
  }
  cancelEditItem();
}

function cancelEditItem() {
  editingItemGroup.value = -1;
  editingItemIndex.value = -1;
  editingItemName.value = "";
}

function removeItem(groupIndex: number, itemIndex: number) {
  const group = categories.value[groupIndex];
  group.items = group.items.filter((_, i) => i !== itemIndex);
  categories.value[groupIndex] = { ...group };
  saveCategories();
}

async function removeGroup(groupIndex: number) {
  categories.value = categories.value.filter((_, i) => i !== groupIndex);
  await saveCategories();
}

async function saveCategories() {
  await categoryApi.save(categories.value);
  uiStore.categoryOptions = categories.value;
}

async function handleReset() {
  try {
    const all = await taskApi.getAll("");
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
        <MenuSelect :model-value="String(recentLimit)" :options="recentOptions" full-width
          @update:model-value="saveRecentLimit" />
      </div>
    </div>

    <!-- Page size -->
    <div class="glass rounded-2xl p-5">
      <div class="mb-4">
        <h3 class="text-[16px] font-extrabold text-stone-800">{{ t("settings.pageSize") }}</h3>
        <p class="mt-1 text-[13px] text-stone-500">{{ t("settings.pageSizeDesc") }}</p>
      </div>
      <div class="max-w-[200px]">
        <MenuSelect :model-value="String(pageSize)" :options="pageSizeOptions" full-width
          @update:model-value="savePageSize" />
      </div>
    </div>

    <!-- Privacy Password -->
    <div class="glass rounded-2xl p-5">
      <div class="mb-4">
        <h3 class="text-[16px] font-extrabold text-stone-800">{{ t("password.title") }}</h3>
        <p class="mt-1 text-[13px] text-stone-500">
          {{ uiStore.isPasswordSet ? t("password.hasPassword") : t("password.setDesc") }}
        </p>
      </div>

      <div v-if="!showPasswordSection">
        <button type="button"
          class="inline-flex h-10 items-center rounded-xl px-4 text-[14px] font-semibold transition-all"
          :class="uiStore.isPasswordSet ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'btn-accent'"
          @click="showPasswordSection = true">
          {{ uiStore.isPasswordSet ? t("password.changeButton") : t("password.setButton") }}
        </button>
      </div>

      <div v-else class="max-w-[320px] space-y-3">
        <label v-if="uiStore.isPasswordSet">
          <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("password.oldPassword") }}</span>
          <input v-model="oldPassword" type="password" maxlength="100"
            class="input-glass h-10 w-full rounded-xl px-3.5 text-[14px] text-stone-800 placeholder:text-stone-400"
            :placeholder="t('password.oldPlaceholder')" />
        </label>
        <label>
          <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("password.newPassword") }}</span>
          <input v-model="newPassword" type="password" maxlength="100"
            class="input-glass h-10 w-full rounded-xl px-3.5 text-[14px] text-stone-800 placeholder:text-stone-400"
            :placeholder="t('password.newPlaceholder')" />
        </label>
        <label>
          <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("password.confirmPassword") }}</span>
          <input v-model="confirmNewPassword" type="password" maxlength="100"
            class="input-glass h-10 w-full rounded-xl px-3.5 text-[14px] text-stone-800 placeholder:text-stone-400"
            :placeholder="t('password.confirmPlaceholder')" />
        </label>

        <div v-if="passwordError"
          class="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-[13px] font-semibold text-red-700">
          {{ passwordError }}
        </div>

        <div class="flex gap-2">
          <button type="button" class="btn-accent inline-flex h-10 items-center rounded-xl px-4 text-[13px]"
            :disabled="passwordLoading" @click="handleSetPassword">
            {{ passwordLoading ? t("password.saving") : t("category.save") }}
          </button>
          <button type="button" class="btn-ghost inline-flex h-10 items-center rounded-xl px-4 text-[13px]"
            @click="showPasswordSection = false">{{ t("category.cancel") }}</button>
        </div>
      </div>
    </div>

    <!-- Category Management -->
    <div class="glass rounded-2xl p-5">
      <div class="mb-4">
        <h3 class="text-[16px] font-extrabold text-stone-800">{{ t("category.managementTitle") }}</h3>
        <p class="mt-1 text-[13px] text-stone-500">{{ t("category.managementDesc") }}</p>
      </div>

      <!-- Group list -->
      <div class="space-y-4 max-w-[440px]">
        <div v-for="(group, gi) in categories" :key="gi" class="rounded-xl bg-white/50 p-4">
          <!-- Group header row -->
          <div class="flex items-center justify-between mb-2">
            <template v-if="editingGroupIndex === gi">
              <input v-model="editingGroupName" type="text" maxlength="50"
                class="input-glass h-8 flex-1 rounded-lg px-2.5 text-[13px] font-bold text-stone-800"
                @keydown.enter="saveEditGroup" @keydown.escape="cancelEditGroup" />
              <div class="flex gap-1 ml-2">
                <button type="button" class="btn-accent inline-flex h-7 items-center rounded-lg px-2.5 text-[11px]" @click="saveEditGroup">保存</button>
                <button type="button" class="btn-ghost inline-flex h-7 items-center rounded-lg px-2 text-[11px]" @click="cancelEditGroup">取消</button>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-1.5">
                <h4 class="text-[14px] font-extrabold text-stone-700">📁 {{ group.group }}</h4>
                <button type="button"
                  class="btn-ghost inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] text-stone-400 hover:text-stone-600"
                  @click="startEditGroup(gi)">✎</button>
              </div>
              <button type="button"
                class="btn-ghost inline-flex h-7 w-7 items-center justify-center rounded-lg text-[12px] text-red-400 hover:text-red-600"
                @click="removeGroup(gi)">×</button>
            </template>
          </div>

          <!-- Items -->
          <div class="space-y-1.5 ml-2">
            <div v-for="(item, ii) in group.items" :key="ii"
              class="flex items-center gap-2 pl-3 border-l-2 border-stone-200">
              <template v-if="editingItemGroup === gi && editingItemIndex === ii">
                <input v-model="editingItemName" type="text" maxlength="50"
                  class="input-glass h-7 flex-1 rounded-md px-2 text-[12px] text-stone-800"
                  @keydown.enter="saveEditItem" @keydown.escape="cancelEditItem" />
                <button type="button" class="btn-accent inline-flex h-6 items-center rounded-md px-2 text-[10px]" @click="saveEditItem">保存</button>
                <button type="button" class="btn-ghost inline-flex h-6 items-center rounded-md px-1.5 text-[10px]" @click="cancelEditItem">取消</button>
              </template>
              <template v-else>
                <span class="flex-1 text-[13px] font-semibold text-stone-600">{{ item }}</span>
                <button type="button"
                  class="btn-ghost inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] text-stone-400 hover:text-stone-600"
                  @click="startEditItem(gi, ii)">✎</button>
                <button type="button"
                  class="btn-ghost inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] text-red-400 hover:text-red-600"
                  @click="removeItem(gi, ii)">×</button>
              </template>
            </div>
            <div v-if="group.items.length === 0" class="pl-3 border-l-2 border-stone-100 text-[12px] text-stone-400 italic">
              {{ t("category.none") }}
            </div>
          </div>

          <!-- Add item -->
          <div class="flex items-center gap-2 mt-2 ml-2 pl-3 border-l-2 border-stone-100">
            <input v-model="newItemNames[gi]" type="text" maxlength="50"
              class="input-glass h-8 flex-1 rounded-lg px-2.5 text-[12px] text-stone-800 placeholder:text-stone-400"
              :placeholder="t('category.addItemPlaceholder', { group: group.group })"
              @keydown.enter="addItem(gi)" />
            <button type="button"
              class="btn-accent inline-flex h-8 items-center rounded-lg px-2.5 text-[11px]"
              @click="addItem(gi)">{{ t("category.add") }}</button>
          </div>
        </div>
      </div>

      <!-- Add group -->
      <div class="flex items-center gap-2 mt-4 max-w-[440px]">
        <input v-model="newGroupName" type="text" maxlength="50"
          class="input-glass h-9 flex-1 rounded-lg px-3 text-[13px] text-stone-800 placeholder:text-stone-400"
          :placeholder="t('category.addGroupPlaceholder')" @keydown.enter="addGroup" />
        <button type="button" class="btn-accent inline-flex h-9 items-center rounded-lg px-3 text-[12px]"
          @click="addGroup">{{ t("category.addGroup") }}</button>
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
