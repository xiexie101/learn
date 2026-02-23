---
title: "66 - 《Umi 的 Api Routes》"
date: 2022-03-04
url: https://sorrycc.com/umi-api-routes
---

发布于 2022年3月4日

# 66 - 《Umi 的 Api Routes》

这周终于把 [Api Routes 的 PR](https://github.com/umijs/umi-next/pull/400) 合了，和大家介绍下。

Api Routes 参考的是 Next.js 的功能，开发者在 src/api 目录下放置 Serverless Function 格式的文件，即为 API 路由，这部分路由会打包成不同平台支持的 Serverless Function 产物。场景比如带 token 的 API 调用、动态数据源、基于 Notion API 的 Blog、Hackernews Clone 等等。

基于此，Umi 能做的事的边界就大了很多。不再只是写写中后台，实现静态页面。我准备先用此功能把[个人网站](https://sorrycc.com/)改个版。其实之前内网基于 Umi 的框架 Bigfish 也有类似功能，但是和内网服务强绑的，现在对外，并支持各种社区的平台。

具体怎么用？

1、新增 src/api 目录  
2、新建 hello.ts，写入内容 `export default (req, res) => res.send('Hello ${req.query.name}')`;  
3、然后访问 `/hello?name=world`，即可得到 Hello world 返回

什么时候能用？

下周四，会随着 Umi 4 RC 6 发布。
