import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '@/constants/storage'

export function getLoginToken(): string {
  return Taro.getStorageSync(STORAGE_KEYS.loginToken) || ''
}

export function isLoggedIn(): boolean {
  const state = Taro.getStorageSync(STORAGE_KEYS.loginState)
  const token = getLoginToken()
  return (state === true || state === 'true') && !!token && token !== 'null'
}

export function setLoginSession(token: string) {
  let normalized = token
  if (normalized.startsWith('Bearer_')) {
    normalized = normalized.replace(/^Bearer_/, 'Bearer ')
  }
  Taro.setStorageSync(STORAGE_KEYS.loginToken, normalized)
  Taro.setStorageSync(STORAGE_KEYS.loginState, 'true')
}

export function clearLoginSession() {
  Taro.removeStorageSync(STORAGE_KEYS.loginToken)
  Taro.setStorageSync(STORAGE_KEYS.loginState, 'false')
}
