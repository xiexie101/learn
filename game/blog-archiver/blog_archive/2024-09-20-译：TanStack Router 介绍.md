---
title: "译：TanStack Router 介绍"
date: 2024-09-20
url: https://sorrycc.com/introducing-tanstack-router
---

发布于 2024年9月20日

# 译：TanStack Router 介绍

> 原文：[https://frontendmasters.com/blog/introducing-tanstack-router/](https://frontendmasters.com/blog/introducing-tanstack-router/)  
> 作者：Adam Rackis  
> 译者：ChatGPT 4 Turbo

[TanStack Router](https://tanstack.com/router/latest) 是一个无比令人激动的项目。本质上，它是一个功能齐全的\_客户端\_ JavaScript 应用程序框架。它提供了成熟的路由和导航系统，拥有嵌套布局以及在路由树的每一个节点上高效的数据加载能力。最棒的是，它所有这些功能都是以\_类型安全\_的方式实现的。

特别令人兴奋的是，截至目前，正在开发一个 [TanStack Start](https://tanstack.com/start/latest)，它将为 Router 添加服务器端功能，使您能够构建全栈 Web 应用程序。Start 承诺将通过直接在同一个 TanStack Router 顶层应用一个服务器层来实现这一点。这使现在成为了认识 Router 的完美时机，如果您尚未了解的话。

TanStack Router 不仅仅是一个路由器 — 它是一个成熟的客户端应用程序框架。所以为了防止这篇文章变得太长，我们不会尝试涵盖所有内容。我们将限制自己讨论路由和导航，这是一个比你可能想象的更大的主题，特别是考虑到 Router 的类型安全性。

## [](#getting-started)入门

有 [官方的 TanStack Router 文档](https://tanstack.com/router/latest/docs/framework/react/overview) 和 [一个快速开始指南](https://tanstack.com/router/v1/docs/framework/react/quick-start)，它提供了一个很好的工具来搭建一个全新的 Router 项目。您也可以克隆[用于本文的仓库](https://github.com/arackaf/tanstack-router-routing-demo)并跟随进行。

## [](#the-plan)计划

为了了解 Router 能做什么以及它是如何工作的，我们将假设构建一个任务管理系统，如 Jira。就像真正的 Jira 一样，我们不会努力使事物看起来很好或令人愉悦。我们的目标是看看 Router 能做什么，而不是构建一个有用的 Web 应用程序。

我们将涵盖：路由、布局、路径、搜索参数，当然还有一路上的静态类型。

让我们从最顶部开始。

## [](#the-root-route)根路由

这是我们的根布局，Router 称之为 `__root.tsx`。如果你在跟着做自己的项目，这个文件将直接放在 `routes` 文件夹下。

```javascript
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <div>
          <Link to="/">
            首页
          </Link>
          <Link to="/tasks">
            任务
          </Link>
          <Link to="/epics">
            史诗
          </Link>
        </div>
        <hr />
        <div>
          <Outlet />
        </div>
      </>
    );
  },
});
```

`createRootRoute` 函数的作用正如其名。`<Link />` 组件也相当直观（它用来创建链接）。Router 非常贴心地为当前活跃的链接添加了 `active` 类，这使得根据当前状态来设定样式变得非常简单（还添加了适当的 `aria-current="page"` 属性/值）。最后，`<Outlet />` 组件比较有意思：这是我们告诉 Router 在这个布局中渲染“内容”的方式。

## [](#running-the-app)运行应用

我们通过 `npm run dev` 来运行我们的应用。检查你的终端，看看它在 `localhost` 的哪个端口上运行。

更重要的是，`dev` 监视进程会监控我们将要添加的路由，并维护一个 `routeTree.gen.ts` 文件。这通过同步我们路由的元数据来帮助构建静态类型，这将帮助我们安全地与我们的路由一起工作。说到这，如果你是从头开始构建这个项目的 [从我们的演示仓库](https://github.com/arackaf/tanstack-router-routing-demo)，你可能已经注意到了我们 Link 标签上的一些 TypeScript 错误，因为这些 URL 还不存在。没错：**TanStack Router 深入集成了 TypeScript 到路由级别，并且甚至会验证你的 Link 标签是否指向了一个有效的位置。**

需要明确的是，这并不是因为任何编辑器插件。TypeScript 集成本身就在产生错误，就像在你的 CI/CD 系统中一样。

```ts
src/routes/\_\_root.tsx:8:17 - 错误 TS2322: 类型 '"/"' 不能赋给类型 '"." | ".." | undefined'。
```

```xml
<Link to="/" className="[&.active]:font-bold">
```

## 构建应用

让我们开始添加我们的根页面。在 Router 中，我们使用文件 `index.tsx` 来表示根 `/` 路径，无论我们位于路由树的哪里（我们将很快解释）。我们将创建 `index.tsx`，假设你正在运行 `dev` 任务，它应该为你生成一些如下所示的代码：

```javascript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => <div>Hello /!</div>,
});
```

与你可能习惯的像 Next 或 SvelteKit 这样的元框架相比，这里有一些更多的样板代码。在这些框架中，你只需 `export default` 一个 React 组件，或者直接放下一个普通的 Svelte 组件，一切就\_自动工作\_了。在 TanStack Router 中，我们必须调用一个叫做 `createFileRoute` 的函数，并传入我们所在的路由。

路由对于 Router 的类型安全是必要的，但是不用担心，**你不必自己管理这个。** 开发过程不仅为新文件生成像这样的代码，它还会为你同步保持这些路径值。尝试一下 —— 将该路径更改为其他路径，并保存文件；它应该会立刻为你改回来。或者创建一个名为 `junk` 的文件夹并将其拖动到那里：路径应该更改为 `"/junk/"`。

让我们在将其移出 junk 文件夹后添加以下内容。

```javascript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div>
      <h3>顶级索引页面</h3>
    </div>
  );
}
```

简单且朴素 —— 只是一个组件告诉我们我们在顶级索引页面。

## 路由

让我们开始创建一些实际的路由。我们的根布局表明我们想要处理任务和史诗的路径。Router（默认情况下）使用基于文件的路由，但提供了两种方式来实现，这两种方式可以混合匹配（我们将看到两者）。你可以将文件堆叠到与你正在浏览的路径匹配的文件夹中。或者你可以使用“平面路由”，并在单个文件名中指示这些路由层次结构，用点分隔路径。如果你认为只有前者有用，敬请期待。

为了娱乐，我们先从扁平路由开始。让我们创建一个 `tasks.index.tsx` 文件。这和在一个假想的 `tasks` 文件夹内创建一个 `index.tsx` 是一样的。对于内容，我们将添加一些基本的标记（我们尝试看看路由器是如何工作的，而不是构建一个实际的待办事项应用）。

```javascript
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks/")({
  component: Index,
});

function Index() {
  const tasks = [
    { id: "1", title: "任务 1" },
    { id: "2", title: "任务 2" },
    { id: "3", title: "任务 3" },
  ];

  return (
    <div>
      <h3>任务页面！</h3>
      <div>
        {tasks.map((t, idx) => (
          <div key={idx}>
            <div>{t.title}</div>
            <Link to="/tasks/$taskId" params={{ taskId: t.id }}>
              查看
            </Link>
            <Link to="/tasks/$taskId/edit" params={{ taskId: t.id }}>
              编辑
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
```

在我们继续之前，让我们为所有的任务路由添加一个布局文件，放置一些所有路由到 `/tasks` 下的页面都会出现的公共内容。如果我们有一个 `tasks` 文件夹，我们就会在里面添加一个 `route.tsx` 文件。相反，我们将添加一个 `tasks.route.tsx` 文件。由于我们这里使用的是扁平文件，我们也可以直接命名为 `tasks.tsx`。但我喜欢保持与目录基础文件一致（我们稍后会看到），所以我更喜欢 `tasks.route.tsx`。

```javascript
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks")({
  component: () => (
    <div>
      任务布局 <Outlet />
    </div>
  ),
});
```

像往常一样，不要忘记 `<Outlet />`，否则该路径的实际内容将不会渲染。

重复一遍，`xyz.route.tsx` 是一个为整个路由渲染的组件，一直到底。它本质上是一个布局，但路由器称它们为路由。而 `xyz.index.tsx` 是 `xyz` 处单独路径的文件。

这里有内容呈现。没有太多东西可看，但是在我们做出一个有趣的改动之前，快速浏览一下。

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/09/tasks-page.jpg?resize=398%2C470&ssl=1)

注意位于最顶端的根布局导航链接。下面，我们看到了 `Tasks layout`，来自 tasks 路由文件（本质上是一个布局）。再下面，我们有我们任务页面的内容。

## [](#path-parameters)路径参数

`<Link>` 标签在 tasks 索引文件中透露了我们的目的地，但让我们构建查看和编辑任务的路径。我们将创建 `/tasks/123` 和 `/tasks/123/edit` 路径，当然 `123` 代表的是任何 `taskId`。

TanStack 路由器将路径中的变量表示为路径参数，它们表示为以美元符号开始的路径段。因此，我们将添加 `tasks.$taskId.index.tsx` 和 `tasks.$taskId.edit.tsx`。前者将路由到 `/tasks/123`，后者将路由到 `/tasks/123/edit`。让我们来看看 `tasks.$taskId.index.tsx`，并找出我们实际上是如何获取传入的路径参数的。

```javascript
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks/$taskId/")({
  component: () => {
    const { taskId } = Route.useParams();

    return (
      <div>
        <div>
          <Link to="/tasks">Back</Link>
        </div>
        <div>查看任务 {taskId}</div>
      </div>
    );
  },
});
```

存在于我们路由对象上的 `Route.useParams()` 对象返回我们的参数。但这本身并不有趣；每个路由框架都有类似的东西。特别引人注目的是，这里是静态类型的。路由器足够智能以知道该路由（包括从更高级别的路由中的参数，我们稍后会看到）存在哪些参数。这意味着我们不仅得到自动完成…

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/09/path-param-auto-complete.jpg?resize=1024%2C567&ssl=1)

但如果你在那里放了一个无效的路径参数，你会得到一个 TypeScript 错误。

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/09/parath-param-typed.jpg?resize=1024%2C372&ssl=1)

我们在使用 Link 标签导航到这些路由时也看到了这一点。

```javascript
<Link to="/tasks/$taskId" params={{ taskId: t.id }}>
```

如果我们在这里没有加上 params（或指定任何除 `taskId` 之外的东西），我们会收到一个错误。

## [](#advanced-routing)高级路由

让我们开始依靠 Router 的高级路由规则（稍微一点）并看看它支持的一些好功能。我要强调，这些是你不会常用到的高级功能，但知道它们存在是很好的。

编辑任务路由本质上是相同的，除了路径不同，我把文本改成了“Edit”而不是“View”。但让我们使用这个路由来探索一个我们还没见过的 TanStack Router 功能。

从概念上讲，我们有两个层次：我们有 URL 路径，我们有组件树。到目前为止，这些东西都是 1:1 对应的。URL 路径：

```ts
/tasks/123/edit
```

渲染：

```ts
root route -> tasks route layout -> edit task path
```

URL 层次结构和组件层次结构完美对齐。但它们并不必须这样。

只是为了好玩，看看我们如何能从编辑任务路由中移除主任务布局文件。所以我们希望 `/tasks/123/edit` URL 渲染相同的东西，但**不**渲染 `tasks.route.tsx` 路由文件。为此，我们只需将 `tasks.$taskId.edit.tsx` 重命名为 `tasks_.$taskId.edit.tsx`。

注意 `tasks` 变成了 `tasks_`。我们确实需要将 `tasks` 放在那里，它所处的位置，这样 Router 就会知道最终如何找到我们正在渲染的 `edit.tsx` 文件，**基于 URL**。但通过将其命名为 `tasks_`，我们从渲染的组件树中移除了该**组件**，尽管 `tasks` 仍然在 URL 中。现在当我们渲染编辑任务路由时，我们得到这个：

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/09/edit-task-without-tasks-layout.jpg?resize=722%2C390&ssl=1)

请注意如何 `Tasks layout` 已经不见了。

如果你想要做相反的事情呢？如果你有一个你想要的 _组件_ 层次结构，也就是说，你**想要**在编辑任务页面渲染一些布局，但你**不想**让那个布局影响到 URL。那么，只需把下划线放在相反的一边。所以我们有 `tasks_.$taskId.edit.tsx`，它渲染任务编辑页面，但不把任务布局路由放入 _组件层次结构_。假设我们有一个特殊的布局，我们**想要**只用于任务编辑。让我们创建一个 `_taskEdit.tsx`。

```javascript
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_taskEdit")({
  component: () => (
    <div>
      特殊任务编辑布局 <Outlet />
    </div>
  ),
});
```

然后我们将任务编辑文件改为 `_taskEdit.tasks_.$taskId.edit.tsx`。现在，当我们浏览到 `/tasks/1/edit` 时，我们会看到带有我们自定义布局的任务编辑页面（这并没有影响我们的 URL）。

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/09/pathless-layout.jpg?resize=694%2C432&ssl=1)

