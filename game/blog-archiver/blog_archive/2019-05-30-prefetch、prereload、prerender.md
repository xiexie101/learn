---
title: "prefetch、prereload、prerender"
date: 2019-05-30
url: https://sorrycc.com/pre
---

发布于 2019年5月30日

# prefetch、prereload、prerender

经常听到这些名词，花了些时间搞搞明白。

## 介绍

![](https://img.alicdn.com/imgextra/i1/O1CN01E9t5EF1fMO0XVWjWL_!!6000000003992-0-tps-1222-1271.jpg)

先了解上面这张图（[来源](https://docs.google.com/document/d/1bCDuq9H1ih9iNjgzyAL0gpwNFiEP4TZS-YLRp_RuMlc/edit)），了解浏览器对于要加载的资源是有优先级的。

*   preload 优先于 prefetch
*   …

### Preload

Preload 是一种声明式的预加载资源的方式，用于告诉浏览器尽快请求一个**重要**的资源，浏览器会为此分配更高的优先级，但尽量不延迟 window.onload 事件的发生。

使用 preload 有三种方式，

```html
// 1. Html 标签
<link rel="preload" href="/foo.css" as="style" />

// 2. 脚本的方式，动态加载一个 link 标签
<script>
var res = document.createElement("link");
res.rel = "preload";
res.as = "style";
res.href = "/foo.css";
document.head.appendChild(res);
</script>

// 3. HTTP Header
Link: <https://example.com/other/styles.css>; rel=preload; as=style
```

HTTP Header 还可用于 HTTP/2 的 Server Push 的方式。

什么时候用？当资源是当前渲染必须的，但不会第一时间发起请求时，用 preload。比如 CSS 里的字体文件，比如 code-splitting 之后当前路由需要异步加载文件，前者需要先下载 CSS 并解析后才能决定是否加载，后者需要下载 JS、解析、执行之后才能决定是否加载。把这些确定需要的资源文件提前请求，就是 preload 的作用。

preload 了不用在 chrome devtool 里会给出警告，

![](https://img.alicdn.com/imgextra/i4/O1CN0177mfwb1rBBiAYQa6L_!!6000000005592-2-tps-638-174.png)

改 preload 却没有 preload 的资源在 Lighthouse 检测的时候也会给出改进建议，

![](https://img.alicdn.com/imgextra/i3/O1CN01N0XvO51rzZHMq6XtJ_!!6000000005702-2-tps-745-97.png)

### Prefetch

Prefetch 是 [Resouce Hints](https://www.w3.org/TR/resource-hints/) 的一种，也可用于预加载资源。但和 Preload 的区别是，他用于加载**之后可能会用到的**资源，浏览器在空了的时候加载，所以可能加载，也可能不加载。

Resource Hints 里除了 Prefetch，还有 Prerender、Preconnect 和 DNS Prefetch，顾名思义，应该能理解。其中 Prerender 用于预加载 html，并预加载其包含的子资源。

使用方式也有三种，同 Preload。

什么时候用？非重要的的资源，比如下一个页面才需要的，或者用户需要做一些操作之后才需要发起的操作。这些应该走 prefetch，而非 preload，因为 preload 的优先级较高，可能会推迟 window.onload 以及 TTI 的时间。

还有应用场景是基于路由的 Prefetch，比如 [nuxt.js@2.4](https://github.com/nuxt/nuxt.js/releases/tag/v2.4.0) 加的 Smart prefetching，会自动 prefetch 可视区域里的 `<Link>` 指向的路由的资源，相似的实现还有 [quicklink](https://github.com/GoogleChromeLabs/quicklink)。

![](https://img.alicdn.com/imgextra/i4/O1CN01MOF8bY1iOAOUu5p1p_!!6000000004402-1-tps-1200-660.gif)

### Prerender

Prerender 这个名词有些歧义，这里指的是基于 SSR 或其他方案预先提供好 HTML 内容，和前面 Resource Hints 的 Prerender 不是一回事。

实现上有几种思路：

*   基于 SSR，build 跑一遍，为每个路由生成 HTML
*   基于 [react-snap](https://github.com/stereobooster/react-snap) 或 [prerender.io](https://prerender.io/) 等方案，不挑框架，但有一定使用限制，比如对于动态路由的处理

TODO: 待细化。

## 工程化方案

### webpack

webpack 自 4.6 起支持一些针对 preload 和 prefetch 的魔法注释。

```javascript
import(_/* webpackPreload: true */_ "CriticalChunk")
import(_/* webpackPrefetch: true */_ "ImportantForNextPageChunk")
```

4.6 之前则可用 [preload-webpack-plugin](https://github.com/GoogleChromeLabs/preload-webpack-plugin) 实现。

## 参考

### 规范

*   [https://www.w3.org/TR/resource-hints/](https://www.w3.org/TR/resource-hints/)
*   [https://w3c.github.io/preload/](https://w3c.github.io/preload/)

### 文章

*   [Preload, prefetch and other <link> tags: what they do and when to use them · PerfPerfPerf](https://3perf.com/blog/link-rels/)
*   [Resource Fetch Prioritization and Scheduling in Chromium](https://docs.google.com/document/d/1bCDuq9H1ih9iNjgzyAL0gpwNFiEP4TZS-YLRp_RuMlc/edit)
*   [https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf)
*   [https://web.dev/preload-critical-assets](https://web.dev/preload-critical-assets)
*   [https://developers.google.com/web/fundamentals/performance/resource-prioritization](https://developers.google.com/web/fundamentals/performance/resource-prioritization)
*   [https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading\_content](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content)
*   [https://www.cnblogs.com/xiaohuochai/p/9183874.html](https://www.cnblogs.com/xiaohuochai/p/9183874.html)
