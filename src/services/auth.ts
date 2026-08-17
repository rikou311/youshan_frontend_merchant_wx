import Taro from '@tarojs/taro'
import { request } from '@/services/request'
import type {
  ApiResponse,
  BoundWechatMiniPayload,
  LoginPayload,
  MallEntryResult,
  MiniLoginPayload,
  RegisterPayload,
} from '@/types/auth'

function extraOpenId(extra: ApiResponse['extra']): string | undefined {
  if (typeof extra === 'string' && extra) return extra
  if (extra && typeof extra === 'object' && extra.token) return extra.token
  return undefined
}

function resultCode(results: unknown): string {
  if (typeof results === 'string') return results
  if (results != null) return String(results)
  return ''
}

/** GET /apis/common/index/code */
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

/**
 * POST /apis/common/wxlogin/miniLogin  body: { code }
 *
 * 成功：{ success: true, results: "Bearer ..." }
 * 未绑定：{ success: false, results: "WECHATUNBOUND", extra: openId }
 * 审批中/禁用：UNDERREVIEW / UNALLOWED
 */
export async function miniLogin(payload: MiniLoginPayload) {
  return request<string>({
    url: '/apis/common/wxlogin/miniLogin',
    method: 'POST',
    data: payload,
  })
}

export async function checkMallEntryByWxCode(
  jsCode: string,
): Promise<MallEntryResult> {
  const res = await miniLogin({ code: jsCode })
  const code = resultCode(res?.results)
  const openId = extraOpenId(res?.extra)

  if (res?.success && code && !code.includes('WECHATUNBOUND')) {
    if (code === 'UNDERREVIEW' || code === 'UNALLOWED') {
      return { status: 'blocked', message: mapLoginError(code) }
    }
    return { status: 'registered', token: code }
  }

  if (code === 'UNDERREVIEW' || code === 'UNALLOWED') {
    return { status: 'blocked', message: mapLoginError(code) }
  }

  if (code === 'WECHATUNBOUND' || code.includes('WECHATUNBOUND')) {
    return { status: 'unregistered', jsCode, tempToken: openId }
  }

  return {
    status: 'blocked',
    message: mapLoginError(code || res?.msg || '进入商城失败'),
  }
}

/** @deprecated 微信已收回 getUserProfile，请用绑定页 chooseAvatar + type=nickname */
export async function requestWxUserProfile(): Promise<{
  nickName: string
  avatarUrl: string
}> {
  const env = process.env.TARO_ENV

  if (env === 'weapp') {
    try {
      const profile = await Taro.getUserProfile({
        desc: '用于完善商家注册资料',
      })
      return {
        nickName: profile.userInfo?.nickName || '',
        avatarUrl: profile.userInfo?.avatarUrl || '',
      }
    } catch {
      throw new Error('需要授权后才能继续注册')
    }
  }

  const { confirm } = await Taro.showModal({
    title: '用户授权',
    content: '进入商家注册前需要获取您的微信昵称等信息（H5 预览为模拟授权）',
    confirmText: '同意',
    cancelText: '拒绝',
  })
  if (!confirm) {
    throw new Error('需要授权后才能继续注册')
  }
  return { nickName: '', avatarUrl: '' }
}

/** POST /apis/common/wxlogin/boundWechatMini */
export function boundWechatMini(payload: BoundWechatMiniPayload) {
  return request<string>({
    url: '/apis/common/wxlogin/boundWechatMini',
    method: 'POST',
    data: payload,
  })
}

export const PENDING_MSG_REGISTER =
  '注册完成，需要审核通过以后才能正常使用，请耐心等待。。或请联系管理员'

export const PENDING_MSG_BIND =
  '绑定完成，需要审核通过以后才能正常使用，请耐心等待。。或请联系管理员'

export function isBindUnderReviewSuccess(results: unknown): boolean {
  return results === 'UNDERREVIEWBUTSUCCESS'
}

export type BindHandleResult =
  | { type: 'ok'; token: string }
  | { type: 'pending_review' }
  | { type: 'error'; message: string }

/** 解析 boundWechatMini 响应 */
export function parseBindResponse(res: ApiResponse<string>): BindHandleResult {
  if (res?.success && res.results) {
    return { type: 'ok', token: String(res.results) }
  }
  if (isBindUnderReviewSuccess(res?.results)) {
    return { type: 'pending_review' }
  }
  return {
    type: 'error',
    message: mapBindError(res?.results || res?.msg),
  }
}

export function mapBindError(results: unknown): string {
  switch (results) {
    case 'WRONGPASSWORD':
      return '用户密码错误'
    case 'BOUNDFAIL':
      return '绑定失败，请联系客服人员'
    case 'WECHATUNBOUND':
      return '微信账号未绑定，请重新进入商城'
    case 'UNDERREVIEW':
    case 'UNDERREVIEWBUTSUCCESS':
      return '还未通过审批，请耐心等待或联系客服人员'
    case 'TOKENALREADYBOUND':
      return '该微信账号已被绑定，一个账号只能绑定一个微信'
    default:
      return typeof results === 'string' && results
        ? results
        : '绑定失败，请稍后重试'
  }
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
