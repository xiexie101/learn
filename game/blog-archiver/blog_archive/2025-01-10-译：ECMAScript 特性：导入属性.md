---
title: "译：ECMAScript 特性：导入属性"
date: 2025-01-10
url: https://sorrycc.com/ecmascript-feature-import-attributes
---

发布于 2025年1月10日

# 译：ECMAScript 特性：导入属性

> 原文：[https://2ality.com/2025/01/import-attributes.html](https://2ality.com/2025/01/import-attributes.html)  
> 作者：Dr. Axel Rauschmayer  
> 译者：Claude 3.5 Sonnet

**编者注：这篇文章介绍了 ECMAScript 的新特性"导入属性"，这是一个在 2024 年 10 月达到 Stage 4 的提案。它主要用于帮助导入 JavaScript 模块以外的其他资源，比如 JSON、WebAssembly 和 CSS 等。通过使用 with 关键字和相应的类型属性，我们可以明确指定导入内容的类型，这不仅提高了安全性，还能让代码意图更加清晰。1) 文章详细介绍了导入属性的语法和使用场景，包括静态导入、动态导入和重导出语句。2) 同时还探讨了一些基于导入属性的即将推出的特性，如 JSON 模块、CSS 模块和 WebAssembly 导入等。3) 最后回顾了该提案从 2019 年到 2024 年的发展历程。**

