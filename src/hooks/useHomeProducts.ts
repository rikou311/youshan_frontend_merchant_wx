import { useCallback, useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { selectCommodityByParam, updateLike } from '@/services/commodity'
import { queryCommodityCategories } from '@/services/category'
import { applyLove, setLoveStatus, subscribeLove } from '@/store/love'
import { sameCategory } from '@/utils/commodity'
import type { CategoryItem, Commodity } from '@/types/commodity'

const PAGE_ROWS = 10

export function useHomeProducts() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [products, setProducts] = useState<Commodity[]>([])
  const [searchItem, setSearchItem] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const pagesRef = useRef<number[]>([])
  const hasMoreRef = useRef<boolean[]>([])
  const fetchingByIndex = useRef<Record<number, boolean>>({})
  const requestSeq = useRef(0)
  const likingRef = useRef<Record<number, boolean>>({})
  const searchRef = useRef('')
  const indexRef = useRef(0)
  const categoriesRef = useRef<CategoryItem[]>([])
  const productsRef = useRef<Commodity[]>([])

  searchRef.current = searchItem
  indexRef.current = categoryIndex
  categoriesRef.current = categories
  productsRef.current = products

  const resetPaging = (len: number) => {
    pagesRef.current = Array.from({ length: len }, () => 0)
    hasMoreRef.current = Array.from({ length: len }, () => true)
  }

  const fetchPage = useCallback(
    async (
      cats: CategoryItem[],
      index: number,
      keyword: string,
      reset: boolean,
    ) => {
      if (!cats[index]) return
      if (!reset && fetchingByIndex.current[index]) return
      if (!reset && !hasMoreRef.current[index]) return

      if (reset) fetchingByIndex.current = {}
      fetchingByIndex.current[index] = true
      const seq = ++requestSeq.current
      const page = (reset ? 0 : pagesRef.current[index]) + 1

      if (reset) setLoading(true)
      else setLoadingMore(true)

      try {
        const res = await selectCommodityByParam({
          page,
          rows: PAGE_ROWS,
          condition: {
            title: keyword,
            category: cats[index].type,
          },
        })

        if (seq !== requestSeq.current) return

        if (!res?.success) {
          Taro.showToast({
            title:
              typeof res?.results === 'string'
                ? String(res.results)
                : '商品加载失败',
            icon: 'none',
          })
          return
        }

        const list = Array.isArray(res.results) ? res.results : []
        if (list.length > 0) {
          pagesRef.current[index] = page
        }
        if (list.length < PAGE_ROWS) {
          hasMoreRef.current[index] = false
        }

        setProducts((prev) => applyLove(reset ? list : prev.concat(list)))
      } catch (err) {
        if (seq !== requestSeq.current) return
        const tip = err instanceof Error ? err.message : '商品加载失败'
        Taro.showToast({ title: tip, icon: 'none' })
      } finally {
        fetchingByIndex.current[index] = false
        if (seq === requestSeq.current) {
          setLoading(false)
          setLoadingMore(false)
          Taro.stopPullDownRefresh()
        }
      }
    },
    [],
  )

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const list = await queryCommodityCategories()
      setCategories(list)
      setCategoryIndex(0)
      resetPaging(list.length)
      setProducts([])
      if (list.length > 0) {
        await fetchPage(list, 0, searchRef.current, true)
      } else {
        setLoading(false)
      }
    } catch (err) {
      setLoading(false)
      const tip = err instanceof Error ? err.message : '分类加载失败'
      Taro.showToast({ title: tip, icon: 'none' })
    }
  }, [fetchPage])

  const changeCategory = useCallback(
    (index: number) => {
      if (index === indexRef.current) return
      const cats = categoriesRef.current
      if (!cats[index]) return
      setCategoryIndex(index)
      const exists = productsRef.current.some((item) =>
        sameCategory(item.category, cats[index].type),
      )
      if (!exists) {
        fetchPage(cats, index, searchRef.current, false)
      }
    },
    [fetchPage],
  )

  const applySearch = useCallback(
    (keyword: string) => {
      setSearchItem(keyword)
      const cats = categoriesRef.current
      resetPaging(cats.length)
      setProducts([])
      if (cats.length > 0) {
        fetchPage(cats, indexRef.current, keyword, true)
      }
    },
    [fetchPage],
  )

  const loadMore = useCallback(() => {
    fetchPage(
      categoriesRef.current,
      indexRef.current,
      searchRef.current,
      false,
    )
  }, [fetchPage])

  const refresh = useCallback(async () => {
    const cats = categoriesRef.current
    if (cats.length === 0) {
      await loadCategories()
      Taro.stopPullDownRefresh()
      return
    }
    resetPaging(cats.length)
    setProducts([])
    await fetchPage(cats, indexRef.current, searchRef.current, true)
  }, [fetchPage, loadCategories])

  const toggleLike = useCallback(async (item: Commodity) => {
    if (likingRef.current[item.id]) return
    likingRef.current[item.id] = true
    try {
      const res = await updateLike({ pid: item.id })
      if (!res?.success) {
        Taro.showToast({ title: '收藏失败', icon: 'none' })
        return
      }
      setLoveStatus(item.id, res.results !== 'DELETE')
    } catch (err) {
      const tip = err instanceof Error ? err.message : '收藏失败'
      Taro.showToast({ title: tip, icon: 'none' })
    } finally {
      likingRef.current[item.id] = false
    }
  }, [])

  const syncLove = useCallback(() => {
    setProducts((prev) => applyLove(prev))
  }, [])

  useEffect(() => subscribeLove(syncLove), [syncLove])

  const current = categories[categoryIndex]
  const visibleProducts = current
    ? products.filter((item) => sameCategory(item.category, current.type))
    : []

  return {
    categories,
    categoryIndex,
    visibleProducts,
    loading,
    loadingMore,
    hasMore: hasMoreRef.current[categoryIndex] !== false,
    loadCategories,
    changeCategory,
    applySearch,
    loadMore,
    refresh,
    toggleLike,
    syncLove,
  }
}
