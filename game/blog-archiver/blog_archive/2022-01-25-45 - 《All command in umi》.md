---
title: "45 - 《All command in umi》"
date: 2022-01-25
url: https://sorrycc.com/umi-all-commands
---

发布于 2022年1月25日

# 45 - 《All command in umi》

![](https://img.alicdn.com/imgextra/i2/O1CN01Ns71j91gp4RC1MURZ_!!6000000004190-2-tps-499-449.png)

![](https://img.alicdn.com/imgextra/i3/O1CN014guXHM27KNWTKsyxb_!!6000000007778-2-tps-591-862.png)

上周看到图 1 和图 2 之后的想法。Rust、Deno 等新语言官方提供工程化方案，社区就可以省很多事。Node 社区很难达成一致的，但我们在小范围内却是可以达成一致的，比如 React 社区、Umi 社区、公司或小团队内部。

承载的方式之前是脚手架，之后也可以是某个工具或框架。就我而言，会希望在 Umi 社区达成一致，并通过 umi 命令承载。

![](https://img.alicdn.com/imgextra/i4/O1CN01e74Bo51qVVgFn3cp3_!!6000000005501-2-tps-628-542.png)

脑暴了下之后，见上图。在 Umi 3 的基础上新增了 install、run、lint、fmt、doc、tsc、compile 和 coverage。install 是自动选择 npm client 的 npm install；run 不支持 npm run，还需要支持 monorepo；compile 是文件到文件的编译，适用于组件库打包。

要实现这种方式，有几个拍脑袋就能想到的问题。

其一要解的是尺寸问题。如果把这些全包在一起，尺寸是个大问题，估计得 500M - 1G，并且大部分命令平时用不到，RIO 就很低。解法是 peerDependencies + 按需安装。部分依赖用户手动安装使用，部分依赖在执行命令时自动安装。

其二要解的是升级问题。大部分功能会依赖现有生态，如果这些依赖有 break change 或大版本更新，如何跟进会是个问题。综合 Umi 之前的经验，有几个策略可结合使用，1 是定期主动更新，2 是优先用用户主动安装的依赖。

你觉得还有啥问题？
