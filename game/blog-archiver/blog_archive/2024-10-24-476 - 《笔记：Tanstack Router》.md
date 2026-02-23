---
title: "476 - 《笔记：Tanstack Router》"
date: 2024-10-24
url: https://sorrycc.com/tanstack-router-notes
---

发布于 2024年10月24日

# 476 - 《笔记：Tanstack Router》

> 陆陆续续看了一天，以下是笔记。我的感受是，Tanstack Router 绝对是 React 路由方案的首选，同时他不仅是路由，还围绕路由优化了 DX、性能、Server 等场景。我大概率会在下个版本的框架里用他。

1、约定式路由基于 @tanstack/router-generator 生成，可以用插件，或者安装 @tanstack/cli。

```
pnpm i @tanstack/router-cli -D
```

```
tsr generate
tsr watch
```

文件会生成到 `src/routeTree.gen.ts` 中。

> 扩展名为 .lazy.tsx 的路由文件通过单独的捆绑包进行懒加载，以尽可能减小主捆绑包的大小。

2、安装。

```
pnpm add @tanstack/react-router
pnpm add react react-dom typescript -D
```

3、脚手架。

```
pnpm create @tanstack/router
```

4、devtool 。

```bash
pnpm i @tanstack/router-devtools -D
```

```tsx
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
<TanStackRouterDevtools />
<TanStackRouterDevtools initialIsOpen={false} />
```

dev 阶段按需引入的方法。

```tsx
const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

<Suspense>
  <TanStackRouterDevtools />
</Suspense>
```

