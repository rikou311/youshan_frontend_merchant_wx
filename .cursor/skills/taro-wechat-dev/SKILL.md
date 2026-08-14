---
name: taro-wechat-dev
description: >-
  微信小程序 Taro + React + TypeScript 开发核心规范。涵盖页面结构、组件规范、
  Taro API 用法、路由导航、微信小程序限制与禁止 DOM。在编写/修改 Taro 页面、
  组件、hooks、配置，或用户提到 Taro、小程序、weapp、@tarojs 时使用。
---

# Taro 微信小程序开发（核心）

技术栈固定为 **Taro + React + TypeScript**，目标平台微信小程序（weapp）。禁止 Web-only 假设。

## 技术栈约束

- React 函数组件 + Hooks；TypeScript（`.tsx` / `.ts`），禁止隐式 `any`
- UI 用 `@tarojs/components`；禁止 HTML 标签（`div`/`span`/`img`/`a`）
- 能力用 `@tarojs/taro`；禁止 `document` / `window` / `localStorage` / DOM API
- 样式优先 SCSS；尺寸用 `rpx` 或项目设计稿约定

## 目录结构

```
src/
  app.ts / app.config.ts / app.scss
  pages/<name>/index.tsx|index.config.ts|index.scss
  components/  hooks/  services/  store/  utils/  constants/  types/
```

- 页面与 `app.config.ts` 的 `pages` / `subPackages` 一一对应
- 页面参数用 `useRouter` / `useLoad`

## 组件与事件

| 禁止 | 使用 |
|------|------|
| `div`/`section` | `View` |
| `span`/`p` | `Text` |
| `img` | `Image`（设 `mode`） |
| `input` | `Input`（`value` + `onInput`） |
| `button` | `Button` |
| 滚动容器 | `ScrollView` |

- 输入取值：`e.detail.value`（不是 `e.target.value`）
- Props / 事件显式类型化

## Taro API

| 场景 | 使用 | 禁止 |
|------|------|------|
| 请求 | 项目 `Taro.request` 封装 | 裸 `axios`/`fetch`（除非已有适配层） |
| 存储 | `Taro.setStorageSync` 等 | `localStorage` |
| 提示 | `Taro.showToast` / `showLoading` / `showModal` | DOM 弹层 |
| 生命周期 | `useLoad` / `useDidShow` / `useReady` | 仅用 `useEffect` 冒充页面生命周期 |

## 路由

| 场景 | API |
|------|-----|
| 保留当前页 | `Taro.navigateTo` |
| 替换 | `Taro.redirectTo` |
| 清空栈 | `Taro.reLaunch` |
| Tab | `Taro.switchTab`（不可带 query） |
| 返回 | `Taro.navigateBack` |

`url` 以 `/` 开头；禁止 `react-router` / `window.location`。

## 小程序限制

- 无 DOM/BOM；节点信息用 `Taro.createSelectorQuery`
- 主包体积控制；大功能放分包
- 请求域名须在小程序后台配置
- Flex 布局优先；慎用复杂 Web CSS

## 自检

- [ ] 无 HTML / DOM / `localStorage` / react-router
- [ ] 路由 API 与 Tab 匹配；页面已注册
- [ ] `onInput` + `e.detail.value`；有加载/空态
---

# 反例 → 正例

```tsx
// ❌ <div onClick={() => navigate('/detail')}><span>{t}</span><img src={u}/></div>
// ✅
<View onClick={() => Taro.navigateTo({ url: '/pages/detail/index' })}>
  <Text>{t}</Text>
  <Image src={u} mode='aspectFill' />
</View>
```
