---
title: "译：使用 LLMs 反转 JavaScript 变量名压缩"
date: 2024-10-20
url: https://sorrycc.com/using-llms-to-reverse-javascript-minification
---

发布于 2024年10月20日

# 译：使用 LLMs 反转 JavaScript 变量名压缩

> 原文：[https://thejunkland.com/blog/using-llms-to-reverse-javascript-minification](https://thejunkland.com/blog/using-llms-to-reverse-javascript-minification)  
> 作者：Jesse Luoto  
> 译者：ChatGPT 4 Turbo

本博客介绍了一种使用大型语言模型（LLMs）如 ChatGPT 和 llama2 反向压缩 JavaScript 的新颖方法，同时保持代码的语义完整。代码是开源的，可在 [Github 项目 Humanify](https://github.com/jehna/humanify) 上找到。

## 什么是压缩？

压缩是一种减少 JavaScript 文件大小的过程，以便优化快速网络传输。从逆向工程的角度看，存在几种不同类别的压缩，它们呈现出越来越大的挑战：

### 无损压缩

大多数压缩是无损的；当 `true` 被转换为其压缩替代品 `!0` 时，没有数据丢失。直接[编写一个 Babel 转换](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)来逆转这个过程是很简单的。有[很多](https://www.npmjs.com/package/babel-plugin-transform-beautifier) [工具](https://www.npmjs.com/package/debundle)专门设计来逆转这类无损转换。

### 不重要的数据丢失

在压缩过程中有些数据会丢失，但这些数据可能很容易重新创建。一个很好的例子是空白符；使用 [Prettier](https://prettier.io)（或类似工具）重新格式化压缩代码的缩进和空白符至人类可读格式是很简单的。大多数时候，开发者也用类似的工具处理原始代码，所以空白符数据可以高度信心地被重新创建。

### 变量名

在压缩过程中丢失的最重要信息是变量和函数名的丢失。当你运行一个压缩器时，它完全替换所有可能的变量和函数名以节省字节。

直到现在，还没有任何好的方法来逆转这个过程；当你把一个变量从 `crossProduct` 重命名为 `a` 时，你没办法逆转这个过程。

## 如何手动逆向代码压缩？

许多逆向工程师通过训练他们的眼睛识别代码上下文中的一些启发式规则，从而对代码的目的做出有根据的猜测。让我们来看一个简单的例子：

```ts
function a(b) {
  return b * b;
}
```

你会如何重命名函数 `a`？根据上下文，我们可以相当肯定地猜测原来的名字可能像 `square`。但这需要了解函数的内部工作原理。

让我们尝试将重命名函数的过程具体化：

1.  阅读函数的主体
2.  描述函数的作用
3.  尝试想出一个符合该描述的名称

对于一个经典的计算机程序来说，从“将 `b` 与其自身相乘”到“求一个数的平方”这个跳跃会非常困难。幸运的是，最近在大型语言模型（LLMs）方面的进步不仅使这种跳跃成为可能，而且几乎变得微不足道。

基本上第2步称为“改述”（或者如果你认为 Javascript 是其自然语言的话，那么就是“翻译”），而 LLMs 在这方面被认为是非常擅长的。

LLMs 真正擅长的另一个任务是摘要，这几乎就是我们在第3步中所做的。唯一的专业化要求是输出需要足够简短，并格式化为驼峰式大小写。

## 控制 LLMs

使用 LLMs 输出的问题在于它们不是确定性的。简而言之，LLM 是一个非常复杂的马尔可夫链；它尽力根据前面的词来猜测文本中的下一个词。

这意味着即使我们有一个好的提示，比如：

```ts
Are all roses red? Please answer only "Yes" or "No".
```

LLM 仍可能回答 “No, but …”、“I don’t know” 或者著名的 “I’m sorry, but as an AI language model I cannot…”.

这曾是一个问题，但幸运的是现在有方法可以控制 LLM 的输出，如 [guidance](https://guidance.readthedocs.io/) 和 [outlines](https://github.com/normal-computing/outlines)。这些工具使用不同的技术确保 LLM 的输出符合期望的格式。

幸运的是，Javascript 变量只能有特定的格式，所以可以通过正则表达式匹配输出，以确保输出是一个有效的 Javascript 变量名。

## 不要让 AI 触碰代码

现在，尽管 LLM 在重新措辞和总结方面非常擅长，但它们在编码方面还不够好（至少目前如此）。它们有固有的随机性，这使得它们不适合执行实际的重命名和修改代码。

幸运的是，使用传统工具（如 Babel）在其作用域内重命名 Javascript 变量是一个已解决的问题。Babel 首先将代码解析成一个抽象语法树（AST，代码的机器表示形式），这很容易使用行为良好的算法进行修改。

这比让 LLM 在文本级别修改代码要好得多；它确保只执行非常特定的转换，所以代码的功能在重命名后不会改变。代码保证具有原来的功能，并且可以由计算机运行。

## 整合一切

那么，我们如何反混淆 Javascript 呢？让我们整合一切：

1.  使用 [webcrack](https://github.com/j4k0xb/webcrack) 解包 webpack 包
2.  通过 [transform-beautifier](https://www.npmjs.com/package/babel-plugin-transform-beautifier) 和一些自定义的 Babel 插件运行代码，这些插件可以逆转无损压缩
3.  遍历代码中的所有变量，请求 LLM 描述其意图并根据该描述生成更好的名称
4.  使用 Babel 重命名变量
5.  进行最后一轮的 [Prettier](https://prettier.io/) 以确保优美的空格

就是这样！给定以下代码：

```ts
function a(e,t){var n=[];var r=e.length;var i=0;for(;i<r;i+=t){if(i+t<r){n.push(e.substring(i,i+t))}else{n.push(e.substring(i,r))}}return n}
```

工具输出如下：

```ts
function chunkedString(inputStringToBeSliced, chunk) {
  var chunkBuffer = [];
  var sliceSize = inputStringToBeSliced.length;
  var currentCharIndex = 0;
  for (; currentCharIndex < sliceSize; currentCharIndex += chunk) {
    if (currentCharIndex + chunk < sliceSize) {
      chunkBuffer.push(
        inputStringToBeSliced.substring(
          currentCharIndex,
          currentCharIndex + chunk
        )
      );
    } else {
      chunkBuffer.push(
        inputStringToBeSliced.substring(currentCharIndex, sliceSize)
      );
    }
  }
  return chunkBuffer;
}
```

## 亲自尝试一下！

这个工具叫 [Humanify，它可以在 Github 上找到](https://github.com/jehna/humanify)。快去看看它是否适合你吧！
