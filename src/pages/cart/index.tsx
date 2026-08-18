import { ScrollView, View, Text } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import CartCard from '@/components/CartCard'
import { useCart } from '@/hooks/useCart'
import { goConfirmPay, goTab, requireLogin, syncTabBar } from '@/utils/nav'
import type { Commodity } from '@/types/commodity'
import './index.scss'

export default function CartPage() {
  const { items, amount, total, adjustQty, reload } = useCart()

  useLoad(() => {
    requireLogin()
  })

  useDidShow(() => {
    if (!requireLogin()) return
    reload()
    syncTabBar(1)
  })

  const onRemove = (item: Commodity) => {
    adjustQty(item, 0)
  }

  const onCheckout = () => {
    if (amount <= 0) {
      Taro.showToast({ title: '暂无产品', icon: 'none' })
      return
    }
    goConfirmPay()
  }

  return (
    <View className='cart'>
      <ScrollView className='cart__list' scrollY>
        {items.map(({ product }) => (
          <CartCard
            key={product.id}
            item={product}
            onRemove={onRemove}
          />
        ))}

        {items.length === 0 ? (
          <View className='cart__empty'>
            <Text className='cart__hint'>暂无产品</Text>
            <View className='cart__empty-btn' onClick={() => goTab('home')}>
              <Text className='cart__empty-btn-text'>去首页选购</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View className='cart__bar'>
        <View className='cart__bar-left'>
          <Text className='cart__bar-label'>共</Text>
          <Text className='cart__bar-amount'>{amount}</Text>
          <Text className='cart__bar-label'>件</Text>
        </View>
        <View className='cart__bar-right'>
          <View className='cart__bar-price'>
            <Text className='cart__bar-yen'>￥</Text>
            <Text className='cart__bar-total'>{total}</Text>
          </View>
          <View
            className={amount > 0 ? 'cart__checkout' : 'cart__checkout cart__checkout--disabled'}
            onClick={onCheckout}
          >
            <Text className='cart__checkout-text'>結算</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
