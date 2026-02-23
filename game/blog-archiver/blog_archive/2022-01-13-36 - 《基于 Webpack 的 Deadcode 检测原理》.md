---
title: "36 - 《基于 Webpack 的 Deadcode 检测原理》"
date: 2022-01-13
url: https://sorrycc.com/webpack-deadcode-detect
---

发布于 2022年1月13日

# 36 - 《基于 Webpack 的 Deadcode 检测原理》

项目开发久了后，总会有一些不再需要的代码，今天看到一个 [webpack 插件](https://github.com/MQuy/webpack-deadcode-plugin/blob/master/src/detect.js)，记录下其实现。

包含两个功能，1 dead file，2 dead exports。

**dead file 检测。**

1、通过 compilation.fileDependencies + compilation.getAssets() 可以拿到 webpack 编译过程中用到的所有文件，注意过滤 node\_modules 文件  
2、通过 glob 拿到所有源码文件  
3、diff

**dead exports 检测。**

1、compilation.chunks + compilation.chunkGraph.getChunkModules(chunk) 拿到 module 列表  
2、用 compilation.chunkGraph.moduleGraph.getProvidedExports(module) 和 compilation.chunkGraph.moduleGraph.getUsedExports(module) 分别拿提供的 exports 和未使用的 exports  
3、diff
