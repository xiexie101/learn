---
title: "467 - 《正则 Lookbehind 和 Named Capture Group》"
date: 2024-08-30
url: https://sorrycc.com/lookbehind-and-named-capture-group
---

发布于 2024年8月30日

# 467 - 《正则 Lookbehind 和 Named Capture Group》

1、今天答疑时遇到一例反馈，低概率线上报错，报错信息是「SyntaxError: Invalid regular expression: invalid group specifier name」。

2、ChatGPT 一番，告诉我是浏览器不支持「Named capture groups」，但 [caniuse 了一下](https://caniuse.com/?search=Named%20capture%20groups) 好像不太对，Safari 17 才支持，如果用了这个语法，应该会大量报错才对。而且，Named capture groups Babel 是[支持](https://babeljs.io/docs/babel-plugin-transform-named-capturing-groups-regex)转换为低版本浏览器的用法的，不应该报错才对。所以，Safari 的 Bug，误报？

3、在产物里用关键词「?<=」搜了下，果然有几处，比如 `operator:/[;:?<=>~/@!$%&+\-|^(){}*#]/,punctuation:/[\[\].,]/}}` 。经同事提醒，这是 [Lookbehind](https://caniuse.com/js-regexp-lookbehind)，Safari 16.4 以上才支持，所以报错应该是和这个有关了。而且 [Babel 也处理不了这个](https://github.com/babel/babel/issues/10699#issuecomment-553411564)。

4、遇到了怎么办？如果是源码，只能改正则；如果是依赖，只能换依赖，或者用 patch-package 修改依赖的代码（但不推荐）。

5、所以，这个语法其实是个隐藏炸弹。Babel 等工具处理不了（转不成低版本浏览器支持的语法），然后正常调试开发因为用的高级浏览器所以不会发现问题，然后上线后有用户使用低版本的 iOS 和 Safari（支付宝容器在 iOS 下用系统的 Webview）时就会报错。

6、那我们能做点什么？框架层应尽量避免此类问题上线，由于做不了补丁，看起来只能做报错提示。我想的是检测到这类语法时，如果有对浏览器较低的要求时，给与报错。但检测的方法估计会比较土，因为 ast 里只能拿到正则的原始 pattern，所以得自己用正则或字符串规则区分。

7、那么，Lookbehind 是啥？我之前没了解过，借这个机会学习下。Lookbehind 有两种，(?<=…)（正向）和 (?<!…)（负向）。比如要匹配所有 A 后面出现的数字，可以用 `/(?<=A)\d/g`。

8、既然有 Lookbehind，肯定也有 Lookahead。语法是 `?=…`。比如要匹配 A 前面出现的数字，可以用 `/\d(?=A)/g`。

9、再学习下 Named capture group。Named capture group 允许你为捕获组分配一个名字，这样你可以通过名字来引用这个捕获组，而不是通过数字索引。这在处理复杂的正则表达式时非常有用。语法是 `(?<name>…)`。

比如。

```ts
const text = "Email: example@test.com";
const regex = /(?<username>[^@]+)@(?<domain>[^.]+)\.com/;
const match = text.match(regex);
console.log(match.groups.username); // 输出: 'example'
console.log(match.groups.domain); // 输出: 'test'
```

参考：  
[https://github.com/tc39/proposal-regexp-lookbehind](https://github.com/tc39/proposal-regexp-lookbehind)
