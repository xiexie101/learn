---
title: "475 - 《视频笔记：初见 TanStack Start》"
date: 2024-10-22
url: https://sorrycc.com/glimpse-of-tanstack-start
---

发布于 2024年10月22日

# 475 - 《视频笔记：初见 TanStack Start》

> 本文为视频 [https://www.youtube.com/watch?v=AuHqwQsf64o](https://www.youtube.com/watch?v=AuHqwQsf64o) 的阅读笔记，感觉这是这个会上唯一值得一看的视频。

1、现在框架大多 server 优先，以至于我们都快要忘记 client 优先的简单性，大多项目可能并不需要 server 优先及其带来的复杂性。

2、Tanstack Start 的 mission 是：提供最佳的 client side 开发体验。然后基于此，渐进式提供 DX、Performance 和 Server 的能力。

3、Routing、Caching、Type Safety，这三个是很多框架没有重视的能力，但他们很重要。Caching 深度影响 Performance，Type Safety 提升 DX。

4、Tanstack Router 为了不和 Tanstack Query 捆绑，内置了一个 mini 版的 Tanstack Query，约原 Tanstack Query 5% 的大小，所以可以直接做 SWR StaleTime/GcTime、Preloading（Auto/Manual）、Grranualr Invalidation，这也是大部分框架没有做的。这带来的效果是瞬时的页面切换。

5、组合 Tanstack Query 使用则可以带来更强大的能力，特别是 useSuspenseQuery，用于和 SSR 使用时同构获取数据。Server 用 useSuspenseQuery 获取数据，Client 会流式地 fallback 和填充数据。

```ts
const { data } = useSuspenseQuery({ queryKey: ['search', term], queryFn: foo(term) })
```

6、对于 critical data，可以在 loader 里 await，这样等路由渲染出来数据也就有了；反之，如果想不等 data 而是尽快渲染路由组件，可以在 loader 里做 queryClient.prefetchQuery，不加 await 。

7、tanstack start 的含量里，90% 是 tanstack router，剩下的是可选的 tanstack query 做 data loader，以及 server。

8、server 基于 vinxi 实现，full stack framework toolkit，基于 Nitro，通用可部署的 server toolkit，基于 Vite。基于此，可以快速搭建一个框架，使之 streaming、bundling、deployment 到大部分的服务商。同时还有 api routes 的能力。

9、server (rpc) functions。server functions, middlewares…

参考：  
[An Early Glimpse of TanStack Start - YouTube](https://www.youtube.com/watch?v=AuHqwQsf64o)  
[465 - 《TanStack Start》](https://sorrycc.com/tanstack-start)  
[译：TanStack 的虚拟文件路由](https://sorrycc.com/virtual-file-routes)  
[译：TanStack Router 介绍](https://sorrycc.com/introducing-tanstack-router)
