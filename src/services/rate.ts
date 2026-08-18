import { requestRaw } from '@/services/request'

/**
 * POST /apis/common/rate/getJPCNY
 * 旧站直接用 HTTP 200 的 data 数字，非 { success, results }
 */
export async function getJPCNY() {
  const res = await requestRaw<number>({
    url: '/apis/common/rate/getJPCNY',
    method: 'POST',
    data: {},
  })
  if (res.statusCode === 200) {
    const n = Number(res.data)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}
