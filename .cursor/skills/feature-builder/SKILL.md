---
name: feature-builder
description: >-
  商户小程序功能开发固定流程：先读现有代码与 Skill → 复用 API/类型 → 实现页面 →
  微信兼容检查 → 自检。用户要求做页面/功能、实现需求、或说「按流程开发」时使用。
---

# 功能开发流程

做任何业务功能（页面、接口对接、登录支付等）时，按顺序执行，可勾选跟踪。

```
Task Progress:
- [ ] 1. 读规范与现有代码
- [ ] 2. 定位可复用 API / 类型 / 组件
- [ ] 3. 实现（services → store/hooks → 页面）
- [ ] 4. 微信 / Taro 兼容检查
- [ ] 5. 自检（project-code-review）
```

## 1. 读规范与现有代码

1. 读 always-on 规则与相关 Skill：  
   - 技术：`taro-wechat-dev`  
   - 接口：`mall-api`（必要时 `reference.md`）  
   - 登录支付：`wechat-auth-payment`  
   - UI：`mall-ui`  
2. 在本仓库搜索是否已有同名 page / service / 组件  
3. 在旧站 `d:\program\youshan_frontend_merchant` 搜索同功能（`redux`/`page`），确认 path 与字段  

**输出**：要做的页面路径、依赖接口列表、可复用文件。不要开写前跳过这一步。

## 2. 找可复用 API / type

- 接口 path/body **只来自** `mall-api` 或旧站实码；禁止猜测  
- 在 `src/services/`（或既有目录）增加/复用函数；补 TypeScript 类型  
- 购物车无后端接口 → 用本地存储结构（见 `mall-api`）  
- 登录/支付走 `wechat-auth-payment`，勿混用 H5 OAuth 跳转

## 3. 实现页面

顺序建议：

1. `app.config.ts` 注册页面（或分包）  
2. 写 service + types  
3. hooks/store（列表、详情、提交状态）  
4. UI：按 `mall-ui`（卡片、价格、底栏 CTA、空态、Loading）  
5. 仅用 `@tarojs/components` + Taro API  

实现中对照旧站交互顺序（如：下单前 `getListByIds` → `createOrder` → 付款页）。

## 4. 微信兼容性

- 无 DOM/BOM/HTML 标签  
- 路由、存储、图片、登录提示均用 Taro  
- Tab/非 Tab 跳转正确  
- 域名与登录态头符合小程序环境  

## 5. 自检

严格执行 skill `project-code-review` 清单，并向用户给出：通过 / 已修复 / 待确认。

## 分支指引

| 需求类型 | 额外必读 |
|----------|----------|
| 商品列表/详情/收藏 | `mall-api` 商品段 + `mall-ui` 卡片 |
| 购物车/结算 | `mall-api` 本地车 + 订单创建字段 |
| 订单/退货 | `mall-api` order/refunder + 状态表 |
| 登录/绑定/支付 | `wechat-auth-payment` |
| 纯样式调整 | `mall-ui` |

## 完成定义

- 功能可在小程序侧走通主路径  
- 接口与字段可追溯到旧站或已文档化的后端约定  
- 自检清单无未处理的硬伤（兼容性、静默失败、可连点支付）
