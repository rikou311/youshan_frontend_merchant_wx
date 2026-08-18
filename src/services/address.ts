import { request } from '@/services/request'
import type {
  Address,
  AddressQueryResult,
  PostcodeItem,
  PostcodeQueryPayload,
} from '@/types/address'

/** POST /apis/youshan-m/merchantaddress/queryByUid */
export function queryAddressByUid() {
  return request<AddressQueryResult>({
    url: '/apis/youshan-m/merchantaddress/queryByUid',
    method: 'POST',
    data: {},
  })
}

/** POST /apis/youshan-m/merchantaddress/saveAddress */
export function saveAddress(payload: Address) {
  return request<unknown>({
    url: '/apis/youshan-m/merchantaddress/saveAddress',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/merchantaddress/delAddress */
export function delAddress(payload: { id: number | string }) {
  return request<unknown>({
    url: '/apis/youshan-m/merchantaddress/delAddress',
    method: 'POST',
    data: payload,
  })
}

/** POST /apis/youshan-m/postcode/selectByParam */
export function selectPostcodeByParam(payload: PostcodeQueryPayload) {
  return request<PostcodeItem[]>({
    url: '/apis/youshan-m/postcode/selectByParam',
    method: 'POST',
    data: payload,
  })
}
