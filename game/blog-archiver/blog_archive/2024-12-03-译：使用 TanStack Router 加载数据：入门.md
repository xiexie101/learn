---
title: "译：使用 TanStack Router 加载数据：入门"
date: 2024-12-03
url: https://sorrycc.com/tanstack-router-data-loading-1
---

发布于 2024年12月3日

# 译：使用 TanStack Router 加载数据：入门

> 原文：[https://frontendmasters.com/blog/tanstack-router-data-loading-1/](https://frontendmasters.com/blog/tanstack-router-data-loading-1/)  
> 作者：Adam Rackis  
> 译者：ChatGPT 4 Turbo

[TanStack Router](https://tanstack.com/router/latest) 是当前 Web 开发生态系统中最令人兴奋的项目之一，但它并没有获得足够的关注。这是一个完整的客户端应用程序框架，支持高级路由、嵌套布局，以及用于加载数据的钩子。最棒的是，它做到了这一切同时还具有深度类型安全性。

### [](#article-series)文章系列

1.  [介绍 TanStack Router](https://frontendmasters.com/blog/introducing-tanstack-router/)
2.  [使用 TanStack Router 加载数据：入门](https://frontendmasters.com/blog/tanstack-router-data-loading-1/)
3.  [使用 TanStack Router 加载数据：react-query](https://frontendmasters.com/blog/tanstack-router-data-loading-2/)

这篇文章主要介绍**数据加载**。我们将讨论 TanStack Router 提供的用于加载和废弃数据的内置钩子。然后，我们将探讨如何轻松集成 [TanStack Query](https://tanstack.com/query/latest)（也称为 react-query），并看看每种方式的取舍。

我们所讨论的所有代码都在[这个 GitHub 仓库](https://github.com/arackaf/tanstack-router-loader-demo)中。与之前一样，我正在构建一个极其简朴的，想象中的 Jira 替代品。那个仓库中没有什么有用的东西，除了我们仔细查看数据加载工作原理所需的最低限度的东西。如果你正在构建自己的项目，一定要看看 TanStack Router 的 [DevTools](https://tanstack.com/router/latest/docs/framework/react/devtools)。它们非常出色。

该应用程序确实通过 SQLite 加载实际数据，并带有一些强制延迟，这样我们就可以更清楚地看到（并修复）网络瀑布。如果你想运行该项目，克隆它，运行 `npm i`，然后打开**两个**终端。在第一个终端中，运行 `npm run server`，这将创建 SQLite 数据库，为其填充数据，并设置用于获取和更新数据的 API 端点。在第二个终端中，运行 `npm run dev` 来启动主项目，它将在 `http://localhost:5173/` 上运行。有一些（极其基础的）功能可以编辑数据。如果在任何时候你想重置数据，只需在终端中重置服务器任务。

这个应用是人为设计的。它的存在是为了展示 Router 的能力。我们经常会有一些奇怪的用例，而且坦白说，设计决策有时候令人质疑。这是故意的，为了模拟真实世界的数据加载场景，而不需要一个真实世界的应用程序。

## [](#but-what-about-ssr)但是服务器端渲染（SSR）呢？

Router 本质上是一个客户端框架。有一些钩子可以让 SSR 工作，但它们非常 DIY（自己动手）。如果这让你感到失望，我会敦促你有一点耐心。[TanStack Start](https://tanstack.com/start/latest)（现在处于 Beta 阶段）是一个新项目，无论出于何种目的，它都为同样的 TanStack Router 增加了 SSR 功能。让我特别兴奋的是，TanStack Start 以一种非常非侵入式的方式增加了这些服务器端功能，这不会改变或使我们在这篇文章中（或在我上一篇关于 Router 的文章中谈到的）将要讨论的任何内容失效。如果这不完全清楚，你想了解更多，请敬请期待我未来关于 TanStack Start 的文章。

## [](#the-plan)计划

TanStack Router 是一个完整的应用程序框架。你可以用它来教授一整套课程，而且确实有很多 YouTube 视频。如果我们尝试深入覆盖每一个选项，这个博客将变成一本书。

在这篇文章中，我们将覆盖最相关的功能，并在有用的地方展示代码片段。有关详细信息，请参阅[文档](https://tanstack.com/router/latest/docs/framework/react/overview)。同时也请查看[这篇文章的仓库](https://github.com/arackaf/tanstack-router-loader-demo)，因为我们在这篇文章中使用的所有示例都在那里完整展示。

不要让极其广泛的功能范围吓到你。**绝大多数**情况下，一些基本的加载器就能完全满足你的需要。我们还会讨论一些高级功能，这样你知道它们存在，以防你将来需要它们。

## [](#starting-at-the-top-context)从顶部开始：上下文

当我们创建我们的路由时，我们可以给它“上下文”。这是全局状态。对于我们的项目，我们会传入我们的 `queryClient` 供 react-query 使用（我们稍后会用到）。传入上下文的方式如下：

```typescript
// main.tsx
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

// 导入生成的路由树
import { routeTree } from "./routeTree.gen";

const router = createRouter({ 
  routeTree, 
  context: { queryClient } 
});
```

然后我们将确保路由器能将我们放入上下文中的内容整合到静态类型中。我们通过这样创建我们的根路由来实现：

```typescript
// routes/__root.tsx
export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});
```

这个上下文将对树中的所有路由和像 `loader` 这样的 API 钩子内部可用。

### [](#adding-to-context)添加到上下文中

上下文可以改变。我们在应用程序的根部启动路由器时设置真正的全局上下文，但是路由树中不同的位置可以向上下文添加新内容，这些内容将从那里向下在树中可见。这有两个地方，`beforeLoad` 方法和 `context` 函数。是的：路由可以采用一个修改路由树的上下文 _值_ 的上下文 _函数_。

#### [](#beforeload)beforeLoad

`beforeLoad` 方法 _总是_ 在每次 URL 以任何方式更改时，在每个活动路由上运行。这是检查前提条件和重定向的好地方。如果你从这里返回一个值，那个值将被合并到路由器的上下文中，并且从那个路由向下可见。这个函数 **阻塞** 所有 loader 的运行，所以要 **非常小心** 你在这里做什么。通常应避免数据加载，除非绝对需要，因为任何 loader 都将等待此函数完成，可能创建瀑布效应。

这里是一个要避免的好例子，同时也有机会看到为什么。这个 `beforeLoad` 获取当前用户，将其放入上下文中，并在没有用户时进行重定向。

```typescript
// routes/index.tsx
export const Route = createFileRoute("/")({
  async beforeLoad() {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
    document.cookie = `user=${user.id};path=/;max-age=31536000`;

    return { user };
  },

  // ...
```

我们将会看一下一些数据加载的情况，并测量什么时候开始。你可以进入 `getCurrentUser` 函数并取消那里的人工延迟，看看它如何阻塞 _一切_。如果你正在运行路由器的 DevTools，这一点尤其明显。你会看到这条路径阻塞，只有准备就绪后，才允许所有下面的加载器执行。

但这是一个足够好的例子来展示这是如何工作的。`user` 对象现在处于上下文中，对它下面的路由可见。

一个更现实的例子是检查一个已登录的 cookie，乐观地假设用户已登录，并依赖我们在加载器中进行的网络调用来检测一个已登出的用户，并据此重定向。为了使事情更加现实，这些初始渲染的加载器将在服务器上运行，并在我们向用户展示 _任何东西_ 之前，弄清楚用户是否实际已登出；但这将等待 TanStack Start 上的一个将来的帖子。

我们有的已经足以展示 `beforeLoad` 回调是如何工作的。

#### [](#context-function)上下文（函数）

我们也可以为路由提供一个上下文 `function`。这是一个非异步函数，也给了我们添加到上下文的机会。但是它运行得更加保守。这个函数只在 URL 以与 _该路由_ 相关的方式改变时运行。所以对于一个路由，比如 `app/epics/$epicId`，当 epicId 参数改变时，上下文函数会重新运行。这似乎很奇怪，但它对于修改上下文很有用，但只在路由改变时，特别是当你需要将非原始值（对象和函数）放到上下文上时。这些非原始值总是通过引用进行比较，因此总是与上一次生成的值不同。因此，如果在 `beforeLoad` 中添加，它们会引起渲染更迭，因为 React 会（错误地）认为它需要重新渲染一个路由，当没有任何变化时。

现在，这里有一些代码在我们的根路由中，用来标记初始渲染发生的时间，这样我们可以将其与我们树中各种查询运行的时间戳进行比较。这将帮助我们看到并修复网络瀑布。

```typescript
// routes/__root.tsx
export const Route = createRootRouteWithContext<MyRouterContext>()({
  context({ location }) {
    const timeStarted = +new Date();
    console.log("");
    console.log("Fresh navigation to", location.href);
    console.log("-------------------");

    return { timestarted: timeStarted };
  },

  // ...
```

这段代码位于我们的根路由中，因此，由于根路由不依赖于任何路径参数，它永远不会重新运行。

现在，我们的路由树中的每个地方都会有一个 `timestarted` 值，我们可以使用它来检测树中的数据获取是否有任何延迟。

## 加载器

现在让我们实际加载一些数据。路由器提供了一个 `loader` 函数来做这件事。我们的任何路由配置都可以接受一个加载器函数，我们可以使用它来加载数据。所有加载器都会并行运行。如果布局需要在其下的路径开始之前完成加载其数据，那将会很糟糕。加载器接收路由 URL 上的任何路径参数，路由订阅的任何搜索参数（查询字符串值），上下文和一些其他好处，并加载它需要的任何数据。路由器将检测您返回的内容，并允许组件通过 `useLoaderData` 钩子检索该数据 —— 强类型。

### 路由中的加载器

让我们来看看 tasks.route.tsx。

这是一个路由，将对从 `/app/tasks` 开始的任何 URL 都运行。它将对该路径、对 `/app/tasks/$taskId`、对 `app/tasks/$taskId/edit` 等运行。

```javascript
export const Route = createFileRoute("/app/tasks")({
  component: TasksLayout,
  loader: async ({ context }) => {
    const now = +new Date();
    console.log(`/tasks route loader. Loading task layout info at + ${now - context.timestarted}ms since start`);

    const tasksOverview = await fetchJson<TaskOverview[]>("api/tasks/overview");
    return { tasksOverview };
  },
  gcTime: 1000 * 60 * 5,
  staleTime: 1000 * 60 * 2,
});
```

我们接收上下文，并从中获取 `timestarted` 值。我们请求一些有关我们任务的概述数据，并发送该数据下去。

`gcTime` 属性控制旧路由数据在缓存中保留的时间。因此，如果我们从 tasks 页面浏览到 epics 页面，然后在 5 分钟零 1 秒后返回，那里将什么都没有，页面将重新加载。`staleTime` 控制缓存条目被认为是“新鲜”的时间长短。这决定了是否在后台重新获取缓存数据。这里它被设置为两分钟。这意味着如果用户访问这个页面，然后跳转到 epics 页面，等待 3 分钟，然后返回到 tasks 页面，缓存数据将会显示，同时 tasks 数据在后台被重新获取，并且（如果改变了）更新 UI。

你可能想知道 TanStack 路由器是否会告诉你这个后台重新获取是否正在发生，以便你可以显示一个内联的 spinner，是的，你可以这样检测到：

```javascript
const { isFetching } = Route.useMatch();
```

### [](#loader-in-a-page)页面中的加载器

现在让我们看看 tasks 页面。

```typescript
export const Route = createFileRoute("/app/tasks/")({
  component: Index,
  loader: async ({ context }) => {
    const now = +new Date();
    console.log(`/tasks/index 路径加载器。在开始后 + ${now - context.timestarted}ms 加载 tasks`);

    const tasks = await fetchJson<Task[]>("api/tasks");
    return { tasks };
  },
  gcTime: 1000 * 60 * 5,
  staleTime: 1000 * 60 * 2,
  pendingComponent: () => <div>正在加载任务列表...</div>,
  pendingMs: 150,
  pendingMinMs: 200,
});
```

这是特定 URL `/app/tasks` 的路由。如果用户浏览到 `/app/tasks/$taskId`，那么这个组件不会运行。这是一个特定的页面，不是一个布局（路由器称之为“路由”）。基本上与之前相同，只是现在我们正在加载要在这个页面上显示的任务列表。

这次我们添加了一些新属性。`pendingComponent` 属性允许我们在加载器工作时渲染一些内容。我们还指定了 `pendingMs`，它控制我们在显示等待组件之前的等待时间。最后，`pendingMinMs` 允许我们强制让等待组件在屏幕上停留一段指定的时间，即使数据已经准备好了。这可以用来避免短暂地闪烁加载组件，这对用户来说可能会很突兀。

如果你想知道为什么我们甚至想要使用 `pendingMs` 来延迟加载屏幕，那是因为后续导航。与其从当前页面 _立即_ 跳转到新页面的加载组件，这个设置让我们可以在当前页面停留一会儿，希望新页面能够足够快地准备好，以至于我们根本不需要展示任何 pending 组件。当然，在初始加载时，当 web 应用首次启动时，这些 pendingComponents 会立即显示，正如你所预期的。

让我们运行我们的任务页面。

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/11/img-0-tasks-page.jpg?resize=690%2C1024&ssl=1)

它很丑，坦白说没什么用，但它有效。现在让我们仔细看看。

### [](#loaders-running-in-parallel)并行运行的加载器

如果我们在控制台里偷瞄一下，我们应该会看到类似这样的内容：

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/11/img-1-loaders-parallel.jpg?resize=1024%2C188&ssl=1)

如果你打开了 DevTools，你应该会看到类似下面的内容。注意路由和页面加载并行完成的情况。

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/11/2024-11-17-12.46.15-1.gif?ssl=1)

正如我们所见，这些请求彼此之间仅相隔了一毫秒就开始了，因为加载器在并行运行（由于这不是真正的 Jira，我不得不手动给每个 API 端点添加了 750ms 的延迟）。

#### [](#different-routes-using-the-same-data)不同路由使用相同的数据

如果我们看看 `app/tasks/$taskId` 路由的加载器，以及 `app/tasks/$taskId/edit` 路由的加载器，我们看到相同的 fetch 调用：

```typescript
const task = await fetchJson<Task>(`api/tasks/${taskId}`);
```

这是因为我们需要加载实际任务以便显示它，或者以表单形式显示它，让用户进行更改。不幸的是，如果你点击任何任务的编辑按钮，然后返回到任务列表（不保存任何内容），然后为同一个任务点击编辑按钮，你应该会注意到被请求的数据完全相同。这是有道理的。两个加载器恰好都进行了相同的 `fetch()` 调用，但我们的客户端中没有任何东西可以缓存这个调用。这在 99% 的时间里可能都是没问题的，但这是 react-query 很快为我们改进的众多事情之一。

## 更新数据

如果你点击任何任务的编辑按钮，你应该会被带到一个极其基础的表单页面，让你编辑任务的名称。一旦我们点击保存，我们想要导航回到任务列表，但最重要的是，我们需要告诉路由器我们已经更改了一些数据，并且它需要使一些缓存的条目失效，并且当我们返回那些路由时重新获取。

这就是路由器的内置能力开始被拉伸的地方，也是我们可能开始想要使用 react-query（在这篇文章的第二部分中讨论）的地方。路由器绝对可以让你使路由失效，以强制重新获取。但 API 是相当简单且细粒度的。我们基本上必须描述我们想要使之失效（或移除）的每个路由。让我们来看一下：

```javascript
import { useRouter } from "@tanstack/react-router";

// ...

const router = useRouter();
const save = async () => {
  await postToApi("api/task/update", {
    id: task.id,
    title: newTitleEl.current!.value,
  });

  router.invalidate({
    filter: route => {
      return (
        route.routeId == "/app/tasks/" ||
        (route.routeId === "/app/tasks/$taskId/" && route.params.taskId === taskId) ||
        (route.routeId === "/app/tasks_/$taskId/edit" && route.params.taskId === taskId)
      );
    },
  });

  navigate({ to: "/app/tasks" });
};
```

注意对 `router.invalidate` 的调用。这告诉路由器将任何与该过滤器匹配的缓存条目标记为陈旧，导致我们下次浏览到这些路径时重新获取它们。我们也可以什么都不传给同一个 `invalidate` 方法，这将告诉路由器使 _一切_ 失效。

这里我们使主任务列表失效，以及我们刚刚修改的单个任务的查看和编辑页面。

现在，当我们导航回到主任务页面时，我们会立即看到之前的现在已经陈旧的数据，但新数据将被获取，并在出现时更新 UI。回想一下，我们可以使用 `const { isFetching } = Route.useMatch();` 在这次获取过程中显示一个内联加载器。

如果你希望完全移除缓存条目，并且希望任务页面的“加载”组件显示，那么你可以使用 `router.clearCache`，并且使用相同的筛选参数。这将会 _移除_ 这些缓存条目，迫使路由器完全重新获取它们，并显示等待组件。这是因为缓存中不再有任何陈旧的数据；`clearCache` 已经将其移除。

不过，有一个小警告：路由器会阻止你清除你当前页面的缓存。这意味着我们不能清除编辑任务页面的缓存，因为我们已经在这个页面上了。明确地说，当我们调用 clearCache 时，筛选函数甚至不会查看你当前的路由；简单地说，移除它的能力根本不存在。

相反，你可以这样做：

```javascript
router.clearCache({
  filter: route => {
    return route.routeId == "/app/tasks/" || (route.routeId === "/app/tasks_/$taskId/edit" && route.params.taskId === taskId);
  },
});

router.invalidate({
  filter: route => {
    return route.routeId === "/app/tasks_/$taskId/edit" && route.params.taskId === taskId;
  },
});
```

但实际上，此时你应该考虑使用 react-query，我们将在下一篇文章中介绍。
