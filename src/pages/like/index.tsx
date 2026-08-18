import { useRef, useState } from 'react'
import { ScrollView, View, Text } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import AddCartSheet from '@/components/AddCartSheet'
import LikeCard from '@/components/LikeCard'
import { delLike, queryLikeCommoditys } from '@/services/like'
import { addToCart } from '@/store/cart'
import { setLoveStatus } from '@/store/love'
import type { Commodity } from '@/types/commodity'
import { goTab, requireLogin, syncTabBar } from '@/utils/nav'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function asList(results: unknown): Commodity[] {
  if (Array.isArray(results)) return results
  if (results && typeof results === 'object') {
    return Object.values(results as Record<string, Commodity>)
  }
  return []
}

export default function LikePage() {
  const [likes, setLikes] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<Commodity | null>(null)
  const removingRef = useRef<Record<number, boolean>>({})
  const addingRef = useRef(false)

  useLoad(() => {
    requireLogin()
  })

  useDidShow(() => {
    if (!requireLogin()) return
    syncTabBar(2)
    void loadLikes()
  })

  const loadLikes = async () => {
    setLoading(true)
    try {
      const res = await queryLikeCommoditys({})
      if (!res?.success) {
        setLikes([])
        toast(typeof res?.results === 'string' ? res.results : '收藏加载失败')
        return
      }
      setLikes(asList(res.results))
    } catch (err) {
      toast(err instanceof Error ? err.message : '收藏加载失败')
    } finally {
      setLoading(false)
    }
  }

  const onRemove = async (item: Commodity) => {
    if (removingRef.current[item.id]) return
    const modal = await Taro.showModal({
      title: '',
      content: '是否移除此商品？',
      confirmText: '确定',
      cancelText: '取消',
    })
    if (!modal.confirm) return
    removingRef.current[item.id] = true
    try {
      const res = await delLike({ pid: item.id })
      if (!res?.success) {
        toast(typeof res?.results === 'string' ? res.results : '移除失败')
        return
      }
      setLikes((prev) => prev.filter((row) => String(row.id) !== String(item.id)))
      setLoveStatus(item.id, false)
    } catch (err) {
      toast(err instanceof Error ? err.message : '移除失败')
    } finally {
      removingRef.current[item.id] = false
    }
  }

  const onConfirmAdd = async (item: Commodity, count: number) => {
    if (addingRef.current) return
    const modal = await Taro.showModal({
      content: '是否添加此商品？',
      confirmText: '确定',
      cancelText: '取消',
    })
    if (!modal.confirm) return
    addingRef.current = true
    try {
      addToCart(item, count)
      setAdding(null)
      Taro.showToast({ title: '已添加一个到购物车', icon: 'success' })
    } finally {
      addingRef.current = false
    }
  }

  return (
    <View className='like'>
      <ScrollView className='like__list' scrollY>
        {likes.map((item) => (
          <LikeCard
            key={item.id}
            item={item}
            onRemove={onRemove}
            onAddCart={setAdding}
          />
        ))}

        {likes.length === 0 && !loading ? (
          <View className='like__empty'>
            <Text className='like__hint'>暂无产品</Text>
            <View className='like__empty-btn' onClick={() => goTab('home')}>
              <Text className='like__empty-btn-text'>去首页选购</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {adding ? (
        <AddCartSheet
          item={adding}
          onClose={() => setAdding(null)}
          onConfirm={onConfirmAdd}
        />
      ) : null}
    </View>
  )
}
