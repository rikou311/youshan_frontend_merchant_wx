import Taro from '@tarojs/taro'
import type { ApiResponse } from '@/types/auth'
import { clearLoginSession, getLoginToken } from '@/utils/auth'

/** H5 走本地代理；小程序需配置合法 request 域名后改成完整后端地址 */
const BASE_URL = process.env.TARO_APP_API || ''

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

export async function request<T = unknown>(options: {
  url: string
  method?: HttpMethod
  data?: unknown
  header?: Record<string, string>
}): Promise<ApiResponse<T>> {
  const { url, method = 'GET', data, header = {} } = options
  const finalHeader: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header,
  }

  if (!isAuthWhitelisted(url)) {
    const token = getLoginToken()
    if (!token) {
      clearLoginSession()
      goLogin()
      return Promise.reject(new Error('未登录或登录已过期'))
    }
    finalHeader.Authorization = token
  }

  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: finalHeader,
      timeout: 30000,
    })

    if (res.statusCode === 401) {
      clearLoginSession()
      goLogin()
      return Promise.reject(new Error('未认证'))
    }

    const body = res.data as ApiResponse<T>

    if (body && body.success === false && body.results === 'logout') {
      clearLoginSession()
      goLogin()
      return Promise.reject(new Error('登录已失效'))
    }

    return body
  } catch (err) {
    throw err
  }
}
