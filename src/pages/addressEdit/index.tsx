import { useMemo, useRef, useState } from 'react'
import { ScrollView, View, Text, Input, Picker, Switch } from '@tarojs/components'
import type { CommonEvent, PickerSelectorProps } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import {
  queryAddressByUid,
  saveAddress,
  selectPostcodeByParam,
} from '@/services/address'
import { getSocialType } from '@/services/dictionary'
import { setAddrSelect } from '@/store/checkout'
import type { Address, PostcodeItem } from '@/types/address'
import type { DictItem } from '@/types/checkout'
import { requireLogin } from '@/utils/nav'
import './index.scss'

const PHONE_PATTERN = /^0[789]0\d{8}$/

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

const emptyForm: Address = {
  id: '',
  receive: '',
  phone: '',
  socialtype: '0',
  socialaccount: '',
  postcode: '',
  prefecture: '',
  city: '',
  town: '',
  address: '',
  building: '',
  roomnumber: '',
  state: 0,
}

export default function AddressEditPage() {
  const router = useRouter()
  const [form, setForm] = useState<Address>(emptyForm)
  const [options, setOptions] = useState<PostcodeItem[]>([])
  const [socialType, setSocialType] = useState<DictItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedRef = useRef(false)

  useLoad(async () => {
    if (!requireLogin()) return
    if (loadedRef.current) return
    loadedRef.current = true

    const types = await getSocialType()
    setSocialType(types)

    const id = router.params.id
    if (!id) return

    try {
      const res = await queryAddressByUid()
      const found = (res.results?.address || []).find(
        (item) => String(item.id) === String(id),
      )
      if (!found) {
        toast('地址不存在')
        return
      }
      setForm({
        ...emptyForm,
        ...found,
        socialtype: String(found.socialtype ?? '0'),
      })
      if (found.postcode) {
        void searchPostcode(found.postcode, false)
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : '加载失败')
    }
  })

  const socialRange = useMemo(
    () => socialType.map((item) => item.display),
    [socialType],
  )
  const socialIndex = Math.max(
    0,
    socialType.findIndex((item) => String(item.value) === String(form.socialtype)),
  )
  const prefectureRange = Array.from(
    new Set(options.map((item) => item.prefecture).filter(Boolean)),
  )
  const cityRange = Array.from(
    new Set(
      options
        .filter((item) => !form.prefecture || item.prefecture === form.prefecture)
        .map((item) => item.city)
        .filter(Boolean),
    ),
  )
  const townRange = Array.from(
    new Set(
      options
        .filter(
          (item) =>
            (!form.prefecture || item.prefecture === form.prefecture) &&
            (!form.city || item.city === form.city),
        )
        .map((item) => item.town)
        .filter(Boolean),
    ),
  )

  const patch = (partial: Partial<Address>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  const searchPostcode = async (value: string, fill: boolean) => {
    if (!value || value.length < 4) return
    try {
      const res = await selectPostcodeByParam({
        page: 1,
        rows: 100,
        condition: { postcode: value },
        sort: { prop: '', order: '' },
      })
      if (!res?.success || !Array.isArray(res.results) || res.results.length === 0) {
        setOptions([])
        if (fill) {
          patch({ prefecture: '', city: '', town: '' })
          toast('邮政编码查询失败，请检查邮政编码是否正确')
        }
        return
      }
      setOptions(res.results)
      if (fill) {
        const first = res.results[0]
        patch({
          prefecture: first.prefecture,
          city: first.city,
          town: first.town,
        })
      }
    } catch {
      if (fill) toast('邮政编码查询失败，请稍后重试')
    }
  }

  const onPostcode = (e: CommonEvent) => {
    const value = e.detail.value
    patch({ postcode: value })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void searchPostcode(value, true)
    }, 500)
  }

  const onPick =
    (key: 'prefecture' | 'city' | 'town', range: string[]): PickerSelectorProps['onChange'] =>
    (e) => {
      const next = range[Number(e.detail.value)] || ''
      if (key === 'prefecture') {
        patch({ prefecture: next, city: '', town: '' })
        return
      }
      if (key === 'city') {
        patch({ city: next, town: '' })
        return
      }
      patch({ town: next })
    }

  const onSocial: PickerSelectorProps['onChange'] = (e) => {
    const item = socialType[Number(e.detail.value)]
    if (item) patch({ socialtype: item.value })
  }

  const onSave = async () => {
    if (submitting) return
    if (!form.receive.trim()) {
      toast('请输入收件人姓名！')
      return
    }
    if (!form.postcode.trim()) {
      toast('请输入邮政编码！')
      return
    }
    if (!form.prefecture) {
      toast('请选择辖区！')
      return
    }
    if (!form.city) {
      toast('请选择市区！')
      return
    }
    if (!form.town) {
      toast('请选择町村！')
      return
    }
    if (!form.address.trim()) {
      toast('请输入「丁目・番地・号（半角数字)」！')
      return
    }
    if (form.phone && !PHONE_PATTERN.test(form.phone)) {
      toast('请输入有效的手机号码！')
      return
    }

    setSubmitting(true)
    try {
      const payload: Address = {
        ...form,
        receive: form.receive.trim(),
        postcode: form.postcode.trim(),
        address: form.address.trim(),
        state: form.state === 1 ? 1 : 0,
      }
      const res = await saveAddress(payload)
      if (!res?.success) {
        toast(typeof res?.results === 'string' ? res.results : '保存失败，请联系客服')
        return
      }
      const listRes = await queryAddressByUid()
      const list = listRes?.results?.address || []
      const saved =
        (payload.id
          ? list.find((item) => String(item.id) === String(payload.id))
          : list.find(
              (item) =>
                item.receive === payload.receive &&
                item.postcode === payload.postcode &&
                item.address === payload.address,
            )) || list[list.length - 1]
      if (saved) setAddrSelect(saved)
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 300)
    } catch {
      toast('保存失败，请联系客服')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='addr-edit'>
      <ScrollView className='addr-edit__list' scrollY>
        <View className='addr-edit__card'>
          <View className='addr-edit__field'>
            <Text className='addr-edit__label'>收件人</Text>
            <Input
              className='addr-edit__input'
              value={form.receive}
              placeholder='请输入收件人姓名'
              onInput={(e) => patch({ receive: e.detail.value })}
            />
          </View>
          <View className='addr-edit__field'>
            <Text className='addr-edit__label'>邮政编码</Text>
            <Input
              className='addr-edit__input'
              value={form.postcode}
              placeholder='请输入邮政编码'
              onInput={onPostcode}
            />
          </View>
          <Picker
            mode='selector'
            range={prefectureRange}
            onChange={onPick('prefecture', prefectureRange)}
          >
            <View className='addr-edit__field'>
              <Text className='addr-edit__label'>辖区</Text>
              <Text className='addr-edit__value'>
                {form.prefecture || '请选择辖区'}
              </Text>
            </View>
          </Picker>
          <Picker mode='selector' range={cityRange} onChange={onPick('city', cityRange)}>
            <View className='addr-edit__field'>
              <Text className='addr-edit__label'>市区</Text>
              <Text className='addr-edit__value'>{form.city || '请选择市区'}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={townRange} onChange={onPick('town', townRange)}>
            <View className='addr-edit__field'>
              <Text className='addr-edit__label'>町村</Text>
              <Text className='addr-edit__value'>{form.town || '请选择町村'}</Text>
            </View>
          </Picker>
          <View className='addr-edit__field'>
            <Text className='addr-edit__label'>丁目・番地・号（半角数字)</Text>
            <Input
              className='addr-edit__input'
              value={form.address}
              placeholder='丁目・番地・号'
              onInput={(e) => patch({ address: e.detail.value })}
            />
          </View>
          <View className='addr-edit__field'>
            <Text className='addr-edit__label'>房间号码</Text>
            <Input
              className='addr-edit__input'
              value={form.roomnumber}
              onInput={(e) => patch({ roomnumber: e.detail.value })}
            />
          </View>
          <View className='addr-edit__field'>
            <Text className='addr-edit__label'>公寓名称或公司名称</Text>
            <Input
              className='addr-edit__input'
              value={form.building}
              onInput={(e) => patch({ building: e.detail.value })}
            />
          </View>
          <View className='addr-edit__field'>
            <Text className='addr-edit__label'>手机号码</Text>
            <Input
              className='addr-edit__input'
              value={form.phone}
              placeholder='070/080/090'
              onInput={(e) => patch({ phone: e.detail.value })}
            />
          </View>
          <Picker mode='selector' range={socialRange} onChange={onSocial}>
            <View className='addr-edit__field'>
              <Text className='addr-edit__label'>社交APP</Text>
              <Text className='addr-edit__value'>
                {socialType[socialIndex]?.display || '请选择社交APP'}
              </Text>
            </View>
          </Picker>
          <View className='addr-edit__field'>
            <Text className='addr-edit__label'>社交账号</Text>
            <Input
              className='addr-edit__input'
              value={form.socialaccount}
              onInput={(e) => patch({ socialaccount: e.detail.value })}
            />
          </View>
          <View className='addr-edit__switch'>
            <Text className='addr-edit__label'>是否设置为默认地址</Text>
            <Switch
              checked={form.state === 1}
              color='#f2853c'
              onChange={(e) => patch({ state: e.detail.value ? 1 : 0 })}
            />
          </View>
        </View>
      </ScrollView>

      <View className='addr-edit__bar'>
        <View
          className={
            submitting
              ? 'addr-edit__save addr-edit__save--disabled'
              : 'addr-edit__save'
          }
          onClick={onSave}
        >
          <Text className='addr-edit__save-text'>
            {submitting ? 'Loading...' : '保存'}
          </Text>
        </View>
      </View>
    </View>
  )
}
