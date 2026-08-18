import { request } from '@/services/request'
import type { Commodity, SelectByParamPayload } from '@/types/commodity'

/** POST /apis/youshan-m/merchantcommodity/selectByParam */
export function selectCommodityByParam(payload: SelectByParamPayload) {
  return request<Commodity[]>({
    url: '/apis/youshan-m/merchantcommodity/selectByParam',
    method: 'POST',
    data: payload,
  })
}

/** GET /apis/youshan-m/merchantcommodity/getCommodityById/{id} */
export function getCommodityById(id: number) {
  return request<Commodity>({
    url: `/apis/youshan-m/merchantcommodity/getCommodityById/${id}`,
    method: 'GET',
  })
}

/** POST /apis/youshan-m/merchantcommodity/getListByIds  body 为商品 id 数组 */
export function getListByIds(ids: number[]) {
  return request<Commodity[]>({
    url: '/apis/youshan-m/merchantcommodity/getListByIds',
    method: 'POST',
    data: ids,
  })
}

/** POST /apis/youshan-m/merchantcommodity/getImage  body 为 pid 数组 */
export function getCommodityImage(ids: number[]) {
  return request<Record<string, { image?: string }>>({
    url: '/apis/youshan-m/merchantcommodity/getImage',
    method: 'POST',
    data: ids,
  })
}

/**
 * POST /apis/youshan-m/merchantlike/updateLike
 * results === 'DELETE' 表示取消收藏
 */
export function updateLike(payload: { pid: number }) {
  return request<string>({
    url: '/apis/youshan-m/merchantlike/updateLike',
    method: 'POST',
    data: payload,
  })
}
