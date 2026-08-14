---
name: mall-ui
description: >-
  商户商城 UI 视觉与交互规范：主题色、间距、商品卡片、价格（円/RMB）、数量步进、
  底栏 CTA、空状态与 Loading。新写或改版页面、组件样式时使用，保证页面观感一致。
---

# 商城 UI 规范

参考旧站视觉（`d:\program\youshan_frontend_merchant` 的 `common.sass`、商品卡、底栏），用 **Taro 组件** 重做，不照搬 antd/antd-mobile/MUI。

## 设计变量（建议 CSS 变量）

```scss
:root {
  --color-brand: #ff640c;      // 主橙
  --color-brand-strong: #ff5723;
  --color-cta: #f2853c;
  --color-cta-text: #ffffff;
  --color-wechat: #07c160;
  --color-tab-active: #edcb43;
  --color-bar: #350509;        // 底栏结算条
  --color-card-order: #312020;
  --color-accent-line: #fcaf52;
  --color-page-foot: #cac5c575;
  --radius-card: 16rpx;
  --space-sm: 16rpx;
  --space-md: 24rpx;
  --space-lg: 32rpx;
  --content-max: 750px;        // H5 遗留；小程序以满宽 + 左右 padding 为准
}
```

- 页面背景：头橙 → 足灰褐的轻渐变可保留气质，避免花哨装饰堆叠  
- 正文深色；主 CTA **橙系**，不要默认 Element/antd 蓝  
- 微信相关按钮可用 `--color-wechat`

## 布局骨架

1. **顶栏**：返回 + 标题（白/浅底或品牌底，与页类型一致）  
2. **内容区**：左右 `var(--space-md)`；列表可滚动  
3. **底 Tab**（首页/购物车/收藏/我的）：固定；选中 `--color-tab-active`；购物车角标  
4. **底栏 CTA**（购物车结算、确认订单）：深色条 `--color-bar` + 件数/金额 + 胶囊按钮文案如「結算」「去支付」

一页一个主操作；主按钮在底栏或内容区末固定位置，样式统一为 `.total-btn` 一类。

## 商品卡片

横向卡（左图右文），不要无故改成复杂网格：

- 左：`Image` 商品图（`mode='aspectFill'`）  
- 右：标题（最多 2 行）、库存+`unit`、价格  
- 右下：数量步进器；右上：收藏  
- `home` 含 `'3'`：显示「活动」角标（渐变小标签即可）  
- 白底、圆角 `var(--radius-card)`、轻分隔  

购物车卡：同样横向结构，提供「移除」。

## 价格显示

| 场景 | 格式 |
|------|------|
| 列表/卡片 | `￥{price}` 或与旧列表一致的符号 |
| 结算/订单主金额 | **`{n}円`**（JPY 为主） |
| 有汇率时 | 附 RMB：`Math.ceil(n * rate)` 或 `toFixed(2)` +「元」 |
| 积分 | 文案标明 `1积分=1円` |

汇率来自 `getJPCNY`。价格与货币符号组件化（如 `<Price value currency='jpy' />`），避免每页手写。

## 数量步进

- 控件：`-` / 数字 / `+`  
- 下限 1（或 0 表示移除，与购物车逻辑一致）  
- 上限为库存 `total`（旧 count 组件）  
- **无 SKU 弹窗**：旧站无多规格；不要擅自做规格抽屉，除非产品新增需求

## 按钮

| 类型 | 样式 |
|------|------|
| 主 CTA | 橙底白字，圆角胶囊，`--color-cta` |
| 登录主按钮 | 偏 `#ff5723` |
| 次要/线框 | 浅底或描边，勿抢主色 |
| 微信 | `#07C160` |
| 加载中 | 禁用 + 文案 `Loading...`（旧 `total-btn-lock`） |

点击态要有；提交类必须防重复（loading 锁）。

## 空状态 / Loading

| 场景 | 文案/表现 |
|------|-----------|
| 无商品 | 「暂无产品」 |
| 无地址 | 「暂无地址，请添加」 |
| 无订单 | 简短空文案 + 可选去首页 |
| 列表加载更多 | `Loading...` |
| 整页等待（登录回调等） | 居中「处理中...」 |
| 下单按钮 | 锁按钮 + `Loading...` |

不要每页换一套 Empty 插画风格；优先统一文案组件。

## 订单卡

- 偏暗卡片底（参考 `#312020`）或白卡 + 橙分隔线 `#fcaf52`  
- 展示状态文案（字典）、金额「円」、关键操作按钮（去付款/取消/退货等按状态显隐）

## 一致性检查

- [ ] 使用 CSS 变量，无随机新主色  
- [ ] 商品卡横向结构一致  
- [ ] 价格「円」为主，RMB 为辅  
- [ ] 有底栏 CTA 的页，主按钮在底栏  
- [ ] Loading / 空态文案统一  
- [ ] 仅用 `@tarojs/components`，无 HTML 标签
