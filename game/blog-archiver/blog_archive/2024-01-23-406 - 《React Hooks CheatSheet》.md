---
title: "406 - 《React Hooks CheatSheet》"
date: 2024-01-23
url: https://sorrycc.com/react-hooks-cheatsheet
---

发布于 2024年1月23日

# 406 - 《React Hooks CheatSheet》

## State

1、**`useState()`**，声明一个状态变量。

```ts
const [age, setAge] = useState(42);
```

2、**`useReducer()`**，声明一个状态变量，使用 reducer 函数更新状态。

```ts
const [state, dispatch] = useReducer(reducer, { age: 42 });
```

## Context

1、**`useContext()`**，读取和订阅 context。

```ts
const theme = useContext(ThemeContext);
```

## Effect

1、**`useEffect()`**，同步外部系统。

```ts
useEffect(() => {
  const unsubscribe = socket.connect(props.userId);
  return () => {
    unsubscribe();
  };
}, [props.userId]);
```

2、**`useLayoutEffect()`**，类 useEffect 但在浏览器重绘之前触发。

```ts
useLayoutEffect(() => {
  // 读取 DOM 布局
}, []);
```

3、**`useInsertionEffect()`**，CSS-in-JS 库用来注入样式。

```ts
useInsertionEffect(() => {
  // 注入样式
}, []);
```

## Performance

1、**`useCallback()`**，缓存函数。

```ts
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

2、**`useMemo()`**，缓存值。

```ts
const value = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

3、**`useTransition()`**，不阻塞用户交互的状态更新。

```ts
const [isPending, startTransition] = useTransition();
startTransition(() => {
  setCount(count + 1);
});
```

4、**`useDeferredValue()`**，延迟更新。

```ts
const deferredValue = useDeferredValue(value);
```

## Refs

1、**`useRef()`**，声明一个 ref。

```ts
const inputRef = useRef(null);
```

2、**`useImperativeHandle()`**，自定义 ref 的暴露方式。

```ts
useImperativeHandle(ref, () => ({
  focus: () => {
    // ...
  },
}));
```

## Resource

1、**`use()`**，挂起 Promise 或读取 context，可以在条件或循环里使用。

```ts
const message = use(messagePromise);
const theme = use(ThemeContext);
```

## Form

1、**`useFormState()`**，获取 Form Action 结果。

```ts
const [state, formAction] = useFormState(fn, initialState);
```

注：已更名为 useActionState，见 [https://github.com/facebook/react/pull/28491](https://github.com/facebook/react/pull/28491) 。

2、**`useFormStatus()`**，获取 Form Action 状态。

```ts
const { pending, data, method, action } = useFormStatus();
```

3、**`useOptimistic()`**，乐观更新 UI。

```ts
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);
```

## Other

1、**`useId()`**，生成跨 server 和 client 的唯一 ID。

```ts
const id = useId();
```

2、**`useDebugValue()`**，在 React DevTools 中显示自定义 hook 的标签。

```ts
useDebugValue('Custom Label');
```

3、**`useSyncExternalStore()`**，订阅外部存储。

```ts
const state = useSyncExternalStore(subscribe, getSnapshot);
```

参考：  
[https://twitter.com/\_georgemoller/status/1748347605606600820](https://twitter.com/_georgemoller/status/1748347605606600820)  
[https://twitter.com/rickhanlonii/status/1747333623152275685](https://twitter.com/rickhanlonii/status/1747333623152275685)  
[https://react.dev/reference/react/hooks](https://react.dev/reference/react/hooks)
