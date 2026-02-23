---
title: "179 - 《React Re-Render》"
date: 2022-08-31
url: https://sorrycc.com/react-re-render
---

发布于 2022年8月31日

# 179 - 《React Re-Render》

汇总下关于 re-render 相关的知识点。

1、有四个原因会导致组件 re-render：状态变化、父组件 re-render、Context 变化和 Hooks 变化。这里有个误解是「Props 变化会导致 re-render？」其实不会，props 往上可以追溯到 state 变更，是 state 变更导致父组件 re-render 从而引发子组件 re-render，而不是由 props 变更引起。props 只在 React.memo 包裹的组件里才会做检查。

2、如何避免父组件 re-render 导致的 re-render？React.memo！使用 React.memo 后的组件只有 props 变更才会触发 re-render。你可能会想：为什么这不是默认行为？因为作为开发者，我们往往高估了重新渲染的成本。对于 props 很多且没有很多子组件的组件来说，相比 re-render，检查 props 是否变更带来的消耗可能更大。因此，如果对每个组件都进行 React.memo，可能会产生反效果。

3、Dan 在[《Before You memo()》](https://overreacted.io/before-you-memo/)一文里有提，在使用 React.memo() 之前，还可以考虑两个方法，让 re-render 保持在一个很小的范围之内。1）把状态往下移，把可变的部分拆到平行组件里，比如 `<Changed /><Expansive />`，确保更新只在 `<Changed />` 组件里；2）把内容往上提，把可变的部分拆到父级组件里，比如 `<Changed><Expansive /></Changed>`，在 `<Changed />` 变更时只要 `props.children` 不变化，就不会触发子组件的 re-render。

4、Dan 说的第二点的本质是啥？是因为用了 props.children，而 props 不会触发 re-render。那用其他 props 属性可以吗？可以！比如 `<Changed left={<Expansive1 />} right={<Expansive2 />} />`，`<Changed />` re-render 并不会导致 `<Expansive />` re-render。这种方法叫「componets as props」。

5、什么时候应该用 useMemo/useCallback？1）React.memo 过的组件的 props 应该用，因为他们只有 props 变更时才会 re-render，所以反之非 React.memo 过的组件的 props 无需使用，因为都会 re-render，用了也白用，2）useEffect、useMemo、useCallback 中非原始值的依赖应该用，3）给 Pure Component 的非原始值 props 应该用，4）重消耗（比如生成渲染树）的部分应该用，反之轻消耗不要用，因为 useMemo/useCallback 本身也有消耗。[https://overreacted.io/before-you-memo/](https://overreacted.io/before-you-memo/)

6、JavaScript 中有原始值和引用值的区分，由于 props 和 hooks dep 都会做 shadow equal，使用时尽量避免使用引用值，避免不了时需用 useMemo/useCallback 包一下。避免使用引用值有几个方法。1）拍平，比如 options={{showSideBar:true}} 改成 showSideBar=true；2）使用原始值子项，比如 `useMemo(fn, [user])` 改成 `useMemo(fn, [user.id])`。

7、useCallback 是语法糖，通常 useMemo 针对 array/object，useCallback 针对 function。`React.useCallback(function helloWorld(){}, []);` 等同于 `React.useMemo(() => function helloWorld(){}, []);`。

8、使用 useCallback 要小心依赖更新导致返回的函数更新。举个例子，我们遇到 `onClick={() => setCount(count+1)}` 时，由于考虑每次生成一个新的匿名函数，可能会把他改成 `useCallback(() => setCount(count+1), [count])`，此时 count 更新会导致 useCallback 返回新的匿名函数，解法是用 Functional Update，用 `useCallback(() => setCount(prevCount => prevCount + 1), [])`。

9、如何防止 Context 引起的 re-render？1）memo context value，避免父级组件 re-render 导致 value 变更从而让依赖 context 的地方全部 re-render，2）拆分 data 和 API（getter 和 setter），这样 getter 变更时依赖 setter 的部分不会 re-render，3）把数据拆小，4）使用 context selector 比如 [use-context-selector](https://github.com/dai-shi/use-context-selector)。

10、定位 re-render 的几个方法。1）借助 React Devtools Chrome 插件，在「设置 > Profiler」里开启「Record why each component rendered while profiling」，再通过录制的方式排查，就能知道每个 re-render 的原因，见下图；2）借助外部工具，比如 why-did-you-render 或 tilg。

![](https://img.alicdn.com/imgextra/i1/O1CN01mk4oeq1C5mnGR8DEH_!!6000000000030-1-tps-1920-1080.gif)

参考：

[https://www.joshwcomeau.com/react/why-react-re-renders/](https://www.joshwcomeau.com/react/why-react-re-renders/)  
[https://www.developerway.com/posts/react-re-renders-guide](https://www.developerway.com/posts/react-re-renders-guide)  
[https://alexsidorenko.com/articles](https://alexsidorenko.com/articles)  
[https://overreacted.io/before-you-memo/](https://overreacted.io/before-you-memo/)

https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render https://github.com/welldone-software/why-did-you-render https://github.com/shuding/tilg https://github.com/dai-shi/use-context-selector
