import { onUnmounted, ref, watch, type Ref } from 'vue'
import { useMotionStore } from '@/stores/motion'
import { easeOutCubic } from '@/shared/lib/easing'

const DEFAULT_DURATION_MS = 700
const FRAME_MS = 16

export function useCountUp(target: Ref<number>, duration = DEFAULT_DURATION_MS) {
  const motionStore = useMotionStore()
  const display = ref(0)
  let timer: ReturnType<typeof setTimeout> | null = null

  function animate(from: number, to: number) {
    if (timer) clearTimeout(timer)

    if (motionStore.reduced || to === from) {
      display.value = to
      return
    }

    const start = Date.now()
    const step = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      display.value = Math.round(from + (to - from) * easeOutCubic(progress))
      timer = progress < 1 ? setTimeout(step, FRAME_MS) : null
    }
    step()
  }

  watch(target, (newTarget, oldTarget) => animate(oldTarget ?? 0, newTarget), {
    immediate: true,
    flush: 'sync',
  })

  // Replay from 0 when motion is turned back on; snap immediately when turned off.
  watch(() => motionStore.reduced, () => animate(0, target.value), { flush: 'sync' })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return display
}
