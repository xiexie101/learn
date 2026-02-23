---
title: "63 - 《ESBuild 和 Webpack 的 Tree Shaking 差异及其用途》"
date: 2022-02-28
url: https://sorrycc.com/esbuild-webpack-tree-shaking
---

发布于 2022年2月28日

# 63 - 《ESBuild 和 Webpack 的 Tree Shaking 差异及其用途》

先理解啥是 tree-shaking 摇树。举个例子，比如如下两个文件，

```tsx
// index.js
import { foo } from './foo'
foo();

// foo.js
export function foo() {
  return 'foo';
}
export function bar() {
  return 'bar';
}
```

index.js 依赖 foo.js 的 foo，而 foo.js 同时导出 foo 和 bar 函数，很明显，bar 函数是多余的，tree-shaking 的目的就是把多余的去掉。上述例子，打包 index.js 之后，多余的 bar 函数就会被摇树摇掉，结果如下，

```tsx
function foo() {
 return 'foo';
}
foo();
```

再来看 esbuild 和 webpack 的 tree-shaking 差异。webpack 如果 mode 为 development，bar 函数还是在的，只有 mode 设为 production 时才能正确 tree-shaking，因为 webpack 的 tree-shaking 是在压缩阶段做的。esbuild 则不是，不依赖压缩。其实 rollup 也不是，不依赖压缩。

这能做什么？其中一个场景是文件拆分，比如一个文件中既有 server 侧代码，又有 browser 侧代码，为了构建性能和产物大小，我希望把他分别拆成两份代码。比如 Remix 的路由文件就是这个场景，既有 browser 的 React Component，又有服务端的 loader 函数。

比如 A 文件

```tsx
// server  
export function loader() {}

// browser  
export default () => <div>hi</div>
```

解法思路是先写临时文件，此文件 `export { loader } from '/path/to/A'`，然后用 esbuild 打包临时文件，产物就不会包含 `default export` 的 React 组件，这份产物可以写到另一个临时文件，供后续用 webpack 打包或其他场景适用。

Umi 后续会实现一个 browser 侧的 loader，也会用此思路。开发者可以在路由组件中写客户端的数据加载逻辑，还是上面的代码示例，但这部分会拆出来成独立文件，为了让其和路由组件解耦，加载时就无需等路由组件完成，在页面最小脚本加载完成后即可执行数据部分的加载，从而大幅提升页面性能。
