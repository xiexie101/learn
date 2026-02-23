---
title: "472 - 《ts-black-space》"
date: 2024-10-13
url: https://sorrycc.com/ts-blank-space
---

发布于 2024年10月13日

# 472 - 《ts-black-space》

翻了下 ts-blank-space 的源码，做下笔记，附带一个 toy version。

1、ts-blank-space 的功能是移除 TypeScript 代码中的类型注解，基于 typescript 的 transform api，没有用 wasm，没有用 native 语言，纯 js 实现，但性能[只相比 native + async 稍慢一点点](https://github.com/bloomberg/ts-blank-space/tree/main/perf#results)。

2、ts-blank-space 的实现原理是基于 typescript 的 transform api，遍历并更新所有变量声明节点，移除其类型注解。

3、例行提取其中最简逻辑，写个 Toy Version 如下。

```ts
import * as ts from "typescript";

function removeTypeAnnotation(input) {
  const sourceFile = ts.createSourceFile(
    "input.ts",
    input,
    ts.ScriptTarget.Latest,
    true
  );

  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.type) {
      return ts.factory.updateVariableDeclaration(
        node,
        node.name,
        undefined, // Remove type annotation
        node.initializer
      );
    }
    return ts.visitEachChild(node, visit, ts.nullTransformationContext);
  }

  const result = ts.transform(sourceFile, [
    (context) => (rootNode) => ts.visitNode(rootNode, visit)
  ]);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printFile(result.transformed[0]);
}

// Usage
const input = "let a: string = 'a';";
console.log(removeTypeAnnotation(input)); // let a = 'a';
```

做了以下几件事：

1）使用 TypeScript 的编译器 API 创建一个 SourceFile。  
2）定义一个 visit 函数，它会遍历 AST 并找到变量声明。  
3）当找到带有类型注解的变量声明时，创建一个新的变量声明，但不包含类型注解。  
4）使用 TypeScript 的 transform API 应用这个 visit 函数。  
5）最后，使用 TypeScript 的打印器将转换后的 AST 转回字符串。

参考：  
[https://github.com/bloomberg/ts-blank-space](https://github.com/bloomberg/ts-blank-space)
