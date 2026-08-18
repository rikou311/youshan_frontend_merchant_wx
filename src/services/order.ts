import { request } from '@/services/request'
import type {
  CreateOrderPayload,
  MerchantOrder,
  OrderListItem,
} from '@/types/checkout'

export interface GetOrderPayload {
  page: number
  rows: number
  condition: {
    status: string
    searchFDate: number | ''
    searchSDate: number | ''
  }
}

/** POST /apis/youshan-m/merchantorder/getOrder */
export function getOrder(payload: GetOrderPayload) {
  return request<OrderListItem[]>({
    url: '/apis/youshan-m/merchantorder/getOrder',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/merchantorder/createOrder */
export function createOrder(payload: CreateOrderPayload) {
  return request<MerchantOrder>({
    url: '/apis/youshan-m/merchantorder/createOrder',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/merchantorder/getOrderById */
export function getOrderById(payload: { id: number | string }) {
  return request<MerchantOrder>({
    url: '/apis/youshan-m/merchantorder/getOrderById',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/merchantorder/updateOrderById */
export function updateOrderById(
  payload: Partial<MerchantOrder> & { id: number | string },
) {
  return request<unknown>({
    url: '/apis/youshan-m/merchantorder/updateOrderById',
    method: 'POST',
    data: payload,
  })
}
