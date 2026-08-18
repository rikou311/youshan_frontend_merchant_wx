/** 商品（列表/购物车展示），字段对齐旧站 merchantcommodity */
export interface Commodity {
  id: number
  title: string
  price: number
  image: string
  unit: string
  category: string | number
  tax?: number
  taxtype?: string | number
  /** 含 `'3'` 为活动商品 */
  home?: string | number | null
  love?: number | string | null
  count?: number
  /** 库存 */
  total: number
  limitcount?: number
}

/** GET /commons/jee-fk-permit/category/queryP?kind=1 */
export interface CategoryItem {
  id: number
  type: string | number
  title: string
  image: string
}

export interface SelectByParamPayload {
  page: number
  rows: number
  condition: {
    title: string
    category: string | number
  }
}

/** 购物车条目，key = `"PID" + pid` */
export interface CartLine {
  id: string
  pid: number
  pident: ''
  image: string
  title: string
  price: number
  count: number
  total: number
  category: string | number
  home?: string | number | null
}

export type CartMap = Record<string, CartLine>
