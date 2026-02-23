---
title: "486 - 《用 Cursor Docs 学 Volta》"
date: 2024-11-15
url: https://sorrycc.com/cursor-docs-volta
---

发布于 2024年11月15日

# 486 - 《用 Cursor Docs 学 Volta》

刚想到的一种更主动的学不了解的新技术的方法，我拿之前没了解过的 volta 试试，效果还不错。

1、 [https://docs.volta.sh/guide/](https://docs.volta.sh/guide/) 是 volta 的文档。我先把他添加到 Cursor Docs。

![](https://tcc.sorrycc.com/p/0dde70b0-1605-4a0d-8275-1e0af2755a4c.png)

2、然后用 Cursor 的 Chat 提问，注意带上 @Volta 的文档引用。

我问了这些问题。（注：AI 惯有问题，虽然加了文档，但还是有幻觉，有些回答会不准）

```
@Volta 介绍下 Volta。
如何快速上手？
volta 如何与 pnpm 结合使用？
Mac 下如何安装？
有哪些流行库用了 volta？（回答不准）
volta 如何卸载？
```

然后基本上对 Volta 就有了个完整的理解了。

3、Volta 我感觉是 nvm + corepack 。于是卸载 nvm 和手动安装的 pnpm，切换到了 Volta。

```bash
$ curl https://get.volta.sh | bash
$ volta install node@20
$ volta install pnpm@8
```

安装 pnpm 会报错，问了群里的同学，提示要加个环境变量。

```bash
$ export VOLTA_FEATURE_PNPM=1
```

4、同时把他用到 tnf 里。

```bash
$ volta pin node@20
$ volta pin pnpm@8
```

详见 [https://github.com/umijs/tnf/commit/7eba3b4b68811f420625a3e450dbbac211541145](https://github.com/umijs/tnf/commit/7eba3b4b68811f420625a3e450dbbac211541145) 。

参考：  
[https://github.com/volta-cli/volta](https://github.com/volta-cli/volta)
