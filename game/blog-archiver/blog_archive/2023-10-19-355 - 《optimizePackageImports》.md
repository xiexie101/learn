---
title: "355 - 《optimizePackageImports》"
date: 2023-10-19
url: https://sorrycc.com/optimize-package-imports
---

发布于 2023年10月19日

# 355 - 《optimizePackageImports》

> 脑暴了下 Next.js 的 optimizePackageImports 在 Mako 下实现的 RFC，实现需要较多构建和 Mako 相关的背景知识，比较晦涩难懂。

## 背景

背景是看到 Next.js 的文章 [https://vercel.com/blog/how-we-optimized-package-imports-in-next-js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js) ，其中的 optimizePackageImports 看起来很心动。这个方法能大量减少模块总数，从构建工具的角度看，不仅减少了 build 的工作，也减少了 module graph 里的模块数，进而降低了 tree-shaking 和 code splitting 的压力。

![](https://img.alicdn.com/imgextra/i1/O1CN01fY3Ni72AIx6RVmljI_!!6000000008181-2-tps-1514-956.png)

我之前写过的 babel-plugin-import 也是这个目的，但不如 optimizePackageImports 通用和覆盖面广。覆盖面是决定最终效果的关键因素，之前做 mfsu 第一版的时候就深有体会。

## 问题

先看要达到的效果。

比如我们这么写。

```ts
import { Button } from 'antd';
```

然后 antd 的入口文件是 `antd/es/index.js`，其内容如下。

```ts
export { default as App } from './App';
```

那前面我们写代码如果被优化成这样，就可以大量减少模块数量了。

```ts
import Button from 'antd/es/App';
```

## 实现

怎么做到这一点呢？下面花 30 分钟脑暴下实现思路。

这个场景比较复杂，edge case 比较多，感觉测试驱动会比较好。所以先想下需要覆盖的用例。

基础用例如下。

*   import { x } from ‘foo’，如果 foo 是桶文件，期望会被替换
*   import { x } from ‘foo’，如果 foo 不是桶文件，期望不会被替换
*   支持 import { x as y }
*   支持 import x from ‘foo’ 的用 default specifier 的场景
*   不支持 import \* as x from ‘foo’，不管 foo 是不是桶文件，都期望不会被替换

进阶用例如下。

*   支持递归桶文件，比如项目 > a，a 的入口文件依赖 a/button/index，而 a/button/index 也是个桶文件，期望拿到的是最终不是桶文件的路径
*   支持 node\_modules 下依赖的场景，项目 > a > b，a 里有 import { x } from ‘b’，如果 b 是桶文件，期望会被替换
*   支持 alias，项目 > a，如果 a 有 alias 配置，也需要支持
*   支持 alias，项目 > b > a，如果 a 有 alias 配置，也需要支持
*   考虑 externals，如果 a 有 externals 配置，不会被替换
*   …

有两个方向性的选择。1）提前先建立映射表，然后在 build 模块时替换 import source，2）实时操作，在 build 模块时边分析边建立映射表边替换。如果是在 umi 层处理，我会选择前者；而如果在 mako 层处理，我会选择后者，因为，1）对性能的影响比较小，只要增量做一次已有 ast 的 transform，2）能做的范围更大，可以支持 node\_modules 下的文件的场景。

同时，只会针对 node\_modules 下做桶文件的判定。因为，1）源码文件相对模块数少，提升不大，2）源码文件变更多，需要支持 watch 的话，实现成本较高，同时还要考虑缓存的生效情况。

基于后者的思路如下。

*   build 阶段我们现在会做 load、parse、transform、analyze\_deps、resolve，然后返回依赖和模块信息，主进行基于返回的依赖信息新增任务到队列。
*   由于 barrelFile 的判断需要支持递归的场景，分析 foo/index.js 时还需要分析 foo/index.js 依赖的文件，直到对方不是 barrel file 为止，所以 transform 时需要，1）直接做 resolve 并替换产物，2）前置 load、parse 和 analyze barrel file 文件，同时这部分要做缓存，不重复做。

伪代码如下。

```rust
fn build(file_path) {
  let ast = load_and_parse(file_path);
  transform(ast);
  let deps = analyze_deps(ast);
  { deps }
}

// cache with file_path
// delete cache after build process
fn load_and_parse(file_path) {
  return ast;
}

fn transform(ast, file_path) {
  let imports;
  each import {
    let source = resolve(file_path, import.source);
    let { is_barrel, specifiers } = parse_barrel_file(source);
    if is_barrel {
      replace source with specifiers and import.specifier
    }
  }
}

// cache with file_path
fn parse_barrel_file(file_path) {
  let ast = load_and_parse(file_path);
  let is_barrel_file;
  let exports;
  let specifiers = parse_specifiers();
  each export {
    let file_path = resolve(file_path, export.source);
    let { is_barrel_file, specifiers } = parse_barrel_file(file_path);
    if is_barrel_file {
      merge specifiers;
    }
  }
  { is_barrel_file, specifiers }
}
```
