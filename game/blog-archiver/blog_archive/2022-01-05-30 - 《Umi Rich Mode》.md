---
title: "30 - 《Umi Rich Mode》"
date: 2022-01-05
url: https://sorrycc.com/umi-rich-mode
---

发布于 2022年1月5日

# 30 - 《Umi Rich Mode》

umi 尤其是我们的内网 bigfish 框架有不少历史债，包含我们既有的技术栈，大量老项目，以及我们自己加的强约束。这些连在一起，让我们的业务同学在直接使用社区最新方案时会遇到一些困难。

下午有聊到一个点，让我联想到「umi rich mode」，一个让部分同学先「富」起来的模式。

所以，rich mode 是啥，就是抛开现有技术债，大胆设想，在没有任何包袱的前提下，你的梦幻组合是啥。下面列一些我拍脑袋想的，

*   提速：MFSU with Remote Caching / Vite + ESMi
*   CSS：vanilla-extract + tailwind.css
*   路由：react router 6
*   UI 库：ant design + ant-design-pro
*   图表库：antv
*   hooks 库：react-use
*   状态管理：valtio
*   util 库：lodash
*   时间处理：dayjs
*   动画：framer-motion
*   拖拽：react-beautiful-dnd
*   Markdown 编辑器：react-markdown
*   请求：类 remix 的 loader 策略 + axios + react-query
*   微前端：qiankun
*   PDF 处理：pdfjs
*   GraphQL：Prisma
*   Headless CMS：Strapi
*   icons 使用：UnoCSS
*   测试：Jest with esbuild + ts-jest + ts-node + @types/jest + Playwright + react-testing-library + jsdom
*   npm client：pnpm
*   Landing Page：0JS
*   语言：TypeScript
*   还有国际化、权限、代码编辑器、markdown 编辑器、Math、Schema…

还有一些 Umi 使用之外的，想到这了，也列一下，

*   脚本编写：zx + esno
*   Monorepo：Turborepo
*   代码美化：prettier + prettier-plugin-organize-imports + prettier-plugin-packagejson
*   Git Hooks：husky + lint-staged
*   组件打包：father 4（研发中）
*   文档工具：Nextra 2 / dumi

欢迎补充你的想法和缺失的领域。
