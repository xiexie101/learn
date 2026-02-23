---
title: "86 - 《分析 import 和 export 的 6 种方式》"
date: 2022-03-31
url: https://sorrycc.com/parse-imports-and-exports
---

发布于 2022年3月31日

# 86 - 《分析 import 和 export 的 6 种方式》

做工具或框架时，我们偶尔会需要拿到一个文件的 import/require 或 export 信息，用于分析其依赖和导出。Umi 中有大量应用，比如 esmi 方案中会根据此信息做智能依赖的入口级 tree-shaking；MFSU 方案中会根据此信息生成整个项目的 Module Graph；插件体系中会根据此信息分析插件临时文件的导出并自动添加到 umi 入口，实现 import all from umi 的效果；等等。

用于分析的方案一直在迭代，主要用到的依赖有 crequire、babel、cjs-module-lexer、es-module-lexer、esbuild。没有银弹，不同方案的适用场景不同，选择最合适和最高性能的吧。

代码见：[https://github.com/sorrycc/module-analyze-examples](https://github.com/sorrycc/module-analyze-examples) 。

1、

crequire 是 seajs 维护者 army8735 的作品，seajs 依赖于此，用于分析一个文件中的 require 使用情况，可用于 browser 和 node 环境。

```
const crequire = require('crequire');
console.log(crequire(content, true));
```

即可拿到文件中的 require 信息，以及他们的位置信息。第二个参数传入 true 还支持分析 require.async、require.ensure 的变种使用。

缺点是，1）cjs 逐渐没落，这个库没有持续维护，暂不支持 esm，2）不支持 export 信息的分析。

2、

babel 是万能的，啥都能分析，支持 cjs、esm、jsx、typescript，可以分析 imports 和 exports。

缺点是，1）依赖大，几十M，2）慢，3）不能在浏览器中独立运行。

3、

cjs-module-lexer 是 guybedford 维护的，他同时也是 es-module-lexer、jspm、es-module-shims 的作者。

cjs-module-lexer 支持分析 exports 信息，同时支持 reexport 和 `__esModule` 的分析，可在浏览器和 node 中使用。

```
const { parse } = require('cjs-module-lexer');
console.log(parse(content));
```

以上代码，即可拿到 export 信息。

缺点是，不支持分析 require 信息，所以和 crequire 是互补的，可以搭伙使用。

4、

es-module-lexer，顾名思义就是分析 esm 的。支持 import 和 export 的分析，支持浏览器和 node 使用，同时由于 import 信息中能拿到其在文件中的开始和结束位置，还可以用于做 import 内容的删改。

```
const { parse, init } = require('es-module-lexer');
await init;
console.log(parse(content));
```

以上代码，即可拿到 import 和 export 信息。

缺点是，1）不支持 type 导出，比如 `export type { Test } from './test'`，2）不支持 jsx，比如 `function App() { return <h1>App</h1> }` 会直接报错。

5、

基于上述 es-module-lexer 的缺点，我们遇到 jsx 时通常会搭配 esbuild 来使用。先用 esbuild build 一遍，再用 es-module-lexer 做分析。

```
const { parse, init } = require('es-module-lexer');
const esbuild = require('esbuild');
const ret = esbuild.transformSync(content, { loader: 'jsx', format: 'esm' });
await init;
console.log(parse(ret.code));
```

以上代码，就支持文件中出现 jsx 了。但需要注意的是，由于多了一次 esbuild 编译，es-moudle-lexer 产出的 import 信息的位置不能直接用。应该可以基于 sourcemap 转回去，但具体我没试过。

6、

都已经通过 esbuild 构建了，为啥还要走 es-module-lexer？昨天看同事的代码，发现纯 esbuild 也是能拿到 exports 信息的。

```
const esbuild = require('esbuild');
const ret = esbuild.buildSync({
 entryPoints,
 format: 'esm',
 metafile: true,
 write: false,
});
console.log(ret.metafile.outputs);
```

以上代码，能拿到文件的 exports 信息。

缺点是没有 imports 信息，作者应该会实现，现在是有 imports 字段但没内容。

#日更
