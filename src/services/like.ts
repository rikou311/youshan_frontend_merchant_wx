import { request } from '@/services/request'
import type { Commodity } from '@/types/commodity'

/** POST /apis/youshan-m/merchantlike/queryLikeCommoditys */
export function queryLikeCommoditys(payload: object = {}) {
  return request<Commodity[]>({
    url: '/apis/youshan-m/merchantlike/queryLikeCommoditys',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/merchantlike/delLike */
export function delLike(payload: { pid: number }) {
  return request<unknown>({
    url: '/apis/youshan-m/merchantlike/delLike',
    method: 'POST',
    data: payload,
  })
}
