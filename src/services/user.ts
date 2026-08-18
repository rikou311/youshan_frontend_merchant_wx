import { request } from '@/services/request'
import type { UserInfo } from '@/types/user'

/** POST /apis/youshan-m/merchantuser/getUserInfo */
export function getUserInfo() {
  return request<UserInfo>({
    url: '/apis/youshan-m/merchantuser/getUserInfo',
    method: 'POST',
    data: {},
  })
}

/** GET /apis/youshan-m/merchantuser/getPoint */
export function getPoint() {
  return request<number>({
    url: '/apis/youshan-m/merchantuser/getPoint',
    method: 'GET',
  })
}

/** POST /apis/youshan-m/merchantuser/updateUserInfo */
export function updateUserInfo(payload: UserInfo) {
  return request<unknown>({
    url: '/apis/youshan-m/merchantuser/updateUserInfo',
    method: 'POST',
    data: payload,
  })
}
