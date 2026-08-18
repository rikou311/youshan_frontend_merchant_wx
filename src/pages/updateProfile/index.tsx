import { useMemo, useRef, useState } from 'react'
import { Input, Picker, ScrollView, Text, View } from '@tarojs/components'
import type { InputProps, PickerSelectorProps } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { getSocialType } from '@/services/dictionary'
import { getUserInfo, updateUserInfo } from '@/services/user'
import type { DictItem } from '@/types/checkout'
import type { UserInfo } from '@/types/user'
import { requireLogin } from '@/utils/nav'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

function failText(results: unknown, fallback: string) {
  return typeof results === 'string' && results ? results : fallback
}

const emptyForm: UserInfo = {
  uname: '',
  upass: '',
  unick: '',
  phone: '',
  name: '',
  zip: '',
  socialtype: '',
  wechat: '',
  memo: '',
}

export default function UpdateProfilePage() {
  const [form, setForm] = useState<UserInfo>(emptyForm)
  const [socialType, setSocialType] = useState<DictItem[]>([])
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [upassConfirm, setUpassConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  useLoad(() => {
    if (!requireLogin()) return
    void (async () => {
      try {
        const [userRes, types] = await Promise.all([getUserInfo(), getSocialType()])
        setSocialType(types)
        if (!userRes?.success || !userRes.results) {
          toast(failText(userRes?.results, '资料加载失败'))
          return
        }
        setForm({
          ...emptyForm,
          ...userRes.results,
          upass: '',
          socialtype: String(userRes.results.socialtype ?? ''),
        })
      } catch (err) {
        toast(err instanceof Error ? err.message : '资料加载失败')
      }
    })()
  })

  const socialRange = useMemo(
    () => socialType.map((item) => item.display),
    [socialType],
  )
  const socialIndex = Math.max(
    0,
    socialType.findIndex(
      (item) => String(item.value) === String(form.socialtype),
    ),
  )

  const patch = (partial: Partial<UserInfo>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  const bind =
    (key: keyof UserInfo): InputProps['onInput'] =>
    (e) => {
      patch({ [key]: e.detail.value })
    }

  const onSocial: PickerSelectorProps['onChange'] = (e) => {
    const next = socialType[Number(e.detail.value)]
    if (next) patch({ socialtype: next.value })
  }

  const validate = () => {
    if (!form.uname) return '请输入用户名'
    if (!form.unick) return '请输入商家名称'
    if (!form.phone) return '请输入联系电话'
    if (!form.name) return '请输入姓名'
    if (form.upass && form.upass.length < 6) return '密码长度至少为6个字符'
    return ''
  }

  const save = async (payload: UserInfo) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      let body: UserInfo = { ...payload, wechat: payload.wechat || '' }
      let res = await updateUserInfo(body)
      if (!res?.success && failText(res?.results, '').includes('微信')) {
        body = { ...body, wechat: '-' }
        res = await updateUserInfo(body)
      }
      if (!res?.success) {
        toast(failText(res?.results, '保存失败'))
        return
      }
      toast('保存成功')
      setTimeout(() => {
        Taro.navigateBack()
      }, 400)
    } catch (err) {
      toast(err instanceof Error ? err.message : '保存失败')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
      setConfirmVisible(false)
    }
  }

  const onSubmit = () => {
    const err = validate()
    if (err) {
      toast(err)
      return
    }
    if (form.upass) {
      setUpassConfirm('')
      setConfirmVisible(true)
      return
    }
    void save(form)
  }

  const confirmPassword = () => {
    if (upassConfirm !== form.upass) {
      toast('确认密码必须与密码相同')
      return
    }
    void save(form)
  }

  const field = (
    label: string,
    key: keyof UserInfo,
    extra?: { password?: boolean; readonly?: boolean },
  ) => (
    <View className='profile-edit__field' key={key}>
      <Text className='profile-edit__label'>{label}</Text>
      <Input
        className='profile-edit__input'
        value={String(form[key] ?? '')}
        password={extra?.password}
        disabled={extra?.readonly}
        onInput={bind(key)}
      />
    </View>
  )

  return (
    <View className='profile-edit'>
      <ScrollView className='profile-edit__list' scrollY>
        <View className='profile-edit__card'>
          {field('用户名', 'uname', { readonly: true })}
          {field('密码', 'upass', { password: true })}
          {field('商家名称', 'unick')}
          {field('电话', 'phone')}
          {field('姓名', 'name')}
          {field('邮编', 'zip')}
          <View className='profile-edit__field'>
            <Text className='profile-edit__label'>社交APP</Text>
            <Picker
              mode='selector'
              range={socialRange}
              value={socialIndex}
              onChange={onSocial}
            >
              <Text className='profile-edit__value'>
                {socialRange[socialIndex] || '请选择'}
              </Text>
            </Picker>
          </View>
          {field('社交账号', 'wechat')}
          {field('备注', 'memo')}
        </View>
      </ScrollView>

      <View className='profile-edit__bar'>
        <View className='profile-edit__cancel' onClick={() => Taro.navigateBack()}>
          <Text className='profile-edit__cancel-text'>取消</Text>
        </View>
        <View
          className={
            submitting
              ? 'profile-edit__save profile-edit__save--disabled'
              : 'profile-edit__save'
          }
          onClick={onSubmit}
        >
          <Text className='profile-edit__save-text'>
            {submitting ? 'Loading...' : '确认'}
          </Text>
        </View>
      </View>

      {confirmVisible ? (
        <View className='profile-edit__mask'>
          <View className='profile-edit__sheet'>
            <Text className='profile-edit__label'>密码确认</Text>
            <Input
              className='profile-edit__input'
              password
              value={upassConfirm}
              onInput={(e) => setUpassConfirm(e.detail.value)}
            />
            <View className='profile-edit__sheet-actions'>
              <View className='profile-edit__save' onClick={confirmPassword}>
                <Text className='profile-edit__save-text'>确定</Text>
              </View>
              <View
                className='profile-edit__cancel'
                onClick={() => {
                  setUpassConfirm('')
                  setConfirmVisible(false)
                }}
              >
                <Text className='profile-edit__cancel-text'>取消</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  )
}
