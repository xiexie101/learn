---
title: "Yarn PNP 解析及在 umi 中的实践"
date: 2019-03-24
url: https://sorrycc.com/yarn-pnp
---

发布于 2019年3月24日

# Yarn PNP 解析及在 umi 中的实践

![](https://img.alicdn.com/imgextra/i2/O1CN01TDz36W1WPkN6XXrlS_!!6000000002781-2-tps-1774-1184.png_1200x1200.jpg)

题图：不详

\## What's PNP?

PNP 即 Plug’n’Play，是 facebook 内部在遇到 node 依赖包下载慢和依赖解析问题时给出的一套解决方案，据说能快 70%，虽然我实际上跑下来没那么快，但也快了 50% 以上。

以 [ant-design-pro](https://github.com/ant-design/ant-design-proc) 为例。

yarn install

yarn install --pnp

空缓存

86s

65s

满缓存

30s

13s

空缓存时只快了 24.4%，因为时间主要耗在下载上，这个很难避免；满缓存时快了 56.7%，感受明显。

那么为啥能快这么多？

## How PNP works?

先看下之前 yarn/npm 是怎么工作的？

1.  解析 semver 依赖为确定版本，比如 `^3.0.0` -> `3.0.1`
2.  下载确定版本的 tar 包并存储到本地镜像
3.  解压缩 tar 包到 cache 目录
4.  从 cache 目录复制到 node\_modules 目录

PNP 所做的主要是优化了第四步，因为复制文件会有大量的 IO 操作，而 node\_modules 下的文件数量又通常是以万计的，所以这步会非常慢。

![](https://img.alicdn.com/imgextra/i4/O1CN01UnYgNi1LEn7gUqipU_!!6000000001268-2-tps-1488-194.png)  
（图：yarn 的第四步）

PNP 的做法是**不复制，取而代之的建立一个表**，包含：

1.  有哪些依赖
2.  依赖之间的关系
3.  依赖在哪里

比如，下面是安装 react-dom 后的表：

```ts
new Map([
  ["react-dom", new Map([
    ["16.5.2", {
      packageLocation: path.resolve(__dirname, "../../../Users/chencheng/Library/Caches/Yarn/v3/npm-react-dom-16.5.2-b69ee47aa20bab5327b2b9d7c1fe2a30f2cfa9d7/node_modules/react-dom/"),
      packageDependencies: new Map([
        ["loose-envify", "1.4.0"],
        ["object-assign", "4.1.1"],
        ["prop-types", "15.6.2"],
        ["schedule", "0.5.0"],
        ["react-dom", "16.5.2"],
      ]),
    }],
  ])],
  ["loose-envify", new Map([
    ["1.4.0", {
      packageLocation: path.resolve(__dirname, "../../../Users/chencheng/Library/Caches/Yarn/v3/npm-loose-envify-1.4.0-71ee51fa7be4caec1a63839f7e682d8132d30caf/node_modules/loose-envify/"),
      packageDependencies: new Map([
        ["js-tokens", "4.0.0"],
        ["loose-envify", "1.4.0"],
      ]),
    }],
  ])],
  ...
]
```

这个表里已经包含了所有信息，我们在执行 `require('module')` 时能有办法知道是从哪里找，所以 node\_modules 文件夹就没有必要了。

另外，他不仅仅是更快，他还解决了之前很多问题。

## Why PNP?

这里举几个我关心的，更多可参考 [PNP 的文档](https://github.com/yarnpkg/rfcs/blob/master/accepted/0000-plug-an-play.md#4-solved-issues)。

### 多个项目不需要每个都有个巨大的 node\_modules 目录

这是个烦人的问题，我的工作目录非常大，其中 90% 都是 node\_modules 依赖，磁盘空间满的时候总是从这里清。而由于 PNP 不需要复制文件，所以所有的项目都会公用一份 cache，这能让我的工作目录变得很小。

![](https://img.alicdn.com/imgextra/i1/O1CN01ycGU2B1Fgpg79fIsy_!!6000000000517-2-tps-528-494.png)

### 完美的依赖 hoist

这也是个困扰了很久的问题，比如如下依赖，

```bash
top-level
  – package-a
    ∗ package-c@1.0.0
  – package-b
    ∗ package-c@1.0.0
  – package-c@2.0.0
```

由于文件系统的限制，package-c 没有办法被提取到上面，所以：

1.  安装了两次
2.  如果用 webpack 打包，这个文件会被打包两份

大家日常中应该或多或少都有遇到，比如 babel 多版本共存时报错的问题也是因为这个。据我所知，cnpm/tnpm 中也加了不少 hack 的代码来处理这类依赖 hoist 的问题。

PNP 不经过文件系统，所以完美地绕开了这个问题。

### 不能依赖不存在于 dependencies 里的包

这是库开发者通常会遇到的问题，比如：

```bash
top-level
  – package-a
    ∗ package-b
```

然后 `require('package-b')` 来使用。这虽然不对，但却能跑，因为 package-b 会在安装的时候被提（hoist）到上面。而且这也不是开发者故意为之，而是因为可以用，有时候就疏忽了，但其实埋下了一个隐形炸弹。

比如我在让 [umi](https://github.com/umijs/umi/) 支持 PNP 时，就填了好几个坑，

*   [https://github.com/umijs/umi/pull/1199](https://github.com/umijs/umi/pull/1199)
*   [https://github.com/umijs/umi/pull/1198/files](https://github.com/umijs/umi/pull/1198/files)
*   [https://github.com/umijs/umi/pull/1194](https://github.com/umijs/umi/pull/1194)
*   [https://github.com/react-component/editor-mention](https://github.com/react-component/editor-mention)

## 新的问题

## 我能用了吗？

*   create-react-app@2
*   [https://github.com/umijs/umi-plugin-pnp](https://github.com/umijs/umi-plugin-pnp)

## PNP with umi

TODO

## 参考

*   [https://github.com/yarnpkg/rfcs/pull/101](https://github.com/yarnpkg/rfcs/pull/101)
*   [https://github.com/yarnpkg/rfcs/blob/master/accepted/0000-plug-an-play.md](https://github.com/yarnpkg/rfcs/blob/master/accepted/0000-plug-an-play.md)
*   [https://github.com/yarnpkg/yarn/pull/6382](https://github.com/yarnpkg/yarn/pull/6382)
*   [https://github.com/yarnpkg/pnp-sample-app](https://github.com/yarnpkg/pnp-sample-app)
*   [https://github.com/facebook/create-react-app/pull/5136](https://github.com/facebook/create-react-app/pull/5136)
