---
title: "12 - 《ESM Bundless》"
date: 2021-12-21
url: https://sorrycc.com/esm-bundless
---

发布于 2021年12月21日

# 12 - 《ESM Bundless》

聊下 ESM Bundless 方案。

为啥大家对 ESM 趋之若鹜？1）ESM 将统一分裂已久的模块规范，解现代前端长久以来的一块心病 2）面向未来，在看得见的未来，主流浏览器会全量支持 ESM 3）ESM 不止 ESM，还有 import maps、module preload、dep cache 等配套规范让 ESM 适用于各种场景。

ESM Bundless 是未来，但通往未来的路有很多。比如 Vite & Snowpack、ESMi、Rails 7、PDN，大家的方式都不尽相同。源码部分的处理大家都差不多，类 Vite；但依赖的处理就有很大区别了。

Vite 的依赖是走本地编译；ESMi 的依赖走 CDN，通过 importmaps 服务做映射；Rails 7 的依赖通过 importmaps 隐射到 jspm cdn；字节的 PDN 没太仔细看，好像是从 CDN 上拉文件到本地然后启的服务。

这些方案里有一些不可忽略的重要角色。esbuild 做编译，es-module-lexer 做 import 和 export 分析，es-module-shims 是补丁方案，让支持 esm 的浏览器提前用上 module-shims、module preload 和 dep cache 等特性。

ESMi 我全程参与了，是蚂蚁这边面向生产做的方案，各种请求瀑布、产物尺寸等潜在问题全都考虑了。方案分 server 和 client 两部分，server 部分更重一些，遇到的问题也更多一些。详见 [https://mp.weixin.qq.com/s/LFMWpxPU2GceWX48r3keXQ](https://mp.weixin.qq.com/s/LFMWpxPU2GceWX48r3keXQ)
