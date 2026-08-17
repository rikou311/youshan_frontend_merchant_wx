import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '@/constants/storage'

export interface WxEnterPending {
  jsCode?: string
  tempToken?: string
  nickName?: string
  avatarUrl?: string
}

/** 注册完成后、绑定微信前暂存 */
export interface BindPending {
  /** 商家名称（店铺名） */
  unick: string
  /** 登录账号 */
  uname: string
  upass: string
  /** miniLogin 返回的 openId，作为 boundWechatMini 的 token */
  token: string
  nickName?: string
  avatarUrl?: string
}

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
  Taro.removeStorageSync(STORAGE_KEYS.wxEnterPending)
  Taro.removeStorageSync(STORAGE_KEYS.bindPending)
}

export function setWxEnterPending(data: WxEnterPending) {
  Taro.setStorageSync(STORAGE_KEYS.wxEnterPending, data)
}

export function getWxEnterPending(): WxEnterPending | null {
  const raw = Taro.getStorageSync(STORAGE_KEYS.wxEnterPending)
  if (!raw || typeof raw !== 'object') return null
  return raw as WxEnterPending
}

export function clearWxEnterPending() {
  Taro.removeStorageSync(STORAGE_KEYS.wxEnterPending)
}

export function setBindPending(data: BindPending) {
  Taro.setStorageSync(STORAGE_KEYS.bindPending, data)
}

export function getBindPending(): BindPending | null {
  const raw = Taro.getStorageSync(STORAGE_KEYS.bindPending)
  if (!raw || typeof raw !== 'object') return null
  return raw as BindPending
}

export function clearBindPending() {
  Taro.removeStorageSync(STORAGE_KEYS.bindPending)
}
