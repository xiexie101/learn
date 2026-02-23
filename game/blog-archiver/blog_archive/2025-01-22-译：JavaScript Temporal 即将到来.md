---
title: "译：JavaScript Temporal 即将到来"
date: 2025-01-22
url: https://sorrycc.com/javascript-temporal-is-coming
---

发布于 2025年1月25日

# 译：JavaScript Temporal 即将到来

> 原文：[https://developer.mozilla.org/en-US/blog/javascript-temporal-is-coming/](https://developer.mozilla.org/en-US/blog/javascript-temporal-is-coming/)  
> 作者：Brian Smith 译者：Claude 3.5 Sonnet

**编者注：JavaScript 终于要迎来新的日期和时间 API 了！这个名为 Temporal 的新特性即将在各大浏览器中落地，它将彻底解决困扰开发者近 30 年的 Date 对象问题。Temporal 提供了全新的 API 设计，支持时区、日历表示、格式化等功能，并提供了 200 多个实用方法。1) 它将日期时间分为 Instant（时间戳）、Duration（时间段）和 wall-clock time（区域时间）三大核心概念。2) 目前 Firefox Nightly 版本已经可以尝鲜，其他浏览器也在积极开发中。3) 如果想提前体验，可以使用官方提供的 polyfill。**

![JavaScript Temporal 即将到来的标题。一个 JavaScript 标志，一个时钟图形和一个带有象征日历和时间的轨道物体的地球仪。](https://developer.mozilla.org/en-US/blog/javascript-temporal-is-coming/featured.png)

新的 JavaScript Temporal 对象的实现已经开始在浏览器的实验版本中发布。这对 Web 开发者来说是一个重大消息，因为在 JavaScript 中处理日期和时间将被大大简化和现代化。

依赖调度、国际化或时间敏感数据的应用程序将能够使用内置功能来高效、精确和一致地处理日期、时间、持续时间和日历。虽然我们离稳定的跨浏览器支持还有很长的路要走，而且随着实现的发展可能会有变化，但我们已经可以看看 Temporal 目前的状态、为什么它令人兴奋以及它解决了哪些问题。

为了帮助你快速上手，本周在 MDN 上新增了超过 [270 页的 Temporal 文档](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)，包含详细的解释和示例。

## [什么是 JavaScript Temporal？](#what_is_javascript_temporal)

要理解 Temporal，我们可以看看 JavaScript 的 `Date` 对象。当 JavaScript 在 1995 年创建时，[`Date`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) 对象是从 Java 早期有缺陷的 `java.util.Date` 实现复制而来的。Java 在 1997 年替换了这个实现，但 JavaScript 在近 30 年里一直沿用着同样的 API，尽管存在已知问题。

JavaScript 的 `Date` 对象的主要问题是它只支持用户的本地时间和 UTC，没有时区支持。此外，它的解析行为非常不可靠，而且 `Date` 本身是可变的，这可能会引入难以追踪的 bug。还有其他问题，比如跨夏令时（DST）的计算和历史日历变更，这些都是出了名的难以处理。

所有这些问题使得在 JavaScript 中处理日期和时间变得复杂且容易出错，这对某些系统可能会产生严重后果。大多数开发者依赖专门的库，如 [Moment.js](https://momentjs.com/) 和 [date-fns](https://date-fns.org/) 来更好地处理应用程序中的日期和时间。

Temporal 被设计为 [`Date`](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) 对象的完整替代品，使日期和时间管理变得可靠和可预测。Temporal 增加了对时区和日历表示的支持，许多内置的转换、比较和计算方法，格式化等功能。API 表面有超过 200 个实用方法，你可以在 [MDN 的 Temporal 文档](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)中找到所有相关信息。

## [核心概念](#core_concepts)

在 Temporal 中，关键概念是它有 instant（历史上的唯一时间点）、wall-clock time（区域时间）和 duration（持续时间）。API 具有以下整体结构来处理这些概念：

*   **Duration**：`Temporal.Duration` 两个时间点之间的差异
*   **时间点**：
    *   **唯一时间点**：
        *   作为时间戳：`Temporal.Instant`
        *   带时区的日期时间：`Temporal.ZonedDateTime`
    *   **与时区无关的日期/时间（“Plain”）**：
        *   完整的日期和时间：`Temporal.PlainDateTime`
            *   仅日期：`Temporal.PlainDate`
                *   年和月：`Temporal.PlainYearMonth`
                *   月和日：`Temporal.PlainMonthDay`
            *   仅时间：`Temporal.PlainTime`
*   **Now**：使用 `Temporal.now` 获取各种类实例的当前时间，或特定格式的时间

## [Temporal 示例](#temporal_examples)

Temporal 最基本的用法包括获取当前日期和时间作为 ISO 字符串，但从下面的示例中我们可以看到，我们现在可以在许多方法中提供时区，这解决了你可能正在自己处理的复杂计算：

```ts
// 系统时区的当前日期
const dateTime = Temporal.Now.plainDateTimeISO();
console.log(dateTime); // 例如：2025-01-22T11:46:36.144

// "America/New_York" 时区的当前日期
const dateTimeInNewYork = Temporal.Now.plainDateTimeISO("America/New_York");
console.log(dateTimeInNewYork);
// 例如：2025-01-22T05:47:02.555
```

处理不同的日历也变得更简单，因为可以在公历以外的日历系统中创建日期，例如希伯来历、农历和伊斯兰历。下面的代码帮助你找出下一个农历新年是什么时候（很快就到了！）：

```ts
// 农历新年是农历的 1/1
const chineseNewYear = Temporal.PlainMonthDay.from({
  monthCode: "M01",
  day: 1,
  calendar: "chinese",
});
const currentYear = Temporal.Now.plainDateISO().withCalendar("chinese").year;
let nextCNY = chineseNewYear.toPlainDate({ year: currentYear });
// 如果 nextCNY 在当前日期之前，向前移动 1 年
if (Temporal.PlainDate.compare(nextCNY, Temporal.Now.plainDateISO()) <= 0) {
  nextCNY = nextCNY.add({ years: 1 });
}
console.log(
  `下一个农历新年是 ${nextCNY.withCalendar("iso8601").toLocaleString()}`,
);
// 下一个农历新年是 2025/1/29（在写作时）
```

处理 Unix 时间戳是一个非常常见的用例，因为许多系统（API、数据库）使用这种格式来表示时间。以下示例展示了如何使用毫秒级 Unix 时间戳创建一个 instant，获取当前时间 `Temporal.Now`，然后计算从现在到该时间戳还有多少小时：

```ts
// 1851222399924 是我们的时间戳
const launch = Temporal.Instant.fromEpochMilliseconds(1851222399924);
const now = Temporal.Now.instant();
const duration = now.until(launch, { smallestUnit: "hour" });
console.log(`距离发射还有 ${duration.toLocaleString("en-US")}`);
// "距离发射还有 31,600 小时" <- @js-temporal/polyfill
// "距离发射还有 PT31600H" <- Firefox Nightly
```

目前，在 Firefox 实现中，`toLocaleString` [不会输出区域敏感的字符串](https://bugzilla.mozilla.org/show_bug.cgi?id=1839694)，因此上面的持续时间（`PT31600H`）会以非区域敏感的[持续时间格式](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration#iso_8601_duration_format)返回。这可能会改变，因为这更多是一个设计决策而不是技术限制，因为[格式化持续时间](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate/since#using_since)是可能的，所以 polyfill 和 Firefox 实现最终可能会趋同。

有很多亮点需要强调，但我认为 API 中一个有趣的模式是 `compare()` 方法，它允许你以优雅和高效的方式[对持续时间进行排序](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration/compare#sorting_an_array_of_durations)：

```ts
const durations = [
  Temporal.Duration.from({ hours: 1 }),
  Temporal.Duration.from({ hours: 2 }),
  Temporal.Duration.from({ hours: 1, minutes: 30 }),
  Temporal.Duration.from({ hours: 1, minutes: 45 }),
];

durations.sort(Temporal.Duration.compare);
console.log(durations.map((d) => d.toString()));
// [ 'PT1H', 'PT1H30M', 'PT1H45M', 'PT2H' ]
```

## [尝试 Temporal 和浏览器支持](#trying_temporal_and_browser_support)

支持正在慢慢地被包含在实验性的浏览器版本中，Firefox 目前似乎有最成熟的实现。在 Firefox 中，Temporal 正在被构建到 [Nightly 版本](https://www.mozilla.org/en-US/firefox/channel/desktop/)中，位于 `javascript.options.experimental.temporal` 首选项后面。如果你想看完整的兼容性情况，可以查看（相当壮观的）[Temporal 对象浏览器兼容性部分](/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal#browser_compatibility)。

以下是跟踪 Temporal 实现的主要浏览器 bug：

*   **Firefox：**[在 Nightly 中默认构建 temporal](https://bugzilla.mozilla.org/show_bug.cgi?id=1912757)
*   **Safari：**[\[JSC\] 实现 Temporal](https://bugs.webkit.org/show_bug.cgi?id=223166)
*   **Chrome：**[实现 Temporal 提案](https://issues.chromium.org/issues/42201538)

此外，你可以访问 [https://tc39.es/proposal-temporal/docs/](https://tc39.es/proposal-temporal/docs/)，那里有 `@js-temporal/polyfill` 可用。这意味着，你可以在 TC39 文档页面上打开开发者工具，在任何浏览器的控制台中尝试一些示例，而无需更改标志或首选项。

随着实验性实现的落地，现在是尝试 Temporal 并熟悉这个将成为 JavaScript 中处理日期和时间的现代方法的好时机。
