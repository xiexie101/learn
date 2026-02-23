---
title: "译：Zustand 和 React Context"
date: 2024-04-15
url: https://sorrycc.com/zustand-and-react-context
---

发布于 2024年4月15日

# 译：Zustand 和 React Context

> 原文：[https://tkdodo.eu/blog/zustand-and-react-context](https://tkdodo.eu/blog/zustand-and-react-context)  
> 作者：Dominik  
> 译者：ChatGPT 4 Turbo

**编者注：作者介绍了一种把 zustand 封成 hook 且支持多实例的方法。**

![](https://img.alicdn.com/imgextra/i2/O1CN012wOCH91qtmhJRw530_!!6000000005554-0-tps-640-427.jpg)

照片来自 [Ivan Aleksic](https://unsplash.com/@ivalex)

Zustand 是一个用于全局客户端状态管理的优秀库。它简单、快速，并且包大小很小。但是，我并不特别喜欢它存在的一个问题：

> Store 是全局的。

好吧？但全局状态管理的目标不就是将状态在你的应用中随处可用吗？

有时，我认为这是正确的。然而，当我回顾过去几年我使用 Zustand 的方式时，我发现往往我需要一些状态全局可用于一个组件子树，而不是整个应用。对于 Zustand，完全可以 - 甚至是鼓励你 - [在每个特性基础上创建多个小型 Store](https://tkdodo.eu/blog/working-with-zustand#keep-the-scope-of-your-store-small)。那么，为什么我需要让我的 Dashboard Filters Store 在我只需要在 Dashboard 路线上使用它的情况下全局可用呢？当然，当它不会造成伤害时，我可以这么做，但我发现全局 Store 确实有一些缺点：

### 从 Props 初始化

全局 Store 是在 React Component 生命周期之外创建的，因此我们不能用我们作为 prop 获取的值初始化 Store。对于全局 Store，我们需要先用已知的默认状态创建它，然后用 `useEffect` 同步 props 到 Store：

```js
const useBearStore = create((set) => ({
  // ⬇️ 初始化默认值
  bears: 0,
  actions: {
    increasePopulation: (by) =>
      set((state) => ({ bears: state.bears + by })),
    removeAllBears: () => set({ bears: 0 }),
  },
}))

const App = ({ initialBears }) => {
  //😕 向我们的 Store 写入 initialBears
  React.useEffect(() => {
    useBearStore.set((prev) => ({ ...prev, bears: initialBears }))
  }, [initialBears])

  return (
    <main>
      <RestOfTheApp />
    </main>
  )
}
```

除了不想写 `useEffect`，这种方式还有两个不理想之处：

1.  我们首先使用 `bears: 0` 渲染了 `<RestOfTheApp />`，在 effect 生效之前，然后再用正确的 `initialBears` 再渲染一次。
2.  我们并没有真正用 `initialBears` 初始化我们的 store——我们是在同步它。所以如果 `initialBears` 发生变化，我们也会在我们的 store 中看到更新反映出来。

### 测试

我发现 [zustand 的测试文档](https://docs.pmnd.rs/zustand/guides/testing) 相当让人困惑且复杂。它完全是关于模拟 zustand 和在测试之间重置 store 等等。我认为这一切都源自于 store 是全局的这一事实。如果它被限定在一个组件子树的范围内，我们可以渲染这些组件并且 store 将被隔离在里面，不需要任何这些“变通方法”。

### 可重用性

并不是所有的 store 都是单例，我们可以在我们的 App 中或在某个特定的路由中只使用一次。有时候，我们也希望对可重用组件使用 zustand store。我能想到的过去的一个例子是我们设计系统中的一个复杂的多选分组组件。它使用 React Context 传递的本地状态来管理选择的内部状态。只要有五十个或更多项目，每当有项目被选中时，它就会变得缓慢。这就是我写下这条推文的原因：

![](https://img.alicdn.com/imgextra/i1/O1CN01MgifYM1qNGZny3CB9_!!6000000005483-2-tps-1114-784.png)

如果这样的 zustand store 是全局的，我们就不能多次实例化组件而不共享并覆盖彼此的状态。

* * *

有趣的是，有一个单一的方法可以解决所有这些问题：

## React Context

这里有趣且讽刺的是，React Context 正是这个问题的解决方案，因为使用 Context 作为状态管理工具正是最初引起上述问题的原因。但这不是我现在提议的。这个想法仅仅是通过 React Context 分享 store 实例——而不是 store 值本身。

从概念上讲，这正是 React Query 通过 `<QueryClientProvider>` 所做的，也是 `redux` 也在做的，他们也是用的单一 store。因为 store 实例是不经常变化的静态单例，我们可以轻松地将它们放入 React Context 中，而不会引起重新渲染问题。然后，我们仍然可以创建订阅者到 store，这将由 zustand 优化。以下是它可能的样子：

> v5 语法
> 
> 在这篇文章中，我将展示如何将 zustand 与 React Context 结合使用的 v5 语法。在此之前，zustand 有一个明确的 [`createContext`](https://docs.pmnd.rs/zustand/previous-versions/zustand-v3-create-context) 函数，是从 `zustand/context` 导出的。

```jsx
import { createStore, useStore } from 'zustand'

const BearStoreContext = React.createContext(null)

const BearStoreProvider = ({ children, initialBears }) => {
  const [store] = React.useState(() =>
    createStore((set) => ({
      bears: initialBears,
      actions: {
        increasePopulation: (by) =>
          set((state) => ({ bears: state.bears + by })),
        removeAllBears: () => set({ bears: 0 }),
      },
    }))
  )

  return (
    <BearStoreContext.Provider value={store}>
      {children}
    </BearStoreContext.Provider>
  )
}
```

主要的区别在于，我们没有像以前那样使用 `create`，它将给我们一个可以即刻使用的钩子。相反，我们依赖原生 zustand 函数 `createStore`，它只是为我们创建了一个存储。我们可以在任何我们想要的地方做这个 - 甚至在组件内部。然而，我们必须确保创建存储只发生一次。我们可以用 refs 来做这个，但我更喜欢用 `useState`。如果你想知道原因，我有一篇[单独的博客文章](https://tkdodo.eu/blog/use-state-for-one-time-initializations)讲述这个话题。

因为我们在组件内部创建存储，所以我们可以把像 `initialBears` 这样的属性封闭起来，并把它们作为真正的初始值传递给 `createStore`。`useState` 初始化函数只执行一次，所以属性的更新不会传递给存储。然后，我们获取存储实例，并将其传递给一个普通的 React Context。这里已经没有 zustand 的特定内容了。

* * *

在那之后，我们需要在任何我们想要从我们的存储中选择一些值的地方消费该上下文。为此，我们需要将 `store` 和 `selector` 传递给我们可以从 zustand 获取的 `useStore` 钩子。这最好是在一个自定义钩子中抽象出来：

```js
const useBearStore = (selector) => {
  const store = React.useContext(BearStoreContext)
  if (!store) {
    throw new Error('Missing BearStoreProvider')
  }
  return useStore(store, selector)
}
```

然后，我们可以像通常那样使用 `useBearStore` 钩子，并导出带有原子选择器的自定义钩子：

```js
export const useBears = () => useBearStore((state) => state.bears)
```

* * *

虽然这比仅仅创建一个全局存储要写的代码稍微多一些，但它解决了所有三个问题：

1.  如示例所示，我们现在可以用属性初始化我们的存储，因为我们是在 React 组件树内部创建它的。
2.  因为我们可以将包含 `BearStoreProvider` 的组件进行渲染，或者我们可以仅为测试自己渲染一个，所以测试变得轻而易举。在这两种情况下，创建的存储都将完全隔离到测试中，因此不需要在测试之间重置。
3.  现在，一个组件可以渲染 `BearStoreProvider`，以向其子组件提供一个封装的 zustand 存储。我们可以在一个页面上尽可能多次渲染这个组件 - 每个实例将有自己的存储，所以我们实现了可复用性。

所以，尽管 [zustand 文档](https://docs.pmnd.rs/zustand/getting-started/introduction#then-bind-your-components,-and-that's-it!) 自豪地宣称不需要上下文提供者来访问存储，我认为了解如何将存储创建与 React 上下文结合起来在需要封装和可复用性的情况下非常方便。我个人更多地使用了这种抽象而不是真正的全局 zustand 存储。😄
