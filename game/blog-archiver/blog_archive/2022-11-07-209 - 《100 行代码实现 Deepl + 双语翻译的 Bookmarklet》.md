---
title: "209 - 《100 行代码实现 Deepl + 双语翻译的 Bookmarklet》"
date: 2022-11-07
url: https://sorrycc.com/translate-bookmarklet
---

发布于 2022年11月7日

# 209 - 《100 行代码实现 Deepl + 双语翻译的 Bookmarklet》

周末看到一个插件 [https://github.com/theowenyoung/Traduzir-paginas-web](https://github.com/theowenyoung/Traduzir-paginas-web) ，可以实现中英双语的对照翻译效果。但是，全文翻译只支持 Google 和 Yandex，翻译效果不好，同时翻了下代码不好接 DeepL，于是准备手写一个。

效果见图。

![](https://img.alicdn.com/imgextra/i2/O1CN01OdKBhb1tPVKx1Rn49_!!6000000005894-1-tps-1265-606.gif)

如何实现？整理了下分几步。

1、找到正文节点  
2、找到正文下所有 block 类型的子节点  
3、往节点数组里额外加上标题节点  
4、翻译节点文本  
5、复制节点并插入翻译后文本

代码我传到 gist 了，见 [https://gist.github.com/sorrycc/10f67ac688dce5301d8a690d8143882a](https://gist.github.com/sorrycc/10f67ac688dce5301d8a690d8143882a) 。（可以看个思路，具体用起来需要有 deepl api server，有些成本的）

唯一有点技术含量的就是找正文节点的逻辑了，是这样。1）先找文本数最多的 P 节点，2）然后往上找到包含整体页面 40%（这个系数可以调） 以上文本数的节点，3）如果是 P 标签，往上找一级。

最后我临时是先把他转成了 Bookmarklet 使用。方法是，1）先用 [https://mrcoles.com/bookmarklet/](https://mrcoles.com/bookmarklet/) 压缩，因为可能有奇怪语法，2）再用 [https://mrcoles.com/bookmarklet/](https://mrcoles.com/bookmarklet/) 转 Bookmarklet 。

一些 TODO：

1、支持 twitter、hackernews、reddit 等非文章类网站的标题翻译  
2、用 observer 支持新增节点，适用于 twitter 滚动刷新的特点  
3、排序，前面的先翻译  
4、实现 Chrome 插件，用 Bookmarklet 在比如 Github 网站里会有跨域问题，或者用油猴脚本实现  
5、去重，比如 p 在 li 里面，那 p 不应该被加到 node 里（往上找到 container 为止）（另一个思路：排除掉 li 里的 p）

参考：  
[https://github.com/theowenyoung/Traduzir-paginas-web](https://github.com/theowenyoung/Traduzir-paginas-web)  
[https://github.com/theowenyoung/Traduzir-paginas-web/blob/0c272265e7134cc621143d7ec0c684c9eb152440/src/contentScript/enhance.js#L277](https://github.com/theowenyoung/Traduzir-paginas-web/blob/0c272265e7134cc621143d7ec0c684c9eb152440/src/contentScript/enhance.js#L277)  
[https://try.terser.org/](https://try.terser.org/)  
[https://mrcoles.com/bookmarklet/](https://mrcoles.com/bookmarklet/)  
[https://gist.github.com/sorrycc/10f67ac688dce5301d8a690d8143882a](https://gist.github.com/sorrycc/10f67ac688dce5301d8a690d8143882a)
