<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useUiStore } from "../../stores/uiStore";
import { useTaskStore } from "../../stores/taskStore";

const { t } = useI18n();
const uiStore = useUiStore();
const taskStore = useTaskStore();
const emit = defineEmits<{ close: [] }>();

const mode = ref<"unlock" | "set">("unlock");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const loading = ref(false);

mode.value = uiStore.isPasswordSet ? "unlock" : "set";

async function handleSubmit() {
  error.value = "";
  if (!password.value) {
    error.value = t("passwordModal.fillPassword");
    return;
  }

  if (mode.value === "set" && password.value !== confirmPassword.value) {
    error.value = t("passwordModal.mismatch");
    return;
  }

  loading.value = true;
  try {
    if (mode.value === "unlock") {
      const ok = await uiStore.unlock(password.value);
      if (!ok) {
        error.value = t("passwordModal.wrongPassword");
      } else {
        await taskStore.refreshForQuery(
          { ...taskStore.query },
          { errorPrefix: "", notifyOnError: true }
        );
      }
    } else {
      const result = await uiStore.setPassword(password.value);
      if (result) {
        uiStore.closeUnlockModal();
        await taskStore.refreshForQuery(
          { ...taskStore.query },
          { errorPrefix: "", notifyOnError: true }
        );
      }
    }
  } catch (e: any) {
    error.value = e?.message ?? t("password.error");
  } finally {
    loading.value = false;
  }
}

function switchToSet() {
  mode.value = "set";
  password.value = "";
  confirmPassword.value = "";
  error.value = "";
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] flex items-center justify-center p-5">
      <div class="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]" @click="emit('close')"></div>
      <div class="glass relative z-10 w-full max-w-[360px] rounded-2xl p-6 space-y-5">
        <h2 class="text-[20px] font-extrabold text-stone-800 text-center">
          {{ mode === "unlock" ? t("passwordModal.unlockTitle") : t("passwordModal.setTitle") }}
        </h2>

        <label class="block">
          <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("passwordModal.passwordLabel") }}</span>
          <input v-model="password" type="password" maxlength="100"
            class="input-glass h-11 w-full rounded-xl px-4 text-[16px] text-stone-800 placeholder:text-stone-300 tracking-[0.25em]"
            placeholder="••••••"
            @keydown.enter="handleSubmit" />
        </label>

        <label v-if="mode === 'set'" class="block">
          <span class="mb-1.5 block text-[13px] font-semibold text-stone-700">{{ t("passwordModal.confirmLabel") }}</span>
          <input v-model="confirmPassword" type="password" maxlength="100"
            class="input-glass h-11 w-full rounded-xl px-4 text-[16px] text-stone-800 placeholder:text-stone-300 tracking-[0.25em]"
            placeholder="••••••"
            @keydown.enter="handleSubmit" />
        </label>

        <div v-if="error"
          class="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-[13px] font-semibold text-red-700 text-center">
          {{ error }}
        </div>

        <button type="button" class="btn-accent inline-flex h-12 w-full items-center justify-center rounded-xl text-[16px] font-bold"
          :disabled="loading" @click="handleSubmit">
          {{ mode === "unlock" ? t("passwordModal.submitUnlock") : t("passwordModal.submitSet") }}
        </button>

        <button type="button"
          class="block w-full text-center text-[13px] font-semibold text-stone-400 hover:text-stone-600 transition-colors"
          @click="emit('close')">{{ t("category.cancel") }}</button>

        <div class="text-center pt-1">
          <template v-if="mode === 'unlock'">
            <button type="button"
              class="text-[13px] font-semibold transition-colors"
              :class="uiStore.isPasswordSet ? 'text-amber-600 hover:text-amber-700' : 'text-orange-600 hover:text-orange-700'"
              @click="switchToSet">
              {{ t("passwordModal.noPassword") }}
              <span class="underline">{{ t("passwordModal.setLink") }}</span>
            </button>
          </template>
          <template v-else>
            <button type="button"
              class="text-[13px] font-semibold text-stone-500 hover:text-stone-700 transition-colors"
              @click="mode = 'unlock'">
              {{ t("passwordModal.hasPassword") }}
              <span class="underline">{{ t("passwordModal.unlockLink") }}</span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
