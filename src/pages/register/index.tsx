import { useMemo, useState } from 'react'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import type { CommonEvent } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { registerMerchant } from '@/services/auth'
import { isLoggedIn } from '@/utils/auth'
import { goHome, goLogin } from '@/utils/nav'
import './index.scss'

const UNAME_PATTERN = /^[a-zA-Z0-9]+$/

export default function RegisterPage() {
  const [unick, setUnick] = useState('')
  const [name, setName] = useState('')
  const [uname, setUname] = useState('')
  const [upass, setUpass] = useState('')
  const [umail, setUmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useLoad(() => {
    if (isLoggedIn()) {
      goHome()
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
        const tip =
          typeof res.results === 'string' && res.results
            ? res.results
            : '注册成功，请登录'
        await Taro.showModal({
          title: '注册成功',
          content: tip,
          showCancel: false,
        })
        goLogin()
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
        <Text className='register__sub'>新用户注册</Text>
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

        <Text className='register__link' onClick={goLogin}>
          已有账号？立即登录
        </Text>

        <Button
          className={`register__btn ${!canSubmit ? 'register__btn--disabled' : ''}`}
          loading={submitting}
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting ? '提交中...' : '立即注册'}
        </Button>
      </View>
    </ScrollView>
  )
}
