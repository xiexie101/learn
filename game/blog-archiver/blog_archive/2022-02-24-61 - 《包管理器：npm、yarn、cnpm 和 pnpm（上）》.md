---
title: "61 - 《包管理器：npm、yarn、cnpm 和 pnpm（上）》"
date: 2022-02-24
url: https://sorrycc.com/engineering-npm-client
---

发布于 2022年2月24日

# 61 - 《包管理器：npm、yarn、cnpm 和 pnpm（上）》

> 工程化小册试写章节

先看包管理器是做什么的。

最早的包管理器是在 2020 年 1 月发布的 npm。包管理器除了管理依赖的安装、删除、更新、添加，还做了很多其他事，包括 npm 包发布、package.json 更新、脚本运行、依赖锁定、Monorepo 支持、缓存支持等等。

虽然做的事就是这些，但处理方式可以是不同的，不同的处理方式决定了速度、磁盘占用、出错率和安全性。包管理器从最早的 npm，逐步发展出 yarn classic、yarn berry、pnpm，还有本土阿里出的 cnpm。

那为什么除了 npm，还会有这么多其他的包管理器？其实是 npm 没做好，我们从几个经典问题说起。

1、Phantom Dependencies（幽灵依赖）  
2、Npm Doppelgangers（重复依赖）  
3、node\_modules 黑洞

Phantom Dependencies 是指引用了不应该存在的依赖，然后这个依赖可能随时会消失。举个例子，比如项目依赖了 a，a 依赖了 b，跟进 npm 的拍平策略，a 和 b 会同时出现在项目的 node\_modules 下，然后项目依赖了 b，b 就是幽灵依赖，因为他会随着依赖的变化以及包管理器的迭代发生变化。（这个在上一篇其实也有讲）

NPM doppelgangers 指某些场景下，node\_modules 下不得不存在一个依赖的多份相同版本的实体。举个例子，见图1，项目有 4 个依赖，两个依赖依赖了 A 的版本 1，另外两个依赖了 A 的版本 2。此时包管理器在安装时，如果先遇到 A@1，那 A@1 会往上提，减少 A@1 的重复，然后 A@2 就不能往上提，因为已经存在同名的 A，然后会有两份 A@2。虽然几率小，但遇到了也挺麻烦的，除了影响安装速度和磁盘尺寸，还会有重复的类型和文件，导致多实例问题等。

![](https://img.alicdn.com/imgextra/i1/O1CN014xkVl71Fj7faTjijg_!!6000000000522-2-tps-1896-944.png)

node\_modules 黑洞指如果你有 100 个项目，每个项目都安装相同的依赖 A，你会有 100 份依赖 A 的实体。这也同时影响安装速度和磁盘尺寸。

除此之外，最初的 npm 还不具备 lock 能力、monorepo 能力、缓存能力等。

然后在 2016 有了Yarn 1（即 Yarn Classic），出自 Facebook 团队，支持 lock、monorepo、缓存等，同时提升了安装速度，一下就把包管理工具的基线拉高了，但其依旧使用拍平的 node\_modules 结构，所以上述 3 个问题并没有解；之后 2017 年有了 pnpm，作者是乌克兰的小伙，他引入 content-addressable store 来同时解上述 3 个问题，见图 2。

![](https://img.alicdn.com/imgextra/i4/O1CN01WvmLjR21rSQy2TBc5_!!6000000007038-2-tps-2920-1392.png)

作为短文比较长了，剩下的放下一篇写。

TODO：

1、pnpm 具体如何解上述 3 个问题  
2、yarn berry & PnP  
3、corepack  
4、常用命令对比  
5、Monorepo 支持  
6、我的想法
