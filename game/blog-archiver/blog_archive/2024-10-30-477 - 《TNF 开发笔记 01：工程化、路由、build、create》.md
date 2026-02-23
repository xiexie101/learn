---
title: "477 - 《TNF 开发笔记 01：工程化、路由、build、create》"
date: 2024-10-30
url: https://sorrycc.com/tnf-01
---

发布于 2024年10月30日

# 477 - 《TNF 开发笔记 01：工程化、路由、build、create》

> 从 0 试水一个新框架，应该是比较好的参与机会，感兴趣的可以试试，文章里有 issue 链接。

1、工程化基本是参考 [463 - 《2024 年如何发布 npm 包（1） - 极简版、新手向》](https://sorrycc.com/how-to-publish-npm-package-in-2024-1) 和 [464 - 《2024 年如何发布 npm 包（2）》](https://sorrycc.com/how-to-publish-npm-package-in-2024-2) 来的。pnpm、Vitest、单包、father、prettier、husky + lint-staged、zx + tsx 等，除了 changesets 和 typos-cli 暂时还没用上，见 [https://github.com/umijs/tnf/tree/0487443aeb99632748e1c54a5d633532d2320c68](https://github.com/umijs/tnf/tree/0487443aeb99632748e1c54a5d633532d2320c68) ，不赘述。

2、路由基于 TanStack Router，前一篇 [476 - 《笔记：Tanstack Router》](https://sorrycc.com/tanstack-router-notes) 有详细记录，这个路由方案也是催生我写 tnf 的一大原因。这里再补充下我为啥选这个路由的原因。

1）性能，preload、load、load 和 component 代码分离、内置 mini 版 react query 所以有路由级的 swr  
2）TypeScript Safe  
3）扩展能力极好，可编程式扩展，所以对框架开发者友好  
4）除了 router，与之相关的 ssr（流和非流）、loader 等方案的 runtime 层也不需要操心  
5）有配套的工程化方案，比如针对约定式路由的 generator、runtime devtool、tsr 命令行等  
6）功能相比 react-router 强大很多，场景考虑很全  
7）search 是第一公民，不用自己 new UrlSearchParams

3、路由接入暂时只实现了约定式路由，后续会看需求再决定是否加上 Umi 现有的配置式路由。个人倾向扁平风格的约定式路由，因为在单目录下即可一目了然整个项目的路由结构，都不用展开目录或者 tree 一下。

4、目前提供了两个命令，create 和 build。create 用于创建项目，build 用于构建项目。想试试效果的同学可以用以下命令把项目跑起来。

```bash
$ npx @umijs/tnf create myapp --template=simple
$ cd myapp
$ npm install
$ npm run build
$ npx serve dist
```

5、create 用了下 @clack/prompts，这是效果比较好的 prompt 库。

6、build 分两部分功能，prepare 和项目构建。prepare 是生成临时文件到 .tnf 文件夹，目前是两件事，1）基于约定式路由生成编程式路由，基于 @tanstack/router-generator 实现，2）生成入口文件。项目构建暂时只有 mako 的实现。

7、我整理了一些 TODO 在 [issue](https://github.com/umijs/tnf/issues/1) 里，感兴趣的同学可以认领下，从 0 开始搭一个框架时参与进去会相对更容易一些。

参考：  
[https://github.com/umijs/tnf](https://github.com/umijs/tnf)  
[https://github.com/umijs/tnf/issues/1](https://github.com/umijs/tnf/issues/1)
