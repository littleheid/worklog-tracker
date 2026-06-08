import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

const OVERLAY_EVENT = "worklog:overlay-open";

function randomId(): string {
  return `overlay-${Math.random().toString(36).slice(2, 10)}`;
}

export function useOverlayPanel(targets: Ref<HTMLElement | null>[]) {
  const overlayId = randomId();
  const open = ref(false);

  function close() {
    open.value = false;
  }

  function openPanel() {
    if (open.value) {
      return;
    }
    open.value = true;
    window.dispatchEvent(new CustomEvent<string>(OVERLAY_EVENT, { detail: overlayId }));
  }

  function toggle() {
    if (open.value) {
      close();
      return;
    }
    openPanel();
  }

  function handleDocumentClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (targets.some((item) => item.value?.contains(target))) {
      return;
    }
    close();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      close();
    }
  }

  function handleOverlayOpen(event: Event) {
    const customEvent = event as CustomEvent<string>;
    if (customEvent.detail !== overlayId) {
      close();
    }
  }

  onMounted(() => {
    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener(OVERLAY_EVENT, handleOverlayOpen as EventListener);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("click", handleDocumentClick);
    window.removeEventListener("keydown", handleKeydown);
    window.removeEventListener(OVERLAY_EVENT, handleOverlayOpen as EventListener);
  });

  return {
    open,
    close,
    openPanel,
    toggle
  };
}
