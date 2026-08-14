import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { clearLoginSession } from '@/utils/auth'
import { goLogin, requireLogin } from '@/utils/nav'
import './index.scss'

export default function Index() {
  useLoad(() => {
    // 未登录不能进首页
    requireLogin()
  })

  const onLogout = () => {
    clearLoginSession()
    Taro.showToast({ title: '已退出登录', icon: 'none' })
    goLogin()
  }

  return (
    <View className='home'>
      <View className='home__hero'>
        <Text className='home__brand'>有膳商户</Text>
        <Text className='home__title'>首页</Text>
        <Text className='home__desc'>登录成功后进入此页，后续在此承接商城业务</Text>
      </View>

      <View className='home__card'>
        <Text className='home__card-title'>当前状态</Text>
        <Text className='home__card-line'>· 已登录</Text>
        <Text className='home__card-line'>· 可继续接商品 / 购物车 / 订单</Text>
      </View>

      <Button className='home__cta' onClick={onLogout}>
        退出登录
      </Button>
    </View>
  )
}
