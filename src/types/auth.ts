export interface ApiResponse<T = unknown> {
  success: boolean
  results: T
  msg?: string
  /** miniLogin 未绑定时 extra 为 openId 字符串 */
  extra?: string | { token?: string; uname?: string; [key: string]: unknown }
}

export interface LoginPayload {
  uname: string
  upass: string
  code: string
}

/** POST /apis/common/merchantuseradd/add */
export interface RegisterPayload {
  unick: string
  name?: string
  uname: string
  upass: string
  umail?: string
  phone: string
}

export type LoginFailCode = 'UNDERREVIEW' | 'UNALLOWED' | string

/** POST /apis/common/wxlogin/miniLogin */
export interface MiniLoginPayload {
  code: string
}

/** POST /apis/common/wxlogin/boundWechatMini */
export interface BoundWechatMiniPayload {
  uname: string
  upass: string
  /** openId，来自 miniLogin 的 extra */
  token: string
}

/**
 * 小程序「欢迎进入商城」进站结果（POST /apis/common/wxlogin/miniLogin）
 * - registered：已绑定商家，results 为 Bearer token
 * - unregistered：WECHATUNBOUND，extra 为 openId
 */
export type MallEntryResult =
  | { status: 'registered'; token: string }
  | { status: 'unregistered'; tempToken?: string; jsCode: string }
  | { status: 'blocked'; message: string }
