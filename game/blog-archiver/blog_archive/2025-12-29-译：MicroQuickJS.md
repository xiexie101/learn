---
title: "译：MicroQuickJS"
date: 2025-12-29
url: https://sorrycc.com/microquickjs
---

发布于 2025年12月29日

# 译：MicroQuickJS

> 原文： [https://simonwillison.net/2025/Dec/23/microquickjs/](https://simonwillison.net/2025/Dec/23/microquickjs/)  
> 作者： Simon Willison  
> 译者： Gemini 2.5 Pro

**[MicroQuickJS](https://github.com/bellard/mquickjs)**。这是编程传奇人物 Fabrice Bellard 的新项目，他也是 ffmpeg、QEMU、QuickJS 以及[更多知名项目](https://bellard.org)的作者：

> MicroQuickJS（又名 MQuickJS）是一个面向嵌入式系统的 Javascript 引擎。它只需 10 kB 的 RAM 即可编译和运行 Javascript 程序。整个引擎（包括 C 库）大约需要 100 kB 的 ROM（ARM Thumb-2 代码）。其速度与 QuickJS 相当。

它支持[完整 JavaScript 的一个子集](https://github.com/bellard/mquickjs/blob/17ce6fe54c1ea4f500f26636bd22058fce2ce61a/README.md#javascript-subset-reference)，虽然在我看来，这是一个功能丰富且完善的子集。

我一直对沙箱技术很感兴趣：这种机制用于在限制内存使用、实施严格时间限制并限制文件或网络访问的环境中执行不受信任的代码——无论是来自最终用户还是由 LLM 生成的代码。MicroQuickJS 在这种场景下会有用吗？

我启动了 Web 版 Claude Code（在我的 iPhone 上），并开始了一个[异步研究项目](https://simonwillison.net/2025/Nov/6/async-code-research/)来探索这个问题：

我的完整提示词[在这里](https://github.com/simonw/research/pull/50#issue-3757781692)。它的开头是这样的：

> `Clone https://github.com/bellard/mquickjs to /tmp`
> 
> `Investigate this code as the basis for a safe sandboxing environment for running untrusted code such that it cannot exhaust memory or CPU or access files or the network`
> 
> `First try building python bindings for this using FFI - write a script that builds these by checking out the code to /tmp and building against that, to avoid copying the C code in this repo permanently. Write and execute tests with pytest to exercise it as a sandbox`
> 
> `Then build a "real" Python extension not using FFI and experiment with that`
> 
> `Then try compiling the C to WebAssembly and exercising it via both node.js and Deno, with a similar suite of tests […]`

> `将 https://github.com/bellard/mquickjs 克隆到 /tmp`
> 
> `研究此代码，将其作为运行不受信任代码的安全沙箱环境的基础，确保它不会耗尽内存或 CPU，也不能访问文件或网络`
> 
> `首先尝试使用 FFI 为其构建 Python 绑定 - 编写一个脚本，通过将代码检出到 /tmp 并基于此进行构建来构建这些绑定，以避免永久复制此仓库中的 C 代码。使用 pytest 编写并执行测试，以将其作为沙箱进行演练`
> 
> `然后构建一个不使用 FFI 的“真正的” Python 扩展并进行实验`
> 
> `然后尝试将 C 编译为 WebAssembly，并通过 node.js 和 Deno 进行演练，使用类似的测试套件 […]`

后来我在交互式会话中补充道：

> `Does it have a regex engine that might allow a resource exhaustion attack from an expensive regex?`

> `它是否有一个正则表达式引擎，可能会因为昂贵的正则表达式而允许资源耗尽攻击？`

（答案是否定的——即使在病态的表达式回溯期间，正则表达式引擎也会调用中断处理程序，这意味着任何配置的时间限制仍然有效。）

这是[完整的记录](https://gistpreview.github.io/?6e07c54db7bb8ed8aa0eccfe4a384679)和[最终报告](https://github.com/simonw/research/blob/main/mquickjs-sandbox/README.md)。

一些主要观察结果：

*   MicroQuickJS _非常_适合解决沙箱问题。它内置了强大的内存和时间限制，不暴露任何像文件系统或网络访问这样的危险原语，甚至还有一个可以防止耗尽攻击的正则表达式引擎（前提是你配置了时间限制）。
*   Claude 启动并测试了一个调用 MicroQuickJS 共享库的 Python 库（涉及少量额外的 C 代码），一个编译后的 Python 绑定，以及一个使用原始 MicroQuickJS CLI 工具的库。所有这些方法都运行良好。
*   编译为 WebAssembly 稍微困难一些。它在 Node.js、Deno 和 Pyodide 中让一个版本运行了起来，但 Python 库 wasmer 和 wasmtime 证明更难处理，显然是因为“mquickjs 使用 setjmp/longjmp 进行错误处理”。它最终通过[一个粗暴的黑客手段](https://github.com/simonw/research/blob/main/mquickjs-sandbox/README.md#working-solution)实现了一个可工作的 wasmtime 版本。

我对此感到非常兴奋。MicroQuickJS 体积小巧，功能齐全，看起来很健壮，而且出身名门。我认为这使其成为寻求健壮沙箱的征途中一个非常坚实的新成员。

**更新**：我让 Claude Code 构建了 [tools.simonwillison.net/microquickjs](https://tools.simonwillison.net/microquickjs)，这是一个用于试用 MicroQuickJS WebAssembly 构建版本的交互式 Web 演练场，改编自我之前的 [QuickJS 演练场](https://tools.simonwillison.net/quickjs)。我的 QuickJS 页面加载需要 2.28 MB（传输 675 KB）。而 MicroQuickJS 页面只需加载 303 KB（传输 120 KB）。

这是我为此使用的[提示词](https://github.com/simonw/tools/pull/180#issue-3758595291)。

发布于 [2025年12月23日](https://simonwillison.net/2025/Dec/23/) 晚上 8:53
