---
name: project-code-review
description: >-
  本仓库改代码后的固定自检：TypeScript、重复代码、小程序兼容、请求错误处理、
  Loading、防重复提交、支付与订单边界。完成功能、修 bug、或用户要求 review 时使用。
---

# 项目代码自检

每次实现或修改后，按下列清单检查；有问题先修再结束。相关规范见 `taro-wechat-dev`、`mall-api`、`wechat-auth-payment`、`mall-ui`。

## 1. TypeScript

- [ ] 无隐式 `any`；Props / API 响应有类型  
- [ ] 请求 body、路由参数类型与 `mall-api` 字段一致  
- [ ] 不滥用 `as any`；必要时收窄联合类型

## 2. 重复与结构

- [ ] 未复制粘贴可抽的请求/价格/卡片逻辑  
- [ ] 接口放 `services/`（或项目约定目录），页面不堆 raw path 字符串散落多处  
- [ ] 与旧站相同业务未另造一套字段名

## 3. 小程序兼容（硬条件）

- [ ] 无 `div/span/img`、无 `document/window/localStorage`、无 `react-router`  
- [ ] 路由 API 正确（Tab 用 `switchTab`）  
- [ ] 存储用 Taro；选择器用 `createSelectorQuery`（若需要）  
- [ ] 未依赖 Web-only 库（antd/MUI 等）除非已有小程序替代

## 4. 请求与错误

- [ ] 使用统一请求封装；处理 `success===false`  
- [ ] `logout` / 401 → 清登录态并跳转  
- [ ] 失败 `showToast`（或项目统一提示），不静默失败  
- [ ] 字典/汇率/分类等**非标准**响应形态已分支处理

## 5. Loading / 空态 / 防重复

- [ ] 首屏与提交有 loading  
- [ ] 列表空数据有空态文案（对齐 `mall-ui`）  
- [ ] 下单、支付、确认已付、删除等按钮 loading 锁，防连点

## 6. 支付与订单边界

- [ ] 创建订单成功后再进支付；状态以服务端为准  
- [ ] `status` 分支：`0` 可付/可改；货到付款 → `4`；在线确认 → `1`  
- [ ] 未接 JSAPI 时不假装已支付成功  
- [ ] 金额、运费、积分计算与旧逻辑一致或已注明差异  
- [ ] 下单前需要时调用 `getListByIds` 刷新价格

## 7. UI 一致性

- [ ] 主色/CTA/价格格式符合 `mall-ui`  
- [ ] 商品卡、底栏 CTA 未另起一套布局

## 输出格式（向用户汇报时）

```
自检结果：
- 通过：...
- 已修复：...
- 待确认：...（需产品/后端拍板的项）
```

只报告真实检查过的项；不要空泛说「已全部符合」。
