---
title: "255 - 《Bigfish Checker》"
date: 2023-02-02
url: https://sorrycc.com/bigfish-checker
---

发布于 2023年2月2日

# 255 - 《Bigfish Checker》

> Bigfish 是蚂蚁内部基于 Umi 的框架。

1、Bigfish Checker 是昨天写的，中文名大鱼门禁，用于在真实项目中验证 Bigfish 的运行情况。名字取得不太好，大家看完介绍有更好的想法，欢迎告诉我。

2、实现很简单，就 100 来行代码。基本逻辑是这样，1）获取项目元数据，包括所有使用 Bigfish 框架的项目的发布日期、版本分布、git 地址等，2）跑个循环，每个项目走 git clone、npm i、跑任务、统计收集的流程。

```bash
# 随机取 100 个项目跑幽灵依赖检测任务，跑完删除项目以节省空间
$ tnpx @alipay/bigfish-checker --task phantomDependency --limit 100 --random --rimraf
```

3、功能主要在校验任务上，目前实现了 build（验证 build 是否通过）、canary（验证 canary 版本的 build 是否通过）、phantomDependency（验证是否包含幽灵依赖）、mockImports（验证是否有在 src 源码里引用 mock 目录下的文件）、icons（验证项目开启 icons 方案之后是否会出问题）。

4、从校验任务来看，不难发现，我们可以把 Bigfish Checker 用到几个场景。1）定时跑，比如每 4 小时跑一次，可用于发现三方依赖的 break change 发布，2）发布前跑一遍，用以提升框架发版质量，我们今天调整了发布方式，正常情况话，需先发 canary 验证 100 个项目才发正式版，3）验证功能，比如新写了一个功能，可以用他让大量项目开启试试是否有问题，4）统计数据，比如某种写法的使用率。

5、遇到的问题有两个，1）在哪跑，2）如何跑的快。在哪跑？在本机跑不太现实，build 太耗 cpu，跑了这个就不能干活了；在 cloudide 上跑是个选项，但是可能机器性能不太好，跑起来太慢，跑 100 个项目花了 4 小时；申请几台 M1 Mac Mini 来跑（这是计划中的备选方案）。如何跑的快？想到的方案是分布式，多开几台电脑一起跑就快了，在尝试的方案是利用公司的 tf 任务，并发地去跑（同事调研中）。

6、Bigfish Checker 目前已发挥的作用包括，1）这次发布前一天（昨天）帮我找到了一些边界场景问题，比如 decorator 的使用在 umi 的测试用例中是没有的，只有真实的老项目才会用到，2）统计了幽灵依赖的使用情况，3）统计了 src 中依赖 mock 下文件的使用情况，4）验证了新写的 icons 功能所有项目开了都不会挂。
