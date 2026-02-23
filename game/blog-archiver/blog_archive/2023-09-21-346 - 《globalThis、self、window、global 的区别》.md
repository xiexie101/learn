---
title: "346 - 《globalThis、self、window、global 的区别》"
date: 2023-09-21
url: https://sorrycc.com/global-this-self-window-global
---

发布于 2023年9月21日

# 346 - 《globalThis、self、window、global 的区别》

1、这几个都代表全局对象，但是很容易搞混，下午在 Review PR 时也发现有用地不合适的场景。

2、大家可能都清楚的是，window 是跑在浏览器里的，global 是跑在 node 下的。

3、window 和 self 啥区别？self 也是跑在浏览器里的，那啥时用 self，啥时候用 window 呢？一个场景是在 worker 里时是拿不到 window 的，所以在浏览器的场景下应该用 self 而不是 window。

4、globalThis 是在 ECMAScript 2020 中被引入，可以在任何环境中被使用，包括 node 和 browser 。但他有个问题是兼容性，详见 [https://caniuse.com/?search=globalThis](https://caniuse.com/?search=globalThis) ，比如 ie11、chrome70、node11 等就不支持，如果有兼容需求，就需要用三元表达式做下兼容。

```ts
const globalObject = typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof global !== 'undefined' ? global : {};
```

5、所以，以上 4 个，哪个完全没用？window。
