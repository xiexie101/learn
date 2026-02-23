---
title: "484 - 《框架统一方案、Fishkit 和 Funplugin》"
date: 2024-11-11
url: https://sorrycc.com/unified-framework
---

发布于 2024年11月11日

# 484 - 《框架统一方案、Fishkit 和 Funplugin》

和大家说下最近在做的一件事。

1、由于历史原因和组织结构的调整，我们内部有三条鱼，Bigfish、Smallfish 和 Minifish，分别是不同场景下的前端框架。之前兵强马壮，大家分处不同的团队，每个框架一些人没啥问题。现在框架的人员投入逐渐减少，同时组织结构调整后大家合到了一起，再开发各自开发，从开发成本、方案一致性、人员互通、生态融合等方面看，就都有些不合适了。

2、所以，我们在考虑三鱼合一的事。两个思路。

1）提一个底层库，包含一些底层模块，为三条鱼提供统一方案  
2）新出一条鱼，支持现有三条鱼支持的业务

前者成本相对较低，但更多是修修补补，做完后用户的体感可能不明显；后者可以抛开历史包袱来做一次重新设计（当然，要尽量保持兼容），一条全新的鱼，包含全新的最佳实践，一致的生态。

我肯定是倾向后者的，淘系的 ice 也是一套方案供三端，但存在研发成本高的问题，经权衡后还是考虑前者。

3、我们给底层库取了个名叫 Fishkit。思路是提供一套写框架的框架或 SDK，可参考的竞品是 vinxi 和 nuxt 仓库的 un 系列。vinxi 基于 vite，提供了路由、ssr、rsc、runtime server 等能力，现在很多新框架都基于此，比如 solid start、tanstack start、angular start 等。然后 Roadmap 是先有 fishkit，然后大家基于 kit 研发，作为下一代框架的基础。再提升 kit 在框架的覆盖率之后，最后统一三鱼和开发下一代框架就顺理成章。

4、Fishkit 我脑暴了下，每一层都有不少可以做的事，比如 Core、基础能力、生态、工程化、最佳实践、构建、周边方案等。那从哪里入手会比较合适？想了下，应该是生态。每个框架现在都有自己的插件，并且自身的不少能力也都是基于插件开发。所以先统一插件，不仅自身研发统一了，生态研发也统一了，应该是个不错的思路，然后就有了 Funplugin。

5、大家可能听说过 unplugin [https://unplugin.unjs.io/](https://unplugin.unjs.io/) ，这是为了兼容多个构建工具插件之间的差异而做的方案，可以让一个插件写法适配不同的构建工具，支持 Vite、Webpack、Esbuild 等，Mako 也在做这块的适配。那么，框架之间是否也需要做这件事？看需求。

6、那么 Funplugin 又是啥？Funplugin，`[fʌn'plʌgɪn]`，Framework Unified Plugin。类似 unplugin，Funplugin 意为框架统一的插件，为不同框架提供统一的插件兼容层，减少不必要的维护成本和框架迁移成本。

提供一个库和一个 createFunplugin 的 API，用于创建插件。除了通用的 hooks 之外，还提供了特殊场景下的出逃口子，可补充每个框架特有的 hooks。

```ts
import { createFunplugin } from '@umijs/funplugin';
const unplugin = createFunplugin((options) => {
  return {
    name,
    enforce: 'pre',
    // General Hooks
    ...hooks,
    // Framework Specified Hooks
    umi: {},
    smallfish: {},
  };
});
```

他会返回 `{ umi, smallfish, minifish, … }`，可传给这些框架作为插件使用。比如 Umi 框架的。

```ts
export default {
  plugins: [
    createFunplugin().umi,
  ],
};
```

Funplugin 目前 RFC 已写，待讨论后实现。
