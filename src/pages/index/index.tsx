import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { clearLoginSession } from '@/utils/auth'
import { goLogin, requireLogin } from '@/utils/nav'
import './index.scss'

/** 临时欢迎首页，后续替换为商城业务首页 */
export default function Index() {
  useLoad(() => {
    requireLogin()
  })

  const onLogout = () => {
    clearLoginSession()
    Taro.showToast({ title: '已退出', icon: 'none' })
    goLogin()
  }

  return (
    <View className='home'>
      <View className='home__hero'>
        <Text className='home__brand'>有膳商户</Text>
        <Text className='home__title'>欢迎回来</Text>
        <Text className='home__desc'>
          这是临时欢迎页。登录 / 注册流程已打通，后续在此接入商品、购物车与订单。
        </Text>
      </View>

      <View className='home__card'>
        <Text className='home__card-title'>下一步</Text>
        <Text className='home__card-line'>· 商品列表与详情</Text>
        <Text className='home__card-line'>· 购物车与下单</Text>
        <Text className='home__card-line'>· 订单与支付</Text>
      </View>

      <Button className='home__cta' onClick={onLogout}>
        退出登录
      </Button>
    </View>
  )
}
