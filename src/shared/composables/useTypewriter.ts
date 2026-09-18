import { onUnmounted, ref, watch, type Ref } from 'vue'
import { useMotionStore } from '@/stores/motion'

const DEFAULT_CHAR_DELAY_MS = 40

export function useTypewriter(text: Ref<string>, charDelay = DEFAULT_CHAR_DELAY_MS) {
  const motionStore = useMotionStore()
  const display = ref('')
  let timer: ReturnType<typeof setTimeout> | null = null

  function type(full: string) {
    if (timer) clearTimeout(timer)

    if (motionStore.reduced || full.length === 0) {
      display.value = full
      return
    }

    display.value = ''
    let position = 0
    const step = () => {
      position += 1
      display.value = full.slice(0, position)
      timer = position < full.length ? setTimeout(step, charDelay) : null
    }
    timer = setTimeout(step, charDelay)
  }

  watch(text, (newText) => type(newText), { immediate: true, flush: 'sync' })

  // Replay from empty when motion is turned back on; snap immediately when turned off.
  watch(() => motionStore.reduced, () => type(text.value), { flush: 'sync' })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return display
}
