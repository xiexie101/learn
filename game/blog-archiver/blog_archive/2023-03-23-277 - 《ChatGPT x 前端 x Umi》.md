---
title: "277 - 《ChatGPT x 前端 x Umi》"
date: 2023-03-23
url: https://sorrycc.com/chatgpt-f2e-umi
---

发布于 2023年3月23日

# 277 - 《ChatGPT x 前端 x Umi》

脑暴了下，对于前端而言，ChatGPT 可以辅助做这些事。

*   代码的一生
    *   读代码
    *   生成代码
    *   修改代码（Cursor）
    *   Review 代码（找 bug 和提建议）
*   各种转换
    *   JSON <-> TypeScript / YAML / CSV / PHP / Code / …
    *   HTML <-> JSX
    *   Base 64 Encode/Decode
    *   Regexp Tester
    *   URL Encode/Decode
    *   Minified CSS / JavaScript > Unminified
    *   curl <-> axios / fetch / …
    *   webpack config <-> vite config
    *   Color Value
    *   SVG > CSS / React Component
    *   i18n 翻译
    *   设计稿转代码（GPT-4）
    *   tailwindcss > CSS / StyledComponets / CSS Modules
    *   SWR > React Query
    *   PHP > JavaScript
    *   时区转换
*   生成器
    *   Mock 数据
    *   测试代码
    *   注释
    *   API 文档
    *   SQL
    *   动画
    *   算法
    *   指令生成（比如低代码和无代码场景）
    *   表单
    *   数据流
    *   国际化
*   各种解读
    *   Crontab 解读
    *   报错信息解读
*   流程类
    *   commit 信息生成
    *   code review（PR）（Copilot X）
*   自然语言命令行，比如
    *   umi? start dev server with port 8888
    *   umi? build without compress
    *   框架工具指令化，然后让 ai 通过指令做事

大家可以研究下如何组织 Prompt，让 ChatGPT 更好地为自己服务，合理利用 AI 工具。因为据 Copliot 的统计，用 Copliot 的程序员比不用的写代码快 55%。

那么，对于 Umi 框架来说，如何深度整合以提升 UX？计划增加一个 openai 的配置，用户填入 token 之后即可开启以下功能。

**1、自然语言命令行。** 想法源自 Github Coplot Cli，对于用户而言，无需熟悉 Umi 和阅读 Umi 文档即可上手。用法比如，

```bash
umi? start dev server with port 8888
umi? build without compress
umi? enable mfsu
umi? enable typescript
umi? external react and react-dom
umi? use terser as minifier
umi? add ie11 to targets
```

一个 MVP 示例。

![](https://img.alicdn.com/imgextra/i4/O1CN01T6XRpT1qyovlAAAug_!!6000000005565-0-tps-1276-1070.jpg)

**2、自然语言生成器。** 基于 Umi 内置的功能和最佳实践，加一些背景知识，就可以让 ChatGPT 生成符合要求的代码，解代码从 0 到 1 的问题。用法比如，

```bash
umi g? user state with curd
umi g? user mock data with curd
umi g? test file --file ./src/state/user.ts
```

一个 MVP 示例。

![](https://img.alicdn.com/imgextra/i2/O1CN01y1JGhv1hkJqZ6hdMd_!!6000000004315-0-tps-1776-1546.jpg)

**3、更有建设性的错误提示。** 目前的错误给了报错信息和原因，但通常不能给出很具体的修改建议。基于 ChatGPT 可以优化这部分，直接建议用户可以怎么修改，见下图。（甚至可以征询用户同意之后直接改代码）

![](https://img.alicdn.com/imgextra/i3/O1CN01WO0agR1n9ZldbKpy2_!!6000000005047-2-tps-3448-1086.png)

参考：  
[https://ai-gpt3-chatbot-luchen.vercel.app](https://ai-gpt3-chatbot-luchen.vercel.app/)  
[Building a JSON to Typescript converter with React, NodeJS and ChatGPT 🚀 - DEV Community](https://dev.to/novu/building-a-json-to-typescript-converter-with-react-nodejs-and-chatgpt-46p2)  
[GitHub - awekrx/AutoDoc-ChatGPT](https://github.com/awekrx/AutoDoc-ChatGPT)  
[https://twitter.com/Barret\_China/status/1638508262739034112](https://twitter.com/Barret_China/status/1638508262739034112)  
[GitHub - adshao/chatgpt-code-review-action: A GitHub Action that uses OpenAI ChatGPT to do code review](https://github.com/adshao/chatgpt-code-review-action)  
[GitHub - gd3kr/BlenderGPT: Use commands in English to control Blender with OpenAI’s GPT-4](https://github.com/gd3kr/BlenderGPT)  
\[\[copilot-x\]\]  
[ChatGPT for Programmers: Build Python Apps in Seconds | Udemy](https://www.udemy.com/course/chatgpt-for-programmers/)  
[GitHub - fauxpilot/fauxpilot: FauxPilot - an open-source GitHub Copilot server](https://github.com/fauxpilot/fauxpilot)  
[https://xiaobot.net/post/7b7b1e61-1a1b-4449-bbdf-6fd9d41cee02](https://xiaobot.net/post/7b7b1e61-1a1b-4449-bbdf-6fd9d41cee02)  
[https://learnprompting.org/](https://learnprompting.org/)
