import { onMounted, ref, watch, type Ref } from 'vue'
import { useMotionStore } from '@/stores/motion'

// The gauge bar's own CSS width transition drives the fill; this decides the
// starting point (0, animated) or the resting one (reduced motion, static),
// plus when to suppress that transition so a reset to 0 doesn't visibly drain.
export function useGaugeReveal(target: Ref<number>) {
  const motionStore = useMotionStore()
  const revealed = ref(target.value)
  const instant = ref(false)

  function snapTo(value: number) {
    instant.value = true
    revealed.value = value
  }

  function playReveal() {
    snapTo(0)
    // A single rAF can still land before the 0% state is painted, especially
    // with many rows mounting at once; two frames guarantees the transition
    // has something to animate from.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        instant.value = false
        revealed.value = target.value
      })
    })
  }

  if (!motionStore.reduced) {
    snapTo(0)
    onMounted(playReveal)
  }

  watch(
    target,
    (newValue) => {
      revealed.value = newValue
    },
    { flush: 'sync' },
  )

  // Replay from 0 when motion is turned back on; snap immediately when turned off.
  watch(
    () => motionStore.reduced,
    (reduced) => {
      if (reduced) {
        snapTo(target.value)
      } else {
        playReveal()
      }
    },
    { flush: 'sync' },
  )

  return { revealed, instant }
}
