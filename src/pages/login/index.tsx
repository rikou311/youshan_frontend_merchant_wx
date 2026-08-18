import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import {
  checkMallEntryByWxCode,
} from '@/services/auth'
import { setLoginSession, setWxEnterPending } from '@/utils/auth'
import { gateOnLaunch, goHome, goOnboard } from '@/utils/nav'
import './index.scss'

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false)

  useLoad(() => {
    // 第一次打开：已登录 → 首页；否则停留本页
    gateOnLaunch()
  })

  const onEnterMall = async () => {
    if (submitting) return
    setSubmitting(true)
    Taro.showLoading({ title: '正在进入...', mask: true })

    try {
      let jsCode = ''
      try {
        const loginRes = await Taro.login()
        jsCode = loginRes?.code || ''
      } catch {
        jsCode = ''
      }

      if (!jsCode) {
        Taro.showToast({
          title: 'H5 无微信 code，请用开发者工具跑小程序',
          icon: 'none',
          duration: 2000,
        })
      }

      const entry = await checkMallEntryByWxCode(jsCode)

      if (entry.status === 'blocked') {
        Taro.showModal({
          title: '无法进入',
          content: entry.message,
          showCancel: false,
        })
        return
      }

      if (entry.status === 'registered') {
        setLoginSession(entry.token)
        Taro.showToast({ title: '欢迎回来', icon: 'success' })
        setTimeout(() => goHome(), 300)
        return
      }

      // 未绑定：先到选择页（注册 / 绑定已有账号）
      Taro.hideLoading()
      setWxEnterPending({
        jsCode: entry.jsCode,
        tempToken: entry.tempToken,
      })
      goOnboard()
    } catch (err) {
      const tip = err instanceof Error ? err.message : '进入失败，请稍后重试'
      Taro.showToast({ title: tip, icon: 'none' })
    } finally {
      Taro.hideLoading()
      setSubmitting(false)
    }
  }

  return (
    <View className='login'>
      <View className='login__hero'>
        <Text className='login__brand'>有善商户</Text>
        <Text className='login__sub'>商户端微信小程序</Text>
      </View>

      <View className='login__card'>
        <Text className='login__welcome'>欢迎光临</Text>
        <Text className='login__hint'>
          点击下方按钮进入商城。若微信未绑定商家，将引导您注册或绑定已有账号。
        </Text>

        <Button
          className={`login__btn ${submitting ? 'login__btn--disabled' : ''}`}
          loading={submitting}
          disabled={submitting}
          onClick={onEnterMall}
        >
          {submitting ? '请稍候...' : '欢迎进入商城'}
        </Button>
      </View>
    </View>
  )
}
