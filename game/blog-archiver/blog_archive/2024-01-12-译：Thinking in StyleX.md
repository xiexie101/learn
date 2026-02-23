---
title: "译：Thinking in StyleX"
date: 2024-01-12
url: https://sorrycc.com/thinking-in-stylex
---

发布于 2024年1月12日

# 译：Thinking in StyleX

> 原文：[https://stylexjs.com/docs/learn/thinking-in-stylex/](https://stylexjs.com/docs/learn/thinking-in-stylex/)  
> 译者：ChatGPT 4 Turbo

## 核心原则

为了理解 StyleX 的存在意义以及其决策背后的逻辑，熟悉指导它的基本原则可能会有所帮助。这可能会帮助你决定 StyleX 是否适合你。

这些原则在为 StyleX 设计新的 API 时也应该很有帮助。

### Co-location

编写 DRY 代码有其好处，但我们认为在编写样式时这通常不适用。编写样式最好且最易读的方式是将它们与 Html 标记写在同一个文件中。

StyleX 设计用于本地创作、应用和推理样式。

### 确定性解析

CSS 是一种功能强大且表现力丰富的语言。然而，它有时会显得脆弱。这有一部分是因为对 CSS 工作原理的误解，但很大一部分是因为需要纪律和组织来防止具有不同特异性的 CSS 选择器发生冲突。

大多数现有的解决方案依赖于规则和惯例。

> BEM 和 OOCSS 约定  
> BEM 和 OOCSS 引入了命名约定来避免这些问题，依赖于开发者始终遵循规则，经常完全避免合并样式。这可能会导致 CSS 变得臃肿。

> 实用类  
> 像 Tailwind CSS 和 Tachyons 这样的原子化工具类名依赖于约定和 lint 规则来确保不会在同一元素上应用冲突的类名。这样的工具在样式的应用位置和方式上增加了约束，对样式的架构施加了限制。

StyleX 旨在通过构建工具提高样式的一致性和可预测性以及可用的表现力。我们相信这是可能的。

StyleX 提供了一个完全可预测且确定性的样式系统，可以跨文件工作。它在合并多个选择器时不仅产生确定性结果，而且在合并多个简写和完整属性时也是如此（例如 `margin` 对比 `margin-top` ）。

> “最后应用的样式始终生效。”

### 低成本抽象

在谈到 StyleX 的性能成本时，我们的指导原则是 StyleX 应该始终是实现特定模式的最快方式。常见模式不应有运行时成本，高级模式应尽可能快。我们做出了在构建时做更多工作以提高运行时性能的权衡。

在实践中，这是如何发挥作用的：

#### 1\. 本地创建并应用的样式

在同一个文件中编写和使用样式时，StyleX 的成本为零。这是因为除了编译消除 `stylex.create` 调用外，StyleX 在可能的情况下也会编译消除 `stylex.props` 调用。

So,

```ts
import * as stylex from "stylex";
const styles = stylex.create({ red: { color: "red" } });
let a = stylex.props(styles.red);
```

编译为：

*   JS 输出

```ts
import * as stylex from "stylex";
let a = { className: "x1e2nbdu" };
```

*   CSS 输出

```css
.x1e2nbdu { color: red; }
```

这里没有运行时开销。

#### 2\. 使用跨文件的样式

跨文件边界传递样式会因增加的功能和表达力而产生一点成本。 `stylex.create` 调用并没有完全删除，而是留下了一个将键映射到类名的对象。而 `stylex.props()` 调用则在运行时执行。

例如，这段代码：

```tsx
import * as stylex from "@stylexjs/stylex";
const styles = stylex.create({
  foo: { color: "red" },
  bar: { backgroundColor: "blue" },
});
function MyComponent({ style }) {
  return <div {...stylex.props(styles.foo, styles.bar, style)} />;
}
```

编译为：

*   JS 输出

```tsx
import * as stylex from "@stylexjs/stylex";
const styles = {
  foo: { color: "x1e2nbdu", $$css: true },
  bar: { backgroundColor: "x1t391ir", $$css: true },
};
function MyComponent({ style }) {
  return <div {...stylex.props(styles.foo, styles.bar, style)} />;
}
```

*   CSS 输出

```css
.x1e2nbdu { color: red; }
.x1t391ir { background-color: blue; }
```

这段代码稍微多了一些，但是由于 `stylex.props()` 函数的执行速度非常快，所以运行时的成本仍然很小。

大多数其他样式解决方案不支持跨文件边界的样式组合。当前的最佳实践是组合类名列表。

### 尽可能少的 API

我们的目标是使 StyleX 尽可能简约且易于学习。因此，我们不想发明太多的 API。相反，我们希望尽可能依靠常见的 JavaScript 模式，并提供尽可能少的 API。

在其核心，StyleX 可以归结为两个功能：

1.  `stylex.create`
2.  `stylex.props`

`stylex.create` 用于创建样式， `stylex.props` 用于将这些样式应用到一个元素上。

在这两个函数中，我们选择依赖常见的 JS 模式，而不是为 StyleX 引入独特的 API 或模式。例如，我们没有用于条件样式的 API。相反，我们支持使用布尔值或三元表达式有条件地应用样式。

在处理 JavaScript 对象和数组时，事情应该按预期工作。不应该有意外。

### 类型安全的样式

TypeScript 因其提供的体验和安全性而变得非常流行。然而，我们的样式大多仍然是未经类型定义且不可靠的。除了一些开创性的项目，如 [Vanilla Extract](https://vanilla-extract.style/)，大多数样式解决方案中的样式不过是一堆字符串。

StyleX 采用 Flow 编写，并具有强静态类型。其在 NPM 上的包附带了为 Flow 和 TypeScript 自动生成的类型。当两种类型系统之间存在不兼容时，我们会花时间确保编写自定义 TypeScript 类型，以实现与原始 Flow 相同的强大性和安全性。

**所有样式都是类型安全的。** 在接受样式作为属性时，可以使用类型来限制接受哪些样式。样式应该像任何其他组件属性一样具有类型安全性。

StyleX API 是强类型的。用 StyleX 定义的样式也是类型化的。这是通过使用 JavaScript 对象来编写原始样式实现的。这是我们选择对象而不是模板字符串的一个重要原因。

这些类型随后可以用来设置组件将接受的样式契约。例如，组件的 props 可以被定义为只接受 `color` 和 `backgroundColor` ，但不接受其他样式。

```tsx
import type {StyleXStyles} from '@stylexjs/stylex';

type Props = {
  //...
  style?: StyleXStyles<{color?: string; backgroundColor?: string}>;
  //...
};
```

在另一个例子中，props 可能不允许使用 margins，而允许所有其他样式。

```tsx
import type {StyleXStylesWithout} from '@stylexjs/stylex';

type Props = {
  //...
  style?: StyleXStylesWithout<{
    margin: unknown;
    marginBlock: unknown;
    marginInline: unknown;
    marginTop: unknown;
    marginBottom: unknown;
    marginLeft: unknown;
    marginRight: unknown;
    marginBlockStart: unknown;
    marginBlockEnd: unknown;
    marginInlineStart: unknown;
    marginInlineEnd: unknown;
  }>;
  //...
};
```

Styles being typed enables extremely sophisticated rules about how a component’s styles can be customized with **zero-runtime cost**.

### 可共享常量

CSS 类名、CSS 变量和其他 CSS 标识符都是在全局命名空间中定义的。将 CSS 字符串引入 JavaScript 可能意味着失去类型安全性和可组合性。

我们希望样式是类型安全的，因此我们花了很多时间来设计 API，以用 JavaScript 常量的引用来替换这些字符串。到目前为止，这体现在以下 API 中：

1.  `stylex.create` 将生成的类名完全抽象化。你处理的是具有强类型的“不透明” JavaScript 对象，以表示它们代表的样式。
2.  `stylex.defineVars` 抽象出生成的 CSS 变量名称。它们可以作为常量导入，并直接在样式中使用。
3.  `stylex.keyframes` 将关键帧动画的名称抽象化。它们被声明为常量，并通过引用使用。

我们也在研究如何使其他 CSS 标识符，例如 `container-name` 和 `@font-face` ，同样具有类型安全性。

### 框架无关

StyleX 是一个 CSS-in-JS 解决方案，而不是 CSS-in-React 解决方案。尽管 StyleX 目前已经被定制为最适合与 React 一起使用，但它旨在用于任何允许在 JavaScript 中编写标记的 JavaScript 框架。这包括使用 JSX、模板字符串等的框架。

`stylex.props` 返回一个包含 `className` 和 `style` 属性的对象。可能需要一个包装函数来转换它，以便与各种框架兼容。

### 封装

> 所有元素上的样式都应该由该元素本身的类名引起。

CSS 使得以一种可能导致“远距离样式”（styles at a distance）的方式编写样式变得非常容易：

*   `.className > *`
*   `.className ~ *`
*   `.className:hover > div:first-child`

所有这些模式虽然强大，但也使得样式变得脆弱且不可预测。在一个元素上应用类名可能会影响到完全不同的元素。

可继承的样式，如 `color` ，仍然会被继承，但这是 StyleX 允许的唯一一种远程样式形式。在这些情况下，直接应用在元素上的样式也总是优先于继承的样式。

在使用复杂选择器时，通常不是这种情况，因为复杂选择器的特异性通常比直接应用于元素的简单类选择器的特异性要高。

StyleX 禁止使用这整个类别的选择器。这目前使得某些 CSS 模式无法通过 StyleX 实现。我们的目标是在不牺牲样式封装的情况下支持这些模式。

StyleX 不是一个 CSS 预处理器。它有意限制了 CSS 选择器的能力，以构建一个快速且可预测的系统。基于 JavaScript 对象而非模板字符串的 API 被设计得让这些限制感觉自然。

### 可读性和可维护性优于简洁性

一些最新的实用性样式解决方案非常简洁且易于编写。StyleX 选择优先考虑可读性和可维护性，而不是简洁性。

StyleX 选择使用熟悉的 CSS 属性名称，以优先考虑可读性和浅显的学习曲线。**（我们确实决定出于方便考虑使用 camelCase 而不是 kebab-case。）**

我们还强制要求将样式编写在与使用它们的 HTML 元素分离的对象中。我们做出这个决定是为了帮助提高 HTML 标记的可读性，并且适当命名的样式能够表明它们的用途。例如，使用像 `styles.active` 这样的名称强调了为什么要应用样式，而无需深入研究正在应用哪些样式。

这一原则导致了权衡，即使用 StyleX 进行样式编写可能比其他一些解决方案需要更多的打字。

我们相信这些成本是值得的，因为随着时间的推移可以提高可读性。给每个 HTML 元素一个语义化的名称可以传达的信息远比样式本身要多。

> 使用样式引用而不是内联样式的一个附带好处是**可测试性**。在单元测试环境中，StyleX 可以配置为移除所有原子样式，并且只输出单个调试类名来指示样式的源位置，而不是实际的样式。

它使得快照测试更加韧性，因为它们不会因为每一个样式变更而改变。

### 模块化和可组合性

NPM 极大地简化了跨项目共享代码的过程。然而，共享 CSS 仍然是一个挑战。第三方组件要么内置了难以或无法自定义的样式，要么完全没有样式。

缺乏一个好的系统来可预测地合并和组合跨包的样式，这也是在包内共享样式时的一个障碍。

StyleX 旨在创建一个系统，以便在 NPM 上的包中轻松且可靠地共享样式及其组件。

### 避免全局配置

StyleX 应该在各个项目中有类似的工作方式。应避免创建改变 StyleX 语法或行为的项目特定配置。我们选择优先考虑可组合性和一致性，而不是短期便利。我们依靠 linting 和类型来创建项目特定规则。

我们还避免在项目中全局使用具有特殊含义的魔术字符串。相反，每个样式、每个变量以及每个共享常量都是一个 JavaScript 导入，无需唯一名称或项目配置。

### 一个小文件胜过多个更小的文件

处理大量 CSS 时，懒加载 CSS 是一种加快页面初始加载时间的方法。然而，这会以更新时间变慢，或者交互到下一次绘制（INP）指标变差为代价。页面上懒加载任何 CSS 都会触发对整个页面样式的重新计算。

StyleX 旨在生成一个高度优化的单一 CSS 包，该包可以预先加载。我们的目标是创建一个系统，其中 CSS 的总量足够小，以至于所有 CSS 都可以预先加载，而不会对性能产生明显影响。

其他用于加快初始加载时间的技术，比如“critical CSS”，虽然与 StyleX 兼容，但通常应该是不必要的。
