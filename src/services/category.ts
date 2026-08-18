import { requestRaw } from '@/services/request'
import type { CategoryItem } from '@/types/commodity'

interface CategoryQueryBody {
  data?: CategoryItem[]
}

/** GET /commons/jee-fk-permit/category/queryP?kind=1 → data.data */
export async function queryCommodityCategories() {
  const res = await requestRaw<CategoryQueryBody>({
    url: '/commons/jee-fk-permit/category/queryP?kind=1',
    method: 'GET',
  })
  if (res.statusCode !== 200) {
    throw new Error('分类加载失败')
  }
  return Array.isArray(res.data?.data) ? res.data.data : []
}
