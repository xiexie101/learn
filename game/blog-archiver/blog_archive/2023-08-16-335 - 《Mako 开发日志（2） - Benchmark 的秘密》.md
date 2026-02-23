---
title: "335 - 《Mako 开发日志（2） - Benchmark 的秘密》"
date: 2023-08-16
url: https://sorrycc.com/mako-devlog-02
---

发布于 2023年8月16日

# 335 - 《Mako 开发日志（2） - Benchmark 的秘密》

说说 Benchmark。Benchmark 是公平的吗？为啥各家的 Benchmark 里，自己通常都是最快的。昨天同事基于 [https://github.com/farm-fe/performance-compare](https://github.com/farm-fe/performance-compare) 加了 Mako 来跑和其他工具对比的 Benchmark，我草，Mako 好几项都第一，怎么回事？只有我们自己知道，Benchmark 的数据其实没那么准。

1、Benchmark 虽然看起来是公平的，主要看构建工具本身的性能，但具体做时也是有一些隐藏的小窍门的。这就是为啥都是对比 Vite 和 Turbopack，Vite 和 Turbopack 各自做的数据却是不同的。原因是对比的点可能不同，没有一个工具是六边形战士，哪哪都快，大家都有各自的优点和缺点，对比时出于人性考虑，会自然地突出自己的优点和对方的缺点。随便打开一个对比，除非是三方做，否则都存在有很大的主观因素。

2、构建的性能是多方面的，这个多方面甚至可以到很细，细到没做过构建工具的不太能想得到的那种。大的可能很多人都清楚，比如 dev 和 build 是不同的，冷启动和热启动是不同的，hmr 的 root 和 leaf 是不同的。细的比如 Tree Shaking、Code Splitting、SourceMap 方式、依赖的多少、项目源码的多少、依赖的种类，等等，都会影响构建性能。

3、以 Vite 为例，Vite dev 快，但 build 可能比 Webpack 还慢，所以看 Vite 宣传时应该是不会主打 build 数据的。比如 Mako，目前 Tree Shaking 效果不够，如果我们在准备案例时挑 CJS 或没啥 Tree Shaking 效果的包，就能绕开这个性能的影响点，不懂构建机制的同学通常很难看出这一点。

4、为啥 Tree Shaking 会影响构建性能？效果好的 Tree Shaking 和不好的 Tree Shaking 的产物尺寸差异是巨大的，可能有 5 倍甚至更多。这多出来的尺寸都是要做 ast 到代码的转换、压缩、生成 Source Map 等事情的，这些步骤都非常耗时，所以会严重影响构建性能。

5、为啥 Code Splitting 也会影响构建性能？分两部分，1）Code Splitting 本身就是通过异步加载，做尺寸和加载性能的权衡，如果选择了不合适的 Code Splitting 策略，可能产出就会有大量重复，这些重复的尺寸会做上一条里说的那些事情，影响性能；2）还有一点是和 hmr 相关的，hmr 之后通常会重新生成 Chunk，Chunk 是一堆模块的组合，变更的文件存在于一个很小的 Chunk 和很大的 Chunk 之间，性能上肯定也是有大的差异的。比如 Farm 的 Code Splitting 策略是把依赖拆出去，同时也把 Runtime 拆出去放到 html 里，那剩下留在源码 Chunk 里的代码就很小，这样 HMR 相比之下就会很快。

6、还有一点影响性能的是，大家的功能不同。比如 react 和 preact，大家都能渲染页面，但性能肯定是 preact 好，因为他才多少代码，做得少肯定快啊。构建也是如此。比如 Farm 的 [https://github.com/farm-fe/performance-compare](https://github.com/farm-fe/performance-compare) 里对比 Production Build 的数据，当时的 Farm 应该是没 Tree Shaking 或者 Tree Shaking 功能不全的。（盲猜，猜错了请反馈）

参考：  
[https://github.com/farm-fe/performance-compare](https://github.com/farm-fe/performance-compare)  
[https://github.com/web-infra-dev/bundler-benchmark](https://github.com/web-infra-dev/bundler-benchmark)  
[https://github.com/vitejs/vite-benchmark](https://github.com/vitejs/vite-benchmark)  
[https://turbo.build/pack/docs/benchmarks](https://turbo.build/pack/docs/benchmarks)

#日更
