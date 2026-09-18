import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'reduced-motion'

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export const useMotionStore = defineStore('motion', () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  const reduced = ref(stored !== null ? stored === 'true' : prefersReducedMotion())

  function toggle() {
    reduced.value = !reduced.value
    localStorage.setItem(STORAGE_KEY, String(reduced.value))
  }

  return { reduced, toggle }
})
