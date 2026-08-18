import { useRef, useState } from 'react'
import { Image, Input, ScrollView, Text, View } from '@tarojs/components'
import type { InputProps } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { getCommodityImage } from '@/services/commodity'
import { getOrderById } from '@/services/order'
import { createRefunder } from '@/services/refunder'
import type { OrderLine } from '@/types/checkout'
import { resolveImageUrl } from '@/utils/commodity'
import { requireLogin } from '@/utils/nav'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function failText(results: unknown, fallback: string) {
  return typeof results === 'string' && results ? results : fallback
}

function parseLines(raw: unknown): Record<string, OrderLine> {
  if (!raw) return {}
  let data: Record<string, OrderLine | string> = {}
  if (typeof raw === 'object') {
    data = raw as Record<string, OrderLine | string>
  } else {
    try {
      data = JSON.parse(String(raw)) as Record<string, OrderLine | string>
    } catch {
      return {}
    }
  }
  const next: Record<string, OrderLine> = {}
  Object.keys(data).forEach((key) => {
    const row = data[key]
    if (typeof row === 'string') {
      try {
        next[key] = JSON.parse(row) as OrderLine
      } catch {
        /* skip */
      }
      return
    }
    next[key] = row
  })
  return next
}

function refundMax(row: OrderLine) {
  return Math.max(0, Number(row.count || 0) - Number(row.refund || 0))
}

export default function RefunderApplyPage() {
  const router = useRouter()
  const submittingRef = useRef(false)
  const [orderId, setOrderId] = useState('')
  const [lines, setLines] = useState<Record<string, OrderLine>>({})
  const [images, setImages] = useState<Record<string, string>>({})
  const [applyList, setApplyList] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  useLoad(() => {
    if (!requireLogin()) return
    const id = router.params.id
    if (!id) {
      toast('缺少订单')
      return
    }
    setOrderId(id)
    void (async () => {
      try {
        const res = await getOrderById({ id })
        if (!res?.success || !res.results) {
          toast(failText(res?.results, '订单加载失败'))
          return
        }
        const data = parseLines(res.results.data)
        setLines(data)
        const pids = Object.keys(data)
          .map((key) => Number(data[key].pid))
          .filter((pid) => Number.isFinite(pid) && pid > 0)
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
      }
    })()
  })

  const patchQty = (pid: number, qty: number, max: number) => {
    const next = Math.max(0, Math.min(max, Math.floor(qty)))
    setApplyList((prev) => ({ ...prev, [pid]: next }))
  }

  const amount = Object.keys(applyList).reduce(
    (sum, pid) => sum + (Number(applyList[pid]) || 0),
    0,
  )
  const total = Object.keys(applyList).reduce((sum, pid) => {
    const row = Object.values(lines).find((item) => String(item.pid) === String(pid))
    return sum + (Number(applyList[pid]) || 0) * Number(row?.price || 0)
  }, 0)

  const submit = async () => {
    if (submittingRef.current) return
    const object: Record<string, number> = {}
    Object.keys(applyList).forEach((pid) => {
      const qty = Number(applyList[pid]) || 0
      if (qty > 0) object[pid] = qty
    })
    if (!Object.keys(object).length) {
      toast('请选择退货数量')
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    try {
      const res = await createRefunder({ id: orderId, object })
      if (!res?.success || !res.results) {
        toast(failText(res?.results, '退货失败'))
        return
      }
      const rid = res.results.rid
      if (!rid) {
        toast('退货失败')
        return
      }
      Taro.redirectTo({ url: `/pages/refunderDetail/index?rid=${rid}` })
    } catch (err) {
      toast(err instanceof Error ? err.message : '退货失败')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <View className='refunder-apply'>
      <ScrollView className='refunder-apply__scroll' scrollY>
        {Object.keys(lines).map((key) => {
          const row = lines[key]
          const max = refundMax(row)
          const qty = applyList[String(row.pid)] || 0
          const onInput: InputProps['onInput'] = (e) => {
            patchQty(Number(row.pid), Number(e.detail.value) || 0, max)
          }
          return (
            <View className='refunder-apply__card' key={key}>
              {images[String(row.pid)] ? (
                <Image
                  className='refunder-apply__img'
                  src={images[String(row.pid)]}
                  mode='aspectFill'
                />
              ) : (
                <View className='refunder-apply__img' />
              )}
              <View className='refunder-apply__main'>
                <Text className='refunder-apply__title'>{row.title}</Text>
                <Text className='refunder-apply__price'>￥{row.price}</Text>
                {max > 0 ? (
                  <View className='refunder-apply__stepper'>
                    <View
                      className='refunder-apply__btn'
                      onClick={() => patchQty(Number(row.pid), qty - 1, max)}
                    >
                      <Text>-</Text>
                    </View>
                    <Input
                      className='refunder-apply__input'
                      type='number'
                      value={String(qty)}
                      onInput={onInput}
                    />
                    <View
                      className='refunder-apply__btn'
                      onClick={() => patchQty(Number(row.pid), qty + 1, max)}
                    >
                      <Text>+</Text>
                    </View>
                  </View>
                ) : (
                  <Text className='refunder-apply__done'>已退货</Text>
                )}
              </View>
            </View>
          )
        })}
      </ScrollView>
      <View className='refunder-apply__bar'>
        <Text className='refunder-apply__count'>共 {amount} 件</Text>
        <View className='refunder-apply__right'>
          <Text className='refunder-apply__total'>￥{total}</Text>
          <View
            className={
              submitting
                ? 'refunder-apply__submit refunder-apply__submit--disabled'
                : 'refunder-apply__submit'
            }
            onClick={() => void submit()}
          >
            <Text className='refunder-apply__submit-text'>
              {submitting ? 'Loading...' : '退货'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
