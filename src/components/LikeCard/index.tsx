import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { resolveImageUrl } from '@/utils/commodity'
import type { Commodity } from '@/types/commodity'
import './index.scss'

interface Props {
  item: Commodity
  onRemove: (item: Commodity) => void
  onAddCart: (item: Commodity) => void
}

export default function LikeCard({ item, onRemove, onAddCart }: Props) {
  const [imgFail, setImgFail] = useState(false)
  const src = resolveImageUrl(item.image)

  return (
    <View className='like-card'>
      <View className='like-card__img-wrap'>
        {src && !imgFail ? (
          <Image
            className='like-card__img'
            src={src}
            mode='aspectFill'
            onError={() => setImgFail(true)}
          />
        ) : (
          <View className='like-card__img like-card__img--empty' />
        )}
      </View>

      <View className='like-card__body'>
        <View className='like-card__top'>
          <Text className='like-card__title'>{item.title}</Text>
          <View className='like-card__remove' onClick={() => onRemove(item)}>
            <Text className='like-card__remove-text'>移除</Text>
          </View>
        </View>

        <Text className='like-card__price'>￥{item.price}</Text>

        <View className='like-card__add' onClick={() => onAddCart(item)}>
          <Text className='like-card__add-text'>添加购物车</Text>
        </View>
      </View>
    </View>
  )
}
