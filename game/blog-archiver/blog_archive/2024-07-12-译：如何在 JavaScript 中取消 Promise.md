---
title: "译：如何在 JavaScript 中取消 Promise"
date: 2024-07-12
url: https://sorrycc.com/cancel-promises-in-javascript
---

发布于 2024年7月12日

# 译：如何在 JavaScript 中取消 Promise

> 原文：[https://webdeveloper.beehiiv.com/p/cancel-promises-javascript](https://webdeveloper.beehiiv.com/p/cancel-promises-javascript)  
> 作者：Zachary Lee  
> 译者：ChatGPT 4 Turbo

**编者注：Promise 的取消并不是真正的取消，只是一种提前 reject。当然，如果用 AbortController 的方式，是可以把 signal 传给 request fn 来实现请求的取消的。**

![](https://images.unsplash.com/photo-1593510987046-1f8fcfc512a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0ODM4NTF8MHwxfHNlYXJjaHwxfHxjYW5jZWx8ZW58MHx8fHwxNzE5NzIxNzI1fDA&ixlib=rb-4.0.3&q=80&w=1080&utm_source=beehiiv&utm_medium=referral)

在 JavaScript 中，你可能已经知道[如何取消一个请求](https://levelup.gitconnected.com/how-to-cancel-a-request-in-javascript-67f98bd1f0f5)：你可以使用 `xhr.abort()` 来取消 XHR 和使用 `signal` 来取消 fetch。但是如何取消一个常规的 Promise 呢？

目前，JavaScript 的 Promise 原生并不提供取消常规 Promise 的 API。**所以，我们接下来讨论的是如何丢弃/忽略一个 Promise 的结果。**

## **方法 1：使用新的 Promise.withResolvers()**

现在可以使用的一个新 API 是 [Promise.withResolvers()](https://levelup.gitconnected.com/new-async-api-promise-withresolvers-simplifies-your-code-1355784fb435?utm_source=webdeveloper.beehiiv.com&utm_medium=referral&utm_campaign=how-to-annul-promises-in-javascript)。它返回一个对象，包含一个新的 Promise 对象和两个函数用于 resolve 或 reject 它。

以下是代码的样子：

```ts
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});
```

现在我们可以这样做：

```ts
const { promise, resolve, reject } = Promise.withResolvers();
```

因此我们可以利用它来暴露一个 `cancel` 方法：

```ts
const buildCancelableTask = <T>(asyncFn: () => Promise<T>) => {
  let rejected = false;
  const { promise, resolve, reject } = Promise.withResolvers<T>();

  return {
    run: () => {
      if (!rejected) {
        asyncFn().then(resolve, reject);
      }

      return promise;
    },

    cancel: () => {
      rejected = true;
      reject(new Error('CanceledError'));
    },
  };
};
```

然后我们可以用以下测试代码来使用它：

```ts
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const ret = buildCancelableTask(async () => {
  await sleep(1000);
  return 'Hello';
});

(async () => {
  try {
    const val = await ret.run();
    console.log('val: ', val);
  } catch (err) {
    console.log('err: ', err);
  }
})();

setTimeout(() => {
  ret.cancel();
}, 500);
```

这里，我们预设任务至少需要 1000ms，但我们在接下来的 500ms 内取消它，因此你会看到：

![](https://media.beehiiv.com/cdn-cgi/image/fit=scale-down,format=auto,onerror=redirect,quality=80/uploads/asset/file/63397059-8a9a-46dd-87aa-2e9cdcf35278/image.png?t=1719717804)

注意，这并不是真正的取消而是一种提前 reject。原始的 `asyncFn()` 将继续执行直至它解决或拒绝，但这并不重要，因为已经通过 `Promise.withResolvers<T>()` 创建的 promise 已经被拒绝了。

## 方法 2：使用 AbortController

就像我们取消 fetch 请求一样，我们可以实现一个监听器以实现提前拒绝。它看起来像这样：

```ts
const buildCancelableTask = <T>(asyncFn: () => Promise<T>) => {
  const abortController = new AbortController();

  return {
    run: () =>
      new Promise<T>((resolve, reject) => {
        const cancelTask = () => reject(new Error('CanceledError'));

        if (abortController.signal.aborted) {
          cancelTask();
          return;
        }

        asyncFn().then(resolve, reject);

        abortController.signal.addEventListener('abort', cancelTask);
      }),

    cancel: () => {
      abortController.abort();
    },
  };
};
```

它的效果与上述相同，但使用了 AbortController。你可以在这里使用其他监听器，但 AbortController 提供了额外的好处，即如果你多次调用 `cancel`，它不会触发多于一次的 `'abort'` 事件。

基于这段代码，我们可以进一步构建一个可取消的 fetch。这在像连续请求的场景中很有用，其中你可能想要丢弃之前的请求结果，并使用最新的请求结果。

```ts
const buildCancelableFetch = <T>(
  requestFn: (signal: AbortSignal) => Promise<T>,
) => {
  const abortController = new AbortController();

  return {
    run: () =>
      new Promise<T>((resolve, reject) => {
        if (abortController.signal.aborted) {
          reject(new Error('CanceledError'));
          return;
        }

        requestF n(abortController.signal).then(resolve, reject);
      }),

    cancel: () => {
      abortController.abort();
    },
  };
};

const ret = buildCancelableFetch(async signal => {
  return fetch('http://localhost:5000', { signal }).then(res =>
    res.text(),
  );
});

(async () => {
  try {
    const val = await ret.run();
    console.log('val: ', val);
  } catch (err) {
    console.log('err: ', err);
  }
})();

setTimeout(() => {
  ret.cancel();
}, 500);
```

请注意，这并不影响服务器端的处理逻辑；它仅仅导致浏览器丢弃 / 取消请求。换句话说，如果你发送了一个 POST 请求来更新用户信息，它可能仍然会生效。因此，这更常用于发出 GET 请求以获取新数据的情况。

## 构建一个简单的顺序请求 React Hook

我们可以进一步封装一个简单的顺序请求 React hook：

```ts
import { useCallback, useRef } from 'react';

const buildCancelableFetch = <T>(
  requestFn: (signal: AbortSignal) => Promise<T>,
) => {
  const abortController = new AbortController();

  return {
    run: () =>
      new Promise<T>((resolve, reject) => {
        if (abortController.signal.aborted) {
          reject(new Error('CanceledError'));
          return;
        }

        requestFn(abortController.signal).then(resolve, reject);
      }),

    cancel: () => {
      abortController.abort();
    },
  };
};

function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function useSequentialRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<T>,
) {
  const requestFnRef = useLatest(requestFn);
  const currentRequest = useRef<{ cancel: () => void } | null>(null);

  return useCallback(async () => {
    if (currentRequest.current) {
      currentRequest.current.cancel();
    }

    const { run, cancel } = buildCancelableFetch(requestFnRef.current);
    currentRequest.current = { cancel };

    return run().finally(() => {
      if (currentRequest.current?.cancel === cancel) {
        currentRequest.current = null;
      }
    });
  }, [requestFnRef]);
}
```

然后我们就可以简单地使用它了：

```ts
import { useSequentialRequest } from './useSequentialRequest';

export function App() {
  const run = useSequentialRequest((signal: AbortSignal) =>
    fetch('http://localhost:5000', { signal }).then((res) => res.text()),
  );

  return <button onClick={run}>运行</button>;
}
```

这样，当你快速多次点击按钮时，你将只会得到最后一次请求的数据，丢弓早前的请求。

![](https://media.beehiiv.com/cdn-cgi/image/fit=scale-down,format=auto,onerror=redirect,quality=80/uploads/asset/file/3637d175-5aeb-4346-9a99-6c8dd4892b32/image.png?t=1719722300)

## 构建一个优化的顺序请求 React Hook

如果我们需要一个更全面的顺序请求 React Hook，上面提供的示例仍有改善空间。比如：

*   我们可以使用一个唯一的 `AbortController`，直到它真正需要使用，减少每次都创建一个的成本。
*   我们可以使用泛型构建一个支持传递任何参数的请求方法。

这里是代码：

```ts
import { useCallback, useRef } from 'react';

function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function useSequentialRequest<Args extends unknown[], Data>(
  requestFn: (signal: AbortSignal, ...args: Args) => Promise<Data>,
) {
  const requestFnRef = useLatest(requestFn);

  const running = useRef(false);
  const abortController = useRef<AbortConstantsoller | null>(null);

  return useCallback(
    async (...args: Args) => {
      if (running.current) {
        abortController.current?.abort();
        abortController.current = null;
      }

      running.current = true;

      const controller = abortController.current ?? new AbortController();
      abortController.current = controller;

      return requestFnRef.current(controller.signal, ...args).finally(() => {
        if (controller === abortController.current) {
          running.current = false;
        }
      });
    },
    [requestFnRef],
  );
}
```

值得注意的是，在 `finally` 块中，我们需要检查当前的 `controller` 是否等于 `abortController.current`，以防止竞态条件：这确保我们只在当前活动的请求完成时更新状态。相反，如果它们不相等，则意味着 `finally` 块属于一个已取消的请求，不应该修改 `running.current` 状态。

以下是如何使用它：

```ts
import { useState } from 'react';
import { useSequentialRequest } from './useSequentialRequest';

export default function Home() {
  const [data, setData] = useState('');

  const run = useSequentialRequest(async (signal: AbortSignal, query: string) =>
    fetch(`/api/hello?query=${query}`, { signal }).then((res) => res.text()),
  );

  const handleInput = async (queryStr: string) => {
    try {
      const res = await run(queryStr);
      setData(res);
    } catch {
      // 忽略
    }
  };

  return (
    <>
      <input
        placeholder="请输入"
        onChange={(e) => {
          handleInput(e.target.value);
        }}
      />
      <div>响应数据：{data}</div>
    </>
  );
}
```

你可以 [在线体验](https://stackblitz.com/edit/stackblitz-starters-wzfsfn?file=app%2Fpage.tsx&utm_source=webdeveloper.beehiiv.com&utm_medium=referral&utm_campaign=how-to-annul-promises-in-javascript)：尝试快速输入，它将取消之前的请求，同时始终保留最新的响应。

![](https://media.beehiiv.com/cdn-cgi/image/fit=scale-down,format=auto,onerror=redirect,quality=80/uploads/asset/file/0cf105bd-becf-45ab-9e09-ce88ddfdced9/image.png?t=1720503223)
