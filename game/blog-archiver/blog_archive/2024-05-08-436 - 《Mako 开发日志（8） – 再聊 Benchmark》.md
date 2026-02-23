---
title: "436 - 《Mako 开发日志（8） – 再聊 Benchmark》"
date: 2024-05-08
url: https://sorrycc.com/mako-devlog-08
---

发布于 2024年5月8日

# 436 - 《Mako 开发日志（8） – 再聊 Benchmark》

由于近期要对外内测，这两天整理了下 Benchmark 仓库，基于 [https://github.com/farm-fe/performance-compare](https://github.com/farm-fe/performance-compare) 重新写了下，加了一些维度，比如 js 尺寸用于比较产物的 tree shaking 效果。

1、先看结果，见下图。由于未正式开源，给其他构建工具先打个码。跑的是 [https://github.com/farm-fe/performance-compare](https://github.com/farm-fe/performance-compare) 下的项目，这个项目是 Turbopack Benchmark 时用的测试项目。包含维度有 dev 冷启动时间、根节点和叶子节点的 HMR 时间、build 构建时间、JS 产物尺寸，在这个项目的场景下，Mako 全面领先。

![](https://res.cloudinary.com/sorrycc/image/upload/v1715149117/blog/jwr37qnh.png)

2、需要注意的是，如 [335 - 《Mako 开发日志（2） - Benchmark 的秘密》](https://sorrycc.com/mako-devlog-02) 所说，Benchmark 并不是完全客观的，同时一个案例的 Benchmark 也并不能反应真实项目下的反应。每个项目都有自己的优势和劣势，所以不管出于市场营销还是啥考虑，绕开劣势，突出优势去做比较，自己的总是会比别人的更好。另外还有一点是，大家做的功能多少和完善度可能还存在差异，比如 react 和 preact，虽然都能跑 jsx，但功能是不一样的。

3、比如 Mako 的性能缺点是 Tree Shaking 实现没做并发，但 Chunk 的 AST to CODE 没做并发，所以在只打出一个 Chunk 的场景下，性能会没那么好。优势比如我们做了 Less 的提速优化，所以做大量 Less 的 Benchmark，相比其他构建工具就会非常明显。

![](https://res.cloudinary.com/sorrycc/image/upload/v1715149825/blog/him5ls7i.png)

4、再看怎么实现。

1）Build 速度和 JS 尺寸。没啥好说的，多跑几遍，然后算平均值就好。

2）Dev 启动速度。由于 Vite 等工具按需编译的存在，除了要启动各个工具的 dev 命令，还需要用 puppteer 打开浏览器等 load 完成才算完，比如 Vite 这种 Bundless 的编译方式，是需要等请求过去之后才会做编译的。

3）热更速度区分了 Root 和 Leaf。这应该和部分构建工具的实现有关，而在 Mako 里，Root 和 Leaf 的变更时间基本是一致的。热更的测量是往文件里 appendFileSync 一句 console.log，比如 `console.log('root hmr')`，然后用 `page.waitForEvent` 等 console 内容包含 root hmr 的事件，这样就能算出代码从改动开始到在浏览器里执行的时间差了。

4）需要注意的是，有些构建工具会有缓存机制，每次跑之前需要清空缓存文件。

参考：  
[206 - 《Benchmark》](https://sorrycc.com/benchmark)  
[335 - 《Mako 开发日志（2） - Benchmark 的秘密》](https://sorrycc.com/mako-devlog-02)
