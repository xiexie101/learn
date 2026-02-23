---
title: "311 - 《Thinking in React Query》"
date: 2023-06-13
url: https://sorrycc.com/thinking-in-react-query
---

发布于 2023年6月13日

# 311 - 《Thinking in React Query》

React Query 维护者 TkDodo 在 [React Summit](https://reactsummit.com/) 分享了 [Thinking in React Query | TkDodo’s blog](https://tkdodo.eu/blog/thinking-in-react-query)，本文是阅读笔记。

1、作者参与 React Query 的方式是先从回答 React Query 的问题开始，然后发现，如果你帮他们解问题，除了收获感激之外，他自己也能从中学到很多。随着参与的深入，TkDodo 成为了目前 React Query 最主要的维护者。

2、作者先是教了大家[如何系鞋带](https://www.youtube.com/watch?v=JeXAe4qv22s)。大多数人不知道系鞋带的方式有正确和错误之分。两种方式乍一看非常相似，但一个结很稳定，另一个结会随着你的行走而松开。这是一个小小的区别，可能会改变你的生活。对于 React Query 来说，也是如此。一些小的概念，会影响你对 React Query 的使用。Small Change，Big Impact。

3、作者分享了三个对于 React Query 来说的重要思路，掌握这些，可以让你更好地使用 React Query，同时也不会提出低级问题。1）React Query 不是请求库，2）StaleTime 是你的好朋友，3）把参数当做依赖。

4、第一条是「React Query 不是请求库」，那是什么？官网的答案是「An Async State Manager」，异步状态管理器。useQuery 通过 queryFn 声明数据源，而提供给 queryFn 的只要是 fulfilled 或 rejected 的 Promise 即可，背后是啥请求库 React Query 并不关心。所以，可以用 axios、fetch、graphql 等请求库，因为他们都支持返回 Promise。

```ts
useQuery({
	queryKey: ['issues'],
	queryFn: () => axios.get('/issues').then(res => res.data),
});
```

5、状态管理器经历了不同的阶段。1）React 初期，大家用 State 存数据，然后为了共享数据，会把数据往上存，再用 Props 或 Context 往下传，2）这种方式很不方便，后来出现了全局状态管理工具，把所有数据一股脑全部存在最高层（全局），然后按需取用，比如 Redux、Zustand、Dva 等，3）然后发现数据有不同种类，大分类是本地同步数据和远程异步数据，这两种数据有着不同的需求，于是 React Query、SWR 等库应运而生，接管里其中远程异步数据的部分。

6、状态管理器的职责是「高效」获取状态。判断状态管理器是否高效，一个主要的维度是更新时是否能按需且没有不必要的渲染。不同的管理器有不同的方法，比如 Redux 和 Zustand 基于 selector，valtio 基于 reactivity，react-query 基于 queryKey 判断 Query Cache 里的数据是否有更新，同时也有 select 方法用于细粒度的更新判断。

7、第二条是「staleTime 是你的好朋友」。stale time 即过期时间，每条数据在 React Query 里都有其过期时间，默认是 0，可在全局或局部进行配置。其解的问题比如当 3 个组件都需要获取某一条相同的数据时，当 5 分钟内多次请求相同的数据时，当窗口重新聚焦时要获取相同的数据时，是用缓存还是请求服务器？这里没有标准答案，by scene 吧。

```ts
useQuery({
	staleTime: 5 * 60 * 1000, // 5 minites
});
```

8、第三条是「把参数当做依赖」。具体点就是把参数作为依赖放到 queryKey 里，这样参数变更时，queryKey 会变更，然后会自动发起新的数据请求。这是使用 React Query 的最佳实践，还有相应的 eslint 规则 @tanstack/eslint-plugin-query 来确保。可以把他当 useEffect 的依赖来用。

```ts
useQuery({
	queryKey: ['issues', filters],
	queryFn: () => axios.get('/issues?filters='+filters).then(res => res.data),
});
```

参考：  
[Thinking in React Query | TkDodo’s blog](https://tkdodo.eu/blog/thinking-in-react-query)
