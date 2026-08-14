import { useCallback, useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { fetchCaptcha } from '@/services/auth'
import './index.scss'

interface Props {
  /** 刷新时回调，方便父组件清空已输入验证码 */
  onRefresh?: () => void
  /** 暴露当前验证码给父组件（旧站由用户肉眼照抄输入） */
  onCodeChange?: (code: string) => void
}

export default function CaptchaCode({ onRefresh, onCodeChange }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetchCaptcha()
      const next = res?.success ? String(res.results || '') : ''
      setCode(next)
      onCodeChange?.(next)
      onRefresh?.()
    } catch {
      setCode('')
      onCodeChange?.('')
    } finally {
      setLoading(false)
    }
  }, [loading, onCodeChange, onRefresh])

  useEffect(() => {
    refresh()
    // 仅挂载时拉一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View className='captcha' onClick={refresh}>
      <Text className='captcha__text'>{loading ? '...' : code || '点击刷新'}</Text>
      <Text className='captcha__hint'>点击刷新</Text>
    </View>
  )
}
