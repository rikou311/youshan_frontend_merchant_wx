---
name: wechat-auth-payment
description: >-
  微信小程序登录、openid、账号绑定、订单支付与订单状态规则。处理 wx.login、token、
  绑定/解绑、付款确认、货到付款、支付回调与订单状态流转时使用。旧 H5 站无 JSAPI
  支付实现，小程序支付需按本 skill 单独设计。
---

# 微信登录与支付

旧站：`d:\program\youshan_frontend_merchant`（H5 OAuth + 人工确认付款，**无** `chooseWXPay`/prepay）。  
小程序必须改写鉴权与支付，但 **业务订单状态与 update 字段对齐旧站**。

## 鉴权存储（小程序）

| 项 | 约定 |
|----|------|
| Token | `Taro.setStorageSync('loginToken', token)` |
| 登录标记 | `loginState` |
| 请求头 | `Authorization: <loginToken>` |
| 未登录 | `Taro.reLaunch` / `navigateTo` 登录页；禁止 `window.location`、cookie |

白名单请求（可不带 token）：`/apis/common/`、验证码、`/commons/jee-fk-permit`。  
`success===false && results==="logout"` 或 401 → 清 storage 并回登录。

## 账号密码登录（旧站已有，可复用接口）

1. `GET /apis/common/index/code` → 验证码  
2. `POST /apis/common/index/login` body `{ uname, upass, code }`  
3. 成功：`results` 为 token，写入 storage  
4. 失败码：`UNDERREVIEW`（审批中）、`UNALLOWED`（禁用）

注册：`POST /apis/common/merchantuseradd/add`（`unick, name, uname, upass, umail, phone`）。  
登出：`POST /apis/common/index/logout` + 清本地。

## 小程序微信登录

旧站是 H5 OAuth（`redirect` / `redirectGzh`），**不能直接用于小程序**。

1. `Taro.login()` 取 `code`
2. `POST /apis/common/wxlogin/miniLogin` body `{ code }`
3. 已绑定：`success` + `results` 为 `Bearer ...` → 写入 storage → 首页
4. 未绑定：`results === "WECHATUNBOUND"`，`extra` 为 **openId 字符串** → 用户授权 → 商家注册 / `boundWechatMini`

### 绑定 / 解绑（旧站可参考）

| 场景 | 旧接口 | 说明 |
|------|--------|------|
| PC 绑定 | `POST /apis/common/wxlogin/boundWechat` | `{ uname, upass, token }` |
| 公众号绑定 | `POST /apis/common/wxlogin/boundWechatGzh` | 同上 |
| 小程序绑定 | `POST /apis/common/wxlogin/boundWechatMini` | `{ uname, upass, token }`，token 为 miniLogin 返回的 openId |
| 绑定列表 | `POST /apis/common/index/boundList` | |
| 解绑 | `POST /apis/common/index/unbound` | `{ token }` |

绑定失败码：`WRONGPASSWORD`、`BOUNDFAIL`、`WECHATUNBOUND`、`TOKENALREADYBOUND`、`UNDERREVIEW`。  
旧回调页逻辑：token 以 `Bearer_` 开头 → 规范为 `Bearer `；`WECHATUNBOUND` → 绑定页。

小程序绑定应复用「账号+密码关联微信身份」的产品逻辑；具体是否仍用上述 path 以**后端小程序方案**为准，改前先确认。

## 下单与付款流程

```
购物车 → 确认订单(confirmPay) → createOrder → 付款页(payment) → updateOrderById
```

### 创建订单

- `POST /apis/youshan-m/merchantorder/createOrder`
- 初始：`status: 0`，`paid: 0`，`payid: 0`，`pay: 所选支付 value`
- 成功：清本地购物车 → 进入付款页（带订单 `id`）

### 付款页（旧 H5 行为）

- 仅 `status===0` 时拉 `getAllPayment`
- 用户确认「我已付款」→ `updateOrderById`：
  - 在线支付：`status = 1`
  - 货到付款（`pay===3` / title 货到付款）：`status = 4`，并算 `svf`
  - 同时可写 `ordernumber`、`memo`、`pay`、`payNm`

这是**人工确认流**，不是微信收银台。

### 小程序微信支付（需新增）

旧站无 JSAPI。若产品要求真支付：

1. 后端下单/预支付，返回小程序支付参数  
2. `Taro.requestPayment({ timeStamp, nonceStr, package, signType, paySign })`  
3. 成功：以**后端支付回调/查单**更新订单状态，前端可再拉 `getOrderById` 校验  
4. 失败/取消：保持 `status:0`，允许重试；防重复点击

未接到后端 prepay 接口前：可先实现与旧站一致的确认流，并在代码注释标明「待接 JSAPI」。

## 订单状态

| value | 含义（前端注释） |
|-------|------------------|
| 0 | 等待付款 |
| 1 | 已付款 |
| 2 | 已发货 |
| 3 | 订单取消 |
| 4 | 货到付款 |
| 5 | 货到付款已发货 |
| 6 | 订单完成 |
| 7 | 退款相关（详情页硬编码） |

展示文案：`POST /apis/common/dictionary/queryByGroupIds` + `["order_status"]`。  

边界：

- `status===0`：可改单、去付款  
- `status===4`：可取消  
- 可申请退货状态含 `2,5,7,10,12`（旧列表逻辑）  
- 积分：`1积分=1円`；下单前 `getPoint`

## 实现检查清单

- [ ] Token 只走 Taro storage + Authorization  
- [ ] 登录失败码有用户提示  
- [ ] 创建订单后才进支付；支付成功以服务端状态为准  
- [ ] 按钮防重复提交（下单/支付/确认已付）  
- [ ] 货到付款与在线支付 status 分支正确  
- [ ] 未实现 JSAPI 时不假装已接微信支付
