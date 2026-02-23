---
title: "译：介绍 XState Store"
date: 2024-08-06
url: https://sorrycc.com/introducing-x-state-store
---

发布于 2024年8月6日

# 译：介绍 XState Store

> 原文：[https://tkdodo.eu/blog/introducing-x-state-store](https://tkdodo.eu/blog/introducing-x-state-store)  
> 作者：TkDodo  
> 译者：ChatGPT 4 Turbo

**编者注：TkDodo 推荐了 XState Store，相比 Zustand 更好的一种数据流方案。优点有，1）TypeScript 基于 store 推断，可以少写很多类型，2）选择器要传入 store，避免订阅整个 store 的常见陷阱，3）在必要的时候可以无缝升级到状态机。**

![Open vintage sign broad through the glass of store window](https://tkdodo.eu/blog/static/9d19ba6ca8a0ee2ff7f7073cc52a23d5/bbe0c/store.jpg)

照片由 [Artem Beliaikin](https://unsplash.com/@belart84) 拍摄

我对当前正在使用的技术栈非常满意，特别是在状态管理方面。显然，服务器状态由 [React Query](https://tkdodo.eu/blog/practical-react-query) 管理。对于表单，我使用 [React Hook Form](https://tkdodo.eu/blog/react-query-and-forms)。

剩下的很多情况都可以放到 url 中，这与 [TanStack Router](https://tanstack.com/router) 一起使用确实让人感到非常愉快。如果这不是一个好的选择，我会使用 [Zustand](https://zustand-demo.pmnd.rs/)——到目前为止我最喜欢的客户端状态管理器。

这已经是我推荐的技术栈相当长的一段时间了（好吧，路由器是相当新的，但概念并不是），而且我并不是那种轻易更换状态管理器的人。偶尔会有一些新东西出现，但为了让我转换，它必须比我目前使用的要好很多。

但今天可能就是这个时候。

## xstate/store

当我第一次读到 [xstate/store](https://stately.ai/docs/xstate-store) 时，有几件事立即引起了我的兴趣。其中之一，它是由 [David Khourshid](https://x.com/DavidKPiano) 制作的，而他构建的任何东西通常在概念上与我的思考有重叠。其次，它感觉 `xstate/store` 的 API 做得非常到位。乍一看，它看起来像是 `zustand` 和 `redux-toolkit` 的结合体，融合了两个库的最佳特性。

让我们来看一个例子，为了便于比较，我将使用一个类似于我在 [使用 zustand](https://tkdodo.eu/blog/working-with-zustand) 文章中的例子：

```ts
import { createStore } from '@xstate/store'
import { useSelector } from '@xstate/store/react'

const store = createStore(
  // 上下文
  {
    bears: 0,
    fish: 0,
  },
  // 转换
  {
    increasePopulation: (context, event: { by: number }) => ({
      bears: context.bears + event.by,
    }),
    eatFish: (context) => ({
      fish: context.fish - 1,
    }),
    removeAllBears: () => ({
      bears: 0,
    }),
  }
)

export const useBears = () =>
  useSelector(store, (state) => state.context.bears)
export const useFish = () =>
  useSelector(store, (state) => state.context.fish)
```

`createStore` 是我们从 `xstate/store` 中需要使用的主要函数，它分为两部分：`context` 和 `transitions`。从概念上讲，`context` 是我们 store 的 状态，而 `transitions` 类似于 `actions`。

有人可能会说，这与 `zustand` 只是略有不同，那么这有什么吸引人的地方呢？嗯，对我来说，有很多东西。让我们来分解 一下：

### TypeScript

它将从初始上下文推断 `store` 的 TypeScript 类型。这非常棒，通常使用 `zustand` 时会要更加冗长（有一些方法可以通过 [combine 中间件](https://docs.pmnd.rs/zustand/guides/typescript) 来改善这一点）。

请注意，上面的例子已经是用 TypeScript 写的了，我们唯一需要手动输入的就是传递给我们 `increasePopulation` 转换的 `event`。这真的是用户层面上应该使用 TypeScript 的方式：它越看起来像普通 JavaScript，就越好。

### Transitions

Store 在状态和动作之间有一个自然的分割，这也是我推荐使用 `zustand` 时所做的。不过，在 `xstate/store` 中，转换不是存储状态的一部分，因此我们在执行更新或将存储持久化到某处时无需选择它们 / 排除它们等。

### 事件驱动

说到更新：如果我们不从 store 中选择操作 - 我们如何触发 Transitions？很简单，使用 `store.send` ：

```tsx
function App() {
  const bears = useBears()

  return (
    <div>
      Bears: {bears}
      <button
        onClick={() =>
          store.send({ type: 'increasePopulation', by: 10 })
        }
      >
        Increment
      </button>
    </div>
  )
}
```

如果 store 本身不是事件驱动的，那它就不会像 `xstate` 那样的库。同样，这也是我推荐用于 `zustand` 的做法，因为事件比 setter 更具描述性，并且它们确保逻辑存在于 store 中，而不是触发更新的 UI 中。

所以使用 `store.send`，我们触发了从一个状态到另一个状态的转换。它接收一个带有 type 的对象，该 `type` 来自于我们在 store 上定义的 transition 对象的键。当然，这完全是类型安全的。

这就是我觉得 [redux toolkit](https://redux-toolkit.js.org/) 有些相似之处的地方，而且分发事件一直是我最喜欢的 redux 设计部分。

### 选择器

是的，`zustand` 也是建立在选择器之上的，但请注意，创建的 store 本身并不是一个钩子 - 我们必须将其传递给 `useSelector`，这要求我们也传递一个选择器函数。这意味着我们不太可能不小心订阅整个 store，这是 `zustand` 的一个常见性能陷阱。此外，如果默认的引用比较不够好，我们还可以向 `useSelector` 传递一个比较函数作为第三个参数。

### 框架无关

也许你已经看到了 - `creatStore` 是从 `@xstate/store` 导入的，而 `useSelector` 则是从 `@xstate/store/react` 导入的。这是因为 store 本身对 React 一无所知，而 React 适配器实际上只是围绕 `store.subscribe` 放入 `useSyncExternalStore` 的一个包装。

如果这听起来很熟悉，那可能是因为 TanStack Query 采取了同样的方法，所以或许将来我们也会看到 `xstate/store` 的不同框架适配器。

### 升级到状态机

状态机有作为一个难以采用的复杂工具的名声，这就是为什么很多人对它们望而却步。我认为它们确实很可能对在 Web 应用程序中管理的大多数状态来说是“过度”的。

然而，状态通常会随着时间的推移而演变，随着需求的增加变得更复杂。我在 `useReducer` 或一个外部的 `zustand` store 中看到了很多代码，我想：这显然应该是一个状态机 - 为什么不是呢？

答案通常是到了我们意识到它应该是一个状态机的时候，它已经变得如此复杂，以至于再创建一个状态机已经不是一件容易的事情了。

这又是 `xstate/store` 闪光的地方，因为它提供了一个简单的升级路径，将 store [转换成状态机](https://stately.ai/docs/xstate-store#converting-stores-to-state-machines)。这可能不是你认为你需要的东西，但如果你需要，你会很高兴这是免费提供的。

* * *

当我的文章 [使用 zustand](https://tkdodo.eu/blog/working-with-zustand) 发布时，它受到了热烈的欢迎，因为它提供了一些固执己见的指导，用于使用一种大部分时间不会妨碍你的工具。它让你可以按照自己想要的方式来构建和更新你的存储库 - 完全自由，但这也可能有点令人不知所措。

我感觉 `xstate/store` 就像是一种更有主见的实现同样目标的方式。而且这些主见在很大程度上（真的是很大程度上）与我自己的做事方式重合，这让它成为我非常好的选择。
