---
title: "256 - 《Bigfish Doctor》"
date: 2023-02-06
url: https://sorrycc.com/bigfish-doctor
---

发布于 2023年2月6日

# 256 - 《Bigfish Doctor》

> Bigfish 是蚂蚁内部基于 Umi 的框架。

1、Bigfish Doctor 中文名大鱼医生👩🏻‍⚕️，是我们目前正在研发的辅助工具，计划下周上线。他包含一些规则，让 Bigfish 用户可以方便地自行排查问题。他是独立的命令行，无需启动 Bigfish 框架即可单独运行。

```bash
$ tnpx @alipay/bigfish-doctor
```

执行以上命令，即可得到与你项目相关的一份检测报告，区分错误级别和警告级别，同时配上建议的修改方案。

2、为啥做这个？出于两点考虑。1）让 Bigfish 用户更轻松，常见问题不用问 Bigfish 开发者，2）让 Bigfish 开发者，常见问题沉淀成规则后无需再次答疑。

3、可以看出，这个方案里，有哪些规则是最重要的。目前计划做的规则包括，幽灵依赖检测、react 和 react-dom 版本一致性检测、react-router 版本检测、插件检测（包括 umi、babel、webpack 等，不恰当的插件使用通常是出问题的一大原因，且难以排查）、循环依赖检测、锁版检测、umi 插件版本一致性检测（比如 umi 4 不能用 umi 3 版的插件）、老版本功能检测（比如不应该出现 document.ejs，不会生效）。

4、如何实现？分三步。1）数据准备，包括配置、依赖信息、路由信息、代码信息等，代码信息会用 esbuild 做一次只包含源码的构建，通过 metafile 拿到相关信息，之后可能还会借助 esbuild 插件的能力，除代码外的信息通过 Umi 提供的 appData 都能拿到，2）规则加载和执行，我们定义了一套简单的规则定义方式，然后把前面的数据喂给他们，使之运行起来，3）结果收集和展示。

```ts
export default {  
  name: 'PHANTOM_DEPS',
  onCheckCode() {},
  onCheckConfig() {},
  onCheckPackageJSON() {},
}
```

5、Bigfish Doctor 可以在哪里跑？我想到了几个，1）本地跑，自己给项目跑一遍做健康检测，或者在项目遇到问题要求答疑前跑一遍，能解决的问题自行解决，不能解决的把结果给框架开发同学也可以帮助定位问题，2）和答疑流程结合，在提交问题之前要求必须提交 Bigfish Doctor 结果，3）和研发流程结合，部署前的门禁（已有这个步骤）里接入 Bigfish Doctor，要求 Error 类型的规则必须跑过，4）和前一篇介绍的 Bigfish Checker 结合，定期给所有项目跑一遍所有 Bigfish Doctor，不符合的要求改进。

6、目前进展如何？还在研发中，计划下周发布。效果好的话，未来会把实现部分以及适合开源的规则开源。
