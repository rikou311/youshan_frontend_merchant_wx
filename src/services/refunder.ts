import { request } from '@/services/request'
import type { RefunderListItem } from '@/types/refunder'

export interface GetRefunderPayload {
  page: number
  rows: number
  condition: {
    state: string
    searchFDate: number | ''
    searchSDate: number | ''
  }
}

/** POST /apis/youshan-m/merchantrefunder/getRefunder */
export function getRefunder(payload: GetRefunderPayload) {
  return request<RefunderListItem[]>({
    url: '/apis/youshan-m/merchantrefunder/getRefunder',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/merchantrefunder/getRefunderById */
export function getRefunderById(payload: { rid: number | string }) {
  return request<RefunderListItem>({
    url: '/apis/youshan-m/merchantrefunder/getRefunderById',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/merchantrefunder/createRefunder */
export function createRefunder(payload: {
  id: number | string
  object: Record<string, number>
}) {
  return request<RefunderListItem>({
    url: '/apis/youshan-m/merchantrefunder/createRefunder',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/merchantrefunder/cancelRefunder */
export function cancelRefunder(payload: { rid: number | string }) {
  return request<unknown>({
    url: '/apis/youshan-m/merchantrefunder/cancelRefunder',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/merchantrefunder/updateRefunder */
export function updateRefunder(payload: { memo: string; rid: number | string }) {
  return request<unknown>({
    url: '/apis/youshan-m/merchantrefunder/updateRefunder',
    method: 'POST',
    data: payload,
  })
}
