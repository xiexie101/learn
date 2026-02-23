---
title: "译：JavaScript 基准测试真是一团糟"
date: 2024-12-31
url: https://sorrycc.com/javascript-benchmarking-mess
---

发布于 2024年12月31日

# 译：JavaScript 基准测试真是一团糟

> 原文：[https://byteofdev.com/posts/javascript-benchmarking-mess/](https://byteofdev.com/posts/javascript-benchmarking-mess/)  
> 作者：Jacob Jackson  
> 译者：Claude 3.5 Sonnet

**编者注：JavaScript 基准测试的各种挑战。1) JIT 编译器会影响测试精确度，不同的优化级别会导致性能差异巨大。2) JavaScript 引擎为防止指纹识别和计时攻击，故意降低了计时精度。3) 不同的 JavaScript 运行环境（如 V8、JavaScriptCore、SpiderMonkey）具有不同的性能特征，这使得跨环境的基准测试变得困难。4) 虽然服务器端有一些工具可以帮助控制优化级别和垃圾回收，但浏览器端的基准测试仍然面临着更多限制。**

我讨厌对代码进行基准测试，就像任何人类一样（说实话，看到这里的读者可能大多已经不是人类了 ¯\\\_(ツ)\_/¯）。假装你的值缓存提升了 1000% 的性能，要比实际测试它的效果有趣得多。但是，在 JavaScript 中进行基准测试仍然是必要的，特别是当 JavaScript 被用于（[也许不应该？](https://byteofdev.com/posts/webassembly/)）更多对性能敏感的应用程序时。不幸的是，由于其许多核心架构决策，JavaScript 并没有让基准测试变得更容易。

## JavaScript 有什么问题？

### JIT 编译器降低了准确性(?)[](#the-jit-compiler-decreases-accuracy\(?\))

对于那些不熟悉现代脚本语言（如 JavaScript）魔法的人来说，它们的架构可能相当复杂。大多数 JavaScript 引擎不是仅仅通过解释器运行代码并立即输出指令，而是采用了更类似于 C 这样的编译语言的架构——它们集成了[多层"编译器"](https://v8.dev/blog/turbofan-jit)。

这些编译器各自在编译时间和运行时性能之间提供了不同的权衡，这样用户就不需要在很少运行的代码上花费计算资源进行优化，同时又能够在最常运行的代码（“热路径”）上利用更高级编译器的性能优势。在使用优化编译器时还会出现一些其他复杂情况，涉及一些花哨的编程术语，比如"[函数单态性](https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html)"，不过我在这里就不详细讨论了。

那么…这对基准测试有什么影响呢？正如你可能猜到的，因为基准测试是在测量代码的性能，JIT 编译器可能会产生相当大的影响。较小的代码片段在基准测试时，完全优化后通常会看到 10 倍以上的性能提升，这给结果带来了很大的误差。例如，在最基础的基准测试设置中（由于多个原因，不要使用下面这样的方式）：

```js
for (int i = 0; i<1000; i++) {
    console.time()
    // do some expensive work
    console.timeEnd()
}
```

_（别担心，我们稍后会讨论 `console.time`）_

你的大部分代码在几次试验后就会被缓存，显著减少每次操作的时间。基准测试程序通常会尽最大努力消除这种缓存/优化，因为它也可能使后面测试的程序看起来相对更快。然而，你最终必须问自己，没有优化的基准测试是否能反映真实世界中的性能。当然，在某些情况下，比如很少访问的网页，优化可能不太可能发生，但在性能最重要的环境中，比如服务器，优化应该是可以预期的。如果你的代码作为中间件每秒处理数千个请求，你最好希望 V8 正在优化它。

所以基本上，即使在一个引擎中，也有 2-4 种不同的方式来运行你的代码，具有不同的性能水平。哦，而且在某些情况下，确保启用某些优化级别是非常困难的。祝你玩得开心 :)。

### 引擎竭尽全力阻止你准确计时

你知道指纹识别吗？就是那个让["请勿跟踪"反而帮助了跟踪](https://getinsights.io/blog/posts/fingerprinting-do-not-track)的技术？是的，JavaScript 引擎一直在努力减轻这个问题。这种努力，加上为了防止[计时攻击](https://xsleaks.dev/docs/attacks/timing-attacks/execution-timing/)的举措，导致 JavaScript 引擎故意使计时不准确，这样黑客就无法精确测量当前计算机的性能或某个操作的开销。不幸的是，这意味着如果不调整某些设置，基准测试也会遇到同样的问题。

上一节中的示例将不准确，因为它只能以毫秒为单位测量。现在，把它换成 `performance.now()`。太好了，现在我们有微秒级的时间戳了！

```js
// 不好
console.time();
// work
console.timeEnd();

// 更好？
const t = performance.now();
// work
console.log(performance.now() - t);
```

但是…它们都是以 100μs 为增量的。现在让我们[添加一些头部](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing#reduced_precision)来降低计时攻击的风险。哎呀，我们仍然只能得到 5μs 的增量。5μs 对很多用例来说可能已经足够精确了，但如果你需要更细粒度的测量，就得另寻他法了。据我所知，没有浏览器允许更细粒度的计时器。Node.js 确实允许，但当然，这又带来了它自己的问题。

即使你决定通过浏览器运行你的代码并让编译器发挥作用，如果你想要准确的计时，显然你仍然会遇到更多的麻烦。对了，而且不是所有浏览器都是平等的。

### 每个环境都不一样

我很喜欢 [Bun](https://byteofdev.com/posts/what-is-bun/) 为推动服务器端 JavaScript 发展所做的工作，但是天哪，它让服务器 JavaScript 的基准测试变得更难了。几年前，人们关心的服务器端 JavaScript 环境只有 Node.js 和 [Deno](https://byteofdev.com/posts/deno/)，它们都使用 V8 JavaScript 引擎（与 Chrome 相同的引擎）。而 Bun 使用的是 JavaScriptCore，也就是 Safari 的引擎，它有完全不同的性能特征。

多个 JavaScript 环境各自具有不同性能特征的问题在服务器端 JavaScript 中相对较新，但在客户端却长期存在。Chrome、Safari 和 Firefox 分别使用的三个常用 JavaScript 引擎 V8、JSC 和 SpiderMonkey，在运行相同的代码时都可能表现出显著的快慢差异。

这些差异的一个例子是尾调用优化（TCO）。TCO 优化了那些在函数体末尾递归的函数，像这样：

```js
function factorial(i, num = 1) {
	if (i == 1) return num;
	num *= i;
	i--;
	return factorial(i, num);
}
```

试着在 Bun 中对 `factorial(100000)` 进行基准测试。现在，在 Node.js 或 Deno 中试试同样的操作。你应该会得到类似这样的错误：

```plaintext
function factorial(i, num = 1) {
 ^

RangeError: Maximum call stack size exceeded
```

在 V8（以及扩展的 Node.js 和 Deno）中，每次 `factorial()` 在末尾调用自己时，引擎都会为嵌套函数创建一个全新的函数上下文来运行，这最终会受到调用栈的限制。但为什么在 Bun 中不会发生这种情况呢？Bun 使用的 JavaScriptCore 实现了 TCO，它通过将这些类型的函数转换为更类似于这样的 for 循环来优化：

```js
function factorial(i, num = 1) {
	while (i != 1) {
		num *= i;
		i--;
	}
	return i;
}
```

上面的设计不仅避免了调用栈限制，而且因为不需要任何新的函数上下文，它也更快，这意味着像上面这样的函数在不同引擎下的基准测试结果会有很大差异。

本质上，这些差异意味着你应该在你期望运行代码的所有引擎上进行基准测试，以确保在一个引擎中快速的代码在另一个引擎中不会变慢。另外，如果你正在开发一个你期望在多个平台上使用的库，请确保包含更特殊的引擎，如 [Hermes](https://github.com/facebook/hermes)；它们具有截然不同的性能特征。

### 值得一提的其他问题

*   垃圾收集器及其随机暂停一切的倾向
*   JIT 编译器删除你所有"不必要"代码的能力
*   大多数 JavaScript 开发工具中过于宽泛的火焰图
*   我想你已经明白了重点

## 那么…解决方案是什么？

我希望我能指出一个 npm 包来解决所有这些问题，但实际上并没有这样的包。

在服务器端，你的情况稍微好一些。你可以使用 [d8](https://v8.dev/docs/d8) 来手动控制优化级别、控制垃圾收集器，并获得精确的计时。当然，你需要一些 Bash 技巧来为此设置一个设计良好的基准测试流程，因为不幸的是 d8 与 Node.js 没有很好的集成（或者根本没有集成）。你也可以在 Node.js 中启用某些标志来获得类似的结果，但你会错过一些功能，比如启用特定的优化层级。

```plaintext
v8 --sparkplug --always-sparkplug --no-opt [file]
```

_一个使用特定编译层级（sparkplug）的 D8 示例。D8 默认包含更多的 GC 控制和更多的调试信息。_

你可以在 JavaScriptCore 上获得一些类似的功能???说实话，我没有怎么使用过 JavaScriptCore 的命令行，而且它的文档\_严重\_不足。你可以使用[他们的命令行标志](https://trac.webkit.org/wiki/JSC)启用特定层级，但我不确定你能获取多少调试信息。Bun 也包含一些有用的[基准测试工具](https://bun.sh/docs/project/benchmarking)，但它们的限制与 Node.js 类似。

不幸的是，所有这些都需要基础引擎/测试版本的引擎，这可能很难获得。我发现管理引擎最简单的方法是将 [esvu](https://github.com/devsnek/esvu) 与 [eshost-cli](https://github.com/bterlson/eshost-cli) 配对使用，因为它们一起使管理引擎和跨引擎运行代码变得相当容易。当然，仍然需要大量的手动工作，因为这些工具只是管理跨引擎运行代码——你仍然需要自己编写基准测试代码。

如果你只是想在服务器上用默认选项尽可能准确地对引擎进行基准测试，有一些现成的 Node.js 工具，如 [mitata](https://github.com/evanwashere/mitata)，可以帮助提高计时准确性并减少 GC 相关的错误。许多这样的工具，比如 Mitata，也可以跨多个引擎使用；当然，你仍然需要设置像上面那样的流程。

在浏览器端，一切都要困难得多。我不知道有什么解决方案可以提供更精确的计时，而且对引擎的控制也要受到更多限制。在浏览器中，你能获得的与运行时 JavaScript 性能相关的最多信息将来自 [Chrome devtools](https://developer.chrome.com/docs/devtools/performance)，它提供基本的火焰图和 CPU 降速模拟工具。

## 结论

许多使 JavaScript（相对）高性能和可移植的设计决策，使得基准测试比其他语言要困难得多。需要基准测试的目标更多，而且在每个目标中的控制也更少。

希望有一天能出现一个解决方案来简化这些问题。我可能最终会制作一个工具来简化跨引擎和编译层级的基准测试，但目前，创建一个解决所有这些问题的流程需要相当多的工作。当然，重要的是要记住这些问题并不适用于每个人——如果你的代码只在一个环境中运行，就不要浪费时间在其他环境中进行基准测试。

无论你选择如何进行基准测试，我希望这篇文章向你展示了 JavaScript 基准测试中存在的一些问题。如果你想要一个关于如何实现我上面描述的一些内容的教程，请让我知道。
