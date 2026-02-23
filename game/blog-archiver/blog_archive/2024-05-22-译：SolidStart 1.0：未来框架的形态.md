---
title: "译：SolidStart 1.0：未来框架的形态"
date: 2024-05-22
url: https://sorrycc.com/solid-start-the-shape-frameworks-to-come
---

发布于 2024年5月22日

# 译：SolidStart 1.0：未来框架的形态

> 原文：[https://www.solidjs.com/blog/solid-start-the-shape-frameworks-to-come](https://www.solidjs.com/blog/solid-start-the-shape-frameworks-to-come)  
> 作者：SolidJS Core  
> 译者：ChatGPT 4O

JavaScript 中服务器渲染的角色正在不断增长。为了追求性能和优化，所有的迹象都指向更多地利用服务器。

同时，很明显，要开始使用这项技术变得越来越不容易。人们已经在 webpack 配置上遇到了足够多的困难。而现在我们需要做更多的工作来在服务器上良好运作。

必须要做点什么，但这必须做得正确。需要一种足够简单的解决方案，让人们可以轻松上手，但又不会过于限制于特定技术。这一解决方案需要吸引所有人，而不是分裂我们不断发展的生态系统。

幸运的是，Vite 2.0 的发布展示了这种方式的可行性，接下来的事情就成了历史……

或者，我希望可以这么说。但事实是，还有很多事情需要弄清楚。多次重写，两个 Beta 阶段，以及大量的学习。三年之后，我们终于迎来了第一个主要版本的发布。

## 什么是 SolidStart？

SolidStart 是一个 JavaScript 框架，设计用于构建 SolidJS 应用并将其部署到各种提供商。这听起来与大多数其他 JavaScript 框架并没有什么不同。但细节决定成败。

### 一切都是 à la carte

SolidStart 首先被设计为一个入门工具。这意味着在不安装任何库的情况下，基本设置就能生成 ~5kb JavaScript 压缩和 GZip 的 Hello World 示例。不想使用额外的库？不用担心，你不必这样做。

SolidStart 的基础并不会将你锁定在任何特定的约定中。采用我们在 SolidStart 中提供的一些约定通常会提供最佳体验，但你不必为不需要的功能付出代价。

### 自带应用路由器

SolidStart 确实有文件系统路由。它使用类似于 Nuxt 的约定，通过 `[]` 传递参数。然而，我们还使用 `()` 来做更多强大的事情，比如路由组、命名索引路由，以及作为一种打破嵌套的方式。基本上，括号内的内容会从匹配中移除，但仍会影响路由结构。

从文件系统获取的配置会传递回应用程序，以用于您选择的路由器中。您可以将 `FileRoutes` 作为组件或常规函数调用，以获取由 SolidStart 生成的配置。

```tsx
import { FileRoutes } from '@solidjs/start/router';
import { Router } from '@solidjs/router';

function App() {
  return (
    <Router>
      <FileRoutes />
    </Router>
  );
}
```

如何配置您的路由？我们的 `route` 导出允许您定义自定义路由配置。我们会自动 `lazy` 包装默认导出的组件，并将其添加到您的配置中的 `component` 属性下。

```js
import { type RouteDefinition } from "@solidjs/router";
import { getStory } from "~/lib/api";

export const route = {
  load({ params }) {
    void getStory(params.id);
  },
  matchFilters: {
    id: /^\d+$/ // 仅允许数字
  }
} satisfies RouteDefinition;

export default function MyRouteComponent() {}
```

您可以设置自己的类型并使用您选择的路由器，根据您的项目需要进行配置。

### 服务器增强（这里没有重写）

SolidStart 最初是作为“单页应用程序”构建的。每个功能都设计为与您已经使用的所有库一起工作。为此，我们需要仔细考虑如何添加仅限服务器的功能。

这促使我们在 [2022 年初](https://www.youtube.com/watch?v=G5vwaoXck_g) 开创了“服务器函数”，这一功能后来被引入到几个[流行](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)的[框架](https://qwik.dev/docs/server$/)中。

通过在函数中添加 `"use server";`，它只在服务器上执行，可以自然地在服务器上调用或作为客户端的 RPC 使用。从 TypeScript 的角度来看，服务器函数是透明的，并且可以融入您现有的 API，例如 Tanstack Query 中的 fetchers。

```js
import { createQuery } from "@tanstack/solid-query"

function Posts() {
  const query = createQuery(() => {
    queryKey: ["posts"],
    queryFn: async () => {
      "use server";
      const evt = getRequestEvent();
      if (!evt.locals.userId)
        throw new Error("未登录");

      const posts = await db.posts.getMany({
        where: { userId: evt.locals.userId }
      })
      return posts;
    }
  });

  return /* ... */
}
```

这样一来，在服务器和客户端进行初始 SSR 或未来导航时，一切都会按预期工作。无论是获取数据还是进行变更。甚至在浏览器中纯粹进行客户端渲染时也是如此。

我们的服务器功能支持高级序列化，例如异步迭代器、流和 Promise，确保您可以构建所需的 API。

我们利用这一功能通过 Solid Router 的 API 实现了单次飞行变更，这使得服务器可以在更新后开始获取下一页的数据并在同一响应中流式传输回来，而客户端则处理重定向。借助这种方法、并行化加载/缓存模式和 Solid 的非阻塞异步，我们几乎消除了不必要的瀑布流。

您可以在我们的[笔记示例](https://github.com/solidjs/solid-start/tree/main/examples/notes)中看到这一点。

## 向前进

老实说，SolidStart 有太多功能可以谈论，因为您的体验完全取决于您自己。客户端渲染模式、服务器端渲染、静态站点生成、无序流式传输、乐观 UI、基于键的缓存/失效、渐进增强表单、API 路由、并行嵌套路由数据获取、单次飞行变更、Islands（实验性）、Suspense、过渡。这个列表还在继续。

这是一个为构建者和有自己想法的人设计的框架。我们才刚刚开始挖掘其潜力。这就是我们所说的“未来框架的形态”的含义。SolidStart 不会是最后一个 Solid 框架。我们才刚刚开始。我们已经看到有人在其上构建了像 CreateJDApp 和 MediaKit 这样的元框架。

我们（核心团队）对此感激不尽。感谢所有提交问题和 PR 的贡献者。感谢像 Vite、Vinxi 和 Nitro 这样的开源项目，让这一切在技术上成为可能。感谢所有提供资金支持的赞助商，如 Netlify、Google Chrome 和 JetBrains。最重要的是，我们感谢所有支持开源开发、选择更好的而非方便的、并在这段旅程中与我们同行的每一个人。你们激励我们不断构建最好的解决方案，并继续塑造 web 开发的未来。

感谢 Theo Browne、Erik Demaine、Dev Agrawal 和 bigmistqke 审阅这篇文章，并感谢 Dev Agrawal 提供单次飞行变更图片。

视频版：
