---
title: "316 - 《Full Stack React 笔记（1）》"
date: 2023-06-28
url: https://sorrycc.com/full-stack-react-note-01
---

发布于 2023年6月28日

# 316 - 《Full Stack React 笔记（1）》

**1、解释下 CSR、SSR、SSG、ISR、RSC。**

![](https://img.alicdn.com/imgextra/i1/O1CN01AQykND1SAqyD1VMBS_!!6000000002207-2-tps-1652-918.png)  
CSR

![](https://img.alicdn.com/imgextra/i1/O1CN01MyPksF1n2FSbhoGK6_!!6000000005031-2-tps-1648-966.png)  
SSR

CSR 是客户端渲染，流程是用户下载脚本，然后加载服务端数据，然后渲染；SSR 是服务端渲染，流程是服务端加载数据，渲染 HTML，然后客户端下载 JS，然后注水加交互；SSG、ISR 和 RSC 都是基于 SSR 的不同形式。

SSG 是 SSR 的预处理版本，他会在编译时运行 SSR，产出 HTML，这样就不需要等用户请求过来之后再渲染 HTML 了。有个比喻是热菜和预制菜的区别。SSR 像热菜，比如你点了红烧肉，厨师会切肉开始烧，20 分钟后，一盆红烧肉出现在你的面前；SSG 则像预制菜，当你点了红烧肉，厨师会拿出提前制作好的红烧肉预制菜，这是通用的，不能定制，优点是快，过 2 分钟热好你就能吃了。

ISR 全称 Incremental Static Regeneration，翻译成增量静态增生，是 SSR 与 SSG 的结合体。当用户第一次请求一个特定的页面时，服务器将生成 HTML 并将其发送给用户，这与 SSR 相同。不同的是，它把生成的 HTML 存起来。下一次有人请求同一个页面时，会自动提供预先生成的HTML，这与 SSG 相同。为了防止文件过期，通常会设置一个过期时间让 HTML 重新生成。

![](https://img.alicdn.com/imgextra/i1/O1CN01JviZif1jH7rcHADrX_!!6000000004522-2-tps-1654-942.png)  
RSC（比 SSR 稍微短一点）

RSC 在 [308 - 《RSC 初印象》](https://sorrycc.com/rsc-first-impression) 写过，是在 SSR 的基础上提供 Server Component 的能力，用 Component 的方式写 Server 逻辑，有点类似 PHP 。除了功能上提供的能力之外，RSC 额外的好处是让 Server 需要传递给 Client 的 JS 尺寸更小，从而提升产品性能。一个极端的例子是 [Bright](https://bright.codehike.org/)，这是 RSC 版的高亮库，通过在 Server 侧实现高亮代码的转化，客户端所需要做的事就少了，可以少下载几 M 的 JS 文件。

**2、最简 Next.js Template。**

一键初始化一个最简 Next.js 项目。

```bash
cat <<EOF >package.json
{
  "name": "hello-next",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "13.4.0",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
EOF
mkdir src && mkdir src/app
cat <<EOF > src/app/layout.js
import React from 'react';
import './styles.css';
function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
export default RootLayout;
EOF
cat <<EOF > src/app/page.js
import React from 'react';
function Home() {
  return (
    <main>
      <h1>Hello Next!</h1>
    </main>
  );
}
export default Home;
EOF
cat <<EOF > src/app/styles.css
body {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 16px;
  min-height: 100%;
  font-family: sans-serif;
  background: hsl(0deg 0% 95%);
  color: hsl(0deg 0% 10%);
}
main {
  width: 100%;
  max-width: 800px;
  padding: 16px 24px;
  margin: 0px auto;
  border: 1px solid hsl(0deg 0% 50% / 0.3);
  border-radius: 2px;
  background: white;
}
footer {
  width: 100%;
  font-size: 0.875rem;
  color: hsl(0deg 0% 30%);
  text-align: center;
  padding: 32px 0px;
}
EOF
pnpm i
pnpm dev
```

总共 4 个文件，其中 layout.js 是全局路由，page.js 是首页，styles.css 是全局样式。

2023.5.4 发布的 Next.js 13.4 开始支持 App Router。如果你翻其他文章看到 /pages 目录、`_app.js`、`_document.js`、`getServerSideProps` 和 `getServerSideProps` 等关键词，那都是老的版本 Next.js 的功能，要注意区分。

**3、RSC。**

Next.js 13.4 开始也默认支持 RSC，所以会有 Server Component 和 Client Component 两种形式。默认是 Server Component，加 `use client;` 会切换到 Client Component。

举几个常见问题。

1）用上 RSC 后你肯定会遇到的一个问题是，Client Component 里是不能套 Server Component 的，反之则可以。为啥不可以？因为 Client Component 会在客户端渲染，re-render 时如果执行到 Server Component 的逻辑，就可能会报错，所以 React 从方案上就不允许这么操作。那如果一定要套，应该怎么办？比如。

```tsx
// 渲染 ClientComponent，但是 ClientComponent 里如果包含 ServerComponent 就会报错
<ClientComponet />
function ClientComponent() {
  return <ServerComponent />;
}
```

组装式是很多问题的解，只要让 ServerComponent 不属于 ClientComponent 就可以了。比如。

```tsx
<ClientComponent><ServerComponent /><ClientComponent />
function ClientComponent(props) {
  return <div>{props.children}</div>;
}
```

2）Server Component 虽然能套 Client Component。但另一个大家都会遇到的问题是 Client Component 里用了比如 window 这种 Node 里不存在的接口时就会报错。怎么办？比如。

```tsx
'use client';

function Foo() {
  const [count] = useState(window.localStorage.getItem('count'));
  return <div>{count}</div>;
}
```

解法是把 window 相关逻辑放在 useEffect 里，因为 Server Component 不跑 useEffect。

```tsx
function Foo() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(Number(window.localStorage.getItem('count')));
  }, []);
  return <div>{count}</div>;
}
```

这里会导致一个新问题，即闪烁，页面会先渲染 0，再渲染 localStorage 中获取到的值。这没太好的解法，目前的解是加 Spinner。比如。

```tsx
function Foo() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    setCount(Number(window.localStorage.getItem('count')));
  }, []);
  if (count === null) return <Spinner />;
  return <div>{count}</div>;
}
```

3）Hydration Mismatch 问题。即 Server 和 Client 的结果不同，导致 Hydration（注水）失败。举个典型的 Clock 问题。

```tsx
function Foo() {
  const date = useState(new Date());
  return <div>{format(date, 'hh:mm:ss.S')}</div>;
}
```

这里的 date 在 client 和 server 时拿到的值肯定是不同的，因为执行时肯定是不同的时间点了，所以必然会导致 Mismatch。解法是前一个问题类似，在 useEffect 里初始化 date，然后接着会怎样？会遇到闪烁问题。怎么解？用 Spinner 。

其实还有个解，就是用 suppressHydrationWarning 属性禁用 Hydration Mismatch 警告。但是要注意，1）只能用于 text node，2）hydration 时，client 不匹配的内容不会替换 server 的内容。

4）响应式问题。如果你用 react-responsive 来做响应式，他里面肯定会用到 window 去识别 media query，但这在 Node 下是跑不通的。所以会遇到 window undefined 的问题。解法是啥？用 CSS！哈哈，响应式用 CSS 就够用了。

5）TODO。

参考：  
[https://courses.joshwcomeau.com/joy-of-react/06-full-stack-react](https://courses.joshwcomeau.com/joy-of-react/06-full-stack-react)
