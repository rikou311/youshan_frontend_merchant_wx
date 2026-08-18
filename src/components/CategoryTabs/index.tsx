import { ScrollView, View, Text, Image } from '@tarojs/components'
import { resolveImageUrl } from '@/utils/commodity'
import type { CategoryItem } from '@/types/commodity'
import './index.scss'

interface Props {
  items: CategoryItem[]
  activeIndex: number
  onChange: (index: number) => void
}

export default function CategoryTabs({ items, activeIndex, onChange }: Props) {
  return (
    <ScrollView className='cat-tabs' scrollX enableFlex>
      {items.map((item, index) => {
        const active = index === activeIndex
        const src = resolveImageUrl(item.image)
        return (
          <View
            key={item.id}
            className={active ? 'cat-tabs__item cat-tabs__item--active' : 'cat-tabs__item'}
            onClick={() => onChange(index)}
          >
            {src ? (
              <Image className='cat-tabs__icon' src={src} mode='aspectFit' />
            ) : (
              <View className='cat-tabs__icon cat-tabs__icon--empty' />
            )}
            <Text className='cat-tabs__title'>{item.title}</Text>
          </View>
        )
      })}
    </ScrollView>
  )
}
