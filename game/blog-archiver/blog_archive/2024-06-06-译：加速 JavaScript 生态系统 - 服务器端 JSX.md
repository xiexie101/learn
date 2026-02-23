---
title: "译：加速 JavaScript 生态系统 - 服务器端 JSX"
date: 2024-06-06
url: https://sorrycc.com/speeding-up-javascript-ecosystem-part-9
---

发布于 2024年6月6日

# 译：加速 JavaScript 生态系统 - 服务器端 JSX

> 原文：[https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-9/](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-9/)  
> 作者：marvinhagemeist  
> 译者：ChatGPT 4 Turbo

**编者注：Deno 新增了一种 jsx 的编译方式叫 precompile，直接产出字符串，而非 React.createElement 这种需要创建很多临时对象的方式，可以让服务端的 jsx 渲染速度提升 7-20 倍。**

TL；DR：通过一个为在服务器上尽可能快速渲染 HTML 而优化的 JSX 转换，我们可以使渲染速度提高 7-20 倍，并将 GC 时间减半。这种 JSX 转换是通用的，不依赖于特定的框架。

* * *

在 Web 开发领域，服务器端渲染 HTML 的效率对于提供快速和响应式的用户体验至关重要。然而，现有的将 JSX 转换成有效 JavaScript 的 JSX 转换面临着一个显著的挑战：它们主要为浏览器环境量身定制，经常产生过多的内存开销，并导致频繁的垃圾回收暂停。通过重新思考我们在服务器上转换 JSX 的方式，几乎可以消除这种开销。

## 为服务器优化 JSX

当查看常用 JSX 转换的转译输出时，很容易看出为什么它会导致频繁的 GC 暂停。它们通常不区分 JSX “块”的静态和动态部分，为元素和其属性分配许多短暂存在的对象。分配的对象数量随着你拥有的 JSX 元素数量的增加而迅速增长。

```jsx
// 输入
<h1 id="heading">hello world</h1>;

// 输出：“经典”的 createElement 转换
React.createElement("h1", { id: "heading" }, "hello world");

// 输出：较新的“自动运行时”转换
import { jsx as _jsx } from "react/runtime";
_jsx("h1", { id: "heading", children: "hello world" });
```

在服务器上，这两种转换输出都不理想。它们都创建了许多短暂存在的对象，这些对象在渲染后会立即被丢弃。由于输入的 JSX 元素完全是静态的，理想的解决方案是直接将其转换为纯字符串，从一开始就绕过了这些临时对象的需求。

```jsx
// 输入
<h1 id="heading">hello world</h1>;

// 输出：预编译的 HTML 字符串
const html = '<h1 id="heading">hello world</h1>';
```

分配一个字符串对垃圾回收器的负担要小得多，与创建和清理一打对象相比，无论这些对象大小如何。

## 混合静态和动态部分

但并非所有模板都是静态的，渲染的很大一部分涉及到静态与动态部分的混合。在 JavaScript 中，我们已经有了一个现成的解决方案：标签模板字面量。它们已经能够区分静态和动态输入。

```jsx
// 输入
<h1 id="heading">我的名字是 {name}</h1>;

// 作为一个标签模板字符串
jsxTemplate`<h1 id="heading">我的名字是 ${name}</h1>`;
```

从实现的角度来看，标签模板共享以下函数签名，这对于我们想要做的事情来说简直完美：

```ts
function jsxTemplate(statics: string[], ...expressions: unknown[]) {
	// ...
}
```

我们可以定制我们的 JSX 转换，以生成每个 JSX 块的静态部分数组，并将动态部分作为额外的参数传递。

```js
const template = ['<h1 id="heading">我的名字是', "</h1>"];

jsxTemplate(template, name);
```

我已经对比了将所有表达式作为数组传递，或使用剩余参数传递两者之间是否会对性能产生显著变化进行了基准测试，但没有发现任何有意义的性能变化。

## 确保安全

生成 HTML 的一个关键方面是确保动态输入被正确转义，不能导致 XSS 漏洞。这是我们在 JSX 转换中自动处理的事情。通过用额外的函数调用包装每个动态部分来转义传入的内容，我们可以完全消除这些风险。

