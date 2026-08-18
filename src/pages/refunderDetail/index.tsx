import { useRef, useState } from 'react'
import { Input, ScrollView, Text, View } from '@tarojs/components'
import type { InputProps } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { getRefunderStateDict } from '@/services/dictionary'
import { getRefunderById, updateRefunder } from '@/services/refunder'
import type { RefunderLine, RefunderListItem } from '@/types/refunder'
import { requireLogin } from '@/utils/nav'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function failText(results: unknown, fallback: string) {
  return typeof results === 'string' && results ? results : fallback
}

function parseLines(raw: unknown): Record<string, RefunderLine> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, RefunderLine>
  try {
    return JSON.parse(String(raw)) as Record<string, RefunderLine>
  } catch {
    return {}
  }
}

export default function RefunderDetailPage() {
  const router = useRouter()
  const sendingRef = useRef(false)
  const [info, setInfo] = useState<RefunderListItem | null>(null)
  const [lines, setLines] = useState<Record<string, RefunderLine>>({})
  const [stateMap, setStateMap] = useState<Record<string, string>>({})
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(true)

  useLoad(() => {
    if (!requireLogin()) return
    const rid = router.params.rid
    if (!rid) {
      toast('缺少退货单')
      return
    }
    void (async () => {
      setLoading(true)
      try {
        const [res, dict] = await Promise.all([
          getRefunderById({ rid }),
          getRefunderStateDict(),
        ])
        setStateMap(dict)
        if (!res?.success || !res.results) {
          toast(failText(res?.results, '未找到退货单'))
          return
        }
        setInfo(res.results)
        setMemo(res.results.memo || '')
        setLines(parseLines(res.results.data))
      } catch (err) {
        toast(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    })()
  })

  const count = Object.keys(lines).reduce(
    (sum, key) => sum + (Number(lines[key]?.count) || 0),
    0,
  )

  const onMemo: InputProps['onInput'] = (e) => {
    setMemo(e.detail.value)
  }

  const sendMemo = async () => {
    if (!info || sendingRef.current) return
    sendingRef.current = true
    try {
      const res = await updateRefunder({ memo, rid: info.rid })
      if (!res?.success) {
        toast(failText(res?.results, '发送失败'))
        return
      }
      toast('发送成功')
    } catch (err) {
      toast(err instanceof Error ? err.message : '发送失败')
    } finally {
      sendingRef.current = false
    }
  }

  const rmb = ((Number(info?.total) || 0) * (Number(info?.rate) || 0)).toFixed(2)
  const stateText = stateMap[String(info?.state ?? '')] || info?.state || ''

  return (
    <View className='refunder-detail'>
      <ScrollView className='refunder-detail__scroll' scrollY>
        <Text className='refunder-detail__state'>
          退货订单 (状态：{stateText})
        </Text>
        {Object.keys(lines).map((key) => (
          <View className='refunder-detail__row' key={key}>
            <Text className='refunder-detail__title'>{lines[key].title}</Text>
            <Text className='refunder-detail__price'>
              ￥{lines[key].price} X {lines[key].count}
            </Text>
          </View>
        ))}
        <View className='refunder-detail__memo'>
          <Text className='refunder-detail__label'>备注</Text>
          <View className='refunder-detail__memo-row'>
            <Input
              className='refunder-detail__input'
              value={memo}
              onInput={onMemo}
            />
            <View className='refunder-detail__send' onClick={() => void sendMemo()}>
              <Text>发送</Text>
            </View>
          </View>
        </View>
        {loading ? <Text className='refunder-detail__hint'>Loading...</Text> : null}
      </ScrollView>
      <View className='refunder-detail__bar'>
        <Text className='refunder-detail__count'>共 {count} 件</Text>
        <Text className='refunder-detail__total'>
          {info?.total || 0}円
          <Text className='refunder-detail__rmb'> (RMB:{rmb}元)</Text>
        </Text>
      </View>
    </View>
  )
}
