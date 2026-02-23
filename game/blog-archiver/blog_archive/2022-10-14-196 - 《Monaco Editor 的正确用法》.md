---
title: "196 - 《Monaco Editor 的正确用法》"
date: 2022-10-14
url: https://sorrycc.com/monaco-editor
---

发布于 2022年10月14日

# 196 - 《Monaco Editor 的正确用法》

主要应该就 3 个方案。

1、monaco-editor（周下载 540K） + monaco-editor-webpack-plugin（周下载 184K）  
2、基于 1，使用 react-monaco-editor（周下载 93K）  
3、使用 @monaco-editor/react（周下载 212K）

1 是官方方案，需要配套的 webpack 插件一起使用，缺点是配置麻烦、构建和热更慢、更新时需要同步更新 webpack 插件和 monaco-editor 本身、需要自己实现 react 封装、页面加载慢；2 是在 1 的基础上加了 react 的组件封装，同样需要配套的 webpack 插件；3 不仅是 react 封装，还有一套 loader 机制，动态加载 monaco-editor 而无需官方 webpack 插件，monaco-editor 的文件可以通过 copy-webpack-plugin 复制，也可以直接引 cdn 上的，优点是可以解 1 的缺点。

我分别用 1 和 3 方案建了个项目进行对比。

![](https://img.alicdn.com/imgextra/i3/O1CN01RcbODQ20KC3OR0WlU_!!6000000006830-0-tps-2084-1080.jpg)

上图是模拟 Fast 3G 下页面加载速度的对比，3（左）相比 1（右）在下载量、load 时间都相小地多和快地多。

方案

下载量

load 时间

3（左）

12.8M

6.24s

1（右）

25.9M

15.92s

![](https://img.alicdn.com/imgextra/i2/O1CN01okySXz1LISIyJSFZT_!!6000000001276-0-tps-1062-1832.jpg)

上图是 build 速度的对比。

方案

构建时间

3（上）

2.51s

1（下）

16.17s

> 注：@monaco-editor/react 的 loader 机制被提取为 @monaco-editor/loader，所以也同样使用非 react 场景。

蚂蚁的现状是，1）占比差不多是 1+2 75%，3 25%，2）使用了 3 的大部分项目没有配 path，所以会直接用默认的 [cdn.jsdelivr.net](http://cdn.jsdelivr.net) 上的资源文件，这也是使用时很容易忽略掉的点，但这对于企业级应用来说，依赖三方 cdn 是个潜在的风险点。

所以，正确的方案是：方案 3 + path 配置，代码如下。

```ts
import MonacoEditor, { loader } from '@monaco-editor/react';
loader.config({
  'vs/nls': {
    availableLanguages: {
      '*': 'zh-cn',
    },
  },
  paths: {
    vs: 'https://gw.alipayobjects.com/os/lib/monaco-editor/0.33.0/min/vs',
  },
});

<MonacoEditor />
```

如果有不走 cdn 的私有化部署需求，可以把 `paths.vs` 配本地，同时用 copy-webpack-plugin 复制 monaco-editor 相应代码到产物目录。

参考：  
[https://github.com/Microsoft/monaco-editor](https://github.com/Microsoft/monaco-editor)  
[https://github.com/microsoft/monaco-editor/tree/main/webpack-plugin](https://github.com/microsoft/monaco-editor/tree/main/webpack-plugin)  
[https://github.com/react-monaco-editor/react-monaco-editor](https://github.com/react-monaco-editor/react-monaco-editor)  
[https://github.com/suren-atoyan/monaco-react](https://github.com/suren-atoyan/monaco-react)  
[https://github.com/suren-atoyan/monaco-loader](https://github.com/suren-atoyan/monaco-loader)
