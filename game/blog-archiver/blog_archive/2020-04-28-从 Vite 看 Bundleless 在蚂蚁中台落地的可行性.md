---
title: "从 Vite 看 Bundleless 在蚂蚁中台落地的可行性"
date: 2020-04-28
url: https://sorrycc.com/antfin-bundless
---

发布于 2020年4月28日

# 从 Vite 看 Bundleless 在蚂蚁中台落地的可行性

实现 Bundleless 有一些技术点，包括加载、Server & Transform、HMR 等。

加载有几种思路，1) SystemJS 2) ES6 Module in Browser。前者的例子比如 Gravity、CodeSandBox 等，好处是可以兼容旧版本浏览器，坏处是依赖不能直接用，需要 CDN 处理；后者比如 [Vite](https://github.com/vuejs/vite)、[Snowpack](https://snowpack.dev/)、[es-dev-server](https://github.com/open-wc/open-wc/tree/master/packages/es-dev-server)，好处是未来趋势。

Server & Transform 也有几种思路，1) 本地 Dev Server 2) Browser FS。前者是本地启 DevServer，在 node 里做编译；后者是通过接口把文件全部写到浏览器，然后在浏览器里做编译，依赖部分需借助 cdn 的能力。

**如果 Bigfish 要接 Bundleless，我倾向的方案是 ES6 Module + 本地 DevServer。** 并且，Bundleless 要同时解 dev 和 build，不能 dev 用 Bundleless 然后 build 用 webpack，之间的差异点太多，根本 hold 不住。

![](https://img.alicdn.com/imgextra/i3/O1CN0120h3lo1Q4mXzLvnqD_!!6000000001923-2-tps-864-382.png)

选 ES6 Modules 是因为他是未来趋势，好在内部系统的用户基本都是高级浏览器，IE11 和 Chrome 51 虽然还有量，但今年也有计划逐步引导到新浏览器，这样我们才有更多的“弹药”，ES6 Module 是其一。

![](https://img.alicdn.com/tfs/TB1L76kD7Y2gK0jSZFgXXc5OFXa-312-406.png)

如果上 ES6 Module，那么需要依赖也输出 esm 的版本，目前生态还不够，这需要社区的逐渐积累。光输出 esm 还不够，esm 还需要是单文件的，否则在浏览器加载时边 import 边编译，那就太慢了。这部分可借助 snowpack.dev 的 web\_modules，把依赖编译成单文件；或者借助 [g.alipay.com](https://g.alipay.com/) 做成 esm cdn 的服务。

没有 ES6 Modules 输出的怎么处理？一是可以尝试用 umd 版，如果连 umd 都没有，可在框架层限制不允许使用并推荐有 ESM 版本的替代库。在[之前的分析](https://yuque.antfin-inc.com/yunqian/weekly-report/yltgay)中可以看出，被密集使用的依赖还是相对固定的。

能力对齐方面应该是工作量比较重的点，简单实现了跑 DEMO 没啥问题，上生产还是需要对齐很多 Webpack 提供的能力的。比如 publicPath、runtimePublicPath、sourceMap、压缩（包括依赖的部分）、alias、define、targets 和补丁、图片等静态资源的引入和路径问题、node shim & sham、动态 import 拆分、code splitting 等等。

个人感觉 Bundleless 要推开还要几年，包括生态、webpack 能力的对齐等。我们今年可以先试点尝试和积累，方案以终为始，同时支持 dev 和 build。

## 参考

*   [https://github.com/vuejs/vite](https://github.com/vuejs/vite)
*   [https://www.snowpack.dev/](https://www.snowpack.dev/)
*   [https://caniuse.com/#feat=es6-module](https://caniuse.com/#feat=es6-module)
