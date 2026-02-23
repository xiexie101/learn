---
title: "224 - 《CSS 新特性：Layers、嵌套、Scoped、has 伪类》"
date: 2022-12-01
url: https://sorrycc.com/css-new-features-2022
---

发布于 2022年12月2日

# 224 - 《CSS 新特性：Layers、嵌套、Scoped、has 伪类》

本文是基于 [https://www.bram.us/2022/12/02/css-architecture-2022-12-01-web-directions-summit/](https://www.bram.us/2022/12/02/css-architecture-2022-12-01-web-directions-summit/) 做的笔记。

## CSS Layers

![](https://image-1256177414.cos.ap-shanghai.myqcloud.com/picgo/20221202091829.png)

CSS Layers 比「Specificity」优先级更高。使用 CSS Layers ，你可以将样式分割成若干层，并控制每层的优先级。支持的浏览器是 Chrome 99、Edge 99、Firefox 97、Safari 15.4。

```css
/* 声明优先顺序 */
@layer reset, thirdparty; base, components;
/* 支持外部 @import */
@import url(map.css) @layer thirdparty;
@import url(carousel.css) @layer thirdparty;
@layer reset {}
@layer base {}
@layer components {}
```

## CSS 嵌套

兼容情况是，Chrome 109 和 Edge 109 支持，Firefox 和 Safari 目前不支持。语法目前仍在讨论，目前最新的 proposal 5 是基于 & 语法。

```css
.foo {
  & .bar { color: red; }
}
```

## Scoped Style

先来个题，问：以下代码中，foo、bar 和 hoo 的 color 和 background 分别是啥？

```html
<style>
.light { background: #ccc; /*浅灰*/ }
.dark  { background: #333; /*深灰*/ }
.light a { color: red; }
.dark a { color: yellow; }
</style>

<div class="light">
  <p><a href="">foo</a></p>
  <div class="dark">
    <p><a href="">bar</a></p>
    <div class="light">
      <p><a href="">hoo</a></p>
    </div>
  </div>
</div>
```

答案可能会出乎你的预料。hoo 的 color 是 yellow。因为优先级相同，而 .dark a 后出现，所以是 yellow。

通过 scope 可以解上面的问题，

```css
@scope (.light) {
  :scope { background: #ccc; }
  a { color: red; }
}
@scope (.dark) {
  :scope { background: #333; }
  a { color: yellow; }
}
```

或者用 `>>` 操作符。

```css
.light >> a { color: red; }
.dark >> a { color: yellow; }
```

![](https://image-1256177414.cos.ap-shanghai.myqcloud.com/uPic/MHUtBN.png)

其优先级比「Order of Appearance」（出现顺序）要高。目前兼容情况是，Chrome 104 和 Edge 104 支持，Firefox 和 Safari 目前不支持。

## :has 伪类

目前兼容情况是，Chrome 105、Edge 105、Firefox 103、Safari 15.4。之前介绍过很多遍了，不展开。

## 参考

[https://www.bram.us/2022/12/02/css-architecture-2022-12-01-web-directions-summit/](https://www.bram.us/2022/12/02/css-architecture-2022-12-01-web-directions-summit/)  
[https://drafts.csswg.org/css-cascade-6/](https://drafts.csswg.org/css-cascade-6/)  
[https://www.bram.us/2021/09/15/the-future-of-css-cascade-layers-css-at-layer/](https://www.bram.us/2021/09/15/the-future-of-css-cascade-layers-css-at-layer/)  
[https://github.com/w3c/csswg-drafts/blob/main/css-nesting-1/proposals.md](https://github.com/w3c/csswg-drafts/blob/main/css-nesting-1/proposals.md)  
[https://www.bram.us/2019/03/17/the-future-of-css-nesting-selectors/](https://www.bram.us/2019/03/17/the-future-of-css-nesting-selectors/)
