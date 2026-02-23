---
title: "彻底告别编译 OOM，用 esbuild 作为压缩器"
date: 2020-05-08
url: https://sorrycc.com/oom-esbuild
---

发布于 2020年5月8日

# 彻底告别编译 OOM，用 esbuild 作为压缩器

不知大家是否有遇到这个问题，

```bash
<--- Last few GCs --->

[59757:0x103000000]    32063 ms: Mark-sweep 1393.5 (1477.7) -> 1393.5 (1477.7) MB, 109.0 / 0.0 ms  allocation failure GC in old space requested

<--- JS stacktrace --->

==== JS stack trace =========================================

Security context: 0x24d9482a5ec1 <JSObject>
    ...

FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
 1: node::Abort() [/Users/xxx/.nvm/versions/node/v10.13.1/bin/node]
 2: ...
```

或者在 92% 的进度里卡很久，

```bash
● Webpack █████████████████████████ chunk asset optimization (92%) TerserPlugin
```

随着产物越来越大，编译上线和 CI 的时间都越来越长，而其中 1/3 及更多的时间则是在做压缩的部分。OOM 的问题也通常来源于压缩，我们推出的 UglifyCache 和 autoExternal 方案其实大部分也是在解决产物大了之后压缩慢从而可能导致 OOM的问题。

如何解决压缩慢和占内存的问题，一直很令人头疼。

## esbuild

> An extremely fast JavaScript bundler and minifier.

特点就是快，

![](https://cdn.nlark.com/yuque/0/2020/tif/86025/1588847300181-4264456a-1dc8-40e2-8cfd-ac27f6af20c9.tif?x-oss-process=image/format,png)

为啥快？作者给了几个原因，但其中最主要的应该是用 go 写，然后编译为 Native 代码。然后 npm 安装时动态去下对应平台的二进制包，支持 mac、linux 和 windows，比如 [esbuild-darwin-64](https://unpkg.com/browse/esbuild-darwin-64/)。

相同思路的还有 [es-module-lexer](https://github.com/guybedford/es-module-lexer)、[swc](https://github.com/swc-project/swc) 等，都是用编译成 Native 代码的方式进行提速。

esbuild 有两个功能，bundler 和 minifier。bundler 的功能和 babel 以及 webpack 相比肯定差很多，直接上风险太大；而 minifier 倒是可以试试，在 webpack 和 babel 产物的基础上做一次压缩，坑应该相对较少。

我先直接用 esbuild 压一个 5M 多的文件到 1.5M，效果明显。

```bash
$ esbuild --minify --outfile=esbuild-minify-test.js dist-uncompressed/umi.b9ab1e60.js
Wrote to esbuild-minify-test.js (1.5mb)
Done in 294ms
```

## [esbuild-webpack-plugin](https://github.com/sorrycc/esbuild-webpack-plugin)

为进一步验证效果，写了 webpack 插件和 Umi 插件。以依赖了全量 antd 和 bizcharts 的项目为例，在禁用 Babel 缓存和 Terser 缓存的基础上进行了测试。

大家感兴趣的可以自行 clone 仓库，在 `yarn install` 后分别执行，

```bash
// 用默认的 terser 压缩
$ yarn build:example

// 用 esbuild 压缩
$ yarn build:example:esbuild

// 不压缩
$ yarn build:example:nocompress
```

跑的结果，

![](https://cdn.nlark.com/yuque/0/2020/png/86025/1588847300475-07a8dcaa-c712-4e5b-b244-367b3e0d61ca.png)

结论如下：

1.  编译时间减少近 1/3，产物越大越明显
2.  Gzip 前的尺寸变化不明显，Gzip 后的尺寸略有增加
3.  内存消耗降低很多，基本可忽略（拿 `process.memoryUsage().heapUsed` 的值，因为有子进程，可能不准）

## 未来

不管是 Bundled 还是 Unbundled，其中肯定会有一些重计算的部分，这些应该是会转向 Native 代码实现，比如压缩、Babel 编译、TS 编译、模块分析等。

至于应用场景，一开始步子应该迈不大，可以先局部尝试起来，比如压缩、组件库开发时的 TS 编译等。Umi 会在 3.2 内置这种压缩方式，通过 `minifier: { type: 'esbuild' }` 提供，打 beta 使用警告⚠️。

## 在 Umi/Bigfish 中使用

通过插件 [@umijs/plugin-esbuild](https://umijs.org/zh-CN/plugins/plugin-esbuild) 一键开启。

先安装依赖，

```bash
$ yarn add @umijs/plugin-esbuild
```

然后配置开启，

```js
export default {
  esbuild: {},
};
```

## 参考

*   [https://github.com/evanw/esbuild](https://github.com/evanw/esbuild)
*   [https://github.com/sorrycc/esbuild-webpack-plugin](https://github.com/sorrycc/esbuild-webpack-plugin)
