---
title: "457 - 《isolatedDeclarations》"
date: 2024-07-18
url: https://sorrycc.com/isolated-declarations
---

发布于 2024年7月18日

# 457 - 《isolatedDeclarations》

1、先说背景。

如果我们用 TypeScript 开发库，会需要通过 .d.ts 类型声明文件来描述库的接口，这部分可以手写，更通用的是加 `--declaration` 让 tsc 自动生成。

```ts
// util.ts
export let one = "1";
export let two = "2";

// add.ts
import { one, two } from "./util";
export function add() { return one + two; }
```

而生成 .d.ts 最大的问题就是慢。慢的原因是多方面的，1）类型需要从其他文件推理，这意味着通常需要分析整个项目，2）这个推断是有依赖的，所以不能并发，不能充分利用多核，3）tsc 基于 JavaScript 实现，语言的速度有上限。swc 作者 kdy 曾尝试[开发过 stc](https://kdy1.dev/2022-10-27-open-sourcing-stc) 用 rust 解此问题最终放弃，rollup 和 svelte 作者 Rich-Harris 也曾有其他思路的解 [dts-buddy](https://github.com/Rich-Harris/dts-buddy)。

2、那如何解这个问题？TypeScript 官方的方案是 isolatedDeclarations（独立的声明文件），是 TypeScript 5.5 新推出的一个特性。加 `--isolatedDeclarations` 选项后，tsc 会要求你在 export 接口里加类型声明，不加报错。

```ts
export function foo() {
//              ~~~
// error! Function must have an explicit
// return type annotation with --isolatedDeclarations.
    return x;
}
```

3、但仅此而已，他只做报错。。

> Note that `isolatedDeclarations` does not change how TypeScript performs emit - just how it reports errors. Importantly, and similar to `isolatedModules`, enabling the feature in TypeScript won’t immediately bring about the potential benefits discussed here.

官方没有提供基于此之后高速的类型生产工具，这类工具可能会依托于社区。对此，[swc](https://x.com/kdy1dev/status/1804363859014357303)、[jsr](https://jsr.io/docs/about-slow-types)、[oxc](https://github.com/oxc-project/oxc/blob/ee627c355c919d1b0ce424d5c46c6882159f3f6e/crates/oxc_isolated_declarations/src/lib.rs#L29-L59) 已有实施或有实施计划，其中 jsr 的「无慢类型策略」与 isolatedDeclarations 是类似的方案，但后者在约束条件上更严格一些，这意味着开了 isolatedDeclarations 的项目会自然地满足 jsr 的策略。

4、适用场景和建议。

1）适用于库的开发，而应用类项目由于通常不需要生成 d.ts 文件所以不需要。如果你开发 npm 包、框架，可考虑开启 isolatedDeclarations，等有合适的工具出来后，类型生成的速度将不再是问题。

2）库开发工具，比如 father。会考虑接入支持 `isolatedDeclarations` 的极速的 d.ts 生成工具，来帮助库开发提速。

3）依赖预打包。也会需要生成 d.ts，可能也会用得到。

参考：  
[https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#isolated-declarations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#isolated-declarations)  
[https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-10/](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-10/)  
[https://github.com/rolldown/rolldown/issues/1396](https://github.com/rolldown/rolldown/issues/1396)  
[https://github.com/Rich-Harris/dts-buddy](https://github.com/Rich-Harris/dts-buddy)  
[https://jsr.io/docs/about-slow-types](https://jsr.io/docs/about-slow-types)  
[https://github.com/microsoft/TypeScript/issues/58944](https://github.com/microsoft/TypeScript/issues/58944)
