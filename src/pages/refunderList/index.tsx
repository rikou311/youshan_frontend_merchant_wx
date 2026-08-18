import { useCallback, useMemo, useRef, useState } from 'react'
import { ScrollView, View, Text } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import StatusDateFilter from '@/components/StatusDateFilter'
import { getRefunderStateDict } from '@/services/dictionary'
import { cancelRefunder, getRefunder } from '@/services/refunder'
import type { RefunderListItem } from '@/types/refunder'
import { dayEndMs, dayStartMs } from '@/utils/datetime'
import { goRefunderDetail, requireLogin } from '@/utils/nav'
import './index.scss'

const ROWS = 5

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function failText(results: unknown, fallback: string) {
  return typeof results === 'string' && results ? results : fallback
}

function rmb(total: number, rate: number) {
  return (Number(total) * Number(rate) || 0).toFixed(2)
}

export default function RefunderListPage() {
  const [list, setList] = useState<RefunderListItem[]>([])
  const [stateMap, setStateMap] = useState<Record<string, string>>({})
  const [state, setState] = useState('-1')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const cancelingRef = useRef<Record<string, boolean>>({})

  const statusOptions = useMemo(
    () => [
      { value: '-1', label: '全部' },
      ...Object.keys(stateMap).map((key) => ({
        value: key,
        label: stateMap[key],
      })),
    ],
    [stateMap],
  )

  const search = useCallback(
    async (reset: boolean, nextState = state) => {
      if (loadingRef.current) return
      if (!reset && !hasMore) return
      loadingRef.current = true
      setLoading(true)
      const nextPage = reset ? 1 : page + 1
      try {
        const res = await getRefunder({
          page: nextPage,
          rows: ROWS,
          condition: {
            state: nextState,
            searchFDate: startDate ? dayStartMs(startDate) : '',
            searchSDate: endDate ? dayEndMs(endDate) : '',
          },
        })
        if (!res?.success) {
          if (reset) setList([])
          toast(failText(res?.results, '退货加载失败'))
          return
        }
        const rows = Array.isArray(res.results) ? res.results : []
        setList((prev) => (reset ? rows : prev.concat(rows)))
        setPage(nextPage)
        setHasMore(!(rows.length === 0 || rows.length % ROWS > 0))
      } catch (err) {
        toast(err instanceof Error ? err.message : '退货加载失败')
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    },
    [endDate, hasMore, page, startDate, state],
  )

  useLoad(() => {
    requireLogin()
  })

  useDidShow(() => {
    if (!requireLogin()) return
    void (async () => {
      try {
        setStateMap(await getRefunderStateDict())
      } catch {
        /* 字典失败仍可拉列表 */
      }
      void search(true)
    })()
  })

  const onCancel = async (rid: number) => {
    const key = String(rid)
    if (cancelingRef.current[key]) return
    const modal = await Taro.showModal({
      content: '确定要取消吗?',
      confirmText: '确定',
      cancelText: '取消',
    })
    if (!modal.confirm) return
    cancelingRef.current[key] = true
    try {
      const res = await cancelRefunder({ rid })
      if (!res?.success) {
        toast(failText(res?.results, '取消失败'))
        return
      }
      toast('已取消')
      setHasMore(true)
      void search(true)
    } catch (err) {
      toast(err instanceof Error ? err.message : '取消失败')
    } finally {
      cancelingRef.current[key] = false
    }
  }

  return (
    <View className='order-list'>
      <StatusDateFilter
        statusValue={state}
        statusOptions={statusOptions}
        onStatusChange={(value) => {
          setState(value)
          setHasMore(true)
          void search(true, value)
        }}
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
        onConfirmDate={() => {
          setHasMore(true)
          void search(true)
        }}
      />
      <ScrollView
        className='order-list__scroll'
        scrollY
        onScrollToLower={() => {
          if (hasMore && !loading) void search(false)
        }}
      >
        {list.map((item) => (
          <View className='order-card' key={item.rid}>
            <View className='order-card__head'>
              <Text className='order-card__no'>
                编号: {item.rid}    (订单编号：{item.oid})
              </Text>
              <Text className='order-card__state'>
                {stateMap[String(item.state)] || item.state}
              </Text>
            </View>
            <View className='order-card__body'>
              <View className='order-card__thumb' />
              <View className='order-card__meta'>
                <Text className='order-card__line'>
                  订单更新时间：{item.updatetime}
                </Text>
                <Text className='order-card__line'>
                  人民币：{rmb(item.total, item.rate)}元
                </Text>
                <Text className='order-card__line'>总金额：{item.total}円</Text>
              </View>
            </View>
            {Number(item.state) === 0 ? (
              <View
                className='order-card__action order-card__action--left'
                onClick={() => void onCancel(item.rid)}
              >
                <Text className='order-card__action-text'>取消</Text>
              </View>
            ) : null}
            <View
              className='order-card__action'
              onClick={() => goRefunderDetail(item.rid)}
            >
              <Text className='order-card__action-text'>查看详情</Text>
            </View>
          </View>
        ))}

        {list.length === 0 && !loading ? (
          <View className='order-list__empty'>
            <Text className='order-list__empty-text'>暂无退货</Text>
          </View>
        ) : null}
        {loading ? (
          <Text className='order-list__more'>Loading...</Text>
        ) : null}
      </ScrollView>
    </View>
  )
}
