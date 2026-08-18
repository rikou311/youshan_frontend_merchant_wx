import { useEffect, useState } from 'react'
import {
  addToCart,
  adjustQty,
  getCartAmount,
  getCartCount,
  getCartItems,
  getCartMap,
  getCartTotal,
  getCartTotalToYn,
  reloadCart,
  subscribeCart,
} from '@/store/cart'

export function useCart() {
  const [, setTick] = useState(0)

  useEffect(() => {
    return subscribeCart(() => setTick((n) => n + 1))
  }, [])

  return {
    amount: getCartAmount(),
    total: getCartTotal(),
    totalToYn: getCartTotalToYn(),
    items: getCartItems(),
    cart: getCartMap(),
    getCount: getCartCount,
    adjustQty,
    addToCart,
    reload: reloadCart,
  }
}
