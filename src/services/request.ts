import Taro from '@tarojs/taro'
import { resolveApiUrl } from '@/constants/api'
import type { ApiResponse } from '@/types/auth'
import { clearLoginSession, getLoginToken } from '@/utils/auth'

export { resolveApiUrl }

function isAuthWhitelisted(url: string) {
  return (
    url.endsWith('/code') ||
    url.startsWith('/apis/common/') ||
    url.startsWith('/commons/jee-fk-permit')
  )
}

function goLogin() {
  const pages = Taro.getCurrentPages()
  const current = pages[pages.length - 1]
  const route = current ? `/${current.route}` : ''
  if (route.includes('/pages/login/index')) return
  Taro.reLaunch({ url: '/pages/login/index' })
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD'

export interface RequestOptions {
  url: string
  method?: HttpMethod
  data?: unknown
  header?: Record<string, string>
}

function buildHeader(url: string, header: Record<string, string>) {
  const finalHeader: Record<string, string> = {
    'content-type': 'application/json',
    ...header,
  }

  if (!isAuthWhitelisted(url)) {
    const token = getLoginToken()
    if (!token) {
      clearLoginSession()
      goLogin()
      throw new Error('未登录或登录已过期')
    }
    const raw = token.startsWith('Bearer ')
      ? token.slice('Bearer '.length).trim()
      : token
    finalHeader.Authorization = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`
    // 微信开发者工具偶发丢掉 Authorization；后端 CORS 声明了 token 头
    finalHeader.token = raw
  }

  return finalHeader
}

function isSessionExpired(statusCode: number, body: unknown) {
  if (
    body &&
    typeof body === 'object' &&
    'success' in body &&
    'results' in body
  ) {
    const res = body as ApiResponse
    if (res.success === false && res.results === 'logout') return true
    if ((res as ApiResponse & { sessionOut?: boolean }).sessionOut === true) {
      return true
    }
  }

  // 白名单接口（分类等）的 401 不能清商家登录态
  if (statusCode !== 401) return false
  return true
}

function handleUnauthorized(url: string, statusCode: number, body: unknown) {
  if (isAuthWhitelisted(url)) return

  if (!isSessionExpired(statusCode, body)) return

  console.warn('[auth] session expired', url, statusCode, body)
  clearLoginSession()
  Taro.showToast({ title: '登录已失效，请重新进入', icon: 'none' })
  goLogin()
  throw new Error('登录已失效')
}

export async function request<T = unknown>(
  options: RequestOptions,
): Promise<ApiResponse<T>> {
  const { url, method = 'GET', data, header = {} } = options
  const finalHeader = buildHeader(url, header)
  const resolved = resolveApiUrl(url)

  const res = await Taro.request({
    url: resolved,
    method,
    data,
    header: finalHeader,
    timeout: 30000,
  })
  console.log('[request]', method, resolved, res.statusCode, res.data)

  handleUnauthorized(url, res.statusCode, res.data)
  return res.data as ApiResponse<T>
}

/** 分类/汇率等非 { success, results } 形态 */
export async function requestRaw<T = unknown>(
  options: RequestOptions,
): Promise<{ statusCode: number; data: T }> {
  const { url, method = 'GET', data, header = {} } = options
  const finalHeader = buildHeader(url, header)
  const resolved = resolveApiUrl(url)

  const res = await Taro.request({
    url: resolved,
    method,
    data,
    header: finalHeader,
    timeout: 30000,
  })
  console.log('[requestRaw]', method, resolved, res.statusCode, res.data)

  handleUnauthorized(url, res.statusCode, res.data)
  return { statusCode: res.statusCode, data: res.data as T }
}
