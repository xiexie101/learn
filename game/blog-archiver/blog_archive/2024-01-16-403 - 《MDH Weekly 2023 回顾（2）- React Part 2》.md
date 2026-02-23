---
title: "403 - 《MDH Weekly 2023 回顾（2）- React Part 2》"
date: 2024-01-16
url: https://sorrycc.com/mdh-2023-review-2-react
---

发布于 2024年1月16日

# 403 - 《MDH Weekly 2023 回顾（2）- React Part 2》

> 年底了，做下 MDH Weekly 一年的文章回顾。我把今年周刊里的文章重新理了一遍，删选了觉得目前看仍旧有价值的文章，做了下分类并重新翻了一遍。这篇是关于 React 的部分。

1、关于 React 组件组织和拆分。几个思路，1）提取子组件以拆分视图，2）提取非视图逻辑到 hooks，3）提取领域模型以封装逻辑。但也要注意别过度抽象，个人感觉文中的抽象有些过，线性的逻辑更适合阅读。详见 [https://martinfowler.com/articles/modularizing-react-apps.html](https://martinfowler.com/articles/modularizing-react-apps.html)

![](https://img.alicdn.com/imgextra/i4/O1CN010es8q11jsgOqUwdXG_!!6000000004604-2-tps-4506-2584.png)

2、关于组件组织。好的组织方式有这些优点，1）易于追踪的数据流，2）封装良好的组件，3）良好的渲染性能。一些点，1）避免属性钻取（prop drilling），2）Slotted Components，组件可以让父组件决定如何在它们内部放置内容，3）注意 Parent 和 Owner 的区别，Parent 是树结构的上下级，Owner 表示由谁渲染，可能跨很多 Parent 级，4）通过提升组件来扁平化拥有者层级，可以使数据流更短，从而实现更好的组件封装。详见 [https://julesblom.com/writing/parents-owners-data-flow](https://julesblom.com/writing/parents-owners-data-flow)

![](https://img.alicdn.com/imgextra/i1/O1CN01p5ohJu1cDjgBMPA2z_!!6000000003567-2-tps-2406-1080.png)

2、关于 Suspense 在 CSR、SSR 和 Server Components 下的应用。1）CSR，在 React.lazy 加载时显示一个回退界面，以及在兼容 Suspense 的框架里声明式地处理加载和错误状态；2）SSR，在 CSR 的基础上，在 `<Suspense />` 中包装的服务器端渲染组件在客户端上选择性地进行 hydration；3）Server Components，在 SSR 的基础上，在 `<Suspense />` 中包装的异步服务器组件分阶段地流式传输到客户端。详见 [https://elanmed.dev/blog/suspense-in-different-architectures](https://elanmed.dev/blog/suspense-in-different-architectures)

3、关于 React 常见陷阱。文章介绍 9 种常见陷阱，包括：使用零进行条件判断、直接修改状态、未生成 key、缺少空格、在更改状态后访问它、返回多个元素、从不受控制到受控制的转换、缺少样式括号和异步效果函数。对于每种陷阱，文章都提供了解决方法，并给出了示例代码。详见 [https://www.joshwcomeau.com/react/common-beginner-mistakes/](https://www.joshwcomeau.com/react/common-beginner-mistakes/)

4、关于 Parent 和 Owner 树。1）React 运行时有两种树，Parent 和 Owner，前者是渲染后的树，后者是一种渲染的方式，不同的 Owner 树可以生成相同的 Parent 树；2）插槽组件是影响 Owner 树，比如 `App` 组件里有 `<Foo><Bar /></Foo>`，Bar 的 Parent 是 Foo，Owner 是 App，3）Owner 树会影响数据流的长短，以及性能，提升 Owner 是解 re-render 问题的一大神器。详见 [https://julesblom.com/writing/parents-owners-data-flow](https://julesblom.com/writing/parents-owners-data-flow)

5、关于自定义 Hooks。这篇文章介绍了 20 多个自定义 hooks，覆盖常用交互逻辑，对提高代码复用性和可读性有帮助。hooks 包括使用数组、异步操作、点击检测、复制文本、暗黑模式、防抖、Geolocation、悬停检测、长按检测、媒体查询、在线状态、元素在屏幕内检测、Previous 状态、渲染计数、加载脚本、历史状态、有校验的状态、存储、定时器、切换状态等。详见 [https://habr.com/en/articles/746760/](https://habr.com/en/articles/746760/)

6、关于 React 源码调试。如果你是 React 源码新手，这篇文章可以让你起步，从 Debug 一个测试用例开始。基本步骤是，1）git clone，2）配置 lauch.json，3）指定要测试文件和用例，4）启用源码映射，5）调整 Jest 超时时间，6）跑 Debug。详见 [https://andreigatej.dev/blog/react-debugging-the-source-code/](https://andreigatej.dev/blog/react-debugging-the-source-code/)

7、关于 React 渲染模式。文章介绍了各种渲染模式的问题以及 React 18 的解。1）CSR，问题是白屏时间长、请求瀑布流和 SEO，2）SSR，问题是 TTFB 慢、首屏快但交互依旧慢，3）流式 SSR 有 React 16 的 renderToNodeStream 和 React 18 的 renderToPipeableStream，后者利用 Suspense 解锁了新功能，服务端流式 + 客户端选择性水合，提升 TTFB 的同时也可以让静态资源加载提前，4）服务端组件，在流式 SSR 的基础上进一步减少客户端 JavaScript 尺寸。详见 [https://prateeksurana.me/blog/future-of-rendering-in-react/](https://prateeksurana.me/blog/future-of-rendering-in-react/)

8、关于 Next.js vs. Remix。1）路由，都是约定式路由，个人更倾向 Remix 的，更直观，能一眼看出路由结构，2）数据获取，RSC vs. Loader + Action，个人更倾向 RSC，在产物尺寸和 DX 上都更胜一筹，3）流，Suspense vs. defer + Await，更倾向 Next.js 的 Suspense 流，4）数据突变，都是基于 action。详见 [https://prateeksurana.me/blog/nextjs-13-vs-remix-an-in-depth-case-study/](https://prateeksurana.me/blog/nextjs-13-vs-remix-an-in-depth-case-study/)

9、关于 React 18 的性能提升。适合 React 18 新手阅读，包括并发模式、Transition API、服务端组件、增强的 Suspense。详见 [https://vercel.com/blog/how-react-18-improves-application-performance](https://vercel.com/blog/how-react-18-improves-application-performance)

参考：  
[392 - 《MDH Weekly 2023 回顾（1）- React Part 1》](https://sorrycc.com/mdh-2023-review-1-react)
