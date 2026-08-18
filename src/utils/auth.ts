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

const FAIL_CODES = new Set(['UNDERREVIEW', 'UNALLOWED', 'WECHATUNBOUND', 'logout'])

/** 把后端 token 规范成 `Bearer xxx`，供 Authorization 使用 */
export function normalizeAuthToken(raw: string) {
  let token = String(raw || '').trim()
  if (!token || token === 'null' || token === 'undefined') return ''
  if (token.startsWith('Bearer_')) {
    token = token.replace(/^Bearer_/, 'Bearer ')
  }
  if (!token.startsWith('Bearer ') && token.split('.').length === 3) {
    token = `Bearer ${token}`
  }
  return token
}

export function isLikelyAuthToken(raw: string) {
  const token = normalizeAuthToken(raw)
  if (!token.startsWith('Bearer ')) return false
  const body = token.slice('Bearer '.length).trim()
  return body.length > 16 && !FAIL_CODES.has(body)
}

/** 从 login / miniLogin 的 results 或对象字段里取出 token */
export function extractAuthToken(results: unknown): string {
  if (typeof results === 'string') {
    const text = results.trim()
    if (!text || FAIL_CODES.has(text) || text.includes('WECHATUNBOUND')) return ''
    return normalizeAuthToken(text)
  }
  if (results && typeof results === 'object') {
    const obj = results as Record<string, unknown>
    for (const key of ['token', 'accessToken', 'loginToken', 'authorization']) {
      if (typeof obj[key] === 'string' && obj[key]) {
        const found = extractAuthToken(obj[key])
        if (found) return found
      }
    }
  }
  return ''
}

export function getLoginToken(): string {
  return normalizeAuthToken(Taro.getStorageSync(STORAGE_KEYS.loginToken) || '')
}

export function isLoggedIn(): boolean {
  const state = Taro.getStorageSync(STORAGE_KEYS.loginState)
  const token = getLoginToken()
  return (state === true || state === 'true') && !!token && token !== 'null'
}

export function setLoginSession(token: string) {
  const normalized = normalizeAuthToken(token)
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
