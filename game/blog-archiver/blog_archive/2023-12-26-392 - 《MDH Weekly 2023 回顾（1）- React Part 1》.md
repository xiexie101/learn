---
title: "392 - 《MDH Weekly 2023 回顾（1）- React Part 1》"
date: 2023-12-26
url: https://sorrycc.com/mdh-2023-review-1-react
---

发布于 2023年12月26日

# 392 - 《MDH Weekly 2023 回顾（1）- React Part 1》

> 年底了，做下 MDH Weekly 一年的文章回顾。我把今年周刊里的文章重新理了一遍，删选了觉得目前看仍旧有价值的文章，做了下分类并重新翻了一遍。以下是 React 的部分。

1、ref 属性除了和 useRef 结合使用外，容易忽略的是他还可以作为 callback 使用，比如 `<div ref={(el) => {}} />`，其在 DOM 元素创建和删除时被调用，删除时传入 null。一些应用场景包括，1）DOM 元素挂载时滚动到该元素，比如 `<li ref={isLast ? scrollTo : undefined} />`，2）测量 DOM 元素尺寸，比如 `<div ref={measureRef} />`，3）Modal + createPortal 创建模态窗，`<div ref={setModalElement} />`。详见 [https://julesblom.com/writing/ref-callback-use-cases#4-share-the-dom-ref](https://julesblom.com/writing/ref-callback-use-cases#4-share-the-dom-ref)

2、关于受控和不受控。1）简单说，就是「是否受控」即「表单元素的值是否由 React 控制」，2）一个注意点，受控的初始值如果为空，要给空字符串而不要给 undefined，比如 `const [val, setVal] = useState()`，val 为 undefined 会让表单元素变成不受控，3）当需要唯一 id 时，比如用于可访问性和可用性的 htmlFor，可以用 `useId()` 生成，好处是 SSR 友好、多实例友好、re-render 稳定等。详见 [https://www.joshwcomeau.com/react/data-binding/](https://www.joshwcomeau.com/react/data-binding/)

3、如何在 React 中实现 debounce，代码如下。如果你手写 debounce，可能会遇到几个坑，1）如果只有 delay 效果而没有 debounce 效果，那通常是因为 debounce() 每次 re-render 时都被调用了，而 debounce() 理论上只应该被调一次，所以用 useMemo() + 空依赖以避免重复执行，2）如果 callback 里取 React 的 state 或 props，始终是初始值，那说明 callback 没有在 re-render 时被刷新，那需要用 useRef + useEffect，当 callback 更新时刷新 ref。详见 [https://www.developerway.com/posts/debouncing-in-react](https://www.developerway.com/posts/debouncing-in-react)

```tsx
const useDebounce = (callback) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = callback;
  }, [callback]);
  const debouncedCallback = useMemo(() => {
    const func = () => {
      ref.current?.();
    };
    return debounce(func, 1000);
  }, []);
  return debouncedCallback;
};
```

4、关于错误处理。直接 try…catch 会有不少限制，但使用 React 官方的 ErrorBoundary 也有不少限制。这个限制是，React生命周期之外的错误不捕获，比如 resolved promises, async code with setTimeout, various callbacks and event handlers。怎么解？dan 给了个 [Hack 方案](https://github.com/facebook/react/issues/14981#issuecomment-468460187)，简单说就是 `try {} catch(e) { setState(() => throw e) }`。基于此，我们可以稍微封装下，比如 `useThrowAsyncError` 或 `useCallbackWithErrorHandling`，这样就不需要每次声明一个新的 setState 了。同时也可以考虑用 [bvaughn/react-error-boundary](https://github.com/bvaughn/react-error-boundary) 。详见 [https://www.developerway.com/posts/how-to-handle-errors-in-react](https://www.developerway.com/posts/how-to-handle-errors-in-react)

5、关于 useImperativeHandle。useImperativeHandle 通常与 forwardRef 一起用，将 ref 传给函数组件，并在组件内决定暴露哪些属性。几个应用场景，1）不想暴露 input 的整个 DOM 节点，只想暴露 focus 方法时，见下方代码，2）对外暴露命令式方法，比如你有一个轮播组件，它有前翻和后翻按钮，如果你想从父组件跳转到不同的幻灯片但又想保持组件不受控，可以用 useImperativeHandle（当然，改用 props 受控是更合理的做法）。详见 [https://prateeksurana.me/blog/fine-tuning-refs-with-useimperativehandle/](https://prateeksurana.me/blog/fine-tuning-refs-with-useimperativehandle/)

```tsx
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    }
  }));
  return <input ref={inputRef} />;
});
```

6、React 中的陈旧闭包问题。1）当我们使用 useEffect、useCallback、useMemo、useRef 等 hook 时，由于传入的是函数，所以会产生闭包，而一旦我们因为遗忘或者错误的性能优化少传了依赖项，就会产生陈旧闭包问题，2）解法是用 ref + useEffect，代码如下，好处是，HeavyComponentMemo 由于缓存了 onClick 所以不会重复 re-render、useEffect 无依赖所以每次都会更新 ref 闭包到最新以让其 console.log(value) 的 value 始终是最新的。详见 [https://www.developerway.com/posts/fantastic-closures](https://www.developerway.com/posts/fantastic-closures)

```tsx
const Form = () => {
  const [value, setValue] = useState();
  const ref = useRef();
  useEffect(() => {
    ref.current = () => {
      console.log(value);
    };
  });
  const onClick = useCallback(() => {
    ref.current?.();
  }, []);
  return (
    <>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <HeavyComponentMemo title="Foo" onClick={onClick} />
    </>
  );
};
```

7、关于 useTransition。1）useTransition 和 useDeferredValue 日常项目最好别用，如果对 re-render、memo 等理解不够透，可能会比用之前效果还糟糕，2）useTransition 可用于重型 render 组件，但请记住「useTransition 会导致两次 re-render」，所以记得和 React.memo 搭配使用，3）useTransition 可用于防抖？比如 input 输入框 onChange 时向后端发送请求的防抖。答案是不行，过程不太可控，还是老老实实用 lodash.debounce 吧。详见 [https://www.developerway.com/posts/use-transition](https://www.developerway.com/posts/use-transition)

8、React 18 的并发。1）在 React 18 之前，React 中所有更新都是同步的。React 18 引入了两种类型的更新：紧急更新和过渡更新。为了兼容，默认所有更新都是紧急的，不能被中断；过渡是低优先级的更新，可以被中断，通过 startTransition 或 useDeferredValue 进行标记。2）由于 React 只能在组件渲染之间处理并发，所以并发对 2 个 300ms+ 的重组件效果并不好，而对于 20 个 30ms 的组件渲染效果会不错，3）当 Suspense 遇到过渡更新，在更新过程中，Suspense 内如果无内容会显示 fallback 内容，如果有内容则不会显示 fallback 而是继续保留现有内容。详见 [https://sinja.io/blog/guide-to-concurrency-in-react-18](https://sinja.io/blog/guide-to-concurrency-in-react-18)

9、关于 React 设计模式。1）Container & presentation 模式（过时，用 Hooks 代替），2）hooks 组装模式，3）用 Reducer 做状态管理，4）用 Provider 做数据管理，5）用 HOC 增强组件（大部分场景下已过时，用 Hooks 代替），6）复合组件，将父组件拆分成更小的组件，然后通过 props、context 或其他 React 数据管理技术来管理这些更小组件之间的交互，7）Props 组合，当要向子组件传递大量属性时，先用对象声明，然后用 `{…xxxProps}` 传递，8）受控表单，9）forwardRefs，让父组件访问到子组件的 ref，从而获取底层 DOM 节点或组件实例。详见 [https://dev.to/refine/react-design-patterns-230o](https://dev.to/refine/react-design-patterns-230o)

10、关于 Suspense 和 use。1）Suspense 的几个场景包括，a. 用 React.lazy 懒加载组件，b. 使用支持 Suspense 的数据加载库或使用 use，c. SSR 实现流式渲染等，2）Suspense 的几个好处包括，a. 简化写法，不用写 isLoading 和 error 逻辑，b. 流式 SSR，渐进式加载，c. 选择性注水，3）use 目前 canary 可用，可用于读取 context 和 promise，前者类 useContext，后者用于数据加载，4）基于 use 和 Suspense，我们可以自行实现 React.lazy 和 OffScreen。详见 [https://sinja.io/blog/guide-to-react-suspense](https://sinja.io/blog/guide-to-react-suspense)
