import { useMemo, useState } from 'react'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import type { CommonEvent } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { boundWechatMini, parseBindResponse, registerMerchant } from '@/services/auth'
import {
  getWxEnterPending,
  isLoggedIn,
  clearWxEnterPending,
  setLoginSession,
} from '@/utils/auth'
import { goHome, goLogin, goPending } from '@/utils/nav'
import './index.scss'

const UNAME_PATTERN = /^[a-zA-Z0-9]+$/

export default function RegisterPage() {
  const pending = getWxEnterPending()
  const [unick, setUnick] = useState(pending?.nickName || '')
  const [name, setName] = useState('')
  const [uname, setUname] = useState('')
  const [upass, setUpass] = useState('')
  const [umail, setUmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useLoad(() => {
    if (isLoggedIn()) {
      goHome()
      return
    }
    // 必须从「欢迎进入商城」授权后进入；直接打开则回登录页
    const p = getWxEnterPending()
    if (!p?.tempToken) {
      Taro.showToast({ title: '请先从进入商城开始', icon: 'none' })
      goLogin()
    }
  })

  const canSubmit = useMemo(() => {
    return (
      !!unick.trim() &&
      !!uname.trim() &&
      UNAME_PATTERN.test(uname.trim()) &&
      !!upass &&
      !!phone.trim() &&
      !submitting
    )
  }, [unick, uname, upass, phone, submitting])

  const onSubmit = async () => {
    if (!unick.trim()) {
      Taro.showToast({ title: '请输入店铺名称', icon: 'none' })
      return
    }
    if (!uname.trim()) {
      Taro.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!UNAME_PATTERN.test(uname.trim())) {
      Taro.showToast({ title: '用户名只能包含英文字母和数字', icon: 'none' })
      return
    }
    if (!upass) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (!phone.trim()) {
      Taro.showToast({ title: '请输入电话', icon: 'none' })
      return
    }
    if (submitting) return
    setSubmitting(true)

    try {
      const res = await registerMerchant({
        unick: unick.trim(),
        name: name.trim(),
        uname: uname.trim(),
        upass,
        umail: umail.trim(),
        phone: phone.trim(),
      })

      if (res?.success) {
        const openId = getWxEnterPending()?.tempToken
        if (openId) {
          const bindRes = await boundWechatMini({
            uname: uname.trim(),
            upass,
            token: openId,
          })
          const parsed = parseBindResponse(bindRes)
          clearWxEnterPending()
          if (parsed.type === 'ok') {
            setLoginSession(parsed.token)
            goHome()
            return
          }
          if (parsed.type === 'pending_review') {
            goPending('bind')
            return
          }
          // 绑定失败但注册已成功，仍进注册完成页
          goPending('register')
          return
        }
        clearWxEnterPending()
        goPending('register')
        return
      }

      Taro.showToast({
        title:
          typeof res?.results === 'string' && res.results
            ? res.results
            : '注册失败',
        icon: 'none',
        duration: 2500,
      })
    } catch (err) {
      const tip = err instanceof Error ? err.message : '网络异常，请稍后重试'
      Taro.showToast({ title: tip, icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView className='register' scrollY>
      <View className='register__hero'>
        <Text className='register__brand'>有膳商户</Text>
        <Text className='register__sub'>商家注册</Text>
      </View>

      <View className='register__card'>
        <View className='register__field'>
          <Text className='register__label'>店铺名称 *</Text>
          <Input
            className='register__input'
            placeholder='请输入店铺名称'
            value={unick}
            maxlength={64}
            onInput={(e: CommonEvent) => setUnick(e.detail.value)}
          />
        </View>

        <View className='register__field'>
          <Text className='register__label'>公司名</Text>
          <Input
            className='register__input'
            placeholder='选填'
            value={name}
            maxlength={64}
            onInput={(e: CommonEvent) => setName(e.detail.value)}
          />
        </View>

        <View className='register__field'>
          <Text className='register__label'>用户名 *</Text>
          <Input
            className='register__input'
            placeholder='仅英文字母和数字'
            value={uname}
            maxlength={64}
            onInput={(e: CommonEvent) => setUname(e.detail.value)}
          />
        </View>

        <View className='register__field'>
          <Text className='register__label'>密码 *</Text>
          <Input
            className='register__input'
            password
            placeholder='请输入密码'
            value={upass}
            maxlength={64}
            onInput={(e: CommonEvent) => setUpass(e.detail.value)}
          />
        </View>

        <View className='register__field'>
          <Text className='register__label'>邮箱</Text>
          <Input
            className='register__input'
            placeholder='选填'
            value={umail}
            maxlength={64}
            onInput={(e: CommonEvent) => setUmail(e.detail.value)}
          />
        </View>

        <View className='register__field'>
          <Text className='register__label'>电话 *</Text>
          <Input
            className='register__input'
            type='number'
            placeholder='请输入电话'
            value={phone}
            maxlength={20}
            onInput={(e: CommonEvent) => setPhone(e.detail.value)}
          />
        </View>

        <Button
          className={`register__btn ${!canSubmit ? 'register__btn--disabled' : ''}`}
          loading={submitting}
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting ? '提交中...' : '完成注册'}
        </Button>
      </View>
    </ScrollView>
  )
}