再次强调，这是一个高级功能。大多数时候，你会使用简单、乏味、可预测的路由规则。但知道这些高级功能的存在也是很好的。

## [](#directory-based-routing)基于目录的路由

与其用点将文件层次结构放入文件名中，你也可以将它们放入目录中。我\_通常\_更喜欢目录，但你可以混合匹配，有时像一对 `$pathParam.index.tsx` 和 `$pathParam.edit.tsx` 这样的平铺文件名在目录内感觉很自然。所有正常的规则都适用，所以选择对\_你来说\_感觉最好的。

我们不会再次详细介绍目录的所有内容。我们只是简单看一下成品（也可以在 [GitHub](https://github.com/arackaf/tanstack-router-routing-demo) 上找到）。我们有一个 `epics` 路径，它列出了，嗯，史诗任务。对于每个史诗任务，我们可以编辑或查看它。在查看时，我们还会展示史诗任务中的（静态）里程碑列表，我们也可以查看或编辑它们。像之前一样，为了好玩，当我们编辑一个里程碑时，我们会移除里程碑路由布局。

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/09/directory-routing.jpg?resize=454%2C444&ssl=1)

所以，我们使用 `epics/index.tsx` 和 `epics/route.tsx` 来代替 `epics.index.tsx` 和 `epics.route.tsx`。等等。再次强调，规则是相同的：将文件名中的点替换成斜杠（以及目录）。

