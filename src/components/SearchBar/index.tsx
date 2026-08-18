import { useEffect, useRef, useState } from 'react'
import { View, Input } from '@tarojs/components'
import type { InputProps } from '@tarojs/components'
import './index.scss'

interface Props {
  onSearch: (keyword: string) => void
}

const SEARCH_DELAY_MS = 1500

export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('')
  const readyRef = useRef(false)

  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true
      return
    }
    const timer = setTimeout(() => {
      onSearch(value)
    }, SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [value, onSearch])

  const onInput: InputProps['onInput'] = (e) => {
    setValue(e.detail.value)
  }

  const onConfirm: InputProps['onConfirm'] = (e) => {
    onSearch(e.detail.value)
  }

  return (
    <View className='search-bar'>
      <View className='search-bar__icon' />
      <Input
        className='search-bar__input'
        placeholder='鴨脖'
        placeholderClass='search-bar__placeholder'
        placeholderStyle='color:#c4b4ae;background-color:#efe8e8;'
        style={{ backgroundColor: '#efe8e8' }}
        value={value}
        onInput={onInput}
        onConfirm={onConfirm}
        confirmType='search'
      />
    </View>
  )
}
