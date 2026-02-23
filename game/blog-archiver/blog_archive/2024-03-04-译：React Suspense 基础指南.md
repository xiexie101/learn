---
title: "译：React Suspense 基础指南"
date: 2024-03-04
url: https://sorrycc.com/a-fundamental-guide-to-react-suspense
---

发布于 2024年3月4日

# 译：React Suspense 基础指南

> 原文：[https://www.chakshunyu.com/blog/a-fundamental-guide-to-react-suspense/](https://www.chakshunyu.com/blog/a-fundamental-guide-to-react-suspense/)  
> 作者：Chak Shun Yu  
> 译者：ChatGPT 4 Turbo

React 18 将发布的另一个重大特性是 Suspense。如果你在 React 开发领域已经有较长时间了，那么你会知道 Suspense 特性并不是特别新。早在 2018 年，Suspense 就作为实验性特性的一部分发布在 React 版本 16.6 中。那时，它主要针对的是结合 `React.lazy` 进行代码分割的处理。

但现在，随着 React 18 的发布，Suspense 的正式版已经摆在我们面前。与[并发渲染](https://www.chakshunyu.com/blog/an-introductory-guide-to-concurrent-rendering/)的发布一起，Suspense 的真正威力终于被释放。Suspense 与并发渲染之间的交互为改善用户体验打开了巨大的世界。

但就像所有功能一样，就像并发渲染一样，从基础开始是很重要的。究竟什么是 Suspense？我们为什么需要 Suspense？Suspense 是如何解决那个问题的？它有什么好处？为了帮助你理解这些基础知识，本文将详细回答这些问题，并为你提供关于 Suspense 主题的坚实知识基础。

## 什么是 Suspense？

本质上，Suspense 是一种机制，用于让 React 开发者向 React 表示一个组件正在等待数据准备就绪。然后 React 知道它应该等待数据被获取。与此同时，会向用户显示一个回退内容，并且 React 将继续渲染应用程序的其余部分。在数据准备好之后，React 将回到那个特定的 UI，并相应地更新它。

从根本上来说，这与 React 开发者目前必须实现数据获取流程的方式并没有太大不同：使用某种状态来指示组件是否仍在等待数据，一个 `useEffect` 来启动数据获取，根据数据的状态显示加载状态，以及在数据准备好后更新 UI。

但在实践中，Suspense 在技术上完全不同地实现了这一点。与上述数据获取流程相反，Suspense 与 React 深度集成，允许开发者更直观地编排加载状态，并避免竞态条件。为了更好地理解这些细节，了解我们为什么需要 Suspense 是很重要的。

## 为什么我们需要 Suspense？

在没有 Suspense 的情况下，实现数据获取流程主要有两种方法：fetch-on-render 和 fetch-then-render。然而，这些传统的数据获取流程存在一些问题。要理解 Suspense，我们必须深入了解这些流程的问题和局限性。

### Fetch-on-render

大多数人会像之前提到的那样，使用 `useEffect` 和状态变量来实现数据获取流程。这意味着只有当组件渲染时，数据才开始获取。所有的数据获取都发生在组件的效果和生命周期方法中。

这种方法的主要问题在于，组件只在渲染时触发数据获取，异步的特性迫使组件必须等待其他组件的数据请求。

假设我们有一个组件 `ComponentA` ，它负责获取一些数据并具有加载状态。在内部， `ComponentA` 还渲染了另一个组件 `ComponentB` ，它也会自行执行一些数据获取操作。但由于数据获取的实现方式， `ComponentB` 只有在被渲染后才开始获取其数据。这意味着它必须等到 `ComponentA` 完成数据获取后，然后才渲染 `ComponentB` 。

这导致了一种瀑布式方法，其中组件之间的数据获取是顺序发生的，这本质上意味着它们在阻塞彼此。

```tsx
function ComponentA() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAwesomeData().then(data => setData(data));
  }, []);

  if (user === null) {
    return <p>Loading data...</p>;
  }

  return (
    <>
      <h1>{data.title}</h1>
      <ComponentB />
    </>
  );
}

function ComponentB() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchGreatData().then(data => setData(data));
  }, []);

  return data === null ? <h2>Loading data...</h2> : <SomeComponent data={data} />;
}
```

### Fetch-then-render

为了防止组件之间数据获取的顺序阻塞，一种替代方案是尽可能早地开始所有数据的获取。因此，不是让组件在渲染时负责处理数据获取，并且所有数据请求都分开进行，而是在树开始渲染之前就启动所有请求。

这种方法的优势在于所有数据请求是一起发起的，因此 `ComponentB` 不必等待 `ComponentA` 完成。这解决了组件依次阻塞彼此数据流的问题。然而，它引入了另一个问题，我们必须等待所有数据请求完成后才能为用户渲染任何内容。可以想象，这不是最佳体验。

```tsx
// Start fetching before rendering the entire tree
function fetchAllData() {
  return Promise.all([
		fetchAwesomeData(),
		fetchGreatData()
  ]).then(([awesomeData, greatData]) => ({
    awesomeData,
		greatData
  }))
}

const promise = fetchAllData();

function ComponentA() {
  const [awesomeData, setAwesomeData] = useState(null);
  const [greatData, setGreatData] = useState(null);

  useEffect(() => {
    promise.then(({ awesomeData, greatData }) => {
      setAwesomeData(awesomeData);
      setGreatData(greatData);
    });
  }, []);

  if (user === null) {
    return <p>Loading data...</p>;
  }

  return (
    <>
      <h1>{data.title}</h1>
      <ComponentB />
    </>
  );
}

function ComponentB({data}) {
  return data === null ? <h2>Loading data...</h2> : <SomeComponent data={data} />;
}
```

## Suspense 如何解决数据获取问题？

本质上，fetch-on-render 和 fetch-then-render 的主要问题在于我们试图强制同步两个不同的流程，即数据获取流程和 React 生命周期。有了 Suspense，我们采用了一种不同的数据获取方法，即所谓的 render-as-you-fetch 方法。

```tsx
const specialSuspenseResource = fetchAllDataSuspense();

function App() {
  return (
    <Suspense fallback={<h1>Loading data...</h1>}>
      <ComponentA />
      <Suspense fallback={<h2>Loading data...</h2>}>
        <ComponentB />
      </Suspense>
    </Suspense>
  );
}

function ComponentA() {
  const data = specialSuspenseResource.awesomeData.read();
  return <h1>{data.title}</h1>;
}

function ComponentB() {
	const data = specialSuspenseResource.greatData.read();
  return <SomeComponent data={data} />;
}
```

与之前的实现不同的是，它允许组件在 React 到达时立即开始数据获取。这甚至在组件渲染之前就发生了，而且 React 不会就此停止。然后它继续评估组件的子树，并在等待数据获取完成时继续尝试渲染它。

这意味着 Suspense 不会阻塞渲染，这也就意味着子组件不必等待父组件完成后才开始发起数据获取请求。React 会尽可能多地进行渲染，同时发起适当的数据获取请求。请求完成后，React 将重新访问相应的组件，并使用新收到的数据相应地更新 UI。

## Suspense 的好处是什么？

Suspense 带来了许多好处，特别是对用户体验而言。但是，其中一些好处也涵盖了开发者体验。

*   尽早开始获取数据。Suspense 引入的按需渲染方法最大且最直接的好处是，数据获取尽可能早地启动。这意味着用户等待的时间更短，应用程序的速度更快，这对任何前端应用程序都是普遍有益的。
*   更直观的加载状态。使用 Suspense 后，组件不再需要包含大量的 if 语句或分别跟踪状态来实现加载状态。相反，加载状态被集成到它所属的组件本身中。这使得组件更加直观，因为加载代码与相关代码保持紧密联系，并且更具可重用性，因为加载状态已包含在组件中。
*   避免竞态条件。我在本文中没有深入讨论的现有数据获取实现的问题之一就是竞态条件。在某些情况下，传统的渲染时获取和获取后渲染实现可能会因为不同因素（如时序、用户输入和参数化数据请求）而导致竞态条件。主要的底层问题是我们试图强制同步两个不同的过程，React 的和数据获取。但是使用 Suspense，这可以更优雅且集成地完成，从而避免了上述问题。
*   更加集成的错误处理。通过使用 Suspense，我们基本上为数据请求流创建了边界。除此之外，因为 Suspense 使得与组件代码的集成更加直观，它允许 React 开发者也为 React 代码和数据请求实现更加集成的错误处理。

## 最终想法

React Suspense 已经进入人们视野超过 3 年了。但随着 React 18 的到来，官方发布的日期越来越近。与并发渲染相邻，它将成为此次 React 发布中最大的特性之一。单独来看，它可以将数据获取和加载状态的实现提升到一个新的直观性和优雅性水平。

为了帮助您理解 Suspense 的基础知识，本文涵盖了几个重要的问题和方面。这包括了解什么是 Suspense，为什么我们一开始就需要像 Suspense 这样的东西，它是如何解决某些数据获取问题的，以及使用 Suspense 所带来的所有好处。
