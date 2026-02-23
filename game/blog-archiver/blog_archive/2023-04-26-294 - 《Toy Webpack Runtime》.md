---
title: "294 - 《Toy Webpack Runtime》"
date: 2023-04-26
url: https://sorrycc.com/toy-webpack-runtime
---

发布于 2023年4月26日

# 294 - 《Toy Webpack Runtime》

实现了一个简化版的 Webpack Runtime，以下是笔记和代码。

**介绍下 Webpack Runtime。** 构建工具通常都会需要搭配一套 Runtime 把构建产物跑起来，这个 Runtime 可以很简单，比如 [toy-bundler](https://github.com/sorrycc/toy-bundler/blob/master/src/runtime.ts)、Rollup、ESBuild，也可以很复杂，比如 Webpack。之所以复杂，是因为，1）他牵连了很多功能，包括 Code Splitting、HMR、MF、CSS 加载和 HMR 等，2）他需要和编译时搭配使用，比如 webpack 的 publicPath 就来自 node 环境的配置项；3）Webpack 还在 Runtime 里引入的插件机制，通过插件挂载的方式支持 Code Splitting、HMR、MF 等，看起来特别绕，4）换个地方 resovle promise 的编写方式也让逻辑更绕，`let l; let p = new Promise(resolve => l = resolve); await p; l()`，5）为了让代码更小，有大量简写。

以下是部分简写对照表。

*   `__webpack_require__.i` module execution interceptor
    *   `handle({ id: moduleId, module: module, factory: __webpack_modules__[moduleId], require: __webpack_require__ })`
    *   注入 hmr 处理用
*   `__webpack_require__.m` modules（require 前的 factory）
*   `__webpack_require__.c` cache（require 后的）
*   `__webpack_require__.f`
    *   .j
    *   .jsonpHmr
    *   .remotes
*   `__webpack_require__.e`
    *   调每个 `__webpack_require__.f` 子属性函数，通过 `__webpack_require__.f[key](chunkId, promises)` 补充 promises，然后 Promise.all 执行
*   `__webpack_require__.a`
*   `__webpack_require__.r` define `__esModule` on exports
*   `__webpack_require__.o` 是否有值
*   `__webpack_require__.l` 加载 url 为 script，并绑定 done 函数
    *   url 要拼 `__webpack_require__.p` （publicPath） 和 `__webpack_require__.u(chunkId)`
    *   加载之后等 `webpackJsonpCallback`
*   `__webpack_require__.u` 是啥？
    *   函数，返回 chunkId + .async.js
*   `__webpack_require__.d(exports, definition)` define getter functions for harmony exports
*   `__webpack_require__.n` 返回 getDefaultExport 方法
*   `__webpack_require__.hmrI` 是 hmr invalidate handler

**基于这些复杂度，我提了个 toy version 的纯 Runtime。** 包括，1）基础的模块注册，2）Code Splitting（异步 Chunk 加载），3）简化的 HMR 功能。代码见 [toy-webpack-runtime.mjs · GitHub](https://gist.github.com/sorrycc/1f588d897fafa641689b1fba038e8ab5)。

一、基础的模块注册和执行。

基本的流程是这样，1）先有一个模块的 Map，2）然后实现一个假的 require 方法，3）require 入口模块，从入口开始以此挂载模块并执行。

这一步需要编译时配合的是，要包一下每个模块。比如，

```diff
+ './a': function(module, exports, require) {
const a = require('./a');
module.exports { a, b: 1 };
+ },
```

二、Chunk 的异步加载。

Chunk 的异步加载是基于 `import()` 语法做拆分的（但不仅仅是）。先看需要编译时配合的是，1）转换 `import('xxx')` 为用 `require.ensure()` 加载的方式，2）实现 chunk 的拆分和合并。2 比较复杂，先略过，1 比如，

```diff
- import('xxx')
+ require.ensure(id).then(require.bind(require, id))
```

require.ensure 通过 script 的方式加载对应的 JS 文件，然后通过 jsonp 的形式把新增的 chunk 和 module 注册进来。

三、HMR。

先看 [291 - 《HMR 和 React Refresh 原理》](https://sorrycc.com/hmr-and-react-refresh) 。然后可以跑这段代码验证下 HMR 在 Node 下的效果。

```ts
import { createRuntime } from "./runtime.mjs";

const { _modulesRegistry } = createRuntime(
	{
		"/entry.js": function (module, exports, __mako_require__) {
			const foo = __mako_require__("/foo.js");
			console.log(`Hello ${foo}`);
			module.hot.accept();
		},
		"/foo.js": function (module, exports, __mako_require__) {
			module.exports = "world";
		},
	},
	"/entry.js"
);

console.log("Simulating an update...");
_modulesRegistry["/entry.js"].hot.apply({
	modules: {
		"/foo.js": function (module, exports, __mako_require__) {
			module.exports = "updated world";
		},
	},
});
```

如果顺利，会做如下输出。

```bash
Hello world
Simulating an update...
Hello updated world
```

逻辑是这样。有 entry 和 foo 两个模块，entry 依赖 foo，entry 通过 module.hot.accept() 声明可更新但不冒泡；然后更新 foo，会更新 foo 模块，同时重新执行 entry 模块。

实现逻辑简化下是这样，

1、通过拦截函数拦截 module、require 等对象和方法  
2、在 module 里增加 hot api  
3、在拦截的 require 里建立模块之间的父子关系，同时拦截 require.ensure 覆盖异步 chunk 的加载  
4、用户侧定时调 check 来检查编译器是否有更新  
5、如果有更新，返回 update 对象，包含 modules、chunks 等信息  
6、通过父子关系以及模块标记的 `_selfAccepted` 等信息，找出过时的模块 outdatedModules  
7、从 outdatedModules 里找出标记了 `_selfAccepted` 的模块 outdatedSelfAcceptedModules  
8、让旧的 outdatedModules 失效（dispose）  
9、注册新的 modules  
10、对 outdatedSelfAcceptedModules 执行 requireSelf 方法

**下一步?**

可能有比如 top level await 的支持、hmr 的进阶实现等。

参考：  
[Webpack runtime 简单分析 | 风动之石的博客](https://blog.windstone.cc/front-end-engineering/build/webpack/webpack-runtime.html)  
[291 - 《HMR 和 React Refresh 原理》](https://sorrycc.com/hmr-and-react-refresh)
