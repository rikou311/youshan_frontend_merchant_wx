/** POST /apis/youshan-m/merchantaddress/queryByUid / saveAddress */
export interface Address {
  id: number | string
  receive: string
  phone?: string
  socialtype?: string | number
  socialaccount?: string
  postcode: string
  prefecture: string
  city: string
  town: string
  address: string
  building?: string
  roomnumber?: string
  /** 1 默认地址 */
  state?: number
}

export interface AddressQueryResult {
  address: Address[]
  user: {
    address?: number | string
  }
}

export interface PostcodeItem {
  id: number
  postcode: string
  prefecture: string
  city: string
  town: string
}

export interface PostcodeQueryPayload {
  page: number
  rows: number
  condition: { postcode: string }
  sort: { prop: string; order: string }
}
