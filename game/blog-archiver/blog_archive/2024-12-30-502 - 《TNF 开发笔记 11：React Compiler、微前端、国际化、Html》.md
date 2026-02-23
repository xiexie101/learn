---
title: "502 - 《TNF 开发笔记 11：React Compiler、微前端、国际化、Html》"
date: 2024-12-30
url: https://sorrycc.com/tnf-11
---

发布于 2024年12月30日

# 502 - 《TNF 开发笔记 11：React Compiler、微前端、国际化、Html》

1、React Compiler。

TNF 一大卖点是性能，所以和性能相关的任务都会提高优先级。React Compiler 虽然还不太成熟，但感觉会是未来的方向，所以也加上了。React Compiler 目前只有 Babel 的版本，Rust 版本应该已经挂了，已经好多个月没有更新过代码了。

TNF 用的是 Mako，所以[通过插件的方式支持的 React Compiler](https://github.com/umijs/tnf/commit/788aae108686da574f52a6ab6051b00e6998d036)。针对 src 下的文件做 Babel 编译，构建性能上会有所下降是必然的，不过如果项目不是非常大，应该还好吧。为了产品性能，还是值得的。

那怎么知道开启后是否快了呢？可以用 React Scan 做下前后对比，看下有哪些不必要的 Re-render 减少了。

2、Qiankun 微前端。

umi 的 qiankun 插件太复杂，感觉没必要，先参考 [Qiankun 教程](https://qiankun.umijs.org/zh/guide/tutorial) 上了个[简单的](https://github.com/umijs/tnf/commit/c7805aa4af390debd541e9e51f5c545f1f67117a)，现在 tnf 是组装式的，所以支持 Qiankun 很简单，根本不需要插件。不过还留了一些 TODO，像通过 `window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 复用父应用的 publicPath 和支持 basename 的替换等。

后续应该会做进一步的封装，但封装的思路不会再和 umi 一样，提供插件，对用户黑盒。而是提供 @umijs/tnf-qiankun，暴露运行时和编译时的能力，让用户来调用，比如 `import { MicroApp } from '@umijs/tnf-qiankun'`。

3、组装式。

接上一个 qiankun 的再聊下组装式，现在 tnf 在实现时还没有完全遵循这个原则，比如 tailwind css、react scan 等，还是通过提供配置或者约定的方式。

我有点想换成全组装式的。如有需要，为每个方案提供一个 @umijs/tnf- 前缀的包，比如 @umijs/tnf-tailwindcss，这里按需提供 generator、plugin、doctor 规则、编译时和运行时。好处是可配性高、框架解耦和轻内核，缺点是使用起来略繁琐。

4、国际化。

做了下调研，选了 react-i18next 作为新的国际化方案，参考 [499 - 《React 国际化方案》](https://sorrycc.com/react-i18n)，不赘述。然后[在 tnf-ant-design-pro 里实施](https://github.com/umijs/tnf-ant-design-pro/pull/16)。

5、Html。

为 TNF 先简单加了 Html 的能力。之前太裸了，在 public 目录下放个 index.html 然后自动 copy dist 目录。目前的实现约定了 src/index.html 为模版，支持 ejs，支持 mountElementId，支持 hashed assets。

但这肯定不是最终版。最终理想的方案应该是要和 SSR 结合的，写法上和小虎在 [issue](https://github.com/umijs/tnf/issues/4) 里写的有点像。

6、ESM 工程化。

有个下午多出了半小时，就想着把 TNF 转 ESM。看着比较麻烦，但起来改起来还挺快，见 [PR](https://github.com/umijs/tnf/pull/84) 。

就做了以下 4 个改动。

1）用了 `__dirname` 的地方加以下代码。

```ts
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

2）resolve.resolve 改用自定义函数。

```ts
async function resolveModule(id: string) {
  return fileURLToPath(await import.meta.resolve(id));
}
```

3）所有 import 加 `.js` 后缀。

```diff
- import { foo } from '../foo';
+ import { foo } from '../foo.js';
```

4）package.json 中加 `type: 'module'`。
