---
title: "译：context 选择器的未来是 React.use + React.useMemo"
date: 2024-01-12
url: https://sorrycc.com/context-selector
---

发布于 2024年1月12日

# 译：context 选择器的未来是 React.use + React.useMemo

> 原文：[https://interbolt.org/blog/react-use-selector-optimization/](https://interbolt.org/blog/react-use-selector-optimization/)  
> 作者：Colin Campbell  
> 译者：ChatGPT 4 Turbo

**编者注：一些收获，1）use context 有颗粒度的性能问题，其目前的解是 use-context-selector，未来的解是 useMemo + use，2）再往后看，useMemo 未来会用 React Forget 去掉，所以基于 use 就可以做细粒度的数据流，3）为啥 use-context-selector 不够用，为啥 RFC 119 没有被处理，因为这个方案有缺陷，不是可组合的。**

在这篇文章中，我将回顾我如何使用 Daishi Koto 的 [use-context-selector](https://github.com/dai-shi/use-context-selector) 库优化了一个应用中有问题的 React 上下文，我是如何逐渐倾向于使用上下文选择器来防止不必要的重新渲染，以及 Dan Abramov 是如何说服我，我构建的使上下文选择器可组合的抽象方法是错误的做法。

## 为什么我更喜欢上下文选择器

不久前，我被一家公司雇用，负责开发一个类似 airbnb 的交互式地图搜索。他们的地图代码严重依赖于单个 React 上下文来管理其状态、处理程序和效果。

代码看起来像这样：

```tsx
const MapSearchContext = React.createContext();
const useMapSearchContext = React.useContext(MapSearchContext);

const MapSearchProvider = ({ children }) => {
  // 👀 we stuffed most of the map logic into `useMapSearchProvider`
  const mapSearch = useMapSearchProvider();

  return (
    <MapSearchContext.Provider value={mapSearch}>
      {children}
    </MapSearchContext.Provider>
  );
};
const MapSearch = () => {
  return (
    <MapSearchProvider>
      <Container>{/* lots of questionable components here */}</Container>
    </MapSearchProvider>
  );
};
```

`useMapSearchProvider` 组合了几个易于测试的小型自定义钩子，因此，也易于更改。但是一个有经验的 React 开发者会认出这段代码中的潜在问题：

不必要的在调用 `React.useContext` 的包装器 `useMapSearchContext` 的组件中重新渲染。

#### 为什么？

考虑以下代码，它使用了一种类似的策略，将钩子的返回值提供给上下文提供者：

```tsx
const Context = React.createContext();

const useFavoritePet = () => {
  const [lastNaughtyAction, setLastNaughtAction] =
    React.useState("Frank - stole food");
  const [favoritePet, setFavoritePet] = React.useState("Frank");

  const onNaughtyAction = React.useCallback(
    (petName, action) => setLastNaughtAction(`${petName} - ${action}`),
    []
  );

  useEffect(() => {
    if (lastNaughtyAction.startsWith("Frank")) {
      setFavoritePet("Coconut");
    } else {
      setFavoritePet("Frank");
    }
  }, [lastNaughtyAction]);

  return {
    favoritePet,
    lastNaughtyAction,
    onNaughtyAction,
  };
};

const MyFavoritePetProvider = ({ children }) => {
  const value = useFavoritePet();
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

const MyFavoritePet = () => {
  return (
    <MyFavoritePetProvider>
      <>
        <FavoritePetPhoto />
        <PetControls />
      </>
    </MyFavoritePetProvider>
  );
};

const FavoritePetPhoto = () => {
  const { favoritePet } = React.useContext(Context);
  return <img src={`/${favoritePet}.png`} />;
};

const PetControls = () => {
  // 👀 calling `useContext` here means that this component will
  // re-render everytime `onNaughtyAction` is called since `onNaughtyAction`
  // calls `React.setState`. But this re-render is unnecessary since
  // `onNaughtyAction` never changes.
  const { onNaughtyAction } = React.useContext(Context);
  return (
    <>
      <button
        onClick={() => onNaughtyAction("Coconut", "scratches girlfriend")}
      >
        Coconut scratches girlfriend
      </button>
      <button onClick={() => onNaughtyAction("Frank", "chases coconut")}>
        Frank chases coconut
      </button>
    </>
  );
};
```

在上面的代码中，每当 `onNaughtyAction` 被调用时， `<PetControls />` 都会重新渲染，因为 `onNaughtyAction` 导致了 `useFavoritePet` 中的状态变化。挂钩到 `Context.Provider` 的任何状态变化都会导致 `useFavoritePet` ，进而导致 `React.useContext(Context)` 返回一个新的引用，而在 React 组件内部解构一个改变的引用将触发重新渲染。

所以回到地图代码，如果我们在 `useMapSearchProvider` 内部写了大量的状态改变代码，我们可以预期会在只需要 `useMapSearchContext` 返回值中一小部分的组件中产生许多不必要的重新渲染，因为 `useMapSearchContext` 每次状态改变后都会返回一个新的引用。

随着时间的推移，这种基于上下文的设计确实导致了性能问题。

## 优化 `React.useContext`

我被分配了优化他们代码的任务，但也被指示要尽可能地精简，因为这是他们最重要的功能。我考虑将他们的单一上下文分解成几个较小的上下文，但我难以将 `useMapSearchProvider` 分解成独立的钩子。因此，本着保持我的更改简洁的原则，我研究了如何让单一上下文更高效。

我的研究让我发现了 [RFC 119](https://github.com/reactjs/rfcs/pull/119)，这是一个在 2019 年创建的 React 提案，它概述了一个潜在的解决方案，用于在调用 `React.useContext` 时防止不必要的重新渲染。这个想法是添加对作为第二个参数传递选择器函数的支持，如下所示：

```tsx
const thingICareAbout = React.useContext(Ctx, (ctx) => ctx.thingICareAbout);
```

React 的内部机制会确保，如果 `ctx` 中未“选中”的任何内容发生变化，不会触发重新渲染。

但是 RFC 仍处于“开放”状态，而 React 核心团队并没有正式计划去实现它。尽管如此，Github 上的讨论让我找到了一位名叫 [Daishi Koto](https://twitter.com/dai_shi) 的才华横溢的开发者，他很好心地在用户空间开源了一个类似的解决方案，叫做 [`use-context-selector`](https://github.com/dai-shi/use-context-selector) 。

使用 Daishi 的库加上我自己的一些代码，我能够实现一个选择器作为 `useMapSearchContext` 的第一个参数，这将确保我们的地图组件只有在它们感兴趣的上下文片段发生变化时才会重新渲染，如下所示：

```tsx
// This will only trigger a re-render if `state` or `city` change.
const state = useMapSearchContext((ctx) => ctx.state);
const city = useMapSearchContext((ctx) => ctx.city);
```

几个小型 PR 后，我的优化工作完成了。现在，地图的渲染树中的组件除非它们需要从 `useMapSearchContext` 的返回值中获取的东西真的发生了变化，否则不会再重新渲染。

这就是我开始偏爱上下文选择器模式的起源故事。我在个人项目中采用了它，甚至写了一个扩展 Daishi 的 `use-context-selector` 的实验性库。我喜欢我可以仅使用 React 上下文和钩子来满足我大部分（如果不是全部的话）全局状态管理的需求。

直到最近在 Twitter 上与 [Dan Abramov](https://overreacted.io/) 的互动。

## 比上下文选择器更好的替代品

它都始于 react-query 的维护者 [@TkDoko](https://twitter.com/TkDodo)（Dominik）的这条推文。

![use and useMemo selector example from twitter](https://img.alicdn.com/imgextra/i1/O1CN01a1TDt123lcc46vHXr_!!6000000007296-2-tps-957-538.png)

[源推文](https://twitter.com/TkDodo/status/1741193371283026422)

Dominik 在强调 React 未来的一个特性，这将使得在 `useMemo` 函数中调用 `React.use(Context)` 成为可能（[目前仅在 canary 中可用](https://react.dev/reference/react/use)）。有趣的是，尽管他示例中的 `useMemo` 依赖数组里什么都没有， `useMemo` 会以某种方式知道只有在 `foo` 发生变化时才触发重新渲染。在这种情况下，返回值作为 `useMemo` 依赖数组中的一个隐式依赖 🤯。更有趣的是，一旦所有这些在 React 的未来版本中实现，[这也将适用于第三方钩子](https://twitter.com/BenJ_Ayc0/status/1742499230525067408)。

但我仍然对进一步依赖 `useMemo` 来保持应用程序的高性能感到不安。我见过许多开发者（包括我自己）在使用记忆化 API 时搬起石头砸自己的脚。

## 对上下文选择器的固执忠诚

我恰好打开了 Twitter，当 Dominik 分享了上面的截图时，我决定回复一个问题：

![](https://img.alicdn.com/imgextra/i3/O1CN01koKi341lO7CVRDA4b_!!6000000004808-49-tps-1604-1008.webp)

[源推文](https://twitter.com/interbolt_colin/status/1741195124036558882)

Dominik 快速指出增加的抽象可能不是一个好主意，并且我的例子漏掉了 `selector` 在 `useMemo` 依赖数组中（哎呀！）。

他的确切回应：

> “不，选择器需要放入依赖数组中，因为它可能会封闭一些东西。那时，你也需要对它进行记忆化处理。我认为进一步抽象化没有太大意义，我只是直接内联使用。” - [@DkToko](https://twitter.com/TkDodo/status/1741195949110661589)

在我完全理解他所写的内容之前，[Dan Abramov](https://twitter.com/dan_abramov2) 就发表了一个更加引人注目的回应：

![](https://img.alicdn.com/imgextra/i3/O1CN01AyUAgJ27N7tOXLn1I_!!6000000007784-49-tps-1604-604.webp)

[源推文](https://twitter.com/dan_abramov2/status/1741200483862151663)

几秒钟后，他又发了另一条帖子，提供了一些理由：

![](https://img.alicdn.com/imgextra/i4/O1CN018Cq4V71ygW7ZSqOML_!!6000000006608-49-tps-1578-994.webp)

[源推文](https://twitter.com/dan_abramov2/status/1741203738650386896)

Dan 在这里的推文是指一个经典的 `useContextSelector` 实现会将以下类型签名的选择器函数作为其第二个参数：

```tsx
type SelectorFunction = (Context) => any;
```

任何选择器都必须了解 `Context` 的整个结构才能进行选择。让我们通过用 `useContextSelector` 实现 Dan 之前的 `useColor` / `useTheme` 示例来演示他的观点。

```tsx
useTheme() {
  return useContextSelector(Context, ctx => ctx.theme)
}

useColor() {
  return useContextSelector(Context, ctx => ctx.theme.color)
}
```

这就是 Dan 在写“**你必须事先精确知道你在选择什么**”时的意思。在上面的实现中， `useColor` 的作者必须知道颜色值存在于 `ctx.theme.color` 。如果作者尝试像这样从 `useTheme` 的返回值中组合 `useColor` ：

```tsx
useTheme() {
  return useContextSelector(Context, ctx => ctx.theme)
}

// ❌ completely defeats the purpose of using a selector function to prevent
// re-renders since `useColor` will now re-render when any portion of `ctx.theme`
// changes!!
useColor() {
  return useTheme().color
}
```

`useColor` 现在会在 `ctx.theme` 的无关部分发生变化时触发重新渲染，尽管它只需要访问 `ctx.theme.color` 。

Dan 是对的。在 RFC 119 中概述的选择器方法的一个主要缺点是缺乏可组合性。

但我无法摆脱这样一种感觉：如果可组合性确实是使用上下文选择器的主要问题，那么肯定可以通过增加一个额外的抽象层来解决这个问题。我还没准备好承认直接使用 `React.useMemo` 就是答案。

## 构建一个可组合的 `useContextSelector`

我有些空闲时间，决定用来编写一些代码来回应 Dan 对 `useContextSelector` 缺乏可组合性的批评。成果在这里：[https://github.com/InterBolt/selectable](https://github.com/InterBolt/selectable)。

让我们用它来重新创建上面的 `useColor/useTheme` 示例：

```tsx
import selectable from "@interbolt/selectable";

const useContextSelector = selectable(Context);
const useThemeSelector = useContextSelector.narrow((ctx) => ctx.theme);
// COMPOSABLE!!!
const useColorSelector = useThemeSelector.narrow((theme) => theme.color);

// and we can use them likeso:
const fonts = useThemeSelector((theme) => theme.fonts);
const color = useColorSelector();
```

上述的 `selectable` API 创建了一个基础上下文选择器钩子，并确保通过附加的 `narrow` 方法创建的任何钩子返回一个新的钩子，其选择器参数只需要知道上下文的“缩小”部分。

> 请注意：由于在 JS 中函数本身就是对象，因此完全可以给 React 钩子附加属性，比如 `narrow` 方法。

The `selectable` 抽象还处理在进一步“缩小”上下文时组合任意数量的钩子和上下文

```tsx
import selectable from "@interbolt/selectable";

const useContextSelector = selectable(Context);
const useTheme = useContextSelector.narrow((ctx) => ctx.theme);

// Can narrow with `useUserHook` and `SomeOtherContext` too
const useDerivedSelector = useTheme.narrow(
  useUserHook,
  SomeOtherContext,
  (userHookReturnValue, someOtherContext, theme) =>
    someSelectionFunction(theme, someOtherContext, userHookReturnValue)
);
```

对于好奇的人来说，这里是 `selectable` 的源代码：

```tsx
import React from "react";
import useFutureMemoShim from "./useFutureMemoShim.jsx";
import useFutureShim from "./useFutureShim.jsx";

const getIsCtx = (val) => {
  return (
    typeof val === "object" && val["$$typeof"] === Symbol.for("react.context")
  );
};

const buildHook = (ctxOrHook) => {
  if (getIsCtx(ctxOrHook)) {
    return () => useFutureShim(ctxOrHook);
  }
  return ctxOrHook;
};

const selectable = (rootHookOrCtx = null) => {
  const rootHook = buildHook(rootHookOrCtx);

  const nextNarrow =
    (accumNarrowHooks = [], accumSelectors = []) =>
    (...args) => {
      const nextSelector = args.at(-1);
      const nextNarrowHooks = args.slice(0, -1).map((a) => buildHook(a));
      const nextAccumSelectors = accumSelectors.concat([nextSelector]);
      const nextAccumNarrowHooks = accumNarrowHooks.concat([nextNarrowHooks]);

      const useSelector = (hookSelector = (a) => a) =>
        useFutureMemoShim(() => {
          const rootVal = rootHook();
          const hookOutputs = [];
          let selected = rootVal;

          nextAccumSelectors.forEach((selector, i) => {
            nextAccumNarrowHooks[i].forEach((hook) => {
              hookOutputs.push(hook());
            });
            selected = selector(...hookOutputs, selected, rootVal);
            hookOutputs.length = 0;
          });

          return hookSelector(selected, rootVal);
        }, []);

      useSelector.narrow = nextNarrow(
        nextAccumNarrowHooks,
        nextAccumSelectors
      );
      return useSelector;
    };

  return nextNarrow()((a) => a);
};

export default selectable;
```

兴奋地发现我已经“解决”了可组合性问题，我回到 Twitter 分享了我的工作。我必须说，Dan 真的是不放过任何机会。我的帖子发出仅几分钟，我就收到通知，他回复了。

![](https://img.alicdn.com/imgextra/i1/O1CN01LgfSU81Pl5WLYr6Si_!!6000000001880-49-tps-1598-702.webp)

[推文来源](https://twitter.com/dan_abramov2/status/1742676502582567084)

我既感到受宠若惊，也感到失望。以下是我的回复：

![](https://img.alicdn.com/imgextra/i2/O1CN01aWSkv61ZzsT4TLoJh_!!6000000003266-49-tps-1582-642.webp)

[推文来源](https://twitter.com/interbolt_colin/status/1742682726514266596)

我的回答承认了我基本上做所有这些都是为了避免直接使用 `React.useMemo` 。但直到他接下来的两条评论，我才完全接受了他的观点：

First: 首先：

![](https://img.alicdn.com/imgextra/i2/O1CN01f3moez1SVvFnJPvXk_!!6000000002253-49-tps-1490-612.webp)

[推文来源](https://twitter.com/dan_abramov2/status/1742685262721794120)

然后（这两者之间有一点来回）：

![](https://img.alicdn.com/imgextra/i1/O1CN01GRjuYR1oj8DrRPWmP_!!6000000005260-49-tps-1194-400.webp)

[推文来源](https://twitter.com/dan_abramov2/status/1742685388295340291)

他首次关于编译器的推文是指，如果 **React Forget** —— Meta 正在内部测试的编译器，不久将会自动注入那些抽象，那么仅仅为了避免 `useMemo` 而编写抽象是一个非常糟糕的主意。

想象一下，如果 **React Forget** 已经存在，我的 `selectable` API 就不再必要了。

编写一个 codemod 来更改这个：

```tsx
import selectable from "@interbolt/selectable";

const useContextSelector = selectable(Context);
const useTheme = useContextSelector.narrow((ctx) => ctx.theme);

const selectedValue = useTheme(someSelectionFunction);
```

到：

```tsx
const { theme } = use(Context);

const selectedValue = someSelectionFunction(theme);
```

比编写一个 codemod 来更改这个要困难得多：

```tsx
React.useMemo(() => {
  const { theme } = use(Context);
  return someSelectionFunction(theme);
}, [someSelectionFunction]);
```

到：

```tsx
const { theme } = use(Context);
const selectedValue = someSelectionFunction(theme);
```

后续的 codemod 可以简单地移除 `useMemo` 并结束工作。但是一个要摒弃 `selectable` 和 `narrow` API 的 codemod 必须准确理解我的库是如何工作的。

尽管我个人对 `useMemo` 有成见，**但 Dan Abramov 这次又说对了**。

## 结论

这一切都是为了说，React 即将迎来一些激动人心的更新，这些更新将消除对 RFC 119 和 `use-context-selector` 风格上下文选择器的需求。 `React.useMemo` + `React.use` 将基于 `useMemo` 函数内返回的值提供智能重渲染，并且，最终 **React Forget** 将完全消除对 `useMemo` 和 `useCallback` 的需求。如果编译器附带了一个 codemod，开发者可以通过简单运行一个命令来消除大量的记忆化杂质。

在短短几天内，我从对 React 核心团队从未合并 RFC 119 感到沮丧，转变为感激他们没有合并。React 的未来是光明的，我越来越有信心，基于它来构建是正确的举动。

这就是全部了。我提供 React/NextJS 咨询/合同工作，如有任何问题或询问，请随时通过 [cc13.engineering@gmail.com](mailto:cc13.engineering@gmail.com) 给我发送电子邮件。
