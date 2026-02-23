---
title: "15 - 《Umi 周会分享：Umi 4 的 Test RFC》"
date: 2021-12-23
url: https://sorrycc.com/umi-4-test-rfc
---

发布于 2021年12月23日

# 15 - 《Umi 周会分享：Umi 4 的 Test RFC》

> 上午 Umi 周会的分享内容。

## 从场景入手

一些场景，包括测组件、测逻辑、集成测试、测需要 UMI 临时文件和别名的场景。每个场景用最小功能，比如测逻辑不应该加入 jsdom 或 umi alias 之类的配置，也不需要生成 umi 临时文件。

组装式，需要用啥按需取用。

最复杂的是「测需要 UMI 临时文件和别名的场景」。用户侧执行 umi setup && umi test，umi setup 生成临时文件，别名通过提供方法 configUmiAlias 给用户，让用户自行组装。

```ts
// jest.config.ts
import { configUmiAlias, createConfig } from 'umi/test';
export default configUmiAlias(createConfig({
  jsTransformer: 'esbuild' | 'swc' | 'babel' | 'none'
}));
```

并且项目里显式依赖 jest，测试命令就是执行 jest。

```json
// package.json
{
  "scripts": { "test": "jest" },
  "devDependencies": { "jest": "^27" }
}
```

最简单的是测逻辑，只要 createConfig 即可，

```ts
// jest.config.ts
import { createConfig } from 'umi/test';
export default createConfig({
  jsTransformer: 'esbuild' | 'swc' | 'babel' | 'none'
});
```

测 UI 需要相关的 DOM MOCKING 和补丁，通过配置开启，

```ts
// jest.config.ts
import { createConfig } from 'umi/test';
export default createConfig({
  jsTransformer: 'esbuild' | 'swc' | 'babel' | 'none',
  dom: 'jsdom' | 'happydom',
  polyfill
});
```

## 功能

### jsTransformer

jsTransformer 支持 esbuild、swc、babel 和 none，其中 esbuild 最快。

![](https://img.alicdn.com/imgextra/i2/O1CN01U6hkkz1LB7xWsDvhm_!!6000000001260-2-tps-1372-456.png)

### configUmiAlias

new Service，取到 alias 配置，隐射为 moduleNameMapper。

### bigfish test

做很浅的一层封装，依赖 jest@27，拿 jest@27 来跑；配置层和 Umi 的使用方式保持一致，当然 import from 的 source 改成 bigfish 库。

## FAQ

### 为啥不提供 umi test 命令？

对于社区，尽量少黑盒，推荐用户直接用 jest 。

### Bigfish 层会提供 test 命令吗？

会。

## 参考

[https://github.com/umijs/umi-next/pull/113](https://github.com/umijs/umi-next/pull/113)
