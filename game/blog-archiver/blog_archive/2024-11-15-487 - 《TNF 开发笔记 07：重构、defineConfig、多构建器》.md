---
title: "487 - 《TNF 开发笔记 07：重构、defineConfig、多构建器》"
date: 2024-11-15
url: https://sorrycc.com/tnf-07
---

发布于 2024年11月15日

# 487 - 《TNF 开发笔记 07：重构、defineConfig、多构建器》

1、[TNF Ant Design Pro](https://github.com/umijs/tnf-ant-design-pro)。不能只有框架没有模版，所以先把 Ant Design Pro 改造一版成 TNF 的样子。改造的点主要是路由定义的方式，以及添加 loader 用于加载，这样才能充分利用好 tanstack router preload 的能力。我感觉我是有代码洁癖的，所以把 README、配置文件、package.json 也都调了一遍。

2、我花了一些时间做重构和分层。拆了 bundler 层、sync 层、generator 层等，下面这些 Commit 都是，拆完自我感觉清晰不少。我没办法做到一次性完成好的设计就不改了，新框架的设计还是需要不断迭代的。

[https://github.com/umijs/tnf/commit/1f752170fe318860744c0c519c4752932594ea65](https://github.com/umijs/tnf/commit/1f752170fe318860744c0c519c4752932594ea65)  
[https://github.com/umijs/tnf/commit/67e501f9e0266a2a84e7d708c69f15067b4bc0d5](https://github.com/umijs/tnf/commit/67e501f9e0266a2a84e7d708c69f15067b4bc0d5)  
[https://github.com/umijs/tnf/commit/6a5c687b7e0f752834c890bc2c6808c8eeb03add](https://github.com/umijs/tnf/commit/6a5c687b7e0f752834c890bc2c6808c8eeb03add)  
[https://github.com/umijs/tnf/commit/345f995a37beb432146e91a36ebe35289c22839e](https://github.com/umijs/tnf/commit/345f995a37beb432146e91a36ebe35289c22839e)

3、[src/.tnf > .tnf](https://github.com/umijs/tnf/commit/1d6eb5c673513987a574dcb7bede126176baf3f9) 。如果大家熟悉 Umi，Umi 也有个临时目录，是在 src/.umi 下，更早好像是在 src/pages/.umi 下。这次 tnf 我一开始也放在 src/.tnf 下，想了下，还是改成 .tnf。原因是临时文件原则性上不属于源码，src 目录通常有特殊意义，比如 webstorm 用户打开 Umi 项目还得手动 exclude 下 src/.umi 就有点麻烦。

4、[sync tsconfig.json](https://github.com/umijs/tnf/commit/b34554b6921ad8fb0e7ee301ad5ec056f5da823a)。即 tnf 生成一份 tsconfig.json，然后用户的 tsconfig.json 继承他。好处是，可以把一些内部的功能和配置抹平了。比如 tnf 本身加的一些 alias，像是 @、@tanstack/router 等，有些还用了绝对路径，就需要配置好提供出来，否则会有类型问题。比如 css、css modules、svg、图片等文件的类型。

5、新增了 [config 命令](https://github.com/umijs/tnf/pull/43)。config 基于 c12 实现的，c12 封装的很好，加上 magicast 后很容易就支持了基于 ast 的 config 修改操作。

```bash
$ tnf config list
$ tnf config get tailwindcss
$ tnf config set tailwindcss false
$ tnf config remove tailwindcss
```

6、感觉 [defineConfig](https://github.com/umijs/tnf/commit/9072730adeed491805e17376bdbd1aa78ab30c19) 是框架和工具的标配了。通常有两种方法，一种是提供 defineConfig，一种是提供 Config 类型。我选了前者，沿袭 Umi 的传统。

```ts
// 1)
import { defineConfig } from '@umijs/tnf';
export default defineConfig({});

// 2)
import type { Config } from '@umijs/tnf';
export default {} as Config;
```

7、volta 用来确保大家的 Node 和 pnpm 版本一致应该是很好的方法，详见 [https://github.com/umijs/tnf/commit/7eba3b4b68811f420625a3e450dbbac211541145](https://github.com/umijs/tnf/commit/7eba3b4b68811f420625a3e450dbbac211541145) 和 [486 - 《用 Cursor Docs 学 Volta》](https://sorrycc.com/cursor-docs-volta)。

8、多构建器支持。做了 Bundler 分层，方便接入不同的构建器。接入构建器只需要提供 build、configDevServer 等方法即可。

```ts
export default {
  build() {},
  configDevServer() {},
}
```
