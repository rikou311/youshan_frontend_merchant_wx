# 商城 API 完整清单（旧站实勘）

来源：`d:\program\youshan_frontend_merchant`。未在旧站出现的接口不要当作已有能力。

## Commodity

| Method | Path | Body |
|--------|------|------|
| POST | `/apis/youshan-m/merchantcommodity/selectByParam` | `{ page, rows, condition: { title, category } }` |
| GET | `/apis/youshan-m/merchantcommodity/getCommodityById/{id}` | — |
| POST | `/apis/youshan-m/merchantcommodity/getListByIds` | `number[]` 商品 id |
| POST | `/apis/youshan-m/merchantcommodity/getImage` | pid 数组 |

## Like

| Method | Path | Body | 备注 |
|--------|------|------|------|
| POST | `/apis/youshan-m/merchantlike/updateLike` | `{ pid }` | `results==='DELETE'` 表示取消 |
| POST | `/apis/youshan-m/merchantlike/queryLikeCommoditys` | `{}` | |
| POST | `/apis/youshan-m/merchantlike/delLike` | `{ pid }` | |

## Order

| Method | Path | Body |
|--------|------|------|
| POST | `/apis/youshan-m/merchantorder/getOrder` | `{ page, rows, condition: { status, searchFDate, searchSDate } }` |
| POST | `/apis/youshan-m/merchantorder/getOrderById` | `{ id }`；`data` 常为 JSON 字符串 |
| POST | `/apis/youshan-m/merchantorder/getOrderWithImageById` | `{ id }` |
| POST | `/apis/youshan-m/merchantorder/createOrder` | 完整 order |
| POST | `/apis/youshan-m/merchantorder/updateOrderById` | 整单或局部 |

`updateOrderById` 场景：

- 付款确认：整单 + `status`（在线→`1`，货到付款→`4`）、`ordernumber`、`memo`、`pay`、`payNm`、`svf`
- 详情操作：`{ id, status, point, uid }` 或 `{ id, memo }`

## Address / Postcode

| Method | Path | Body |
|--------|------|------|
| POST | `/apis/youshan-m/merchantaddress/queryByUid` | 无；`results.address` + `results.user.address` |
| POST | `/apis/youshan-m/merchantaddress/saveAddress` | 地址对象 |
| POST | `/apis/youshan-m/merchantaddress/delAddress` | `{ id }` |
| POST | `/apis/youshan-m/postcode/selectByParam` | `{ page, rows, condition:{ postcode }, sort:{ prop, order } }` |

## User

| Method | Path |
|--------|------|
| POST | `/apis/youshan-m/merchantuser/getUserInfo` |
| POST | `/apis/youshan-m/merchantuser/updateUserInfo` |
| GET | `/apis/youshan-m/merchantuser/getPoint` |

Profile 字段：`uname, upass, unick, phone, name, wechat, memo, socialtype, zip, address, money`

## Payment / Fare / Rate

| Method | Path | 响应要点 |
|--------|------|----------|
| POST | `/apis/youshan-m/payment/getAllPayment` | `{ id, value, title, image, demomemo?, demoimage? }[]` |
| POST | `/apis/youshan-m/fare/getAllFare` | `{ id, type, title, fare, display }[]` |
| POST | `/apis/common/rate/getJPCNY` | **`data` 为数字**（非 success/results） |

货到付款判断：`title==="货到付款"` 或 `value/pay === 3` / `"3"`。

运费客户端规则：`type` 分组；`0` 货到付款、`2` 保鲜（如冷冻）、`3/4/5` 按都道府县门槛；低于 `display` 收 `yf`/`kf`。

## Dictionary / Category

| Method | Path | Body |
|--------|------|------|
| POST | `/apis/common/dictionary/queryByGroupIds` | `string[]` → `data.<groupId>` |
| GET | `/commons/jee-fk-permit/category/queryP?kind=1` | → `data.data` |

已知 groupId：`order_status`、`refunder_state`、`logistics_type`、`take_time_type_merchant`、`social_type`。

分类项：`id, type, title, image`（商品 `category` 对齐 `type`）。

## Auth（端点一览）

| Method | Path |
|--------|------|
| POST | `/apis/common/index/login` |
| GET | `/apis/common/index/code` |
| POST | `/apis/common/index/logout` |
| POST | `/apis/common/merchantuseradd/add` |
| POST | `/apis/common/wxlogin/boundWechat` |
| POST | `/apis/common/wxlogin/boundWechatGzh` |
| — | `/apis/common/wxlogin/redirect` / `redirectGzh` |
| POST | `/apis/common/index/boundList` |
| POST | `/apis/common/index/unbound` |

## Refunder

| Method | Path | Body |
|--------|------|------|
| POST | `/apis/youshan-m/merchantrefunder/getRefunder` | 分页 + `condition.state/dates` |
| POST | `/apis/youshan-m/merchantrefunder/getRefunderById` | `{ rid }` |
| POST | `/apis/youshan-m/merchantrefunder/createRefunder` | `{ id: 订单id, object: applyList }` |
| POST | `/apis/youshan-m/merchantrefunder/cancelRefunder` | `{ rid }` |
| POST | `/apis/youshan-m/merchantrefunder/updateRefunder` | `{ memo, rid }` |

`applyList`：`{ [pid]: count }`；可退上限 = `count - (refund||0)`。

## 旧站对照文件

- 请求：`src/service/request.js`、`src/setupProxy.js`
- 商品：`src/redux/commodity/commodity.js`
- 购物车：`src/redux/shopping/cart.js`
- 订单：`src/redux/order/order.js`、`editOrder.js`；页 `confirmPay`、`payment`、`orderDetail`
- 字典：`src/redux/common/dictionary.js`
