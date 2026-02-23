---
title: "90 - 《Bigfish 4 特性 02：React Router 6 和新路由》"
date: 2022-04-02
url: https://sorrycc.com/bigfish-4-feat-02-new-route
---

发布于 2022年4月2日

# 90 - 《Bigfish 4 特性 02：React Router 6 和新路由》

> 4 月会更新 20 篇 Bigfish 4（含 Umi 4）的新特性，这是第二篇。

## React Router 6

React Router 是 Bigfish 的重要依赖，Bigfish 基于此实现路由功能，Bigfish 4 从 React Router 5 升级到了 React Router 6。

我个人太喜欢 React Router 6 这个版本了。大家应该都听说过 Remix 框架，和 React Router 出自同一个团队。由于他们自己也要做框架，所以 React Router 6 面向框架也做了很多优化，基于此，Bigfish 删了好多路由渲染和请求策略类的代码，因为这些在 React Router 中已内置处理。

大版本意味着 Break Change，而且还不少。但对于 Bigfish 用户来说，却又不多。因为我们之前使用 React Router 的方式是有节制的，比如没有开放 Route、Routes 和 Switch 的使用。一些值得注意的 Break Change 如下：

1、父路由渲染子路由，之前是 props.children，现在是  
2、之前路由组件 props 里能拿到的 location、history、match 等信息，现在可通过 useRouteData() 获取（好处是 props 只能在当前路由组件中获取，而 hooks 的方式在子组件中也能使用，减少了 props 的传递）  
Over。

其他会在框架层做兼容。

## 新路由

除了 React Router 6，我们对内部路由的数据结构也做了调整。

```diff
- 文件/配置 ➡ routes ➡ 渲染
+ 文件/配置 ➡ routesById ➡ routes ➡ 渲染
```

数据结构从 routes 变成了 routesById。前者是嵌套的，`[{ id: 'a', children: [{ id: 'b' }] }]`；后者是拍平的，`[{ id: 'a' }, { id: 'b', parentId: 'a' }]`。拍平对于 Bigfish Contributor 或插件开发者来说，意味着修改路由更容易，不再需要递归去找。比如添加一个全局路由，找到没有 parentId 的加上一个即可；在路由上 set 和 get 数据也更简单。

同时拍平的路由是按 path 长度排序的，长的在前。这让路由匹配更简单，由于父路由的 path 肯定比子路由短，所以最先匹配到的肯定是子路由。

停！这些对于 Bigfish 用户来说有啥意义？

我的理解是扩展能力和想象空间。比如下一篇会介绍的「默认最快的请求」、SSR/SSG 的「loader + useLoader」，规划中的「Form + Action + useTransition」、「基于 Link 的请求 prefetch」等，都因这个调整而变得更简单。再比如如果要自行实现布局、菜单时会需要做路由匹配之类的事，也会更容易。

## 以路由为中心

之后，会有更多以路由为中心的功能出现。

Bigfish 3 就有不少功能是围绕着路由搭建的，比如埋点、菜单、权限、标题等。Bigfish 4 中会有更多，比如客户端请求、服务端请求、处理表单提交等。

```js
// 路由组件
export default function() {
 useLoaderData()
 useClientLoaderData()
 useTransition()
}

// 客户端请求
export function clientLoader() {}

// 服务端请求
export function loader() {}

// 处理表单提交
export function action() {}
```

这对于 Bigfish 用户来说有变更成本，但带来的好处也很多。1）对于团队而言的编码一致性，在统一的地方编码，不要 useEffect、useState、useXXX；2）框架发挥更大价值，举个例子，比如通过静态分析路由组件，提取和拆分 loader、clientLoader 等子方法，可以让页面以我们理解最快的方式渲染（这部分在下一篇展开）。

参考：  
[https://reactrouter.com/docs/en/v6/upgrading/v5](https://reactrouter.com/docs/en/v6/upgrading/v5)  
[https://remix.run/blog/remixing-react-router](https://remix.run/blog/remixing-react-router)
