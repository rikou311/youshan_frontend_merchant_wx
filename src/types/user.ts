/** POST /apis/youshan-m/merchantuser/getUserInfo */
export interface UserInfo {
  uname: string
  unick: string
  phone?: string
  name?: string
  wechat?: string
  memo?: string
  socialtype?: string | number
  zip?: string
  address?: string
  umail?: string
  money?: number
  point?: number
  upass?: string
}
