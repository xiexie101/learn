---
title: "译：如何在 JavaScript 中取消请求"
date: 2024-07-12
url: https://sorrycc.com/how-to-cancel-a-request-in-javascript
---

发布于 2024年7月12日

# 译：如何在 JavaScript 中取消请求

> 原文：[https://levelup.gitconnected.com/how-to-cancel-a-request-in-javascript-67f98bd1f0f5](https://levelup.gitconnected.com/how-to-cancel-a-request-in-javascript-67f98bd1f0f5)  
> 作者：Zachary Lee  
> 译者：ChatGPT 4 Turbo

**编者注：笔记，1）XMLHttpRequest 直接用 .abort() 即可取消请求，2）Fetch 需借助 AbortController，传入 signal 给 fetch，然后 abort 取消请求，3）Axios 虽然基于 XMLHttpRequest，但自 0.22 起也支持用 AbortController + fetch API 的方式取消请求。**

![](https://miro.medium.com/v2/resize:fit:1400/0*D7F4h1L7sbh-s9_9)

照片由 [Thomas Jensen](https://unsplash.com/@thomasjsn?utm_source=medium&utm_medium=referral) 在 [Unsplash](https://unsplash.com/?utm_source=medium&utm_medium=referral) 上拍摄

本文将向您展示如何在 XMLHttpRequest、Fetch 以及常见的第三方库 [axios](https://github.com/axios/axios) 中取消请求。

在我们开始之前，有必要简要再次描述一下 Ajax。它是 **Asynchronous JavaScript 和 XML** 的简称。2005 年，Jesse James Garrett 创造了这个术语，以描述一种使用多种现有技术组合的“新”方法。因此，它并不是一种独立的技术。这种方法使得 Web 应用程序能够在不重新加载整个浏览器页面的情况下，快速、增量地更新用户界面。

XMLHttpRequest 和 Fetch 目前是浏览器提供的用于获取资源的两个 API。axios 是一个流行的三方 Promise 请求库，内部使用 XMLHttpRequest。

# 取消 XMLHttpRequest 请求

如果请求已经被发送，`XMLHttpRequest.abort()` 方法会中止请求。当请求被中止时，其 [readyState](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState) 被改变为 `XMLHttpRequest.UNSENT` (0)，并且请求的 [状态码](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/status) 被设置为 0。

例如：

```ts
const xhr = new XMLHttpRequest();
xhr.open('GET', 'http://127.0.0.1:3000/api/get', true);
xhr.send();

setTimeout(() => {
 xhr.abort();
}, 1000);
```

下图是在 Chrome DevTools 中的 Network 里，正常请求与取消请求的比较。

![](https://miro.medium.com/v2/resize:fit:1400/1*bptDVFIacVwyW6owaXYS8Q.png)

# 取消 Fetch 请求

如果您想取消一个 Fetch 请求，需要使用 [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) API。您可以使用构造函数创建一个新的 AbortController 对象。它有一个只读属性 `AbortController.signal`，这是一个 [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) 对象实例，可用于与 DOM 请求（如 fetch 请求）通信或取消。

它还有一个方法 `AbortController.abort()`，该方法可以中止 fetch 请求、消费任何响应体和流。

例如：

```ts
const controller = new AbortController();

void (async function () {
    const response = await fetch('http://127.0.0.1:3000/api/get', {
        signal: controller.signal,
    });
    const data = await response.json();
})();

setTimeout(() => {
    controller.abort();
}, 1000);
```

下面是一个比较：

![](https://miro.medium.com/v2/resize:fit:1400/1*U8YjEavEBGG6HF7Yeyfkew.png)

请注意，`controller.abort()` 支持传递一个可选参数 `reason`。表示为何操作被中止。在上面的例子中，我们没有指定它，那么它将被设置为 “AbortError” [DOMException](https://developer.mozilla.org/en-US/docs/Web/API/DOMException)。

如果我们还没有使用 `try…catch` 等捕获错误，那么你将在控制台中看到这样的错误。

![](https://miro.medium.com/v2/resize:fit:1400/1*6B-3YXgHDREssYO9lhfWuw.png)

# 取消 Axios 请求

而在 Axios 中，自 `v0.22.0` 起，它支持使用 [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) 以 fetch API 方式取消请求：

```ts
const controller = new AbortController();
const API_URL = 'http://127.0.0.1:3000/api/get';

void (async function () {
    const response = await axios.get(API_URL, {
        signal: controller.signal,
    });
    const { data } = response;
})();

setTimeout(() => {
    controller.abort();
}, 1000);
```

下面是一个比较：

![](https://miro.medium.com/v2/resize:fit:1400/1*qrDn7zu8kmJAKoGL9fGVEA.png)

这里是未捕获的错误：

![](https://miro.medium.com/v2/resize:fit:1400/1*7B77V-aDPNSHPx5HjWidUQ.png)

然而，Axios 目前支持使用 `CancelToken` 方法来取消请求，但它已被标记为废弃。更多信息，请查看[官方文档](https://axios-http.com/docs/cancellation)。
