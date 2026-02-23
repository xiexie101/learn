---
title: "译：CSS in React Server Components"
date: 2024-04-16
url: https://sorrycc.com/css-in-rsc
---

发布于 2024年4月16日

# 译：CSS in React Server Components

> 原文：[https://www.joshwcomeau.com/react/css-in-rsc/](https://www.joshwcomeau.com/react/css-in-rsc/)  
> 作者：Josh W Comeau  
> 译者：ChatGPT 4 Turbo

**编者注：RSC 时代应该如何使用 CSS-in-JS？由于 RSC 没有 useContext，styled-components/emotion 基于 useContext 的运行时实现已不能作为 server 组件使用，这会降低 server 组件覆盖率，从而让 RSC 带来的产物尺寸减少效果打折。解法是用编译时的 zero-runtime 的 CSS-in-JS 代替，作者推荐了 Linaria 和 Pigment CSS，后者由 Meterial UI 打造。**

去年这个时候，Vercel 宣布 Next 13.4 的稳定版本发布，成为第一个基于 _React 服务器组件（React Server Components）_ 构建的 React 框架。

![](https://img.alicdn.com/imgextra/i4/O1CN015IUOX31OeO8kFTtoH_!!6000000001730-2-tps-1328-1050.png)

这是个大事情！RSC （React 服务器组件）为我们提供了一个官方方式，在 React 中编写 _服务器专属代码_。这为我们打开了许多有趣的新大门。

但是，你不打破几个鸡蛋就不可能做成煎蛋卷。RSC 是对 React 工作方式的根本变化，一些我们一直在使用的库和工具已经变得杂乱无章了。😅

令人担忧的是，最流行的 CSS-in-JS 库，如 💅 styled-components 和 Emotion 与 React 的这种新愿景不完全兼容，并且真的没有一个清晰的前进路径。

过去几个月，我一直在研究这个问题，建立对兼容性问题的理解，并了解了可行的选项。到目前为止，我觉得我对整个状况有了相当扎实的掌握。我还发现了一些在雷达下飞行的非常令人兴奋的发展。✨

如果你使用一个 CSS-in-JS 库，我希望这篇博客文章能够帮助你消除许多困惑，并且为你提供一些实际的选项。

即使你 _不_ 使用 CSS-in-JS 库，这篇博客文章仍然应该帮助你加深对 React 服务器组件的理解。我们在这里将会覆盖的许多问题并不是特定于 CSS-in-JS 的！

> **就使用 \_\_\_\_\_\_\_\_\_\_。**
> 
> 每当这个讨论在线上出现时，最常见的建议之一就是切换到不同的 CSS 工具。毕竟，在 React 生态系统中选项不少！
> 
> 然而，对我们许多人来说，这并不是一个实际的建议。在我的博客和课程平台中，我有超过 5,000 个 styled 组件。迁移到一个完全不同的工具，说起来容易做起来难。
> 
> 老实说，即使我 _能_ 魔法般地换用一个完全不同的库，我也不愿意。我真的很喜欢 `styled` API！
> 
> 在本篇博客文章的后面部分，我们将讨论一些其他的 CSS 库，但我们将重点关注与 styled-components 有类似 API 的选项。

## 理解 React 服务器组件

为了理解兼容性问题，我们需要了解 React 服务器组件。不过，在此之前，我们需要确保我们理解了 _服务器端渲染_（SSR）。

SSR 是一个涵盖多种不同策略和实现的总称，但它最典型的版本是这样的：

1.  用户访问我们的 web 应用。
2.  请求被 Node.js 接收，它在一个无窗口的服务器环境中运行 React。它渲染我们的应用并生成一个包含所有初始 UI 的完整 HTML 文档。
3.  当这个 HTML 文档在用户设备上加载时，React 将重新渲染所有相同的组件，重复服务器上完成的工作。然而，它不会生成 _新的_ HTML 元素，而是“采用”服务器生成的 HTML 元素。这就是所谓的 _水合作用_。

React 需要在用户的设备上运行以处理交互性。服务器生成的 HTML 是完全静态的；它不会包含我们编写的任何事件处理程序（例如 `onClick`），也不能捕获我们指定的任何 refs（使用 `ref` 属性）。

**好的，但为什么它必须重新做所有完全相同的工作？** 当 React 在用户的设备上启动时，它会发现一堆现成的 UI，但它不会对它有任何 _上下文_ 了解，比如哪个组件拥有每个 HTML 元素。React 需要执行完全相同的工作来重构组件树，这样它才能正确地连接现有的 HTML，将事件处理程序和 refs 附加到正确的元素上。React 需要为自己绘制一张地图，这样它才能从服务器停止的地方继续。

**这个模型有一个很大的局限性。** 我们编写的所有代码都将在服务器 _和_ 客户端上执行。没有办法创建只在服务器上渲染的组件。

假设我们正在构建一个全栈 Web 应用程序，数据库中有数据。如果你来自 PHP 这样的语言，你可能会期望能够做类似这样的事情：

```jsx
function Home() {
  const data = db.query('SELECT * FROM SNEAKERS');

  return (
    <main>
      {data.map(item => (
        <Sneaker key={item.id} item={item} />
      ))}
    </main>
  );
}
```

理论上，这段代码在服务器上运行的可能会很好，但是 _同样的代码_ 将在用户的设备上重新执行，这就是问题所在，因为客户端的 React 将无法访问我们的数据库。没有办法告诉 React “仅在服务器上运行这段代码，并在客户端重用结果数据”。

基于 React 的元框架提出了它们自己的解决方案。例如，在 Next.js 中，我们可以这样做：

```jsx
export async function getServerSideProps() {
  const data = await db.query('SELECT * FROM SNEAKERS');

  return {
    props: {
      data,
    },
  };
}

function Home({ data }) {
  return (
    <main>
      {data.map(item => (
        <Sneaker key={item.id} item={item} />
      ))}
    </main>
  );
}
```

Next.js 的团队说：“好吧，既然 _React_ 代码必须在服务器和客户端上运行……但我们可以添加一些 _额外的_ 代码，仅在服务器上运行的代码！”

当 Next.js 服务器收到请求时，它会首先调用 `getServerSideProps` 函数，无论它返回什么都将作为 props 传给 React 代码。同样的 _React_ 代码在服务器和客户端上运行，所以没有问题。很聪明，对吧？

老实说，即使是今天，我也非常欣赏这种方法。但它确实有点像是一种变通办法，之所以创建这个 API，是因为 React 的限制。它也只能在 _页面_ 级别工作，在每个路由的最顶部；我们不能随随便便地放一个 `getServerSideProps` 函数。

**React 服务器组件为这个问题提供了一个更直观的解决方案。** 通过 RSC，我们可以直接在 React 组件中进行数据库调用和其他仅限服务器的工作：

```jsx
async function Home() {
  const data = await db.query('SELECT * FROM SNEAKERS');

  return (
    <main>
      {data.map(item => (
        <Sneaker key={item.id} item={item} />
      ))}
    </main>
  );
}
```

在 “React 服务器组件” 范式中，组件默认为 _服务器组件_。服务器组件仅在服务器上运行。这些代码将 _不会_ 在用户的设备上重新运行；代码甚至不会包含在 JavaScript 包里！

这一新范式还包括了 _客户端组件_。客户端组件是在 _服务器和客户端_ 都运行的组件。你在 “传统的”（RSC 之前的）React 中写过的每一个 React 组件都是客户端组件。**这是旧事物的新名称。**

我们通过在文件顶部使用新的 `"use client"` 指令来选择性地使用客户端组件：

```jsx
'use client';

function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      计数：{count}
    </button>
  );
}
```

这个指令创建了一个 “客户端边界”；这个文件中的所有组件，以及任何导入的组件，都将作为客户端组件渲染，先在服务器上运行，然后再在客户端上运行。

与 React 的其他特性（例如，hooks）不同，React 服务器组件需要与打包工具深度集成。在我写这篇文章的 2024 年 4 月，使用 React 服务器组件的唯一实际方式是通过 Next.js，尽管我预计将来这一情况会有所变化。

### 服务器组件是有限的

理解服务器组件的关键是它们并不提供 “完整的” React 体验。大多数 React API 在服务器组件中不起作用。

例如，`useState`。当状态变量发生变化时，组件会重新渲染，但服务器组件 _不能_ 重新渲染；它们的代码甚至从未被发送到浏览器，因此 React 也不会知道如何处理状态的改变。从 React 的视角来看，服务器组件生成的任何标记都是固定的，无法在客户端进行更改。

同样，我们也不能在 Server Components 内使用 `useEffect`，因为 Effect 在服务器上不会运行，它们只会在客户端渲染之后运行。而且由于 Server Components 被排除在我们的 JavaScript 包之外，客户端的 React 永远不会知道我们编写了 `useEffect` 钩子。

即便是 `useContext` 钩子也不能在 Server Components 内使用，因为 React 团队还没有解决 React 上下文如何在 Server Components 和 Client Components 之间共享的问题。

**这是我的看法：** Server Components 实际上并不是 _真正的_ React 组件，至少不是我们传统意义上理解的那样。它们更像是 PHP 模板，由服务器渲染以创建原始的 HTML。真正的创新是 Server Components 和 Client Components 可以在同一个应用程序中共存！

> **深入探讨**
> 
> 在这篇博客文章中，我想关注 React Server Components 的最相关细节，我们需要知道这些以理解与 CSS-in-JS 框架的兼容性问题。
> 
> 不过，如果你想更深入了解 React Server Components，我有一篇单独的博客文章，可以在更深层次上探索这个新世界：
> 
> [“理解 React Server Components”](https://www.joshwcomeau.com/react/server-components/)

## CSS-in-JS 库是如何工作的

好的，我们已经介绍了 React Server Components 的基础知识。现在，让我们谈谈像 💅 styled-components 这样的 CSS-in-JS 库的基础知识！

这里有一个简单的例子：

```jsx
import styled from 'styled-components';

export default function Homepage() {
  return (
    <BigRedButton>
      点我！
    </BigRedButton>
  );
}

const BigRedButton = styled.button`
  font-size: 2rem;
  color: red;
`;
```

我们不是将 CSS 放在像 `.red-btn` 这样的类中，而是将那些 CSS 关联到一个新生成的 React 组件上。这就是 styled-components 特别之处；_组件_ 是可复用的基元，而不是类。

`styled.button` 是一个动态生成新的 React 组件的函数，我们将这个组件分配给了一个名为 `BigRedButton` 的变量。然后我们可以像使用任何其他 React 组件一样使用它。它将渲染一个具有大号红色文本的 `<button>` 标签。

但是这个库到底是如何将这些 CSS 应用到这个元素上的呢？我们有三个主要的选项：

1.  可以通过 `style` 属性将样式内联应用。
2.  可以将样式放在一个单独的 CSS 文件中，并通过 `<link>` 加载。
3.  可以将样式放在 `<style>` 标签中，通常位于当前 HTML 文档的 `<head>` 中。

如果我们运行这段代码并检查 DOM，答案就揭晓了：

```html
<html>
  <head>
    <style data-styled="active">
      .abc123 {
        font-size: 2rem;
        color: red;
      }
    </style>
  </head>

  <body>
    <button className="abc123">
      点击我！
    </button>
  </body>
</html>
```

styled-components 会将提供的样式写入库管理的 `<style>` 标签。为了将这些样式连接到这个特定的 `<button>`，它生成了一个独特的类名 `"abc123"`。

所有这些工作首先发生在 React 的初始渲染期间：

*   在客户端渲染上下文中（例如 Parcel、create-react-app），`<style>` 标签会动态地在用户的设备上生成，就像 React 创建的所有 DOM 节点一样。
*   在服务器端渲染上下文中（例如 Next、Remix），这项工作发生在服务器上。生成的 HTML 文档将包含这个 `<style>` 标签。

随着用户与我们的应用程序交互，某些样式可能需要被创建、修改或销毁。比如，假设我们有一个条件渲染的 styled-component：

```jsx
function Header() {
  const user = useUser();

  return (
    <>
      {user && (
        <SignOutButton onClick={user.signOut}>
          退出登录
        </SignOutButton>
      )}
    </>
  );
}

const SignOutButton = styled.button`
  color: white;
  background: red;
`;
```

最初，如果 `user` 是未定义的，`<SignOutButton>` 将不会渲染，因此这些样式也不会存在。后来，如果用户登录了，我们的应用程序将重新渲染，styled-component 将开始运作，将这些样式注入 `<style>` 标签。

本质上，每个 styled component 都是一个普通的 React 组件，但是有一个额外的小副作用：**它们也会将它们的样式渲染到 `<style>` 标签中。**

对于我们今天的目的来说，这是最重要的收获，但如果你想更深入地了解这个库的内部工作原理，我写了一篇关于它的博客文章，名为 [《揭秘样式化组件》](https://www.joshwcomeau.com/react/demystifying-styled-components/)。

## 问题的症结所在

总结我们迄今为止学到的内容：

*   “React 服务器组件”是 React 的一个新范式，它为我们提供了一种新的组件类型，即 _服务器组件_。服务器组件仅在服务器上进行渲染。它们的代码甚至不包含在我们的 JS 包中。
*   styled-components 库允许我们动态地创建带有附加 CSS 的 React 组件。它通过管理一个随着组件重新渲染而更新的 `<style>` 标签来起作用。

根本的不兼容在于，styled-components 设计用于在浏览器中运行，而服务器组件从不接触浏览器。

在内部，styled-components 重度使用 `useContext` 钩子。它本意是绑定到 React 生命周期中，但服务器组件对于 _没有_ React 生命周期。因此，如果我们想在这个新的 “React 服务器组件”世界中使用 styled-components，每一个渲染 _哪怕一个_ styled-component 的 React 组件都需要成为一个客户端组件。

我不知道你怎么看，但对我来说，很少有 React 组件 _不_ 包含任何样式。我估计我组件文件中 90% 以上使用 styled-components。这些组件中的大多数其他方面都是完全静态的；它们不使用状态或任何其他客户端组件功能。

这很糟糕，因为这意味着我们不能充分利用这一新范式……**但这实际上并非世界末日。**

如果我能改变 React 服务器组件的一件事，那就是 “客户端组件”这个名字。这个名字暗示这些组件 _仅_ 在客户端上渲染，但这并不是真的。记住，“客户端组件”其实是一个新名字，用于一个旧事物。2023 年 5 月之前创建的每一个 React 应用中的每一个 React 组件，都是一个客户端组件。

因此，即使在一个使用 styled-components 的应用程序中只有 10% 的组件能成为服务器组件，_这仍然是一个进步！_ 我们的应用程序将变得比在前 RSC（React Server Components）时代更轻量、更快。**我们仍然能获得 SSR（服务器端渲染）的所有好处。这一点没有改变。**

> **他们不能更新吗？**
> 
> 你可能会想，为什么 styled-components / Emotion 的维护者们还没有更新他们的库使其与 React 服务器组件兼容。我们已经知道这将要来临超过一年了，他们为什么还没有找到解决方案？？
> 
> styled-components 的维护者目前受到了 React 中缺失 API 的限制。具体来说，React 还没有提供一个对 RSC 友好的 Context（上下文）替代品，而 styled-components 需要\_某种\_方式在组件之间共享数据，以便在服务器端渲染期间正确应用所有样式。
> 
> 几周前，我进行了一些[相当深入的探索](https://github.com/joshwcomeau/dream-css-tool)，老实说，我很难想象在没有 React Context 的情况下，这如何可能做到。就我所知，唯一的解决方案将是完全重写整个库，使用一种完全不同的方法。这不仅会造成重大的破坏性变化，也是完全不合理的，期望一个由志愿者组成的开源维护团队去做这件事。
> 
> 如果你想了解更多，有一个 [styled-components Github 问题](https://github.com/styled-components/styled-components/issues/3856#issuecomment-1591947905)，解释了这些阻碍是什么。我在 Emotion 仓库中也看到了类似的讨论。

## 零运行时 CSS-in-JS 库的世界

到目前为止，故事似乎有些严峻。React 服务器组件和 styled-components 之间\_存在\_一种根本的不兼容性，而库的维护人员没有被赋予他们需要的工具去添加支持。

**幸运的是，React 社区并没有对这个问题视而不见！** 几个正在开发的库提供了类似于 styled-components 的 API，但完全兼容 React 服务器组件！✨

与其被 React 生命周期所束缚，这些工具采取了不同的方法；所有处理都在 _编译时_ 完成。

现代 React 应用程序有一个构建步骤，在这个步骤中，我们将 TypeScript/JSX 转换为 JavaScript，并且将数千个独立文件打包成少数几个包。这项工作是在我们的应用程序部署时完成的，也就是说，在它开始在生产环境中运行之前。**为什么不在这个步骤期间处理我们的样式化组件，而不是在运行时呢？**

这就是我们在本节中将讨论的所有库的核心思想。让我们深入了解一下！

### Linaria

[Linaria](https://github.com/callstack/linaria) 创建于遥远的 _2017 年_。它几乎与 styled-components 一样古老！

API 看起来与 styled-components 一模一样：

```jsx
import styled from '@linaria/react';

export default function Homepage() {
  return (
    <BigRedButton>
      点击我！
    </BigRedButton>
  );
}

const BigRedButton = styled.button`
  font-size: 2rem;
  color: red;
`;
```

\*\*这里有个非常巧妙的地方：\*\*在编译步骤期间，Linaria 会转换这段代码，并将所有的样式移到 [CSS 模块](https://github.com/css-modules/css-modules) 中。

运行 Linaria 后，代码会看起来像这样：

```css
/* /components/Home.module.css */
.BigRedButton {
  font-size: 2rem;
  color: red;
}
```

```jsx
/* /components/Home.js */
import styles from './Home.module.css';

export default function Homepage() {
  return (
    <button className={styles.BigRedButton}>
      点击我！
    </button>
  );
}
```

如果你还不熟悉 CSS 模块，它是对 CSS 的轻量级抽象。你可以几乎将它视为普通 CSS，但你不必担心全局唯一的名称。在编译步骤中，就在 Linaria 施展魔法后不久，像 `.BigRedButton` 这样的通用名称会被转换为独一无二的名称，比如 `.abc123`。

\*\*重要的是，CSS 模块已经被广泛支持。\*\*这是目前最受欢迎的选项之一。像 Next.js 这样的元框架已经对 CSS 模块提供了一流的支持。

因此，Linaria 团队决定不要重新造轮子，也不要花费多年时间构建一个稳健的、生产就绪的 CSS 解决方案。我们可以编写 styled-components，Linaria 会在预处理阶段将它们转换成 CSS Modules，然后再处理成纯 CSS。所有这一切都发生在编译时。

> **运行时与编译时的取舍**
> 
> 在 RSC 成为热点之前很久，社区已经在构建编译时库，如 Linaria。性能上的优势是引人注目的：styled-components 会给我们的 JavaScript 捆包增加 11kb（gzip 压缩后的大小），但 Linaria 增加的是 0kb，因为所有工作都提前完成了。此外，服务器端渲染也有所加快，因为我们不必花时间收集和应用样式。
> 
> 话虽如此，styled-components 的运行时并不是无用的负担。有些事情是 styled-components 能做到的，编译时则不可能实现。例如，当一些 React 状态发生变化时，styled-components 能够动态更新 CSS。
> 
> 幸运的是，自从 styled-components 首次创建以来的近十年间，CSS 已经变得更加强大。我们可以使用 CSS 变量来处理大多数动态场景。如今来看，在某些情况下，有一个运行时可以提供稍微更好的开发者体验，但我认为，它已不再是真的必需。
> 
> 这 _确实_ 意味着 Linaria 和其他编译时的 CSS-in-JS 库不会真正成为 styled-components/Emotion 的无缝替代品。我们将不得不花些时间重新设计动态组件。但与切换到完全不同的 CSS 工具相比，这只是一小部分工作。

#### 迁移到 Linaria

那么，我们是否应该将我们的 styled-components 应用迁移到 Linaria？

不幸的是，这里有个问题。虽然 Linaria 本身得到了积极的维护，但还没有官方的 Next.js 绑定，而且让 Linaria 与 Next.js 协同工作不是一件简单的事。

最受欢迎的集成 [next-linaria](https://github.com/Mistereo/next-linaria) 已经有 3 年没有更新了，且不兼容 App Router / React Server Components。有一个较新的选择 [next-with-linaria](https://github.com/dlehmhus/next-with-linaria)，但它带有一个大大的警告，不建议在生产中使用。😅

所以，虽然这对于冒险的开发者来说可能是一个选择，但我并不真的觉得自己能够舒服地推荐这个。

### Panda CSS

![](https://img.alicdn.com/imgextra/i2/O1CN010iSABh1Oqkpvy1syR_!!6000000001757-2-tps-370-479.png)

[Panda CSS](https://github.com/chakra-ui/panda) 是由 Chakra UI 的开发团队开发的现代 CSS-in-JS 库，Chakra UI 是一个流行的组件库。

Panda CSS 有许多不同的界面。你可以像使用 Tailwind 那样，指定简写类名，如 `mb-5`。你也可以像使用 Stitches 那样，使用变体和 cva。或者，你也可以像使用 styled-components 那样。

以下是使用 `styled` API 的样子：

```jsx
import { styled } from '../styled-system/jsx'

export default function Homepage() {
  return (
    <BigRedButton>
      点我！
    </BigRedButton>
  );
}

const BigRedButton = styled.button`
  font-size: 2rem;
  color: red;
`;
```

像 Linaria 一样，Panda CSS 会被编译掉，但它会编译成 _Tailwind 风格的工具类_。最终结果会看起来像这样：

```css
/* /styles.css */
.font-size_2rem {
  font-size: 2rem;
}
.color_red {
  color: red;
}
```

```jsx
/* /components/Home.js */
export default function Homepage() {
  return (
    <button className="font-size_2rem color_red">
      点我！
    </button>
  );
}
```

对于每个独特的 CSS 声明，比如 `color: red`，Panda CSS 会在一个中心 CSS 文件中创建一个新的工具类。然后这个文件会在 React 应用的每个路由中被加载。

我真的很想喜欢 Panda CSS。它是由一个经验丰富、团队扎实的团队开发的，它提供了熟悉的 API，他们甚至还有一个可爱的滑板熊猫吉祥物！

不过，在试验它之后，我发现它不适合我。我遇到的一些问题是琐碎的/表面的；例如，Panda CSS 生成了一堆 _东西_，这些东西弄得项目文件很杂乱。对我来说感觉有点乱，但归根结底这不是一个大问题。

对我来说更大的问题是，Panda CSS 缺少一个关键特性。**我们无法跨组件引用。**

通过一个例子来解释会更容易。在这个博客上，我有一个 `TextLink` 组件，它是对 Next.js 的 `Link` 组件的一个样式包装器。默认情况下，它看起来是这样的：

*   [这是一个示例链接](https://www.joshwcomeau.com/react/css-in-rsc/)

然而，这个相同的组件具有一些 _上下文_ 的风格。例如，当 `TextLink` 在 `Aside` 中时，它看起来是这样的：

[这是一个示例链接](https://www.joshwcomeau.com/react/css-in-rsc/)

我使用这个 `Aside` 组件为了放置与主题有关但又不是主要内容的信息。我发现默认的 `TextLink` 样式在这个场景中并不合适，因此我想要应用一些覆盖样式。

这是我们在 styled-components 中表达这种关系的方式：

```jsx
import Link from 'next/link';

import { AsideWrapper } from '@/components/Aside';

const TextLink = styled(Link)`
  color: var(--color-primary);
  text-decoration: none;

  ${AsideWrapper} & {
    color: inherit;
    text-decoration: underline;
  }
`;
```

和号字符（`&`）最近被添加到 CSS 语言中，作为 [正式嵌套语法](https://developer.mozilla.org/en-US/docs/Web/CSS/Nesting_selector) 的一部分，但在 CSS 预处理器和工具中已经是多年的传统了。在 styled-components 中，它评估当前选择器。

当渲染这段代码时，生成的 CSS 看起来可能是这样的：

```css
.textlink_abc123 {
  color: var(--color-primary);
  text-decoration: none;
}

.aside_def456 .textlink_abc123 {
  color: inherit;
  text-decoration: underline;
}
```

当我使用 CSS 时，我会试着遵循一个规则：_一个特定组件的所有样式都应该写在一个地方。_ 我不应该需要在应用程序各处寻找可能适用于某个元素的所有不同的 CSS！

这是 Tailwind 如此强大的原因之一；所有的样式都放置在一起，就在元素本身。我们不必担心其他组件“伸手进来”并对它不拥有的元素进行样式设置。

\*\*这种模式就像是加强版的那个观点。\*\*我们不仅列出了所有默认适用于 `TextLink` 的样式，还列出了 _上下文_ 适用的样式。它们都集中在反引号之间的同一个位置。

遗憾的是，这种模式在 Panda CSS 中不起作用。在 Panda CSS 中，我们唯一识别的是 CSS 声明，而不是元素本身，因此无法表达这类关系。

如果你对这种模式不感兴趣，那么 Panda CSS 可能是你应用程序的一个好选择！但对我来说，这是一个决定性的因素。

> **styled-components 的幸福之路**
> 
> 如果你想了解更多关于这种“上下文样式”的模式，我在我的博客文章中有深入的讨论，[“styled-components 的幸福之路”](https://www.joshwcomeau.com/css/styled-components/)。这是我在多年使用 styled-components 后学到的模式和技巧的汇集。

### Pigment CSS

最受欢迎的 React 组件库之一，[Material UI](https://mui.com/material-ui/)，是基于 Emotion 构建的。他们的开发团队一直在同 RSC 兼容性相关的所有同样的问题作斗争，并且他们决定要对此采取行动。

他们最近开源了一个新库。它叫做 [Pigment CSS](https://github.com/mui/material-ui/tree/master/packages/pigment-css-react)。它的 API 此时看起来应该相当熟悉了：

```jsx
import { styled } from '@pigment-css/react';

export default function Homepage() {
  return (
    <BigRedButton>
      点击我！
    </BigRedButton>
  );
}

const BigRedButton = styled.button`
  字体大小：2rem;
  颜色：红色;
`;
```

Pigment CSS 在编译时运行，并且它采用与 Linaria 相同的策略，编译成 CSS Modules。Next.js 和 Vite 都有插件。

实际上，它使用了一个名为 [WyW-in-JS](https://github.com/Anber/wyw-in-js) (“What you Want in JS”) 的底层工具。这个工具是从 Linaria 代码库中发展而来的，它将“编译成 CSS Modules”的业务逻辑独立出来，并使之通用，以便像 Pigment CSS 这样的库能够在其基础上构建自己的 API。

诚然，我觉得这个方案简直完美。CSS 模块设计经过了充分的实战检验，并进行了高度优化。而且据我目前所见，Pigment CSS 表现出色，具有出色的性能和开发体验。

Material UI 的下一个主要版本将支持 Pigment CSS，并计划最终完全停止对 Emotion/styled-components 的支持。因此，Pigment CSS 很可能会成为最广泛使用的 CSS-in-JS 库之一。在 NPM 上，Material UI 每周的下载量大约有 500 万次，大约是 React 本身的 1/5！

目前还为时尚早；Pigment CSS 几周前才开源。但是团队正在该项目背后投入重大资源。我迫不及待地想看看事情将如何发展！

### 清单还在继续

除了我们迄今为止涵盖的库之外，生态系统中还有许多其他正在做有趣事情的项目。以下是一些我正在关注的更多项目：

*   [next-yak](https://github.com/jantimon/next-yak) —— 由瑞士最大电商零售商的开发者创建，next-yak 是一个编译时 CSS-in-JS 库，旨在尽可能成为 styled-components 的即插即用替代品，重新实现了其许多辅助 API。
*   [Kuma UI](https://github.com/kuma-ui/kuma-ui) —— 这个库正在尝试一个相当雄心勃勃的事情：一种“混合”设计，大部分样式都在编译时提取，但运行时对于 Client Components 依旧可用。
*   [Parcel 宏](https://twitter.com/devongovett/status/1767939537907462211) —— Parcel 是一个打包工具，最近实现了“宏”，这是一个可以用来构建各种东西的工具，包括编译时 CSS-in-JS 库。神奇的是，这项功能并非仅限于 Parcel，还可以与 Next.js 一起使用！

## 前行的道路

好的，我们已经探索了一大堆选项，但仍有个问题：如果你有一个使用了“遗留” CSS-in-JS 库的生产应用，**你实际上应该做些什么呢？**

这可能有点违反直觉，但在许多情况下，我实际上认为你不需要做任何事情。😅

很多在线讨论似乎让人觉得你\_不能\_在现代 React / Next.js 应用中使用 styled-components，或者采用它会带来巨大的性能代价。**但这其实不是真的。**

很多人将 RSC（React 服务器组件）和 SSR（服务器端渲染）混为一谈。服务器端渲染还是像以前一样工作，它并不受这些事情的影响。如果你迁移到 Next 的应用路由器或其他 RSC 实现，你的应用不应该变慢。事实上，它可能会变得更快一些！

从性能角度来看，RSC 和零运行时 CSS 库的主要好处是 TTI，“交互时间”。这是 UI 显示给用户和 UI 完全可交互之间的延迟。如果被忽视，它可能会产生糟糕的用户体验；人们会开始点击东西期望它们工作，但没有任何反应，因为应用程序还在水合过程中。

因此，如果你的应用程序现在水合需要很长时间，迁移到零运行时 CSS 库可能对用户体验有积极影响。但如果你的应用已经有了良好的 TTI，你的用户可能不会从这次迁移中看到任何好处。

**我感觉在许多情况下，最大的问题是 FOMO（错失恐惧症）。** 作为开发者，我们想要使用最新最伟大的工具。添加一堆`"use client"`指令时知道我们没有太多受益于新的优化，这并不有趣。但这真的是进行大迁移的有力理由吗？

### 我正在做的事

我维护着两个主要的生产应用：这个博客，以及我用于我的互动课程（[CSS for JavaScript Developers](https://css-for-js.dev/) 和 [The Joy of React](https://joyofreact.com/)）的课程平台。

我的课程平台仍在使用 Next.js Pages 路由器和 styled-components，而且我不打算近期迁移它。我对它提供的用户体验感到满意，并且我不认为迁移会带来显著的性能好处。

我的博客目前还在使用 Next.js Pages 路由器和 styled-components，不过我正在把它迁移到 Next.js App 路由器。至少目前我选择了使用 [Linaria](https://github.com/callstack/linaria) + [next-with-linaria](https://github.com/dlehmhus/next-with-linaria)。等到 Pigment CSS 更加成熟后，我打算切换过去。

React 服务器组件非常酷。React/Vercel 团队在服务器端重思 React 的工作方式方面做得非常出色。但说实话，经历了一次这样的迁移，我不确定我会真心推荐它用于大多数生产应用。尽管 App 路由器已被标记为“稳定”，它仍然远不如 Pages 路由器那么成熟，并且还有一些粗糙的边缘。

如果你对你的应用程序的性能感到满意，我不认为你应该感到更新/迁移的紧迫性❤️。你目前的技术栈将继续正常工作，在未来几年，你可以再回来看看情况。
