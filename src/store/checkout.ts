import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '@/constants/storage'
import type { Address } from '@/types/address'

type Listener = () => void

const listeners: Listener[] = []
let addrSelect: Address | null = readAddrSelect()

function readAddrSelect(): Address | null {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEYS.checkoutAddress)
    if (raw && typeof raw === 'object' && raw.id != null) return raw as Address
  } catch {
    /* ignore */
  }
  return null
}

function persist() {
  if (addrSelect) {
    Taro.setStorageSync(STORAGE_KEYS.checkoutAddress, addrSelect)
  } else {
    Taro.removeStorageSync(STORAGE_KEYS.checkoutAddress)
  }
}

function emit() {
  listeners.forEach((fn) => fn())
}

export function subscribeCheckout(listener: Listener) {
  listeners.push(listener)
  return () => {
    const i = listeners.indexOf(listener)
    if (i >= 0) listeners.splice(i, 1)
  }
}

export function getAddrSelect() {
  return addrSelect
}

export function setAddrSelect(address: Address | null) {
  addrSelect = address
  persist()
  emit()
}

export function pickDefaultAddress(
  list: Address[],
  defaultId?: number | string,
) {
  if (addrSelect?.id != null) {
    const kept = list.find((item) => String(item.id) === String(addrSelect?.id))
    if (kept) {
      addrSelect = kept
      persist()
      return kept
    }
  }
  if (defaultId != null && defaultId !== '') {
    const def = list.find((item) => String(item.id) === String(defaultId))
    if (def) {
      addrSelect = def
      persist()
      return def
    }
  }
  const first = list[0] || null
  addrSelect = first
  persist()
  return first
}
