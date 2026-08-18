import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  Radio,
  RadioGroup,
  Label,
} from '@tarojs/components'
import type { CommonEventFunction } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import CartCard from '@/components/CartCard'
import { useCart } from '@/hooks/useCart'
import { queryAddressByUid } from '@/services/address'
import { getListByIds } from '@/services/commodity'
import { getTakeTimeTypeMerchant } from '@/services/dictionary'
import { getAllFare } from '@/services/fare'
import { createOrder } from '@/services/order'
import { getAllPayment } from '@/services/payment'
import { getJPCNY } from '@/services/rate'
import { getPoint, getUserInfo } from '@/services/user'
import { clearCart } from '@/store/cart'
import { getAddrSelect, pickDefaultAddress, subscribeCheckout } from '@/store/checkout'
import type { Address } from '@/types/address'
import type {
  CreateOrderPayload,
  DictItem,
  FareMaps,
  OrderLine,
  PaymentMethod,
} from '@/types/checkout'
import { goAddress, goPayment, requireLogin } from '@/utils/nav'
import { buildFareMaps, calcAddressFare, calcCodFee, isCashOnDelivery } from '@/utils/fare'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function failText(results: unknown, fallback: string) {
  return typeof results === 'string' && results ? results : fallback
}

export default function ConfirmPayPage() {
  const { items, amount, total, totalToYn, cart, adjustQty, reload } = useCart()
  const submittingRef = useRef(false)

  const [addrSelect, setAddrSelectState] = useState<Address | null>(getAddrSelect())
  const [payment, setPayment] = useState<PaymentMethod[]>([])
  const [paymentSelect, setPaymentSelect] = useState<PaymentMethod | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [takeTimeType, setTakeTimeType] = useState<DictItem[]>([])
  const [takeTime, setTakeTime] = useState('0')
  const [rate, setRate] = useState(0)
  const [fareMaps, setFareMaps] = useState<FareMaps>({
    fareCODOb: {},
    fareKFOb: {},
    fareLimitADDRESSOb: {},
  })
  const [availablePoints, setAvailablePoints] = useState(0)
  const [usePoints, setUsePoints] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return subscribeCheckout(() => setAddrSelectState(getAddrSelect()))
  }, [])

  useLoad(() => {
    requireLogin()
  })

  useDidShow(() => {
    if (!requireLogin()) return
    reload()
    setAddrSelectState(getAddrSelect())
    void loadPageData()
  })

  const loadPageData = async () => {
    try {
      const [addrRes, payRes, fareRes, rateVal, timeType, pointRes] =
        await Promise.all([
          queryAddressByUid(),
          getAllPayment(),
          getAllFare(),
          getJPCNY(),
          getTakeTimeTypeMerchant(),
          getPoint(),
        ])

      if (addrRes?.success) {
        const list = addrRes.results?.address || []
        const picked = pickDefaultAddress(list, addrRes.results?.user?.address)
        setAddrSelectState(picked)
      } else {
        toast(failText(addrRes?.results, '地址加载失败'))
      }

      if (payRes?.success && Array.isArray(payRes.results)) {
        setPayment(payRes.results)
      } else {
        setPayment([])
      }

      if (fareRes?.success && Array.isArray(fareRes.results)) {
        setFareMaps(buildFareMaps(fareRes.results))
      }

      setRate(rateVal || 0)
      setTakeTimeType(timeType)

      if (pointRes?.success) {
        setAvailablePoints(Number(pointRes.results) || 0)
      } else {
        setAvailablePoints(0)
      }
    } catch (err) {
      const tip = err instanceof Error ? err.message : '加载失败，请稍后重试'
      toast(tip)
    }
  }

  const tax = useMemo(() => {
    let sum = 0
    items.forEach(({ product, line }) => {
      sum +=
        (Number(line.price) || 0) *
        (line.count || 0) *
        (Number(product.tax) || 0) /
        100
    })
    return Math.ceil(sum)
  }, [items])

  const svf = useMemo(
    () => calcCodFee(paymentSelect, fareMaps.fareCODOb, totalToYn),
    [paymentSelect, fareMaps.fareCODOb, totalToYn],
  )

  const { yf, kf } = useMemo(
    () =>
      calcAddressFare(
        addrSelect,
        fareMaps.fareLimitADDRESSOb,
        fareMaps.fareKFOb,
        totalToYn,
      ),
    [addrSelect, fareMaps.fareLimitADDRESSOb, fareMaps.fareKFOb, totalToYn],
  )

  const pointsDiscount = useMemo(() => {
    if (!usePoints || availablePoints <= 0) return 0
    return Math.floor(Math.min(availablePoints, total))
  }, [usePoints, availablePoints, total])

  const grandYen = Math.floor(total + tax + yf + kf + svf - pointsDiscount)
  const grandRmb =
    rate > 0 ? Math.ceil((total + tax + yf + kf + svf - pointsDiscount) * rate) : 0
  const isCod = isCashOnDelivery(paymentSelect)

  const onTakeTime: CommonEventFunction<{ value: string }> = (e) => {
    setTakeTime(String(e.detail.value))
  }

  const onRemove = (item: (typeof items)[number]['product']) => {
    adjustQty(item, 0)
  }

  const onSubmit = async () => {
    if (submittingRef.current || submitting) return
    if (amount <= 0) {
      toast('请选择购买商品')
      return
    }

    const modal = await Taro.showModal({
      title: '你确定要下单吗？',
      confirmText: 'Yes',
      cancelText: 'No',
      confirmColor: '#e36049',
    })
    if (!modal.confirm) return

    if (!paymentSelect) {
      toast('请选择支付方式')
      return
    }
    if (Object.keys(cart).length === 0) {
      toast('请选择购买商品')
      return
    }
    if (!addrSelect?.id) {
      toast('请选择收货地址')
      return
    }

    submittingRef.current = true
    setSubmitting(true)

    const order: CreateOrderPayload = {
      paid: 0,
      payid: 0,
      status: 0,
      uid: 0,
      pay: paymentSelect.value,
      uname: '',
      umail: '',
      mobile: '',
      name: addrSelect.receive,
      phone: addrSelect.phone || '',
      city: addrSelect.city,
      zip: addrSelect.postcode,
      address: `${addrSelect.prefecture} ${addrSelect.city} ${addrSelect.town} ${addrSelect.address}`,
      addressid: addrSelect.id,
      fapiao: '',
      taitou: '',
      pi: '',
      view: '',
      view2: '',
      total,
      svf,
      memo: '',
      data: '',
      wechat: addrSelect.socialaccount || '',
      socialtype: addrSelect.socialtype || '',
      wuliu: '',
      totald: 0,
      yf,
      ld: kf,
      lc: 0,
      shtime: takeTime,
      rate,
      point: pointsDiscount,
    }

    const pidlist = Object.keys(cart)
      .map((key) => cart[key]?.pid)
      .filter((id): id is number => typeof id === 'number')

    try {
      if (pidlist.length === 0) {
        toast('请选择购买商品')
        return
      }

      const listRes = await getListByIds(pidlist)
      if (!listRes?.success || !Array.isArray(listRes.results)) {
        toast(failText(listRes?.results, '商品信息刷新失败'))
        return
      }

      const data: Record<string, OrderLine> = {}
      listRes.results.forEach((element) => {
        const line = cart[`PID${element.id}`]
        if (!line) return
        data[`PID${element.id}`] = {
          pid: element.id,
          title: element.title,
          count: line.count,
          unit: element.unit,
          price: element.price,
          total: element.price * line.count,
          pident: '',
          tax: element.tax,
          taxtype: element.taxtype,
          home: element.home,
        }
      })
      order.data = JSON.stringify(data)

      const created = await createOrder(order)
      if (!created?.success || !created.results?.id) {
        toast(failText(created?.results, '下单失败'))
        return
      }

      clearCart()
      void getUserInfo()
      Taro.showToast({ title: '已下单，请付款', icon: 'success' })
      goPayment(created.results.id)
    } catch (err) {
      const tip = err instanceof Error ? err.message : '下单失败，请稍后重试'
      toast(tip)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const addrText = addrSelect
    ? `${addrSelect.postcode} ${addrSelect.prefecture} ${addrSelect.city} ${addrSelect.town} ${addrSelect.address}`
    : '暂无地址，请添加'

  return (
    <View className='confirm'>
      <ScrollView className='confirm__list' scrollY>
        <View className='confirm__card' onClick={() => goAddress()}>
          <View className='confirm__card-main'>
            <Text className='confirm__icon'>址</Text>
            <View className='confirm__addr'>
              <Text className='confirm__addr-line'>{addrText}</Text>
              {addrSelect ? (
                <View className='confirm__addr-meta'>
                  <Text className='confirm__addr-sub'>{addrSelect.receive}</Text>
                  <Text className='confirm__addr-sub'>{addrSelect.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text className='confirm__chevron'>›</Text>
        </View>

        <View className='confirm__card' onClick={() => setPaymentOpen(true)}>
          <View className='confirm__card-main'>
            <Text className='confirm__icon'>付</Text>
            <Text className='confirm__pay-label'>支付方式</Text>
          </View>
          <View className='confirm__pay-right'>
            <Text className='confirm__pay-value'>
              {paymentSelect?.title || '请选择支付方式'}
            </Text>
            <Text className='confirm__chevron'>›</Text>
          </View>
        </View>

        {items.map(({ product }) => (
          <CartCard key={product.id} item={product} onRemove={onRemove} />
        ))}

        {items.length === 0 ? (
          <Text className='confirm__hint'>暂无产品</Text>
        ) : null}

        <View className='confirm__card confirm__card--block'>
          <Text className='confirm__section-label'>送货时间：</Text>
          <RadioGroup onChange={onTakeTime}>
            <View className='confirm__radios'>
              {takeTimeType.map((ele) => (
                <Label className='confirm__radio' key={ele.value}>
                  <Radio
                    value={String(ele.value)}
                    checked={takeTime === String(ele.value)}
                    color='#f2853c'
                  />
                  <Text className='confirm__radio-text'>{ele.display}</Text>
                </Label>
              ))}
            </View>
          </RadioGroup>
        </View>

        <View className='confirm__card confirm__card--block'>
          <View className='confirm__points-info'>
            <Text className='confirm__points-label'>可用积分：</Text>
            <Text className='confirm__points-value'>
              {Math.floor(availablePoints)} 积分
            </Text>
            {availablePoints > 0 ? (
              <Text className='confirm__points-tip'>
                （约可抵扣 {Math.floor(availablePoints)}円）
              </Text>
            ) : null}
          </View>
          <View
            className={
              availablePoints > 0
                ? 'confirm__check'
                : 'confirm__check confirm__check--disabled'
            }
            onClick={() => {
              if (availablePoints <= 0) return
              setUsePoints((v) => !v)
            }}
          >
            <View
              className={
                usePoints
                  ? 'confirm__box confirm__box--on'
                  : 'confirm__box'
              }
            />
            <Text className='confirm__check-text'>使用积分抵扣</Text>
          </View>
        </View>

        <View className='confirm__card confirm__card--block'>
          <Text className='confirm__section-title'>价格明细</Text>
          <View className='confirm__price-row'>
            <Text>商品总价</Text>
            <Text>{Math.floor(total)}</Text>
          </View>
          <View className='confirm__price-row'>
            <Text>税费</Text>
            <Text>{Math.floor(tax)}</Text>
          </View>
          {isCod ? (
            <View className='confirm__price-row'>
              <Text>货到付款附加手续费</Text>
              <Text>{Math.floor(svf)}</Text>
            </View>
          ) : null}
          {yf > 0 ? (
            <View className='confirm__price-row'>
              <Text>运费</Text>
              <Text>{Math.floor(yf)}</Text>
            </View>
          ) : null}
          {kf > 0 ? (
            <View className='confirm__price-row'>
              <Text>保鲜费用</Text>
              <Text>{Math.floor(kf)}</Text>
            </View>
          ) : null}
          {usePoints && pointsDiscount > 0 ? (
            <View className='confirm__price-row'>
              <Text>积分抵扣</Text>
              <Text className='confirm__discount'>-{Math.floor(pointsDiscount)}</Text>
            </View>
          ) : null}
          <View className='confirm__grand'>
            <Text>合计</Text>
            <View className='confirm__grand-right'>
              {rate > 0 ? (
                <Text className='confirm__rmb'>{grandRmb}元(RMB)</Text>
              ) : null}
              <Text className='confirm__yen'>{grandYen}円</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className='confirm__bar'>
        <View className='confirm__bar-left'>
          <Text className='confirm__bar-label'>共</Text>
          <Text className='confirm__bar-amount'> {amount}</Text>
          <Text className='confirm__bar-label'>件</Text>
        </View>
        <View className='confirm__bar-right'>
          <Text className='confirm__bar-total'>{grandYen}円</Text>
          <View
            className={
              submitting || amount <= 0
                ? 'confirm__submit confirm__submit--disabled'
                : 'confirm__submit'
            }
            onClick={onSubmit}
          >
            <Text className='confirm__submit-text'>
              {submitting ? 'Loading...' : '去支付'}
            </Text>
          </View>
        </View>
      </View>

      {paymentOpen ? (
        <View className='pay-drawer'>
          <View
            className='pay-drawer__mask'
            onClick={() => setPaymentOpen(false)}
          />
          <View className='pay-drawer__panel'>
            <Text className='pay-drawer__title'>支付方式</Text>
            {payment.map((ele) => (
              <View
                className='pay-drawer__item'
                key={ele.id}
                onClick={() => {
                  setPaymentSelect(ele)
                  setPaymentOpen(false)
                }}
              >
                <Text className='pay-drawer__text'>{ele.title}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}
