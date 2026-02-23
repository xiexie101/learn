---
title: "使用 umi library 的 5 个技巧"
date: 2019-04-13
url: https://sorrycc.com/library-tips
---

发布于 2019年4月13日

# 使用 umi library 的 5 个技巧

![](https://img.alicdn.com/imgextra/i4/O1CN015AhQQ51aSjPkqzeD8_!!6000000003329-0-tps-1920-1280.jpg_1200x1200.jpg)

题图：sam\_truong @ unsplash.com

\> 勉强凑个 5 个。

## Tip 1. 如何选择打包格式？

我们支持三种打包格式，

1.  cjs
2.  esm
3.  umd

具体含义可以查文档。然后 esm 里还有个 mjs 的变种，感兴趣的可以具体查文档。

那么怎么选呢？

### 浏览器包

如果是给浏览器用，那么选 `cjs` 和 `esm`。

项目打包时（通常用 webpack）用 `esm`，`cjs` 有两种用途，1 是给 SSR（服务端渲染）用，2 是当你的库作为依赖进行测试时，测试库（比如 jest）通常不会处理 esm 格式，只能用 cjs 格式。如果不考虑 `cjs` 的两种用途，也可以只选 `esm`。

`umd` 通常不用打，除非你知道为啥要打。

### node 包

如果是给 node 用，那么只选 `cjs` 就够了。

然后记得 `target` 配 `node`，兼容到 node 6。不配的话，语法层会兼容到 IE10，会引入不必要的语法转化代码。

## Tip 2. 如何选择打包方式？

我们支持两种打包方式，

1.  rollup
2.  babel

所有格式都支持 rollup 打包方式，然后 `cjs` 和 `mjs` 还支持 babel 打包方式。

配置示例，

```
cjs: 'rollup',
esm: 'babel',
```

怎么选？

\*\*无特殊需要，推荐用 `rollup`。\*\*这是组件打包的主流方案，编译后是一个文件，应用到项目后打包会更快；由于 `rollup` 的 tree-shaking 比 webpack 更激进，理论上应用到项目之后产物会更小。

如果只要 `cjs` 和 `esm` 格式，那么 `babel` 打包方式是万能方案，只做语法转化。

我想到一些必须用 babel 的场景，欢迎补充，

1.  `node` 包，需要读一些奇怪的文件，比如 template 文件等
2.  类 `antd` 的场景，输出后还要按需载入样式啥的

## Tip 3. 遇到 `Error: 'default' is not exported by` 错误怎么办？

### 问题

这是新手用户经常遇到的问题，如果你的打包格式不是 umd，那么解决起来很简单，只要调整  `package.json` 里的依赖配置即可。（umd 格式处理起来复杂些，这里不展开）

比如，你的代码里依赖了 `foo`：

```javascript
import foo from 'foo';
```

然后报错了，

```
Error: 'default' is not exported by foo
```

底层原因是因为依赖 `foo` 没有 export default，但是我们打 `esm` 或 `cjs` 时是不需要把依赖也打进去的，怎么会要分析到依赖 `foo` 里的代码呢？

### 解决

这种情况下可以检查下 `package.json`，你会发现 `foo` 并不存在于 `dependencies` 或 `peerDependencies` 里，而是在 `devDependencies` 里或没有写依赖。

```json
{
  "devDependencies": {
    "foo": "1"
  }
}
```

解决办法就是把他写到 `dependencies` 或 `peerDependencies` 里，比如：

```
{
  "dependencies": {
    "foo": "1"
  }
}
```

因为我们有个关于 externals 的约定，**打包 `esm` 或 `cjs` 时，dependencies 和 peerDependencies 里的依赖会被处理为 externals，不打包到产物里**。

## Tip 4. 你的组件依赖了 antd?

### 问题

如果你的组件里依赖了 `antd`，

```javascript
import { Button } from 'antd';
```

那么，打包后还是，

```javascript
import { Button } from 'antd';
```

或者 cjs 格式的，

```javascript
const { Button } = require('antd');
```

然后你的组件在发布之后，被用户使用时是存在于 `node_modules` 下的，而 `node_modules` 下目前不走 babel 编译。所以，虽然用户项目里配了 `babel-plugin-import` 按需打 `antd`，但影响不到到你的组件代码，然后用户项目就不知不觉地全量引了 antd 了。

### 方案

1.  安装依赖 `babel-plugin-import`
2.  通过 `extraBabelPlugins` 配置 antd 的按需加载，`libraryDirectory` 为 `es`，如下：

```javascript
extraBabelPlugins: [
  ['babel-plugin-import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: true,
  }]
],
```

然后对于 antd 的引用就会变成，

```
import Button from 'antd/es/button';
import('antd/es/button/style');
```

从而不会全量引入 antd。

### doc dev 时的 antd 样式问题

如果 doc dev 时 antd 没有样式，有两种解决方案，

1.  如上配置（推荐）
2.  通过 `doc.htmlContext.head.links` 引入 antd 样式（不推荐）

```javascript
doc: {
  htmlContext: {
    head: {
      links: [
        {
          rel: 'stylesheet',
          href: 'https://cdn.bootcss.com/antd/3.12.3/antd.css',
        },
      ],
    },
  },
}
```

## Tip 5. 组件怎么打补丁？

\*\*组件不用打补丁！\*\*补丁只在项目里决定是否启用，以及启用哪些。为啥？因为如何每个组件都自己打补丁，那么就会有无数个重复的补丁。

如果要做地严谨一些，可以和 react 一样，告诉用户使用你的组件之前需要引入哪些补丁。
