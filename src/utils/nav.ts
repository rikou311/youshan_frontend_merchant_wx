import Taro from '@tarojs/taro'
import { isLoggedIn } from '@/utils/auth'

const LOGIN = '/pages/login/index'
const HOME = '/pages/index/index'
const CART = '/pages/cart/index'
const LIKE = '/pages/like/index'
const PROFILE = '/pages/profile/index'
const CONFIRM_PAY = '/pages/confirmPay/index'
const ADDRESS = '/pages/address/index'
const ADDRESS_EDIT = '/pages/addressEdit/index'
const PAYMENT = '/pages/payment/index'
const ORDER_LIST = '/pages/orderList/index'
const ORDER_DETAIL = '/pages/orderDetail/index'
const REFUNDER_LIST = '/pages/refunderList/index'
const REFUNDER_DETAIL = '/pages/refunderDetail/index'
const REFUNDER_APPLY = '/pages/refunderApply/index'
const UPDATE_PROFILE = '/pages/updateProfile/index'
const UNBOUND = '/pages/unbound/index'

type TabKey = 'home' | 'cart' | 'like' | 'profile'

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
  Taro.switchTab({ url: HOME })
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

export function goCart() {
  Taro.switchTab({ url: CART })
}

export function goLike() {
  Taro.switchTab({ url: LIKE })
}

export function goProfile() {
  Taro.switchTab({ url: PROFILE })
}

export function goConfirmPay() {
  Taro.navigateTo({ url: CONFIRM_PAY })
}

export function goAddress() {
  Taro.navigateTo({ url: ADDRESS })
}

export function goAddressEdit(id?: number | string) {
  const query = id != null && id !== '' ? `?id=${id}` : ''
  Taro.navigateTo({ url: `${ADDRESS_EDIT}${query}` })
}

export function goPayment(orderId: number | string) {
  Taro.redirectTo({ url: `${PAYMENT}?id=${orderId}` })
}

export function goPayOrder(orderId: number | string) {
  Taro.navigateTo({ url: `${PAYMENT}?id=${orderId}` })
}

export function goOrderList() {
  Taro.navigateTo({ url: ORDER_LIST })
}

export function goOrderDetail(id: number | string) {
  Taro.navigateTo({ url: `${ORDER_DETAIL}?id=${id}` })
}

export function goRefunderList() {
  Taro.navigateTo({ url: REFUNDER_LIST })
}

export function goRefunderDetail(rid: number | string) {
  Taro.navigateTo({ url: `${REFUNDER_DETAIL}?rid=${rid}` })
}

export function goRefunderApply(orderId: number | string) {
  Taro.navigateTo({ url: `${REFUNDER_APPLY}?id=${orderId}` })
}

export function goUpdateProfile() {
  Taro.navigateTo({ url: UPDATE_PROFILE })
}

export function goUnbound() {
  Taro.navigateTo({
    url: UNBOUND,
    fail: (err) => {
      Taro.showToast({
        title: err.errMsg || '无法打开取消绑定',
        icon: 'none',
      })
    },
  })
}

export function syncTabBar(index: number) {
  const keys: TabKey[] = ['home', 'cart', 'like', 'profile']
  const key = keys[index] || 'home'
  Taro.eventCenter.trigger('TAB_CURRENT', key)
  const page = Taro.getCurrentInstance().page as
    | { getTabBar?: () => { setSelected?: (i: number) => void } | null }
    | undefined
  page?.getTabBar?.()?.setSelected?.(index)
}

export function goTab(key: TabKey) {
  if (key === 'home') {
    Taro.switchTab({ url: HOME })
    return
  }
  if (key === 'cart') {
    Taro.switchTab({ url: CART })
    return
  }
  if (key === 'like') {
    Taro.switchTab({ url: LIKE })
    return
  }
  Taro.switchTab({ url: PROFILE })
}
