---
title: "211 - 《你不知道的 9 个 @ant-design/icons 使用问题》"
date: 2022-11-10
url: https://sorrycc.com/ant-design-icons-problems
---

发布于 2022年11月10日

# 211 - 《你不知道的 9 个 @ant-design/icons 使用问题》

> 注：@ant-design/icons 作为组件库已经做地很好了。这里只是以 @ant-design/icons 为例，针对前端组件库的引用方式乱象做下说明和对比不同的引用方式，同时给正在写在 《最佳实践 2022-6：Icons 使用》做下铺垫。

1、@ant-design/icons 中引入一个 Icon 有几种方式？

6 种。

```ts
import { BellFilled } from '@ant-design/icons';
import { BellFilled } from '@ant-design/icons/lib';
import { BellFilled } from '@ant-design/icons/es';
import BellFilled from '@ant-design/icons/BellFilled';
import BellFilled from '@ant-design/icons/lib/icons/BellFilled';
import BellFilled from '@ant-design/icons/es/icons/BellFilled';
```

2、以上用法，哪些没有类型提示？

除了 1 和 4，都没有。可以想想为啥 2 和 3 虽然有 d.ts 也不算有？

3、以上用法，在产物尺寸上有差异吗？

有。在使用 webpack 5 的前提下，2 4 5 31K，1 3 6 26K，同时 2 > 1，2 类的产物尺寸会比其他的大，因为用了 cjs 格式的产物，不会 tree-shaking。你可能奇怪 5 为啥比 1 大，只用了一个 Icon，并不需要 tree-shaking 啊？因为 Icon 背后有 @ant-design/icons、rc-utils、@babel/runtime 等依赖，入口用了 cjs，后面的链路就全部不会 tree-shaking。

4、以上用法，在构建速度上有差异吗？

有。(1 == 3 ~= 2) > (4 == 5 ~= 6)。前 3 个 3.266 s，后 3 个 2.258s。前者慢了 1s 左右，慢的原因盲猜是因为要处理 tree-shaking。以下是在 Mac M1 电脑上做的 Benchmark。

```bash
hyperfine --runs 5 'rm -rf node_modules/.cache && bundler-webpack build'
Benchmark 1: rm -rf node_modules/.cache && bundler-webpack build
  Time (mean ± σ):      3.266 s ±  0.022 s    [User: 3.001 s, System: 0.628 s]
  Range (min … max):    3.251 s …  3.304 s    5 runs

hyperfine --runs 5 'rm -rf node_modules/.cache && bundler-webpack build'
Benchmark 1: rm -rf node_modules/.cache && bundler-webpack build
  Time (mean ± σ):      2.258 s ±  0.018 s    [User: 1.542 s, System: 0.263 s]
  Range (min … max):    2.232 s …  2.281 s    5 runs
```

5、使用 export \* 的方式引入，会导致 tree-shaking 问题吗？

不会。比如下面两种引入方式，在构建速度、产物尺寸上均一模一样。所以，[这里](https://yuque.antfin.com/forces/mobile-app/dny68m#comment-105542893)的归因是有点问题的。

```ts
import { BellFilled } from '@ant-design/icons'; BellFilled;
import * as icons from '@ant-design/icons'; icons.BellFilled;
```

6、那推荐的方式是啥？

从入口引，如下。from @偏右

```ts
import { BellFilled } from '@ant-design/icons';
```

7、为啥不推荐这种方式？

```ts
import BellFilled from '@ant-design/icons/BellFilled';
```

因为是会映射到 lib 下的文件，CJS 格式，会让子依赖的 tree-shaking 不生效，导致尺寸增加。

8、那为啥不推荐从 es/icons 目录引？

```ts
import BellFilled from '@ant-design/icons/es/icons/BellFilled';
```

因为可能不要做测试，假如你用的测试工具是 Jest 的话，他对 esm 支持地很差。当然这在未来可能会改变。或者等 @ant-design/icons 改用 package exports 的方式同时声明子路径文件的 cjs 和 esm 文件。

9、从入口引用的方式会由于 tree-shaking 而影响构建速度，那么有更好的方案吗？

有。答案在《最佳实践 2022-6：Icons 使用》揭晓。
