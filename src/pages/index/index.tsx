import { ScrollView, View, Text } from '@tarojs/components'
import {
  useDidShow,
  useLoad,
  usePullDownRefresh,
} from '@tarojs/taro'
import { useCallback, useState } from 'react'
import CategoryTabs from '@/components/CategoryTabs'
import ProductCard from '@/components/ProductCard'
import SearchBar from '@/components/SearchBar'
import { useHomeProducts } from '@/hooks/useHomeProducts'
import { getPoint, getUserInfo } from '@/services/user'
import { requireLogin, syncTabBar } from '@/utils/nav'
import './index.scss'

export default function Index() {
  const [unick, setUnick] = useState('')
  const [point, setPoint] = useState(0)
  const {
    categories,
    categoryIndex,
    visibleProducts,
    loading,
    loadingMore,
    hasMore,
    loadCategories,
    changeCategory,
    applySearch,
    loadMore,
    refresh,
    toggleLike,
    syncLove,
  } = useHomeProducts()

  const loadProfile = useCallback(async () => {
    try {
      const [userRes, pointRes] = await Promise.all([getUserInfo(), getPoint()])
      if (userRes?.success && userRes.results) {
        setUnick(userRes.results.unick || '')
        if (typeof userRes.results.point === 'number') {
          setPoint(userRes.results.point)
        }
      }
      if (pointRes?.success && pointRes.results != null) {
        setPoint(Number(pointRes.results) || 0)
      }
    } catch {
      /* 顶栏积分失败不阻断商品列表 */
    }
  }, [])

  useLoad(() => {
    if (!requireLogin()) return
    loadCategories()
    loadProfile()
  })

  useDidShow(() => {
    syncTabBar(0)
    syncLove()
  })

  usePullDownRefresh(() => {
    refresh()
  })

  const showEmpty = !loading && visibleProducts.length === 0

  return (
    <View className='mall'>
      <View className='mall__header'>
        <View className='mall__avatar'>
          <Text className='mall__avatar-text'>
            {(unick || '商').slice(0, 1)}
          </Text>
        </View>
        <Text className='mall__hello'>
          {unick || '您好'}
          {`  （积分：${point}）`}
        </Text>
      </View>

      <SearchBar onSearch={applySearch} />

      {categories.length > 0 ? (
        <CategoryTabs
          items={categories}
          activeIndex={categoryIndex}
          onChange={changeCategory}
        />
      ) : null}

      <ScrollView
        className='mall__list'
        scrollY
        lowerThreshold={80}
        onScrollToLower={loadMore}
      >
        {visibleProducts.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            onToggleLike={toggleLike}
          />
        ))}

        {loading && visibleProducts.length === 0 ? (
          <Text className='mall__hint'>Loading...</Text>
        ) : null}

        {showEmpty ? (
          <Text className='mall__hint'>暂无产品</Text>
        ) : null}

        {loadingMore ? (
          <Text className='mall__hint'>Loading...</Text>
        ) : null}

        {!loading && !loadingMore && !hasMore && visibleProducts.length > 0 ? (
          <Text className='mall__hint'>没有更多了</Text>
        ) : null}
      </ScrollView>
    </View>
  )
}
