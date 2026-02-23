---
title: "译：使用 TanStack Router 加载数据：react-query"
date: 2024-12-03
url: https://sorrycc.com/tanstack-router-data-loading-2
---

发布于 2024年12月3日

# 译：使用 TanStack Router 加载数据：react-query

> 原文：[https://frontendmasters.com/blog/tanstack-router-data-loading-2/](https://frontendmasters.com/blog/tanstack-router-data-loading-2/)  
> 作者：Adam Rackis  
> 译者：ChatGPT 4 Turbo

[TanStack Query](https://tanstack.com/query/latest)（通常称为 react-query）是一个非常受欢迎的工具，用于管理客户端查询。你完全可以为 react-query 开设一整套课程，而且人们确实这样做了，但在这里我们将简要介绍，以便你可以快速上手。

### [](#article-series)文章系列

1.  [介绍 TanStack 路由](https://frontendmasters.com/blog/introducing-tanstack-router/)
2.  [通过 TanStack 路由加载数据：入门](https://frontendmasters.com/blog/tanstack-router-data-loading-1/)
3.  [通过 TanStack 路由加载数据：react-query](https://frontendmasters.com/blog/tanstack-router-data-loading-2/)

本质上，react-query 允许我们编写如下代码：

```javascript
const { data, isLoading } = useQuery({
  queryKey: ["task", taskId],
  queryFn: async () => {
    return fetchJson("/api/tasks/" + taskId);
  },
  staleTime: 1000 * 60 * 2,
  gcTime: 1000 * 60 * 5,
});
```

`queryKey` 的作用正如其名：它让你为一个查询标识任何特定的键。随着键的变化，react-query 足够智能地重新运行 `queryFn` 属性中包含的查询。随着这些查询的到来，TanStack 在客户端缓存中跟踪它们，连同 `staleTime` 和 `gcTime` 这样的属性，它们在 TanStack 路由中的含义与此相同。毕竟，这些工具都是由同一批人构建的。

还有一个 `useSuspenseQuery` 钩子，其概念相同，不同之处在于它不提供 isLoading 值，而是依赖于 Suspense，并让你通过 Suspense 边界处理加载状态。

这仅仅触及了 Query 的表面。如果你之前从未使用过它，请确保查看[文档](https://tanstack.com/query/latest)。

我们将继续介绍与路由的设置和集成，但我们将保持高层次的讨论，以保持这篇文章的长度可控。

## [](#setup)设置

我们需要用 `QueryClientProvider` 包裹整个应用，它会将一个 queryClient（和缓存）注入到我们的应用程序树中。将其放置在我们已有的 `RouterProvider` 周围是个不错的选择。

```tsx
const queryClient = new QueryClient();

const Main: FC = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{ queryClient }} />
      </QueryClientProvider>
      <TanStackRouterDevtools router={router} />
    </>
  );
};
```

回想起我们之前也将我们的 `queryClient` 传递给了路由器的上下文，像这样：

```javascript
const router = createRouter({ 
  routeTree, 
  context: { queryClient }
});
```

以及：

```typescript
type MyRouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});
```

这允许我们通过路由器的上下文在我们的加载函数内访问 `queryClient`。如果你想知道为什么，既然我们已经在使用 react-query，我们还需要加载器，请继续关注。

## [](#querying)查询

我们使用路由器的内置缓存能力来处理我们的任务。对于史诗任务，让我们使用 react-query。此外，让我们使用 `useSuspenseQuery` 钩子，因为通过 Suspense 边界管理加载状态非常方便。而且，Suspense 边界正是路由器的 `pendingComponent` 工作方式。所以你可以使用 `useSuspenseQuery`，连同我们之前看到的相同的 pendingComponent 一起使用！

让我们在我们的史诗布局（路由）组件中添加另一个（人为的）总结查询。

```typescript
export const Route = createFileRoute("/app/epics")({
  component: EpicLayout,
  pendingComponent: () => <div>加载史诗路由 ...</div>,
});

function EpicLayout() {
  const context = Route.useRouteContext();
  const { data } = useSuspenseQuery(epicsSummaryQueryOptions(context.timestarted));

  return (
    <div>
      <h2>史诗概览</h2>
      <div>
        {data.epicsOverview.map(epic => (
          <Fragment key={epic.name}>
            <div>{epic.name}</div>
            <div>{epic.count}</div>
          </Fragment>
        ))}
      </div>

      <div>
        <Outlet />
      </div>
    </div>
  );
}
```

为了让代码稍微有序一些（以及其他我们稍后会提到的原因），我将查询选项分离到了一个独立的地方。

```typescript
export const epicsSummaryQueryOptions = (timestarted: number) => ({
  queryKey: ["epics", "summary"],
  queryFn: async () => {
    const timeDifference = +new Date() - timestarted;
    console.log("在", timeDifference, "时刻运行 api/epics/overview 查询");
    const epicsOverview = await fetchJson<EpicOverview[]>("api/epics/overview");
    return { epicsOverview };
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 5,
});
```

一个查询键、一个函数和一些缓存设置。我从上下文中传入了 timestarted 值，这样我们可以看到这些查询什么时候被触发。这将帮助我们检测到瀑布。

让我们看看根 epics 页面（为节省空间删除了一些细节）。

```ts
type SearchParams = {
  page: number;
};

export const Route = createFileRoute("/app/epics/")({
  validateSearch(search: Record<string, unknown>): SearchParams {
    return {
      page: parseInt(search.page as string, 10) || 1,
    };
  },
  loaderDeps: ({ search }) => {
    return { page: search.page };
  },
  component: Index,
  pendingComponent: () => <div>正在加载 epics ...</div>,
  pendingMinMs: 3000,
  pendingMs: 10,
});

function Index() {
  const context = Route.useRouteContext();
  const { page } = Route.useSearch();

  const { data: epicsData } = useSuspenseQuery(epicsQueryOptions(context.timestarted, page));
  const { data: epicsCount } = useSuspenseQuery(epicsCountQueryOptions(context.timestarted));

  return (
    <div className="p-3">
      <h3>Epics 页面！</h3>
      <h3>一共有 {epicsCount.count} 个 epics</h3>
      <div>
        {epicsData.map((e, idx) => (
          <Fragment key={idx}>
            <div>{e.name}</div>
          </Fragment>
        ))}
        <div className="flex gap-3">
          <Link to="/app/epics" search={{ page: page - 1 }} disabled={page === 1}>
            上一页
          </Link>
          <Link to="/app/epics" search={{ page: page + 1 }} disabled={!epicsData.length}>
            下一页
          </Link>
        </div>
      </div>
    </div>
  );
}
```

本页上有两个查询：一个用于获取（分页的）史诗清单，另一个用于获取所有史诗的总数。让我们运行它

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/11/img-2-epics-rendered.jpg?resize=779%2C1024&ssl=1)

和以前一样荒谬，但它确实展示了我们获取的三部分数据：我们在史诗布局中获取的概览数据；然后是史诗数量，以及我们在史诗页面下方加载的史诗列表。

更重要的是，当我们运行这个时，我们首先看到的是我们根路由的等待组件。这很快就解决了，并显示了主导航，以及我们史诗路由的等待组件。这解决了，展示了史诗概览数据，然后揭示了我们史诗页面的等待组件，最终解决并展示了我们史诗的列表和数量。

我们的组件级数据获取正在工作，并通过 Suspense 与我们已经拥有的相同的 Router 等待组件进行集成。非常酷！

不过，让我们看一下我们的控制台，看看我们一直在做的各种日志记录，以跟踪这些获取什么时候发生

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/11/img-3-epics-waterfall.jpg?resize=554%2C248&ssl=1)

结果是……糟糕透了。组件级数据获取与 Suspense 一起使用感觉真的很好，但如果你不小心，这些瀑布极其容易形成。问题在于，当一个组件在等待数据时暂停，它会阻止其子组件呈现。这正是这里发生的事情。路由正在暂停，并且甚至不让子组件（包括页面和任何其他嵌套的路由组件）呈现，这阻止了这些组件的获取开始。

这里有两个潜在的解决方案：我们可以放弃 Suspense，改为使用 `useQuery` 钩子，这不会暂停。这将需要我们手动跟踪多个 `isLoading` 状态（对于每个 useQuery 钩子），并协调与之相配的加载 UX。对于史诗页面，我们需要跟踪计数加载状态和史诗列表状态，并且在两者都返回之前不显示我们的 UI。等等，对于每个其他页面。

另一个解决方案是更早地开始预获取这些查询。

我们将采用方案 2。

### [](#prefetching)预获取

记得之前我们看到加载器函数都是并行运行的。这提供了一个完美的机会，提前开始这些查询，甚至在组件渲染之前。TanStack Query 提供了一个 API 让我们做到这一点。

为了使用 Query 预获取，我们取之前看到的 `queryClient` 对象，并调用 `queryClient.prefetchQuery` 并传入**完全相同的查询选项**，当组件加载并执行 `useSuspenseQuery` 时，Query 将足够智能地发现查询已经在执行中，只需附加到相同的请求上。这也是我们将这些查询选项放入 `epicsSummaryQueryOptions` 辅助函数的一个重要原因：为了在加载器中更容易重用它们进行预获取。

这是我们将添加到史诗路由的加载器：

```javascript
loader({ context }) {
  const queryClient = context.queryClient;
  queryClient.prefetchQuery(epicsSummaryQueryOptions(context.timestarted));
},
```

加载器接收路由树的上下文，从中它获取 `queryClient`。从那里，我们调用 `prefetchQuery` 并传入相同的选项。

让我们继续前往史诗页面。回顾一下，这是我们史诗页面上的相关代码：

```typescript
function Index() {
  const context = Route.useRouteContext();
  const { page } = Route.useSearch();

  const { data: epicsData } = useSuspenseQuery(epicsQueryOptions(context.timestarted, page));
  const { data: epicsCount } = useSuspenseQuery(epicsCountQueryOptions(context.timestarted));
  
  // ..
```

我们从 URL 中获取当前页面，并且，获取上下文，以获得 timestarted 值。现在让我们做刚才的同样事情，并在加载器中重复这段代码，进行预获取。

```javascript
async loader({ context, deps }) {
  const queryClient = context.queryClient;
  queryClient.prefetchQuery(epicsQueryOptions(context.timestarted, deps.page));
  queryClient.prefetchQuery(epicsCountQueryOptions(context.timestarted));
},
```

现在当我们检查控制台时，我们看到的东西好多了。

![](https://i0.wp.com/frontendmasters.com/blog/wp-content/uploads/2024/11/img-4-waterfall-solved.jpg?resize=548%2C254&ssl=1)

### 获取状态

当我们进行 _向上翻页_ 操作时会发生什么。页面值会在 URL 中改变，路由将会向我们的加载器和组件发送一个新的页面值。然后，我们的 `useSuspenseQuery` 将会用新的查询值执行，并再次挂起。这意味着我们现有的任务列表会消失，并显示“加载任务”等待组件。这将是一个糟糕的用户体验。

幸运的是，React 为我们提供了一个不错的解决方案，那就是 `useDeferredValue` 钩子。文档在[这里](https://react.dev/reference/react/useDeferredValue)。这允许我们“延迟”状态变化。如果状态变化导致我们页面上的延迟值挂起，React 将保持现有的 UI 不变，并且延迟的值会简单地保留旧值。让我们看看它是如何工作的。

```typescript
function Index() {
  const { page } = Route.useSearch();
  const context = Route.useRouteContext();

  const deferredPage = useDeferredValue(page);
  const loading = page !== deferredPage;

  const { data: epicsData } = useSuspenseQuery(
    epicsQueryOptions(context.timestarted, deferredPage)
  );
  const { data: epicsCount } = useSuspenseQuery(
    epicsCountQueryOptions(context.timestarted)
  );
 
  // ...
```

我们用 `useDeferredValue` 包装变化的页面值，就这样，当新查询正在进行时，我们的页面不会挂起。并且为了检测新查询是否正在运行，我们将真实的、正确的 `page` 值与 `deferredPage` 值进行比较。如果它们不同，我们知道新数据正在加载，我们可以显示一个加载旋转器（或在这种情况下，在史诗列表上放置一个不透明度覆盖层）

### 查询被重复使用！

在使用 react-query 进行数据管理时，我们现在可以在不同的路由中重复使用同一个查询。无论是查看史诗还是编辑史诗页面，都需要获取用户即将查看或编辑的史诗信息。现在我们可以像之前一样在一个地方定义这些选项。

```typescript
export const epicQueryOptions = (timestarted: number, id: string) => ({
  queryKey: ["epic", id],
  queryFn: async () => {
    const timeDifference = +new Date() - timestarted;

    console.log(`在`, timeDifference, `时刻加载 api/epic/${id} 数据`);
    const epic = await fetchJson<Epic>(`api/epics/${id}`);
    return epic;
  },
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 5,
});
```

我们可以在不同的路由中使用它们，并在两者之间进行缓存（假设我们设置了允许缓存的值）。你可以在 [演示应用程序](https://github.com/arackaf/tanstack-router-loader-demo) 中试试：查看一个 epic，返回列表，然后编辑同一个 epic（或反之）。你访问的第一个页面应该只会在你的网络标签中触发获取操作。

### [](#updating-with-react-query)使用 react-query 更新

就像任务一样，epics 也有一个页面，我们可以在其中编辑单个 epic。让我们看看使用 react-query 时保存逻辑是什么样的。

让我们快速回顾一下到目前为止我们所看到的 epics 查询的 _keys_。对于单个 epic，它是：

```typescript
export const epicQueryOptions = (timestarted: number, id: string) => ({
  queryKey: ["epic", id],
```

对于 epics 列表，它是这样的：

```typescript
export const epicsQueryOptions = (timestarted: number, page: number) => ({
  queryKey: ["epics", "list", page],
```

以及计数：

```typescript
export const epicsCountQueryOptions = (timestarted: number) => ({
  queryKey: ["epics", "count"],
```

最后，epics 概览：

```typescript
export const epicsSummaryQueryOptions = (timestarted: number) => ({
  queryKey: ["epics", "summary"],
```

注意模式：`epics` 后跟着影响多个 epics 的各种事情，对于单个 epic，我们做了 `['epic', ${epicId}]`。有了这个思路，让我们看看在发生变异后使这些查询失效是多么容易：

```javascript
const save = async () => {
  setSaving(true);
  await postToApi("api/epic/update", {
    id: epic.id,
    name: newName.current!.value,
  });

  queryClient.removeQueries({ queryKey: ["epics"] });

  queryClient.removeQueries({ queryKey: ["epic", epicId] });

  navigate({ to: "/app/epics", search: { page: 1 } });

  setSaving(false);
};
```

魔法就在这几行代码中。

一次性清除了缓存中**所有**以 `epics` 开头，或是以 `['epic', ${epicId}]` 开头的查询的所有缓存条目，剩下的则交给 Query 来处理。现在，当我们返回到 epics 页面（或任何使用了这些查询的页面）时，我们会看到 suspense 边界显示出来，同时加载新鲜的数据。如果你更希望保持旧数据在屏幕上，同时加载新鲜数据，那也没问题：只需使用 `queryClient.invalidateQueries` 即可。如果你想检测一个查询是否在后台重新获取数据，以便你可以显示一个内联的旋转器，使用 `useSuspenseQuery` 返回的 `isFetching` 属性。

```typescript
const { data: epicsData, isFetching } = useSuspenseQuery(
  epicsQueryOptions(context.timestarted, deferredPage)
);
```

### [](#odds-and-ends)琐碎事物

我们已经深入了解了 TanStack 路由和查询。让我们看看最后一个技巧。

如果你还记得，我们看到，待处理的组件会发送一个相关的 `pendingMinMs`，即使数据已经准备好了，也强制让一个待处理的组件在页面上停留最少一段时间。这是为了避免加载状态的突兀切换。我们也看到了 TanStack 路由器使用 Suspense 来显示这些待处理的组件，这意味着 react-query 的 `useSuspenseQuery` 将会与之无缝集成。嗯，几乎无缝。路由器只能使用我们从路由器的加载器返回的 promise 中的 `pendingMinMs` 值。但现在我们实际上没有从加载器返回任何 promise；我们预先获取了一些东西，并依赖于组件级别的数据获取来完成真正的工作。

没什么能阻止你同时做这两件事！现在我们的加载器看起来是这样的：

```javascript
async loader({ context, deps }) {
  const queryClient = context.queryClient;

  queryClient.prefetchQuery(epicsQueryOptions(context.timestarted, deps.page));
  queryClient.prefetchQuery(epicsCountQueryOptions(context.timestarted));
},
```

Query 还附带了一个 `queryClient.ensureQueryData` 方法，它可以加载查询数据，并返回该请求的 promise。让我们好好利用它，以便我们可以再次使用 `pendingMinMs`。

你绝对\_不\_想这样做：

```javascript
await queryClient.ensureQueryData(epicsQueryOptions(context.timestarted, deps.page)),
await queryClient.ensureQueryData(epicsCountQueryOptions(context.timestarted)),
```

这会导致每个请求被阻塞，依次执行。换句话说，就是瀑布式执行。相反，如果你想立即触发这两个请求，并在加载器中等待它们（避免瀑布式执行），你可以这样做：

```javascript
await Promise.allSettled([
  queryClient.ensureQueryData(epicsQueryOptions(context.timestarted, deps.page)),
  queryClient.ensureQueryData(epicsCountQueryOptions(context.timestarted)),
]);
```

这样做是可行的，并且在 `pendingMinMs` 的持续时间内保持组件处于等待状态

你不会总是，或者通常需要这么做。但当你需要的时候，这很方便。

## 总结

这是一次关于 TanStack 路由和 TanStack 查询的快速旅程，但希望它不会让你感到不知所措。这些工具非常强大，几乎可以做任何事情。我希望这篇文章能帮助一些人好好利用它们！
