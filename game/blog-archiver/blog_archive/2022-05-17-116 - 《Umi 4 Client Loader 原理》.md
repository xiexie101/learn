---
title: "116 - 《Umi 4 Client Loader 原理》"
date: 2022-05-17
url: https://sorrycc.com/umi-4-client-loader
---

发布于 2022年5月17日

# 116 - 《Umi 4 Client Loader 原理》

今天刚把 Client Loader 的 PR 合了，这是个大功能，准备对内发 Bigfish 框架的 4.1（mirror） 版更新，在此介绍下他是什么以及背后的原理。

Client Loader 是适用于 CSR（Client Side Render）的基于路由的数据加载策略，解 React 请求瀑布的问题。开发者要做的只有两步，1）在路由组件上通过 export function clientLoader() 声明数据获取，2）在路由组件及子组件通过 useClientLoader() hook 获取数据。

```tsx
export default () => {
 const { data } = useClientData();
 // render with data
}

export async function clientLoader() {
 return await fetch('/path/to/api');
}
```

效果如下。左边通过 Client Loader 里获取数据，右边则是在 useEffect 里获取数据。可以看出，Client Loader 的版本，三个请求是同时发起的，这让页面渲染的时间大大缩短。

![](https://img.alicdn.com/imgextra/i4/O1CN01gO4S1q1U8gOUDEvYd_!!6000000002473-1-tps-1920-1080.gif)

实现原理分 4 步。

1、识别有 export clientLoader 的路由组件。办法是通过 esbuild + es-module-lexer 分析出 exports，如果包含 clientLoader，即判定为 true。需要注意的是 es-module-lexer 不支持 jsx 语法，所以遇到 .tsx 或 .jsx 文件，需先用 esbuild 做一次 transform 消灭 jsx 语法。代码见 [https://github.com/umijs/umi-next/blob/8e148bc24b90e3fc93e4fd67899be80c0995057c/packages/preset-umi/src/features/tmpFiles/getModuleExports.ts#L4](https://github.com/umijs/umi-next/blob/8e148bc24b90e3fc93e4fd67899be80c0995057c/packages/preset-umi/src/features/tmpFiles/getModuleExports.ts#L4) 和 [https://github.com/umijs/umi-next/blob/038a61d06490f161a0398ec67753fdf95079076e/packages/bundler-utils/src/index.ts#L11](https://github.com/umijs/umi-next/blob/038a61d06490f161a0398ec67753fdf95079076e/packages/bundler-utils/src/index.ts#L11)

2、提取 clientLoader。这一步要把所有路由组件的 clientLoader 从路由组件里拆出来，并且集合到一起。方法是拼一个临时文件（如下），包含所有 loader，并且对这个文件用 esbuild 做打包处理。打包时要注意的是，除了包含 clientLoader 的路由组件，其余的全部标记为 external，实现此功能的 esbuild 插件见 [https://github.com/umijs/umi-next/blob/8e148bc24b90e3fc93e4fd67899be80c0995057c/packages/preset-umi/src/features/clientLoader/clientLoader.ts#L55](https://github.com/umijs/umi-next/blob/8e148bc24b90e3fc93e4fd67899be80c0995057c/packages/preset-umi/src/features/clientLoader/clientLoader.ts#L55) 。到这里，我们就拥有了一个包含所有 clientLoader 的独立文件，并以路由的 id 为 key。独立文件的重要性在于他可以不依赖路由文件的加载而提前执行。

```ts
import { clientLoader as loader0 } from '@/pages/foo';
import { clientLoader as loader1 } from '@/pages/bar';
export default {
 foo: loader0,
 bar: loader1,
}
```

3、绑定路由和 clientLoader 方法。在路由上添加 clientLoader 方法，方便下一步在渲染过程中执行。

```
routes: {
 foo: { id: 'foo', path: '/foo', clientLoader: clientLoaders['foo'] }
}
```

4、渲染时批量提前执行 clientLoader。要做的是，1）匹配路由拿到所有的路由 id，2）map 出 clientLoader 方法，3）并行执行并通过 set 方法设置 clientLoader 的返回结果。

```ts
// 伪代码
const ids = matchRoutes(clientRoutes, location.pathname);
ids.forEach(id => {
 routes[id].clientLoader().then(data => setClientLoaderData(...));
});
```

参考：  
[91 - 《Bigfish 4 特性 03：默认最快的请求》](https://sorrycc.com/bigfish-4-feat-03-fastest-request)  
[https://github.com/umijs/umi-next/pull/764](https://github.com/umijs/umi-next/pull/764)
