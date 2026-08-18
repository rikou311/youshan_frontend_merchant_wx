import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import QuantityStepper from '@/components/QuantityStepper'
import { isPromo, resolveImageUrl } from '@/utils/commodity'
import type { Commodity } from '@/types/commodity'
import './index.scss'

interface Props {
  item: Commodity
  onRemove: (item: Commodity) => void
}

export default function CartCard({ item, onRemove }: Props) {
  const [imgFail, setImgFail] = useState(false)
  const src = resolveImageUrl(item.image)

  return (
    <View className='cart-card'>
      <View className='cart-card__img-wrap'>
        {src && !imgFail ? (
          <Image
            className='cart-card__img'
            src={src}
            mode='aspectFill'
            onError={() => setImgFail(true)}
          />
        ) : (
          <View className='cart-card__img cart-card__img--empty' />
        )}
      </View>

      <View className='cart-card__body'>
        <View className='cart-card__top'>
          <Text className='cart-card__title'>{item.title}</Text>
          <View className='cart-card__remove' onClick={() => onRemove(item)}>
            <Text className='cart-card__remove-text'>移除</Text>
          </View>
        </View>

        <View className='cart-card__price-row'>
          <Text className='cart-card__price'>￥{item.price}</Text>
          {isPromo(item.home) ? (
            <Text className='cart-card__tag'>活动</Text>
          ) : null}
        </View>

        <View className='cart-card__count'>
          <QuantityStepper item={item} />
        </View>
      </View>
    </View>
  )
}
