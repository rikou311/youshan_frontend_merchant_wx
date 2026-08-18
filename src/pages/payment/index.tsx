import { useEffect, useRef, useState } from 'react'
import { ScrollView, View, Text, Input, Picker, Image } from '@tarojs/components'
import type { PickerSelectorProps } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { getOrderStatusDict } from '@/services/dictionary'
import { getAllFare } from '@/services/fare'
import { getOrderById, updateOrderById } from '@/services/order'
import { getAllPayment } from '@/services/payment'
import type { FareItem, MerchantOrder, PaymentMethod } from '@/types/checkout'
import { resolveImageUrl } from '@/utils/commodity'
import { buildFareMaps, calcCodFee } from '@/utils/fare'
import { goCart, requireLogin } from '@/utils/nav'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function parseOrderData(raw: unknown) {
  if (!raw) {
    return {} as Record<string, { tax?: number; count?: number; price?: number }>
  }
  if (typeof raw === 'object') {
    return raw as Record<string, { tax?: number; count?: number; price?: number }>
  }
  try {
    return JSON.parse(String(raw)) as Record<
      string,
      { tax?: number; count?: number; price?: number }
    >
  } catch {
    return {}
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const submittingRef = useRef(false)
  const [orderInfo, setOrderInfo] = useState<MerchantOrder | null>(null)
  const [orderState, setOrderState] = useState<Record<string, string>>({})
  const [paymentList, setPaymentList] = useState<PaymentMethod[]>([])
  const [pay, setPay] = useState<number | null>(null)
  const [memo, setMemo] = useState('')
  const [fareCODOb, setFareCODOb] = useState<Record<string, FareItem>>({})
  const [taxTotal, setTaxTotal] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const applyOrder = (order: MerchantOrder) => {
    setOrderInfo(order)
    setPay(Number(order.pay))
    const data = parseOrderData(order.data)
    let tax = 0
    Object.keys(data).forEach((key) => {
      const row = data[key]
      tax +=
        (Number(row.tax) || 0) *
        (Number(row.count) || 0) *
        (Number(row.price) || 0) /
        100
    })
    setTaxTotal(Math.ceil(tax))
  }

  useLoad(() => {
    if (!requireLogin()) return
    const id = router.params.id
    if (!id) {
      toast('缺少订单')
      goCart()
      return
    }
    void (async () => {
      try {
        const [orderRes, dict, fareRes] = await Promise.all([
          getOrderById({ id }),
          getOrderStatusDict(),
          getAllFare(),
        ])
        setOrderState(dict)
        if (!orderRes?.success || !orderRes.results) {
          toast(
            typeof orderRes?.results === 'string'
              ? orderRes.results
              : '订单不存在',
          )
          goCart()
          return
        }
        applyOrder(orderRes.results)
        if (fareRes?.success && Array.isArray(fareRes.results)) {
          setFareCODOb(buildFareMaps(fareRes.results).fareCODOb)
        }
      } catch (err) {
        toast(err instanceof Error ? err.message : '加载失败')
      }
    })()
  })

  const waitingPay = orderInfo?.status === 0

  useEffect(() => {
    if (!waitingPay) return
    void (async () => {
      const res = await getAllPayment()
      if (res?.success && Array.isArray(res.results)) {
        setPaymentList(res.results)
      }
    })()
  }, [waitingPay])

  useEffect(() => {
    const title = orderState[String(orderInfo?.status ?? '')]
    if (title) Taro.setNavigationBarTitle({ title })
  }, [orderInfo?.status, orderState])

  const currentPay =
    paymentList.find((item) => Number(item.value) === Number(pay)) ||
    paymentList[0]
  const payRange = paymentList.map((item) => item.title)

  const yen = Math.floor(
    Number(orderInfo?.total || 0) +
      taxTotal +
      Number(orderInfo?.yf || 0) +
      Number(orderInfo?.ld || 0) +
      Number(orderInfo?.svf || 0) -
      Number(orderInfo?.point || 0),
  )

  const onPayChange: PickerSelectorProps['onChange'] = (e) => {
    const next = paymentList[Number(e.detail.value)]
    if (!next) return
    setPay(Number(next.value))
  }

  const submitPaid = async () => {
    if (!orderInfo || pay == null || !currentPay) {
      toast('请选择支付方式')
      return
    }
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const data: MerchantOrder = {
        ...orderInfo,
        status: pay === 3 ? 4 : 1,
        memo,
        pay,
        payNm: currentPay.title,
        svf: calcCodFee(currentPay, fareCODOb, Number(orderInfo.total) || 0, pay),
      }
      const res = await updateOrderById(data)
      if (!res?.success) {
        toast(typeof res?.results === 'string' ? res.results : '提交失败')
        return
      }
      await Taro.showModal({
        title: '已提交，我们会尽快为您发货',
        showCancel: false,
      })
      goCart()
    } catch (err) {
      toast(err instanceof Error ? err.message : '提交失败')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const onConfirmPaid = async () => {
    const modal = await Taro.showModal({
      title: '提醒',
      content: '我已付款，请尽快发货',
      confirmText: '确定',
      cancelText: '取消',
    })
    if (modal.confirm) void submitPaid()
  }

  const payImage = currentPay?.image ? resolveImageUrl(currentPay.image) : ''

  return (
    <View className='payment'>
      <ScrollView className='payment__list' scrollY>
        {waitingPay && currentPay ? (
          <View className='payment__card'>
            {payImage ? (
              <Image className='payment__img' src={payImage} mode='widthFix' />
            ) : null}
            <Picker mode='selector' range={payRange} onChange={onPayChange}>
              <View className='payment__field'>
                <Text className='payment__label'>支付方式</Text>
                <Text className='payment__value'>{currentPay.title} ›</Text>
              </View>
            </Picker>
            <View className='payment__field'>
              <Text className='payment__label'>备注</Text>
              <Input
                className='payment__input'
                value={memo}
                placeholder='备注'
                onInput={(e) => setMemo(e.detail.value)}
              />
            </View>
            <View className='payment__amount'>
              <Text>需付款：{yen}円</Text>
            </View>
            {/* 旧 H5 为人工确认「我已付款」，未接微信 JSAPI */}
            <View
              className={
                submitting
                  ? 'payment__btn payment__btn--disabled'
                  : 'payment__btn'
              }
              onClick={onConfirmPaid}
            >
              <Text className='payment__btn-text'>
                {submitting ? 'Loading...' : '支付成功'}
              </Text>
            </View>
            <View className='payment__later' onClick={() => goCart()}>
              <Text className='payment__later-text'>以后再付款</Text>
            </View>
          </View>
        ) : (
          <View className='payment__card'>
            <Text className='payment__status'>
              {orderState[String(orderInfo?.status ?? '')] || '处理中...'}
            </Text>
            <View className='payment__later' onClick={() => goCart()}>
              <Text className='payment__later-text'>返回购物车</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
