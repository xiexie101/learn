---
title: "495 - 《TNF 开发笔记 09：react 19、cursorrules、定制 client 入口》"
date: 2024-12-08
url: https://sorrycc.com/tnf-09
---

发布于 2024年12月8日

# 495 - 《TNF 开发笔记 09：react 19、cursorrules、定制 client 入口》

1、default react 19。上周 React 发了 19 正式版，就把 tnf 内置的 react 切到 19 了，但是 19 不少社区库都还不支持，比如 antd，以及 tanstack router 也有一个不必要的 re-render 的问题，所以加了之前 Umi 的一个功能「当用户有安装 react 和 react-dom 时，优先用用户的」。另外，做了一些精细化的检测，比如 react 和 react-dom 大版本不一致时报错，比如 @types/react 和 react 版本不一致时也会报错。

2、.cursorrules。为 tnf 库本身[增加了 .cursorrules](https://github.com/umijs/tnf/commit/81cd57acb2de2d61cea764b9ad0790b6668c3746)，让 cursor 更懂我们的编码习惯。比如写用例时，1）基于 vitest，2）用 test() 平铺组织用例，而不是用 describe() + it()。加上这些之后，用 cursor 时可以少很多往复。所以，如果你重度用 cursor，建议花时间写下 .cursorrules，把自己的编码习惯和最佳实践写写进去。

3、e2e with vitest。[改用 vitest 来组织 e2e 用例](https://github.com/umijs/tnf/commit/3192f85124054366f30702e7883320b58e4c1258)。原来的比较挫。

4、Instagram 风 ascii tnf 标题。看到 cali 有这个，[就加了试试](https://github.com/umijs/tnf/commit/9dba7828875f0124edfaa0615d47ddeed19d044a)，效果见下图。方法是用 [gradient-string](https://github.com/bokub/gradient-string)，里面支持[各种风格](https://github.com/bokub/gradient-string/blob/efc1a61/src/index.ts#L46-L70)。遇到一个问题是，目前 tnf 还是 cjs 组织的，而 gradient-string 是 esm 的，所以得 compile 一下。于是也加了个 compile 脚本，用的 mako，类型部分先简单复制搞定。

![](https://tcc.sorrycc.com/p/9dedaeaf-5f5e-46ae-b805-d3cc172d85a6.png)

5、mock.delay。mock 通常有 delay 需求，所以增加了通用的 delay 配置。同时通常还有随机 delay 时间的需求，所以支持了范围。[见 PR](https://github.com/umijs/tnf/pull/73)。

```ts
export default {
  mock: { delay: 1000 },
  mock: { delay: '500-1000' },
}
```

6、[支持 src/client.tsx 定制入口文件。](https://github.com/umijs/tnf/commit/7c711fb4f3d98e199161ec17c3db7afbe94db618)定制有两种风格，1）挖坑，然后让用户填，Umi 之前的 app.ts 运行时插件就是这种，比如用户可以 export rootContainer 来修改根节点，2）提供元素，让用户自己组装。tnf 选的是后者，用户可以在 src/client.tsx 里写自己的入口逻辑，tnf 提供了路由、渲染组件等，用户可以用，也可以不用。做这个功能的出发点是，tnf-ant-design-pro 的需求无法通过配置完成，比如需要定制默认的 pending component，于是就加了这个功能。

7、react-scan。[支持配置开启](https://github.com/umijs/tnf/commit/30badfe21a87fc2db465b2eebf15d9a04e6c9ada#diff-e7de3d9b0b2f9575c859f5653d9a93200b0fa1bf54c696f7cc6034d1f98964dfR18)，让用户可以检查 React 代码潜在的性能问题。tnf 主打性能，所以和性能相关的功能都会优先支持。方案本身很简单，html 里加个前置的 script 就好了。注：react-scan 的支持是用插件的方式来组织代码的。

```ts
export default {
  reactScan: {}
}
```
