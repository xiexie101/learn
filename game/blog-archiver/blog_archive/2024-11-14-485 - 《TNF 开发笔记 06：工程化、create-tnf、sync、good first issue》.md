---
title: "485 - 《TNF 开发笔记 06：工程化、create-tnf、sync、good first issue》"
date: 2024-11-14
url: https://sorrycc.com/tnf-06
---

发布于 2024年11月14日

# 485 - 《TNF 开发笔记 06：工程化、create-tnf、sync、good first issue》

> 这两天编码比较多，抽空补下记录，怕忘。

1、一些工程化补充。

1）files 记得忽略一些不需要的文件，比如：

```ts
["src", "!src/**/*.test.spec"]
```

2）exports 记得加 ./package.json，这样别人才能引到你的 package.json。比如：

```ts
"./package.json": "./package.json",
```

3）engines 记得声明所需的 node 版本，比如：

```ts
"engines": {  
    "node": ">=18.13"  
}
```

4）engines 里还要声明下 pnpm，这样当使用错误的大版本时，会显式报错。比如：

```
"engines": {  
  "pnpm": "^8.0.0"  
},
```

2、补了下 Issue 和 PR Template，Issue Template 分了 Bug 和 Feature Request，见 [https://github.com/umijs/tnf/commit/d76504eb4e36777fc17e7eafa5e20d791da5c88c](https://github.com/umijs/tnf/commit/d76504eb4e36777fc17e7eafa5e20d791da5c88c) 。好处是更规范，让大家更有序的参与，同时减少不必要的沟通。比如 PR Template，可以引导开发者完成我们期望的 checklist 。

3、增加了 tnf sync 命令。这个命令类似 umi 的 setup 命令，都是基于源码生成临时文件，这是现代元框架必不可少的一环。之前翻过 sveltekit 的源码，见 [102 - 《手撕源码 02：sveltekit》](https://sorrycc.com/source-02-sveltekit)。这几天重新看了下，发现他的 V2 版本把命令全删了，只留了一个 sync，也是做的这件事，然后剩下的全交给 Vite。所以 sveltekit 2 = sync + vue plugin。

4、create-tnf 独立成包。之前是集成在 tnf 里的，用户执行 npx @umijs/tnf create 来生成脚手架。想了下不对，@umijs/tnf 这个包会越来越大，用户生成脚手架的速度会很慢。同时也和社区约定的方式不符。所以，改成了 create-tnf 独立包的形式，见 PR [https://github.com/umijs/tnf/pull/27](https://github.com/umijs/tnf/pull/27) 。当然，也有社区库不这么做的，比如 svelte 就是[放在 cli 里](https://github.com/sveltejs/cli/blob/main/packages/cli/commands/create.ts)的，方式是执行 npx sv create my-app 。

5、hackernews example with code splitting。性能相关的方案，代码见 [https://github.com/umijs/tnf/pull/23](https://github.com/umijs/tnf/pull/23) 。[483 - 《TNF 开发笔记 05：0.1.0、changesets、preview、generate、preload》](https://sorrycc.com/tnf-05) 里聊过 preload，那会 hackernews example 的 preload 只包含了数据，这次增加了 code splitting。当对某个路由做 preload 时，会同时请求 loader 和 code splitting 对应的 js 和 css，这才是性能的最佳态。

6、good first issue 和 roadmap。tnf 这次开源刻意地补充了这两部分的 issue。前者方便更多新人参与，这几天的 pr 数据还不错，后者方便大家了解 tnf 的进展和目标。

7、global.{less,css}。这个功能是，约定如果项目 src 目录存在 global.less 或 global.css 时，会自动以非 css modules 的方式引入。方便大家加一些 reset、overrides 之类的样式。实现见 [https://github.com/umijs/tnf/pull/28](https://github.com/umijs/tnf/pull/28) 。

8、沉浸式编程。这几天的编码体验很好，一直写代码、重构、review pr、写 rfc、冒出新的想法，已经好久没这么多 commit/日 了。之前写 Rust，感觉一天 3 个 commit 就已经很厉害了。。

![](https://tcc.sorrycc.com/p/f3f8285f-56f6-49be-ae3c-661ea704edd6.jpg)
