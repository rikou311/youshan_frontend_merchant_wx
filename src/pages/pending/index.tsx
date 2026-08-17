import { View, Text, Button } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { PENDING_MSG_BIND, PENDING_MSG_REGISTER } from '@/services/auth'
import { goLogin } from '@/utils/nav'
import './index.scss'

export default function PendingPage() {
  const router = useRouter()
  const isBind = router.params.mode === 'bind'
  const title = isBind ? '绑定完成' : '注册完成'
  const message = isBind ? PENDING_MSG_BIND : PENDING_MSG_REGISTER

  return (
    <View className='pending'>
      <View className='pending__hero'>
        <Text className='pending__brand'>有膳商户</Text>
      </View>

      <View className='pending__card'>
        <Text className='pending__title'>{title}</Text>
        <Text className='pending__msg'>{message}</Text>
        <Button className='pending__btn' onClick={goLogin}>
          返回登录
        </Button>
      </View>
    </View>
  )
}
