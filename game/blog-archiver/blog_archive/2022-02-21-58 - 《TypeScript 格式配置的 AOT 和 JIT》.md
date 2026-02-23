---
title: "58 - 《TypeScript 格式配置的 AOT 和 JIT》"
date: 2022-02-21
url: https://sorrycc.com/config-aot-jit
---

发布于 2022年2月21日

# 58 - 《TypeScript 格式配置的 AOT 和 JIT》

周刊里写了一点，这里展开下。

先说下场景。以 webpack 为例，用户配置时 webpack.config.js，但现在 TypeScript 使用率都达 69% 了，自然要支持用户 TypeScript 写配置，比如 webpack.config.ts。

如何支持呢？有 AOT 和 JIT 两种思路，各有优劣。见图1。AOT 即 Ahead of Time，是在跑主流程前先把 webpack.config.ts 打包成 webpack.config.js，通常用 webpack、esbuild 或 parcel，产物存放在某个临时目录，然后让 webpack 去读取临时的 webpack.config.js；JIT 即 Just in Time，是把 ts 的编译内置到主流程里，到了读配置环节，如果遇到是 .ts 后缀的，就调编译时实时编译后返回，通常基于 require.extensions 和 esbuild。

Umi 用的是 JIT，Gastby 用的是 AOT。然后，我准备把 Umi 的也换成 AOT。

为啥换 AOT？我在 [https://t.zsxq.com/z7eIYBq](https://t.zsxq.com/z7eIYBq) 里有说过 Pure ESM 的问题，当时尝试迁移 Umi 为 Pure ESM 但失败了，其中一个跨不过的槛就是 Pure ESM 不支持通过类 require.extensions 的方式实时编译 TypeScript 格式的配置、插件、mock 文件等。当时没有想到 AOT 的思路，AOT 可完美绕过此问题。同时 Pure ESM 是未来，我不希望框架上存在卡点。

还有其他 AOT 和 JIT 对比的差异，比如性能、内存消耗其实都可忽略不计，因为要处理的文件量很小。

![](https://img.alicdn.com/imgextra/i4/O1CN01ydttfA1KwvggBOEN8_!!6000000001229-2-tps-928-1102.png)

参考：  
[https://github.com/gatsbyjs/gatsby/discussions/34613](https://github.com/gatsbyjs/gatsby/discussions/34613)  
[https://github.com/umijs/umi-next/pull/348](https://github.com/umijs/umi-next/pull/348)

#日更
