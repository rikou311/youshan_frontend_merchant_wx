import { request } from '@/services/request'
import type { PaymentMethod } from '@/types/checkout'

/** POST /apis/youshan-m/payment/getAllPayment */
export function getAllPayment() {
  return request<PaymentMethod[]>({
    url: '/apis/youshan-m/payment/getAllPayment',
    method: 'POST',
    data: {},
  })
}
