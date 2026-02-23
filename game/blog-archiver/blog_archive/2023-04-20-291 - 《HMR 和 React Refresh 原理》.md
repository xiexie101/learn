---
title: "291 - 《HMR 和 React Refresh 原理》"
date: 2023-04-20
url: https://sorrycc.com/hmr-and-react-refresh
---

发布于 2023年4月20日

# 291 - 《HMR 和 React Refresh 原理》

> 近期可能会有较多和构建相关的内容调研。

## HMR 基础

以 Webpack HMR 为例，看下 HMR 的 API 和使用场景。

```ts
// 接收自己更新，更新后重复执行自己，不往上冒泡
module.hot.accept();

// 接收依赖更新，更新后执行回调函数，不往上冒泡
module.hot.accept(['dep1'], () => {
  console.log('dep1 changed');
});

// 让自己失效，往上冒泡
// 通常在 accept 之后，遇到一些场景又希望自己失效时调用
module.hot.invalidate();

// 标记一些依赖为不可更新，这些依赖的更新会触发页面 reload
module.hot.decline(['dep1']);
// 同上，标记自己为不可更新
module.hot.decline();

// 设置或移除当前模块被自动替换时执行的回调函数
module.hot.dispose(fn);
module.hot.removeDisposeHandler(fn);
```