```ts
const template = [
	// ...
];

// `name` 变量是动态的，我们将自动用
// 一个转义函数包装它
jsxTemplate(template, jsxEscape(name));
```

将这一点内置到 JSX 转换中的好处在于，它要求框架提供 `jsxEscape` 的实现，这降低了忘记正确转义内容的风险。尽管我们也可以将相同的函数用于动态属性值，但大多数框架根据它们正在处理的属性来以不同方式处理属性值。在服务器端渲染期间的一项常见操作是丢弃所有与事件相关的 props，例如 `onClick`。

```jsx
// 输入
<h1 class={someVariable}>hello world</h1>;

// 输出：预编译
const template = ["<h1 ", ">hello world</h1>"];

jsxTemplate(template, jsxAttr("class", name));
```

通过使用 `jsxAttr` 函数，框架作者可以根据需要选择是否删除整个属性。注意，他们仍然需要确保相应地对属性值进行转义。

## 那组件呢？

组件在这里是个特殊情况，因为如何实现它们以及它们在底层做什么完全取决于框架。如果我们想让我们的 JSX 转换对任何框架都通用，我们不能在这里做出假设。因此，在这种情况下，我们将简单地回退到自动运行时转换。

```jsx
// 输入
<Foo foo="bar" />;

// 输出：预编译，与自动运行时转换相同
jsx(Foo, { foo: "bar" });
```

## 在现实世界中它快多少？

合成基准测试显示，预编译方法大约快 7-20 倍，但更有趣的是它在这之外的表现。真实项目与合成基准测试往往大不相同。因此，我选择了我的网站进行这个测试。代码中有健康的静态部分和动态组件的混合。像往常一样，这些数据是在我的 MacBook M1 Air 上测量得到的。

![](https://res.cloudinary.com/sorrycc/image/upload/v1717657713/blog/o6h3n59l.png)

以图表形式显示：

![预编译是原来的 8 倍速](https://marvinh.dev/media/jsx-precompile-chart.png)

## 结论

有趣的是，这里提出的核心思想并不是什么新鲜事。实际上，自从至少 2000 年代初期（可能甚至更早）以来，所有输出 HTML 的模板语言都是这样工作的。然而，随着 JSX 的兴起和单页应用的受欢迎程度，焦点已从服务器转移到浏览器。从那时起，许多特定于框架的转换甚至是全自定义的文件格式都被发明出来。有 Svelte，有 Vue，还有像这篇文章中描述的策略最接近的 Solid。它们也将 JSX 转译为字符串化的输出。

关键的不同点在于，这种转换并不绑定在特定的框架上。它就像标准的 “classic” 和 “automatic runtime” JSX 转换一样，可以用于任何基于 JSX 的框架。无论你是在使用 Preact、Hono 的 JSX 层，还是完全不同或定制的东西，这都不重要，因为你可以以最少的努力支持 “precompile” 转换。Preact 和 Hono 的 JSX 已经默认支持它。

在 [Deno](https://deno.com/) 中启用新的 “precompile” 转换就像修改配置文件中的一行代码一样简单。（声明：我受雇于 Deno）

```diff
// deno.json
  {
    "imports": {
      "preact": "npm:preact@^10.22.0",
      "preact-render-to-string": "npm:preact-render-to-string@^6.4.2"
    },
    "compilerOptions": {
-     "jsx": "react-jsx",
+     "jsx": "precompile",
      "jsxImportSource": "preact"
    }
  }
```

通过这个改变，你可以使你的应用在服务器上渲染 JSX 的速度提高 7-20 倍，并将垃圾回收时间减少 50%。你有的静态元素越多，转换呈现 HTML 的速度就越快。这种转换的美妙之处在于，即使在最坏的情况下，即没有静态内容的情况下，它的性能特征至少与现有的 JSX 转换相同。它永远不会更慢，只会更快。

* * *

请在 [推特](https://twitter.com/marvinhagemeist)、[mastodon](https://infosec.exchange/@marvinh) 或通过 [RSS](https://marvinh.dev/feed.xml) 关注我，获取下一篇文章上线的通知。
