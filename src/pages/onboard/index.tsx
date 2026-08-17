import { useMemo, useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import type { CommonEvent } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { boundWechatMini, parseBindResponse } from '@/services/auth'
import {
  clearWxEnterPending,
  getWxEnterPending,
  isLoggedIn,
  setLoginSession,
} from '@/utils/auth'
import { goHome, goLogin, goPending, goRegister } from '@/utils/nav'
import './index.scss'

type Mode = 'choice' | 'bindExisting'

export default function OnboardPage() {
  const [mode, setMode] = useState<Mode>('choice')
  const [openId, setOpenId] = useState('')
  const [uname, setUname] = useState('')
  const [upass, setUpass] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useLoad(() => {
    if (isLoggedIn()) {
      goHome()
      return
    }
    const pending = getWxEnterPending()
    if (!pending?.tempToken) {
      Taro.showToast({ title: '请先从进入商城开始', icon: 'none' })
      goLogin()
      return
    }
    setOpenId(pending.tempToken)
  })

  const canBind = useMemo(
    () => !!uname.trim() && !!upass && !submitting,
    [uname, upass, submitting],
  )

  const onBindExisting = async () => {
    if (!uname.trim() || !upass) {
      setErrorMsg('请填写账号和密码')
      return
    }
    if (!openId) {
      setErrorMsg('缺少微信凭证，请重新进入商城')
      return
    }
    if (submitting) return
    setSubmitting(true)
    setErrorMsg('')
    Taro.showLoading({ title: '绑定中...', mask: true })

    try {
      const res = await boundWechatMini({
        uname: uname.trim(),
        upass,
        token: openId,
      })

      const parsed = parseBindResponse(res)
      if (parsed.type === 'ok') {
        clearWxEnterPending()
        setLoginSession(parsed.token)
        Taro.showToast({ title: '绑定成功', icon: 'success' })
        setTimeout(() => goHome(), 400)
        return
      }
      if (parsed.type === 'pending_review') {
        clearWxEnterPending()
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

  return (
    <View className='onboard'>
      <View className='onboard__hero'>
        <Text className='onboard__brand'>有膳商户</Text>
        <Text className='onboard__sub'>欢迎使用</Text>
      </View>

      <View className='onboard__card'>
        <Text className='onboard__title'>
          {mode === 'choice' ? '请选择进入方式' : '绑定已有账号'}
        </Text>
        <Text className='onboard__hint'>
          {mode === 'choice'
            ? '您的微信尚未绑定商家账号，可注册新商家或绑定已有账号。'
            : '请输入已有商家账号与密码，完成微信绑定。'}
        </Text>

        {mode === 'choice' ? (
          <>
            <Button
              className='onboard__btn onboard__btn--primary'
              onClick={() => goRegister()}
            >
              注册
            </Button>
            <Button
              className='onboard__btn onboard__btn--outline'
              onClick={() => {
                setErrorMsg('')
                setMode('bindExisting')
              }}
            >
              绑定已有账号
            </Button>
          </>
        ) : (
          <>
            <View className='onboard__form'>
              <View className='onboard__field'>
                <Text className='onboard__label'>账号</Text>
                <Input
                  className='onboard__input'
                  type='text'
                  placeholder='请输入账号'
                  value={uname}
                  maxlength={64}
                  onInput={(e: CommonEvent) => {
                    setErrorMsg('')
                    setUname(e.detail.value)
                  }}
                />
              </View>
              <View className='onboard__field'>
                <Text className='onboard__label'>密码</Text>
                <Input
                  className='onboard__input'
                  password
                  placeholder='请输入密码'
                  value={upass}
                  maxlength={64}
                  onInput={(e: CommonEvent) => {
                    setErrorMsg('')
                    setUpass(e.detail.value)
                  }}
                />
              </View>
              <Button
                className={`onboard__btn onboard__btn--bind ${!canBind ? 'onboard__btn--disabled' : ''}`}
                loading={submitting}
                disabled={submitting}
                onClick={onBindExisting}
              >
                {submitting ? '绑定中...' : '绑定'}
              </Button>
              {errorMsg ? (
                <Text className='onboard__error'>{errorMsg}</Text>
              ) : null}
            </View>
            <Text
              className='onboard__back'
              onClick={() => {
                setErrorMsg('')
                setMode('choice')
              }}
            >
              返回上一步
            </Text>
          </>
        )}
      </View>
    </View>
  )
}
