import { View, Text } from '@tarojs/components'
import { useCart } from '@/hooks/useCart'
import { goTab } from '@/utils/nav'
import './index.scss'

const TABS = [
  { key: 'home', label: '首页' },
  { key: 'cart', label: '购物车' },
  { key: 'like', label: '我的收藏' },
  { key: 'profile', label: '我的' },
] as const

type TabKey = (typeof TABS)[number]['key']

function TabIcon({ name, active }: { name: TabKey; active: boolean }) {
  const cls = active
    ? `tab-icon tab-icon--${name} tab-icon--active`
    : `tab-icon tab-icon--${name}`

  if (name === 'home') {
    return (
      <View className={cls}>
        <View className='tab-icon__home-roof' />
        <View className='tab-icon__home-body' />
      </View>
    )
  }

  if (name === 'cart') {
    return (
      <View className={cls}>
        <View className='tab-icon__cart-handle' />
        <View className='tab-icon__cart-box' />
        <View className='tab-icon__cart-wheels'>
          <View className='tab-icon__wheel' />
          <View className='tab-icon__wheel' />
        </View>
      </View>
    )
  }

  if (name === 'like') {
    return (
      <View className={cls}>
        <View className='tab-icon__bag-handle' />
        <View className='tab-icon__bag-body' />
      </View>
    )
  }

  return (
    <View className={cls}>
      <View className='tab-icon__head' />
      <View className='tab-icon__shoulder' />
    </View>
  )
}

interface Props {
  current?: TabKey
}

export default function TabBar({ current = 'home' }: Props) {
  const { amount } = useCart()

  return (
    <View className='tab-bar'>
      {TABS.map((tab) => {
        const active = tab.key === current
        return (
          <View
            key={tab.key}
            className={active ? 'tab-bar__item tab-bar__item--active' : 'tab-bar__item'}
            onClick={() => goTab(tab.key)}
          >
            <View className='tab-bar__icon-wrap'>
              <TabIcon name={tab.key} active={active} />
              {tab.key === 'cart' && amount > 0 ? (
                <Text className='tab-bar__badge'>
                  {amount > 99 ? '99+' : amount}
                </Text>
              ) : null}
            </View>
            <Text className='tab-bar__label'>{tab.label}</Text>
          </View>
        )
      })}
    </View>
  )
}
