/** 商户后端（dev：application-dev.properties server.port=9191） */
export const MERCHANT_ORIGIN = 'http://127.0.0.1:9191'

/**
 * 公共/分类后端。旧站 setupProxy `/commons` → 8831；
 * 本仓库 H5 proxy 已配 8831，小程序直连与之对齐。
 */
export const COMMON_ORIGIN = 'http://127.0.0.1:8831'

/** /apis/youshan-m/... → 商户 origin；/commons/... → 公共 origin */
export function resolveApiUrl(url: string) {
  if (url.startsWith('/commons/')) {
    return `${COMMON_ORIGIN}${url.slice('/commons'.length)}`
  }
  const path = url.startsWith('/apis/') ? url.slice('/apis'.length) : url
  return `${MERCHANT_ORIGIN}${path}`
}
