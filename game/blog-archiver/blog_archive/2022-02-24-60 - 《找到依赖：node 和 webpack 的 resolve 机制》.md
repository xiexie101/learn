---
title: "60 - 《找到依赖：node 和 webpack 的 resolve 机制》"
date: 2022-02-24
url: https://sorrycc.com/engineering-resolve
---

发布于 2022年2月24日

# 60 - 《找到依赖：node 和 webpack 的 resolve 机制》

> 工程化小册试写章节。昨晚看 XYG 和 EStar 比赛占据太多时间，没来不及更完。。

现在基本都是模块化开发，理解「如何找到依赖」是一个很基础的知识点。但以我的接触来看，很多同学并不清楚 resolve 机制，包括很多资深的同学，然后会乱用，虽然当下能跑，但却是在给未来的自己、同事和产品留坑。

举个例子。比如一个项目，package.json 中声明 `dependencies: { "foo": "1" }`，然后 foo 依赖 bar，这时开发者想用 bar 应该怎么办？

A、`require('foo/node_modules/bar')`  
B、`require('bar')`，因为用 npm 安装 foo 后，bar 被提取到 node\_modules 根目录了  
C、package.json 添加依赖 bar，然后 `require('bar')`

答案是 C。为啥 A 和 B 不行？背后原因是相同的，因为 bar 不一定出现在现在的位置。

上面的例子，通过 npm install 之后，node\_modules 的结构可能是，

```bash
+ node_modules
  + foo
    + node_modules
      + bar
```

也可能是，

```bash
+ node_modules
  + foo
  + bar
```

这会受其他依赖影响，比如除了 foo 依赖 bar，项目还依赖了 B，B 也依赖了相同版本的 bar，就会是上述后者的目录结构，bar 被提取到顶层，这样设计的目的是为了避免重复。但如果又依赖了 C，C 依赖了不同版本的 bar，结构又会有变化，具体这部分我们会在 npm client 章节展开，比如典型的 Phantom dependencies 和 NPM doppelgangers 问题等。

大家可以记住一个规则，「不管是项目还是 npm 依赖，只 require 或 require.resolve 或 import 当前 package.json 的 dependencies 中声明过的依赖」。

p.s. 推荐大家用 pnpm，引用错误时会显式抛错，因为 pnpm 安装依赖后，node\_modules 下只会有 package.json 中声明过的依赖。

看完例子，下面我们分 Node 的 resolve 规则和 webpack 的 resolve 规则展开说下，前者是基础，后者是基于前者做的扩展。

## Node 的 resolve 规则

Node 的 resolve 规则见 NodeJS 的官方文档，[https://nodejs.org/api/modules.html#modules\_all\_together，很好理解。强烈建议所有人都仔细看一遍，可以解日常的很多疑惑。](https://nodejs.org/api/modules.html#modules_all_together%EF%BC%8C%E5%BE%88%E5%A5%BD%E7%90%86%E8%A7%A3%E3%80%82%E5%BC%BA%E7%83%88%E5%BB%BA%E8%AE%AE%E6%89%80%E6%9C%89%E4%BA%BA%E9%83%BD%E4%BB%94%E7%BB%86%E7%9C%8B%E4%B8%80%E9%81%8D%EF%BC%8C%E5%8F%AF%E4%BB%A5%E8%A7%A3%E6%97%A5%E5%B8%B8%E7%9A%84%E5%BE%88%E5%A4%9A%E7%96%91%E6%83%91%E3%80%82)

比如一个目录下同时存在 foo.js 和 foo/index.js 文件夹，然后 require(‘./foo’) 会优先加载哪个？比如支持哪些后缀？比如 package.json 中声明的 exports 和 main 哪个优先级高？等等。这里我就不给答案了，仔细看上面的文档，都能找到答案。

如果大家用 pure esm（package.json 中声明 “type”: “module”）的依赖包，规则又有些不同，详见 NodeJS 的官方文档，[https://nodejs.org/api/esm.html#resolution-algorithm。](https://nodejs.org/api/esm.html#resolution-algorithm%E3%80%82)

但是大同小异，一些区别整理如下：

1、不会自动加上 .js、.json、.node、.mjs 等后缀，需要显式声明  
2、TODO

## Webapck 的 resolve 规则

webpack 的 resolve 规则是在 node resolve 规则基础上做的扩展，详见[官方 resolve 文档](https://webpack.js.org/configuration/resolve/)，截止 2022.2.24，这里提供了 23 个配置，这些配置都可以决定如何找到依赖。

举一些例子。通过 resolve.mainFields 支持更多 package.json 中找依赖入口文件的 key，比如 module、browser 等；通过 resolve.extensions 支持更多后缀，比如 .ts、.wasm、.vue 等；通过 resolve.modules 支持更更多地方找依赖；比如 resolve.alias 可以声明别名；比如 externals 配置可以跳过模块解析；等等。

TODO：展开介绍 webpack 主要的 resolve 规则。

分享一个我踩过的 resolve 规则的坑，就是 resolve.modules 的第一项必须是 node\_modules，除非你很清楚为啥不是。node\_modules 意味着找依赖时会从当前目录的 node\_modules 开始，然后一级级往上找。假如配成另一个目录，就都会先从这个目录开始找，匹配不上还好，匹配上了反而可能出问题，因为版本可能对不上。

再有个场景是，团队大了或项目多了后，为了提效，我们通常会封装一些库来统一处理 webpack。webpack 里通常会配 loader、插件等，比如 babel-loader，项目里配时写 babel-loader 即可，但加了一层封装后就不能直接写 babel-loader，而是得写 require.resolve(‘babel-loader’)。

*   loader: ‘babel-loader’
*   loader: require.resolve(‘babel-loader’)

原因是后者会返回绝对路径，能让 webpack 能知道 loader 的准确路径。那为什么只传 babel-loader 不能拿到准确路径？这还是和前面 node 部分描述的问题一样，和 package manager 的有关，webpack 和 babel-loader 不一定被装在哪里，所以 webpack 里可能找不到 babel-loader 或是找到错误的 babel-loader 版本。找不到还好，找到错误的问题更大。
