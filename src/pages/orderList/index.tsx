import { useCallback, useMemo, useRef, useState } from 'react'
import { Image, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import orderThumb from '@/assets/home/orderlist.png'
import StatusDateFilter from '@/components/StatusDateFilter'
import { getOrderStatusDict } from '@/services/dictionary'
import { getOrder } from '@/services/order'
import type { OrderListItem } from '@/types/checkout'
import { dayEndMs, dayStartMs, formatDateTime } from '@/utils/datetime'
import {
  goOrderDetail,
  requireLogin,
} from '@/utils/nav'
import './index.scss'

const ROWS = 5

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function failText(results: unknown, fallback: string) {
  return typeof results === 'string' && results ? results : fallback
}

export default function OrderListPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('-1')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)

  const statusOptions = useMemo(
    () => [
      { value: '-1', label: '全部' },
      ...Object.keys(statusMap).map((key) => ({
        value: key,
        label: statusMap[key],
      })),
    ],
    [statusMap],
  )

  const search = useCallback(
    async (reset: boolean, nextStatus = status) => {
      if (loadingRef.current) return
      if (!reset && !hasMore) return
      loadingRef.current = true
      setLoading(true)
      const nextPage = reset ? 1 : page + 1
      try {
        const res = await getOrder({
          page: nextPage,
          rows: ROWS,
          condition: {
            status: nextStatus,
            searchFDate: startDate ? dayStartMs(startDate) : '',
            searchSDate: endDate ? dayEndMs(endDate) : '',
          },
        })
        if (!res?.success) {
          if (reset) setOrders([])
          toast(failText(res?.results, '订单加载失败'))
          return
        }
        const list = Array.isArray(res.results) ? res.results : []
        setOrders((prev) => (reset ? list : prev.concat(list)))
        setPage(nextPage)
        setHasMore(!(list.length === 0 || list.length % ROWS > 0))
      } catch (err) {
        toast(err instanceof Error ? err.message : '订单加载失败')
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    },
    [endDate, hasMore, page, startDate, status],
  )

  useLoad(() => {
    requireLogin()
  })

  useDidShow(() => {
    if (!requireLogin()) return
    void (async () => {
      try {
        setStatusMap(await getOrderStatusDict())
      } catch {
        /* 字典失败仍可拉列表 */
      }
      void search(true)
    })()
  })

  const onStatusChange = (value: string) => {
    setStatus(value)
    setHasMore(true)
    void search(true, value)
  }

  return (
    <View className='order-list'>
      <StatusDateFilter
        statusValue={status}
        statusOptions={statusOptions}
        onStatusChange={onStatusChange}
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
        {orders.map((order) => (
          <View className='order-card' key={order.id}>
            <View className='order-card__head'>
              <Text className='order-card__no'>订单编号: {order.id}</Text>
              <Text className='order-card__state'>
                {statusMap[String(order.status)] || order.status}
              </Text>
            </View>
            <View
              className='order-card__body'
              onClick={() => goOrderDetail(order.id)}
            >
              <Image className='order-card__thumb' src={orderThumb} mode='aspectFit' />
              <View className='order-card__meta'>
                <Text className='order-card__line'>
                  订单创建时间：{formatDateTime(order.authenmodify)}
                </Text>
                <Text className='order-card__line'>总金额：{order.total}円</Text>
              </View>
            </View>
            {Number(order.status) === 0 ? (
              <View
                className='order-card__action'
                onClick={() => goOrderDetail(order.id)}
              >
                <Text className='order-card__action-text'>修改订单</Text>
              </View>
            ) : null}
          </View>
        ))}

        {orders.length === 0 && !loading ? (
          <View className='order-list__empty'>
            <Text className='order-list__empty-text'>暂无订单</Text>
          </View>
        ) : null}
        {loading ? (
          <Text className='order-list__more'>Loading...</Text>
        ) : null}
      </ScrollView>
    </View>
  )
}
