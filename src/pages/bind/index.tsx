import { useState } from 'react'
import { View, Text, Image, Button, Input } from '@tarojs/components'
import type { CommonEvent } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { boundWechatMini, parseBindResponse } from '@/services/auth'
import type { BindPending } from '@/utils/auth'
import {
  clearBindPending,
  getBindPending,
  isLoggedIn,
  setBindPending,
  setLoginSession,
} from '@/utils/auth'
import { goHome, goLogin, goPending } from '@/utils/nav'
import './index.scss'

const DEFAULT_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

export default function BindPage() {
  const [pending, setPending] = useState<BindPending | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR)
  const [nickName, setNickName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useLoad(() => {
    if (isLoggedIn()) {
      goHome()
      return
    }
    const data = getBindPending()
    if (!data?.uname || !data?.upass || !data?.token) {
      Taro.showToast({ title: '请先完成商家注册', icon: 'none' })
      goLogin()
      return
    }
    setPending(data)
    setAvatarUrl(data.avatarUrl || DEFAULT_AVATAR)
    setNickName(data.nickName || '')
  })

  const syncPending = (patch: Partial<Pick<BindPending, 'nickName' | 'avatarUrl'>>) => {
    if (!pending) return
    const next = { ...pending, ...patch }
    setBindPending(next)
    setPending(next)
  }

  const onChooseAvatar = (e: CommonEvent) => {
    const url = e.detail?.avatarUrl as string | undefined
    if (url) {
      setAvatarUrl(url)
      syncPending({ avatarUrl: url })
    }
  }

  const onNickInput = (e: CommonEvent) => {
    const value = e.detail.value as string
    setNickName(value)
    syncPending({ nickName: value })
  }

  const onBind = async () => {
    if (!pending || submitting) return
    if (!nickName.trim()) {
      setErrorMsg('请填写微信昵称')
      return
    }
    setSubmitting(true)
    setErrorMsg('')
    Taro.showLoading({ title: '绑定中...', mask: true })

    try {
      const res = await boundWechatMini({
        uname: pending.uname,
        upass: pending.upass,
        token: pending.token,
      })

      const parsed = parseBindResponse(res)
      if (parsed.type === 'ok') {
        setLoginSession(parsed.token)
        clearBindPending()
        Taro.showToast({ title: '绑定成功', icon: 'success' })
        setTimeout(() => goHome(), 400)
        return
      }
      if (parsed.type === 'pending_review') {
        clearBindPending()
        goPending('bind')
        return
      }

      setErrorMsg(parsed.message)
    } catch (err) {
      const tip = err instanceof Error ? err.message : '网络异常，请稍后重试'
      setErrorMsg(tip)
    } finally {
      Taro.hideLoading()
      setSubmitting(false)
    }
  }

  if (!pending) {
    return (
      <View className='bind'>
        <Text className='bind__sub'>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='bind'>
      <View className='bind__hero'>
        <Text className='bind__brand'>有膳商户</Text>
        <Text className='bind__sub'>绑定微信账号</Text>
      </View>

      <View className='bind__card'>
        <Text className='bind__section-title'>商家信息</Text>
        <View className='bind__row'>
          <Text className='bind__label'>商家名称</Text>
          <Text className='bind__value'>{pending.unick || '—'}</Text>
        </View>
        <View className='bind__row'>
          <Text className='bind__label'>账号</Text>
          <Text className='bind__value'>{pending.uname}</Text>
        </View>

        <Text className='bind__section-title'>微信账号</Text>
        <Text className='bind__tip'>
          微信已不再支持自动读取头像昵称，请点击下方头像选择、并填写昵称（键盘上方可选微信昵称）。
        </Text>

        <View className='bind__wx'>
          <Button
            className='bind__avatar-btn'
            openType='chooseAvatar'
            onChooseAvatar={onChooseAvatar}
          >
            <Image className='bind__avatar' src={avatarUrl} mode='aspectFill' />
          </Button>
          <View className='bind__wx-info'>
            <Text className='bind__label'>微信昵称</Text>
            <Input
              className='bind__nickname-input'
              type='nickname'
              placeholder='点击填写微信昵称'
              value={nickName}
              maxlength={32}
              onInput={onNickInput}
            />
          </View>
        </View>

        <Text className='bind__hint'>
          确认后将把以上微信账号与商家账号绑定，绑定成功即可进入商城。
        </Text>

        <Button
          className={`bind__btn ${submitting ? 'bind__btn--disabled' : ''}`}
          loading={submitting}
          disabled={submitting}
          onClick={onBind}
        >
          {submitting ? '绑定中...' : '请求绑定'}
        </Button>
        {errorMsg ? <Text className='bind__error'>{errorMsg}</Text> : null}
      </View>
    </View>
  )
}
