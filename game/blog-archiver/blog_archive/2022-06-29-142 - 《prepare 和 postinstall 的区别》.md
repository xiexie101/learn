---
title: "142 - 《prepare 和 postinstall 的区别》"
date: 2022-06-29
url: https://sorrycc.com/prepare-vs-postinstall
---

发布于 2022年6月29日

# 142 - 《prepare 和 postinstall 的区别》

这是今天给 umi 脚手架[添加 husky + precommit 功能](https://github.com/umijs/umi/pull/8306)时新学到的小知识点。

我们经常会在 package.json 中的 scripts 里看到 prepare 和 postinstall。他们都会在你执行 npm install 时执行，那到底有何区别？

```json
{  
 "scripts": {
   "prepare": "husky install",
   "postinstall": "umi setup"
 }
}
```

如果你的场景是项目开发，没有区别，用哪个都可以；如果是 npm 包研发，就需要注意，当有人通过 npm install YOUR\_PACKAGE 安装你的 npm 包时，postinstall 会执行，而 prepare 不会执行。

所以，类似 husky install 这种本地开发环境配置的应该写在 prepare 里，而如果你要发个广告，应该写 postinstall 里。

参考：  
[https://github.com/typicode/husky/issues/884](https://github.com/typicode/husky/issues/884)
