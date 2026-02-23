---
title: "译：组件 Composition 很棒"
date: 2024-09-24
url: https://sorrycc.com/component-composition-is-great-btw
---

发布于 2024年9月24日

# 译：组件 Composition 很棒

> 原文：[https://tkdodo.eu/blog/component-composition-is-great-btw](https://tkdodo.eu/blog/component-composition-is-great-btw)  
> 作者：TkDodo  
> 译者：ChatGPT 4 Turbo

当我第一次了解到 React 时，我听说了它的所有优势：虚拟 DOM 超级快，单向数据流非常可预测，而 JSX 是……一种将标记放入 JavaScript 中的有趣方式。

但是 React 的最大优势是我随时间才逐渐欣赏到的：将组件组合在一起形成更多组件的能力。

如果你一直习惯于这一点，很容易错过这个优势。信不信由你，大约十年前，将组件逻辑、样式和标记组合到一个组件中被认为是亵渎。

> ??? 关于关注点分离怎么说 ???

好吧，是的，我们仍然进行关注点分离，只是以一种不同的（可以说是更好的）方式，而不是像以前那样。这张图形，我是第一次在 Max 的推文中看到的，总结得非常好：

![](https://img.alicdn.com/imgextra/i4/O1CN01eo8Aiv1kVc95ULE9u_!!6000000004689-2-tps-1182-1302.png)

这一切都是关于代码的凝聚性。按钮的样式、点击按钮时发生的逻辑以及按钮的标记自然地属于一起，形成了那个按钮。这比“这里是你应用中所有样式的单一层”要好得多。

我们花了一些时间才真正欣赏到这种“以组件方式思考”，而且我认为有时找出这些边界仍然很难。"新"的 react 文档有一个关于[用 React 方式思考](https://react.dev/learn/thinking-in-react)的很棒的章节，他们强调第一步应该始终是将 UI 分解成一个组件层次结构。

我认为我们做得还不够，这就是为什么许多应用在达到一定点后就停止了组件组合，并继续使用它的天敌：条件渲染。

## 条件渲染

在 JSX 内部，我们可以根据条件渲染其他组件。这没什么新鲜的，也不是本身就很糟糕或邪恶。考虑以下渲染购物列表并可选添加一些有关指定给列表的人的用户信息的组件：

```tsx
export function ShoppingList(props: {
  content: ShoppingList
  assignee?: User
}) {
  return (
    <Card>
      <CardHeading>欢迎 👋</CardHeading>
      <CardContent>
        {props.assignee ? <UserInfo {...props.assignee} /> : null}
        {props.content.map((item) => (
          <ShoppingItem key={item.id} {...item} />
        ))}
      </CardContent>
    </Card>
  )
}
```

我会说这是完全没问题的。如果购物清单没有指定给任何人，我们就留出这部分的渲染。那么问题在哪里呢？

## 有条件地渲染多种状态

我认为在 JSX 中使用条件渲染成为问题的时候，是当我们用它来渲染组件的不同状态时。假设我们重构这个组件，使其通过直接从查询中读取购物清单数据来变得自给自足：

```tsx
export function ShoppingList() {
  const { data, isPending } = useQuery(/* ... */)

  return (
    <Card>
      <CardHeading>欢迎 👋</CardHeading>
      <CardContent>
        {data?.assignee ? <UserInfo {...data.assignee} /> : null}
        {isPending ? <Skeleton /> : null}
        {data
          ? data.content.map((item) => (
              <ShoppingItem key={item.id} {...item} />
            ))
          : null}
      </CardContent>
    </Card>
  )
}
```

自给自足的组件很棒，因为你可以在应用程序中自由移动它们，它们会自己读取所需的东西，就像这个例子中的查询一样。这种内联条件看起来还可以（实际上不是），因为我们基本上想要渲染一个 `Skeleton` 替代 `data`。

## 组件的演化

这里的一个问题是，这个组件并不是很好地演化。是的，我们无法预见未来，但使最常见的事情（增加更多功能）变得简单是一个非常好的想法。

所以让我们添加另一种状态 - 如果从 API 调用中没有返回 `data`，我们希望渲染一个特殊的 `<EmptyScreen />`。改变现有条件不应该难：

```tsx
export function ShoppingList() {
  const { data, isPending } = useQuery(/* ... */)

  return (
    <Card>
      <CardHeading>欢迎 👋</CardHeading>
      <CardContent>
        {data?.assignee ? <UserInfo {...data.assignee} /> : null}
        {isPending ? <Skeleton /> : null}
        {data ? (
          data.content.map((item) => (
            <ShoppingItem key={item.id} {...item} />
          ))
        ) : (
          <EmptyScreen />
        )}
      </CardContent>
    </Card>
  )
}
```

当然你会很快发现我们刚引入的 bug 🐞：当我们处于 `pending` 状态时，也会显示 `<EmptyScreen />`，因为在该状态下，我们也没有数据。通过增加另一个条件来轻松修复：

```tsx
export function ShoppingList() {
  const { data, isPending } = useQuery(/* ... */)

  return (
    <Card>
      <CardHeading>欢迎 👋</CardHeading>
      <CardContent>
        {data?.assignee ? <UserInfo {...data.assignee} /> : null}
        {isPending ? <Skeleton /> : null}
        {!data && !isPending ? <EmptyScreen /> : null}
        {data
          ? data.content.map((item) => (
              <ShoppingItem key={item.id} {...item} />
            ))
          : null}
      </CardContent>
    </Card>
  )
}
```

但这还算是 “一个组件” 吗？这容易阅读吗？这个标记中有这么多的问号和感叹号，让我的大脑有点疼。[认知负荷是最重要的](https://github.com/zakirullin/cognitive-load)。如果用户处于 `pending` 状态，或者处于 `empty` 状态，我很难直接看出屏幕上会显示什么，因为我得先解析所有这些条件。

我甚至还没讨论增加另一个状态，因为很明显，我们需要（在心里）逐步检查在这个新状态下是否也想渲染这部分。

## 回到绘图板

此时，我建议听从 React 文档的建议，将用户实际在屏幕上看到的内容分解成框。这可能会给我们一些线索，了解什么足够相关，可以成为它自己的组件：

![一个 pending 状态，一个 data 状态和一个 empty 状态，每个状态都共享一个通用布局（红色）与不同的内容（蓝色）](https://tkdodo.eu/blog/static/6248363a9b84323844515d6b37176526/7d769/three-states.png)

在所有三个状态下，我们都想渲染一个共享的“布局”——红色部分。这就是为什么我们一开始就创建我们的组件——因为我们有一些共同的部分要渲染。蓝色的部分是这三个状态之间不同的内容。那么，如果我们将红色部分提取到它们自己的布局组件中，接受动态的 `children`，重构会是什么样子呢：

```tsx
function Layout(props: { children: ReactNode }) {
  return (
    <Card>
      <CardHeading>欢迎 👋</CardHeading>
      <CardContent>{props.children}</CardContent>
    </Card>
  )
}

export function ShoppingList() {
  const { data, isPending } = useQuery(/* ... */)

  if (isPending) {
    return (
      <Layout>
        <Skeleton />
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <EmptyScreen />
      </Layout>
    )
  }

  return (
    <Layout>
      {data.assignee ? <UserInfo {...data.assignee} /> : null}
      {data.content.map((item) => (
        <ShoppingItem key={item.id} {...item} />
      ))}
    </Layout>
  )
}
```

这确实让人困惑 🫤。我们似乎没有实现任何东西——这并没有真正变得更好。我们仍然面临相同的条件混乱。那么，我接下来要说什么呢？

## 提前返回来拯救

让我们思考一下，为什么我们一开始就添加了所有这些条件🤔。那是因为我们处于 JSX 内部，而在 JSX 内部，我们只能编写表达式，而不能编写语句。

语句与表达式

如果你想更深入了解两者之间的区别，我推荐阅读 [Josh W. Comeau](https://x.com/JoshWComeau) 的文章 [语句与表达式](https://www.joshwcomeau.com/javascript/statements-vs-expressions/)。

但现在，我们不必再处于 JSX 内部了。我们唯一拥有的 JSX 只是对 `<Layout>` 的单个调用。我们可以复制这个调用并改为使用提前返回：

```tsx
function Layout(props: { children: ReactNode }) {
  return (
    <Card>
      <CardHeading>欢迎 👋</CardHeading>
      <CardContent>{props.children}</CardContent>
    </Card>
  )
}

export function ShoppingList() {
  const { data, isPending } = useQuery(/* ... */)

  if (isPending) {
    return (
      <Layout>
        <Skeleton />
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <EmptyScreen />
      </Layout>
    )
  }

  return (
    <Layout>
      {data.assignee ? <UserInfo {...data.assignee} /> : null}
      {data.content.map((item) => (
        <ShoppingItem key={item.id} {...item} />
      ))}
    </Layout>
  )
}
```

提前返回对于表示组件的不同状态来说是非常好的，因为它们可以为我们实现几件事情：

### 减少认知负担

它们为开发者提供了一条明确的路径来遵循。没有嵌套。像 `async/await` 一样，从上到下读起来变得更容易理解。每一个带有返回的 if 语句代表用户可以看到的一种状态。注意我们是如何将 `data.assignee` 检查移到了最后一个分支的。那是因为它是我们实际上想要渲染 `UserInfo` 的唯一场合。在先前的版本中，这不是很清楚。

### 易于扩展

我们现在也可以添加更多条件，比如错误处理，而不必担心我们会破坏其他状态。就像在我们的代码中投入另一个 if 语句一样简单。

### 更好的类型推断

注意到最后对 `data` 的检查只是消失了吗？那是因为 TypeScript 知道在我们处理了 `if (!data)` 情况之后，`data` 必须是已定义的。如果我们只是有条件地渲染某物，TypeScript 就无法帮助我们。

## 布局重复

我知道有些人对于在每一个分支中渲染 `<Layout>` 组件的重复表示担忧。我认为他们关注的是错误的事情。这种重复不仅可以接受，而且在组件可能需要轻微差异化演变的情况下也会有所帮助。例如，让我们从我们的 `data` 中添加一个 `title` 属性到标题：

```tsx
function Layout(props: { children: ReactNode; title?: string }) {
  return (
    <Card>
      <CardHeading>Welcome 👋 {title}</CardHeading>
      <CardContent>{props.children}</CardContent>
    </Card>
  )
}

export function ShoppingList() {
  const { data, isPending } = useQuery(/* ... */)

  if (isPending) {
    return (
      <Layout>
        <Skeleton />
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <EmptyScreen />
      </Layout>
    )
  }

  return (
    <Layout title={data.title}>
      {data.assignee ? <UserInfo {...data.assignee} /> : null}
      {data.content.map((item) => (
        <ShoppingItem key={item.id} {...item} />
      ))}
    </Layout>
  )
}
```

这将是在旧版本中需要 mentally parse 的另一个顶级条件。只需注意，向 `Layout` 组件添加更多条件可能表明它是[错误的抽象](https://www.deconstructconf.com/2019/dan-abramov-the-wet-codebase)。在这一点上，最好再次回到绘图板。

## 学习要点

也许这篇文章更多地是关于早期返回，而不是关于组件组合。我认为它关乎两者。无论如何，它讲述的是避免条件渲染对于互斥状态。如果没有组件组合，我们做不到这一点，所以确保不要跳过绘图板。这是你最好的朋友。
