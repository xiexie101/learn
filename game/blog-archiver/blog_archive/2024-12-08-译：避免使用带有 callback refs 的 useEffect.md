---
title: "译：避免使用带有 callback refs 的 useEffect"
date: 2024-12-08
url: https://sorrycc.com/avoiding-use-effect-with-callback-refs
---

发布于 2024年12月17日

# 译：避免使用带有 callback refs 的 useEffect

> 原文：[https://tkdodo.eu/blog/avoiding-use-effect-with-callback-refs](https://tkdodo.eu/blog/avoiding-use-effect-with-callback-refs)  
> 作者：TkDodo  
> 译者：ChatGPT 4 Turbo

**编者注：1）如果你需要在它们渲染后直接与 DOM 节点交互，请尝试不要直接跳到 _useRef_ + _useEffect_，而是考虑使用 _callback refs_ 替代，2）所有 ref 属性都只是函数。**

**最后更新：2024-12-08**  
**注意：这篇文章假设你已经对 React 中的 _refs_ 有基本的了解。**

即使 refs 是可变容器，我们理论上可以存储任意值，它们最常用于获取 DOM 节点的访问权限：

```jsx
const ref = React.useRef(null)

return <input ref={ref} defaultValue="Hello world" />
```

`ref` 是内置原始值上的一个保留属性，React 会在渲染后在其中存储 DOM 节点。当组件被卸载时，它会被重置为 _null_。

## 与 refs 交互

对于大多数交互，您不需要访问底层 DOM 节点，因为 React 会自动为我们处理更新。管理焦点是您可能需要 ref 的一个好例子。

有一个 [很好的 RFC](https://github.com/devongovett/rfcs-1/blob/patch-1/text/2019-focus-management.md) 来自 [Devon Govett](https://twitter.com/devongovett)，提议向 react-dom 添加 FocusManagement 功能，但现在，React 中没有任何东西可以帮助我们做到这一点。

### 使用 effect 设置焦点

那么，你现在如何在输入元素渲染后设置焦点呢？（我知道 [autofocus](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) 存在，这只是一个例子。如果这让你感到困扰，想象你想要代替地对节点进行动画处理。）

嗯，我看到的大多数代码都尝试这么做：

```jsx
const ref = React.useRef(null)

React.useEffect(() => {
  ref.current?.focus()
}, [])

return <input ref={ref} defaultValue="Hello world" />
```

这基本上是没问题的，并不违反任何规则。空依赖数组是可以接受的，因为里面唯一使用的是 ref，而 ref 是稳定的。Linter 不会因为将它添加到依赖数组中而发出警告，且 ref 也不会在渲染期间被读取（这可能会与并发 React 功能带来的问题相冲突）。

效果将在 “挂载时” 运行一次（[在严格模式下运行两次](https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state)）。到那时，React 已经用 DOM 节点填充了 ref，所以我们可以聚焦它。

然而，这并非最佳实践，且在一些更高级的场景中有一些注意事项。

具体来说，它假设当 effect 运行时，ref 已经“填充”。如果它不可用，例如因为你将 ref 传递给了一个自定义组件，该组件将推迟渲染或仅在其他用户交互后显示输入，当 effect 运行时 ref 的内容仍然是 _null_，没有任何东西会被聚焦：

```jsx
function App() {
  const ref = React.useRef(null)

  React.useEffect(() => {
    // 🚨 当这段代码运行时，ref.current 总是 null
    ref.current?.focus()
  }, [])

  return <Form ref={ref} />
}


const Form = React.forwardRef((props, ref) => {
  const [show, setShow] = React.useState(false)

  return (
    <form>
      <button type="button" onClick={() => setShow(true)}>
        show
      </button>
      // 🧐 ref 被附加到输入框上，但它是有条件渲染的
      // 所以当上面的 effect 运行时它不会被填充
      {show && <input ref={ref} />}
    </form>
  )
})
```

这里发生了什么：

*   _Form_ 渲染。
*   _input_ 没有被渲染，_ref_ 仍然是 _null_。
*   effect 运行，什么也没做。
*   输入显示了，_ref_ 将被填充，但由于 effect 不会再次运行，所以不会被聚焦。

问题在于 effect “绑定”在了 Form 的渲染函数上，而我们实际上想要表达的是：“当输入框被渲染时聚焦输入框”，而不是“当表单挂载时”。

## 回调 refs

这就是回调 refs 发挥作用的地方。如果你曾经查看过 [refs 的类型声明](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/fc9b16957473f81a1d708e6948b8d61e292aeb58/types/react/v17/index.d.ts#L85)，我们可以看到我们不仅可以传递一个 ref 对象，还可以传递一个函数：

```ts
type Ref<T> = RefCallback<T> | RefObject<T> | null
```

从概念上讲，我喜欢将 React 元素上的 refs 视为组件渲染后调用的函数。这个函数将渲染的 DOM 节点作为参数传递。如果 React 元素卸载，它将再次被调用，并传递 _null_。

因此，将 _useRef_（一个 RefObject）的 ref 传递给一个 React 元素，只是下面写法的语法糖：

```jsx
<input
  ref={(node) => {
    ref.current = node;
  }}
  defaultValue="Hello world"
/>
```

让我再次强调一遍：

> **所有的 ref 属性都只是函数！**

这些函数在渲染后运行，这时执行副作用是完全没问题的。也许如果 _ref_ 被命名为 _onAfterRender_ 或类似的名称会更好。

有了这个知识，当我们在回调 ref 中直接访问到节点时，还有什么能阻止我们让输入框立刻获得焦点呢？

```jsx
<input
  ref={(node) => {
    node?.focus()
  }}
  defaultValue="Hello world"
/>
```

嗯，有一个微小的细节会阻止我们：React 会在 _每次_ 渲染后运行这个函数。所以，除非我们愿意这么频繁地让我们的输入框获得焦点（通常我们不愿意），我们必须告诉 React 仅在我们希望的时候运行它。

### useCallback 来救场

> 更新
> 
> 对于这些情况使用 `useCallback` 的看法有了一些变化。我将保留这篇文章的原样以供参考，但请阅读 [译：Ref Callbacks, React 19 and the Compiler](https://sorrycc.com/ref-callbacks-react-19-and-the-compiler) 以获得完整的视角。

幸运的是，React 使用引用稳定性来检查是否应运行回调 ref。这意味着，如果我们传递给它相同的 ref（引用，有意的双关语），就会跳过执行。

这就是 _useCallback_ 发挥作用的地方，因为这就是我们确保函数不被无谓创建的方式。也许这就是为什么它们被称为回调-refs - 因为你不得不一直将它们包裹在 _useCallback_ 中。😂

以下是最终的解决方案：

```jsx
const ref = React.useCallback((node) => {
  node?.focus();
}, []);

return <input ref={ref} defaultValue="Hello world" />;
```

与初始版本相比，这里的代码更少，只使用了一个钩子而不是两个。另外，由于回调 ref 绑定到 DOM 节点的生命周期，而不是挂载它的组件的生命周期，所以它将在所有情况下都能正常工作。此外，它在严格模式下（在开发环境中运行时）不会执行两次，这对许多人来说似乎很重要。

正如在（旧的）React 文档中的这个[隐藏的宝石](https://reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node)所展示的，你可以使用它来运行任何类型的副作用，例如，在其中调用 _setState_。我将把这个例子放在这里，因为它实际上非常好：

```jsx
function MeasureExample() {
  const [height, setHeight] = React.useState(0);

  const measuredRef = React.useCallback(node => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  }, []);

  return (
    <>
      <h1 ref={measuredRef}>Hello, world</h1>
      <h2>The above header is {Math.round(height)}px tall</h2>
    </>
  );
}
```

所以，请如果你需要在它们渲染后直接与 DOM 节点交互，请尝试不要直接跳到 _useRef_ + _useEffect_，而是考虑使用 _callback refs_ 替代。
