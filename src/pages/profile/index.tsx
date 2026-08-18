import { useCallback, useRef, useState } from 'react'
import { Image, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import addressIcon from '@/assets/profile/address.png'
import headerIcon from '@/assets/profile/baidao.png'
import orderIcon from '@/assets/profile/hisShopping.png'
import logoutIcon from '@/assets/profile/logout.png'
import chevronIcon from '@/assets/profile/morethen.png'
import userIcon from '@/assets/profile/personal-center.png'
import { logout } from '@/services/auth'
import { getPoint, getUserInfo } from '@/services/user'
import { clearLoginSession } from '@/utils/auth'
import {
  goAddress,
  goLogin,
  goOrderList,
  goUnbound,
  goUpdateProfile,
  requireLogin,
  syncTabBar,
} from '@/utils/nav'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

const MENUS = [
  { key: 'order', label: '订单管理', icon: orderIcon },
  { key: 'address', label: '地址管理', icon: addressIcon },
  { key: 'update', label: '修改个人信息', icon: userIcon },
  { key: 'service', label: '联系客服人员', icon: userIcon },
  { key: 'unbound', label: '取消绑定', icon: userIcon },
  { key: 'logout', label: '登出', icon: logoutIcon },
] as const

export default function ProfilePage() {
  const [unick, setUnick] = useState('')
  const [point, setPoint] = useState(0)
  const loggingOutRef = useRef(false)

  const loadProfile = useCallback(async () => {
    try {
      const [userRes, pointRes] = await Promise.all([getUserInfo(), getPoint()])
      if (userRes?.success && userRes.results) {
        setUnick(userRes.results.unick || userRes.results.uname || '')
        if (typeof userRes.results.point === 'number') {
          setPoint(userRes.results.point)
        }
      }
      if (pointRes?.success && pointRes.results != null) {
        setPoint(Number(pointRes.results) || 0)
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : '资料加载失败')
    }
  }, [])

  useLoad(() => {
    requireLogin()
  })

  useDidShow(() => {
    if (!requireLogin()) return
    syncTabBar(3)
    void loadProfile()
  })

  const onContact = () => {
    void Taro.showModal({
      title: '联系客服人员',
      content: '请通过微信联系客服人员',
      showCancel: false,
      confirmText: '知道了',
    })
  }

  const onLogout = async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true
    try {
      await logout()
    } catch {
      /* 本地仍退出 */
    }
    clearLoginSession()
    goLogin()
  }

  const onMenu = (key: (typeof MENUS)[number]['key']) => {
    if (key === 'order') {
      goOrderList()
      return
    }
    if (key === 'address') {
      goAddress()
      return
    }
    if (key === 'update') {
      goUpdateProfile()
      return
    }
    if (key === 'service') {
      onContact()
      return
    }
    if (key === 'unbound') {
      goUnbound()
      return
    }
    void onLogout()
  }

  const avatarText = (unick || '商').slice(0, 1)

  return (
    <View className='profile'>
      <ScrollView className='profile__list' scrollY>
        <View className='profile__header'>
          <Image className='profile__mark' src={headerIcon} mode='aspectFit' />
          <Text className='profile__title'>Profile</Text>
        </View>

        <View className='profile__person'>
          <View className='profile__avatar'>
            <Text className='profile__avatar-text'>{avatarText}</Text>
          </View>
          <Text className='profile__name'>
            {unick || '—'} （积分：{point}）
          </Text>
        </View>

        <View className='profile__menus'>
          {MENUS.map((item) => (
            <View
              key={item.key}
              className='profile__row'
              hoverClass='profile__row--hover'
              onClick={() => onMenu(item.key)}
            >
              <View className='profile__row-left'>
                <Image className='profile__icon' src={item.icon} mode='aspectFit' />
                <Text className='profile__row-text'>{item.label}</Text>
              </View>
              <Image className='profile__chevron' src={chevronIcon} mode='aspectFit' />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
