import { request } from '@/services/request'
import type { FareItem } from '@/types/checkout'

/** POST /apis/youshan-m/fare/getAllFare */
export function getAllFare() {
  return request<FareItem[]>({
    url: '/apis/youshan-m/fare/getAllFare',
    method: 'POST',
    data: {},
  })
}
