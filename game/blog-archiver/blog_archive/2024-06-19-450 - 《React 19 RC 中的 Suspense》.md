---
title: "450 - 《React 19 RC 中的 Suspense》"
date: 2024-06-19
url: https://sorrycc.com/react-19-rc-suspense
---

发布于 2024年6月19日

# 450 - 《React 19 RC 中的 Suspense》

React 19 RC 发布后有一件在社区影响比较大的事是 Suspense 的改动，做下记录。

1、简单说就是之前 `<Suspense>` 包含的 Promise 会并发执行，现在是串行。

比如：

```tsx
<Suspense fallback={<p>loading...</p>}>
  <Foo />
  <Bar />
</Suspense>
```

`<Foo />` 和 `<Bar />` 中如果有 fetch 请求，之前是会并发执行。为啥？因为 React 遇到 Foo 时虽然会挂起，但依旧会接着往下走去解析 Bar。

2、Promise 不仅仅是数据请求（fetch），一个更常见的是路由按需加载的例子。

```tsx
const Header = lazy(() => import('./Header.tsx'));
const Navbar = lazy(() => import('./Navbar.tsx'));
const Footer = lazy(() => import('./Footer.tsx'));

<Suspense fallback={<p>loading...</p>}>
  <Header />
  <Navbar />
  <Footer />
</Suspense>
```

此时，Header、Navbar 和 Footer 也是串行瀑布加载和渲染的，这就很恐怖了。

3、那么，React 团队为什么要这么做？

```tsx
<Suspense fallback={<p>loading...</p>}>
  <Foo />
  <BarWhichIsExpensive />
</Suspense>
```

这是个 by design 的改动，他们考虑的点是，当 Bar 是一个需要较长时间解析和渲染的组件时，会影响 fallback 的渲染速度。而像 Next.js 这种，大部分是 ssr、rsc，比较少 spa 的场景。所以这个改动对他们影响不大。

4、为啥影响不大？因为在有框架或者库的前提下，通常并不是 Fetch-On-Render，而是提前准备好数据，在 Render 时仅需要消费那个 Promise 即可。

比如用 TanStack Router + TanStack Query。

```tsx
export const Route = createFileRoute('/')({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(repoOptions('tanstack/query'))
    queryClient.ensureQueryData(repoOptions('tanstack/table'))
  },
  component: () => (
    <Suspense fallback={<p>...</p>}>
      <RepoData name="tanstack/query" />
      <RepoData name="tanstack/table" />
    </Suspense>
  ),
})
```

5、「好」消息是，React 团队决定 Hold React 19 的发布，直到找到解法为止；坏消息是，React 19 正式版发布推迟了。见 [https://x.com/sophiebits/status/1801663976973209620](https://x.com/sophiebits/status/1801663976973209620)

参考：  
[https://tkdodo.eu/blog/react-19-and-suspense-a-drama-in-3-acts](https://tkdodo.eu/blog/react-19-and-suspense-a-drama-in-3-acts)  
[https://blog.codeminer42.com/how-react-19-almost-made-the-internet-slower/](https://blog.codeminer42.com/how-react-19-almost-made-the-internet-slower/)  
[https://x.com/sophiebits/status/1801663976973209620](https://x.com/sophiebits/status/1801663976973209620)
