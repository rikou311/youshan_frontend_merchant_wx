import { useRef, useState } from 'react'
import { Image, Input, ScrollView, Text, View } from '@tarojs/components'
import type { InputProps } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { getCommodityImage } from '@/services/commodity'
import {
  getLogisticsTypeDict,
  getOrderStatusDict,
  getShtimeTypeDict,
} from '@/services/dictionary'
import { getOrderById, updateOrderById } from '@/services/order'
import type { MerchantOrder, OrderLine } from '@/types/checkout'
import { resolveImageUrl } from '@/utils/commodity'
import { formatDateTime } from '@/utils/datetime'
import { goPayOrder, requireLogin } from '@/utils/nav'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function failText(results: unknown, fallback: string) {
  return typeof results === 'string' && results ? results : fallback
}

function parseLines(raw: unknown): Record<string, OrderLine> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, OrderLine>
  try {
    return JSON.parse(String(raw)) as Record<string, OrderLine>
  } catch {
    return {}
  }
}

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function OrderDetailPage() {
  const router = useRouter()
  const actingRef = useRef(false)
  const [order, setOrder] = useState<MerchantOrder | null>(null)
  const [lines, setLines] = useState<Record<string, OrderLine>>({})
  const [images, setImages] = useState<Record<string, string>>({})
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [logisticsMap, setLogisticsMap] = useState<Record<string, string>>({})
  const [shtimeMap, setShtimeMap] = useState<Record<string, string>>({})
  const [memo, setMemo] = useState('')
  const [taxTotal, setTaxTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadOrder = async (id: string) => {
    setLoading(true)
    try {
      const [orderRes, dict, logistics, shtime] = await Promise.all([
        getOrderById({ id }),
        getOrderStatusDict(),
        getLogisticsTypeDict(),
        getShtimeTypeDict(),
      ])
      setStatusMap(dict)
      setLogisticsMap(logistics)
      setShtimeMap(shtime)
      if (!orderRes?.success || !orderRes.results) {
        setOrder(null)
        toast(failText(orderRes?.results, '未找到订单'))
        return
      }
      const next = orderRes.results
      setOrder(next)
      setMemo(next.memo || '')
      const data = parseLines(next.data)
      setLines(data)
      let tax = 0
      const pids: number[] = []
      Object.keys(data).forEach((key) => {
        const row = data[key]
        tax += (num(row.tax) * num(row.count) * num(row.price)) / 100
        if (row.pid) pids.push(Number(row.pid))
      })
      setTaxTotal(Math.ceil(tax))
      if (pids.length) {
        const imgRes = await getCommodityImage(pids)
        if (imgRes?.success && imgRes.results) {
          const map: Record<string, string> = {}
          Object.keys(imgRes.results).forEach((pid) => {
            map[pid] = resolveImageUrl(imgRes.results[pid]?.image)
          })
          setImages(map)
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : '订单加载失败')
    } finally {
      setLoading(false)
    }
  }

  useLoad(() => {
    if (!requireLogin()) return
    const id = router.params.id
    if (!id) {
      toast('缺少订单')
      return
    }
    void loadOrder(id)
  })

  const payAmount =
    num(order?.total) +
    taxTotal +
    num(order?.yf) +
    num(order?.svf) +
    num(order?.lc) +
    num(order?.ld) -
    num(order?.point)

  const onMemo: InputProps['onInput'] = (e) => {
    setMemo(e.detail.value)
  }

  const sendMemo = async () => {
    if (!order || actingRef.current) return
    actingRef.current = true
    try {
      const res = await updateOrderById({ id: order.id, memo })
      if (!res?.success) {
        toast(failText(res?.results, '发送失败'))
        return
      }
      toast('发送成功')
    } catch (err) {
      toast(err instanceof Error ? err.message : '发送失败')
    } finally {
      actingRef.current = false
    }
  }

  const changeStatus = async (status: number, msg: string) => {
    if (!order || actingRef.current) return
    const modal = await Taro.showModal({
      content: `确定${msg}吗?`,
      confirmText: '确定',
      cancelText: '取消',
    })
    if (!modal.confirm) return
    actingRef.current = true
    try {
      const res = await updateOrderById({
        id: order.id,
        status,
        point: order.point,
        uid: order.uid,
      })
      if (!res?.success) {
        toast(failText(res?.results, '操作失败'))
        return
      }
      await loadOrder(String(order.id))
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败')
    } finally {
      actingRef.current = false
    }
  }

  const addr = order?.merchantAddressModel
  const useAddr = order && String(order.addressid || '') !== ''
  const addrText = useAddr
    ? `${addr?.prefecture || ''} ${addr?.city || ''} ${addr?.town || ''} ${addr?.address || ''}`
    : `${order?.city || ''} ${order?.address || ''}`
  const receiver = useAddr ? addr?.receive : order?.name
  const phone = useAddr ? addr?.phone : order?.phone

  if (!loading && !order) {
    return (
      <View className='order-detail'>
        <Text className='order-detail__empty'>未找到订单</Text>
      </View>
    )
  }

  return (
    <View className='order-detail'>
      <ScrollView className='order-detail__scroll' scrollY>
        <View className='order-detail__card'>
          <Text className='order-detail__time'>
            已下单 {formatDateTime(order?.authenmodify)}
          </Text>
          <Text className='order-detail__line'>{addrText}</Text>
          <Text className='order-detail__line'>
            {receiver} {phone}
          </Text>
        </View>

        {Object.keys(lines).map((key) => {
          const row = lines[key]
          return (
            <View className='order-detail__goods' key={key}>
              {images[String(row.pid)] ? (
                <Image
                  className='order-detail__img'
                  src={images[String(row.pid)]}
                  mode='aspectFill'
                />
              ) : (
                <View className='order-detail__img' />
              )}
              <View className='order-detail__goods-main'>
                <Text className='order-detail__goods-title'>{row.title}</Text>
                <Text className='order-detail__goods-unit'>/{row.unit}</Text>
                {String(row.home ?? '').includes('3') ? (
                  <Text className='order-detail__tag'>活动</Text>
                ) : null}
              </View>
              <View className='order-detail__goods-price'>
                <Text>实付:{row.total}円</Text>
                <Text>单价:{row.price}円</Text>
                <Text>×{row.count}</Text>
              </View>
            </View>
          )
        })}

        <View className='order-detail__card'>
          <View className='order-detail__row'>
            <Text>实付款</Text>
            <Text>{`${payAmount}円`}</Text>
          </View>
          <View className='order-detail__row'>
            <Text>商品总额</Text>
            <Text>{order?.total}円</Text>
          </View>
          <View className='order-detail__row'>
            <Text>税费</Text>
            <Text>{taxTotal}円</Text>
          </View>
          {num(order?.yf) > 0 ? (
            <View className='order-detail__row'>
              <Text>运费</Text>
              <Text>{order?.yf}円</Text>
            </View>
          ) : null}
          {num(order?.lc) > 0 || num(order?.ld) > 0 ? (
            <View className='order-detail__row'>
              <Text>保鲜费用</Text>
              <Text>{num(order?.lc) + num(order?.ld)}円</Text>
            </View>
          ) : null}
          {num(order?.svf) > 0 ? (
            <View className='order-detail__row'>
              <Text>货到付款附加费用</Text>
              <Text>-{order?.svf}円</Text>
            </View>
          ) : null}
          {num(order?.point) > 0 ? (
            <View className='order-detail__row'>
              <Text>积分抵扣</Text>
              <Text>-{order?.point}円</Text>
            </View>
          ) : null}
          <View className='order-detail__row'>
            <Text>订单编号：</Text>
            <Text>{order?.id}</Text>
          </View>
          <View className='order-detail__row'>
            <Text>订单时间</Text>
            <Text>{formatDateTime(order?.authenappend)}</Text>
          </View>
          <View className='order-detail__row'>
            <Text>收获时间段</Text>
            <Text>{shtimeMap[String(order?.shtime ?? '')] || order?.shtime}</Text>
          </View>
          <View className='order-detail__row'>
            <Text>状态</Text>
            <Text>{statusMap[String(order?.status ?? '')] || order?.status}</Text>
          </View>
          {order?.wuliu ? (
            <View className='order-detail__row'>
              <Text>物流</Text>
              <Text>{logisticsMap[String(order.wuliu)] || order.wuliu}</Text>
            </View>
          ) : null}
          {order?.pi ? (
            <View className='order-detail__row'>
              <Text>物流订单号：</Text>
              <Text>{order.pi}</Text>
            </View>
          ) : null}
          <View className='order-detail__row'>
            <Text>付款方式</Text>
            <Text>{order?.payNm}</Text>
          </View>
          <View className='order-detail__memo'>
            <Text className='order-detail__memo-label'>备注</Text>
            <View className='order-detail__memo-row'>
              <Input
                className='order-detail__memo-input'
                value={memo}
                onInput={onMemo}
              />
              <View className='order-detail__send' onClick={() => void sendMemo()}>
                <Text className='order-detail__send-text'>发送</Text>
              </View>
            </View>
          </View>

          {order?.status === 1 ? (
            <View
              className='order-detail__btn'
              onClick={() => void changeStatus(7, '退款')}
            >
              <Text>退款</Text>
            </View>
          ) : null}
          {order?.status === 7 ? (
            <View
              className='order-detail__btn'
              onClick={() => void changeStatus(1, '取消退款')}
            >
              <Text>取消退款</Text>
            </View>
          ) : null}
          {order?.status === 0 ? (
            <View className='order-detail__actions'>
              <View
                className='order-detail__btn order-detail__btn--ghost'
                onClick={() => void changeStatus(3, '取消订单')}
              >
                <Text>取消订单</Text>
              </View>
              <View
                className='order-detail__btn'
                onClick={() => goPayOrder(order.id)}
              >
                <Text>付款</Text>
              </View>
            </View>
          ) : null}
          {order?.status === 4 ? (
            <View
              className='order-detail__btn'
              onClick={() => void changeStatus(3, '取消订单')}
            >
              <Text>取消订单</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  )
}
