---
title: "译：为什么我对用“更快”的语言重写 JavaScript 工具持怀疑态度"
date: 2024-11-01
url: https://sorrycc.com/why-im-skeptical-of-rewriting-javascript-tools-in-faster-languages
---

发布于 2024年11月1日

# 译：为什么我对用“更快”的语言重写 JavaScript 工具持怀疑态度

> 原文：[https://nolanlawson.com/2024/10/20/why-im-skeptical-of-rewriting-javascript-tools-in-faster-languages/](https://nolanlawson.com/2024/10/20/why-im-skeptical-of-rewriting-javascript-tools-in-faster-languages/)  
> 作者：Nolan Lawson  
> 译者：ChatGPT 4 Turbo

**编者注：作者的原因有几点，1）沉默成本，他熟悉且喜欢 JavaScript，2）JavaScript 的性能并没有被穷尽，3）贡献和可调试性，JavaScript 是工人阶级语言，改用 Rust 或 Zig，用户遇到问题时会茫然。**

我写了很多 JavaScript。我 _喜欢_ JavaScript。更重要的是，我在理解、优化和调试 JavaScript 方面积累了一套技能，我不愿意放弃这些。

所以，当我看到当前疯狂地用像 Rust、Zig、Go 等“更快”的语言重写每一个 Node.js 工具时，在我的 stomach 里感到一丝担忧也许是很自然的。别误会——这些语言很酷！（我现在桌上就有一本 Rust 书，我甚至为了好玩贡献了一点代码给 [Servo](https://github.com/servo/servo/commits?author=nolanlawson)。）但最终，我在学习 JavaScript 的各种细节上投入了大量的职业生涯，它是迄今为止我最舒适的语言。

所以我承认我的偏见（也许是过度投资于一项技能）。但我越想越觉得，我的怀疑也是由一些真实的客观担忧所支持的，我想在这篇文章中讨论这些担忧。

## 性能

我怀疑的一个原因是，我真的不认为我们已经穷尽了使 JavaScript 工具更快的所有可能性。Marvin Hagemeister 已经 [出色地做到了这一点](https://marvinh.dev/blog/speeding-up-javascript-ecosystem/)，他展示了在 ESLint、Tailwind 等工具中还有多少低效率的问题未被解决。

在浏览器世界里，JavaScript 已经证明自己对于大多数工作负载来说“足够快”了。当然，WebAssembly 存在，但我认为可以公平地说，它主要用于特定的、CPU 密集型任务，而不是用于构建整个网站。那么，为什么基于 JavaScript 的 CLI 工具急于抛弃 JavaScript 呢？

### 大重写

我认为性能差距来自几个不同的因素。首先，就是前面提到的低效率问题——很长一段时间，JavaScript 工具生态系统集中在构建一些 _有效的_ 东西上，而不是快速的东西。现在我们已经达到了一个饱和点，API 表面大体上已经稳定，每个人都只想要“同样的东西，但更快。”因此，新工具的爆炸式增长几乎是现有工具的直接替代品：[Rolldown](https://rolldown.rs/) 代替 [Rollup](https://rollupjs.org/)，[Oxlint](https://oxc.rs/docs/guide/usage/linter) 代替 [ESLint](https://eslint.org/)，[Biome](https://biomejs.dev/formatter/) 代替 [Prettier](https://prettier.io/) 等。

然而，这些工具不一定更快，因为它们使用的是更快的语言。它们可能仅仅因为 1) 在编写时就考虑了性能，以及 2) API 表面已经稳定下来，所以作者不需要花时间去调整整体设计。哎呀，你甚至都不需要写测试！只需使用前一个工具的现有测试套件即可。

在我的职业生涯中，我经常看到从 A 到 B 的重写导致速度提升，随后伴随着 B 比 A 快的得意声称。然而，[正如 Ryan Carniato 所指出的](https://www.youtube.com/live/0F9t_WeJ5p4?t=4234s)，重写往往只是因为它是重写 —— 第二次时你知道的更多，更加关注性能等等。

### 字节码和即时编译（JIT）

性能差距的第二类来自浏览器免费提供给我们的东西，这些东西我们很少考虑：[字节码缓存](https://v8.dev/blog/code-caching-for-devs) 和 [JIT](https://hacks.mozilla.org/2017/02/a-crash-course-in-just-in-time-jit-compilers/)（Just-In-Time 编译器）。

当你第二次或第三次加载一个网站时，如果 JavaScript 正确缓存，则浏览器不需要再将源代码解析并编译成字节码。它只是直接从磁盘加载字节码。这就是字节码缓存的作用。

此外，如果一个函数是“热”的（频繁执行），它将被进一步优化成机器代码。这就是 JIT 的作用。

在 Node.js 脚本的世界里，我们根本无法获得字节码缓存的好处。每次运行 Node 脚本时，整个脚本都必须从头开始解析和编译。这是 JavaScript 和非 JavaScript 工具之间报告的性能提升的一个重要原因。

不过，多亏了无与伦比的 [Joyee Cheung](https://joyeecheung.github.io/blog/about/)，现在 Node 正在获得一个[编译缓存](https://github.com/nodejs/node/pull/52535)。你可以设置一个环境变量，立即获得更快的 Node.js 脚本加载速度：

```bash
export NODE_COMPILE_CACHE=~/.cache/nodejs-compile-cache
```

我已经在我所有的开发机器上的 `~/.bashrc` 中设置了这个。我希望它有朝一日能成为默认的 Node 设置。

至于 JIT，这是另外一件不幸的事情，大多数 Node 脚本实际上无法真正从中受益。你必须运行一个函数之后它才会变得“热”，所以在服务器端，对于长时间运行的服务器而言，它更有可能启动，而不是一次性脚本。

而 JIT 可以带来很大的不同！在 Pinafore 中，我考虑过用 Rust (Wasm) 版本替换基于 JavaScript 的 [blurhash](https://blurha.sh/) 库，直到[意识到](https://github.com/nolanlawson/pinafore/pull/1781#issuecomment-630562314) 第五次迭代时性能差异被抹平。这就是 JIT 的力量。

也许最终像 [Porffor](https://github.com/CanadaHonk/porffor) 这样的工具可以用来对 Node 脚本进行 AOT (提前编译)。但与此同时，JIT 仍然是本地语言相对于 JavaScript 有优势的一个案例。

我还应该承认：使用 Wasm 相对于纯本地工具确实有性能损失。所以这可能是另一个原因，本地工具在 CLI 世界中风靡一时，但不一定是在浏览器前端。

## 贡献与可调试性

我之前暗示过，但这是我对“全部重写为本地”运动持怀疑态度的主要原因。

在我看来，JavaScript 是一种工人阶级语言。它非常宽容于类型（这是我不是很喜欢 TypeScript 的一个原因），它容易上手（与 Rust 等相比），而且因为它得到了浏览器的支持，有大量的人熟悉它。

多年来，我们在 JavaScript 生态中既有库作者也有库的消费者大量使用 JavaScript。我认为我们认为理所当然的是这使得什么成为可能。

首先：贡献的路径更加平滑。引用 [Matteo Collina](https://fosstodon.org/@mcollina/112723450963851116) 的话：

> 大多数开发者忽略了一个事实：他们拥有调试/修复/修改依赖的技能。这些依赖并不是由一些神秘的大神维护，而是由和他们一样的开发者维护的。

如果 JavaScript 库的作者使用的是与 JavaScript 不同（并且更难！）的语言，这个情况就不成立了。他们可能确实像大神一样！

还有一点：在本地修改 JavaScript 依赖是很直接的。当我尝试跟踪一个库中的错误或在我依赖的库中开发一个特性时，我经常会在我的本地 `node_modules` 文件夹中调整点东西。而如果它是用本机语言写的，我就需要检出源代码并自己编译它 —— 这是一个很大的障碍。

（公平地说，由于 TypeScript 的广泛使用，这已经变得有点棘手了。但是 TypeScript 并不离原生 JavaScript 太远，所以你会惊讶地发现，通过在 DevTools 中点击“美化打印”，你可以走多远。幸运地是，大多数 Node 库也没有被压缩。）

当然，这也引导我们回到了可调试性问题上。如果我想调试一个 JavaScript 库，我可以简单地使用浏览器的 DevTools 或我已经熟悉的 Node.js 调试器。我可以设置断点，检查变量，并对代码进行推理，就像对待我自己的代码一样。这[并非不可能通过 Wasm 实现](https://developer.chrome.com/blog/wasm-debugging-2020)，但它需要一套不同的技能。

## 结论

我认为 JavaScript 生态系统出现了新一代工具是很棒的事情。我很兴奋地看到像 [Oxc](https://oxc.rs/) 和 [VoidZero](https://voidzero.dev/posts/announcing-voidzero-inc) 这样的项目将会走向何方。现有的竞争者确实非常慢，可能会从竞争中受益。（我特别讨厌典型的 `eslint` + `prettier` + `tsc` + `rollup` 的 lint+build 循环。）

也就是说，我不认为 JavaScript 固有地慢，或者我们已经用尽了所有改进它的可能性。有时候，当我看到像最近对 Chromium DevTools 进行的[改进](https://learn.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/whats-new/2024/08/devtools-128#heap-snapshot-improvements)，使用像[使用 `Uint8Array` 作为位向量](https://github.com/ChromeDevTools/devtools-frontend/commit/b73fc5a44552e81019b614594ba7c375f74fc446)这样令人震惊的技术，我觉得我们才刚刚触及到表面。（如果你真的想感到自卑，看看 [Seth Brenith 的其他提交](https://github.com/ChromeDevTools/devtools-frontend/commits?author=sethbrenith)。它们很疯狂。）

我也认为，作为一个社区，我们还没有真正思考如果我们将 JavaScript 工具链委托给 Rust 和 Zig 开发者的精英圣职，世界将会是什么样子。我可以想象，每当构建工具出现一个 bug 时，普通的 JavaScript 开发者会感到完全无助。而不是赋予下一代 web 开发者更多的能力，我们可能在培训他们一种学到的无助感。想象一下，普通的初级开发者面对一个 [segfault](https://en.wikipedia.org/wiki/Segmentation_fault) 而不是一个熟悉的 JavaScript `Error` 时会感觉如何。

此时，我在我的职业生涯中已经是资深人士了，所以当然我没有借口继续依赖我的 JavaScript 安全毯。搞清楚堆栈的每一部分如何工作是我的工作的一部分。

然而，我不禁感到我们正在踏上一条未知的道路，带来了意想不到的后果，当存在另一条较少风险、能够让我们获得几乎相同结果的道路时。当前的快车似乎没有减速的迹象，所以我猜我们到达那里时就会发现。
