---
title: "译：UI = f(statesⁿ)"
date: 2024-02-26
url: https://sorrycc.com/ui-states
---

发布于 2024年2月26日

# 译：UI = f(statesⁿ)

> 原文：[https://daverupert.com/2024/02/ui-states/](https://daverupert.com/2024/02/ui-states/)  
> 作者：Dave Rupert  
> 译者：ChatGPT 4 Turbo

**编者注：想不到居然有这么多 state。**

“UI 是状态的函数” 在前端世界中相当流行。在上下文中（双关语），这通常是指应用程序或组件的状态。我想进一步探索所有可能影响 UI 层的状态……

## 第一方应用状态

每个应用程序，无论是待办事项列表、购物车还是一些极其复杂的应用程序，都会有一些状态。状态并不是统一的，通常存在于不同的层次上。我们将从顶部开始向下钻研……

### 全局状态

通常在应用程序级别发生的数据存储和功能开关。

*   Stores - 用于存储数据的不同位置
    *   应用存储 - Redux、Vuex、Mobx、Signals
    *   浏览器存储 - localStorage、sessionStorage、cookies、IndexedDB
*   Data - 各种类型的全局数据
    *   访问控制数据 - 认证令牌、已付费/未付费、地理定位、年龄、已验证、会员等
    *   用户数据 - 名称、图标等
    *   集合 - 例如帖子列表
    *   会话数据
    *   … 等

### 页面/组件状态

Vince Speelman 的精彩著作[《设计的九种状态》](https://medium.com/swlh/the-nine-states-of-design-5bfe9b3d6d85)很好地总结了一个页面或组件可能存在的所有状态。

*   Nothing - 一个空元素
*   Loading - 正在发生一个 `fetch`
*   None - 没有返回任何项目
*   One - 单个项目返回
*   Some - 一些物品被返回
*   Too Many - 返回太多项，需要分页（或类似功能）
*   Incorrect - 发生了一个错误
*   Correct - 发生了成功事件
*   Done - 操作结束

Vince 的清单对我来说是完美的，这么多年后仍然相关，我会再加两项。

*   自定义状态 - 与您的应用程序相关的任何定制或自定义状态
*   实时多玩家事件消息 - 想象聊天应用或实时股票行情不断更新的状态。存储在组件级别或投入全局状态。
*   滚动位置 - 页面和组件经常需要知道它们是否已滚动进入或离开视口。

在我的经验中，页面和每个组件都会包含这些状态的某种混合，并且会对全局状态变化做出响应。

### 元素状态

单个元素可以（并且将会）拥有它们自己的状态。在这一层面上，HTML、CSS 和 ARIA 的特性开始显现出来。

*   [光标](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor)状态
    *   `default, pointer, wait, text, move, grab, crosshair, zoom-in, zoom-out`, … 等
    *   自定义光标
*   [IntersectionObserverEntry](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry/isIntersecting)
    *   isIntersecting = true, false
*   层叠上下文
    *   `z-index`
    *   Layer
        *   Root
        *   `::backdrop`
        *   Top
*   属性状态 - 在 HTML 中反映的状态
    *   Visibility = `hidden, visible`
    *   Language = `dir, lang`
    *   Functionaltiy = `contenteditable, draggable, invoketarget`
    *   Display = `inert, open, popover`
    *   Loading = `lazy, eager`
*   [Pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes) states - 在 CSS 中反映的状态
    *   Action = `:hover, :active, :focus, :focus-visible, :focus-within`
    *   Input = `:autofill, :checked, :disabled, :valid, :invalid, :user-valid, :user-invalid, :required`, … 等
    *   Display = `:fullscreen, :modal, :picture-in-picture`
    *   Language = `:dir(), :lang()`
    *   Location = `:link, :visited, :target`, …
    *   Resource = `:playing, :paused` 资源 = `:playing, :paused`
    *   [CustomStateSet](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet) = 自定义状态集合用于网页组件
    *   … etc
*   [ARIA states](https://developer.mozilla.org/en-US/docs/web/Accessibility/ARIA/Attributes) - [user-facing states](https://css-tricks.com/user-facing-state/) reflected in ARIA
    *   `aria-current`
    *   `aria-expanded`
    *   `aria-pressed`
    *   `aria-hidden`
    *   … etc

## 第二方用户（或设备）状态

应用程序的用户及其设备、外围设备和浏览器在最终应用程序的渲染方式上有很大的发言权。这是有意为之，并[内置于网络的基础之中](https://www.w3.org/TR/html-design-principles/#priority-of-constituencies)。

### 语言和本地化

惊喜！并不是所有用户都住在 US-West-2。

*   文本方向 = `ltr, rtl`
*   Writing mode = `horizontal-tb, vertical-lr, vertical-rl`
*   服务器/CDN 的距离（延迟）
*   自动翻译
*   词语很长（例如德语）
*   词语很短（例如：中文）

### 设备限制

用户的设备具有很多变化和定制化，可能是渲染到玻璃时你最大的未知瓶颈。

*   网络连接 = 光纤、电缆、无线网络、5G、4G、3G、“[伪网络](https://web.dev/articles/performance-poor-connectivity#lie-fi)”
*   Viewport = `height, width, initial-scale, horizontal-viewport-segments, vertical-viewport-segments, viewport-segment-width, viewport-segment-height`, …
*   环境常量 = `safe-area-inset-*` , `titlebar-area-*` , `keyboard-inset-*` （例如，[iPhone 刘海](https://css-tricks.com/the-notch-and-css/)，圆角，[已安装应用](https://alistapart.com/article/breaking-out-of-the-box/)）
*   像素密度 = 1x、2x（视网膜）、3x、……等
*   低功耗模式
*   屏幕亮度
*   CPU 速度
*   GPU/dGPU
*   L1/L2/L3 缓存
*   CPU/GPU/内存争用（例如，其他应用程序打开）
*   色域支持 = Rec2020、P3、sRGB……等
*   键盘 = 嵌入式，外接式，[T9](https://en.wikipedia.org/wiki/T9_\(predictive_text\))，虚拟屏幕键盘，触控条，……等
*   XR support = `inline, immersive-vr, immersive-ar`

### 模态

用户在与设备交互时并不统一，他们可能会同时使用一种或多种输入和输出方式。

*   输入
    *   鼠标 = 单键、双键、滚轮、轨迹球、触摸板、高/低 DPI
    *   键盘 = 100%，60%，小键盘，QWERTY，Colemak，人体工学，分体式，机械式，……等
    *   触摸/轻点 = 粗指针，无悬停
    *   触控笔 = 细尖端，悬停，压感
    *   手势 = 捏合缩放，两/三/四指滑动
    *   运动 = 加速度，摇晃撤销，碰撞，等等
    *   方向 = 横向、纵向、alpha/beta/gamma（分别为 360º/180º/90º 旋转）
    *   语音识别 = Dragon NaturallySpeaking，语音助手
    *   开关 = 按钮，轻吸，轻吹
    *   眼动追踪
    *   游戏手柄
    *   XR = 3 DOF, 6 DOF
*   输出
    *   屏幕
    *   文本转语音
    *   屏幕阅读器
    *   盲文
    *   屏幕放大镜
    *   振动
    *   RSS？

### Browser states 浏览器状态

最后，用户的浏览器选择和首选插件在很大程度上决定了他们如何体验（或希望体验）你的 UI，而你的应用程序可以对这些偏好做出响应。

*   用户偏好
    *   prefers-color-scheme = light, dark, forced-colors
    *   prefers-reduced-motion = reduce, no-preference
    *   prefers-reduced-transparency = reduce, no-preference
    *   user zoom = 100% to 400%
    *   text size = small to x-large
*   功能特性
    *   浏览器版本 = 最新版本，最后2个版本，更旧版本
    *   特性检测 = `@support` 或 polyfills
    *   色域支持 = Rec2020、P3、sRGB……等
    *   浏览器缓存命中
    *   Service worker 命中
    *   显示模式 = 全屏 | 独立 | 极简界面 | 浏览器
    *   `beforeinstallprompt`
    *   打印模式
    *   阅读模式
    *   JavaScript 禁用 = 是的，我确实认识这么做的人。
    *   Sleeping tabs
*   权限
    *   Camera = true, false
    *   Microphone = true, false
    *   Geolocation = allowed, not allowed, only while using the app
    *   Notifications = true, false
    *   File access = true, false
*   插件
    *   Ad blockers - UBlock, Safari ITP, Ghostery, … 等
    *   自定义插件 / 提升

### 用户状态

到目前为止，我们讨论了技术，现在让我们考虑交易另一端的实际人类。用户的身体或心理状态影响他们享受你的体验的认知或实际带宽。

*   [遇到紧急情况/危机](https://meyerweb.com/eric/thoughts/2016/01/25/designing-for-crisis-design-for-real-life/)
*   认知障碍
*   永久性或临时性残疾
*   [“Out of spoons”](https://butyoudontlooksick.com/articles/written-by-christine/the-spoon-theory/)
*   内部或外部
*   在飞机或火车上
*   在城市里或者在树林中

## 第三方服务状态

第三方对 UI 的用户体验有着超乎寻常的影响。

### 可用性/状态

其他服务器的状态/可用性/正常运行时间是 UI 最大的故障面。

*   服务器硬件状态 = 在线，离线，部分可用
*   数据库状态 = 在线，离线，事务锁定
*   API 状态 = 在线，离线，部分可用
*   Web 字体服务 = 在线、离线、部分可用
*   DNS 状态 = 可能需要最多 72 小时才能解析
*   包依赖关系 = 正常工作，损坏，恶意注入，抗议软件，等等
*   资产交付和缓存状态
    *   Cloudflare
    *   S3

### 脚本注入

第三方脚本注入是 UI 性能下降的最大原因。有些服务甚至接管了应用程序的用户体验。这通常是你无法控制的。

*   分析/追踪服务
*   用户会话录制服务
*   A/B 测试注入
*   指导性覆层
*   辅助功能覆盖层
*   第三方认证（OAuth）服务
*   验证码/验证服务

你还没真正体验过生活，直到这些未经检查的服务之一拖垮了一个应用程序。

## UI 不仅仅是状态……

我确信我忘记了整个状态类别。我甚至还没有涉及数百个 CSS 属性以及数千个值及其潜在的冲突。我没有谈论设计表单控件的复杂性或者使用所需的 ARIA 属性组合构建下拉菜单。我没有触及[放置页面上图片所需的决策矩阵](https://cloudfour.com/thinks/responsive-images-101-definitions/)。这也没有涉及[按正确顺序设置 `head` 中所有恰当的标签](https://github.com/joshbuchea/HEAD)。这也没有讨论用于 SEO 的[微格式](https://microformats.org/)或者你需要正确设置 UI 以发送分析数据的所有代码。

在结束时，要雇佣擅长 UI 的人。
