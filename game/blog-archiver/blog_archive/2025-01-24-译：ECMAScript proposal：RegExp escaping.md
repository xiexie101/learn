---
title: "译：ECMAScript proposal：RegExp escaping"
date: 2025-01-24
url: https://sorrycc.com/regexp-escape
---

发布于 2025年1月24日

# 译：ECMAScript proposal：RegExp escaping

> 原文：[https://2ality.com/2025/01/regexp-escape.html](https://2ality.com/2025/01/regexp-escape.html)  
> 作者：Dr. Axel  
> 译者：ChatGPT 4 Turbo

ECMAScript 提案 [“RegExp escaping”](https://github.com/tc39/proposal-regex-escaping)（由 Jordan Harband 和 Kevin Gibbons 提出）规定了一个函数 `RegExp.escape()`，该函数接受一个字符串 `text`，创建一个转义版本，如果被解释为正则表达式，则匹配 `text`。

该提案目前处于第 3 阶段。

*   [如何使用 `RegExp.escape()`？](#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-regexp.escape\(\)%3F)
*   [`RegExp.escape()` 的使用场景是什么？](#%60regexp.escape\(\)%60-%E7%9A%84%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF%E6%98%AF%E4%BB%80%E4%B9%88%3F)
    *   [示例：替换所有出现的文本](#%E7%A4%BA%E4%BE%8B%3A-%E6%9B%BF%E6%8D%A2%E6%89%80%E6%9C%89%E5%87%BA%E7%8E%B0%E7%9A%84%E6%96%87%E6%9C%AC)
    *   [示例：正则表达式的一部分必须匹配给定的文本](#%E7%A4%BA%E4%BE%8B%3A-%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F%E7%9A%84%E4%B8%80%E9%83%A8%E5%88%86%E5%BF%85%E9%A1%BB%E5%8C%B9%E9%85%8D%E7%BB%99%E5%AE%9A%E7%9A%84%E6%96%87%E6%9C%AC)
*   [转义的考虑因素](#%E8%BD%AC%E4%B9%89%E7%9A%84%E8%80%83%E8%99%91%E5%9B%A0%E7%B4%A0)
    *   [转义必须适用于所有标志](#%E8%BD%AC%E4%B9%89%E5%BF%85%E9%A1%BB%E9%80%82%E7%94%A8%E4%BA%8E%E6%89%80%E6%9C%89%E6%A0%87%E5%BF%97)
    *   [转义必须在所有语法上下文中有效](#%E8%BD%AC%E4%B9%89%E5%BF%85%E9%A1%BB%E5%9C%A8%E6%89%80%E6%9C%89%E8%AF%AD%E6%B3%95%E4%B8%8A%E4%B8%8B%E6%96%87%E4%B8%AD%E6%9C%89%E6%95%88)
    *   [无论转义文本之前或之后是什么语法，转义都必须有效](#%E6%97%A0%E8%AE%BA%E8%BD%AC%E4%B9%89%E6%96%87%E6%9C%AC%E4%B9%8B%E5%89%8D%E6%88%96%E4%B9%8B%E5%90%8E%E6%98%AF%E4%BB%80%E4%B9%88%E8%AF%AD%E6%B3%95%EF%BC%8C%E8%BD%AC%E4%B9%89%E9%83%BD%E5%BF%85%E9%A1%BB%E6%9C%89%E6%95%88)
*   [`RegExp.escape()` 的实现](#%60regexp.escape\(\)%60-%E7%9A%84%E5%AE%9E%E7%8E%B0)
*   [进一步阅读](#%E8%BF%9B%E4%B8%80%E6%AD%A5%E9%98%85%E8%AF%BB)

## 如何使用 `RegExp.escape()`？  [#](#%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-regexp.escape\(\)%3F)

对于字符串 `text`，`RegExp.escape(text)` 创建一个正则表达式模式，匹配 `text`。

在正则表达式中具有特殊含义的字符不能直接使用，必须进行转义：

```
> RegExp.escape('(*)')
'\\(\\*\\)'
```

注意，我们看到每个正则表达式的反斜杠都出现了两次：其中一个是实际的反斜杠，另一个在字符串字面量中对它进行了转义：

```
> '\\(\\*\\)' === String.raw`\(\*\)`
true
```

没有特殊含义的字符不必进行转义：

> RegExp.escape(‘\_abc123’) ‘\_abc123’

````

## `RegExp.escape()` 的使用场景是什么？  [#](#what-are-the-use-cases-for-regexp.escape()%3F)

### 示例：替换文本中的所有出现  [#](#example%3A-replacing-all-occurrences-of-a-text)

转义的经典用例是搜索和替换文本：

```js
function replacePlainText(str, searchText, replace) {
  const searchRegExp = new RegExp(
    RegExp.escape(searchText),
    'gu'
  );
  return str.replace(searchRegExp, replace)
}
assert.equal(
  replacePlainText('(a) and (a)', '(a)', '@'),
  '@ and @'
);
````

然而，自 ES2021 起，我们有了 [`.replaceAll()`](https://exploringjs.com/js/book/ch_regexps.html#String.prototype.replaceAll)：

```js
assert.equal(
  '(a) and (a)'.replaceAll('(a)', '@'),
  '@ and @'
);
```

### 示例：正则表达式的一部分必须匹配给定文本  [#](#example%3A-part-of-a-regular-expression-must-match-a-given-text)

```js
function removeUnquotedText(str, text) {
  const regExp = new RegExp(
    `(?<!“)${RegExp.escape(text)}(?!”)`,
    'gu'
  );
  return str.replaceAll(regExp, '•');
}
assert.equal(
  removeUnquotedText('“yes” and yes and “yes”', 'yes'),
  '“yes” and • and “yes”'
);
```

同样的方法也可以用来查找或计数未引用的文本。

## 转义的考虑因素  [#](#considerations-for-escaping)

由 `RegExp.escape()` 返回的任何给定模式可能会存在很长时间。因此，重要的是未来的正则表达式特性不会阻止模式的工作。这就是为什么 `RegExp.escape()` 不仅仅转义今天作为特殊语法使用的标点字符，也转义将来可能成为语法的字符。

此外，转义后的文本应该始终有效：无论哪些标志处于活动状态，无论它被插入到哪里。接下来我们将探讨这如何影响 `RegExp.escape()` 的输出。

### 转义必须适用于所有标志  [#](#escaping-must-work-for-all-flags)

一个有趣的例子是即将到来的 [标志 `/x`](https://github.com/tc39/proposal-regexp-x-mode)，它会忽略未转义的空白。因此，必须转义空白：

```markdown
原文：[链接]
作者：[作者名]
译者：[译者名]

我们希望转义字符尽可能短。遗憾的是，我们不能使用通过 [标志 `/u` 和 `/v`](https://exploringjs.com/js/book/ch_regexps.html#reg-exp-flags) 启用的任何特性。这让我们只能使用：

- 以下转义处理了一些空白和行终止符字符（我们很快会看到后者为什么必须被转义）：

    ```ts
    \t \n \v \f \r
    ```

- 对于 Unicode 码点直到 0xFF，我们可以使用（ASCII）十六进制转义——例如：`\x41` 匹配 `A`。
    
- 对于 Unicode 码点直到 0xFFFF，我们可以使用 Unicode 码元转义——例如：`\u2028` 匹配 Unicode 字符 LINE SEPARATOR。
    
- 对于更高的码点，我们不能使用码点转义，如 `\u{1F44D}`，因为这些只在标志 `/u` 或 `/v` 下支持。我们必须使用两个码元转义。目前这不是必需的，但将来，我们可能需要转义基本多文种平面之外的字符。

### 转义必须在所有句法上下文中工作  [#](#escaping-must-work-in-all-syntactic-contexts)

在正则表达式中，可以有许多“上下文”（想象嵌套的作用域）——例如：

- 在顶层，语法字符如 `*` 和 `$` 必须被转义，如果我们想匹配它们。
- 在字符类中（如 `[abc]`）：
    - 许多顶层语法不必被转义——例如 `*` 和 `$`。
    - 一些其他语法必须被转义——例如 `-`（连字符）。
    - 在标志 `/v` 下，几个双标点符号必须被转义——例如 `&&` 和 `--`。这是通过转义两个字符来完成的。
- 类字符串分离 `\q{}` 是另一个上下文。在字符类内部，它向类添加一个或多个码点序列。

转义的后果：

- 即将到来的 [标志 `/x`](https://github.com/tc39/proposal-regexp-x-mode) 通过 `#` 支持行注释（即，一个新的上下文）。因此，行终止符必须被转义（实际的换行变成转义的换行）：

```

````
> RegExp.escape('\n')
'\\n'
```
````

````

```markdown
原文：The following characters are RegExp top-level syntax and can be escaped with a backslash:
作者：未知
译者：未知

以下字符是 RegExp 顶级语法，可以用反斜杠转义：

```ts
^ $ \ . * + ? ( ) [ ] { } |
````

示例：

```
> RegExp.escape('$')
'\\$'
```

*   其他标点字符仅在某些上下文中是语法——无论是现在还是将来可能。然而，如果标志包括 `/u` 或 `/v`，大多数情况下不能用反斜杠转义。因此，在这些情况下，转义使用十六进制转义（这比 Unicode 代码单元转义要短）。

```ts
, - = < > # & ! % : ; @ ~ ' ` "
```

示例：

```
> RegExp.escape('=>')
'\\x3d\\x3e'
```

### 无论转义文本之前或之后是什么语法，转义都必须工作  [#](#escaping-must-work-whatever-syntax-precedes-or-succeeds-the-escaped-text)

有些正则表达式是这样构造的：

```js
new RegExp('<regex pattern>' + RegExp.escape(text))
```

我们不希望 `RegExp.escape()` 的结果影响它之前的正则表达式模式：

*   `\0` 表示 NULL 字符（U+0000），且不能跟随一个十进制数字。这就是为什么初始十进制数字被转义的原因：
    
    ```
    > RegExp.escape('123')
    '\\x3123'
    ```
    
*   `\1`、`\2` 等是对编号捕获组的反向引用。一个转义文本不应该向它们添加十进制数字——这通过转义初始十进制数字来处理（见前一项）。
    
*   控制字符可以这样表示：`\cA`（Ctrl-A）、…、`\cZ`（Ctrl-Z）。然而，`\c` 也可以单独使用——在这种情况下，它被按字面意义解释（[来源](https://tc39.es/ecma262/#sec-compiletocharset-annexb)）。因此，一个转义文本不应该以 ASCII 字母开头：
    
    ```
    > RegExp.escape('abc')
    '\\x61bc'
    ```
    
*   标志 `/u` 和 `/v` 将代理对作为单位处理。因此，我们必须转义孤立的代理，以便它们不会在正则表达式模式中与前面或后面的孤立代理组合。
    

## `RegExp.escape()` 的实现方式

*   各个 JavaScript 平台的支持情况：[参见 MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape#browser_compatibility)
*   Jordan Harband 在 npm 上的 [Polyfill](https://www.npmjs.com/package/regexp.escape)
*   我为了纯教育目的编写了[一个实现](https://gist.github.com/rauschma/63b824c69a45900abbd09f7d12b895f4#file-regexp-escape-mjs) —— 即，它的重点是可读性，而不是实际的用途。
