---
title: "译：加速 JavaScript 生态系统 - Isolated Declarations"
date: 2024-07-18
url: https://sorrycc.com/speeding-up-javascript-ecosystem-part-10
---

发布于 2024年7月18日

# 译：加速 JavaScript 生态系统 - Isolated Declarations

> 原文：[https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-10/](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-10/)  
> 作者：marvinhagemeist  
> 译者：ChatGPT 4 Turbo

**编者注：一些笔记，1）npm 打包是很难的事，难到需要阅读十几篇博客才能了解全，2）Isolated Declarations 将改变这一现状，让 TypeScript 之外的工具也能轻松生成 d.ts 文件，3）如果 d.ts 的生成足够快，那就不需要在发布到 npm 时生成，而可以选择在安装时生成，这将简化 npm 打包、发布、声明的流程。**

📖 简要来说：TypeScript 的新 Isolated Declarations 功能是开发者共享代码的游戏规则改变者。它极大简化了代码打包发布的流程，同时将创建类型定义文件的时间从几分钟，有时甚至几小时，缩短到了不到一秒钟。

许多人不知道的是，[TypeScript 5.5](https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/#isolated-declarations) 中发布的新 `isolatedDeclaration` 功能比你意识到的要重要得多。它彻底改变了我们打包和分发 JavaScript 代码的方式。你再也不需要通过调用 `tsc` 编译器手动创建 `*.d.ts` 文件了。“跳转到源码”（当你在 macOS 上做 `ctrl+click` 或 `cmd+click` 时的那个功能）现在真正可用了，并且它会直接引导你到 TypeScript 源代码，而不是 `*.d.ts` 文件或一些编译过的 JavaScript 代码。而且最重要的是，它使得发布包速度比以往任何时候都要快。

它是如何做到的？让我们后退一步，评估一下 2024 年打包 JavaScript 代码的当前情况。

## 2024 年为 npm 打包是一场混乱

老实说，这是一场混乱。没有必要美化它。我的一个朋友想在 npm 上发布他的第一个库，但当他意识到这需要多少工作和专门知识时，很快就灰心了。你需要关注 CommonJS 与 ESM 的差异，摆弄一堆设置以确保 `*.d.ts` 文件能工作，等等。最终，他放弃了任务，转而在他的项目之间复制粘贴文件。与不得不处理所有打包问题相比，这样麻烦得多。

> 打包代码应该像上传文件一样简单。打包和分享代码应该如此简单，以至于每个开发人员，不管他们的经验水平如何，都能做到。

即使对于有经验的开发人员来说，创建可以在每个环境中使用的 npm 包也是相当有挑战性的。Redux 团队的 Mark Erikson [撰写了一篇博客文章](https://blog.isquaredsoftware.com/2023/08/esm-modernization-lessons/)，详细叙述了他创建 npm 包的经验。问题在于，打包和在开发人员之间分享代码应该是简单的。开发人员不应该需要阅读十几篇博客并成为所有这些工具内部工作的专家，才能分享代码。它应该只是简单地工作。

各种 CLI 工具应运而生，帮助解决这个问题，但这只是增加了另一个摩擦点。你有了工具 A，它可以解决问题的一部分，然后你有了工具 B，它只处理另一部分问题，等等。不知不觉中，你必须一直关注哪个工具是正确的选择，直到它又被另一个工具替代。这很糟糕。

那么，我们如何解决所有这些问题呢？

## 为什么生成 `.d.ts` 文件需要这么多时间

问题的核心是一个架构问题。我们只发送构建产物，也就是编译后的 JS 和相关的 `.d.ts` 文件在一个包里。发送原始 TypeScript 源文件会更好，但几乎没有任何工具在 JS 生态系统中能够做到这一点。`node_modules` 文件夹内的内容不需要编译的假设在我们的工具中过于普遍。与之相比，发送 TypeScript 源文件而不是 `.d.ts` 文件在使用 TypeScript 时还会是一个性能倒退。

解析 `.d.ts` 文件要快得多，因为它们只包含进行类型检查所需的部分，与正常的 `.ts` 文件相比。`.d.ts` 文件不包含函数体或其他东西，只有消费模块所需的类型定义。

```ts
// 输入：add.ts
const SOME_NUMBER = 10;
export function quickMath(a: number, b: number) {
	return a + b + SOME_NUMBER;
}

// 输出：add.d.ts，只包含进行类型检查所需的部分
export function quickMath(a: number, b: number): number;
```

通常情况下，函数的返回类型是未知的。必须先通过 TypeScript 编译器遍历并检查整个函数体来推断。推断在性能上是非常昂贵的，特别是对于复杂的函数。因此，创建 `.d.ts` 文件的目标是去除所有的推断，以便 TypeScript 编译器只需要读取这些文件，不需要进行额外的工作。类型推断是创建这些 `.d.ts` 文件需要这么长时间的主要原因。正因为这个过程需要很长时间，我们尝试在创建 npm 包时提前尽可能多地完成它。

随着 Isolated Declarations 的出现，一切都变了。

## 进入包装的新时代

Isolated Declarations 背后的思想是，你可以轻而易举地让除了 TypeScript 编译器之外的工具从 TypeScript 源代码生成那些 `.d.ts` 文件。它通过要求导出函数和其他事物显式返回类型来实现这一点。但是别担心，如果一个类型难以推断，TypeScript 语言服务器带有一个方便的功能，可以为你推断缺失的类型。

通过将过程转变为一个纯粹的语法剥离过程，创建 `.d.ts` 的时间非常接近 0 秒。使用专门的基于 Rust 的解析器，即使对于庞大的项目，这一过程也能在一瞬间完成，因为这项工作现在可以并行化。它是如此之快，以至于你甚至都没有注意到。没有隔离声明，你总是 _必须_ 调用 `tsc` 编译器并运行一个完整的类型检查过程。

由于生成定义文件的成本几乎为零，因此它轻松地足够快，以便在需要时即时完成。我们可以彻底改变发布过程：不再需要处理构建 `.d.ts` 文件并提前将它们发布到 npm 的所有麻烦，你可以直接上传你的 TypeScript 源代码，定义文件会在你安装包时自动生成。生成 `.d.ts` 不是在发布包时发生，而是在你安装包时发生。

这也改变了你声明包的可用入口的方式。以前，使用 npm 时，你必须引用一些构建产物才能使其工作。

```json
// package.json
{
	"name": "@my-scope/my-package",
	"version": "1.0.0",
	"type": "module",
	"exports": {
		".": {
			"types": "./dist/types/index.d.ts",
			"import": "./dist/index.js"
		},
		"./foo": {
			"types": "./dist/types/foo.d.ts",
			"import": "./dist/foo.js"
		}
	}
}
```

使用基于 Isolated Declarations 的系统，这变得更简单：只需要直接引用你的源文件。

```json
// jsr.json
{
	"name": "@my-scope/my-package",
	"version": "1.0.0",
	"exports": {
		".": "./src/index.ts",
		"./foo": "./src/foo.ts"
	}
}
```

将你的包入口指向实际的源文件会感觉更自然，因为它免除了你担心打包产物的问题。

## 在生产环境中使用

当然，理论上的讨论是好的，但在生产环境中这会感觉如何呢？在 TypeScript 问题追踪器中多次提出隔离声明的核心理念，但完成这一理念需要一些时间和许多聪明的头脑。在 Deno（免责声明：我为 Deno 工作）这里，我们从一开始就非常密切地关注这个过程，并开始着手开发基于我们自己的 rust 版本。到目前为止，在这篇文章中我们讨论的系统，正是自 2023 年 12 月初以来 Deno 的打包方式。现在，每个 Deno 用户已经在生产环境中使用它超过半年了。

像编辑器中的“转到源代码”这样的功能开箱即用，并且实际上会将你移动到源代码而不是某个随机的定义文件。

我们意识到拥有这样一个系统的好处，并使其对每个人都有用，不仅仅是 Deno 用户。你可以使用 `npm`、`yarn`、`pnpm` 或甚至 `bun` 来使用它。[JSR](https://jsr.io/) 注册表通过实现 npm 协议来安装包，并在与这些包管理器交谈时简单地充当另一个 npm 注册表。从包管理器的角度看，这与与你公司已经在使用的任何其他私有 npm 注册表交谈没有区别。

由于 npm 客户端没有一个即时生成定义文件的系统，所以我们在后台发布过程中为 npm 包生成了它们。因此，npm 包随附标准的 `.js` 文件，就像你已经习惯于其他项目一样。整个 npm 生态系统基于 `.js` 文件的发布，改变这一点将破坏它。这里的重点不只是将 TypeScript 发布到 npm。

但是，如果你\_确实\_使用了一个\_可以\_原生运行 TypeScript _并且_ 使用了一个也可以分发原始 TypeScript 源码的注册表的运行时，那么拥有隔离声明就是一个游戏规则的改变者。

## 结论

孤立声明彻底改变了出版游戏的规则。它使得生成定义文件的成本几乎为零，这为实时生成定义文件打开了大门。这极大地简化了出版流程，仅需上传源文件，这一过程要快得多。目前，[JSR](https://jsr.io/) 是首个也是唯一一个利用这一优势的注册中心，它可以与任何包管理器一起使用，在任何运行时中工作。简而言之，JSR 旨在帮助那些觉得生命太短，不想处理所有打包问题，只想共享代码的人。尝试一下，[亲自体验](https://jsr.io/)。
