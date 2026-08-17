import Taro from '@tarojs/taro'
import { isLoggedIn } from '@/utils/auth'

const LOGIN = '/pages/login/index'
const HOME = '/pages/index/index'

/** 已登录用户直接进首页；未登录留在登录页 */
export function gateOnLaunch() {
  if (isLoggedIn()) {
    Taro.reLaunch({ url: HOME })
  }
}

/** 首页守卫：未登录强制回登录 */
export function requireLogin() {
  if (!isLoggedIn()) {
    Taro.reLaunch({ url: LOGIN })
    return false
  }
  return true
}

export function goHome() {
  Taro.reLaunch({ url: HOME })
}

export function goLogin() {
  Taro.reLaunch({ url: LOGIN })
}

export function goRegister() {
  Taro.navigateTo({ url: '/pages/register/index' })
}

export function goOnboard() {
  Taro.navigateTo({ url: '/pages/onboard/index' })
}

export function goBind() {
  Taro.navigateTo({ url: '/pages/bind/index' })
}

export function goPending(mode: 'register' | 'bind' = 'register') {
  Taro.redirectTo({ url: `/pages/pending/index?mode=${mode}` })
}
