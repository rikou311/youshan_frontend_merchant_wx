import { useMemo, useRef, useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import type { CommonEvent } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import CaptchaCode from '@/components/CaptchaCode'
import { loginByPassword, mapLoginError } from '@/services/auth'
import { clearLoginSession, setLoginSession } from '@/utils/auth'
import { gateOnLaunch, goHome, goRegister } from '@/utils/nav'
import './index.scss'

export default function LoginPage() {
  const [uname, setUname] = useState('')
  const [upass, setUpass] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bannerMsg, setBannerMsg] = useState('')
  const captchaKey = useRef(0)
  const [captchaNonce, setCaptchaNonce] = useState(0)

  useLoad(() => {
    // 已注册且已登录 → 直接进首页
    gateOnLaunch()
  })

  const canSubmit = useMemo(
    () => !!uname.trim() && !!upass && !!code.trim() && !submitting,
    [uname, upass, code, submitting],
  )

  const refreshCaptcha = () => {
    captchaKey.current += 1
    setCaptchaNonce(captchaKey.current)
    setCode('')
  }

  const onLogin = async () => {
    if (!uname.trim() || !upass || !code.trim()) {
      Taro.showToast({ title: '请填写账号、密码和验证码', icon: 'none' })
      return
    }
    if (submitting) return
    setSubmitting(true)
    setBannerMsg('')

    try {
      const res = await loginByPassword({
        uname: uname.trim(),
        upass,
        code: code.trim(),
      })

      if (res?.success && res.results) {
        setLoginSession(String(res.results))
        Taro.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          goHome()
        }, 400)
        return
      }

      clearLoginSession()
      const tip = mapLoginError(res?.results)
      if (res?.results === 'UNDERREVIEW' || res?.results === 'UNALLOWED') {
        setBannerMsg(tip)
      } else {
        Taro.showToast({ title: tip, icon: 'none', duration: 2500 })
      }
      refreshCaptcha()
    } catch (err) {
      clearLoginSession()
      const tip = err instanceof Error ? err.message : '网络异常，请稍后重试'
      Taro.showToast({ title: tip, icon: 'none' })
      refreshCaptcha()
    } finally {
      setSubmitting(false)
    }
  }

  /** 小程序微信登录：先取 code；换票接口需后端提供，禁止伪造 path */
  const onWechatLogin = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const { code: wxCode } = await Taro.login()
      if (!wxCode) {
        Taro.showToast({ title: '获取微信登录凭证失败', icon: 'none' })
        return
      }
      console.log('[wechat-login] js_code=', wxCode)
      Taro.showModal({
        title: '微信登录',
        content:
          '已获取微信登录 code。小程序换票接口需与后端确认后接入，请先使用账号密码登录。',
        showCancel: false,
      })
    } catch {
      Taro.showToast({ title: '微信登录失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='login'>
      <View className='login__hero'>
        <Text className='login__brand'>有膳商户</Text>
        <Text className='login__sub'>欢迎登录商户端</Text>
      </View>

      <View className='login__card'>
        {bannerMsg ? (
          <View className='login__banner'>
            <Text className='login__banner-text'>{bannerMsg}</Text>
          </View>
        ) : null}

        <View className='login__field'>
          <Text className='login__label'>账号</Text>
          <Input
            className='login__input'
            type='text'
            placeholder='请输入账号'
            value={uname}
            maxlength={64}
            onInput={(e: CommonEvent) => setUname(e.detail.value)}
          />
        </View>

        <View className='login__field'>
          <Text className='login__label'>密码</Text>
          <Input
            className='login__input'
            password
            placeholder='请输入密码'
            value={upass}
            maxlength={64}
            onInput={(e: CommonEvent) => setUpass(e.detail.value)}
          />
        </View>

        <View className='login__field login__field--captcha'>
          <View className='login__captcha-input'>
            <Text className='login__label'>验证码</Text>
            <Input
              className='login__input'
              type='text'
              placeholder='请输入验证码'
              value={code}
              maxlength={8}
              onInput={(e: CommonEvent) => setCode(e.detail.value)}
            />
          </View>
          <CaptchaCode key={captchaNonce} onRefresh={() => setCode('')} />
        </View>

        <Text className='login__link' onClick={goRegister}>
          没有账号？立即注册
        </Text>

        <Button
          className={`login__btn ${submitting || !canSubmit ? 'login__btn--disabled' : ''}`}
          loading={submitting}
          disabled={submitting}
          onClick={onLogin}
        >
          {submitting ? '登录中...' : '登录'}
        </Button>

        <Button
          className='login__btn login__btn--wechat'
          disabled={submitting}
          onClick={onWechatLogin}
        >
          微信一键登录
        </Button>
      </View>
    </View>
  )
}
