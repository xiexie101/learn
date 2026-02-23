---
title: "译：PPR - 预渲染新时代的到来与 SSR & SSG 争论的终结"
date: 2024-07-12
url: https://sorrycc.com/nextjs-partial-pre-rendering
---

发布于 2024年7月12日

# 译：PPR - 预渲染新时代的到来与 SSR & SSG 争论的终结

> 原文：[https://zenn.dev/akfm/articles/nextjs-partial-pre-rendering](https://zenn.dev/akfm/articles/nextjs-partial-pre-rendering)  
> 作者：akfm\_sato  
> 译者：ChatGPT 4 Turbo

**编者注：这是我看过把 PPR 讲地最清楚的一篇文章，我看懂了，你应该也能懂。**

> 本文基于 Next.js v15.0.0-rc.0 的信息编写，并且 PPR 是一个更加 experimental 的功能。请注意，到 v15.0.0 正式发布时或 PPR 成为稳定功能时，部分功能可能会发生改变。

**Partial Pre-Rendering**（以下简称 PPR）是在 Next.js v14.0 中发布的，与 SSR 和 SSG 并列的**新渲染模型**。

[https://nextjs.org/blog/next-14#partial-prerendering-preview](https://nextjs.org/blog/next-14#partial-prerendering-preview)

如前所述，PPR 是一个开发中的功能，在 v15 的 RC 版本中可以通过启用 experimental 标志来使用。==将配置设为 `ppr: true` 表示所有页面都是 PPR 的目标，而 `ppr: "incremental"` 则表示只有设置了 `export const experimental_ppr = true` 的 Route 为 PPR 的目标。==

[https://rc.nextjs.org/docs/app/api-reference/next-config-js/ppr](https://rc.nextjs.org/docs/app/api-reference/next-config-js/ppr)

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: "incremental", // ppr: boolean | "incremental"
  },
};

export default nextConfig;
```

```tsx
// page.tsx（layout.tsx 也可）
export const experimental_ppr = true;

export default function Page() {
  // ...
}
```

PPR 对于 Next.js 核心团队来说也是一个重大的功能开发，个人认为这是一个非常值得关注的话题，但据作者的观察，目前讨论这个主题的人似乎并不多，整体氛围并不算热烈。

作者认为，PPR 将导致渲染模型时代的再一次更新。本文旨在探讨 PPR 是什么，它试图解决什么问题，以及 PPR 时代的到来将带来什么变化。

## 渲染模型的历史回顾

在讨论 PPR 之前，我们先回顾一下到目前为止 Next.js 所支持的渲染模型。到目前为止，Next.js 支持了三种渲染模型：

*   **SSR**：服务器端渲染
*   **SSG**：静态站点生成
*   **ISR**：增量静态再生

接下来，让我们从作者的角度回顾一下这些模型被支持的历史背景。

### Pages Router 时代

Next.js 最初是作为一个能进行 SSR 的 React 框架在 2016/10 发布的。下面是当时 Vercel（前身为 Zeit）的宣布文章。

[https://vercel.com/blog/next](https://vercel.com/blog/next)

自上述 v1 的公告以来，长时间内 Next.js 都是一个用于 SSR 的框架，但在大约 3 年半后的 2019 年，随着 [v9.3](https://nextjs.org/blog/next-9-3) 的发布，SSG 被引入，并且在 [v9.5](https://nextjs.org/blog/next-9-5) 引入了 ISR，Next.js 成为了支持多种渲染模型的框架。

当时，由于 [Gatsby](https://www.gatsbyjs.com/) 的崛起，SSG （静态站点生成）非常受欢迎，而当时只能进行 SSR （服务器端渲染）的 Next.js 似乎有很多用户转向了 Gatsby。从 npm trends 查看，虽然有些难以辨认，但可以看出在 2019 年左右 Gatsby 的受欢迎程度是超过 Next.js 的。

![npm trends](https://res.cloudinary.com/zenn/image/fetch/s--FDZjB1xd--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_1200/https://storage.googleapis.com/zenn-user-upload/deployed-images/fc1d121e85bcbd899b840ca9.png%3Fsha%3Da81730efd767ae163a68917d34eb04e1e811df8b)

实际上，当时我非常喜欢使用 Gatsby。然而，随着 Next.js v9 系列的发布，集成了需求量很大的动态路由和在 Gatsby 上弱势的 TypeScript 支持，以及上述 SSG 和 ISR 的支持，Next.js 突然受到了广泛关注。我认为，这些在 v9 系列中实现的功能，直接促成了 Next.js 今天的流行。

关于是使用 SSR 还是 SSG 的渲染模型讨论，吸引了许多用户的兴趣，Next.js 支持这两种模型的选择，成为支撑其今日人气的重要因素之一。

### App Router 登场以后

到了上述 v9 的时点，Next.js 仅存在所谓的 Pages Router。但在[v13](https://nextjs.org/blog/next-13)发布的 App Router 引入了 RSC（React 服务器组件）、服务器 Actions、多层缓存等多项篇章性质的改变。App Router 在渲染模型方面发生了怎样的变化呢？

简言之，虽然 App Router 基本上**支持 SSR/SSG/ISR 相当的功能**，但在 App Router 的文档中，基本上不再使用 SSR/SSG/ISR 等**术语**。

现在 App Router 不再用 SSR/SSG/ISR 来区分，而是采用了[静态渲染](https://rc.nextjs.org/docs/app/building-your-application/rendering/server-components#static-rendering-default)和[动态渲染](https://rc.nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)这两个概念来解释许多功能。

*   **静态渲染**：对应于传统的 SSG 或 ISR，在 build 时或执行 revalidate 后进行渲染
    *   无 revalidate：相当于 SSG
    *   有 revalidate：相当于 ISR
*   **动态渲染**：对应于传统的 SSR，每次请求时渲染

在 Pages Router 中，是在 build 时通过执行函数来决定使用 SSG 还是 ISR，因此是静态决定的。但在 App Router 中，通过 `revalidatePath` 或 `revalidateTag` 可以动态进行 revalidate，因此 SSG 与 ISR 不再是静态决定的。这或许是不再使用这些术语的原因之一。

另一个可能的原因是，ISR 被评为在 Vercel 以外运行比较困难的功能，因此获得了负面印象。如今，通过 **Cache Handler** 可以选择缓存的持久化位置，相较于 ISR 刚出现时，应该更容易在自托管环境等中运行了。详细信息请参考作者的过去文章。

[https://zenn.dev/akfm/articles/nextjs-cache-handler-redis](https://zenn.dev/akfm/articles/nextjs-cache-handler-redis)

### [](#streaming-ssr)Streaming SSR

App Router 登场时，SSR 在技术上也发生了发展。现在 App Router 的 SSR 支持 **Streaming SSR**。

> Pages Router 曾作为 [v12 的 Alpha 功能](https://nextjs.org/blog/next-12#react-server-components) 实现，但现在已被删除，并不支持 Streaming SSR。

Streaming SSR 允许将页面渲染的部分通过 `<Suspense>` 延迟渲染，随着渲染的完成，结果会逐渐被发送给客户端。

```tsx
import { Suspense } from "react";
import { PostFeed, Weather } from "./Components";

export default function Posts() {
  return (
    <section>
      <Suspense fallback={<p>Loading feed...</p>}>
        <PostFeed />
      </Suspense>
      <Suspense fallback={<p>Loading weather...</p>}>
        <Weather />
      </Suspense>
    </section>
  );
}
```

在上述实现例中，首先显示 `fallback`（`Loading feed…` 或 `Loading weather…`），当服务器端 `<PostFeed>` 或 `<Weather>` 的渲染完成后，渲染结果逐渐发送给客户端，`fallback` 被替换。这是一个**在单个 HTTP 响应中完成**的过程，响应的 HTML 包含 `<PostFeed>` 或 `<Weather>` 的 HTML，从 SEO 角度也进行了优化，这是一个重要特性。

如果您想更详细地了解 Streaming SSR 的机制，推荐阅读 uhyo 先生的文章。

[https://zenn.dev/uhyo/books/rsc-without-nextjs/viewer/streaming-ssr](https://zenn.dev/uhyo/books/rsc-without-nextjs/viewer/streaming-ssr)

## [](#ssg%2Fssr%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E9%9D%99%E7%9A%84%E3%83%BB%E5%8B%95%E7%9A%84%E3%83%87%E3%83%BC%E3%82%BF%E3%81%AE%E6%B7%B7%E5%9C%A8)SSG/SSR 中的静态与动态数据混合

构成页面所需的数据中，可能会混合有静态数据（可缓存）和动态数据（不可缓存）。例如，在电子商务网站中，商品信息本身可以在构建时或每次 revalidate 时获取并缓存，但登录信息无法缓存，需要动态获取。

在这种静态与动态数据混合的情况下，App Router 主要有以下两种实现模式：

*   **SSG+Client fetch**：页面使用 SSG，客户端动态获取数据
*   **Streaming SSR**：利用缓存（[Data Cache](https://nextjs.org/docs/app/building-your-application/caching)）加速静态数据，同时使用 `<Suspense>` 延迟渲染页面的一部分

然而，这两种方法在某些方面有各自的优点和缺点，根据情况选择最佳解决方案会有所不同。因此，讨论和解释这些选择时需要深入理解 SSG 和 Streaming SSR。

我们来简要整理这些优缺点。请注意，TTFB 是 Time to First Bytes 的缩写。

![](https://res.cloudinary.com/sorrycc/image/upload/v1720769831/blog/29i5xink.png)

> App Router 作为 Vercel 或自托管服务器的最基本运营模式，因此省略了“服务器是否需要”的观点。

与常规的 SSR 相比，Streaming SSR 可以改善 TTFB（首字节时间），但是仅返回静态文件的 SSG 显然更有优势。

从实现的角度来看，Client fetch 需要客户端处理和服务器端端点的连接处理（API Routes、tRPC、GraphQL 等），因此作者认为 Streaming SSR 更为简单。另外，Streaming SSR 由于 HTTP 的往返只需一次，因此可以认为动态元素显示的时间会更短，这一点从性能的角度也是值得评价的。

因此，Streaming SSR 虽然拥有许多优势，但无法获得 SSG 所具有的 TTFB 的速度，这是其权衡之处。作为解决这一问题的手段，出现了本文的主题 **PPR**。

## [](https://rc.nextjs.org/learn/dashboard-app/partial-prerendering#what-is-partial-prerendering)PPR 是什么

PPR 是进一步发展的 Streaming SSR 技术，**可以同时进行页面的 static rendering 和部分的 dynamic rendering**。这是一种渲染模型，可以将 SSG/ISR 页面的一部分与 SSR 部分结合起来，或者将 Streaming SSR 的骨架部分转换为 SSG/ISR。官方说明中借用了电商网站商品页面的例子，可以实现如下配置。

![ppr shell](https://res.cloudinary.com/zenn/image/fetch/s--tbcuP5e3--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_1200/https://storage.googleapis.com/zenn-user-upload/deployed-images/6cc068f618fb070762011646.png%3Fsha%3D6d91c621f46a19fe589f47c84ea5199fdb0a7da2)

商品页面整体和导航可静态化进行 static rendering，而购物车或推荐信息等用户各不相同的 UI 部分可以进行 dynamic rendering。当然，商品信息本身可能也会更新，但在这个例子中，假设需要时进行 revalidate。

### [](#%E9%9D%99%E7%9A%84%E5%8C%96%E3%81%A8streaming%E3%83%AC%E3%83%B3%E3%83%80%E3%83%AA%E3%83%B3%E3%82%B0%E3%81%AE%E6%81%A9%E6%81%B5)静态化和 Streaming 渲染的好处

在 Streaming SSR 中，关于 `<Suspense>` 外部，每个请求都会经历如下处理：

1.  执行 Server Components（多级计算的第一阶段）
2.  执行 Client Components（多级计算的第二阶段）
3.  从 1 和 2 的结果（React 树）生成 HTML
4.  将 3 的结果作为响应发送

关于将 Components 的执行称为多级计算，可以参考 uhyo 先生的文章。

[https://zenn.dev/uhyo/articles/react-server-components-multi-stage#一言でreact-server-componentsを理解する](https://zenn.dev/uhyo/articles/react-server-components-multi-stage#%E4%B8%80%E8%A8%80%E3%81%A7react-server-components%E3%82%92%E7%90%86%E8%A7%A3%E3%81%99%E3%82%8B)

PPR 通过在构建时执行 1～3 并进行静态化，使得 Next.js 服务器能够以**更快的响应**发送用于初始显示的 HTML。

### PPR 的行为观察

在 PPR 中延迟 dynamic rendering 部分时，这些部分被称为 **dynamic hole**、async hole 或者简单的 hole。启用 PPR 并实际观察 dynamic hole 替换的情况。

我们根据以下示例代码来观察行为。

```tsx
// app/ppr/page.tsx
import { Suspense } from "react";
import { setTimeout } from "node:timers/promises";

// 📍启用 PPR
export const experimental_ppr = true;

export default function Home() {
  return (
    <main>
      <h1>PPR 页面</h1>
      <Suspense fallback={<>loading...</>}>
        <RandomTodo />
      </Suspense>
    </main>
  );
}

async function RandomTodo() {
  const todoDto: TodoDto = await fetch("https://dummyjson.com/todos/random", {
    // 在 v15.0.0-rc.0 时，默认为 no-store，但不显式指定则不会进行 dynamic rendering
    cache: "no-store",
  }).then((res) => res.json());
  await setTimeout(3000);

  return (
    <>
      <h2>随机 Todo</h2>
      <ul>
        <li>id: {todoDto.id}</li>
        <li>todo: {todoDto.todo}</li>
        <li>completed: {todoDto.completed ? "true" : "false"}</li>
        <li>userId: {todoDto.userId}</li>
      </ul>
    </>
  );
}

type TodoDto = {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
};
```

`<RandomTodo>` 是一个每次请求都会获取随机 TODO 信息的组件。

页面本身 `<Home>` 是静态渲染的，但是因为指定了 API fetch 的 `no-store`，所以 `<RandomTodo>` 会进行动态渲染。此外，由于本次我们想观察 Stream 的情况，因此特意在请求后延迟了 3 秒。

> 虽然不是本次的主题，但在 v15.0.0-rc.0 时，默认的 fetch 是 `no-store`，但**如果不显式指定，则不会进行 dynamic rendering**，因此示例代码中显式指定。同样可以通过使用 [`unstable_noStore`](https://nextjs.org/docs/app/api-reference/functions/unstable_noStore) 等 [dynamic functions](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-functions) 来进行动态渲染。

关于默认规范，已经有[可能在 RC 期间改变](https://x.com/feedthejim/status/1794778189354705190)的暗示。

实际显示画面的情况如下。

_初始显示_  
![stream start](https://res.cloudinary.com/zenn/image/fetch/s--2PGgEyqj--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_1200/https://storage.googleapis.com/zenn-user-upload/deployed-images/978ace959257180f2efac0fe.png%3Fsha%3Dbd99556d92d0b9d182be85899bb4f57e32b1828c)

_约 3 秒后_  
![stream end](https://res.cloudinary.com/zenn/image/fetch/s--NxRy_1Ox--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_1200/https://storage.googleapis.com/zenn-user-upload/deployed-images/0a8f8fe2399f4776965fce2f.png%3Fsha%3D1c264decef63505ebe6fc5911a59d9fdbddbb901)

在初始显示时，会显示 `<Suspense>` 的 `fallback` 指定的 `loading…`，随后被 `<RandomTodo>` 的渲染结果所替换。

如果我们查看 DevTools，可以发现响应在发送初始显示用的 HTML 时，已经暂停了。初始显示时发送的 `<body>` 下的 HTML 如下所示。

```html
<main>
  <h1>PPR Page</h1>
  <!--$?-->
  <template id="B:0"></template>
  loading...
  <!--/$-->
</main>
<script
  src="/_next/static/chunks/webpack-b5d81ab04c5b38dd.js"
  async=""
></script>
```

在 Streaming SSR 中，每次请求时都需要重新计算 `<Home>`，但在 PPR 中，由于静态化，`<Home>` 的渲染只在 build 时或 revalidate 之后发生，每次请求时仅重新计算 `<RandomDo>`。因此，Next.js 服务器可以立即将包含上述 HTML 的静态文件发送给客户端。

动态渲染的 `<RandomTodo>` 之后的 HTML，和 Streaming SSR 一样，渲染完成后才发送。

```html
<div hidden id="S:0">
  <h2>Random Todo</h2>
  <ul>
    <li>
      id:
      <!-- -->
      253
    </li>
    <li>
      todo:
      <!-- -->
      尝试一项新的健身课程，如空中瑜伽或芭蕾
    </li>
    <li>
      completed:
      <!-- -->
      true
    </li>
    <li>
      userId:
      <!-- -->
      21
    </li>
  </ul>
</div>
<script>
  $RC = function (b, c, e) {
    c = document.getElementById(c);
    c.parentNode.removeChild(c);
    var a = document.getElementById(b);
    if (a) {
      b = a.previousSibling;
      if (e) (b.data = "$!"), a.setAttribute("data-dgst", e);
      else {
        e = b.parentNode;
        a = b.nextSibling;
        var f = 0;
        do {
          if (a && 8 === a.nodeType) {
            var d = a.data;
            if ("/$" === d)
              if (0 === f) break;
              else f--;
            else ("$" !== d && "$?" !== d && "$!" !== d) || f++;
          }
          d = a.nextSibling;
          e.removeChild(a);
          a = d;
        } while (a);
        for (; c.firstChild; ) e.insertBefore(c.firstChild, a);
        b.data = "$";
      }
      b._reactRetry && b._reactRetry();
    }
  };
  $RC("B:0", "S:0");
</script>
<script>
  (self.__next_f = self.__next_f || []).push([0]);
  self.__next_f.push([2, null]);
</script>
<script>
  self.__next_f.push([
    1,
    '1:I[4129,[],""]\n3:"$Sreact.suspense"\n5:I[8330,[],""]\n6:I[3533,[],""]\n8:I[6344,[],""]\n9:[]\n',
  ]);
</script>
<script>
  self.__next_f.push([
    1,
    '0:[null,["$","$L1",null,{"buildId":"u-TCHmQLHODl6ILIXZKdy","assetPrefix":"","initialCanonicalUrl":"/ppr","initialTree":["",{"children":["ppr",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],"initialSeedData":["",{"children":["ppr",{"children":["__PAGE__",{},[["$L2",["$","main",null,{"children":[["$","h1",null,{"children":"PPR 页面"}],["$","$3",null,{"fallback":"loading...","children":"$L4"}]]}]],null],null]},["$","$L5",null,{"parallelRouterKey":"children","segmentPath":["children","ppr","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L6",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined","styles":null}],null]},[["$","html",null,{"lang":"en","children":["$","body",null,{"children":["$","$L5",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L6",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: 此页面无法找到。"}],["$","div",null,{"style":{"fontFamily":"system-ui,\\"Segoe UI\\",Roboto,Helvetica,Arial,sans-serif,\\"Apple Color Emoji\\",\\"Segoe UI Emoji\\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"此页面无法找到。"}]}]]}]}]],"notFoundStyles":[],"styles":null}]}]}],null],null],"couldBeIntercepted":false,"initialHead":[false,"$L7"],"globalErrorComponent":"$8","missingSlots":"$W9"}]]\n',
  ]);
</script>
<script>
  self.__next_f.push([
    1,
    'a:"$Sreact.fragment"\n7:["$","$a","yuyzwuCpBYflRRVYLHWqg",{"children":[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"创建 Next 应用"}],["$","meta","3",{"name":"description","content":"由 create next app 生成"}],["$","link","4",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"16x16"}]]}]\n2:null\n',
  ]);
</script>
<script>
  self.__next_f.push([
    1,
    '4:[["$","h2",null,{"children":"随机待办事项"}],["$","ul",null,{"children":[["$","li",null,{"children":["id: ",253]}],["$","li",null,{"children":["待办事项: ","尝试一项新的健身课程，如空中瑜伽或芭蕾"]}],["$","li",null,{"children":["已完成: ","true"]}],["$","li",null,{"children":["用户 ID: ",21]}]]}]]\n',
  ]);
</script>
```

注意应该放在 `<script>` 的 `$RC` 周围。最初发送的 HTML 中的 `<template>` 的 id 是 `B:0`，后来发送的 `<RandomTodo>` 的 HTML 是 `S:0`，它们通过 `$RC("B:0", "S:0")` 进行替换。此外，从 `<script>` 直接描述中也可以看出，这些都是在 **一个 HTTP 响应中完成** 的。

## PPR 考察

我认为您应该大致理解了 PPR 的操作，但实际上我们应该如何看待这个 PPR 呢？了解其功能和了解其角色是两个不同的讨论。我想我自己对 PPR 带来的变化做一些考察。

### 与 SSG+Client fetch/Streaming SSR 的比较

我在 [SSG/SSR 中的静态与动态数据混合](#ssgssr%E5%9C%A8%E9%9D%99%E6%80%81%E4%B8%8E%E5%8A%A8%E6%80%81%E6%95%B0%E6%8D%AE%E6%B7%B7%E5%90%88) 中展示的表格，添加了 PPR 进行比较。

![](https://res.cloudinary.com/sorrycc/image/upload/v1720770950/blog/957tej2h.png)

PPR 能同时获得 SSG+Client fetch 相当的 TTFB 和实现的简单性。虽然 HTML 中包含动态元素，因此不能进行 CDN 缓存，但在其他方面，它结合了 SSG+Client fetch 和 Streaming SSR 的优点。

### PPR 带来的具有 React 特色的设计责任

RSC 之后的 React，包括数据获取在内的服务器侧处理也变成了组件的责任，“需要的事情都封装在组件中”，这种方向性似乎正在变得更加强烈。而设置边界并提升并行性的是 `<Suspense>`。

因此，PPR 允许通过 `<Supense>` 边界切换动态渲染和静态渲染，这非常符合当前 **具有 React 特色的设计**。实际上，使用 PPR 除了前面提到的实验性设置外，**没有必要学习新的 API**，这也是符合具有 React 特色设计的一个佐证。

### SSR/SSG 争论的终结

近来的 Next.js 也因为“需要的事情都封装在组件中”的方向性，减少了按页面单位思考的趋势。当然，基于 Web 的机制，仍然需要根据 URL 来处理，所以无法消除“页面”概念。

然而，就渲染模型而言，并不总是需要页面这个概念。传统上无论是 SSR/SSG/ISR 都需要按页面单位考虑，但 PPR 之后可以基于更细粒度的 `<Suspense>` 边界按 UI 单位思考。这将使“是否应该 SSR 或 SSG”这类争论成为过去，PPR 之后会转变为更细粒度的“**哪里是静态的，哪里是动态的**”讨论。

## PPR 的劣势考察

虽然到目前为止，我像谈论银弹一样谈论 PPR，但 PPR 当然也有需要注意的地方。我想介绍一些我认为的注意点。

### 页面总是 200 状态

由于 PPR 会返回页面的静态部分，因此**页面的 HTTP 状态必定是 200**

这可能在监控方面产生实际影响。首先，如果使用 App Router，基于 Stream 的响应将成为基础，因此仅仅依靠 HTTP 状态进行监控是不完整的。因此，虽然这不仅限于 PPR，但对于使用 App Router 实现的应用程序监控，需要基于个别错误率而非 HTTP 状态进行。

### 如果能通过静态渲染完成，那么这是更好的选择

需要记住的是，PPR 是为需要动态渲染的情况下的优化方案。有人给我发了这样一条评论：

[https://twitter.com/sumiren\_t/status/1793620259586666643](https://twitter.com/sumiren_t/status/1793620259586666643)

> 希望没有人误解成「可以部分静态化 = SSR 和 SG 一样快」（因为我自己以前也有这样的误解）

确实，即使是包含动态渲染的页面，如果使用 PPR，也可以使 TTFB 接近 SSG。然而，性能并不仅仅通过 TTFR 来衡量。例如在 Time to Interactive 方面，PPR 和 SSR 之间的差别并不大，因此，如果整个页面都可以使用 SSG 来实现，那将是更有利的。

虽然 PPR 不是解决性能问题的万能钥匙，但确实有部分性能改进，这可能会让人感到困惑。在 PPR 中，也需要注意，关于性能的讨论应该关注哪些速度指标。

## 感想

我认为 PPR 是在现有的渲染模型中最理想的。当然，背后的实现是非常复杂的，但对我们 Next.js 用户来说，仅需遵循「基础上使用静态渲染，部分使用动态渲染」的规则，这种简单性是一个好处。并且，通过 `<Suspense>` 来定义这一界限的做法，我认为是非常好的。

在 v15 的 GA 时，会宣布 [PPR 的路线图](https://nextjs.org/blog/next-15-rc#incremental-adoption-of-partial-prerendering-experimental)。非常期待 PPR 将来的发展。
