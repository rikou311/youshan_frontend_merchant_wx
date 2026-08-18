import type { Commodity } from '@/types/commodity'

type Listener = () => void

const listeners: Listener[] = []
/** 本会话内的收藏变更，用来同步首页爱心 */
const loveByPid: Record<string, boolean> = {}

function emit() {
  listeners.forEach((fn) => fn())
}

export function subscribeLove(listener: Listener) {
  listeners.push(listener)
  return () => {
    const i = listeners.indexOf(listener)
    if (i >= 0) listeners.splice(i, 1)
  }
}

export function setLoveStatus(pid: number | string, loved: boolean) {
  loveByPid[String(pid)] = loved
  emit()
}

export function applyLove(products: Commodity[]): Commodity[] {
  if (Object.keys(loveByPid).length === 0) return products
  return products.map((item) => {
    const key = String(item.id)
    if (!(key in loveByPid)) return item
    return {
      ...item,
      love: loveByPid[key] ? item.love || item.id : null,
    }
  })
}
