---
name: mall-api
description: >-
  商户商城 API 与商品/购物车/订单/地址数据结构（来自旧 React 站 youshan_frontend_merchant）。
  做商品列表/详情、购物车、下单、订单、地址、收藏、退货或对接后端接口时使用；
  禁止凭记忆编造 path。
---

# 商城 API（对照旧站）

旧站路径：`d:\program\youshan_frontend_merchant`  
请求封装：`src/service/request.js`；调用多在 `src/redux/**`、`src/page/**`。

详细清单见 [reference.md](reference.md)。本文件只放做功能时必记的约定。

## 请求约定

- 业务前缀：`/apis/youshan-m/...`；公共：`/apis/common/...`；分类：`/commons/...`
- 多数响应：`{ success: boolean, results: data | 错误串 }`
- 鉴权头：`Authorization: <loginToken>`；白名单（旧站不强制 token）：`/apis/common/`、`/code`、`/commons/jee-fk-permit`
- `results === "logout"` → 清登录态并去登录页
- **例外**：字典看 `status===200` + `data.<groupId>`；汇率 `getJPCNY` 直接用 `data` 数字；分类用 `data.data`

小程序用 `Taro.request` 封装对齐上述形态，**不要照搬 axios/cookie**。

## 按功能选接口（速查）

| 功能 | 主接口 |
|------|--------|
| 商品列表 | `POST /apis/youshan-m/merchantcommodity/selectByParam` body `{ page, rows, condition:{ title, category } }` |
| 商品详情 | `GET /apis/youshan-m/merchantcommodity/getCommodityById/{id}` |
| 下单前刷价 | `POST .../merchantcommodity/getListByIds` body **id 数组** |
| 补商品图 | `POST .../merchantcommodity/getImage` body **pid 数组** |
| 分类 | `GET /commons/jee-fk-permit/category/queryP?kind=1` |
| 收藏 | `updateLike` / `queryLikeCommoditys` / `delLike`（merchantlike） |
| 购物车 | **无服务端接口**；本地结构对齐旧站（见下） |
| 创建订单 | `POST .../merchantorder/createOrder` |
| 订单列表 | `POST .../merchantorder/getOrder` |
| 订单详情 | `POST .../merchantorder/getOrderById` 或 `getOrderWithImageById` |
| 更新订单 | `POST .../merchantorder/updateOrderById` |
| 地址 CRUD | `merchantaddress/queryByUid` / `saveAddress` / `delAddress` |
| 邮编 | `POST .../postcode/selectByParam` |
| 支付方式 | `POST .../payment/getAllPayment` |
| 运费 | `POST .../fare/getAllFare` |
| 汇率 | `POST /apis/common/rate/getJPCNY` |
| 积分 | `GET .../merchantuser/getPoint` |
| 用户信息 | `getUserInfo` / `updateUserInfo` |
| 字典 | `POST /apis/common/dictionary/queryByGroupIds` 如 `["order_status"]` |
| 退货 | `merchantrefunder/*`（见 reference） |

登录/微信/支付流程 → skill `wechat-auth-payment`。小程序进站：`POST /apis/common/wxlogin/miniLogin` body `{ code }`。

## 关键数据结构

### 商品（列表/购物车展示）

`id, title, price, image, unit, category, tax, taxtype, home, love?, count?`  
`home` 含 `'3'` → 活动标；活动商品不计入运费门槛金额。

### 购物车（本地，旧键名 YOUSHAN_CART）

```ts
// cart["PID" + pid]
{ id, pid, pident: "", image, title, price, count, total, category, home }
```

**无独立 SKU API**；`pident` 恒为 `""`。不要臆造规格接口。

### 订单行（`order.data` 为 JSON 字符串，key=`"PID"+id`）

```ts
{ pid, title, count, unit, price, total, pident: "", tax, taxtype, home, refund? }
```

### 创建订单核心字段

`paid, payid, status, uid, pay, name, phone, city, zip, address, addressid, total, svf, memo, data, wechat, socialtype, wuliu, totald, yf, ld, lc, shtime, rate, point, fapiao, taitou, pi, view, view2, uname, umail, mobile`

下单前必须先 `getListByIds` 再组 `data`。

### 地址

`id, receive, phone, socialtype, socialaccount, postcode, prefecture, city, town, address, building, roomnumber, state`（`state===1` 默认）

### 订单状态（前端注释；展示文案以字典为准）

`0` 等待付款 · `1` 已付款 · `2` 已发货 · `3` 取消 · `4` 货到付款 · `5` 货到付款已发货 · `6` 完成；另有 `7` 退款等。

## 强制规则

1. 先读本 skill / reference 或旧站代码，再写 `services/`；禁止猜 URL  
2. 复用 path、method、body、字段含义；运行时按小程序重写  
3. 不确定时打开旧站对应 `redux`/`page` 核对，再实现
