---
title: "译：TanStack 路由器中 TypeScript 性能里程碑"
date: 2024-09-20
url: https://sorrycc.com/tanstack-router-typescript-performance
---

发布于 2024年9月20日

# 译：TanStack 路由器中 TypeScript 性能里程碑

> 原文：[https://tanstack.com/blog/tanstack-router-typescript-performance](https://tanstack.com/blog/tanstack-router-typescript-performance)  
> 作者：Christopher Horobin  
> 译者：ChatGPT 4 Turbo

TanStack 路由器在类型安全路由上推动了边界。

路由器的组件，如 `<Link>`，以及它的钩子，如 useSearch、useParams、useRouteContext 和 useLoaderData，都是从路由定义中推断出来的，以提供极佳的类型安全性。使用 TanStack 路由器的应用程序通常会在其路由定义中使用具有复杂类型的外部依赖项，以验证 validateSearch、context、beforeLoad 和 loader。

虽然 DX 很棒，但当路由定义积累成一个路由树并且变得庞大时，编辑体验可能会开始变慢。我们对 TanStack 路由器进行了许多 TypeScript 性能改进，以便问题只有在推断复杂性变得非常大时才开始显现。我们密切关注诊断，如实例化，并尝试减少 TypeScript 对每个单独路由定义进行类型检查所需的时间。

尽管所有这些过去的努力（当然有所帮助），我们不得不面对房间里的大象。为 TanStack 路由器提供出色的编辑体验所需解决的根本问题并不一定与整体 typescript 检查时间相关。我们一直在努力解决的问题是 TypeScript 语言服务在对累积的路由树进行类型检查时的瓶颈。对于那些熟悉追踪 TypeScript 的人来说，一个庞大的 TanStack 路由器应用程序的追踪可能看起来类似于以下内容：

![显示路由树被推断的追踪](https://tanstack.com/blog-assets/tsr-perf-milestone/tracing-slow.png)

对于那些不知道的人，你可以使用以下方式从 TypeScript 生成一个追踪：

```ts
tsc --generatetrace trace
```

这个例子有 400 个路由定义，所有这些都使用 zod 进行 validateSearch，并通过路由上下文和加载器与 TanStack 查询集成 - 这是一个极端的例子。追踪开始处的大墙是 TypeScript 在首次碰到 组件实例时进行类型检查的内容。

语言服务器通过从头开始对文件（或文件的一部分区域）进行类型检查来工作，但仅限于该文件/区域。所以这意味着，每当你与 `<Link>` 组件的实例交互时，语言服务都必须做这项工作。事实证明，这就是我们在从积累的路由树中推断所有必要类型时遇到的瓶颈。如前所述，路由定义本身可以包含来自外部验证库的复杂类型，然后还需要进行推断。

很明显，很早就能看出这显然会减慢编辑器体验的速度。

## 为语言服务划分工作

理想情况下，语言服务应该只需要基于 `<Link>` 导航到的位置来从路由定义中进行推断，而不是不得不爬遍整个路由树。这样语言服务就无需忙于推断那些不是导航目标的路由定义的类型了。

不幸的是，基于代码的路由树依赖于推断来构建路由树，这触发了上面跟踪中显示的问题。然而，TanStack 路由器的基于文件的路由，每当创建或修改路由时，路由树就会自动生成。这意味着这里有一些探索空间，看看我们是否能挤出一些更好的性能。

以前，即使对于基于文件的路由，路由树也是像下面这样创建的：

```ts
export const routeTree = rootRoute.addChildren({
  IndexRoute,
  LayoutRoute: LayoutRoute.addChildren({
    LayoutLayout2Route: LayoutLayout2Route.addChildren({
      LayoutLayout2LayoutARoute,
      LayoutLayout2LayoutBRoute,
    }),
  }),
  PostsRoute: PostsRoute.addChildren({ PostsPostIdRoute, PostsIndexRoute }),
})
```

生成路由树是减少繁琐的路由树配置的一个结果，但仍然保持了推断的价值所在。这就是引入的第一个重要改变，从而导致更好的编辑器性能。我们可以利用这个生成步骤来**声明路由树**，而不是推断路由树。

```ts
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  LayoutRoute: typeof LayoutRouteWithChildren
  PostsRoute: typeof PostsRouteWithChildren
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  LayoutRoute: LayoutRouteWithChildren,
  PostsRoute: PostsRouteWithChildren,
}

export const routeTree = rootRoute._addFileChildren(rootRouteChildren)
```

注意使用了一个接口来声明子项以组成路由树。在生成路由树时，这个过程会对所有路由及其子项重复进行。通过这个改变，运行跟踪给了我们更好的了解，了解语言服务内部发生了什么。

![显示路由树声明的跟踪](https://tanstack.com/blog-assets/tsr-perf-milestone/tracing-declare-route-tree.png)

这仍然很慢，我们还没有完全到达目标，但有一些不同 - _跟踪结果不同了_。整个路由树的类型推断仍然在进行，但现在它在\_其他地方\_发生。在我们处理类型之后，结果发现它发生在一个名为 ParseRoute 的类型中。

```ts
export type ParseRoute<TRouteTree, TAcc = TRouteTree> = TRouteTree extends {
  types: { children: infer TChildren }
}
  ? unknown extends TChildren
    ? TAcc
    : TChildren extends ReadonlyArray<any>
    ? ParseRoute<TChildren[number], TAcc | TChildren[number]>
    : ParseRoute<TChildren[keyof TChildren], TAcc | TChildren[keyof TChildren]>
  : TAcc
```

此类型遍历路由树以创建所有路由的并集。反过来，这个并集被用来从 id -> Route、from -> Route 以及 to -> Route 创建类型映射。这种映射的一个例子存在于映射类型中。

```ts
export type RoutesByPath<TRouteTree extends AnyRoute> = {
  [K in ParseRoute<TRouteTree> as K['fullPath']]: K
}
```

这里的一个重要认识是，当使用基于文件的路由时，我们通过在每次生成路由树时自行输出那个映射类型，完全可以跳过 ParseRoute 类型。相反，我们将能够生成以下内容：

```ts
export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/posts': typeof PostsRouteWithChildren
  '/posts/$postId': typeof PostsPostIdRoute
  '/posts/': typeof PostsIndexRoute
  '/layout-a': typeof LayoutLayout2LayoutARoute
  '/layout-b': typeof LayoutLayout2LayoutBRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/posts/$postId': typeof PostsPostIdRoute
  '/posts': typeof PostsIndexRoute
  '/layout-a': typeof LayoutLayout2LayoutARoute
  '/layout-b': typeof LayoutLayout2LayoutBRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/_layout': typeof LayoutRouteWithChildren
  '/posts': typeof PostsRouteWithChildren
  '/_layout/_layout-2': typeof LayoutLayout2RouteWithChildren
  '/posts/$postId': typeof PostsPostIdRoute
  '/posts/': typeof PostsIndexRoute
  '/_layout/_layout-2/layout-a': typeof LayoutLayout2LayoutARoute
  '/_layout/_layout-2/layout-b': typeof LayoutLayout2LayoutBRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/posts'
    | '/posts/$postId'
    | '/posts/'
    | '/layout-a'
    | '/layout-b'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/posts/$postId' | '/posts' | '/layout-a' | '/layout-b'
  id:
    | '__root__'
    | '/'
    | '/_layout'
    | '/posts'
    | '/_layout/_layout-2'
    | '/posts/$postId'
    | '/posts/'
    | '/_layout/_layout-2/layout-a'
    | '/_layout/_layout-2/layout-b'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  LayoutRoute: typeof LayoutRouteWithChildren
  PostsRoute: typeof PostsRouteWithChildren
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  LayoutRoute: LayoutRouteWithChildren,
  PostsRoute: PostsRouteWithChildren,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
```

除了声明子路由外，我们还声明了将路径映射到路由的接口。

这次变化以及其他类型级别的变更，只有在这些类型未被注册时才有条件使用 ParseRoute，最终达到了我们长期以来的目标，即生成了一份追踪报告 🥳

![追踪路由树声明被更快地推断](https://tanstack.com/blog-assets/tsr-perf-milestone/tracing-faster.png)

第一次引用 `<Link>` 的文件不再触发整个路由树的推断，这显著提高了感知上的语言服务速度。

通过这样做，当 `<Link>` 引用一个特定路由时，TypeScript 将推断出所需的类型。这在所有路由都被链接时，可能不会转化为更好的 TypeScript 类型检查时间，但对于语言服务而言，当在文件/区域内时，这是一个显著的速度提升。

两者之间的区别是显著的，正如在这些具有复杂推断的大型路由树中所见（在下面的这个例子中有 400 个）：

你可能会认为这是在作弊，因为我们在路由树生成阶段做了很多繁重的工作。对此，我们的回应是，文件基路由（现在是虚拟文件基路由）的这个生成步骤已经存在，并且每当你修改或创建一个新路由时，总是一个必要的步骤。

因此，一旦创建了一个路由并生成了路由树，路由定义中的所有内容的推断保持不变。这意味着你可以对 validateSearch、beforeLoad、loader 等进行更改，推断出的类型总是会立即反映出来。

DX 没有改变，但你的编辑器中的性能感觉棒极了（特别是当你处理大型路由树时）。

## 基本规则

这次变化涉及到许多 TanStack Router 的导出被改进，以使其在消费这些生成的类型时性能更佳，同时仍然能够在使用基于代码的路由时回退到整个路由树推断。我们的代码库中也还有一些依赖于完整路由树推断的区域。这些区域是我们版本的宽松/非严格模式。

```ts
<Link to="." search={{ page: 0 }} />
<Link to=".." search={{page: 0}} />
<Link to="/dashboard" search={prev => ({..prev, page: 0 })} />
```

以上三种使用 `<Link>` 的方式，都需要推断整个路由树，因此在与它们交互时会导致较差的编辑器体验。

在前两个例子中，TanStack 路由不知道你想要导航到哪个路由，因此它尽力去猜一个从你的路由树中推断出来的非常宽泛的类型。上面的第三个 `<Link>` 实例，使用了 search 更新函数中的 prev 参数，但在这种情况下，TanStack 路由不知道你是从哪个路由导航过来的，因此它需要再次尝试通过扫描整个路由树来猜测 prev 的宽泛类型。

在你的编辑器中使用 `<Link>` 最高效的方式将是以下情况：

```ts
<Link from="/dashboard" search={{ page: 0 }} />
<Link from="/dashboard" to=".." search={{page: 0}} />
<Link from="/users" to="/dashboard" search={prev => ({...prev, page: 0 })} />
```

TanStack 路由在这些情况下可以将类型缩小到特定的路由。这意味着随着应用程序的扩展，你会获得更好的类型安全性和更好的编辑器性能。因此，我们鼓励在这些情况下使用 from 和/或 to。要明确，在第三个示例中，如果使用了 prev 参数，那么使用 from 是必要的，否则，TanStack 路由不需要推断整个路由树。

这些较宽泛的类型也发生在 strict: false 模式下。

```ts
const search = useSearch({ strict: false })
const params = useParams({ strict: false })
const context = useRouteContext({ strict: false })
const loaderData = useLoaderData({ strict: false })
const match = useMatch({ strict: false })
```

在这个案例中，通过使用推荐的 from 属性，可以实现更好的编辑器性能和类型安全。

```ts
const search = useSearch({ from: '/dashboard' })
const params = useParams({ from: '/dashboard' })
const context = useRouteContext({ from: '/dashboard' })
const loaderData = useLoaderData({ from: '/dashboard' })
const match = useMatch({ from: '/dashboard' })
```

## 展望未来

展望未来，我们相信 TanStack Router 在类型安全和 TypeScript 性能之间的平衡上拥有最佳定位，而且不必在文件基础（和虚拟文件基础）路由中使用的类型推断质量上进行妥协。你的路由定义中的一切都保持推断状态，生成的路由树中的改动仅仅是帮助语言服务声明必要的类型，这是你永远不会想自己写的东西。

这种方法对于语言服务来说也似乎是可扩展的。我们能够创建成千上万的路由定义，只要你坚持使用 TanStack Router 的严格部分，语言服务就能保持稳定。

我们将继续在 TanStack Router 上提高 TypeScript 性能，以减少整体检查时间并进一步提升语言服务性能，但我们仍然觉得分享这一重要的里程碑是很重要的，我们希望 TanStack Router 的用户会对此表示赞赏。
