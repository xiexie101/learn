---
title: "Module Federation"
date: 2020-03-24
url: https://sorrycc.com/module-federation
---

发布于 2020年3月24日

# Module Federation

> 内部分享版 @ 2020.4.2 。

![](https://img.alicdn.com/imgextra/i4/O1CN01Zjf9pY1ypg2MX8e8Q_!!6000000006628-2-tps-998-996.png)

## What

Module Federation `[ˌfedəˈreɪʃn]` 使 JavaScript 应用得以在客户端或服务器上**动态**运行**另一个 bundle 的代码**。

一些关键点，

*   **动态**，我理解包含两个含义，1) 运行时，跑在浏览器而非 node 编译时 2) 按需，可以把一个包拆开来加载其中一部分
*   **另一个 bundle 的代码**，之前应用之间做共享是在文件级或 npm 包级 export 成员，现在可以在应用级 export 成员属性

![](https://img.alicdn.com/imgextra/i4/O1CN01Htr3zh1WSUkOs46WP_!!6000000002787-2-tps-978-573.png)

一些概念，

*   **Remote**，被 Host 消费的 Webpack 构建
*   **Host**，消费其他 Remote 的 Webpack 构建

一个应用可以是 Host，也可以是 Remote，也可以同时是 Host 和 Remote。

## HOW （原理）

解释 Module Federation 如何运转？Host 如何消费 Remote？以及 Remote 如何优先使用 Host shared 的依赖？

### ModuleFederationPlugin

整体是通过 ModuleFederationPlugin（[https://github.com/webpack/webpack/blob/dev-1/lib/container/ModuleFederationPlugin.js](https://github.com/webpack/webpack/blob/dev-1/lib/container/ModuleFederationPlugin.js)）串起来的。

配置示例，

```js
new ModuleFederationPlugin({
  name: "app-1",
  library: { type: "var", name: "app_1" },
  filename: "remoteEntry.js",
  remotes: {
    app_02: 'app_02',
    app_03: 'app_03',
  },
  exposes: {
    antd: './src/antd',
    button: './src/button',
  },
  shared: ['react', 'react-dom'],
}),
```

属性，

*   **name**，必须，唯一 ID，作为输出的模块名，使用的时通过 `${name}/${expose}` 的方式使用
*   **library**，必须，其中这里的 name 为作为 umd 的 name
*   **remotes**，可选，表示作为 Host 时，去消费哪些 Remote
*   **exposes**，可选，表示作为 Remote 时，export 哪些属性被消费
*   **shared**，可选，优先用 Host 的依赖，如果 Host 没有，再用自己的

![](https://img.alicdn.com/imgextra/i1/O1CN01Qp0mac1HAtHv1ogYI_!!6000000000718-2-tps-681-375.png)

产物，

![](https://img.alicdn.com/imgextra/i2/O1CN01K89qLV1y1krgTwird_!!6000000006519-2-tps-654-684.png)

*   **main.js**，应用主文件
*   **remoteEntry.js**，作为 remote 时被引的文件
*   **一堆异步加载的文件**，main.js 或 remoteEntry.js 里可能加载的文件

所以比如下面的应用集群，

![](https://img.alicdn.com/imgextra/i3/O1CN01tZ1omM1Tj2ChC0ZbE_!!6000000002417-2-tps-978-573.png)

加载方式应该这样，

```js
<script src="C/remoteEntry.js"></script>
<script src="B/remoteEntry.js"></script>
<script src="A/main.js"></script>
```

`C/remoteEntry.js` 和 `B/remoteEntry` 的顺序没有要求，只要在 `A/main.js` 之前就好了。

### A 如何消费 B？

B 源码，

```js
// src/react.js
export * from 'react';

// webpack.config.js
...
exposes: {
  react: './src/react',
},
```

A 源码，

```js
// 异步加载 B 的 react 模块
const React = await import('B/react');
```

B 构建产物，

```js
// windows 变量
let B;

const moduleMap = {
  'react': () => {
    return Promise.all([e('a'), e('b'), e('c')]),
  },
};

B = {
  get(moduleId) {
    return moduleMap(moduleId);
  }
}
```

A 构建产物，

```js
const modules = {
  'B': () => {
    return B;
  }
};

// 异步获取模块 export 内容
function e(moduleId) {
  // 1. 取 shared 的模块

  // 2. 取 remote 的模块
  const idToExternalAndNameMapping = {
    'B/react': ['B', 'react'],
  };
  // 从 module B 里取 react
  const data = idToExternalAndNameMapping[moduleId];
  __webpack_require__(data[0]).get(data[1]);

  // 3. 取当前项目的异步模块
}

// 初始化
e('B/react');
```

原理：

1.  多个 Bundler 之间通过全局变量串联
2.  Remote 会 export get 方法获取他的子模块，子模块的获取通过 Promise 以按需的方式引入

### A 如何让 B 用 A shared 的库？

B 构建产物，

```js
let B;

__webpack_require__.Overrides = {};

function e(moduleId) {
  // 1. 取 shared 的模块
  // 当前项目的 shared 模块列表
  const fallbackMapping = {};
  // 先从 Overrides 里取，再从当前项目里取
  push_require_try(__webpack_require__.Overrides[moduleId] || fallbackMapping[moduleId]);

  // 2. 取 remote 的模块

  // 3. 取当前项目的异步模块
}

B = {
  override(override) {
    Object.assign(__webpack_require__.Overrides, override);
  }
}
```

A 构建产物，

```js
B.override(Object.assign({
  'react': () => {
    // A 的 react 内容
  },
}, __webpack_require__.Overrides));
```

原理：

1.  Remote（B）export override 方法，Host（A) 会调用其关联 Remote 的 override 方法，把 shared 的依赖写进去
2.  Remote（B) 获取模块时会优先从 override 里取，没有再从当前 Bundle 的模块索引里取

这样，B 里面在 require react 时，就会用 A 的 react 模块。

## Why（场景）

Module Federation 可以用在哪里？

### 微前端

![](https://img.alicdn.com/imgextra/i4/O1CN01MHzEsj1MYJcZPyBdg_!!6000000001446-2-tps-982-734.png)

这是去年画的一张微前端的图，其中最下面的 “公共依赖加载” 一直是没有非常优雅的方案。 ![](https://img.alicdn.com/imgextra/i4/O1CN01TLP5291b8PSQhBvVh_!!6000000003420-2-tps-845-553.png) ![](https://cdn.nlark.com/yuque/0/2020/png/86025/1586845005745-fc71304d-9190-4f4d-9c40-668be149a944.png)

方法一：让每个子应用都分开打包，主应用不管，这样不会有问题，但问题就是尺寸大，而且大了不是一点点。

方法二：主应用包含 antd 和 react，子应用如果版本一致不打包 react 和 antd，版本不一致就自己打一份，但有几个问题，1) antd 和 react 是通过 umd 的方式同步载入的，主应用初始化会比较慢 2) 主应用升级了 antd 的时候，所有子应用可能需要一起升级，这个成本就很大了

方法三：利用 Module Federation 的 shared 能力，子应用的依赖如果和主应用匹配，那么，能解决方法二里的第一个问题，但第二个问题依旧解不了

方法四：利用 Module Federation 的 remotes 能力，再提一个应用专门提供库被消费，看起来前面的问题都能解 ![](https://img.alicdn.com/imgextra/i3/O1CN01M8Hslf1bX8qSx1DOx_!!6000000003474-2-tps-731-846.png) ![](https://cdn.nlark.com/yuque/0/2020/png/86025/1586845006841-b8a31c3d-7203-448f-b826-339432c71151.png)

有没有感觉技术又轮回到了 seajs + spmjs 的时代。

### 应用集群

> 微前端是应用集群的解法之一，但不是唯一方案。

现状是，通过 npm 共享组件。 ![](https://img.alicdn.com/imgextra/i3/O1CN01WIO7zW28yVpkq9jrg_!!6000000008001-2-tps-1114-660.png) ![](https://cdn.nlark.com/yuque/0/2020/png/86025/1586845007879-e48a1a5a-06a9-4299-a17a-273488a8327b.png)

基于 Module Federation，除通过 npm 共享依赖，还可以有运行时的依赖、组件、页面甚至应用的直接共享。

…

这样一来，灵活性就非常大了，可以在应用的各个层面做共享。A 应用引用 B 整个应用，也可以应用 B 的的页面和组件，还可以提一个库应用，做 npm 依赖的运行时共享。

### 编译提速，应用秒开

> 我们大部分的场景不是微前端或应用集群，Module Federation 还可以帮助我们干啥？

现在项目组织和文件依赖通常是这样， ![](https://img.alicdn.com/imgextra/i1/O1CN013njNfH1ctPil9zdxt_!!6000000003658-2-tps-1233-587.png) ![](https://cdn.nlark.com/yuque/0/2020/png/86025/1586845009335-867be96e-aab2-4bcc-aa73-448b669bb54e.png)

现状是，

*   全部打成一个包
*   打包时间较慢，据统计，内部云编译平台的平均编译时间在 100s 以上

期望的是，

*   node\_modules 下的提前打包好，通过 runtime 的方式引
*   本地调试和编译时只打项目文件
*   快，根据项目复杂度可提升到 **1s - 7s** 之内

![](https://img.alicdn.com/imgextra/i3/O1CN01eSCqfg273Qr9kvCBn_!!6000000007741-2-tps-2184-498.png) ![](https://img.alicdn.com/imgextra/i3/O1CN01eSCqfg273Qr9kvCBn_!!6000000007741-2-tps-2184-498.png)  
![](https://cdn.nlark.com/yuque/0/2020/png/86025/1586845009935-1bd32d4f-567b-4950-8972-4ddc32ec6f72.png)

举一个对比的例子，比如 external，我们之前还有做过自动的 external 方案，虽然他也可能显著提速，但有以下问题，

*   以空间换时间，依赖包全量引用导致 npm，用在生产上会牺牲部分产品体验，需权衡
*   不是所有的依赖都有 umd 包，覆盖率不够
*   npm 可能有依赖，比如 antd 依赖 react 和 moment，那么 react 和 moment 也得 external 并且在html 里引用他们
*   需要手动修改 html 里的引用，维护上有成本提升

## 参考

*   [https://richlab.design/translations/2020/03/27/webpack-5-module-federation/](https://richlab.design/translations/2020/03/27/webpack-5-module-federation/)
*   [https://dev.to/marais/webpack-5-and-module-federation-4j1i](https://dev.to/marais/webpack-5-and-module-federation-4j1i)
*   [https://github.com/Paciolan/remote-component](https://github.com/Paciolan/remote-component)
*   [https://federated-libraries.now.sh/](https://federated-libraries.now.sh/)
*   [https://github.com/jacob-ebey/federated-libraries-get-started](https://github.com/jacob-ebey/federated-libraries-get-started)
*   [https://twitter.com/ScriptedAlchemy](https://twitter.com/ScriptedAlchemy)
*   [https://twitter.com/codervandal](https://twitter.com/codervandal)
*   [https://mp.weixin.qq.com/s?\_\_biz=MjM5MTA1MjAxMQ==&amp;mid=2651236238&amp;idx=1&amp;sn=fe46cf50030b8a7ae917b9c8c7de601c&amp;chksm=bd497e0a8a3ef71c8c3ea67ef24603994659fa1f55a1ebb488bba135b0138125620b4100f831#rd](https://mp.weixin.qq.com/s?__biz=MjM5MTA1MjAxMQ==&amp;mid=2651236238&amp;idx=1&amp;sn=fe46cf50030b8a7ae917b9c8c7de601c&amp;chksm=bd497e0a8a3ef71c8c3ea67ef24603994659fa1f55a1ebb488bba135b0138125620b4100f831#rd)
*   [https://github.com/ScriptedAlchemy/webpack-external-import](https://github.com/ScriptedAlchemy/webpack-external-import)
*   [https://github.com/webpack/webpack/projects/6](https://github.com/webpack/webpack/projects/6)
*   [https://github.com/webpack/webpack/issues/10352](https://github.com/webpack/webpack/issues/10352)
*   [https://github.com/module-federation/module-federation-examples](https://github.com/module-federation/module-federation-examples)
