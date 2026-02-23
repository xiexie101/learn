---
title: "从 atool-build + dora 到 roadhog"
date: 2016-12-20
url: https://sorrycc.com/roadhog
---

发布于 2016年12月20日

# 从 atool-build + dora 到 roadhog

这几天收到比较多关于 [roadhog](https://github.com/sorrycc/roadhog) 的[疑问](https://github.com/ant-tool/atool-build/issues/241)，为啥用 roadhog，啥时不用 roadhog，怎么从 atool-build + dora 切换到 roadhog 等等。解释如下：

## roadhog 和 atool-build + dora 有啥区别?

### 配置

roadhog 是约束型配置，基于 JSON 格式，给出有限的配置方式；atool-build + dora 是扩展型，表现为插件和编程 webpack.config.js 的方式。

### 功能

> 标了 `暂` 的后续可能会支持，看需求吧。

roadhog 的劣势：

*   暂不内置 mock 方案，通过 proxy 和其他服务(比如 [json-server](https://github.com/typicode/json-server) )配合使用，已内置更好用的 mock 方案，[https://github.com/sorrycc/roadhog/issues/59](https://github.com/sorrycc/roadhog/issues/59)
*   暂不能扩展没有内置的 webpack 配置，比如要用 sass 现在是不行的，已支持 [https://github.com/sorrycc/roadhog/issues/36](https://github.com/sorrycc/roadhog/issues/36)
*   server 无插件机制，不能扩展

roadhog 的优势：

*   内置 HMR
*   内置支持 browser history，基于 [webpack-dev-server](https://github.com/webpack/webpack-dev-server)

## 为啥用 roadhog?

既然 roadhog 功能没 atool-build + dora 强大，那为啥要切换呢?

*   体验好，基于 [create-react-app](https://github.com/facebookincubator/create-react-app)，比如有非常友好的 [错误处理](https://github.com/sorrycc/roadhog#%E7%89%B9%E6%80%A7)
*   配置简单，基于 JSON，比如禁用 CSS Modules 只要配`"disableCSSModules": true`
*   黑盒升级，就算之后 roadhog 换成 rollup 或其他的，用户也不需要更改配置

## 啥情况下不换 roadhog?

以下情况不推荐换 roadhog 。

*   有强定制需求，比如用 sass 等
*   有强 mock 数据需求，并且之前通过 dora-plugin-proxy 写了很多 mock 的
*   无线，并且有强定制需求的， [待调研](https://github.com/sorrycc/roadhog/issues/18)

## 修改步骤

### 修改 package.json

删除 `atool-build` 和 `dora` 相关依赖，加上 `roadhog` 依赖。

```bash
$ npm install roadhog --save-dev
```

修改 scripts 部分，让 `start` 和 `build` 走 roadhog：

```
"start": "roadhog server"
"build": "roadhog build"
```

可参看这个 [Commit](https://github.com/dvajs/dva-cli/commit/203f2ffdd91a06f0b1538899e7509edc7ba2764e) 或 [dva-example-user-dashboard](https://github.com/dvajs/dva-example-user-dashboard) 。

### 新增 `.roadhogrc`

如果是用 dva + antd 的组合，babel 插件部分通常这么配：

```json
"extraBabelPlugins": [
  "transform-runtime",
  ["import", { "libraryName": "antd", "style": "css" }]
],
"env": {
  "development": {
    "extraBabelPlugins": [
      "dva-hmr"
    ]
  }
}
```

然后把 webpack.config.js 中的配置参考 [roadhog#配置](https://github.com/sorrycc/roadhog#%E9%85%8D%E7%BD%AE) 迁移到 `.roadhogrc` 中。

### 删除 `webpack.config.js`

(完)
