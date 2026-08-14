import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { gateOnLaunch } from '@/utils/nav'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 启动时：已登录 → 首页；未登录 → 停留登录页（首页）
    gateOnLaunch()
  })

  return children
}

export default App
