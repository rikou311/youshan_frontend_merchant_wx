import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import QuantityStepper from '@/components/QuantityStepper'
import { isPromo, resolveImageUrl } from '@/utils/commodity'
import type { Commodity } from '@/types/commodity'
import './index.scss'

interface Props {
  item: Commodity
  onToggleLike: (item: Commodity) => void
}

export default function ProductCard({ item, onToggleLike }: Props) {
  const [imgFail, setImgFail] = useState(false)
  const src = resolveImageUrl(item.image)
  const outOfStock = !(Number(item.total) > 0)

  return (
    <View className='product-card'>
      <View className='product-card__img-wrap'>
        {src && !imgFail ? (
          <Image
            className='product-card__img'
            src={src}
            mode='aspectFill'
            onError={() => setImgFail(true)}
          />
        ) : (
          <View className='product-card__img product-card__img--empty' />
        )}
      </View>

      <View className='product-card__body'>
        <View className='product-card__title-row'>
          <Text className='product-card__title'>{item.title}</Text>
          {isPromo(item.home) ? (
            <Text className='product-card__tag'>活动</Text>
          ) : null}
        </View>
        <Text className='product-card__stock'>
          {item.total}
          {item.unit || ''}
        </Text>
        <Text className='product-card__price'>￥{item.price}</Text>

        <View className='product-card__count'>
          {outOfStock ? (
            <Text className='product-card__empty'>暂无产品</Text>
          ) : (
            <QuantityStepper item={item} />
          )}
        </View>
      </View>

      <View
        className='product-card__like'
        onClick={() => onToggleLike(item)}
      >
        <Text className={item.love ? 'product-card__heart product-card__heart--on' : 'product-card__heart'}>
          {item.love ? '♥' : '♡'}
        </Text>
      </View>
    </View>
  )
}
