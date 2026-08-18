/** POST /apis/youshan-m/payment/getAllPayment */
export interface PaymentMethod {
  id: number
  value: string | number
  title: string
  image?: string
  demomemo?: string
  demoimage?: string
}

/** POST /apis/youshan-m/fare/getAllFare */
export interface FareItem {
  id: number
  type: number | string
  title: string
  fare: number
  display: number | string
}

export interface DictItem {
  id?: number
  value: string
  display: string
}

export interface FareMaps {
  fareCODOb: Record<string, FareItem>
  fareKFOb: Record<string, FareItem>
  fareLimitADDRESSOb: Record<string, FareItem>
}

/** 订单行，key = `"PID" + id`，序列化进 createOrder.data */
export interface OrderLine {
  pid: number
  title: string
  count: number
  unit: string
  price: number
  total: number
  pident: ''
  tax?: number
  taxtype?: string | number
  home?: string | number | null
  refund?: number
}

export interface CreateOrderPayload {
  paid: number
  payid: number
  status: number
  uid: number
  pay: string | number
  uname: string
  umail: string
  mobile: string
  name: string
  phone: string
  city: string
  zip: string
  address: string
  addressid: number | string
  fapiao: string
  taitou: string
  pi: string
  view: string
  view2: string
  total: number
  svf: number
  memo: string
  data: string
  wechat: string
  socialtype: string | number
  wuliu: string
  totald: number
  yf: number
  ld: number
  lc: number
  shtime: string
  rate: number
  point: number
}

export interface MerchantAddressModel {
  prefecture?: string
  city?: string
  town?: string
  address?: string
  receive?: string
  phone?: string
}

export interface MerchantOrder extends CreateOrderPayload {
  id: number
  ordernumber?: string
  payNm?: string
  authenmodify?: number | string
  authenappend?: number | string
  merchantAddressModel?: MerchantAddressModel
}

/** POST /apis/youshan-m/merchantorder/getOrder 列表项 */
export interface OrderListItem {
  id: number
  status: number
  total: number
  rate: number
  authenmodify?: number | string
}
