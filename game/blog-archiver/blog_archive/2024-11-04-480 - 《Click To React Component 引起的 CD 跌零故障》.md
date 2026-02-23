---
title: "480 - 《Click To React Component 引起的 CD 跌零故障》"
date: 2024-11-04
url: https://sorrycc.com/click-to-react-component-bug-version
---

发布于 2024年11月4日

# 480 - 《Click To React Component 引起的 CD 跌零故障》

> 早上新鲜发生的，做个记录。

1、click-to-component 今天（2024.11.4）发布了 1.1.2 版本，umi 内置插件依赖该包实现 clickToComponent 功能，导致执行时会报错。

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in xxxxx//ode_modules/click-to-react-component/package.json
```

2、内部框架 CD 构建成功率直接跌零。

![](https://tcc.sorrycc.com/p/336399f4-8ea3-42df-b15f-677e07bb33ac.jpg)

3、问题原因是 click-to-component 近期[修改了 package.json 中 exports 的定义](https://github.com/ericclemmons/click-to-component/commit/06bff873dcfe8b7abaccceacd9c365b3e02188bf)，看 commit message 是为了加 types.d.ts 让 TypeScript 能找到类型声明文件。

```diff
- "exports": "./src/index.js",
+ "exports": {
+   "import": "./src/index.js",
+   "types": "./src/types.d.ts"
+ },
```

但明显改错了，而且发了 patch 版本。这样修改会导致 `require('click-to-react-component')` 失败，报上述错误，需要加上 `require` 的声明。

4、用户遇到了通常有两种解法，1）patch-package 临时改，2）等官方（框架层或 click-to-react-compnent）发版修复。

5、框架层也有几个解法，1）给 [cnpm 提 bug version](https://github.com/cnpm/bug-versions)，2）Umi 锁版本修复。我们上午用的是 2，其实用 1 应该更好，他这个确实属于 bug version。

6、紧急处理后我们想了下，这个功能属于 dev，为啥会影响生产构建呢？原因是把 `require.resolve('click-to-react-component')` 写到了 Umi 插件 Hook 的外面，导致注册时即执行。于是又[提了个 PR](https://github.com/umijs/umi/pull/12764) 修复这个问题，让这个插件的任何功能都不影响生产构建。

参考：  
[https://github.com/umijs/umi/pull/12764](https://github.com/umijs/umi/pull/12764)  
[https://github.com/umijs/umi/issues/12763](https://github.com/umijs/umi/issues/12763)  
[https://github.com/ericclemmons/click-to-component/issues/93](https://github.com/ericclemmons/click-to-component/issues/93)  
[https://github.com/ericclemmons/click-to-component/commit/06bff873dcfe8b7abaccceacd9c365b3e02188bf](https://github.com/ericclemmons/click-to-component/commit/06bff873dcfe8b7abaccceacd9c365b3e02188bf)
