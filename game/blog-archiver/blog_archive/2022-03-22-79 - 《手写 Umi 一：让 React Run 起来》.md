---
title: "79 - 《手写 Umi 一：让 React Run 起来》"
date: 2022-03-22
url: https://sorrycc.com/write-a-umi-01-run-react
---

发布于 2022年3月22日

# 79 - 《手写 Umi 一：让 React Run 起来》

本篇是手写 Umi 的第一篇，让 React Run 起来。目标是 70+ 行代码写一个 TodoList Demo，见图 1，用我当下觉得极简的方式。环境方面无要求，参考 [76 - 《2022 最潮的 Demo 编写方式》](https://sorrycc.com/write-a-demo-2022)，一个 HTML 文件即可。知识储备需要基本 React 经验。

0️⃣

高效的教与学。

很多网上教学的课程都是从基础甚至历史开始讲起的，这和我们九年义务教育的方法是一致的，但是不是高效的学习方式呢？上周翻了下支付宝的前锋营的课程，也是如此，上来先是讲前端是什么、前端的未来、JavaScript 语法进阶、TS 基础、环境搭建等。从基础学不是不好，只是效率不高，可以有更好的方式。

我倾向的方式是实践为主。先从中间开始，教流程性的知识，让大家知道如何 run 起来，先有个手感，形成骨架。然后再逐渐往前讲基础，往后讲深度，逐渐加入事实性和概念性的知识。先有流程性的骨架，后续的知识才更容易粘附在上面。

1️⃣

找个目录，新增 index.html，填入以下内容，

```html
<div id="root"></div>
<script type="text/jsx" data-type="module">
import React from 'react';
import ReactDOM from 'react-dom';
<!-- 后续新代码放这 -->
function App() {
 return <h1>Hello World</h1>
}
ReactDOM.render(<App />, document.getElementById('root'));
</script>

<!-- 以下代码不用理解意思 -->
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="importmap">
{
 "imports": {
  "react": "https://ga.jspm.io/npm:react@17.0.2/dev.index.js",
  "react-dom": "https://ga.jspm.io/npm:react-dom@17.0.2/dev.index.js",
  "react-router-dom": "https://ga.jspm.io/npm:react-router-dom@6.2.2/index.js",
  "valtio": "https://ga.jspm.io/npm:valtio@1.4.0/esm/index.js",
  "valtio/utils": "https://ga.jspm.io/npm:valtio@1.4.0/esm/utils.js"
 },
 "scopes": {
  "https://ga.jspm.io/": {
   "@babel/runtime/helpers/esm/extends": "https://ga.jspm.io/npm:@babel/runtime@7.17.8/helpers/esm/extends.js",
   "history": "https://ga.jspm.io/npm:history@5.2.0/index.js",
   "object-assign": "https://ga.jspm.io/npm:object-assign@4.1.1/index.js",
   "proxy-compare": "https://ga.jspm.io/npm:proxy-compare@2.1.0/dist/index.modern.js",
   "react-router": "https://ga.jspm.io/npm:react-router@6.2.2/index.js",
   "scheduler": "https://ga.jspm.io/npm:scheduler@0.20.2/dev.index.js",
   "scheduler/tracing": "https://ga.jspm.io/npm:scheduler@0.20.2/dev.tracing.js",
   "valtio/vanilla": "https://ga.jspm.io/npm:valtio@1.4.0/esm/vanilla.js"
  }
 }
}
</script>
```

然后双击打开 index.html，就能看到 Hello World。

2️⃣

数据层。

数据流用 valtio，基于 Proxy 的响应式数据流方案。相比 useState、useReducer 等简单多了，非常适合新手入门，可以少操心很多事，尤其是做数据变更时。

在 index.html 中加入以下代码，

```

import { useSnapshot } from 'valtio';  
import { proxyWithComputed } from 'valtio/utils';

const state = proxyWithComputed({ todos: [] }, {  
 left: ({ todos }) => todos.filter(todo => !todo.completed).length,  
});

// 调试代码，方便在控制台里直接操作 state 看到效果。  
window.g_state = state;

```

这里定义了一个 state 数据，包含 todos 数据，以及计算出来的 todos 中已完成的项的数量。

针对 state，会有读取和写入两个操作。

```ts
// 读取操作
// 在需要的地方 useSnapshot 下，然后直接用 todos 和 left 就好
// 注意：由于是 hooks，只能用在 react 生命周期里
const { todos, left } = useSnapshot(state);

// 写数据示例
// 添加 todo
state.todos.push({ id: Date.now, text, completed: false });
// 切换 todo 的 completed 状态
state.todos.forEach(todo => {
 if (todo.id === id) todo.completed = !todo.completed;
});
```

注意写数据时，不能用 useSnapshot 读出来的对象直接操作。

3️⃣

视图层。

拆分组件。TodoAdd、TodoItem、TodoFooter。

略。暂不展开。

4️⃣

完整示例如下：
