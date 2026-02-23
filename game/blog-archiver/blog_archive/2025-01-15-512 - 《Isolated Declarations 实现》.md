---
title: "512 - 《Isolated Declarations 实现》"
date: 2025-01-15
url: https://sorrycc.com/isolated-declarations-implementation
---

发布于 2025年1月15日

# 512 - 《Isolated Declarations 实现》

1、早上看到 [unplugin-isolated-decl](https://github.com/unplugin/unplugin-isolated-decl) 就看了下实现。unplugin-isolated-decl 是一个TypeScript 声明文件生成工具，比传统的 tsc 编译器速度更快。其支持多种转换器，包括 Oxc、SWC 和 TypeScript。

2、提取 Declarations 的实现思路。

1）oxc。

```ts
import oxc from 'oxc-transform';
const result = oxc.isolatedDeclaration(id, code, { sourcemap: sourceMap });
```

2）swc。

```ts
import swc from '@swc/core';
const result = await swc.parse(code, {
  syntax: 'typescript',
  comments: false,
  target: 'es2022',
})；
const dts = swc.printSync(result, {
  minify: false,
});
const result = { code: dts.code };
```

3）Typescript。

```ts
import ts from 'typescript';
const options = {
  declaration: true,
  emitDeclarationOnly: true,
  noEmitOnError: false,
  declarationMap: true,
};
const host = ts.createCompilerHost(options);
const originalGetSourceFile = host.getSourceFile;
const sourceFile = ts.createSourceFile(
  id,
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);
host.getSourceFile = (fileName: string, ...args: any[]) => {
  return fileName === id ? sourceFile : originalGetSourceFile(fileName, ...args)
};
host.writeFile = () => {};
const program = ts.createProgram([id], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);

let dts = '';
let map: string | undefined;
const emitResult = program.emit(undefined, (fileName, text) => {
  if (fileName.endsWith('.d.ts')) {
    dts = text;
  } else if (fileName.endsWith('.d.ts.map')) {
    map = text;
  }
});
const result = { code: dts, map: map && JSON.parse(map).mappings };
```

3、此外，还让类型产物能够串起来，还得额外处理 import 语句的转换。unplugin-isolated-decl 这部分实现是结合 oxc-parser 和 magic-string 来做的。先用 oxc-parser 找出 import 语句，然后用 magic-string 修改他们。

```ts
const { program } = await parseAsync(id, dts);
const imports = filterImports(program);
const s = new MagicString(dts);
s.overwrite(source.start + 1, source.end - 1, result);
```

示例比如 types 是个目录的话，得把具体的文件路径给补全。

```ts
import type { Size } from './types'
↓ ↓ ↓ ↓ ↓ ↓
import type { Size } from './types/index'
```

参考：  
[https://github.com/unplugin/unplugin-isolated-decl](https://github.com/unplugin/unplugin-isolated-decl)  
[译：加速 JavaScript 生态系统 - Isolated Declarations](https://sorrycc.com/speeding-up-javascript-ecosystem-part-10)  
[457 - 《isolatedDeclarations》](https://sorrycc.com/isolated-declarations)
