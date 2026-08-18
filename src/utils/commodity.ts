import { MERCHANT_ORIGIN } from '@/constants/api'

/** 相对路径商品图补商户 origin；已是 http(s) 则原样返回 */
export function resolveImageUrl(src?: string | null) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src
  if (src.startsWith('//')) return `https:${src}`
  if (src.startsWith('/')) return `${MERCHANT_ORIGIN}${src}`
  return src
}

export function isPromo(home?: string | number | null) {
  return String(home ?? '').includes('3')
}

export function sameCategory(a: unknown, b: unknown) {
  const na = Number(a)
  const nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb
  return String(a) === String(b)
}
