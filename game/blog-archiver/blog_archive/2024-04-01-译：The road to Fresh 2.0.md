---
title: "译：The road to Fresh 2.0"
date: 2024-04-01
url: https://sorrycc.com/the-road-to-fresh-2.0
---

发布于 2024年4月1日

# 译：The road to Fresh 2.0

> 原文：[https://github.com/denoland/fresh/issues/2363](https://github.com/denoland/fresh/issues/2363)  
> 作者：Marvin Hagemeister  
> 译者：ChatGPT 4 Turbo

_**简而言之：** Fresh 将通过即将到来的 2.0 版本通过 JSR 进行大幅简化和分发。Express/Hono 式 API 以及真正的异步组件等等。_

* * *

## 回到 Fresh!

从昨天开始，我又重新回到了 Fresh 的工作上。在过去的几个月里，我帮忙发布了 [https://jsr.io/](https://jsr.io/)，这意味着 Fresh 对我来说暂时处于次要地位。诚然，我也需要从 Fresh 中稍微休息一下，JSR 的出现正是时候。

在 JSR 上的工作让我有机会坐到用户的位置上，亲自体验 Fresh 作为用户是什么感觉，这是一个很好的转变！它也揭示了很多地方，我认为我们可以使 Fresh 变得更好。

JSR 发布了，接下来的任务是将 Fresh 从 `deno.land/x` 迁移到 JSR。考虑到这有点破坏性变化，[@lucacasonato](https://github.com/lucacasonato) 和我在考虑潜在的 Fresh 2.0 版本可能是什么样子的。

我们以前从未做过破坏性的 Fresh 发布，但现在，在近一年的时间里致力于 Fresh 之后，时机感觉很对。它让我们有机会重新审视 Fresh 中的所有想法，并与那些没能成型的想法告别。

昨天上午，我们通过查看 Discord 和我们的问题追踪器中人们分享的最常见问题，以对 Fresh 的现状有一个良好的了解。我们希望的 Fresh 2 的整体主题是比以前大大简化。

## 新的插件 API

很明显，许多问题都与当前插件 API 的“笨重”有关。这是扩展 Fresh 本身功能的最常见方式，这些功能它没有预置。虽然它随着时间推移收到了许多很酷的新特性，但它从未像它应该的那样感觉优雅。这并不奇怪，因为 Fresh 本身没有使用它。

去年七月，有一些探索使 Fresh 的 API 更加类似于 Express/Hono [#1487](https://github.com/denoland/fresh/issues/1487)，昨天我们意识到这是几乎所有当前插件 API 遇到的问题的完美解决方案。以下是我们设想它会是什么样子：

```ts
const app = new FreshApp();

// 自定义中间件
app.use(ctx => {
  console.log(`这里有一个很酷的请求：${ctx.url}`)
  return ctx.next();
});

// 也可以通过 HTTP 方法进行分支处理
app.get(ctx => {
  return new Response("它工作了！")
});

// 添加一个组件（确切的函数签名尚待确定）
app.addIsland(...)

// 最后，启动应用
await app.listen();
```

Fresh 插件将从今天的复杂对象变为仅仅是一个标准的 JavaScript 函数：

```ts
function disallowFoo(app: App) {
  let counter = 0;

  // 当路由含有单词 "foo" 时重定向到 /
  app.use((ctx) => {
    if (ctx.url.pathname.includes("foo")) {
      counter++;
      return ctx.redirect("/");
    }

    return ctx.next();
  });

  // 添加一个路由用于展示我们重定向了多少次
  app.get("/counter", () => {
    const msg = `Foo 重定向计数器：${counter}`;
    return new Response(msg);
  });
}

// 使用方法
const app = new FreshApp();

// 添加插件是一个标准的函数调用
disallowFoo(app);

await app.listen();
```

这种 API 的美妙之处在于，Fresh 中的许多特性只是标准的中间件，而更复杂的功能，如我们的文件系统路由器和中间件处理器，只需要在 `app` 上调用方法即可。Fresh 的内部实现与任何其他插件或中间件的实现方式完全一样。这消除了当前的插件 API 和今天 Fresh 内部实现之间的不匹配。

## 更简单的中间件签名

Fresh 中当前的中间件签名有两个函数参数：

```ts
type Middleware = (req: Request, ctx: FreshContext) => Promise<Response>;
```

在我们的代码中，我们注意到我们很少需要访问 `Request` 对象。所以我们的大部分中间件都跳过它：

```ts
// 我们不需要 _req，但仍然需要定义它...
const foo = (_req: Request, ctx: FreshContext) => {
  // 在这里做些事情
  const exists = doSomething();
  if (!exists) {
    return ctx.renderNotFound();
  }

  // 响应
  return ctx.next();
};
```

它是一件小事，但每次都得绕过 `req` 参数，有点烦人。在 Fresh 2.0 中，我们打算将它移到上下文对象中。

```ts
// Fresh 1.x
const foo = (req: Request, ctx: FreshContext) => new Response("hello");

// Fresh 2.0
const foo = (ctx: FreshContext) => new Response("hello");
```

## 同步和异步路由使用相同的参数

最初，我是按照中间件签名来设计异步路由的。这就是为什么它们需要两个参数：

```ts
export default async function Page(req: Request, ctx: RouteContext) {
  // ...
}
```

回顾过去，我认为这是一个错误。通常会发生的情况是，大家倾向于从一个同步路由开始，然后添加 `async` 关键字使其异步化。但在 Fresh 1.x 中这不可行。

```ts
// 用户从同步路由开始
export default function Page(props: PageProps) {
  // ...
}

// 后来他们想要使其异步化，但这
// 在 Fresh 1.x 中会出问题 :S
export default async function Page(props: PageProps) {
  // ...
}
```

所以，我们将会改正这一点。在 Fresh 2.0 中，它将如预期般工作。

```ts
// 同步路由与 Fresh 1.x 相同
export default function Page(props: PageProps) {
  // ...
}

// Fresh 2.0 中的异步路由
export default async function Page(props: PageProps) {
  // ...
}
```

## 真正的异步服务器端组件

事实上，Fresh 1.x 中的异步路由组件有点像是个美丽的谎言。在内部，它们不是组件，而是一个普通函数，恰好可以返回 JSX。我们取得返回的 JSX 并将其传递给 Preact 进行渲染，仅此而已。这种方法的缺点是，因为它不是在组件上下文中执行的，所以 hooks 在异步函数内部不起作用。实际上，Fresh 1.x 中的异步路由是在实际渲染开始之前调用的。

```ts
// Fresh 1.x 异步路由
export default async function Page(req: Request, ctx: RouteContext) {
  // 这会出问题，因为这个函数在 Fresh 1.x 中不是一个组件，
  // 而是被当作一个恰好返回 JSX 的函数处理
  const value = useContext(MyContext);
  // ...
}
```

你可能在想我们为什么采用这种方法，主要原因是那时 Preact 还不支持异步组件的渲染。这是快速获得异步组件大部分好处的方法，尽管有一些妥协。

好消息是，Preact 最近增加了在服务器上渲染异步组件的支持。这意味着我们终于可以放弃我们的变通方法，开始支持原生渲染异步组件。

```ts
// Fresh 2.x 的异步组件可以正常工作
export default async function Page(ctx: FreshContext) {
  // 在 Fresh 2.0 中按预期工作
  const value = useContext(MyContext);
  // ...
}
```

这不仅限于路由组件。除了岛屿（islands）或用于岛屿内的组件外，任何服务器上的组件都可以是异步的。岛屿中的组件不能是异步的，因为岛屿也在浏览器中渲染，而 Preact 在那里不支持异步组件。考虑到渲染在客户端要复杂得多，主要是因为它几乎都要处理更新，这在服务器上并不是问题，所以不太可能在近期内支持。

## 更简单的错误响应

Fresh 1.x 允许你在路由文件夹的顶层定义一个 `_500.tsx` 和一个 `_404.tsx` 模板。这允许你在发生错误时渲染不同的模板。但这有一个问题：如果抛出的错误状态码不是 `500` 或 `404`，你想显示一个错误页面怎么办？

我们总是可以在 Fresh 中增加对更多错误模板的支持，但归根结底问题在于 Fresh 代替使用 Fresh 的开发者做出选择。

所以在 Fresh 2.0 中，这两个模板将合并为一个 `_error.tsx` 模板。

```bash
# Fresh 1.x
routes/
   ├── _500.tsx
   ├── _404.tsx
   └── ...

# Fresh 2.0
routes/
   ├── _error.tsx
   └── ...
```

然后在 `_error.tsx` 模板中，你可以根据错误代码进行分支，如果需要的话，渲染不同的内容：

```tsx
export default function ErrorPage(ctx: FreshContext) {
  // 准确的签名有待确定，但是状态码
  // 会存在于 "ctx" 中的某处
  const status = ctx.error.status;

  if (status === 404) {
    return <h1>这不是你要找的页面</h1>;
  } else {
    return <h1>抱歉 - 发生了其他错误！</h1>;
  }
}
```

有了一个统一的错误模板处理方式，这样就大大简化了其部署。如此一来，你可以在应用的不同部分使用不同的错误模板。

```bash
# Fresh 2.0
routes/
  ├── admin/
  │   ├── _error.tsx # 管理员路由下的不同错误页面
  │   └── ...
  │
  ├── _error.tsx # 其他地方的错误模板
  └── ...
```

## 从处理程序中添加 `<head>` 元素

尽管 Fresh 2.0 初始版本还未准备好，我们计划令 Fresh 的核心支持流渲染，从而服务器与客户端能够并行加载数据。再次说明，这不会是 2.0 初始版本的一部分，但可能在今年晚些时候推出。不过，在我们甚至探索这一路径之前，需要对 Fresh 如何工作进行一些变更。

在流渲染中，HTML 文档的 `<head>` 部分将尽可能早地刷新到浏览器。这破坏了当前的 `<Head>` 组件，该组件允许你从组件树的任何其他位置添加额外的元素到 `<head>` 标签中。当调用 `<Head>` 组件时，文档的实际 `<head>` 部分早已被刷新到浏览器。服务器上不再有我们可以修改的 head 部分了。

因此，在 Fresh 2.0 中，我们将移除 `<Head>` 组件，转而使用一种新的方式从路由处理程序中添加元素。

```ts
// Fresh 2.0
export const handlers = defineHandlers({
  GET(ctx) {
    const user = await loadUser();

    // Fresh 2.0 中的处理程序允许你返回
    // `Response` 实例，或像这里一样的简单对象
    return {
      // 将传递给组件的 `props.data`
      data: { name: user.name },
      // 向 `<head>` 传递额外的元素
      head: [
        { title: "我的酷炫页面" },
        { name: "description", content: "这是一个非常酷炫的页面！" },
        // ...
      ],
    };
  },
});

export default defineRoute<typeof handlers>(async (props) => {
  return <h1>用户名称: {props.data.name}</h1>;
});
```

编辑：在这里列出的 API 中，这个 API 最不成熟，可能会变动。我们的主要目标是摆脱 `<Head>` 组件。

## 附录

这些是我们为 Fresh 2 计划的重大变更。尽管其中一些是重大变更，但将 Fresh 1.x 项目更新到 Fresh 2 应该相当顺利。虽然这是一个相当长的大功能列表，但我昨天和今天一直在努力研究它，并且进展比我预期的要快。大部分功能已经在一个分支中实现了，但许多事情仍在变动中。它还欠缺相当多的润色。在接下来的几周内，`main` 分支可能会有一些较大的变动。

现在尝试还为时过早，但不久将有更新。一旦实际发布日期临近，我们也将着手增加一篇全面的迁移文档。鉴于目前还处于早期阶段，而且我昨天才刚开始重新工作在 Fresh 上，这些东西还不存在。这里列出的一些特性的详情及其实现方式可能会发生变化，但我认为大体框架已经相当稳固了。

我对这次发布感到非常兴奋，因为它解决了许多长期存在的问题，并大幅改善了整体 API。早期原型的试玩也让它使用起来更加有趣。我希望你对这次发布同样感到兴奋。
