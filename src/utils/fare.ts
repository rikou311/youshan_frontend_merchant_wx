import type { FareItem, FareMaps, PaymentMethod } from '@/types/checkout'
import type { Address } from '@/types/address'

/** 对齐旧站 SET_FAREOB：按 type 分组后写入 COD / 保鲜 / 都道府县门槛 */
export function buildFareMaps(list: FareItem[]): FareMaps {
  const grouped: Record<string, FareItem[]> = {}
  list.forEach((ele) => {
    const key = String(ele.type)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(ele)
  })

  const fareCODOb: Record<string, FareItem> = {}
  const fareKFOb: Record<string, FareItem> = {}
  const fareLimitADDRESSOb: Record<string, FareItem> = {}

  ;(grouped['0'] || []).forEach((ele) => {
    fareCODOb[ele.title.split('_')[1] || '无限'] = ele
  })
  ;(grouped['2'] || []).forEach((ele) => {
    fareKFOb[ele.title] = ele
  })
  ;(['3', '4', '5'] as const).forEach((type) => {
    ;(grouped[type] || []).forEach((ele) => {
      fareLimitADDRESSOb[ele.title] = ele
    })
  })

  return { fareCODOb, fareKFOb, fareLimitADDRESSOb }
}

/** 货到付款：title 或 value/pay === 3 */
export function isCashOnDelivery(
  paymentSelect: PaymentMethod | null,
  pay?: string | number,
) {
  if (paymentSelect?.title === '货到付款') return true
  const value = pay ?? paymentSelect?.value
  return Number(value) === 3
}

/** 对齐 RESET_FARE("payment")：货到付款按门槛取 svf */
export function calcCodFee(
  paymentSelect: PaymentMethod | null,
  fareCODOb: Record<string, FareItem>,
  totalToYn: number,
  pay?: string | number,
) {
  if (!isCashOnDelivery(paymentSelect, pay)) return 0
  const keys = Object.keys(fareCODOb)
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]
    if (key !== '无限' && totalToYn <= Number(key)) {
      return Number(fareCODOb[key].fare) || 0
    }
    if (key === '无限') {
      return Number(fareCODOb[key].fare) || 0
    }
  }
  return 0
}

/** 对齐 RESET_FARE("address")：低于都道府县门槛收运费 + 冷冻保鲜费 */
export function calcAddressFare(
  addrSelect: Address | null,
  fareLimitADDRESSOb: Record<string, FareItem>,
  fareKFOb: Record<string, FareItem>,
  totalToYn: number,
) {
  if (!addrSelect?.prefecture) {
    return { yf: 0, kf: 0 }
  }
  const rule = fareLimitADDRESSOb[addrSelect.prefecture]
  if (!rule) {
    return { yf: 0, kf: 0 }
  }
  if (totalToYn < Number(rule.display)) {
    return {
      yf: Number(rule.fare) || 0,
      kf: Number(fareKFOb['冷冻']?.fare) || 0,
    }
  }
  return { yf: 0, kf: 0 }
}
