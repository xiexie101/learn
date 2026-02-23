---
title: "译：利用 CSS content-visibility 特性提高渲染性能"
date: 2024-10-10
url: https://sorrycc.com/improving-rendering-performance-with-css-content-visibility
---

发布于 2024年10月10日

# 译：利用 CSS content-visibility 特性提高渲染性能

> 原文：[https://nolanlawson.com/2024/09/18/improving-rendering-performance-with-css-content-visibility/](https://nolanlawson.com/2024/09/18/improving-rendering-performance-with-css-content-visibility/)  
> 作者：Nolan Lawson  
> 译者：ChatGPT 4 Turbo

**编者注：content-visibility 虽然有性能提升，但是，1）提升没那么虚拟列表高，在遇到更大 dom 树要求时仍会遇到问题，2）兼容性问题堪忧，尤其是 Safari 只有 18 才支持。**

最近，我遇到了一个[有趣的性能 bug](https://github.com/nolanlawson/emoji-picker-element/issues/444) 在 `emoji-picker-element` 上：

> 我在一个有 19k 自定义表情符号的 fedi 实例上 \[…\]，当我打开表情符号选择器 \[…\] 时，页面至少会冻结整整一秒钟，之后一段时间整体性能都会有卡顿。

如果你不熟悉 Mastodon 或 [联合宇宙](https://en.wikipedia.org/wiki/Fediverse)，不同的服务器可以有他们自己的自定义表情符号，类似于 Slack、Discord 等。拥有 19k（实际上这种情况更接近于 20k）的自定义表情符号是 _极其_ 不寻常的，但[并非闻所未闻](https://emotes.cc/toplist)。

所以我启动了他们的复现，而且\_哇哦\_，它真的很慢：

[![Chrome DevTools 的截图，显示一个表情符号选择器，其中显示高持续的布局/绘制成本和 40,000 个 DOM 节点](https://nolanlawson.com/wp-content/uploads/2024/09/screenshot-emoji-1.png?w=570)](https://nolanlawson.com/wp-content/uploads/2024/09/screenshot-emoji-1.png)

这里有几个问题：

*   20k 的自定义表情符号意味着 _40k_ 元素，因为每一个都使用了一个 `<button>` 和一个 `<img>`。
*   没有使用[虚拟化](https://web.dev/articles/virtualize-long-lists-react-window)，所以所有这些元素都被直接塞进了 DOM 中。

幸运的是，我使用了 `<img loading="lazy">`，所以这 20k 图像并不是一次性全部下载。但无论如何，渲染 40k 元素将会非常非常慢——Lighthouse 建议[不超过 1,400 个](https://developer.chrome.com/docs/lighthouse/performance/dom-size)！

我的第一个想法，当然是，“到底谁会有 20k 的自定义表情符号？”我的第二个想法是，“_叹气_，看来我得去做虚拟化了。”

我在 `emoji-picker-element` 中刻意避免了虚拟化，主要是因为 1) 它很复杂，2) 我认为我不需要它，以及 3) 它对可访问性有影响。

我以前走过这条路：[Pinafore](https://github.com/nolanlawson/pinafore) 基本上就是一个大型虚拟列表。我使用了 [ARIA feed 角色](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/feed_role)，自己做了所有计算，并增加了一个选项来禁用“无限滚动”，因为有些人不喜欢它。这并不是我第一次尝试！我只是在咧嘴笑想着我得写多少代码，以及对我的“小巧”的 ~12kB 表情符号选择器大小影响的担忧。

几天后，我突然想到了一个问题：[CSS `content-visibility`](https://web.dev/articles/content-visibility) 怎么样？我从追踪中看到，布局和绘制花费了大量时间，而且这个可能会帮助解决“卡顿”问题。这比全面虚拟化可能是一个简单得多的解决方案。

如果你不熟悉，`content-visibility` 是一个较新的 CSS 功能，它允许你从布局和绘制的角度“隐藏”DOM 中的某些部分。它在很大程度上[不影响可访问性树](https://web.dev/articles/content-visibility#a_note_on_accessibility)（因为 DOM 节点仍在那里），它不影响页面内查找（⌘+F/Ctrl+F），而且它不需要虚拟化。它所需要的只是离屏元素的大小估计，以便浏览器可以在那里保留空间。

对我来说幸运的是，我有了一个很好的计量单位：表情类别。Fediverse 上的自定义表情往往被划分为一小块类别：“blobs”，“cats”等。

![](https://nolanlawson.com/wp-content/uploads/2024/09/screenshot-2024-09-17-at-07-52-55-home-c2b7-mastodon.social-1.png)

`mastodon.social` 上的自定义表情。

对于每个类别，我已经知道了表情大小和行列数，所以可以用 CSS 自定义属性来计算预期大小：

```css
.category {
  content-visibility: auto;
  contain-intrinsic-size:
    /* 宽度 */
    calc(var(--num-columns) * var(--total-emoji-size))
    /* 高度 */
    calc(var(--num-rows) * var(--total-emoji-size));
}
```

这些占位符占据的空间与成品完全一样，所以滚动时什么都不会跳来跳去。

接下来我做的事是编写一个 Tachometer 基准测试来跟踪我的进展。（[我喜欢 Tachometer。](https://nolanlawson.com/2024/08/05/reliable-javascript-benchmarking-with-tachometer/)）这帮助验证了我确实在提高性能，以及提高了多少。

我的[第一次尝试](https://github.com/nolanlawson/emoji-picker-element/pull/445)写起来\_真的\_很容易，性能提升也有… 它们只是有点让人失望。

对于初始载入，我在 Chrome 上获得了大约 15% 的改进，在 Firefox 上是 5%。（Safari 只在技术预览中有 `content-visibility`，所以我不能在 Tachometer 中测试它。）这不是什么小事，但我知道虚拟列表能做得更好！

所以我深入挖掘了一下。布局成本几乎消失了，但还有一些我无法解释的其他成本。例如，Chrome 跟踪中这个大而不明显的块是什么情况？

[![Chrome DevTools 截图，显示一个被称为“神秘时间”的大型 JavaScript 时间块](https://nolanlawson.com/wp-content/uploads/2024/09/screenshot-from-2024-09-17-08-07-04.png?w=570)](https://nolanlawson.com/wp-content/uploads/2024/09/screenshot-from-2024-09-17-08-07-04.png)

每当我感觉 Chrome 在向我“隐藏”一些性能信息时，我会做两件事之一：爆出 [`chrome:tracing`](https://nolanlawson.com/2022/10/26/a-beginners-guide-to-chrome-tracing/)，或（更近期的）启用 DevTools 中的实验性[“显示所有事件”](https://github.com/iamakulov/devtools-perf-features?tab=readme-ov-file#timeline-show-all-events)选项。

这给你提供了比标准 Chrome 跟踪更多一点的底层信息，但无需处理完全不同的 UI。我觉得这是性能面板和 `chrome:tracing` 之间的一个不错的折衷。

而在这个案例中，我立即看到了一些让我脑海中的齿轮转动的东西：

[![Chrome DevTools 截图，之前的神秘时间注释为 ResourceFetcher::requestResource](https://nolanlawson.com/wp-content/uploads/2024/09/00c8ca7e485fd88b.png?w=570)](https://nolanlawson.com/wp-content/uploads/2024/09/00c8ca7e485fd88b.png)

到底什么是 `ResourceFetcher::requestResource`？嗯，即使不搜索 Chromium 源代码，我也有一个猜测——可能是所有那些 `<img>` 标签？不可能，对吧…？我用的是 `<img loading="lazy">`！

嗯，我凭直觉，只是简单地注释掉了每个 `<img>` 中的 `src`，结果你猜怎么着 —— 所有那些神秘的成本都消失了！

我也在 Firefox 中进行了测试，这也是一个巨大的进步。所以，这让我相信 `loading="lazy"` 并不像我以为的那样是免费的午餐。

此时，我想，如果我打算摆脱 `loading="lazy"`，那么我也可以彻底做到，并将那 40k 个 DOM 元素变成 20k 个。毕竟，如果我不需要一个 `<img>`，那么我可以使用 CSS 在 `<button>` 上的 `::after` 伪元素上设置 `background-image`，这样可以将创建那些元素的时间减半。

```css
.onscreen .custom-emoji::after {
  background-image: var(--custom-emoji-background);
}
```

\==此时，只需简单添加一个 [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) 来在类别滚动到视图中时添加 `onscreen` 类，我就有了一个[性能更好的](https://github.com/nolanlawson/emoji-picker-element/pull/450)自制的 `loading="lazy"`。==这一次，Tachometer 报告 Chrome 的改进约为 ~40%，Firefox 的改进约为 ~35%。现在这才像话！

**注意：** 我本可以使用 [`contentvisibilityautostatechange` 事件](https://developer.mozilla.org/en-US/docs/Web/API/Element/contentvisibilityautostatechange_event) 而不是 `IntersectionObserver`，但我发现了[跨浏览器的差异](https://issues.chromium.org/issues/365168180)，而且这样做会通过迫使 Safari 急切地下载所有图片而惩罚它。不过，一旦浏览器支持改进，我绝对会使用它！

我对这个解决方案感到满意，并将其发布。总的来说，基准测试显示 Chrome 和 Firefox 的改进都约为 ~45%，原始反馈从[约 3 秒改进到约 1.3 秒](https://github.com/nolanlawson/emoji-picker-element/issues/444#issuecomment-2336920148)。报告这个bug的人甚至感谢了我，并说现在 emoji 选择器的可用性大大提高了。

尽管如此，我仍然觉得有些地方不太对劲。查看追踪记录，我可以发现渲染 20k 个 DOM 节点永远不会像虚拟列表那样快。如果我想要支持更大的 Fediverse 实例，拥有更多的表情符号，这个解决方案就不会扩展。

不过，我对 `content-visibility` 能“免费”获得的效果印象深刻。我根本不需要改变我的 ARIA 策略，或者担心页面内查找，这真是太棒了。但是，追求完美的我仍然被这个想法所困扰：为了达到最大性能，采用虚拟列表才是正确的选择。

也许最终 web 平台会真的把虚拟列表作为一个内置原语？几年前曾经[有一些努力](https://github.com/WICG/virtual-scroller)，但似乎已经停滞不前了。

我期待那一天的到来，但就目前而言，我得承认 `content-visibility` 是虚拟列表的一个不错的权宜之计。它简单易实现，提供了不错的性能提升，并且基本上没有可访问性难题。只是不要让我支持 100k 自定义表情符号！

### _相关_

[为 web 引入 emoji-picker-element：一个内存高效的表情符号选择器](/2020/06/28/introducing-emoji-picker-element-a-memory-efficient-emoji-picker-for-the-web/?relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=0&relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=0&relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=0&relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=0 "为 web 引入 emoji-picker-element：一个内存高效的表情符号选择器") 2020 年 6 月 28 日在 “performance”

[在自定义框架上重建 emoji-picker-element](/2023/12/17/rebuilding-emoji-picker-element-on-a-custom-framework/?relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=1&relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=1&relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=1 "在自定义框架上重建 emoji-picker-element") 2023 年 12 月 17 日在 “performance”

[Web 组件样式的选项](/2021/01/03/options-for-styling-web-components/?relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=2&relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=2&relatedposts_hit=1&relatedposts_origin=14078&relatedposts_position=2 "Web 组件样式的选项")2021 年 1 月 3 日 在 “Web” 中
