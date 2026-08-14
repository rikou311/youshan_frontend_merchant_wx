export interface ApiResponse<T = unknown> {
  success: boolean
  results: T
  msg?: string
  extra?: {
    token?: string
    uname?: string
    [key: string]: unknown
  }
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
