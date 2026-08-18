import { useState } from 'react'
import { ScrollView, View, Text } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import { delAddress, queryAddressByUid } from '@/services/address'
import { getAddrSelect, setAddrSelect } from '@/store/checkout'
import type { Address } from '@/types/address'
import { goAddressEdit, requireLogin } from '@/utils/nav'
import './index.scss'

function toast(title: string) {
  Taro.showToast({ title, icon: 'none' })
}

export default function AddressPage() {
  const [list, setList] = useState<Address[]>([])
  const [selectedId, setSelectedId] = useState<string>(
    String(getAddrSelect()?.id ?? ''),
  )
  const [loading, setLoading] = useState(false)

  useLoad(() => {
    requireLogin()
  })

  useDidShow(() => {
    if (!requireLogin()) return
    void loadList()
  })

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await queryAddressByUid()
      if (!res?.success) {
        setList([])
        toast(typeof res?.results === 'string' ? res.results : '地址加载失败')
        return
      }
      const next = res.results?.address || []
      setList(next)
      setSelectedId(String(getAddrSelect()?.id ?? res.results?.user?.address ?? ''))
    } catch (err) {
      toast(err instanceof Error ? err.message : '地址加载失败')
    } finally {
      setLoading(false)
    }
  }

  const onSelect = (item: Address) => {
    setAddrSelect(item)
    setSelectedId(String(item.id))
    const pages = Taro.getCurrentPages()
    const prev = pages[pages.length - 2]
    if (prev?.route?.includes('confirmPay')) {
      Taro.navigateBack()
    }
  }

  const onDelete = async (item: Address) => {
    const modal = await Taro.showModal({
      title: '你确定要删除吗？',
      confirmText: 'Yes',
      cancelText: 'No',
      confirmColor: '#e36049',
    })
    if (!modal.confirm) return
    try {
      const res = await delAddress({ id: item.id })
      if (!res?.success) {
        toast(typeof res?.results === 'string' ? res.results : '删除失败')
        return
      }
      if (String(getAddrSelect()?.id) === String(item.id)) {
        setAddrSelect(null)
        setSelectedId('')
      }
      toast('删除成功')
      void loadList()
    } catch (err) {
      toast(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <View className='address'>
      <ScrollView className='address__list' scrollY>
        {list.map((item) => {
          const active = String(item.id) === selectedId
          return (
            <View className='address__card' key={String(item.id)}>
              <Text
                className='address__del'
                onClick={() => onDelete(item)}
              >
                删
              </Text>
              <View className='address__body' onClick={() => onSelect(item)}>
                <View className='address__row'>
                  <Text className='address__name'>
                    {item.receive}
                    {item.state === 1 ? '  ( 默认地址 )' : ''}
                  </Text>
                  <Text className='address__phone'>{item.phone}</Text>
                </View>
                <Text className='address__line'>
                  {item.postcode} {item.prefecture} {item.city} {item.town}{' '}
                  {item.address}
                </Text>
                {active ? (
                  <Text className='address__current'>当前选用</Text>
                ) : null}
              </View>
              <Text
                className='address__edit'
                onClick={() => goAddressEdit(item.id)}
              >
                改
              </Text>
            </View>
          )
        })}

        {list.length === 0 && !loading ? (
          <View className='address__empty'>
            <Text className='address__empty-text'>暂无地址，请添加</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className='address__bar'>
        <View className='address__add' onClick={() => goAddressEdit()}>
          <Text className='address__add-text'>添加新地址</Text>
        </View>
      </View>
    </View>
  )
}
