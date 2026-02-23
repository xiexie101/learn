---
title: "介绍 roadhog —— 让 create-react-app 可配的命令行工具"
date: 2016-12-15
url: https://sorrycc.com/roadhog-introduce
---

发布于 2016年12月15日

# 介绍 roadhog —— 让 create-react-app 可配的命令行工具

库地址：[https://github.com/sorrycc/roadhog](https://github.com/sorrycc/roadhog)

## roadhog 是啥?

简单来说，**roadhog 是可配置的 [react-create-app](https://github.com/facebookincubator/create-react-app)**。

roadhog 是一个 cli 工具，提供 `server` 和 `build` 两个命令，分别用于本地调试和构建。命令行体验和 create-react-app 一致，配置略有不同，比如默认开启 [css modules](https://github.com/css-modules/css-modules)，**然后还提供了 JSON 格式的配置方式**。

![](https://img.alicdn.com/imgextra/i1/O1CN01kNCl1g1D1x5uojhwm_!!6000000000157-1-tps-1584-891.gif)

## 命名来源?

[http://ow.blizzard.cn/heroes/roadhog](http://ow.blizzard.cn/heroes/roadhog)

![](https://img.alicdn.com/imgextra/i3/O1CN012wz95T1mMZTVVtP1p_!!6000000004940-2-tps-1100-1100.png)

## 为啥要有 roadhog ?

做 roadhog 有多方原因：

首先，create-react-app 体验实在太好了，细节做地很到位，比如启动成功后会自动打开浏览器窗口这个操作，会检查当前是否已经有打开当前 URL 的 Tab，有的话就刷新那个 Tab 。**但可惜他并不支持配置**，比如我们要用 less 和 css-modules，就不能使用了。相信会有不少人有同样的想法。

另外，我们目前是基于 [atool-build](https://github.com/ant-tool/atool-build) 和 [dora](https://github.com/dora-js/dora) 的工具套件。dora 有插件机制，atool-build 的配置和 webpack 一样，基于编程。这两种扩展方式都太灵活，灵活是优点，但导致我们做功能升级时需要考虑太多的事情，并且无法保证兼容。

**那么 roadhog 的配置方式和之前的有何不同呢?**

## 配置方式的选择

我们做 cli 工具有一段时间了，从 spm2, spm3, atool-build + dora 到现在的 roadhog。(目前 roadhog 并非 atool 的升级版，两者场景不同, atool 扩展性更好) 配置方式从 JSON 到编程，最终又回归到 JSON 。

**roadhog 为啥用 JSON 格式的配置?**

做 atool 的时候我们是用编程的配置方式，**优点是灵活**，可随意改变工具内置的 webpack 配置。

但缺点也很明显：

**1\. 配置麻烦**

比如要删除内置的 CommonChunkPlugin，不加注释基本没人能看懂了。

```js
// Don't extract common.js and common.css
webpackConfig.plugins = webpackConfig.plugins.filter(function(plugin) {
  return !(plugin instanceof webpack.optimize.CommonsChunkPlugin);
});
```

更多详见：[https://github.com/dvajs/dva-cli/blob/1a4cb33/boilerplates/app/webpack.config.js](https://github.com/dvajs/dva-cli/blob/1a4cb33/boilerplates/app/webpack.config.js)

**2\. 工具升级困难**

举一个实际的例子。

atool-build 内部配置有一段为：

```js
{
  test: /\.css$/,
  loader: 'css!postcss'
}
```

后面由于一些原因，我们改成了：

```js
{
  test: /\.css$/,
  loader: `${require.resolve('css')}!${require.resolve('postcss')}`
}
```

但立马导致一些用户出错，原因是他的配置里有判断 loader 内容是否为 `css!postcss`，这就让工具的升级寸步难行。

## roadhog 配置

基于上面的原因，roadhog 的配置以 JSON 格式呈现。

下面是目前支持的全部配置项，他们在 [roadhog#配置](https://github.com/sorrycc/roadhog#%E9%85%8D%E7%BD%AE) 中有详细解释：

```json
{
  "entry": "src/index.js",
  "disableCSSModules": false,
  "less": false,
  "publicPath": "/",
  "extraBabelPlugins": [],
  "autoprefixer": null,
  "proxy": null,
  "env": null,
}
```

以及未来可能支持的配置项：[https://github.com/sorrycc/roadhog/issues?q=is%3Aissue+is%3Aopen+label%3Aconfig](https://github.com/sorrycc/roadhog/issues?q=is%3Aissue+is%3Aopen+label%3Aconfig) 。

## 体验 roadhog

安装 roadhog：

```bash
$ npm i roadhog -g
```

新建项目目录：

```bash
$ mkdir myapp && cd myapp
```

创建 `package.json`，内容为：

```
{}
```

创建 `src/index.js`，内容为：

```
import './index.html';
document.write('Hello, roadhog!');
```

创建 `src/index.html`，内容为：

```html
<script src="index.js"></script>
```

启动：

```bash
$ roadhog server
```

正常的话，会自动帮你打开浏览器，你会看到 `Hello, roadhog!`。

(完)
