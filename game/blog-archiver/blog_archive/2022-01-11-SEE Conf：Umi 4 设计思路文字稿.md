---
title: "SEE Conf：Umi 4 设计思路文字稿"
date: 2022-01-11
url: https://sorrycc.com/umi-4-thoughts
---

发布于 2022年1月11日

# SEE Conf：Umi 4 设计思路文字稿

**编者按：本文为 2022.1.8 在 SEE Conf 分享的文字稿，介绍了 Umi 4 的一些设计思路，时间原因，只聊 4 个，包含编译时框架、依赖预打包、默认快、约束与开放。这几天** **colors** **和** **faker.js** **闹得前端社区沸沸扬扬，但 Umi 却能独善其身，希望其中「依赖预编译」的部分能给大家一些启发。**

> 视频版见 [https://www.bilibili.com/video/BV1sL4y1b7ca/](https://www.bilibili.com/video/BV1sL4y1b7ca/) 。

## 背景

![](https://img.alicdn.com/imgextra/i1/O1CN01ZE8dwA1PrxSPbqdu2_!!6000000001895-2-tps-1866-896.png)

大家好，我是来自蚂蚁集团的云谦。

Umi 开发了 3 个版本，并且即将发布第四个大版本，这中间踩了很多坑，也有不少有意思的设计思路和思考，今天会找一些典型的来和大家展开聊下。

![](https://img.alicdn.com/imgextra/i2/O1CN01a8ZeoB26JdFb68bZW_!!6000000007641-2-tps-1844-982.png)

## Umi 是什么

![](https://img.alicdn.com/imgextra/i3/O1CN01RkECHY29BnJvXifsT_!!6000000008030-2-tps-1822-874.png)

如左图所示，在 pages 下新建一个文件，里面导出组件，经过 Umi 做一层魔法转换，即可产出右图的页面。之所以能做到这样，是因为 Umi 在背后构建、路由、运行态等等的事情，把开发者的上手门槛降低最低。

![](https://img.alicdn.com/imgextra/i4/O1CN01egm9461y3aRzZxTta_!!6000000006523-2-tps-1810-992.png)

Umi 是蚂蚁集团出品的前端开源框架，基于 React。我们在内部服务了 10000+ 项目，在去年（2021）中文社区的某个调研报告中，也有 25% 以上的受访者采用 Umi 进行项目开发。Umi 4 目前研发中，其中包含很多新特性。

![](https://img.alicdn.com/imgextra/i1/O1CN01Rkdj9I25mCL4NDJ3d_!!6000000007568-2-tps-1818-844.png)

这是 Umi 到蚂蚁内部开发者的链路图。Umi 和最佳实践开源开发，直接服务社区。但是这在内部使用还远远不够，所以加上内部业务和平台的处理后，再形成更高层的框架 Bigfish，用于服务内部开发者。

![](https://img.alicdn.com/imgextra/i4/O1CN016UyjpL1cPdyapqFGK_!!6000000003593-2-tps-1844-948.png)

Umi 从 1 到 4，遇到很多问题，趟过很多坑，也总结了很多经验。图中这些，部分是设计上的思路，部分是遇到坑后的方案总结，包含着蚂蚁项目和开发者的🩸和💧。时间原因，今天从其中挑了 4 个和大家展开聊聊。

![](https://img.alicdn.com/imgextra/i1/O1CN01qHwwZR1ZzQ4DMiIa4_!!6000000003265-2-tps-1840-866.png)

## 编译时框架

![](https://img.alicdn.com/imgextra/i3/O1CN01M5AJRT1HHIpjSTdsM_!!6000000000732-2-tps-1876-1004.png)

![](https://img.alicdn.com/imgextra/i1/O1CN01zFubYa1p1S3pkcqlV_!!6000000005300-2-tps-1862-1002.png)

不知大家有没有发现，相比 10 年前前端编码有了很多变化，以下这些是和编译时相关的。

1、代码写少了。少了很多脚手架代码，比如数据流、国际化、模块加载、路由等，从而让开发者有更多精力专注在业务视图和逻辑上

2、报错提前了。比如模块不存在，使用了不存在的变量，之前是运行时才能发现，现在报错提前了，在命令行里就能看到。除了 DX 的提升，额外的好处的此类问题不会再被带到线上

3、产物变小了。之前用一个 button 要引入整个 antd，用一个 isEqual 要引入整个 lodash，现在通过 tree-shaking 或 babel-plugin-import 或 TailwindCSS 的 JIT 引擎，能准确知道你用了啥，然后做按需打包，让产物变小

4、功能配置化了。现在很多标准化的功能都配置化了，比如想要兼容 ie11，做个配置，框架就会在背后加补丁，转 es 5，比如想要用 external 自动提速，想要高清方案，想要埋点，想要用 esbuild 压缩，都是一个配置的事情

5、配置约定化了。有些场景配置化还是繁琐了，比如路由、数据流 model、国际化语言文件，可以通过约定的方式，就没必要做配置了

为啥会有这些变化？哪有什么岁月静好，是框架在背后默默做了很多事。

![](https://img.alicdn.com/imgextra/i3/O1CN01MKL9x71kkj8PBNTyW_!!6000000004722-2-tps-1886-1002.png)

![](https://img.alicdn.com/imgextra/i2/O1CN0130hAvR1kmYihzMW5L_!!6000000004726-2-tps-1886-1022.png)

那么编译时框架和非编译时框架的区别是啥？非编译时比如非常流行的 create-react-app，把源码简单直接地交给 webpack 就完成使命；编译时框架则会自己加很多戏，比如拿到源码后做 ast 分析，拿到依赖图谱，做检查，生成临时文件，等等，最后把编译后的源码交给 webpack，这中间的很多事，本来是需要开发者手动处理或编码的。

![](https://img.alicdn.com/imgextra/i2/O1CN01rJTF8s1yP742OgAsT_!!6000000006570-2-tps-1890-1052.png)

社区有很多编译时的尝试。比如 Angular 的 AOT 和 JIT，可以简单理解 AOT 为编译时，JIT 为运行时，AOT 可以让产物更小，同时运行更快；比如 facebook 之前出的 prepack，也是编译时优化的尝试，在保证结果一致的前提下，改变源码，让性能更快；还有最近的 React Forget 更是编译时优化的典型。

![](https://img.alicdn.com/imgextra/i1/O1CN01gJG5cw1IhEsV0uiZB_!!6000000000924-2-tps-1898-1052.png)

Umi 做了很多编译时的事，如果你用过 umi，应该了解 src 下有个 .umi 临时目录，这里存放的文件本是需要开发者自己写的，现在由框架或插件在编译时自动生成。比如在 pages 目录下新建文件即是路由，新建 access.ts 文件即是权限，在 locales 目录下新建文件即是国际化语言，等等。

![](https://img.alicdn.com/imgextra/i3/O1CN01CwuB7120fiekn4lzW_!!6000000006877-2-tps-1890-1048.png)

这部分的 One More Thing 是 Low Import 开发模式，他会随着 Umi 4 发布，但默认不开启。左图是开启前，右图是开启后，区别是大部分 import 语句不用写，交给框架自动补全。这个方案很有争议，喜欢的很喜欢，不喜欢的很不喜欢，但不管如何，这也是编译时领域的一次尝试。

## 依赖预打包

![](https://img.alicdn.com/imgextra/i3/O1CN01nZiYDJ1wSetqjub65_!!6000000006307-2-tps-1894-1050.png)

![](https://img.alicdn.com/imgextra/i1/O1CN01XK75Lv1UkhFuW3Oh4_!!6000000002556-2-tps-1892-1040.png)

不知大家是否有此经历。睡一觉醒来，很多事发生了变化。比如 dev 或 build 跑不起来，啥都没干迭代发布后线上白屏还背了个故障，npm i 时出现某人的求职广告，依赖库被黑客挂马，等等。

![](https://img.alicdn.com/imgextra/i4/O1CN01HX867b1raNUkS9gbW_!!6000000005647-2-tps-1882-1052.png)

然后你打开 package.json 一看，只有 10 个依赖呀，我还写死了版本，这是为啥？因为你忽略了成千上万的间接依赖，而这些依赖总有一个会发生点意外，比如某个依赖的不兼容更新，就会导致你项目挂掉。

![](https://img.alicdn.com/imgextra/i2/O1CN01QcXZdp1LNx2qg7HrH_!!6000000001288-2-tps-1880-1024.png)

问题的根源是 semver。理想的 semver 是 breaking.feat.bugfix，现实的 semver 是 breaking.breaking.breaking。并发 breaking 的 bugfix 版本是社区的常规操作。

![](https://img.alicdn.com/imgextra/i4/O1CN01YI9j0s1HzGr2OzDkB_!!6000000000828-2-tps-1892-1048.png)

是问题就有解，社区已有不少。临时的比如 cnpm 提供的 bug-versions，npm 提供的 resolutions，侵入式改代码的 patch-package 等；长期的比如 npm、yarn 和 pnpm 具备的 lock 能力，tnpm/cnpm 目前暂不支持，但可以用 yarn mode。

![](https://img.alicdn.com/imgextra/i4/O1CN01sS2Xd31g2438c7pfk_!!6000000004083-2-tps-1888-1046.png)

![](https://img.alicdn.com/imgextra/i2/O1CN01r6t5AC1lsnjMBqyXz_!!6000000004875-2-tps-1890-1054.png)

还有个思路是「中间商锁依赖，定期更新，并对此负责」。框架是开发者的倒数第二道防线，自然而然就应该是这个中间商。

![](https://img.alicdn.com/imgextra/i3/O1CN01qV3ujO1uhCEwp9zM6_!!6000000006068-2-tps-1886-1050.png)

这个思路在 Umi 里的实现是依赖预打包。打包前，umi 通过 dependency 依赖 webpack、babel 等，这时如果 babel 出现 bug，会导致 umi 挂，然后用户项目也挂，睡不好，😴；打包后，umi 通过 devDependency 依赖 webpack、babel 等，如果 babel 又出现 bug，umi 会不会受影响，umi 用户的项目也不会受影响，睡得香，😄。

![](https://img.alicdn.com/imgextra/i3/O1CN01lKKG251vfeWKlwLI4_!!6000000006200-2-tps-1884-1058.png)

通过预打包，Umi 把依赖的 node 数从 1309 降到 314，这带来的不仅有安全和稳定，还有安装提速、node\_modules 目录瘦身、命令行启动提速、无 peerDependency 警告等等。

![](https://img.alicdn.com/imgextra/i2/O1CN01LH6XnL1KUzWAGslBw_!!6000000001168-2-tps-1896-1052.png)

简单介绍下如何预打包，分代码和类型定义两部分，分别通过 ncc 和 dts-packer 实现。比如 webpack，借助两个工具，会分别在 compiled/webpack 目录生成 index.js 和 index.d.ts，以实现预打包的目的。

![](https://img.alicdn.com/imgextra/i2/O1CN01pX2qib1gZxMC000qF_!!6000000004157-2-tps-1894-1056.png)

这部分的 One More Thing 是 Father 的下个版本 V4，他是基于 Umi 的组件打包工具，在 V4 里，除了其他 nb 的特性外，还有个重要的点就是前面我们介绍的依赖预打包功能，大家可以期待下。

![](https://img.alicdn.com/imgextra/i1/O1CN01BmTsZn1Ibk7mQSBGG_!!6000000000912-2-tps-1896-1056.png)

还有另一个 Two More Thing 是 browser 侧依赖的锁。前面我们聊的其实只适用于 node 侧依赖，比如 webpack、babel 这些，那像 antd 这些 browser 依赖呢？他们不能被预打包。原因包括：1、尺寸问题，browser 要考虑尺寸，预打包会让 tree-shaking 失效 2、browser 库直接影响线上，风险更高，人肉回归成本高。有一个解法是「importmaps 锁 + 灰度 + 定期人肉更新的中间依赖」，时间原因，具体不展开。

## 默认快

![](https://img.alicdn.com/imgextra/i1/O1CN01o4TMNz1fnPNHGuAaq_!!6000000004051-2-tps-1896-1056.png)

![](https://img.alicdn.com/imgextra/i1/O1CN01SPLQke1p1S3gqvSFl_!!6000000005300-2-tps-1900-1056.png)

大家在日常工作中，应该多少都经历过各种类型的慢。比如 Lint 慢、依赖安装慢、构建慢到 OOM、CI 慢、本地启动慢、提交慢、node\_modules 大、测试慢等，一些具体的数据比如 ant-design-pro 脚手架启动时间在 30s，改完代码后热更新时间在 3s，而蚂蚁某中后台较慢应用的启动时间在 5 分钟，热更新时间半分钟。改完代码去趟厕所回来，可能还没好…

![](https://img.alicdn.com/imgextra/i2/O1CN01M3z2191SgukswKRcx_!!6000000002277-2-tps-1898-1058.png)

关于提速我们之前整理了三个法宝，缓存、延迟处理和 Native Code。缓存能提速是因为做过的事情不过第二遍，比如 webpack 5 的物理缓存，babel 缓存，预编译依赖作为缓存等；延迟处理能提速是因为把不重要的事情拆出去后，关键进程就快了，比如各种按需和延迟编译都属于此类；Native Code 主要指 esbuild、swc 此类，能提速是利用语言特性进行降维打击，主要用在压缩和编译上，效果显著。

![](https://img.alicdn.com/imgextra/i4/O1CN01Li1g3V1OqIP4yEzGW_!!6000000001756-2-tps-1896-1054.png)

这是我们整理个各个阶段的提速方案，两个维度，时间和方法。可以看到，1、利用缓存的方案很多 2、现在和未来的方案大量基于 Native Code 3、效果好的方案是多个方法结合使用，比如 esbuild 虽然单体快，但纯用的效果却不一定好。

![](https://img.alicdn.com/imgextra/i4/O1CN01VAPMMH1bqNTrkpQ3t_!!6000000003516-2-tps-1896-1052.png)

Umi 在这部分的第一个解是 MFSU，基于 webpack 5 Module Federation 特性的提速方案。1、基于 webpack，解决我们既要 webpack 的功能和生态，又要 Vite 的速度的问题 2、在蚂蚁内部已服务 1000+ 应用 3、快是他的主要特点，除了启动快、热更快、页面打开也快，注意页面打开也快，这是 esm bundless 方案所不具备的 4、可上生产，除了本地快，CI & CD 流程也要快。

![](https://img.alicdn.com/imgextra/i2/O1CN01dEMqyN219wnTGRBOy_!!6000000006943-2-tps-1898-1056.png)

这是 MFSU 两个版本和 webpack 对比的效果。V2 在二次启动和热更方面相比 webpack 都有大幅提升。V3 在 V2 的基础上，对首次启动也做了改进，有一点在图上没体现的是，V3 在页面打开速度上也做了改进，不会有通常 esm bundless 的大量请求问题。

![](https://img.alicdn.com/imgextra/i1/O1CN01uyAPM81uuw7ZRckgN_!!6000000006098-2-tps-1890-1056.png)

介绍下 MFSU 的原理。项目源码会走到 babel/swc 插件，插件会做两件事，1、修改源码，从 remote 获取资源 2、收集依赖到依赖图谱；然后依赖图谱会通知 dep builder 做依赖的预编译，这里可以选 esbuild 或 webpack，产出的格式都是 module federation；最后修改后的源码会加载这份预编译后的依赖，形成 BI 环。

![](https://img.alicdn.com/imgextra/i2/O1CN01RBnDoJ1ZzsSqXiHjA_!!6000000003266-2-tps-1908-1058.png)

这是 MFSU 的时间线。到目前已经迭代了 3 个大版本。V1 版本是最理想的版本，依赖预编译走 cdn，让首次启动也快，但覆盖率有限，所以效果有限，并且维护成本高；被打击后 V2 版本回归现实，依赖预编译走本地，和 Vite 的模式类似，覆盖率 95%+，效果很好，但也留了些边界场景；V3 是 V2 的优化，解了目前遇到的所有问题，不仅首次启动快，页面打开也快；V4 在路上，2022 年做，主要是关于协作的。

![](https://img.alicdn.com/imgextra/i1/O1CN01AD9h2x1HQSkrkRrk3_!!6000000000752-2-tps-1890-1052.png)

![](https://img.alicdn.com/imgextra/i4/O1CN01dZ0tO41trRU7HFyTd_!!6000000005955-2-tps-1892-1056.png)

MFSU 这么好，怎么用呢？😄 为大家准备了两种方式。1、umi 4 默认启用了 mfsu，两行命令即可尝鲜 2、大家的项目可能不是基于 umi，也可以用，基于底层库，适用于任意 webpack 5 项目，我特意准备了一个例子，带上 antd 等库之后，空缓存首次启动也是 1s 内。

![](https://img.alicdn.com/imgextra/i3/O1CN01KjKu8n1YsGGCeKePp_!!6000000003114-2-tps-1894-1062.png)

Umi 的第二个解是多构建引擎。不止支持 webpack，也支持 vite，还有试验性的 esbuild，照顾朋友们的不同偏好。Umi 通过配置在不同模式之间切换，并尽可能保证功能的一致性。大家是否有感受到，现在社区有一种趋势是，dev 用 vite 提速，build 用 webpack 提速。

![](https://img.alicdn.com/imgextra/i2/O1CN01Ncctdi1GHTMWp0E8w_!!6000000000597-2-tps-1898-1058.png)

Umi 4 对于默认快还有更多解。源码编译用 swc、依赖编译用前面介绍的 MFSU、然后把 esbuild 用到 js 压缩、css 压缩、依赖编译、jest 编译、以及配置文件和 MOCK 文件的编译上。此外，还有右下角的 fast refresh、lazy import、remote cache、code splitting 策略等。总之，要默认快，是个细节多又体系化的活。

![](https://img.alicdn.com/imgextra/i1/O1CN01vmBp752A1Y4h7D5oq_!!6000000008143-2-tps-1894-1054.png)

这部分的 One More Thing 是 ESMi，时差原因，大家在 D2 上可能已经听过他的介绍，这里再介绍下他的原理。ESMi 是我们的 ESM Bundless 方案，面向未来的方案，不仅适用于本地命令，还适用于搭建系统。他包含 Server 和 Client 两部分功能。Client 会把 depinfo 传给 Server 并要求 ImportMaps，Server 需要分析依赖并做云端构建，继而返回 ImportMaps，Client 拿到 ImportMaps 后就可以在浏览器里渲染了。

## 约束与开放

![](https://img.alicdn.com/imgextra/i1/O1CN01bH4ywU1ghk5jgEO5w_!!6000000004174-2-tps-1892-1054.png)

![](https://img.alicdn.com/imgextra/i3/O1CN01vUyw0o1kZHEXnXtvM_!!6000000004697-2-tps-1890-1036.png)

社区同学经常一方面抱怨 Umi 太黑盒，一方面又抱怨这么多选择，我应该选哪个；蚂蚁内部同学经常抱怨内置方案我不喜欢，能否换一个？

之所以有这个问题，归根结底还是场景不同。是个人还是团队，是同一个团队还是不同团队。团队需要一致性。到达终点的路很多，但这些路在一个团队内却不应该放开让大家选。

![](https://img.alicdn.com/imgextra/i2/O1CN01wO30SQ1xiycwKyNy9_!!6000000006478-2-tps-1890-1042.png)

所以「社区要开放，团队要约束」。然后约束要有度。约束越多，越一致。但又不能把路堵死，堵久了容易固步自封。

![](https://img.alicdn.com/imgextra/i3/O1CN01ODevGz1oUTXqbwJa6_!!6000000005228-2-tps-1896-1028.png)

蚂蚁内部有 50 条「强约束」规则集，目的除了方案和编码一致性，还可以提升安全性、规避常见错误、提升可维护性等。为了让这些规则不像 eslint 可以在本地轻易跳过，采取了服务器下发的方式。

举一些规则的例子。比如不能使用除 dva、use model 之外的数据流方案，不能无理由使用 eval、new Function、不能混用 cjs 和 esm 模块规范，组件代码不能超过 600 行，不能使用 resolution 锁定一方库和二方库版本。

![](https://img.alicdn.com/imgextra/i3/O1CN01BPRwcc24v4OV6Di9s_!!6000000007452-2-tps-1892-1040.png)

还有个特殊规则是同一 major version 下「只能使用框架最新版」，这使得我们全局只有一个框架版本，对于框架升级和应用治理都有很大帮助，并且副作用很小，RIO 很高。

![](https://img.alicdn.com/imgextra/i3/O1CN019gkcOn1TdzqWrRXN2_!!6000000002406-2-tps-1890-1050.png)

再来看社区的方案。面向社区的 Umi 框架会更倾向「原子功能 + 组装」的使用方式，尽量白盒，相比「集中式」用户会有更多控制权。

举个例子，比如提供功能 A，集中式是配置 A: {} 开启，组装式是分别提供 base 和 A，用户通过 A + base 的方式开启。再具体点比如 jest 配置，Umi 4 的组装式是在 jest.config.ts 里配置 export default configUmiAlias(createConfig(opts))，把 createConfig 和 configUmiAlias 做个组装。

![](https://img.alicdn.com/imgextra/i1/O1CN01XWyr4C1uWCjbO2yar_!!6000000006044-2-tps-1888-1038.png)

One More Thing，蚂蚁内部强约束的规则集会在 SEE Conf 分享中公开，可能会大家会有些借鉴意义。

## Umi 4

![](https://img.alicdn.com/imgextra/i3/O1CN01Qr49pj1uamh6T07vl_!!6000000006054-2-tps-1886-1028.png)

最后，Umi 4 将于近期发布，在此和大家分享下 Umi 4 的特点。

1、体系化有体感的默认快  
2、依赖预打包让你的项目安全又稳定  
3、双构建引擎给用户更多选择  
4、技术栈最新把底层依赖升到最新，尤其是 react router 6，我太喜欢这个版本了  
5、最佳实践 V2，包含请求、数据流和国际化的相关更新  
6、Umi Pro 是内部 Bigfish 框架的对外版本，解我们自己的问题，同时也给社区另一个集中化框架的选择。

![](https://img.alicdn.com/imgextra/i4/O1CN01hEusC31kh3xxRMbNa_!!6000000004714-2-tps-1886-1044.png)

感谢能读到这的朋友们，可以扫码加我微信继续沟通。