ECMAScript 特性["导入属性"](https://github.com/tc39/proposal-import-attributes)（由 Sven Sauleau、Daniel Ehrenberg、Myles Borins、Dan Clark 和 Nicolò Ribaudo 提出）有助于导入 JavaScript 模块之外的其他资源。在这篇博文中，我们将探讨它的具体表现形式和实用价值。

导入属性于 2024 年 10 月达到 Stage 4，很可能会成为 ECMAScript 2025 的一部分。

## 导入 JavaScript 模块（ESM）之外的资源

在 JavaScript 生态系统中，将非 JavaScript 代码作为模块导入由来已久。

例如，JavaScript 模块加载器 RequireJS 支持所谓的[插件](https://requirejs.org/docs/plugins.html)。为了让你了解 RequireJS 的历史悠久程度：版本 1.0.0 发布于 2009 年。通过插件导入的模块规范看起来是这样的：

```ts
'«specifier-of-plugin-module»!«specifier-of-artifact»'
```

例如，以下模块规范将文件作为 JSON 导入：

```ts
'json!./data/config.json'
```

受 RequireJS 启发，webpack 为其[加载器](https://webpack.js.org/loaders/)支持相同的模块规范语法。

### 导入非 JavaScript 资源的用例

以下是一些导入非 JavaScript 资源的用例：

*   导入 JSON 配置数据
*   将 WebAssembly 代码作为 JavaScript 模块导入
*   导入 CSS 以构建用户界面

更多用例可以查看 [webpack 加载器列表](https://webpack.js.org/loaders/)。

## 导入属性

导入属性的主要用例是将 JSON 数据作为模块导入。具体如下（在[单独的提案](https://github.com/tc39/proposal-json-modules)中有进一步说明）：

```js
import configData from './config-data.json' with { type: 'json' };
```

你可能会想，为什么 JavaScript 引擎不能使用文件扩展名 `.json` 来确定这是 JSON 数据。然而，Web 的一个核心架构原则是永远不要使用文件扩展名来确定文件的内容。相反，应该使用内容类型。

如果服务器配置正确，为什么不进行普通导入而省略导入属性呢？

*   服务器可能是故意配置错误的 - 例如，一个不受代码编写者控制的外部服务器。它可能会用代码替换导入的 JSON 文件，这些代码会被导入者执行。
*   服务器可能意外配置错误。使用导入属性，我们可以更快地获得反馈。
*   考虑到预期的内容类型在代码中并不明确，这些属性也记录了程序员的期望。

## 导入属性的语法

让我们更详细地了解导入属性的样子。

### 静态导入语句

我们已经看到了一个普通的（静态）导入语句：

```js
import configData from './config-data.json' with { type: 'json' };
```

导入属性以关键字 `with` 开始。该关键字后面跟着一个对象字面量。目前，支持以下对象字面量特性：

*   未引用的键和引用的键
*   值必须是字符串

对键和值没有其他语法限制，但如果引擎不支持某个键和/或值，应该抛出异常：

*   属性会改变导入的内容，所以简单地忽略它们是有风险的，因为这会改变代码的运行时行为。
*   一个附带的好处是，这使得将来更容易添加更多功能，因为没有人会以意想不到的方式使用键和值。

### 动态导入

为了支持导入属性，[动态导入](https://exploringjs.com/js/book/ch_modules.html#import-operator)获得了第二个参数 - 一个带有配置数据的对象：

```js
import('./data/config.json', { with: { type: 'json' } })
```

导入属性不存在于顶层；它们通过属性 `with` 指定。这使得将来可以添加更多配置选项。

### 重导出语句

重导出在一个步骤中完成导入和导出。对于前者，我们需要属性：

```js
export { default as config } from './data/config.json' with { type: 'json' };
```

## 基于导入属性的即将推出的特性

导入属性实际上只是语法。它们为使用该语法的实际特性奠定了基础。在接下来的小节中，我们将查看一些候选特性。

### JSON 模块

基于导入属性的第一个特性可能是 [JSON 模块](https://2ality.com/2021/06/json-modules.html)。我们已经看到了它们的运行方式：

```js
import configData from './config-data.json' with { type: 'json' };
```

### CSS 模块

[WHATWG 特性提案](https://github.com/whatwg/html/pull/4898)（由 Dan Clark 提出）用于导入 CSS 的工作方式如下：

```js
import styles from './styles.css' with { type: 'css' };
document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];
```

### 导入 WebAssembly

目前正在[讨论](https://github.com/tc39/proposal-import-attributes/issues/19)是否使用导入属性来支持从 JavaScript 直接导入 WebAssembly。如果使用它们，我们可能能够这样创建 Web Workers：

```js
new Worker('my-app.wasm', { type: 'module', with: { type: 'webassembly' } })
```

我们还需要在 HTML script 元素中使用导入属性：

```html
<script src="my-app.wasm" type="module" withtype="webassembly"></script>
```

## 潜在的未来特性

### 可忽略属性

目前，如果主机不知道某个属性，就会抛出异常。一个可以想象的未来特性是语法，告诉主机如果不知道某个属性就应该忽略它（[来源](https://docs.google.com/presentation/d/1Abdr54Iflz_4sah2_yX2qS3K09qDJGV84qIZ6pHAqIk)）：

```js
import logo from './logo.png' with { type: 'image', 'as?': 'canvas' };
```

如果主机支持 `as`，那么上述语句等同于：

```js
import logo from './logo.png' with { type: 'image', as: 'canvas' };
```

否则，它等同于：

```js
import logo from './logo.png' with { type: 'image' };
```

### 更多类型值

Kris Kowal [提议](https://github.com/whatwg/html/issues/9444)三个 `type` 值：

```js
// `text` 是字符串
import text from 'text.txt' with { type: 'text' };

// `bytes` 是 Uint8Array 的实例
import bytes from 'bytes.oct' with { type: 'bytes' };

// `imageUrl` 是字符串
import imageUrl from 'image.jpg' with { type: 'url' };
```

## 导入属性提案的历史

这个提案多年来经历了很多变化（[来源](https://docs.google.com/presentation/d/1HbWhyo4tSnpv4vMZqCa2YQvi_mKdpDi4JWWBtSUQqQY/edit)）：

*   [2019-12](https://github.com/tc39/proposal-import-assertions/tree/f01b3ef82482c702002ce03cbd9d50bb206a8759)：提案的第一个版本语法略有不同，但支持多个属性：
    
    ```js
    import data from './data.json' with type: 'json';
    ```
    
*   [2020-02](https://github.com/tc39/proposal-import-assertions/tree/47bfc1819670f7cb7b24b2df39438bc257b9a816)：只允许一个属性，并包含在模块缓存键中：
    
    ```js
    import data from './data.json' as 'json';
    ```
    
*   2020-06：提案获得 Stage 2 批准，但支持多个属性，且属性不存储在模块缓存键中。
    
*   [2020-07](https://github.com/tc39/proposal-import-assertions/tree/51278ed54333f7f8226ca4f8d903fc3ea97e7137)：关键字首先改名为 `if`，然后改为 `assert`：
    
    ```js
    import data from './data.json' assert { type: 'json' };
    ```
    
*   [2020-09](https://github.com/tc39/proposal-import-assertions/tree/2ea51b677065d1143b968669861240fea6df9a07)：提案获得 Stage 3 批准，断言存储在模块缓存键中。
    

之后，发现了两个问题：

*   术语"断言"意味着导入断言应该只影响模块是否被加载或评估，而不是如何加载。然而，在 Web 上，对资源的请求会根据其预期用途而改变：不同的 CSP 策略、不同的获取目标和接受的响应类型等。
*   类似地，导入断言不应该添加到模块缓存键中。

因此，在 2023 年 1 月，导入断言（关键字 `assert`）降级到 Stage 2，并获得了新名称"导入属性"（关键字 `with`）。

导入属性于 2023 年 3 月晋升至 Stage 3，并于 2024 年 10 月晋升至 Stage 4。
