import { useRef, useState } from 'react'
import { ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import { boundList, unbound } from '@/services/auth'
import type { BoundAccount } from '@/services/auth'
import { requireLogin } from '@/utils/nav'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function failText(results: unknown, fallback: string) {
  return typeof results === 'string' && results ? results : fallback
}

function asBoundList(results: unknown): BoundAccount[] {
  if (Array.isArray(results)) {
    return results.filter((item) => item && typeof item.token === 'string')
  }
  if (results && typeof results === 'object') {
    return Object.values(results as Record<string, BoundAccount>).filter(
      (item) => item && typeof item.token === 'string',
    )
  }
  return []
}

export default function UnboundPage() {
  const [list, setList] = useState<BoundAccount[]>([])
  const [loading, setLoading] = useState(false)
  const actingRef = useRef<Record<string, boolean>>({})

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await boundList()
      const next = asBoundList(res?.results)
      if (next.length > 0) {
        setList(next)
        return
      }
      if (res?.success === false) {
        setList([])
        toast(failText(res.results, '绑定列表加载失败'))
        return
      }
      setList([])
    } catch (err) {
      toast(err instanceof Error ? err.message : '绑定列表加载失败')
    } finally {
      setLoading(false)
    }
  }

  useLoad(() => {
    requireLogin()
  })

  useDidShow(() => {
    if (!requireLogin()) return
    void loadList()
  })

  const onUnbound = async (item: BoundAccount) => {
    if (actingRef.current[item.token]) return
    const modal = await Taro.showModal({
      title: '确认解除绑定',
      content: '您确定要解除此绑定吗？',
      confirmText: '确定',
      cancelText: '取消',
    })
    if (!modal.confirm) return
    actingRef.current[item.token] = true
    try {
      const res = await unbound({ token: item.token })
      if (!res?.success) {
        toast(failText(res?.results, '解除绑定失败'))
        return
      }
      setList((prev) => prev.filter((row) => row.token !== item.token))
      toast('已解除绑定')
    } catch (err) {
      toast(err instanceof Error ? err.message : '解除绑定失败')
    } finally {
      actingRef.current[item.token] = false
    }
  }

  return (
    <View className='unbound'>
      <ScrollView className='unbound__list' scrollY>
        {list.map((item) => (
          <View
            key={item.token}
            className='unbound__btn'
            onClick={() => void onUnbound(item)}
          >
            <Text className='unbound__btn-text'>
              解除登录{item.type === 0 ? '（PC端）' : '（移动端）'}
            </Text>
          </View>
        ))}
        {list.length === 0 && !loading ? (
          <View className='unbound__empty'>
            <Text className='unbound__empty-text'>暂无绑定账号</Text>
          </View>
        ) : null}
        {loading ? (
          <Text className='unbound__empty-text'>Loading...</Text>
        ) : null}
      </ScrollView>
    </View>
  )
}
