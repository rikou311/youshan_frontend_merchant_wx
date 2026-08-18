import { View, Text, Input } from '@tarojs/components'
import type { InputProps } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { Commodity } from '@/types/commodity'
import './index.scss'

interface Props {
  item: Commodity | null
  onClose: () => void
  onConfirm: (item: Commodity, count: number) => void
}

export default function AddCartSheet({ item, onClose, onConfirm }: Props) {
  const [qty, setQty] = useState(1)
  const stock = Number(item?.total)
  const hasStock = Number.isFinite(stock)
  const outOfStock = hasStock && stock <= 0

  useEffect(() => {
    setQty(1)
  }, [item?.id])

  if (!item) return null

  const commit = (next: number) => {
    if (!Number.isFinite(next) || next < 1) {
      setQty(1)
      return
    }
    const max = hasStock && stock > 0 ? stock : next
    setQty(Math.min(Math.floor(next), max))
  }

  const onInput: InputProps['onInput'] = (e) => {
    const raw = e.detail.value
    const num = Number(raw)
    if (raw === '' || Number.isNaN(num)) return
    commit(num)
  }

  return (
    <View className='add-sheet'>
      <View className='add-sheet__mask' onClick={onClose} />
      <View className='add-sheet__panel'>
        {outOfStock ? (
          <Text className='add-sheet__empty'>暂无产品</Text>
        ) : (
          <View className='add-sheet__stepper'>
            <View
              className='add-sheet__btn'
              onClick={() => commit(qty - 1)}
            >
              <Text className='add-sheet__sign'>-</Text>
            </View>
            <Input
              className='add-sheet__input'
              type='number'
              value={String(qty)}
              onInput={onInput}
            />
            <View
              className='add-sheet__btn'
              onClick={() => commit(qty + 1)}
            >
              <Text className='add-sheet__sign'>+</Text>
            </View>
          </View>
        )}

        <View className='add-sheet__actions'>
          <View
            className={
              outOfStock
                ? 'add-sheet__ok add-sheet__ok--disabled'
                : 'add-sheet__ok'
            }
            onClick={() => {
              if (outOfStock) return
              onConfirm(item, qty)
            }}
          >
            <Text className='add-sheet__ok-text'>添加购物车</Text>
          </View>
          <View className='add-sheet__cancel' onClick={onClose}>
            <Text className='add-sheet__cancel-text'>取消</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
