---
title: "197 - 《一个 props 相关的 re-render 问题》"
date: 2022-10-17
url: https://sorrycc.com/re-render-case
---

发布于 2022年10月17日

# 197 - 《一个 props 相关的 re-render 问题》

> Monster 提问：context re-render 问题  
> use-context-selector-example - CodeSandbox [https://codesandbox.io/s/github/dai-shi/use-context-selector/tree/main/examples/02\_typescript](https://codesandbox.io/s/github/dai-shi/use-context-selector/tree/main/examples/02_typescript)  
> 这是 use-context-seletor 的官方例子。点击 + 或者 - 按钮，下面 Person 表单不会刷新  
> charming-gould-bhpgfh - CodeSandbox [https://codesandbox.io/s/charming-gould-bhpgfh?file=/src/App.tsx](https://codesandbox.io/s/charming-gould-bhpgfh?file=/src/App.tsx)  
> 而改写其中一段，删除 Provider 组件，直接将 context 放到 app 里，操作 Counter 也会更新 Person

早上看到 dan 的 twitter 才想起之前有个提问 [https://t.zsxq.com/07mIQ33Vv](https://t.zsxq.com/07mIQ33Vv) 忘回答了，大家可以先看下原问题。

那么，为啥「后者操作 Count 也会更新 Person」？

其实 Person 更新不是因为其通过 useContextSelector 订阅的数据更新，而是因为 Body 组件 rerender 了，所以子组件 Count 和 Person 也跟着一起 rerender 导致。

那 Body 为啥会 rerender？

先看两种写法的差异。

1、提取 Provider 组件，通过 props.children 的方式渲染 Body

```ts
const Provider = (props) => <MyContext.Provider value={val}>{props.children}</MyContext.Provider>;
<Provider>
  <Body />
</Provider>
```

2、Provider 和 Body 通过 JSX 的方式写在一起

```ts
<MyContext.Provider value={val}>
  <Body />
</MyContext.Provider>
```

此时，如果 MyContext 数值更新，就会触发 MyContext.Provider rerender。写法 1 通过 props.children 渲染 Body，MyContext.Provider 的渲染就会保持在 Provider 组件内，不影响 Body；写法 2 MyContext.Provider rerender 会导致其子组件 rerender，所以 Body 也跟着 rerender。

那为啥 props.children 的方式渲染子组件不会 rerender？因为其被往上提了一层，只有定义 props.children 的组件 rerender 才会触发其 rerender。这在 [https://t.zsxq.com/0572RrNja](https://t.zsxq.com/0572RrNja) 第 3、4 点中有介绍。

参考：  
[https://t.zsxq.com/07mIQ33Vv](https://t.zsxq.com/07mIQ33Vv)  
[https://t.zsxq.com/0572RrNja](https://t.zsxq.com/0572RrNja)  
[https://twitter.com/dan\_abramov/status/1581633978549039106](https://twitter.com/dan_abramov/status/1581633978549039106)
