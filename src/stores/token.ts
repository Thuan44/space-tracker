import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useTokenStore = defineStore('token', () => {
  const token = ref<string | null>(sessionStorage.getItem('token'))

  function login(newToken: string) {
    token.value = newToken
    sessionStorage.setItem('token', newToken)
  }

  function logout() {
    token.value = null
    sessionStorage.removeItem('token')
  }

  return { token, login, logout }
})
