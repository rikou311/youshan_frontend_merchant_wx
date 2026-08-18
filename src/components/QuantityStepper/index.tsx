import { View, Text, Input } from '@tarojs/components'
import type { InputProps } from '@tarojs/components'
import { isAddCartReady } from '@/store/cart'
import { useCart } from '@/hooks/useCart'
import type { Commodity } from '@/types/commodity'
import './index.scss'

interface Props {
  item: Commodity
}

export default function QuantityStepper({ item }: Props) {
  const { getCount, adjustQty } = useCart()
  const count = getCount(item.id)
  const stock = Number(item.total) || 0
  const max = Math.max(stock, count)

  const commit = (next: number) => {
    if (!isAddCartReady()) return
    const num = Number.isFinite(next) ? next : 0
    if (num < 0) return
    if (num > max) {
      adjustQty(item, max)
      return
    }
    adjustQty(item, num)
  }

  const onMinus = () => {
    if (count === 0) return
    commit(count - 1)
  }

  const onPlus = () => {
    commit(count + 1)
  }

  const onInput: InputProps['onInput'] = (e) => {
    const raw = e.detail.value
    const num = Number(raw)
    if (raw === '' || Number.isNaN(num) || num < 0) {
      commit(0)
      return
    }
    commit(Math.floor(num))
  }

  return (
    <View className='stepper'>
      <View className='stepper__btn stepper__btn--minus' onClick={onMinus}>
        <Text className='stepper__sign'>-</Text>
      </View>
      <Input
        className='stepper__input'
        type='number'
        value={String(count)}
        onInput={onInput}
      />
      <View className='stepper__btn stepper__btn--plus' onClick={onPlus}>
        <Text className='stepper__sign'>+</Text>
      </View>
    </View>
  )
}
