---
title: "466 - 《Waku Server Action》"
date: 2024-08-28
url: https://sorrycc.com/waku-server-action
---

发布于 2024年8月28日

# 466 - 《Waku Server Action》

看完 [465 - 《TanStack Start》](https://sorrycc.com/tanstack-start) 的 Server Function，看到 [译：Waku：Server actions 来了](https://sorrycc.com/waku-server-actions-are-here)，接着翻一下实现。

Waku 之前在 [276 - 《手撕源码 30：wakuwork 和 RSC 原理》](https://sorrycc.com/source-30-waku) 时就看过一次源码。他的作者是 Zustand 和 Jotai 的维护者，一开始只是一个探索 RSC 的理论研究项目，后面不断添加新功能，三月他们推出了基于文件的新路由 API，现在他们已经完全支持 Server Actions 。

从 PR 看，主要是两部分功能。

1、use server action from client modules。

先看 case。

```ts
// server action file
// func.ts
export const count = () => {
  let num = fs.readFileSync('count.txt');
  fs.writeFileSync('count.txt', num + 1);
}
```

```ts
// client module file
// Foo.tsx
import { count } from 'func';
export function Foo() {
  useEffect(() => { count() });
}
```

要实现这个，需要在打包 client 产物时，对 use server 的文件做 transform，把 export 的内容转成 reference，通过 callServerRSC 的方式从服务端获取。

其中 transformClient 主要实现在 [https://github.com/dai-shi/waku/pull/714/files#diff-9f11c045328cf38282ceee67d00a518faf8c5fd3c27073bc01ee64f77245e401R9](https://github.com/dai-shi/waku/pull/714/files#diff-9f11c045328cf38282ceee67d00a518faf8c5fd3c27073bc01ee64f77245e401R9) 。用 swc 解析代码（感觉可以先用字符串做个 includes 判断，可以减少大量的 swc 解析耗时），然后…

比如，

```ts
'use server';
export const foo = 1;
```

会被转换为。

```ts
import { createServerReference } from 'react-server-dom-webpack/client';
import { callServerRSC } from 'waku/client';
export const foo = createServerReference('server——id#name', callServerRSC);
```

2、server actions in server component。

先看 case，比如 server component 嵌 client component，然后把 server actions 传给 client component。

```tsx
// server component
import { Bar } from './bar-which-is-client-component';
export function Foo() {
  async function handleClick() {
    'use server';
    let num = fs.readFileSync('count.txt');
    fs.writeFileSync('count.txt', num + 1);
  }
  return <Bar onClick={handleClick} />
}
```

```tsx
// client component
export function Bar({ onClick }) {
  return <button onClick={() => onClick()}>Click me!</button>;
}
```

实现分两部分，1）收集 server files，2）针对 server files 做 transformServerActions 。

server files 的收集是通过判断 use server 来的，除了做字符串的判断，还会对 swc.Module 做 walk，判断 function decl、function expression 和 arrow function expression 里是否包含 use server。

transformServerActions 的实现在 [https://github.com/dai-shi/waku/pull/729/files#diff-9f11c045328cf38282ceee67d00a518faf8c5fd3c27073bc01ee64f77245e401R115](https://github.com/dai-shi/waku/pull/729/files#diff-9f11c045328cf38282ceee67d00a518faf8c5fd3c27073bc01ee64f77245e401R115) 。没用例，看 ast 代码盲猜是遇到 server action 之后，加一句注册的代码，比如。

```ts
__waku_registerServerAction__(fn_identifier or fn, '%action_id%');
```

`__waku_registerServerAction__` 代码如下。

```ts
import { registerServerReference as __waku_registerServerReference__ } from 'react-server-dom-webpack/server';
export const __waku_serverActions__ = new Map();
let __waku_actionIndex__ = 0;
function __waku_registerServerAction__(fn, actionId) {
  const actionName = 'action' + __waku_actionIndex__++;
  __waku_registerServerReference__(fn, actionId, actionName);
  // FIXME this can cause memory leaks
  __waku_serverActions__.set(actionName, fn);
  return fn;
}
```

参考：  
[276 - 《手撕源码 30：wakuwork 和 RSC 原理》](https://sorrycc.com/source-30-waku)  
[译：Waku：Server actions 来了](https://sorrycc.com/waku-server-actions-are-here)  
[Bytes: Wtf is Waku?](https://kill-the-newsletter.com/feeds/ll9fw72fcvqezspe/entries/nae98x3rj6oxk6l8bvfs.html)  
[v1 Roadmap · Issue #24 · dai-shi/waku · GitHub](https://github.com/dai-shi/waku/issues/24)
