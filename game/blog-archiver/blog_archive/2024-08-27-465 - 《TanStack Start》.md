---
title: "465 - 《TanStack Start》"
date: 2024-08-27
url: https://sorrycc.com/tanstack-start
---

发布于 2024年8月27日

# 465 - 《TanStack Start》

现在开发一个框架真是太简单了，TanStack Start 和 Solid Start 都是套壳 Vinxi + Vite + Nitro，然后加自己的路由、runtime 和 Vite 插件就完成了。

1、TanStack Start 是啥？我理解他是基于 TanStack Router 的浅层封装，其打包基于 [Vinxi](https://github.com/nksaraf/vinxi) 和 Vite，其部署基于 [Nitro](https://nitro.unjs.io/)。功能上支持 SSR、流、server function、RPCs、打包等功能。全栈框架。

2、快速上手。参考 [https://tanstack.com/router/latest/docs/framework/react/start/getting-started](https://tanstack.com/router/latest/docs/framework/react/start/getting-started) 10 分钟能跑一遍流程，带安装依赖。

3、整体是组装式的，很白盒。整体目录如下，router.tsx 定义路由，client.tsx 做 client 渲染，ssr.tsx 做服务端渲染，routes 下定义路由，`routes/__root.tsx` 决定路由的整体结构。组装式指的是，框架提供方法，然后交给你组装，好处是主动权完全在自己手上。

```
.
├── app/
│   ├── routes/
│   │   └── __root.tsx
│   ├── client.tsx
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   └── ssr.tsx
├── .gitignore
├── app.config.ts
├── package.json
└── tsconfig.json
```

4、官方推荐了 Vercel 做部署，[Clerk](https://clerk.com/) 做用户认证，[Convex](https://www.convex.dev/) 做数据库，[Sentry](https://sentry.io/) 做监控。

5、源码见 [https://github.com/TanStack/router/blob/main/packages/start](https://github.com/TanStack/router/blob/main/packages/start) ，入口在 src/config/index.ts#defineConfig，返回 vinxi 的配置，然后交给 vinxi 做 build 和 dev。从配置上看，需要打 3 个包，分别是 client、ssr 和 server function。

6、如何实现 server function 功能？（注：源码里的 tsr 表示 tanstack router，我想了好久这个简写代表啥…）

1）打包 client 时，用 @vinxi/server-functions/plugin 里的 serverFunctions.client 提取包含了 use server 的文件，其背后实现在 [https://github.com/nksaraf/vinxi/blob/main/packages/vinxi-directives/plugins/shim-exports.js#L15](https://github.com/nksaraf/vinxi/blob/main/packages/vinxi-directives/plugins/shim-exports.js#L15) 。比如。（注：其他还会处理所有的 exports）

```ts
export function foo() {
  'use server';
  console.log('foo');
}
```

会被转化为，

```ts
import { createServerReference } from '@tanstack/start/client-runtime';
export const foo = createServerReference($$function0, id, '$$function0');
export function $$function0(param) {}
```

2）但是，TanStack Start 不是可以用 createServerFn 来声明 server function 吗？那 `use server` 哪里来的呢？这就要看下 start-vite-plugin 的实现了，这是在上一步插件之前执行的。比如。

```ts
let foo = createServerFn('GET', async () => {});
```

会被转化为，

```ts
let foo = createServerFn('GET', async () => {
  'use server';
});
```

注：感觉速度应该不快，如果项目大了的话。一个匹配的文件会额外做多遍 ast 解析，start-vite-plugin 里用 Babel 做一遍，vinxi-directive/…/shim-exports 里用。

3）打包 ssr 产物时，用 serverTransform 。比如。（注：其他还会处理所有的 exports）

```ts
export function foo() {
  'use server';
  console.log('foo');
}
```

会被转化为。

```ts
import { createServerReference } from '@tanstack/start/server-runtime';
export const foo = createServerReference($$function0, id, '$$function0');
export function $$function0(param) {
  console.log('foo');
}
```

4）打包 server function。入口文件是 @tanstack/start/server-handler，会先做一次上一步 ssr 里的 serverTransform，但 runtime 换成 @tanstack/start/react-server-runtime，再做一次 serverBuild，把 serverTransform 里遇到的 server 文件提出来做打包，给 server-handler 用。

参考：  
[https://github.com/TanStack/router/tree/main/packages/start](https://github.com/TanStack/router/tree/main/packages/start)  
[https://tanstack.com/router/latest/docs/framework/react/start/server-functions](https://tanstack.com/router/latest/docs/framework/react/start/server-functions)  
[https://x.com/tannerlinsley](https://x.com/tannerlinsley)  
[https://github.com/unjs/h3](https://github.com/unjs/h3)