在继续之前，让我们简单暂停并看一下 `$milestoneId.index.tsx` 路由。路径中有一个 `$milestoneId`，所以我们可以找到那个路径参数。但是往上看，在路由树中更高的两层，也有一个 `$epicId` 参数。并不意外，路由器足够智能以识别到这一点，并设置类型，使得两者都存在。

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/09/multiple-path-params.jpg?resize=1024%2C534&ssl=1)

## 类型安全的查询字符串

在我的观点中，本文的高潮将是 Web 开发中最讨厌的方面之一：处理搜索参数（有时称为查询字符串）。基本上是 URL 中 `?` 后面的东西：`/tasks?search=foo&status=open`。底层平台原语 `URLSearchParams` 使用起来可能很繁琐，而框架通常也没做得更好，经常提供一个未类型化的属性包，并在构造带有新的、更新的查询字符串值的新 URL 方面提供最少的帮助。

TanStack 路由器提供了一种方便的、功能齐全的机制来管理搜索参数，**这些参数也是类型安全的**。让我们深入了解。我们将进行高层次的查看，但完整的文档[在这里](https://tanstack.com/router/latest/docs/framework/react/guide/search-params)。

我们将为 `/epics/$epicId/milestones` 路由添加搜索参数支持。我们将允许搜索参数中的各种值，使用户能够搜索给定史诗下的里程碑。我们已经无数次看到了 `createFileRoute` 函数。通常我们只是传递一个 `component` 给它。

```javascript
export const Route = createFileRoute("/epics/$epicId/milestones/")({
  component: ({}) => {
    // ...
```

它支持许多其他的功能。对于搜索参数，我们需要 `validateSearch`。这是我们告诉 Router _哪些_ 搜索参数这个路由支持，以及如何验证当前 URL 中的内容的机会。毕竟，用户可以在 URL 中输入他们想要的任何内容，不管你设置了什么 TypeScript 类型。将可能无效的值转换成有效值，这是你的任务。

首先，让我们为我们的搜索参数定义一个类型。

```typescript
type SearchParams = {
  page: number;
  search: string;
  tags: string[];
};
```

现在，让我们实现我们的 `validateSearch` 方法。这接收一个代表用户在 URL 中拥有的任何内容的 `Record<string, unknown>`，并从中返回匹配我们类型的东西。让我们来看一看。

```typescript
export const Route = createFileRoute("/epics/$epicId/milestones/")({
  validateSearch(search: Record<string, unknown>): SearchParams {
    return {
      page: Number(search.page ?? "1") ?? 1,
      search: (search.search as string) || "",
      tags: Array.isArray(search.tags) ? search.tags : [],
    };
  },
  component: ({}) => {
```

注意，（与 `URLSearchParams` 不同）我们不仅限于字符串值。我们可以放入对象或数组，TanStack 将为我们做序列化和反序列化的工作。不仅如此，你甚至可以指定[自定义序列化机制](https://tanstack.com/router/latest/docs/framework/react/guide/custom-search-param-serialization)。

此外，对于生产应用程序，你可能会希望使用更严格的验证机制，如 [Zod](https://zod.dev/)。事实上，Router 有一些你可以直接使用的适配器，包括 Zod。在这里查看[关于搜索参数的文档](https://tanstack.com/router/latest/docs/framework/react/guide/search-params#zod-adapter)。

让我们手动浏览到这个路径，不带任何搜索参数，看看会发生什么。当我们浏览到

```ts
http://localhost:5173/epics/1/milestones
```

路由器替换（不是重定向）我们到：

```ts
http://localhost:5173/epics/1/milestones?page=1&search=&tags=%5B%5D
```

TanStack 运行了我们的验证函数，然后用正确的、有效的搜索参数替换了我们的 URL。如果你不喜欢它强制 URL 变得“丑陋”像那样，请继续关注；有解决方法。但首先，让我们利用我们所拥有的。

我们多次使用了 `Route.useParams` 方法。还有一个 `Route.useSearch` 做相同的事情，针对搜索参数。但让我们做点不同的。我们之前一直将所有东西放在同一个路由文件中，因此我们可以直接从同一个词汇范围引用路由对象。让我们构建一个单独的组件来读取和更新这些搜索参数。

我添加了一个 `MilestoneSearch.tsx` 组件。你可能会认为你可以直接从路由文件导入 `Route` 对象。但那很危险。你可能会创建一个循环依赖，这可能会或可能不会工作，这取决于你的打包工具。即使它“工作”，你可能会有一些隐藏的问题潜伏着。

幸运的是，Router 为此提供了一个直接的 API，`getRouteApi`，它从 `@tanstack/react-router` 导出。我们传递一个（静态类型的）路由，它会返回给我们正确的路由对象。

```javascript
const route = getRouteApi("/epics/$epicId/milestones/");
```

现在我们可以在那个路由对象上调用 `useSearch` 并获得我们的静态类型结果。

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/09/get-search-params.jpg?resize=1024%2C528&ssl=1)

我们不会详细讨论表单元素和点击处理程序来同步和收集这些搜索参数的新值。假设我们有一些新值，看看我们如何设置它们。对此，我们可以使用 `useNavigate` 钩子。

```javascript
const navigate = useNavigate({
  from: "/epics/$epicId/milestones/"
});
```

我们调用它并告诉它我们从哪儿导航 _来_。现在我们使用结果告诉它我们想要 _去_ 的地方（我们现在所在的同一个地方），并获得一个 `search` 函数，从中我们返回新的搜索参数。自然地，如果我们遗漏了任何东西，TypeScript 会向我们发出警告。为了方便起见，Router 会将这个搜索函数的当前值传递给我们，使得我们只需添加/覆盖某些东西就变得简单。因此，为了翻页，我们可以这样做

```javascript
navigate({
  to: ".",
  search: prev => {
    return { ...prev, page: prev.page + 1 };
  },
});
```

自然地，如果你需要跳转到一个带有路径参数的路由，这个函数也有一个 `params` 属性，你必须指定这些参数（否则 TypeScript 会像往常一样对你大喊大叫）。我们这里不需要一个 `$epicId` 路径参数，因为路由上已经有一个了，并且因为我们要跳转到的是我们已经在的地方（如 `useNavigate` 中的 `from` 值和 navigate 函数中的 `to: "."` 值所示），路由器知道只需保持那里的内容。

如果我们想要设置一个搜索值和标签，我们可以这样做：

```javascript
const newSearch = "Hello World";
const tags = ["标签 1", "标签 2"];

navigate({
  to: ".",
  search: prev => {
    return { page: 1, search: newSearch, tags };
  },
});
```

这将使我们的 URL 看起来像这样：

```ts
/epics/1/milestones?page=1&search=Hello%20World&tags=%5B"标签%201"%2C"标签%202"%5D
```

同样，搜索参数和字符串数组为我们序列化了。

如果我们想要 _链接到_ 一个带有搜索参数的页面，我们在 Link 标签上指定这些搜索参数

```javascript
<Link 
  to="/epics/$epicId/milestones" 
  params={{ epicId }} 
  search={{ search: "", page: 1, tags: [] }}>
  查看里程碑
</Link>
```

而且像往常一样，如果我们留下任何东西，TypeScript 将会对我们大喊大叫。强类型是一件好事。

### [](#making-our-url-prettier)让我们的 URL 更美观

正如我们所见，目前，浏览至：

```ts
http://localhost:5173/epics/1/milestones
```

将会把 URL 替换为这个：

```ts
http://localhost:5173/epics/1/milestones?page=1&search=&tags=%5B%5D
```

它会有所有那些查询参数，因为我们明确告诉了路由器，我们的页面将始终有一个页面，搜索和标签值。如果你关心拥有一个最小化和干净的 URL，并希望不发生这种转换，你有一些选择。我们可以使所有这些值变为可选的。在 JavaScript（和 TypeScript）中，如果一个值持有 `undefined` 值，则表示该值不存在。所以我们可以这样改变我们的类型：

```typescript
type SearchParams = {
  page: number | undefined;
  search: string | undefined;
  tags: string[] | undefined;
};
```

或者这样，意思是一样的：

```typescript
type SearchParams = Partial<{
  page: number;
  search: string;
  tags: string[];
}>;
```

然后做额外的工作，将默认值替换为 undefined：

```typescript
validateSearch(search: Record<string, unknown>): SearchParams {
  const page = Number(search.page ?? "1") ?? 1;
  const searchVal = (search.search as string) || "";
  const tags = Array.isArray(search.tags) ? search.tags : [];

  return {
    page: page === 1 ? undefined : page,
    search: searchVal || undefined,
    tags: tags.length ? tags : undefined,
  };
},
```

这将使得使用这些值的地方变得复杂，因为现在它们可能是 undefined。我们原本简单的 pageUp 调用现在看起来是这样的

```javascript
navigate({
  to: ".",
  search: prev => {
    return { ...prev, page: (prev.page || 1) + 1 };
  },
});
```

从好的方面来说，我们的 URL 现在将省略具有默认值的搜索参数，而且就此而言，我们的 `<Link>` 标签到这个页面现在不需要指定任何搜索值，因为它们都是可选的。

### [](#another-option)另一个选项

路由实际上为你提供了另一种做法。目前 `validateSearch` 仅接受未类型化的 `Record<string, unknown>`，因为 URL 可以包含任何内容。我们从这个函数**返回**的“真实”类型是我们搜索参数的类型。通过调整**返回类型**，我们已经在改变事情。

但路由允许你选择另一种模式，在这种模式下，你可以指定输入搜索参数的结构，包括可选值，**以及**返回类型，这代表了经过验证、最终确定的搜索参数类型，将由你的应用代码**使用**。让我们看看如何做。

首先让我们为这些搜索参数指定两种类型

```typescript
type SearchParams = {
  page: number;
  search: string;
  tags: string[];
};

type SearchParamsInput = Partial<{
  page: number;
  search: string;
  tags: string[];
}>;
```

现在让我们引入 `SearchSchemaInput`：

```javascript
import { SearchSchemaInput } from "@tanstack/react-router";
```

`SearchSchemaInput` 是我们向路由器发送的信号，表明我们想要为我们将要 _接收_ 的和我们将要 _产出_ 的搜索参数指定不同的参数。我们通过将我们想要的输入类型与这个类型相交来做到这一点，像这样：

```typescript
validateSearch(search: SearchParamsInput & SearchSchemaInput): SearchParams {
```

现在我们执行之前相同的原始验证，以产生真实的值，就这样。我们现在可以使用 `<Link>` 标签浏览到我们的页面，一点搜索参数都不指定，它会接受它并不修改 URL，同时还像以前一样产生同样强类型的搜索参数值。

话虽如此，当我们 _更新_ 我们的 URL 时，我们不能只是 “splat” 所有之前的值，加上我们正在设置的值，因为这些参数现在将有值，因此会被更新到 URL 中。GitHub 仓库有一个分支叫做 [feature/optional-search-params-v2](https://github.com/arackaf/tanstack-router-routing-demo/tree/feature/optional-search-params-v2) 展示了这种第二种方法。

实验并选择最适合你和你的用例的方法。

## 小结

TanStack 路由器是一个令人非常兴奋的项目。它是一个制作精良、灵活的客户端框架，承诺在不久的将来提供出色的服务器端集成。

我们刚刚触及到了表面。我们仅仅覆盖了类型安全导航、布局、路径参数和搜索参数的绝对基础，但要知道还有更多需要了解的，特别是关于数据加载和即将到来的服务器集成。
