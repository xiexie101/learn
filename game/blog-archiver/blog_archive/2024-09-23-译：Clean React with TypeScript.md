---
title: "译：Clean React with TypeScript"
date: 2024-09-23
url: https://sorrycc.com/clean-react-with-typescript
---

发布于 2024年9月23日

# 译：Clean React with TypeScript

> 原文：[https://weser.io/blog/clean-react-with-typescript](https://weser.io/blog/clean-react-with-typescript)  
> 作者：Robin  
> 译者：ChatGPT 4 Turbo

直到去年，我与 TypeScript 的唯一经验就是在 Twitter 上看到人们要么争论哪种过于复杂的解决方案最好，要么抱怨编译器有多慢。我已经使用 ReasonML 和 ReScript 差不多 6 年了（感谢 [Sean](https://www.riseos.com)），并且对此非常满意。然而，TypeScript 的受欢迎程度上升，我的前团队 Carla 也想在我们的 React 应用中使用它。

所以，这就是我，对我在 Twitter 上看到的所有魔法感到害怕，并且对一个拥有合适类型系统的函数式编程语言的美感持偏见。我想要将所有好的东西桥接过来，宁愿探索不同的设计模式，也不愿选择过于复杂的解决方案。

今天，我每天都在使用 TypeScript，并且实际上相当喜欢它，虽然我仍然定期地弄坏了编译器。不过，花了我相当一段时间的是，弄清楚向所有不同的 React 模式和特性添加 TypeScript 的最佳方式。我看到有很多种做法，最终被库本身提供的所有不同类型弄得困惑。

为了帮助你避免那种挣扎和/或改进你现有的 React 代码库，本文探讨了不同的用例及我认为最优雅的解决方案。

文章分为四个主要部分：组件、状态管理、引用和事件。请随意跳转。

## 组件

首先，让我们谈谈组件。

它们是每个 React 应用的核心，也可能是我们最常写的东西。自从引入了 hooks 以来，大多数组件都是普通的 JavaScript 函数，它们接受一组 props 并返回一些标记 - 通常是 JSX 的形式。

鉴于此，给它们加类型实际上是直截了当的。唯一的真正限制是它总是接受一个参数 - 确切地说是一个属性对象。

### 基础 Props

让我们首先从一些原始的 props 开始。在这个例子中，我们有一个组件，它接受一个标题和一个描述。两者都是字符串，且描述是可选的。

```ts
type Props = {
  title: string
  description?: string
}

function ProductTile({ title, description }: Props) {
  return (
    <div>
      <div>{title}</div>
      {description && <div>{description</div>}
    </div>
  )
}
```

### 子组件

到目前为止，一切都很好。现在一个常见的用例是，将 `children` 传递给组件以渲染嵌套组件。你可能想要将它添加到你的类型中，但 React 实际上提供了一个特殊的类型帮助减少冗余。

它被称为 `PropsWithChildren`，这是一个泛型，可以取你现有的 props 类型并为你添加 `children`。

```ts
import { ReactNode, PropsWithChildren } from 'react'

type Props = {
  title: string
}

function ProductTile({ title, children }: PropsWithChildren<Props>) {
  return (
    <div>
      <div>{title}</div>
      {children}
    </div>
  )
}
```

**提示**：参数是可选的。如果你的组件只接受 children，你可以直接传递 `PropsWithChildren`。

### 传递 Props

另一个常见的操作是将 props 传递给内部组件。例如，我们可能有一个组件本身渲染我们的 `ProductTile` 组件，但也接受额外的 props 用于自定义：

```tsx
import ProductTile from './ProductTile'

type Props = {
  color: string
  title: string
}

function ProminentProductTile({ color, title }: Props) {
  return (
    <div style={{ background: color }}>
      <ProductTile title={title} />
    </div>
  )
}
```

虽然这对于字符串和数字这样的原始类型来说完全可以，但如果你要处理复杂的记录或函数时，重复这些类型会变得相当繁琐——特别是如果你必须通过多个组件传递一个值。

还记得 DRY 原则吗？我们可以利用 React 提供的另一个泛型 `ComponentProps` 来避免重复相同的类型。它接收一个组件的类型作为参数，我们可以通过使用 `typeof` 获取它，并返回其 props 类型。然后我们可以使用索引访问来获取特定的值。

```ts
import { ComponentProps } from 'react'

import ProductTile from './ProductTile'

type ProductTileProps = ComponentProps<typeof ProductTile>
type Props = {
  color: string
  title: ProductTileProps['title']
}
```

你可以认为通过在 `ProductTile` 中直接导出类型也可以达到同样的目的。你说得对，那样也可以，但如果你在某个时刻更改或扩展了你的类型，这样做也更容易出错。

### 展开 Props

类似于传递 props，有时我们想要将所有额外的 props 展开到一些底层组件中。想象一下，`ProminentProductTile` 应该同时传递 `title` 和 `description`。

我们可以通过再次利用 `ComponentProps` 来简单扩展类型，而不是一一指定每个属性。

```tsx
import { ComponentProps } from 'react'

import ProductTile from './ProductTile'

type Props = {
  color: string
} & ComponentProps<typeof ProductTile>

function ProminentProductTile({ color, ...props }: Props) {
  return (
    <div style={{ background: color }}>
      <ProductTile {...props} />
    </div>
  )
}
```

**提示**：如果你只想展开这些 props 的一个子集，你可以使用 TypeScript 内置的 `Pick` 来做到。例如：

```ts
type ProductTileProps = ComponentProps<typeof ProductTile>

type Props = {
  color: string
} & Pick<ProductTileProps, 'title' | 'description'>
```

#### HTML 元素

这种模式也适用于 HTML 原始元素。如果我们想要将所有剩余的 props 传递给例如一个 `button` 元素，我们可以简单地使用 `ComponentProps<"button">`。

**注意**：还有 `React.JSX.IntrinsicElements["button"]`，它指的是相同的类型，但我建议你为了一致性和可读性只使用其中之一，我通常更喜欢第一个，因为它更容易输入。

**额外信息**：对于某些特定边缘情况，当我们只想传递有效的 HTML 属性 - 排除特定于 React 的 props，如 ref 和 key - 我们也可以使用特定的属性类型，例如 `React.ButtonHTMLAttributes<HTMLButtonElement>`。然而，我还没有遇到这样的用例，而且因为它又是更多的输入，所以我仍然更喜欢更短的 `ComponentProps<"button">`。

### 传递 JSX

现在我们已经介绍了简单的 props，让我们来看一些更高级的用例。

有时，传递原始类型的 props 是不够的，我们想要传递原始的 JSX 来渲染嵌套内容。虽然依赖注入通常会使你的组件变得不那么可预测，但这是自定义通用组件的好方法。尤其是当我们已经传递了子组件，但需要在特定位置注入额外的标记时，这一点特别有用。

幸运的是，React 为我们提供了另一种有用的类型叫做 `ReactNode`。

想象一个包装整个应用程序并且还接收侧边栏以在预定义槽中渲染专用导航的布局组件：

```ts
import { PropsWithChildren, ReactNode } from 'react'

type Props = {
  title: string
  sidebar: ReactNode
}

function Layout({ title, children, sidebar }: PropsWithChildren<Props>) {
  return (
    <>
      <div className="sidebar">{sidebar}</div>
      <main className="content">
        <h1>{title}</h1>
        {children}
      </main>
    </>
  )
}
```

现在我们可以传递我们想要的任何内容：

```ts
const sidebar = (
  <div>
    <a data-selected href="/shoes">
      鞋子
    </a>
    <a href="/watches">手表</a>
    <a href="/shirts">衬衫</a>
  </div>
)

const App = (
  <Layout title="跑鞋" sidebar={sidebar}>
    {/* 页面内容 */}
  </Layout>
)
```

**附加信息**：`PropsWithChildren` 实际上在底层使用了 `ReactNode`。自定义实现看起来像这样：

```ts
type PropsWithChildren<Props = {}> = { children: ReactNode } & Props
```

### 传递组件

当你想要最大程度的灵活性时，传递 JSX 是很棒的。但是如果你想限制渲染到某些组件，或者也不想把所有逻辑都移动到一个让它更加臃肿的单个组件中，同时还想向那个子树传递一些 props 怎么办？

正是这样，变得流行的 [渲染-props 模式 (新标签页)](https://react.dev/reference/react/Children#calling-a-render-prop-to-customize-rendering) 就是：带有限制的依赖注入。

再一次，React 为我们提供了一个很整洁的类型来帮助实现这一点，叫做 `ComponentType`。

```ts
import { ComponentType } from 'react'

type ProductTileProps = {
  title: string
  description?: string
}

type Props = {
  render: ComponentType<ProductTileProps>
}

function ProductTile({ render }: Props) {
  // 一些计算 prop 的逻辑

  return render(props)
}
```

**额外信息**：这对第三方组件也是相当不错，通过 d.ts 文件实现：

```ts
declare module 'some-lib' {
  type Props = {
    title: string
    description?: string
  }

  export const ProductTile: ComponentType<Props>
}
```

#### 特定组件

如果我们只允许一个特定的组件，代码甚至更简单，因为我们可以使用内建的 [`typeof` 操作符](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)来实现。

```ts
import { ComponentProps } from 'react'

import Icon from './Icon'

type Props = {
  icon?: typeof Icon
} & ComponentProps<'button'>

function Button({ icon: Icon, children, ...props }: Props) {
  return (
    <button {...props}>
      {icon && <Icon size={24} />}
      {children}
    </button>
  )
}
```

#### 推断 Props

这是一个用于泛型（布局）组件的常见模式。它通常被用在组件库中，并且可以为在 React 中创建灵活布局奠定一个很好的基础。

通常，你会传递一个 `as` 或 `component` prop，然后组件就变成了那个，包括它的 props 和类型。例如：

```ts
const App = (
  <>
    {/* 这会抛出错误，因为 div 没有 value prop */}
    <Box as="div" value="foo" />
    {/* 但这可以运行 */}
    <Box as="input" value="foo" />
  </>
)
```

最棒的部分是，它也适用于自定义组件，给了我们无限的灵活性。  
好的，但我们如何实现这一点呢？而不是解释 [Matt Pocock](https://www.mattpocock.com) 在 [Total TypeScript](https://www.totaltypescript.com) 上已经做的一篇精彩文章，我就在这里直接链接它：[作为 Prop 传递任何组件并推断其 Props](https://www.totaltypescript.com/pass-component-as-prop-react#passing-any-component-as-a-prop-and-inferring-its-props)。

## 状态管理

管理状态可能是钩子使用中最常见的用例，对于简单情景，React 提供了 [useState](https://react.dev/reference/react/useState) 钩子，以及对于更复杂情况的 [useReducer](https://react.dev/reference/react/useReducer) 钩子。

### useState

默认情况下，useState 根据传入的初始值自动推断值的类型。这意味着，如果我们有一个简单的计数器状态，其默认状态为 `0`，我们不需要输入任何类型，它就能正常工作：

```ts
import { useState } from 'react'

function Counter() {
  const [counter, setCounter] = useState(0)

  // 组件逻辑
}
```

然而，如果我们不传入一个默认值，处理可为空值，或默认值不能代表全部类型，例如在使用具有可选键的对象时，我们必须提供一个类型，使其能够正确工作。  
幸运的是，React 允许我们传入一个可选类型，来告诉它接受哪些值。

```ts
import { useState } from 'react'

type AuthState = {
  authenticated: boolean
  user?: {
    firstname: string
    lastname: string
  }
}

type Todo = {
  id: string
  title: string
  completed: boolean
}

function TodoList() {
  // 不传入 AuthState，我们将无法设置 user
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
  })
  // 数据是异步加载的，因此首次渲染时为 null
  const [data, setData] = useState<Array<Todo> | null>(null)

  // 组件逻辑
}
```

### useReducer

使用 reducers 时，不存在类型推断，因为我们必须主动为 reducer 指定类型。其第一个参数（state）将被用来推断类型以及对传递给钩子的初始状态进行类型检查。

```ts
import { useReducer } from 'react'

type State = number
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset'; payload: number }

function reducer(state: State, action: Action) {
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    case 'reset':
      return action.payload
    default:
      return state
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, 0)

  // 组件逻辑
}
```

毕竟，这里全部都是纯 TypeScript，没有涉及 React 的特定内容。

## Refs

Refs，即引用的简称，提供了一种直接访问和与 DOM 元素或 React 组件交互的方式。

虽然我会建议你仅在必要时使用 refs，并尽可能依赖于组件和状态，但它们对于焦点管理或直接读取/操作节点非常有用。

**注意**：Refs 可以用于各种事物和值，但我们在本文中只关注 HTML 元素。

### 使用 Refs

React 提供了一个方便的钩子 [useRef](https://react.dev/reference/react/useRef) 来在函数式组件中创建一个 ref。

为了获得正确的类型和避免编译器错误，我们需要提供一个类型。由于元素在首次渲染时尚未挂载，我们也传递了 `null` 作为默认值。

```ts
import { useRef, ComponentProps } from 'react'

function Button(props: ComponentProps<'button'>) {
  const ref = useRef<HTMLButtonElement | null>(null)

  return <button ref={ref} {...props} />
}
```

### 转发 Refs

**注意**：转发 refs 不久将成为过去式！一旦 React 19 发布，refs 将会自动转发，再也无需使用 `forwardRef` 对组件进行包装了。

[转发 refs](https://react.dev/reference/react/forwardRef) 在我们想要将 ref 传递给自定义组件时是必需的。让我们以带有图标的按钮为例。在很多代码库中，我看到了大量单独输入 props 和 ref 的做法：

```ts
import { forwardRef, ComponentProps, ForwardedRef } from 'react'

import Icon from './Icon'

type Props = {
  icon?: typeof Icon
} & ComponentProps<'button'>

const Button = forwardRef(
  (
    { icon, children, ...props }: Props,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    return (
      <button ref={ref} {...props}>
        {icon && <Icon size={24} />}
        {children}
      </button>
    )
  }
)
```

我总觉得这段代码很难读懂，因为里面有很多括号和方括号，情况复杂。但，情况并非一定如此！forwardRef 接受两个可选类型来初始化它的函数 button：

```ts
const Button = forwardRef<HTMLButtonElement, Props>(
  ({ icon, children, ...props }, ref) => {
    return (
      <button ref={ref} {...props}>
        {icon && <Icon size={24} />}
        {children}
      </button>
    )
  }
)
```

这不仅使代码更易于阅读，而且还减少了一些样板代码，因为我们根本不需要 `ForwardedRef`。

### 传递 Refs

有时候，我们不想直接转发一个 ref，而是希望将 ref 传递给另一个元素。想象一下，你有一个弹出窗口组件，并想传递它应该锚定到哪个元素。我们可以通过传递一个 ref 来做到这一点。为此，React 提供了一个 `RefObject` 类型。

```ts
import { RefObject } from 'react'

type Props = {
  anchor: RefObject<HTMLElement>
}

function Popover({ anchor }: Props) {
  // 根据锚点 ref 定位组件
}
```

**提示**：一般而言，我建议使用更通用的类型，如 `HTMLElement`，除非你需要特定的属性或想限制 API，例如在构建组件库时。为什么？因为 `HTMLDivElement` 也满足 `HTMLElement`，但是 `HTMLSpanElement` 不满足 `HTMLDivElement`。

## 事件

最后，让我们谈谈事件和事件监听器。  
我们通常通过两种方式遇到它们：

1.  通过 props 直接传递事件监听器给组件，例如 `onClick`、`onBlur`
2.  在 effects 中针对不同元素添加事件监听器，例如 `scroll`、`mouseup`

然而，在我们深入探讨这两种用例之前，我们首先应该讨论不同的事件类型，它们来自哪里以及它们之间的差异。

### MouseEvent 与 React.MouseEvent

一开始，这真的让我感到困惑。有一个全局的 `MouseEvent` 以及 React 导出的 `MouseEvent`。它们都用于事件监听器，并且我看到它们不止一次地被混淆。

简单来说，区别在于全局内置的 `MouseEvent` 指的是原生 JavaScript 事件，而另一个是专门为 React 的 [合成事件系统 (新标签)](https://react.dev/reference/react-dom/components/common#react-event-object) 而定制的。

他们有很多共同之处，通常可以互换使用，但是 React 版本还考虑了浏览器的不兼容性，并包括了一些 React 特定的属性，比如 `persist`。

除了鼠标事件之外，还有各种各样的事件适用于各种事件监听器。

**注意**：在 React 17 之前的旧版本中，合成事件也会被池化，这意味着出于性能原因，事件对象会被重复使用。

### 传递事件监听器

第一个用例是将事件监听器传递给组件。在这样做时，我们正在使用 React 自己的事件系统，因此应该使用 React 提供的特殊事件。

最常见的例子是将 `onClick` 处理程序传递给可点击的组件。

**注意**：再次强调，我们最有可能在这里使用 `ComponentProps<"button">["onClick"]`，但只是为了探索类型，我们将自己编写类型。

```ts
import { MouseEventHandler } from 'react'

type Props = {
  onClick: MouseEventHandler<HTMLButtonElement>
}

function Button({ onClick }: Props) {
  return <button onClick={onClick} />
}
```

另一个常见的事情是操作事件监听器，例如在提交表单时。在这种情况下，我们必须对事件进行类型化以获得正确的类型。

```ts
// 使用命名导入会在这里覆盖原生事件
// 如果我们想在一个文件中同时使用它们，这种方式更安全
import * as React from 'react'

function Login() {
  return (
    <form
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // 登录逻辑
      }}>
      {/* 登录表单 */}
    </form>
  )
}
```

### 附加事件监听器

最后，要讨论的是附加事件监听器。当处理不能直接传递给组件的事件，如全局滚动监听器时，这主要是有用的。

通常，我们在 `useEffect` 中注册事件监听器。既然这些是原生事件监听器，且与 React 无关，我们获取原生事件并应该使用原生类型。

```ts
import { useEffect } from 'react'

function Navigation() {
  useEffect(() => {
    const onScroll = (e: Event) => {
      // 当滚动时做些什么
    }

    document.addEventListener('scroll', onScroll)
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  // 组件逻辑
}
```

## 结论

好吧，这篇文章最后变得相当长。

正如我们所见，现代 React 应用程序中有大量的特性、模式和用例。将它与 TypeScript 结合使用可能会令人困惑并不总是直观的，但我希望这篇文章能在所有不同的内置类型以及如何正确使用它们上提供一些启示和清晰度。

如果你遵循本文中分享的大多数最佳实践，你应该最终拥有一个相当干净的代码库，其中 TypeScript 与你的 React 代码无缝集成。
