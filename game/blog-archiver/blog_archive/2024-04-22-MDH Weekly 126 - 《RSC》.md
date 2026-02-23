---
title: "MDH Weekly 126 - 《RSC》"
date: 2024-04-22
url: https://sorrycc.com/mdh-126
---

发布于 2024年4月22日

# MDH Weekly 126 - 《RSC》

![](https://img.alicdn.com/imgextra/i3/O1CN01I0tJdT1lmOE6NuDDC_!!6000000004861-0-tps-1920-1280.jpg_1200x1200.jpg)

题图：oskaryil @ unsplash.com

Hi，朋友们。

欢迎来到新一期的 MDH Weekly。这是其他同学转发给你的吗？[你可以在这里订阅！](https://sorrycc.com/mdh)。

## 本周好文

[译：Zustand 和 React Context](https://sorrycc.com/zustand-and-react-context)  
[译：CSS in React Server Components](https://sorrycc.com/css-in-rsc)  
[译：从简单到复杂 —— 软件四象限](https://sorrycc.com/from-trivial-to-complex-4-software-quadrants)  
[译：面向 JavaScript 开发人员的 TSConfig 简介](https://sorrycc.com/intro-to-tsconfig)  
[译：用 Promise.try 改进错误处理以及同异步的互操作性](https://sorrycc.com/promise-try-to-improve-error-handling-and-sync-async-interoperability)  
[用 Rust 写一个类 Unix 的 OS](https://vmm.dev/en/rust/osinrust.md)  
[健壮 Shell 脚本编写指南](https://liujiacai.net/blog/2024/04/05/robust-shell-scripting/)  
[探索 Next.js 里的 Server Actions](https://www.robinwieruch.de/next-server-actions/)  
[React Paris 24 视频回放](https://www.youtube.com/playlist?list=PL53Z0yyYnpWhUzgvr2Nys3kZBBLcY0TA7)  
[CSS 容器查询的交互式指南](https://ishadeed.com/article/css-container-query-guide)

## 本周我感兴趣的事

1、RSC。

这周基本都在围着 RSC 转，调研、写 Toy Version、周会分享 RSC、在 Mako 里实现，以及跑通最简版本。RSC 看着复杂，其实运行时的原理很简单，就是围绕着 RSC 协议字符串的生成和消费。生成用 `react-server-dom-webpack/server`，消费用 `react-server-dom-webpack/client`。剩下就是工程化的事了，要让这一套跑起来 DX 友好，还是要做不少事的，比如做 3-4 次构建… 详见 [430 - 《RSC》](https://sorrycc.com/rsc)。

![](https://img.alicdn.com/imgextra/i3/O1CN01fveAjy1kXu0hEvCQ2_!!6000000004694-2-tps-1432-850.png)

2、屏幕录制。

这段时间尝试的另一件事是用 OBS 做日常工作（个人电脑）的屏幕录制，见下图。之后可能会剪一部分出来录成视频。

![](https://img.alicdn.com/imgextra/i2/O1CN019zfwbn29jEGuJNbVY_!!6000000008103-2-tps-1566-640.png)

## 本周好玩的事

[Next.js 发布 14.2](https://nextjs.org/blog/next-14-2)  
[ESLint 发布 9](https://eslint.org/blog/2024/04/eslint-v9.0.0-released/)  
[ZX 发布 8](https://github.com/google/zx/releases/tag/8.0.0)  
[Pnpm 发布 9](https://github.com/pnpm/pnpm/releases/tag/v9.0.0)  
[Astro 发布 4.6](https://astro.build/blog/astro-460/)  
[Biome 发布 1.7](https://biomejs.dev/blog/biome-v1-7/)  
[Kuto，反向 JS 打包工具](https://samthor.au/2024/kuto/)  
[Blowfish，一款好看的 Hugo 主题](https://blowfish.page/)  
[XState Store 发布](https://stately.ai/blog/2024-04-10-xstate-store)  
[paul-gauthier/aider: Terminal 里的 AI 结对编程助手](https://github.com/paul-gauthier/aider)  
[wandb/openui: 又一个开源版 v0.dev](https://github.com/wandb/openui)  
[deco-cx/deco: 基于 Preact, Tailwind 和 TypeScript 的 Web 编辑器](https://github.com/deco-cx/deco)

* * *

如果你喜欢 MDH 前端周刊，请转发给你的朋友，告诉他们[到这里来订阅](https://sorrycc.com/mdh) ，这是对我最大的帮助。希望你有美好的一周！我们下期见。
