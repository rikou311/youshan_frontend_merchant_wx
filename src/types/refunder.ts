/** POST /apis/youshan-m/merchantrefunder/getRefunder 列表项 */
export interface RefunderListItem {
  rid: number
  oid: number
  state: number
  total: number
  rate: number
  updatetime?: string
  memo?: string
  data?: string
}

export interface RefunderLine {
  pid?: number
  title: string
  price: number
  count: number
}
