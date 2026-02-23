---
title: "479 - 《TNF 开发笔记 03：import order、dev、fishkit、pathe、father doctor》"
date: 2024-11-03
url: https://sorrycc.com/tnf-03
---

发布于 2024年11月3日

# 479 - 《TNF 开发笔记 03：import order、dev、fishkit、pathe、father doctor》

1、import 排序我是喜欢的，因为可以增加项目一致性，减少个人喜好带来的不必要冲突。但也有人不喜欢，之前在内部框架默认加上之后，有不少同学要求禁用。所以在 TNF 里也加了下，方法是用 @trivago/prettier-plugin-sort-imports。除了做 import 的排序，这次发现了两件事，1）可以定制 import 顺序的规则，2）specifier 也可以自动排序，默认关闭。

```json
{
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: [
    '^react',
    '^@?\\w',
    '^@/',
    '^[./]'
  ],
  importOrderSortSpecifiers: true,
}
```

2、TNF 的 dev = build + watch + dev server。dev server 是基于 express，然后加上 cors、mako proxy、history api fallback、https、port detect 等功能。当然，dev 还有缺失很多功能，mock、proxy、middleware 等。以及 watch 也还需要做很多细致的活。

3、提了一个 Fishkit，这是内部想要做的一个方案。因为蚂蚁有多个框架，都是以 Fish 结尾。现在想着统一各个框架，就想了一个 Fishkit 的方案，为多条鱼（框架）提供一个做框架的 SDK。类似 [https://unjs.io/](https://unjs.io/) 或 [https://github.com/nksaraf/vinxi](https://github.com/nksaraf/vinxi) 的定位，会包含做框架时需要用到的通用方案。

4、pathe 替换 path 可以解 windows 的路径问题，所以全部用到 path 的地方就无脑替换为 pathe 了。

5、感谢 father doctor 救我一命，少了一个 cors 依赖，见 [https://github.com/umijs/tnf/commit/7d9bbb2fd6ce56c1041eb4ef050fd5a73d6f986a](https://github.com/umijs/tnf/commit/7d9bbb2fd6ce56c1041eb4ef050fd5a73d6f986a) 。

6、这次用 [picocolors](https://github.com/alexeyraspopov/picocolors) 代替 chalk 来做颜色处理，据说更快更小。

参考：  
[https://github.com/umijs/tnf](https://github.com/umijs/tnf)
