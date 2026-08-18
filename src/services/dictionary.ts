import { requestRaw } from '@/services/request'
import type { DictItem } from '@/types/checkout'

type DictionaryBody = Record<string, DictItem[] | undefined>

/**
 * POST /apis/common/dictionary/queryByGroupIds
 * 旧站：HTTP 200 时用 data.<groupId>
 */
export async function queryByGroupIds(groupIds: string[]) {
  const res = await requestRaw<DictionaryBody>({
    url: '/apis/common/dictionary/queryByGroupIds',
    method: 'POST',
    data: groupIds,
  })
  if (res.statusCode !== 200 || !res.data || typeof res.data !== 'object') {
    return {} as DictionaryBody
  }
  return res.data
}

export async function getTakeTimeTypeMerchant() {
  const data = await queryByGroupIds(['take_time_type_merchant'])
  return Array.isArray(data.take_time_type_merchant)
    ? data.take_time_type_merchant
    : []
}

export async function getSocialType() {
  const data = await queryByGroupIds(['social_type'])
  return Array.isArray(data.social_type) ? data.social_type : []
}

async function toDictMap(groupId: string) {
  const data = await queryByGroupIds([groupId])
  const list = Array.isArray(data[groupId]) ? data[groupId]! : []
  const map: Record<string, string> = {}
  list.forEach((item) => {
    map[String(item.value)] = item.display
  })
  return map
}

export async function getOrderStatusDict() {
  return toDictMap('order_status')
}

export async function getRefunderStateDict() {
  return toDictMap('refunder_state')
}

export async function getLogisticsTypeDict() {
  return toDictMap('logistics_type')
}

export async function getShtimeTypeDict() {
  return toDictMap('take_time_type_merchant')
}
