import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { gateOnLaunch } from '@/utils/nav'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 已登录 → 首页；未登录 → 登录页（pages 第一项）
    gateOnLaunch()
  })

  return children
}

export default App
