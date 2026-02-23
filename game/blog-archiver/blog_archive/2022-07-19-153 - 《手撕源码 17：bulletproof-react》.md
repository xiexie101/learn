---
title: "153 - 《手撕源码 17：bulletproof-react》"
date: 2022-07-19
url: https://sorrycc.com/source-17-bulletproof-react
---

发布于 2022年7月19日

# 153 - 《手撕源码 17：bulletproof-react》

上周看到的这个脚手架，Star 12.6K，作者是 [Alan Alickovic](https://twitter.com/alan_alickovic)。Star 过万的仓库肯定有其过人之处，今天翻翻源码学习下。

先看工具部分。构建基于 @craco/craco，类 rewired 的配置式的 CRA 使用方式，提供 start、build 和 test 命令；质量工具基于 prettier（新学到一个参数 --list-different）、eslint 和 tsc（新学到一个参数 --pretty）；git 辅助基于 husky 和 lint-staged，precommit hook 跑 tsc + eslint；测试基于 jest + testing-library + cypress + start-server-and-test；mock 基于 msw + @mswjs/data + 已经 404 的 faker；组件调试基于 storybook；代码生成基于 plop；此外 tsconfig-paths-webpack-plugin 也是第一次看到；样式方案基于 postcss + tailwindcss，但是用的 @tailwindcss/postcss7compat 这个版本（原因未知）。

再看运行时部分。react 还是 17（PR 的机会啊），使用 Suspense；路由基于 react-router-dom 6 + history；数据流基于 zustand，store create 之后通过 hooks 的方式直接用就好（我之前没用过，是不需要 Provider 的吗？），支持 TS，感觉挺简单，没有 Provider 做组件提取就没有负担了；请求基于 react-query + react-query-auth + axios，axios 加了统一的 auth request interceptor 和 error handler response interceptor，react-query 有个运行时的 devtool 看着不错；head 标签处理基于 react-helmet-async；表单基于 react-hook-form + zod，后者用于校验；markdown 渲染基于 marked 和 dompurify，后者用于防 XSS 攻击；还有用到 type-fest 这个 TypeScript utils 库。

目录结构部分。components、hooks、providers、routes、stores、types 和 utils 没啥，和大部分项目类似；有特点的是 features 目录，和通常按路由做文件组织的方式不同，他是按功能做文件组织，每个 features 下包含自己的 api、components、routes 和 types 等；

参考：  
[https://github.com/alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react)
