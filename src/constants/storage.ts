export const STORAGE_KEYS = {
  loginToken: 'loginToken',
  loginState: 'loginState',
  /** 未注册进站时暂存的微信授权资料 / 临时凭证 */
  wxEnterPending: 'wxEnterPending',
  /** 注册成功后待绑定微信的商家信息 */
  bindPending: 'bindPending',
  /** 本地购物车，对齐旧站 YOUSHAN_CART */
  cart: 'YOUSHAN_CART',
  cartProducts: 'YOUSHAN_CART_PRODUCTS',
  /** 确认订单选中的收货地址 */
  checkoutAddress: 'YOUSHAN_CHECKOUT_ADDRESS',
} as const
