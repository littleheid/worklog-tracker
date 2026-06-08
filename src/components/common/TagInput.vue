<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const inputText = ref("");

function addTag() {
  const tag = inputText.value.trim();
  if (!tag || tag.length > 20) return;
  const tags = [...props.modelValue, tag].filter((t, i, arr) => arr.indexOf(t) === i);
  if (tags.length > 10) return;
  emit("update:modelValue", tags);
  inputText.value = "";
}

function removeTag(index: number) {
  const tags = props.modelValue.filter((_, i) => i !== index);
  emit("update:modelValue", tags);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    addTag();
  } else if (e.key === "Backspace" && !inputText.value && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1);
  }
}

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i);
    hash |= 0;
  }
  return `tag-${Math.abs(hash) % 8}`;
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/40 bg-white/30 px-2.5 py-2 min-h-[42px]">
    <span
      v-for="(tag, i) in modelValue"
      :key="i"
      class="tag-badge cursor-default select-none gap-1"
      :class="tagColor(tag)"
    >
      {{ tag }}
      <button type="button" class="ml-0.5 opacity-60 hover:opacity-100 transition-opacity" @click="removeTag(i)">&times;</button>
    </span>
    <input
      v-if="modelValue.length < 10"
      v-model="inputText"
      type="text"
      maxlength="20"
      :placeholder="modelValue.length === 0 ? '输入标签，回车添加...' : ''"
      class="flex-1 min-w-[80px] bg-transparent text-[14px] text-stone-700 placeholder:text-stone-400 outline-none border-none py-0.5"
      @keydown="onKeydown"
    />
  </div>
</template>