![](https://tcc.sorrycc.com/p/e29f6bb7-a33d-4935-a3aa-1d2d9ca3f445.png)

5、基于代码的路由。

```tsx
import ReactDOM from 'react-dom/client';
import {
  Outlet,
  RouterProvider,
  Link,
  createRouter,
  createRoute,
  createRootRoute,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

const rootRoute = createRootRoute({
  component: () =>
  <>
    <div>
      <Link to="/">Index</Link>
      <Link to="/about">About</Link>
    </div>
    <Outlet />
    <TanStackRouterDevtools />
  </>,
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Index</div>,
});
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: () => <div>About</div>,
});
const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
);
```

6、为啥官方推荐基于约定的路由方式，而不推荐基于代码的路由方式？1）脚手架代码多，2）要定义 getParentRoute() 函数，复杂，3）要处理 lazy 按需加载的路由，复杂。

7、一些概念。

*   Root Route，根路由，没有 path，始终被 match，组件始终渲染
*   Static Route，静态路由，没有动态路径
*   Index Route，索引路由，父路由完全匹配且没有子路由匹配时使用
*   Dynamic Route Segments，以 $ 开头的就是，比如 `$postId`
*   Splat / Catch-All Routes，捕捉到的路径名会出现在参数对象的 `_splat` 属性中。比如 `files/$` 如果 url 是 `/files/documents/hello-world`，那 `_splat` 属性会是 `documents/hello-world`
*   Pathless Routes，以 `_` 开头的为无路径路由，用于增加一些额外的逻辑，不需要 match path，应用场景比如，1）添加布局组件，2）渲染子路由之前添加前置 loader，3）验证并向子路由提供 search params，4）为子路由提供 error component 或 pending component，5）为子路由提供 context。
*   Non-Nested Routes，比如 `posts_.$postId.edit.tsx`，因为加了 `_` postfix，所以不共享相同的 posts 前缀，因此会被视为顶级路由
*   404 / NotFound Routes，没有 path 和 id 。
*   Pathless Route Group Directories，无意义，纯粹组织性的，不会以任何方式影响路由树。
*   Outlet，出口组件，用于渲染下一个可能匹配的子路由。注：如果路由的组件未定义，则会自动渲染一个 `<Outlet />` 。

8、Code Splitting。

TanStack Router 将路由代码分成两部分，1）关键路由配置，2）非关键和 lazy 路由配置。注意：1）所有的 Component 都是 2，2）loader 是 1 不是 2，因为 loader 如果是 2，那加载数据的时机会很晚，同时 loader 通常（！）对尺寸影响不大。

在 tsr.config.json 里配置可开启自动 code splitting。TanStack Router 会根据关键和非关键路由配置自动对所有路由文件进行代码拆分。

```json
{
  // ...
  "autoCodeSplitting": true,
}
```

9、导航。

1）Everything is relative 。  
2）如果没有提供 from route id，则假设是 from 自 `/` 。  
3）ToOptions

```ts
type ToOptions = {
  from: string
  to: string
  params: Record<string, unknown> | (prevParams) => {}
  search: Record<string, unknown> | (prevSearch) => {}
  hash?: string | (prevHash) => string
  state?: Record<string, unknown> | (prevState) => {}
};
```

params 和 search 的区别：params 是路径中的动态部分，而 search 是附加在URL路径后的查询参数。

每个 route 都有 to 属性，可以拿来导航用，以获得类型安全。

4）NavigateOptions 在 ToOptions 的基础上多了个 `{ replace?: boolean }`，任何实际执行导航的 API 都将使用此接口。

5）LinkOptions 在 NavigateOptions 的基础上扩展了其他的，适用于所有的 a 标签。

```ts
type LinkOptions = NavigateOptions & {
  target?: HTMLAnchorElement['target']
  activeOptions?: { exact?, includeHash?, includeSearch?, explicitUndefined? }
  preload?: false | 'intent'
  // default: 50
  preloadDelay?: number
  disabled?: boolean
};
```

6）导航 API 有 `<Link>`（最常用）、`useNavigate()`、`<Navigate>`、`Router.navigate()`（可以在任意地方调用）。

7）`<Link>` 组件用 `LinkProps`，他在 LinkOptions 的基础上多了一些属性。

```ts
type LinkProps = LinkOptions & {
  activeProps?: 
    | React.AnchorHTMLAttributes<HTMLAnchorElement>
    | (() => React.AnchorHTMLAttributes<HTMLAnchorElement>)
  inactiveProps?:
    | React.AnchorHTMLAttributes<HTMLAnchorElement>
    | (() => React.AnchorHTMLAttributes<HTMLAnchorElement>)
}
```

8）TODO：search params 的类型安全。

9）active 状态。首先，有 activeProps 和 inactiveProps，然后有 data-status 属性在 active 时其值为 `active`，可基于此来设计样式。比如。

```css
div.foo[data-status="active"] {
  color: red;
}
```

10）ActiveOptions，决定当前链接是否处于 active 状态。比如首页链接通常要 exact: true 严格匹配，`<Link activeOptions={{exact: true}} to="/" />` 。

```ts
type ActiveOptions = {
  // default: false
  exact?: boolean
  // default: false
  includeHash?: boolean
  // default: true
  includeSearch?: boolean
  // default: false
  explicitUndefined?: boolean
};
```

11）把 isActive 传给后代可以这样。

```tsx
const link = (
  <Link to="/blog/post">
    {({ isActive }) => {
      return (
        <>
          <span>My Blog Post</span>
          <icon className={isActive ? 'active' : 'inactive'} />
        </>
      )
    }}
  </Link>
)
```

12）优先用 Link 做跳转。还有几种方式，1）useNavigate 则用于处理副作用场景下的跳转，比如成功异步操作之后进行跳转，返回的 navigate 函数接受的是 NavigateOptions，2）Navigate 组件可以在组件挂载时立即跳转，3）router.navigate 可以在任何路由实例可用的地方做跳转，适用范围更广。

```ts
let navigate = useNavigate({ from: '/posts/$postId' });
// 注：from 也可以在这里（用的时候）传
navigate({ to, params });
```

13）useMatchRoute 和 `<MatchRoute>` 是一回事，都接收 ToOptions 作为参数或 props，返回 true | false。其中有个 pending 状态表示正在跳转到当前路由。

```tsx
<MatchRoute to="/users" pending><Spinner /></>
<MatchRoute to="/users" pending>{(match) => <Spinner show={match} />}</>

let matchRoute = useMatchRoute();
if (matchRoute({ to: '/users', pending: true })) {}
```

10、通过 `createLink` 可自定义 Link 组件。

```tsx
import { createLink, LinkComponent } from '@tanstack/react-router';

let Bar = React.forwardRef((props, ref) => {
  return <a ref={ref} {...props} className={'xxx'} />;
});
let Foo = createLink(Bar);
let Hoo: LinkComponent = (props) => {
  return <Foo preload='intent' {...props} />
};
```

11、数据加载。

1）TanStack Router 有类 Next.js 和 Remix 的 loader 能力，可基于 url 并行 preload/load 资源。同时还内置了 SWR 长期缓存。

2）load 方法有丰富的参数。

*   abortController，signal 会在合适的时间取消
*   cause，`enter` 或 `stay`（停留）
*   context
*   deps，由 `Route.loaderDeps()` 返回，比如 `loaderDeps: ({ search: { pageIndex, pageSize } }) => ({ pageIndex, pageSize })`
*   location
*   params
*   parentMatchPromise
*   preload
*   route

3）loaderDeps 示例。比如一个 /posts 路由通过 offset 和 limit 支持分页。

```ts
createFileRoute('/posts')({
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: ({ deps: { offset, limit } }) =>
    fetchPosts({
      offset,
      limit,
    }),
})
```

4）除了 loaderDeps，还有 staleTime（默认 0，意味着始终过期，对于一些静态数据或者动态性要求没那么高的数据可以适当设置，设为 Infinity 可禁用 SWR 缓存）、preloadStaleTime（默认 30s，预加载的数据 30s 内有效，使用外部缓存比如 TanStack Query 时需要设为 0）、gcTime（默认 30 分，超过的会被回收，设为 0 不做缓存）、shouldReload 方法决定是否要更新 loader 数据缓存。

5）`router.invalidate()` 会立即重新加载路由数据。

6）通过 context 可以向子路由提供 service、hook 和其他对象。

```ts
let router = createRouter({
  routeTree,
  context: {
    fetchPosts,
  },
});
let RootRoute = createRootRouteWithContext<{
  fetchPosts: typeof fetchPosts
}>()();
```

7）遇到慢 loader 有两种选择，1）拆分快慢数据，然后 defer 慢数据，2）渲染 pending 组件直到所有数据 ready。

```tsx
import { defer, Await } from '@tanstack/react-router';

createFileRoute('/posts/$postId')({
  loader: async () => {
    // Fetch some slower data, but do not await it
    const slowDataPromise = fetchSlowData();
    // Fetch and await some data that resolves quickly
    const fastData = await fetchFastData();
    return {
      fastData,
      deferredSlowData: defer(slowDataPromise),
    }
  },
});

function FooComponent() {
  const { deferredSlowData } = Route.useLoaderData();
  return (
    <Await promise={deferredSlowData} fallback={<div>Loading...</div>}>
      {(data) => {
        return <div>{data}</div>
      }}
    </Await>
  );
}
```

8）错误处理。

```ts
// 默认 Error Component
import { ErrorComponent } from '@tanstack/react-router';

createFileRoute('/posts', {
  // 路由加载过程中出现错误时调用
  onError({ error }) {},
  // CatchBoundary 捕捉到错误时调用（应该指 render 等生命周期）
  onCatch({ error, errorInfo }) {},
  // reset 用于重试，注：reset 不重新调 loader
  // 如果是 load 失败，应调用 router.invalidate()
  errorComponent({ error, reset }) {
    return <ErrorComponent error={error} />
  },
});
```

12、集成外部请求或状态库。事实上，任何返回 promise 做数据读写的库都可以与之搭配使用。

比如。

```tsx
let cache = [];
let Route = createFileRoute('/posts')({
  loader: async () => {
    cache = await fetchPosts();
  },
  component: () => {
    return ({ cache.map(() => <></>) });
  },
});
```

基于 TanStack Query 来做。

```tsx
let postsQueryOpts = queryOptions({
  queryKey: ['posts'],
  queryFn: () => fetchPosts(),
});
let Route = createFileRoute('/posts')({
  loader: queryClient.ensureQueryData(postsQueryOpts),,
  component: () => {
    let {
      data: { posts },
    } = useSuspenseQuery(postsQueryOptions);
    return ({ posts.map(() => <></>) });
  },
  errorComponent: ({ error, reset }) => {
    let router = useRouter();
    let boundary = useQueryErrorResetBoundary();
    useEffect(() => {
      boundary.reset();
    }, [boundary]);
    return ({error.message}<button onClick={() => { router.invalidate() }} />);
  },
});
```

同时，TanStack Query 支持 Critical Dehydration/Hydration。

13、预载支持几种策略，1）intent，基于意图，当在 `<Link>` 上 hover 或 touch start 时，会做 preload，2）viewport visibility，当 `<Link>` 位于 viewport 中时，基于 Intersection Observer API 为路由做 preload，适用于 preload 屏幕外的路由，3）render，还没推出，没理解这是啥。。

最简单使用预载的方式是把整个 Router 的 defaultPreload 设为 intent。

```ts
let router = createRouter({
  defaultPreload: 'intent',
});
```

也可以手动预载。

```ts
let matches = await router.preloadRoute({
  to: postRoute,
  params: { id: 1 },
});
```

14、路由 Mask，用于在访问 /foo 时显 /bar。TODO：这个的场景是啥。。

15、跳转 Block 。比如当用户有未保存的修改、正在填写表格、正在付款等时，做跳转应该不能直接跳，应向用户提示，以确认他是否想要离开当前路由。

```tsx
function Foo() {
  let [formIsDirty, setFormIsDirty] = useState(false);
  useBlocker({
    blockFn: () => window.confirm('Are you sure?'),
    condition: formIsDirty,
  });
  // or with Component
  <Block
    blocker={() => window.confirm('Are you sure?')}
    condition={formIsDirty}
  />
}
```

注：1）此方法不适用于浏览器的后退按钮，2）Block 的 UI 是可以自定义的，示例略。

16、Context。

一些使用场景包括，1）依赖注入，比如 loader function、data fetching client、mutation service，这样所有子路由可以无需 import 直接使用他们，2）面包屑，Context 是会随着路由的下降而合并的，同时存一份每个路由自己的 Context，3）动态 meta tag 管理，即为每个路由添加额外数据。

TODO：补充。

17、权限路由的几种方法。

1）用 `beforeLoad`，他和 `load` 拿到的参数是相同的，如果未通过身份验证，可以重定向到登录页面。

```ts
beforeLoad: async ({ location }) => {
  if (!isAuthenticated()) {
    throw redirect({ to: '/login', search: { redirect: location.href } });
  }
},
```

注：路由的 beforeLoad 函数是在其子路由的 beforeLoad 函数之前调用的，如果在 beforeLoad 中出错，其子节点都不会尝试加载。

2）component 里判断并渲染 Login Modal。

```tsx
component: () => {
  if (!isAuthenticated()) { return <Login />; }
  return <Outlet />;
}
```

3）存 auth 信息到 context 里。

```tsx
// src/App.tsx
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
```

18、Scroll Restoration

TODO。

19、静态路由数据。除了路由本身的数据外，还可通过 match.staticData 属性从任何匹配中访问静态数据。

```tsx
createFileRoute('/posts')({
  staticData: { foo: 'bar' },
});
```

20、SSR 分两种，非流式和流式。

非流式示例。

```ts
// src/entry-server.tsx
import * as React from 'react'
import ReactDOMServer from 'react-dom/server'
import { createMemoryHistory } from '@tanstack/react-router'
import { StartServer } from '@tanstack/start/server'
import { createRouter } from './router'

export async function render(url, response) {
  const router = createRouter()

  const memoryHistory = createMemoryHistory({
    initialEntries: [url],
  })

  router.update({
    history: memoryHistory,
  })

  await router.load()

  const appHtml = ReactDOMServer.renderToString(<StartServer router={router} />)

  response.statusCode = router.hasNotFoundMatch() ? 404 : 200
  response.setHeader('Content-Type', 'text/html')
  response.end(`<!DOCTYPE html>${appHtml}`)
}
```

```tsx
// src/entry-client.tsx

import * as React from 'react'
import ReactDOM from 'react-dom/client'

import { StartClient } from '@tanstack/start'
import { createRouter } from './router'

const router = createRouter()

ReactDOM.hydrateRoot(document, <StartClient router={router} />)
```

流式只要在 server 段改用 `renderToPipeableStream` 渲染路由即可。

序列化除了原始类型，默认支持 Date 和 undefined。如果要支持其他的，比如 Map、Set、BigInt 等，可以自定义 transformer 或者用 SuperJSON。

```ts
import { SuperJSON } from 'superjson'
let router = createRouter({
  transformer: SuperJSON,
});
```

参考：  
[465 - 《TanStack Start》](https://sorrycc.com/tanstack-start)  
[475 - 《视频笔记：初见 TanStack Start》](https://sorrycc.com/glimpse-of-tanstack-start)  
[译：TanStack 的虚拟文件路由](https://sorrycc.com/virtual-file-routes)  
[译：TanStack Router 介绍](https://sorrycc.com/introducing-tanstack-router)  
[https://tanstack.com/router/latest/docs/framework/react/overview](https://tanstack.com/router/latest/docs/framework/react/overview)  
[https://github.com/flightcontrolhq/superjson](https://github.com/flightcontrolhq/superjson)
