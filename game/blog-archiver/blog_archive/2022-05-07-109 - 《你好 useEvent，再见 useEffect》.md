---
title: "109 - 《你好 useEvent，再见 useEffect》"
date: 2022-05-07
url: https://sorrycc.com/use-event
---

发布于 2022年5月7日

# 109 - 《你好 useEvent，再见 useEffect》

109 - 《你好 useEvent，再见 useEffect》

React 团队发布一个 RFC，提供 useEvent hook，解 hooks 存在的闭包陷阱问题。主要应该是代替 useEffect。useEffect 里的每个值都是依赖，依赖变了 useEffect 重新执行，但一些场景下从需求上来看并不需要重新执行。现在虽然结合 useMemo、useRef 和 useCallback 也能解，但比较繁琐。

注：useEvent 目前尚未发布。

下面通过 3 个例子来看下 useEvent 的使用场景。

1、比如埋点场景。埋点依赖了 url 和 name，只有 url 变化了才需要重新埋点，name 变更并不需要重新触发埋点。

正常这样写，但是 url 和 name 的变更都会导致重新触发埋点。

```tsx
useEffect(() => { bacon('visit_page', url, name) }, [url, name]];
```

大家通常想到会删除 useEffect 的依赖参数，但使用 hooks 都会加上官方的 eslint 插件，这时 eslint 会报错。而为啥不能禁用 lint，因为禁用可能导致更大的问题。

```tsx
useEffect(() => { bacon('visit_page', url, name) }, [url]];
```

现有框架下，能想到的解法是用 ref 让 useEffect 只在 url 变更时执行。能用，但看起来很 hack。

```tsx
const urlRef = useRef(url);
useEffect(() => {
  if (urlRef.current === url) return;
  bacon('visit_page', url, name);
  urlRef.current = url;
}, [url, name]];
```

基于 useEvent 的解法是。

```tsx
const onVisit = useEvent(url => {
  bacon('visit_page', url, name);
});
useEffect(() => onVisit(url), [url]);
```

2、比如定时器的场景。期望是没 1s 保存下文件到草稿，但实际上每次输入后 text 变更，然后定时器会被重新触发。

```tsx
useEffect(() => {
  const id = setInterval(() => { saveDraft(text) }, 1000);
  return () => clearInterval(id);
}, [text]);
```

删除 useEffect 的依赖能解吗？不能。因为 text 不更新了，saveDraft 拿到的 text 始终是最开始的那一份。

```tsx
useEffect(() => {
 const id = setInterval(() => { saveDraft(text) }, 1000);
}, []);
```

现有框架下的解法是用 useRef 保存 onTick 方法，然后用 useEffect 不加第二个参数在 didMount 和 didUpdate 时更新 onTick 方法，这样每次 setInterval 里调用的始终是最新的 onTick，拿到的 text 也是最新的。

```tsx
const onTickHref = useRef();
const onTick =() => saveDraft(text);
useEffect(() => {
  onTickHref.current = onTick;
});
useEffect(() => {
  const id = setInterval(() => onTickHref.current(), 1000);
  return () => clearInterval(id);
}, []);
```

基于 useEvent 的解法是，把对于 text 的依赖提到 useEvent 里。

```tsx
const onTick = useEvent(() => saveDraft(text));
useEffect(() => {
  const id = setInterval(() => onTick, 1000);
  return () => clearInterval(id);
}, []);
```

3、官方 RFC 的例子。

每次渲染时，onClick 都会生成新的引用，所以 SendButton 会重新渲染。

```tsx
function Chat() {
  const [text, setText] = useState('');
  const onClick = () => {
    sendMessage(text);
  };
  return <SendButton onClick={onClick} />;
}
```

为了减少 SendButton 不必要的 rerender，通常会组件加 React.memo，并给 onClick 加 useCallback。

```tsx
const MSendButton = React.memo(SendButton);
function Chat() {
  const [text, setText] = useState('');
  const onClick = useCallback(() => {
    sendMessage(text);
  }, [text]);
  return <MSendButton onClick={onClick} />;
}
```

可以达到的效果是，如果有 text 之外的 state 更新，SendButton 已不会 rerender。而 text state 更新，SendButton 还是会 rerender，原因是 onClick 的 useCallback 依赖了 text，text 更新，onClick 重新生成，onClick 引用发生变化，导致 SendButton rerender。

而我们期望的是就算 text state 更新，SendButton 也不会 rerender。

基于 useEvent 的解法是。

```tsx
const MSendButton = React.memo(SendButton);
function Chat() {
  const [text, setText] = useState('');
  const onClick = useEvent(() => {
    sendMessage(text);
  });
  return <MSendButton onClick={onClick} />;
}
```

附基础的 useEvent 实现，

```tsx
function useEvent(handler) {
  const handlerRef = useRef(null);
  
  // 视图渲染前及每次 shouldUpdate 时更新 handlerRef.current
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  // 用 useCallback + 空依赖，确保返回函数的引用一致
  return useCallback((...args) => {
    const fn = handlerRef.current;
    return fn(...args);
  }, []);
}
```

参考：  
[https://github.com/reactjs/rfcs/pull/220](https://github.com/reactjs/rfcs/pull/220)  
[https://twitter.com/dan\_abramov/status/1522218410695794694](https://twitter.com/dan_abramov/status/1522218410695794694)  
[https://overreacted.io/making-setinterval-declarative-with-react-hooks/](https://overreacted.io/making-setinterval-declarative-with-react-hooks/)  
[https://mp.weixin.qq.com/s/J\_RUfn-kcynBme5FiE4mRg](https://mp.weixin.qq.com/s/J_RUfn-kcynBme5FiE4mRg)  
[https://typeofnan.dev/what-the-useevent-react-hook-is-and-isnt/](https://typeofnan.dev/what-the-useevent-react-hook-is-and-isnt/)

#日更
