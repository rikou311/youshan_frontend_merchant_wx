export const STORAGE_KEYS = {
  loginToken: 'loginToken',
  loginState: 'loginState',
  /** 未注册进站时暂存的微信授权资料 / 临时凭证 */
  wxEnterPending: 'wxEnterPending',
  /** 注册成功后待绑定微信的商家信息 */
  bindPending: 'bindPending',
} as const
