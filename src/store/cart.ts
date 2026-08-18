import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '@/constants/storage'
import type { CartLine, CartMap, Commodity } from '@/types/commodity'

type Listener = () => void

let cart: CartMap = readCart()
let cartProducts: Commodity[] = readCartProducts()
let addCartState = true
const listeners: Listener[] = []

function readCart(): CartMap {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEYS.cart)
    if (raw && typeof raw === 'object') return raw as CartMap
  } catch {
    /* ignore */
  }
  return {}
}

function readCartProducts(): Commodity[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEYS.cartProducts)
    if (Array.isArray(raw)) return raw as Commodity[]
  } catch {
    /* ignore */
  }
  return []
}

function persist() {
  try {
    Taro.setStorageSync(STORAGE_KEYS.cart, cart)
    Taro.setStorageSync(STORAGE_KEYS.cartProducts, cartProducts)
  } catch (err) {
    console.error('[cart] persist failed', err)
  }
}

function emit() {
  listeners.forEach((fn) => fn())
}

export function subscribeCart(listener: Listener) {
  listeners.push(listener)
  return () => {
    const i = listeners.indexOf(listener)
    if (i >= 0) listeners.splice(i, 1)
  }
}

export function getCartMap() {
  return cart
}

export function getCartCount(pid: number | string) {
  return cart[cartKey(pid)]?.count || 0
}

export function getCartAmount() {
  let amount = 0
  Object.keys(cart).forEach((key) => {
    amount += cart[key]?.count || 0
  })
  return amount
}

export function getCartProducts() {
  return cartProducts
}

export function getCartTotal() {
  let sum = 0
  Object.keys(cart).forEach((key) => {
    const line = cart[key]
    if (!line) return
    sum += (line.count || 0) * (Number(line.price) || 0)
  })
  return sum
}

/** 活动商品不计入运费门槛，对齐旧站 totalToYn */
export function getCartTotalToYn() {
  let sum = 0
  Object.keys(cart).forEach((key) => {
    const line = cart[key]
    if (!line) return
    const home = line.home
    if (
      home === '' ||
      home == null ||
      (home && !String(home).includes('3'))
    ) {
      sum += (line.count || 0) * (Number(line.price) || 0)
    }
  })
  return sum
}

export function getCartItems() {
  return cartProducts
    .map((product) => ({
      product,
      line: cart[cartKey(product.id)],
    }))
    .filter((row): row is { product: Commodity; line: CartLine } =>
      Boolean(row.line && row.line.count > 0),
    )
}

export function reloadCart() {
  cart = readCart()
  cartProducts = readCartProducts()
  emit()
}

export function cartKey(pid: number | string) {
  return `PID${pid}`
}

function samePid(a: number | string, b: number | string) {
  return String(a) === String(b)
}

function normalizeProduct(product: Commodity): Commodity {
  const fallback = (product as Commodity & { pid?: number | string }).pid
  const raw =
    product.id !== undefined && product.id !== null && String(product.id) !== ''
      ? product.id
      : fallback
  const id = Number(raw)
  return {
    ...product,
    id: Number.isFinite(id) ? id : product.id,
  }
}

/** 对齐旧站 adjustQty：count=0 移除；否则写入/覆盖条目 */
export function adjustQty(product: Commodity, count: number) {
  if (!addCartState || !product) return
  addCartState = false

  const item = normalizeProduct(product)
  const key = cartKey(item.id)
  const existing = cart[key]
  const qty = Number(count) || 0

  if (qty <= 0) {
    const next: CartMap = { ...cart }
    delete next[key]
    cart = next
    cartProducts = cartProducts.filter((row) => !samePid(row.id, item.id))
  } else {
    const line: CartLine = {
      id: existing?.id || String(Date.now()),
      pid: item.id,
      pident: '',
      image: item.image,
      title: item.title,
      price: item.price,
      count: qty,
      total: Number(item.price) * qty,
      category: item.category,
      home: item.home,
    }
    cart = { ...cart, [key]: line }
    if (!cartProducts.some((row) => samePid(row.id, item.id))) {
      cartProducts = [...cartProducts, item]
    }
  }

  persist()
  addCartState = true
  emit()
}

/** 对齐旧站 addToCart：在现有数量上累加 */
export function addToCart(product: Commodity, count: number) {
  const item = normalizeProduct(product)
  const add = Number(count)
  if (!item || !Number.isFinite(add) || add <= 0) return
  const current = getCartCount(item.id)
  const stock = Number(item.total)
  let next = current + add
  if (Number.isFinite(stock) && stock > 0) {
    next = Math.min(next, stock)
  }
  adjustQty(item, next)
}

export function isAddCartReady() {
  return addCartState
}

export function clearCart() {
  cart = {}
  cartProducts = []
  persist()
  emit()
}
