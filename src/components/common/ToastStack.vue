<script setup lang="ts">
defineProps<{ items: Array<{ id: string; message: string; kind: "success" | "error" | "info" }>; }>();
defineEmits<{ dismiss: [id: string]; }>();

const styles: Record<string, string> = {
  success: "border-orange-200/60 bg-orange-50/80 text-orange-800",
  error: "border-rose-200/60 bg-rose-50/80 text-rose-800",
  info: "border-orange-200/60 bg-orange-50/80 text-orange-800"
};
</script>

<template>
  <div class="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2.5">
    <div v-for="item in items" :key="item.id"
      class="animate-toast-in pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl"
      :class="styles[item.kind]">
      <span class="flex-1 text-[14px] font-semibold">{{ item.message }}</span>
      <button type="button" class="shrink-0 rounded-lg p-1 opacity-50 transition-opacity hover:opacity-100" @click="$emit('dismiss', item.id)">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
