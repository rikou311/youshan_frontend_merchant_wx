import { request } from '@/services/request'
import type { ApiResponse, LoginPayload, RegisterPayload } from '@/types/auth'

/** GET /apis/common/index/code → results 为验证码字符串 */
export function fetchCaptcha() {
  return request<string>({
    url: '/apis/common/index/code',
    method: 'GET',
  })
}

/** POST /apis/common/index/login */
export function loginByPassword(payload: LoginPayload) {
  return request<string>({
    url: '/apis/common/index/login',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/common/merchantuseradd/add */
export function registerMerchant(payload: RegisterPayload) {
  return request<string>({
    url: '/apis/common/merchantuseradd/add',
    method: 'POST',
    data: payload,
  })
}

export function mapLoginError(results: unknown): string {
  switch (results) {
    case 'UNDERREVIEW':
      return '还未通过审批，请耐心等待或联系客服人员'
    case 'UNALLOWED':
      return '您的账号已被禁用，请联系客服人员'
    default:
      return typeof results === 'string' && results
        ? results
        : '登录失败，请稍后重试'
  }
}

export type { ApiResponse }
