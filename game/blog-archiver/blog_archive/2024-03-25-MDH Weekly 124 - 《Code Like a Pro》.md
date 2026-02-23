---
title: "MDH Weekly 124 - 《Code Like a Pro》"
date: 2024-03-25
url: https://sorrycc.com/mdh-124
---

发布于 2024年3月25日

# MDH Weekly 124 - 《Code Like a Pro》

![](https://img.alicdn.com/imgextra/i3/O1CN016cQcGB1cCMWEgwWaw_!!6000000003564-2-tps-1792-1024.png)

题图：Code like a Pro

Hi，朋友们。

欢迎来到新一期的 MDH Weekly。这是其他同学转发给你的吗？[你可以在这里订阅！](https://sorrycc.com/mdh)。

## 本周好文

[译：开源心理健康](https://sorrycc.com/mental-health-oss)  
[译：开源的黑暗面](https://sorrycc.com/the-dark-side-of-open-source)  
[译：什么是 INP](https://sorrycc.com/what-is-inp)  
[译：探索前端的未来](https://sorrycc.com/navigating-the-future-of-frontend)  
[译：编程 40 年](https://sorrycc.com/40)  
[译：使用 cargo-wizard 自动化 Cargo 项目配置](https://sorrycc.com/rust-cargo-wizard)  
[译：软件复杂性的两个根本原因](https://sorrycc.com/root-causes-software-complexity)  
[译：require(esm) in Node.js](https://sorrycc.com/require-esm-in-node-js)  
[译：TypeScript 5.2 的新关键词 using](https://sorrycc.com/typescript-5-2-new-keyword-using)  
[https://ui.dev/why-react-renders](https://ui.dev/why-react-renders)  
[How does use() work internally in React?](https://jser.dev/2024-03-16-how-does-use-work-internally-in-react/)  
[How does useOptimistic() work internally in React?](https://jser.dev/2024-03-20-how-does-useoptimisticwork-internally-in-react/)

## 本周我感兴趣的事

1、翻译文章。

上周更新了不少译文，原因是我手写了两个脚本来改进翻译流程，效率高了很多。现在的流程是，1）先用 bookmarklet 把网页转成 markdown 并保存，2）然后用脚本翻译 markdown 为中文，3）阅读，并在阅读时做高亮和笔记，4）加 frontmatter 属性，用脚本同步到 [sorrycc.com](http://sorrycc.com) 。

介绍下两个脚本。1）一个是网页转 Markdown 的脚本，其中识别代码部分花了不少时间，因为各个网站用的语法高亮器不同，要从中找出代码和语言是个体力活。2）另一个是针对 Markdown 的翻译脚本，相比之前用 Immersive Translate 的好处是，a）会有更好的上下文，因为会把多行合到一起翻译，而不是每一行单独翻译，b）代码里的注释也能翻译，c）链接啥的全保留。

2、《Code Like a Pro in Rust》。

周末空闲时间都在翻这本书，导致周刊也忘写了。这本书适合有一定 Rust 基础的同学，讲的是怎么用 Rust 的一些最佳实践。可以对 Rust 知识做个查漏补缺。我做了笔记并用 ChatGPT 4 Turbo 翻译了一本中英双语版，见 [425 - 《读书笔记：Code Like a Pro in Rust》](https://sorrycc.com/book-code-like-a-pro-in-rust)。

3、Rust 和 Node 的性能。

听完同时的分享后，上手试了下 Xcode Instruments，并整理了笔记 [422 - 《Xcode Instruments》](https://sorrycc.com/xcode-instruments)。确实是 Rust 下排查性能问题的神器，做了一通分析后，找到了我们在开发工具里的一处并发设计问题。

Node 的性能排查试着也找了下用 Xcode Instruments 的方法，但是没找到。还是推荐用 cpu prof + speedscope 比较顺手，即先用 `node --cpu-prof` 跑 node 应用，再上传到 speedscope.app 上分析。见 [424 - 《Node 性能优化（2）》](https://sorrycc.com/node-performance-optimization-02)。我这周分析了下 Umi，找到一处卡点问题，对于某些非典型项目，umi setup 耗时可以从 1m6s 减少到 5s。见 issue [https://github.com/umijs/umi/issues/12224](https://github.com/umijs/umi/issues/12224) 。

## 本周好玩的事

[AnalogJS 发布 1.0](https://dev.to/analogjs/announcing-analogjs-10-19an)  
[JCO 发布 1.0](https://bytecodealliance.org/articles/jco-1.0)  
[Vite 发布 5.2](https://twitter.com/vite_js/status/1770455259069968837)  
[VitePress 发布 1.0](https://blog.vuejs.org/posts/vitepress-1.0)  
[Solid Start 发布 1.0 RC](https://github.com/solidjs/solid-start/releases/tag/v1.0.0-rc.0)  
[Million Lint 发布 Beta](https://million.dev/blog/lint)  
[Zustand v5 接近尾声](https://github.com/pmndrs/zustand/pull/2138)  
[DanGPT - Dan Abramov as an AI](https://dangpt.vercel.app/)  
[magick.css](https://css.winterveil.net/)  
[GitHub - xai-org/grok-1: Grok 开源](https://github.com/xai-org/grok-1)  
[GitHub - AsyncBanana/microdiff](https://github.com/AsyncBanana/microdiff)  
[GitLab - Screwtape/sqlite-schema-diagram](https://gitlab.com/Screwtapello/sqlite-schema-diagram)  
[CS251](https://www.cs251.com/)  
[游戏：Boomerang Fu](https://store.steampowered.com/app/965680/Boomerang_Fu/)  
[Design Spells：设计细节收集](https://www.designspells.com/)  
[养老金是如何计算的？](https://fookwood.com/posts/pension-calculation/)  
[Read Something Wonderful](https://readsomethingwonderful.com/)  
[Listen To Something Wonderful](https://listentosomethingwonderful.com/)

* * *

如果你喜欢 MDH 前端周刊，请转发给你的朋友，告诉他们[到这里来订阅](https://sorrycc.com/mdh) ，这是对我最大的帮助。希望你有美好的一周！我们下期见。