参考：  
[Hot Module Replacement - API | webpack](https://webpack.js.org/api/hot-module-replacement/)  
[Hot Module Replacement - Guide | webpack](https://webpack.js.org/guides/hot-module-replacement/)

## HMR 原理

Webpack 的文档讲得很详细了。

1、每个模块会做这些事，1）有 parents 和 children 属性，用来跟踪父子关系，2）给 hot API，包含前面说的那些功能，3）给两个方法 check 和 apply。  
2、怎么获取更新？先 check 再 apply 。check 就是检查更新并下载更新的 module 和 chunk；apply 会，1）将所有更新模块标记为 invalid，2）每个模块分别检查他自己或父代模块是否有 accept handler，没有则刷新，有则冒泡到最先遇到的 accept handler 模块为止，3）dispose 和 unload 每个 invalid 的模块，4）执行所有 accept handler。  
3、主要逻辑在 runtime，compiler 负责提供更新后的 module 和 chunk 列表

![](https://img.alicdn.com/imgextra/i3/O1CN010wNTDE22UO0eRTPeP_!!6000000007123-0-tps-805-837.jpg)

（注：图来自网络。）

简化后的 runtime 代码如下。

```ts
// __webpack_require__.i 是 module execution interceptor，require 模块时调用
__webpack_require__.i.push(options => {
	var module = options.module;
	var require = createRequire(options.require, options.id);
	module.hot = createModuleHotObject(options.id, module);
	module.parents = currentParents;
	module.children = [];
	currentParents = [];
	options.require = require;
});

// ...
```

1、createRequire 用来建立模块之间的父子管理，通过 parents 和 children 字段实现。  
2、createModuleHotObject 返回 hot API，包含前面说的那些方法，比如 check、accept、invalidate、dispose 等

TODO：applyHandler 的逻辑代码在 JavascriptHotModuleReplacement.runtime.js 里。

参考：  
[Hot Module Replacement - Concepts | webpack](https://webpack.js.org/concepts/hot-module-replacement/)  
[webpack/HotModuleReplacement.runtime.js at main · webpack/webpack · GitHub](https://github.com/webpack/webpack/blob/main/lib/hmr/HotModuleReplacement.runtime.js)  
[webpack/JavascriptHotModuleReplacement.runtime.js at main · webpack/webpack · GitHub](https://github.com/webpack/webpack/blob/main/lib/hmr/JavascriptHotModuleReplacement.runtime.js)  
[Webpack HMR 原理解析 - 知乎](https://zhuanlan.zhihu.com/p/30669007) （有点过时）  
[GitHub - careteenL/webpack-hmr: 🔨Easy implementation of webpack Hot-Module-Replacement(hmr)](https://github.com/careteenL/webpack-hmr) （基于上一篇文章的 toy-hmr 实现）

## 上一代 HMR + React

先看传统的 HMR + React 的接入方式。

代码如下。当 `./routes` 及其依赖有变更时，重新执行 render 逻辑，重头渲染整个 React 组件树。其中 `accept[deps, fn]` 表示 deps 更新时执行 fn 函数。这种方式的缺点是，1）组件状态（比如 useState(0) 声明的状态）无法保持，2）全部重新渲染，性能会不太好。

```ts
function render() {
  const <RoutesApp /> = require('./routes');
  ReactDOM.render(<RoutesApp />, root);
}
render();
module.hot.accept(['./routes'], () => {
  render();
});
```

## React Refresh

再看 React Refresh 的接入方式。

分三步。效果是在传统 HMR 的继续上，支持 hooks 状态的保留等，这应该是现代框架的标配。

1、ReactDOM 之前插入这段。

```ts
import RefreshRuntime from 'react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
```

2、然后在每个文件的前后加入这段。每个文件都 accept 自己，当自己及子依赖更新时，执行自己，跑 `RefreshRuntime.performReactRefresh()` 更新 React 状态。

```ts
// 头部插入这个
import RefreshRuntime from 'react-refresh/runtime';
var prevRefreshReg;
var prevRefreshSig;
prevRefreshReg = window.$RefreshReg$;  
prevRefreshSig = window.$RefreshSig$;  
window.$RefreshReg$ = (type, id) => {  
  RefreshRuntime.register(type, module.id + id);  
};
window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;

// --> 你原来的模块内容在这里

// 结尾插入这个
window.$RefreshReg$ = prevRefreshReg;  
window.$RefreshSig$ = prevRefreshSig;  
module.hot.accept();  
RefreshRuntime.performReactRefresh();
```

3、加入 react-refresh/babel 插件，编译每个模块。这里做几件事，1）调 `$RefreshReg$(component, key)` 绑定组件到 Runtime，2）调 `$RefreshSig$` 识别 Hooks 调用。

DONE。

参考：  
[react/ReactFreshBabelPlugin-test.js at main · facebook/react · GitHub](https://github.com/facebook/react/blob/main/packages/react-refresh/src/__tests__/ReactFreshBabelPlugin-test.js)  
[How should we set up apps for HMR now that Fast Refresh replaces react-hot-loader? · Issue #16604 · facebook/react · GitHub](https://github.com/facebook/react/issues/16604#issuecomment-528663101)  
[Fast Refresh · React Native](https://reactnative.dev/docs/fast-refresh)

## 复杂世界的 React Refresh

以 react-refresh-webpack-plugin 为例，真实世界的 React Refresh 还需要做一些额外的事，来让开发体验更好。

1、为 module.exports 的每个 react component 成员都注册上（和 babel 功能会有部分重复？）  
2、exports 信息中有非 react component 时，直接调用 invalidate() 往上冒泡，因为如果修改的是非 react component 导出的内容，`RefreshRuntime.performReactRefresh()` 是覆盖不到的，现象是修改代码后没有反应，也不会刷新页面  
3、处理 accept 和 dispose 出错时的边界场景和状态恢复  
4、如果全部是 react components exports，比对前后两次 exports 的内容，如果有不同，调 invalidate() 往上冒泡  
5、最后才是调 RefreshRuntime.performReactRefresh() 做 React Component 的更新（作者加了 30ms 的延迟）

参考：  
[GitHub - pmmmwh/react-refresh-webpack-plugin: A Webpack plugin to enable “Fast Refresh” (also previously known as Hot Reloading) for React components.](https://github.com/pmmmwh/react-refresh-webpack-plugin)  
[codesandbox-client/refresh-transpiler.ts at master · codesandbox/codesandbox-client · GitHub](https://github.com/codesandbox/codesandbox-client/blob/master/packages/app/src/sandbox/eval/transpilers/react-refresh/refresh-transpiler.ts)  
[vite-plugin-react/fast-refresh.ts at main · vitejs/vite-plugin-react · GitHub](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/src/fast-refresh.ts)  
[farm/react\_refresh.rs at main · farm-fe/farm · GitHub](https://github.com/farm-fe/farm/blob/main/rust-plugins/react/src/react_refresh.rs)  
[parcel/ReactRefreshRuntime.js at v2 · parcel-bundler/parcel · GitHub](https://github.com/parcel-bundler/parcel/blob/v2/packages/runtimes/react-refresh/src/ReactRefreshRuntime.js)
