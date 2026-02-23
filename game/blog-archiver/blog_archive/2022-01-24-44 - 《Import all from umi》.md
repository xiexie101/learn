---
title: "44 - 《Import all from umi》"
date: 2022-01-24
url: https://sorrycc.com/import-all-from-umi
---

发布于 2022年1月24日

# 44 - 《Import all from umi》

很多人可能都第一次听到。import all from umi 意思是所有 import 都来自 umi。比如 dva 不是 `import { connect } from 'dva'`，而是 `import { connect } from 'umi'`，从 umi 中导出。导出的方法不仅来自 umi 自身，还来自 umi 插件。

这是两年前 Umi 3 加的功能，最近发现 Remix、prisma、vitekit 等框架和工具都有类似实现。

```ts
// 大量插件为 umi 提供额外导出内容  
import { connect, useModel, useIntl, useRequest, MicroApp, … } from 'umi';
```

这种方式有好有坏。好处是通过 umi 将大量依赖管理起来，用户无需手动安装，见图 1。坏处是更黑盒，用户不知道方法来自哪里，调试时有理解成本，尤其是某个插件没生效时，新增的导出方法也不会生效。

Umi 3 的实现是这样，

1、`umi/index.js` 里部分 `export * from '@@/exports'`，`@@` 是临时目录的别名，`@@/exports` 指向 `src/.umi/exports.ts`  
2、插件往 `exports.ts` 里写临时内容，比如 `export { connect } from 'dva'`  
3、DONE

此方案的问题是 umi 依赖变动态了，会随着插件的变化而不同，而现在像 vite、mfsu 等构建优化方案，都会针对依赖进行预编译。两个功能是有冲突的。

Umi 4 的方案有了改进，既能继续 import all from umi，又能解依赖预编译的问题。很多问题都是踩过坑之后才会进步。

1、给 umi 增加别名，指向 `@@/exports`，@@ 是临时目录的别名，`@@/exports` 指向 `src/.umi/exports.ts`  
2、`@@/exports` 同时包含临时文件的导出，还包含 umi 内置的导出
