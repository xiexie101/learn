---
title: "译：Hot Module Replacement 原理"
date: 2024-02-17
url: https://sorrycc.com/hot-module-replacement-is-easy
---

发布于 2024年2月17日

# 译：Hot Module Replacement 原理

> 原文：[https://bjornlu.com/blog/hot-module-replacement-is-easy](https://bjornlu.com/blog/hot-module-replacement-is-easy)  
> 作者：Bjorn Lu  
> 译者：ChatGPT 4 Turbo

如果你使用 Vite 构建过项目，那么你很可能也使用过热模块替换（HMR）。HMR 允许你在不刷新页面的情况下更新代码，比如编辑组件标记或调整样式，更改会立即反映在浏览器中，这使得代码迭代更快并提升了开发者体验。

在其他打包工具如 Webpack 和 Parcel 中也有 HMR 功能，在这篇博客中，我们将深入探讨它在 Vite 中的具体工作原理。通常其他打包工具的工作原理也应该类似。

首先，HMR 并不容易，某些主题可能需要一些时间来消化，但我希望已经激起了你的兴趣！在这个页面上，你将学到：

*   替换模块所需的条件
    *   `import.meta.hot.accept()`
    *   \`import.meta.hot.dispose()
    *   \`import.meta.hot.prune()
    *   `import.meta.hot.invalidate()`
    *   其他 HMR API
*   从头开始
    *   编辑文件
    *   处理编辑过的模块
    *   模块失效
    *   HMR 传播
    *   还要做什么
*   HMR 客户端
    *   客户端初始化
    *   处理来自服务器的信息
    *   HMR 更新
    *   HMR pruning 剪枝
    *   HMR 失效
    *   HMR 事件
    *   HMR 数据
*   总结
*   常见问题
    *   我在哪里可以找到 Vite 的 HMR 实现的源代码？
    *   有没有可以学习的 HMR 示例？
    *   Vite 的实现与 Webpack 和其他工具有何不同？
    *   服务器端渲染中的 HMR 是如何工作的？
    *   如何在 `handleHotUpdate()` 中触发页面重新加载？
    *   HMR API 有没有具体的规范？
    *   有没有其他学习 HMR 的资源？
*   结束语

## 替换模块所需的条件

本质上，HMR 是在你的应用运行时动态替换模块。大多数打包工具使用 ECMAScript 模块（ESM）作为模块，因为它更容易分析导入和导出，这有助于了解一个模块的替换将如何影响其他相关模块。

一个模块通常可以访问 HMR 生命周期 API 来处理旧模块被丢弃时，以及新模块到位时的情况。在 Vite 中，你有：

*   [`import.meta.hot.accept()`](https://vitejs.dev/guide/api-hmr.html#hot-accept-cb)
*   [`import.meta.hot.dispose()`](https://vitejs.dev/guide/api-hmr.html#hot-dispose-cb)
*   [`import.meta.hot.prune()`](https://vitejs.dev/guide/api-hmr.html#hot-prune-cb)
*   [`import.meta.hot.invalidate()`](https://vitejs.dev/guide/api-hmr.html#hot-invalidate-message-string)

从高层次上来说，它们是这样工作的：

![](https://img.alicdn.com/imgextra/i1/O1CN01xnOfSc1nCmdnGUYXC_!!6000000005054-2-tps-1480-1721.png)

同样重要的是要注意，你需要使用这些 API 才能使 HMR 工作。例如，Vite 对 CSS 文件默认使用这些 API，但对于其他文件，如 Vue 和 Svelte，你可以使用一个 Vite 插件来使用这些 HMR API。或者在需要时手动操作。否则，默认情况下，文件的更新将导致整页重新加载。

抛开那些不谈，让我们更深入地了解这些 API 是如何工作的！

### `import.meta.hot.accept()`

当你使用 `import.meta.hot.accept()` 附加一个回调时，该回调将负责用新模块替换旧模块。使用这个 API 的模块也被称为“已接受模块”。

一个被接受的模块创建了一个“HMR 边界”。HMR 边界包含了模块本身以及递归地包含了所有它导入的模块。被接受的模块也是 HMR 边界的“根”，因为边界通常具有图状结构。

![](https://img.alicdn.com/imgextra/i2/O1CN0138EJZ21OOoeYMHZBX_!!6000000001696-2-tps-1102-1164.png)

一个被接受的模块也可以根据 HMR 回调的声明方式而被缩小为“自接受模块”。有两个函数签名用于 `import.meta.hot.accept` ：

1.  `import.meta.hot.accept(cb: Function)` - 接受来自自身的更改
2.  `import.meta.hot.accept(deps: string | string[], cb: Function)` - 接受来自导入模块的更改

如果使用了第一个签名，它被称为自接受模块。这种区分对于我们稍后将讨论的 HMR 传播很重要。

它们可以这样使用：

```js
export let data = [1, 2, 3]
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // Replace the old value with the new one
    data = newModule.data
  })
}
```

```js
import { value } from './stuff.js'
document.querySelector('#value').textContent = value
if (import.meta.hot) {
  import.meta.hot.accept(['./stuff.js'], ([newModule]) => {
    // Re-render with the new value
    document.querySelector('#value').textContent = newModule.value
  })
}
```

### `import.meta.hot.dispose()`

当一个被接受的模块或者被其他人接受的模块被新模块替换，或者正在被移除时，我们可以使用 `import.meta.hot.dispose()` 来进行清理。这使我们能够清除旧模块所产生的任何副作用，例如移除事件监听器、清除定时器或重置状态。

这是一个 API 的例子：

```js
globalThis.__my_lib_data__ = {}
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Reset global state
    globalThis.__my_lib_data__ = {}
  })
}
```

### `import.meta.hot.prune()`

当模块需要从运行时完全移除时，例如文件被删除，我们可以使用 `import.meta.hot.prune()` 来进行最终清理。这与 `import.meta.hot.dispose()` 类似，但它只在模块被移除时调用一次。

在内部，Vite 通过导入分析（分析模块的导入的阶段）在不同的阶段对模块进行修剪，因为我们唯一能知道模块不再被使用的时候是当它不再被任何其他模块导入时。

这是一个使用 Vite 的 CSS HMR API 的例子：

```js
// Import utilities to update/remove style tags in the HTML
import { updateStyle, removeStyle } from '/@vite/client'
updateStyle('/src/style.css', 'body { color: red; }')
if (import.meta.hot) {
  // Empty accept callback is we want to accept, but we don't have to do anything.
  // `updateStyle` will automatically get rid of the old style tag.
  import.meta.hot.accept()
  // Remove style when the module is no longer used
  import.meta.hot.prune(() => {
    removeStyle('/src/style.css')
  })
}
```

### `import.meta.hot.invalidate()`

与上述 API 不同， `import.meta.hot.invalidate()` 是一个操作而不是生命周期钩子。你通常会在 `import.meta.hot.accept` 中使用它，在运行时你可能会意识到模块无法安全更新，你需要退出。

当这个被调用时，Vite 服务器会被通知模块失效，就好像模块已经被更新了一样。HMR 传播将会再次执行，以确定它的任何导入者是否可以递归地接受这个改变。

这是一个 API 的例子：

```js
export let data = [1, 2, 3]
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // If the `data` export is deleted or renamed
    if (!(data in newModule)) {
      // Bail out and invalidate the module
      import.meta.hot.invalidate()
    }
  })
}
```

### 其他 HMR API

[Vite HMR 文档](https://vitejs.dev/guide/api-hmr.html)涵盖了更多的 API。然而，它们对于理解 HMR 的基本工作原理并不至关重要，所以我们现在先跳过它们，但我们在后面讨论 HMR 客户端时会再次回到这个话题。

如果你对它们在某些情况下如何发挥作用感兴趣，快速阅读一下[文档](https://vitejs.dev/guide/api-hmr.html)吧！

## 从头开始

我们已经了解了 HMR API 及其如何允许我们替换和管理模块。但仍有一个遗漏的部分：我们如何知道何时替换模块？HMR 通常在编辑文件后发生，但那之后会发生什么？

乍一看，大概是这样的：

![](https://img.alicdn.com/imgextra/i4/O1CN01kCvd7J1aWOb49VzST_!!6000000003337-2-tps-1469-1587.png)

我们来逐一看看它们。

### 编辑文件

HMR 在你编辑文件并保存时开始。像 [chokidar](https://github.com/paulmillr/chokidar) 这样的文件系统监视器会检测到更改，并将这个编辑过的文件路径传递到下一个步骤。

### 处理编辑过的模块

Vite 开发服务器被通知了编辑过的文件路径。然后使用该文件路径在模块图谱中找到其相关模块。需要注意的是，“文件”和“模块”是两个不同的概念，一个文件可能对应一个或多个模块。例如，一个 Vue 文件可以被编译成一个 JavaScript 模块和一个相关的 CSS 模块。

模块随后会传递给 Vite 插件的 `handleHotUpdate()` 钩子进行进一步处理。它们可以选择过滤或扩展模块数组。最终的模块将会传递到下一个步骤。

以下是一些插件示例：

```js
// Example: filter out array of modules
function vuePlugin() {
  return {
    name: 'vue',
    handleHotUpdate(ctx) {
      if (ctx.file.endsWith('.vue')) {
        const oldContent = cache.get(ctx.file)
        const newContent = await ctx.read()
        // If only the style has changed when editing the file, we can filter
        // out the JS module and only trigger the CSS module for HMR.
        if (isOnlyStyleChanged(oldContent, newContent)) {
          return ctx.modules.filter(m => m.url.endsWith('.css'))
        }
      }
    }
  }
}
```

```js
// Example: extending array of modules
function globalCssPlugin() {
  return {
    name: 'global-css',
    handleHotUpdate(ctx) {
      if (ctx.file.endsWith('.css')) {
        // If a CSS file is edited, we also trigger HMR for this special
        // `virtual:global-css` module that needs to be re-transformed.
        const mod = ctx.server.moduleGraph.getModuleById('virtual:global-css')
        if (mod) {
          return ctx.modules.concat(mod)
        }
      }
    }
  }
}
```

### 模块失效

在 HMR 传播之前，我们会先使最终更新模块的数组及其递归导入者失效。每个模块的编译代码将被移除，并且会附上一个失效时间戳。该时间戳将用于在下一次请求时在客户端获取新模块。

### HMR 传播

最终更新模块的数组现在将经过 HMR 传播。这就是所谓的“魔法”发生之处，也常常是 HMR 不按预期工作的混淆来源。

从根本上讲，HMR 传播是关于找到 HMR 边界，以更新的模块为起点。如果所有更新的模块都在一个边界内，Vite 开发服务器将通知 HMR 客户端通知已接受的模块执行 HMR。如果有些不在边界内，则会触发全页面重新加载。

为了更好地理解其工作原理，我们来逐个案例分析这个例子：

![](https://img.alicdn.com/imgextra/i2/O1CN0138EJZ21OOoeYMHZBX_!!6000000001696-2-tps-1102-1164.png)

*   **情景 1：** 如果 `stuff.js` 被更新，传播将递归查看其导入者以找到一个被接受的模块。在这种情况下，我们会发现 `app.jsx` 是一个被接受的模块。但在我们结束传播之前，我们需要确定 `app.jsx` 是否可以接受来自 `stuff.js` 的更改。这将取决于 `import.meta.hot.accept()` 的调用方式。
    *   **情景 1 (a)：** 如果 `app.jsx` 是自我接受的，或者它接受来自 `stuff.js` 的更改，我们可以在这里停止传播，因为没有其他从 `stuff.js` 导入的。然后 HMR 客户端将通知 `app.jsx` 执行 HMR。
    *   **情景 1 (b)：** 如果 `app.jsx` 不接受这一更改，我们将继续向上传播以寻找一个被接受的模块。但由于没有其他被接受的模块，我们将到达“根” `index.html` 文件。将触发全页重新加载。
*   **情景 2：** 如果 `main.js` 或 `other.js` 被更新，传播将再次递归地查看其导入者。然而，没有被接受的模块，我们将到达“根” `index.html` 文件。因此，将触发全页面重新加载。
*   **情景 3：** 如果 `app.jsx` 被更新了，我们立即发现它是一个被接受的模块。然而，一些模块可能可以或可能无法更新自身的变化。我们可以通过检查它们是否是一个自我接受的模块来确定它们是否能够自我更新。
    *   **情景 3 (a)：** 如果 `app.jsx` 是自我接受的，我们可以停在这里，并让 HMR 客户端通知它执行 HMR。
    *   **情景 3 (b)：** 如果 `app.jsx` 不是自接受的，我们将继续向上传播以寻找一个被接受的模块。但由于它们不存在，我们将到达“根” `index.html` 文件，将触发全页重新加载。
*   **情景 4：** 如果 `utils.js` 被更新，系统将再次递归查看其导入者。首先，我们会找到作为已接受模块的 `app.jsx` 并在那里停止传播（假设情景 1（a））。然后，我们也会递归地走到 `other.js` 及其导入者，但没有已接受的模块，我们将到达“根”文件 `index.html` 。如果至少有一个案例没有已接受的模块，将触发全页重新加载。

如果您想了解一些涉及多个 HMR 边界的更高级场景，请点击下面的折叠部分：

让我们以这个不同的例子为例，它涉及来自 3 个 `.jsx` 文件的 3 个 HMR 边界：

![](https://img.alicdn.com/imgextra/i4/O1CN01ElkniC1V1BWdDEoGB_!!6000000002592-2-tps-1383-1081.png)

*   **情景 5：** 如果 `stuff.js` 被更新，传播将递归查找其导入者以找到一个被接受的模块。我们会发现 `comp.jsx` 是一个被接受的模块，并以与情景 1 相同的方式处理。再次强调：
    *   **情景 5 (a)：** 如果 `comp.jsx` 是自我接受的，或者它接受来自 `stuff.js` 的更改，我们可以在那里停止传播。然后 HMR 客户端将通知 `comp.jsx` 执行 HMR。
    *   **情景 5 (b)：** 如果 `comp.jsx` 不接受这个更改，我们将继续向上传播，以寻找一个被接受的模块。我们将找到 `app.jsx` 作为被接受的模块，并以与此情景（情景 5）相同的方式处理！我们将继续这样做，直到我们找到可以接受更改的模块，或者如果我们到达了 “root” 的 index.html 并且需要全页重新加载。
*   **情景 6：** 如果 `bar.js` 被更新，传播将递归查看其导入者，并找到 `comp.jsx` 和 `alert.jsx` 作为被接受的模块。我们也会像情景 5 那样处理这两个模块。假设最佳情况，即两个被接受的模块都符合情景 5（a），HMR 客户端将通知 `comp.jsx` 和 `alert.jsx` 执行 HMR。
*   **情景 7：** 如果 `utils.js` 被更新，传播将再次递归查看其导入者，并找到其所有直接导入者 `comp.jsx` 、 `alert.jsx` 和 `app.jsx` 作为已接受模块。我们也会以情景 5 相同的方式处理这三个模块。假设最佳情况下，所有已接受模块都符合情景 5（a），即使 `comp.jsx` 也是 `app.jsx` 的 HMR 边界的一部分，HMR 客户端将通知它们三个执行 HMR。（将来，Vite 可能会检测到这一点，并且只通知 `app.jsx` 和 `alert.jsx` ，但这主要是一个实现细节！）
*   **情景 8：** 如果 `comp.jsx` 被更新了，我们立即发现它是一个被接受的模块。类似于情景 3，我们需要先检查 `comp.jsx` 是否是一个自接受模块。
    *   **情景 8 (a)：** 如果 `comp.jsx` 是自我接受的，我们可以停在这里，并让 HMR 客户端通知它执行 HMR。
    *   **情景 8 (b)：** 如果 `comp.jsx` 不是自我接受的，我们可以像处理情景 5 (b) 那样来处理。

除了上述情况之外，还有许多其他边缘情况没有在这里涉及，因为它们有点高级，包括[循环导入](https://github.com/vitejs/vite/pull/14867)、[部分接受模块](https://github.com/vitejs/vite/discussions/13811)、[仅 CSS 导入器](https://github.com/vitejs/vite/pull/3929)等。不过，当你对整个流程更熟悉后，可以再回头看看这些情况！

最终，HMR 传播的结果是需要完全重新加载页面，还是应该在客户端应用 HMR 更新。

### 还要做什么

在需要完全重新加载的简单情况下，将向 HMR 客户端发送消息以重新加载页面。如果有可以热更新的模块，在 HMR 传播期间接受的模块数组将被发送到 HMR 客户端，在那里它将触发我们上面讨论的正确 HMR API，以便执行 HMR。

但是这个 HMR 客户端到底是如何工作的呢？

## HMR 客户端

在 Vite 应用中，你可能会注意到 HTML 中添加了一个特殊脚本，它请求 `/@vite/client` 。这包含了 HMR 客户端！

HMR 客户端负责：

1.  建立与 Vite 开发服务器的 WebSocket 连接。
2.  监听来自服务器的 HMR 负载。
3.  在运行时提供并触发 HMR API。
4.  将任何事件发送回 Vite 开发服务器。

在更广泛的背景下，HMR 客户端帮助将 Vite 开发服务器和 HMR API 粘合在一起。让我们来看看这种粘合是如何工作的。

![](https://img.alicdn.com/imgextra/i1/O1CN01HTkPv523zotnjFHrA_!!6000000007327-2-tps-1266-434.png)

### 客户端初始化

在 HMR 客户端可以从 Vite 开发服务器接收任何消息之前，它需要首先通过 [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) 建立与之的连接。以下是一个设置 WebSocket 连接以处理 HMR 传播结果的示例：

```js
// /@vite/client (URL)
const ws = new WebSocket('ws://localhost:5173')
ws.addEventListener('message', ({ data }) => {
  const payload = JSON.parse(data)
  switch (payload.type) {
    case '...':
    // Handle payloads...
  }
})
// Send any events to the Vite dev server
ws.send('...')
```

我们将在下一节更多地讨论 payload 处理。

此外，HMR 客户端还初始化了一些处理 HMR 所需的状态，并导出了几个 API，例如 `createHotContext()` ，供使用 HMR API 的模块使用。例如：

```js
// app.jsx
// Injected by Vite's import-analysis plugin
import { createHotContext } from '/@vite/client'
import.meta.hot = createHotContext('/src/app.jsx')
export default function App() {
  return <div>Hello World</div>
}
// Injected by `@vitejs/plugin-react`
if (import.meta.hot) {
  // ...
}
```

传递给 `createHotContext()` 的 URL 字符串（也称为“所有者路径”）有助于识别哪个模块能够接受更改。在内部，`createHotContext` 将注册的 HMR 回调分配给“所有者路径到接受回调、处置回调和修剪回调”的映射单例。我们下面也会提到这个！

这就是模块如何与 HMR 客户端交互并执行 HMR 更改的方式。

### 处理来自服务器的 payload

在建立了 WebSocket 连接后，我们可以开始处理来自 Vite 开发服务器的负载。

/@vite/client (URL) \`/@vite/client\`（URL）

```js
// /@vite/client (URL)
ws.addEventListener('message', ({ data }) => {
  const payload = JSON.parse(data)
  switch (payload.type) {
    case 'full-reload': {
      location.reload()
      break
    }
    case 'update': {
      const updates = payload.updates
      // => { type: string, path: string, acceptedPath: string, timestamp: number }[]
      for (const update of updates) {
        handleUpdate(update)
      }
      break
    }
    case 'prune': {
      handlePrune(payload.paths)
      break
    }
    // Handle other payload types...
  }
})
```

上面的例子根据 `full-reload` 和 `update` 负载类型分别处理 HMR 传播的结果，以触发全页面重新加载或 HMR 更新。它还处理了当模块不再被使用时的修剪。

有更多类型的负载可以通过，这些负载并不特定于 HMR，但简要提及它们：

*   `connected`：当 WebSocket 连接建立时发送。
*   `error`: 当服务器端出现错误时发送，Vite 可以在浏览器中显示一个错误覆盖层。
*   `custom`: 由 Vite 插件发送，用于通知客户端任何事件。适用于客户端与服务器之间的互通信息。

继续，让我们来看看 HMR 更新实际是如何工作的。

### HMR 更新

在 HMR 传播过程中发现的每个 HMR 边界通常对应于一个 HMR 更新。在 Vite 中，更新采用这个签名：

```ts
interface Update {
  // The type of update
  type: 'js-update' | 'css-update'
  // The URL path of the accepted module (HMR boundary root)
  path: string
  // The URL path that is accepted (usually the same as above)
  // (We'll talk about this later)
  acceptedPath: string
  // The timestamp when the update happened
  timestamp: number
}
```

不同的 HMR 实现可以自由地重新定义更新签名。在 Vite 中，它被区分为“JS 更新”或“CSS 更新”，其中 CSS 更新是特殊情况，仅在更新时简单地交换 HTML 中的 `link` 标签。

对于 JS 更新，我们需要找到相应的模块来调用它的 `import.meta.hot.accept()` 回调，以便它可以对自身应用 HMR。由于在 `createHotContext()` 中我们已经注册了路径作为第一个参数，我们可以通过更新的 `path` 轻松找到匹配的模块。并且有了更新的 `timestamp` ，我们也可以获取模块的新版本传递给 `import.meta.hot.accept()` 。以下是一个实现的样子：

```ts
// /@vite/client (URL)
// Map populated by `createHotContext()`
const ownerPathToAcceptCallbacks = new Map<string, Function[]>()
async function handleUpdate(update: Update) {
  const acceptCbs = ownerPathToAcceptCallbacks.get(update.path)
  const newModule = await import(`${update.acceptedPath}?t=${update.timestamp}`)
  for (const cb of acceptCbs) {
    cb(newModule)
  }
}
```

然而，记得 `import.meta.hot.accept()` 有两个函数签名吗？

*   `import.meta.hot.accept(cb: Function)`
*   `import.meta.hot.accept(deps: string | string[], cb: Function)`

上述实现只适用于第一个函数签名（自接受模块），但不适用于第二个。第二个函数签名的回调只有在依赖项更新时才需要被调用。在内部，我们可以将每个回调绑定到一组依赖项：

```js
// app.jsx
// URL: /src/app.jsx
import { add } from './utils.js'
import { value } from './stuff.js'
if (import.meta.hot) {
  import.meta.hot.accept(...)
  // { deps: ['/src/app.jsx'], fn: ... }
  import.meta.hot.accept('./utils.js', ...)
  // { deps: ['/src/utils.js'], fn: ... }
  import.meta.hot.accept(['./stuff.js'], ...)
  // { deps: ['/src/stuff.js'], fn: ... }
}
```

我们可以使用 `acceptedPath` 来匹配依赖并触发正确的回调函数。例如，如果 `stuff.js` 被更新， `acceptedPath` 将会是 `/src/stuff.js` ，而 `path` 将会是 `/src/app.jsx` 。通过这种方式，我们可以通知拥有者路径（ `path` ）接受的路径（ `acceptedPath` ）已经更新，拥有者可以处理其变化。我们可以这样调整 HMR 处理程序：

```ts
// /@vite/client (URL)
// Map populated by `createHotContext()`
const ownerPathToAcceptCallbacks = new Map<
  string,
  { deps: string[]; fn: Function }[]
>()
async function handleUpdate(update: Update) {
  const acceptCbs = ownerPathToAcceptCallbacks.get(update.path)
  const newModule = await import(`${update.acceptedPath}?t=${update.timestamp}`)
  for (const cb of acceptCbs) {
    // Make sure to only execute callbacks that can handle `acceptedPath`
    if (cb.deps.some((deps) => deps.includes(update.acceptedPath))) {
      cb.fn(newModule)
    }
  }
}
```

但我们还没有完成！在导入新模块之前，我们还需要确保使用 `import.meta.hot.dispose()` 正确地处理了旧模块。

```ts
// /@vite/client (URL)
// Maps populated by `createHotContext()`
const ownerPathToAcceptCallbacks = new Map<
  string,
  { deps: string[]; fn: Function }[]
>()
const ownerPathToDisposeCallback = new Map<string, Function>() 
async function handleUpdate(update: Update) {
  const acceptCbs = ownerPathToAcceptCallbacks.get(update.path)
  // Call the dispose callback if there's any
  ownerPathToDisposeCallbacks.get(update.path)?.() 
  const newModule = await import(`${update.acceptedPath}?t=${update.timestamp}`)
  for (const cb of acceptCbs) {
    // Make sure to only execute callbacks that can handle `acceptedPath`
    if (cb.deps.some((deps) => deps.includes(update.acceptedPath))) {
      cb.fn(newModule)
    }
  }
}
```

而至此，我们已经基本上实现了 HMR 客户端的主要部分！作为进一步的练习，你还可以尝试实现错误处理、空所有者检查、排队并行更新以提高可预测性等，这将使最终形态更加健壮。

### HMR pruning 剪枝

如在 `import.meta.hot.prune()` 中讨论的，Vite 在“导入分析”阶段内部处理 HMR 剪枝。当一个模块不再被任何其他模块导入时，Vite 开发服务器将向 HMR 客户端发送一个 `{ type: 'prune', paths: string[] }` 负载，在运行时独立剪除模块。

```ts
// /@vite/client (URL)
// Maps populated by `createHotContext()`
const ownerPathToDisposeCallback = new Map<string, Function>()
const ownerPathToPruneCallback = new Map<string, Function>()
function handlePrune(paths: string[]) {
  for (const p of paths) {
    ownerPathToDisposeCallbacks.get(p)?.()
    ownerPathToPruneCallback.get(p)?.()
  }
}
```

### HMR 失效

与其他 HMR API 不同， `import.meta.hot.invalidate()` 是一个可以在 `import.meta.hot.accept()` 期间调用以退出 HMR 的操作。在 `/@vite/client` 中，只需向 Vite 开发服务器发送一个 WebSocket 消息就这么简单：

```ts
// /@vite/client (URL)
// `ownerPath` comes from `createHotContext()`
function handleInvalidate(ownerPath: string) {
  ws.send(
    JSON.stringify({
      type: 'custom',
      event: 'vite:invalidate',
      data: { path: ownerPath }
    })
  )
}
```

当 Vite 服务器接收到这个请求时，它将再次从导入者开始执行 HMR 传播，并将结果（完全重载或 HMR 更新）发送回 HMR 客户端。

### HMR 事件

虽然 HMR 不需要，但 HMR 客户端也可以在接收到特定负载时在运行时发出事件。 [`import.meta.hot.on`](https://vitejs.dev/guide/api-hmr.html#hot-on-event-cb) 和 [`import.meta.hot.off`](https://vitejs.dev/guide/api-hmr.html#hot-off-event-cb) 可用于监听和取消监听这些事件。

```js
if (import.meta.hot) {
  import.meta.hot.on('vite:invalidate', () => {
    // ...
  })
}
```

发出和跟踪这些事件的方式与我们处理上述 HMR 回调的方式非常相似。以 HMR 失效代码为例：

```ts
// /@vite/client (URL)
const eventNameToCallbacks = new Map<string, Set<Function>>() 
// `ownerPath` comes from `createHotContext()`
function handleInvalidate(ownerPath: string) {
  eventNameToCallbacks.get('vite:invalidate')?.forEach((cb) => cb()) 
  ws.send(
    JSON.stringify({
      type: 'custom',
      event: 'vite:invalidate',
      data: { path: ownerPath }
    })
  )
}
```

### HMR 数据

最后，HMR 客户端还提供了一种使用 [`import.meta.hot.data`](https://vitejs.dev/guide/api-hmr.html#hot-data) 在 HMR API 之间共享数据的方法。这些数据也可以传递给 `import.meta.hot.dispose()` 和 `import.meta.hot.prune()` 的 HMR 回调函数。

保留数据的方式也类似于我们跟踪 HMR 回调的方法。以 HMR 清理代码为例：

```ts
// /@vite/client (URL)
// Maps populated by `createHotContext()`
const ownerPathToDisposeCallback = new Map<string, Function>()
const ownerPathToPruneCallback = new Map<string, Function>()
const ownerPathToData = new Map<string, Record<string, any>>() 
function handlePrune(paths: string[]) {
  for (const p of paths) {
    const data = ownerPathToData.get(p)
    ownerPathToDisposeCallbacks.get(p)?.(data)
    ownerPathToPruneCallback.get(p)?.(data)
  }
}
```

## 总结

这就是关于 HMR 的全部内容了！回顾一下，我们学到了：

1.  如何使用 HMR API 来处理更改。
2.  如何通过编辑文件来触发 Vite 开发服务器向 HMR 客户端发送 HMR 更新。
3.  HMR 客户端如何处理 HMR 负载并触发正确的 HMR API。

在我们结束之前，如果你还有关于某些事情如何运作的问题，请查看下面的常见问题解答。

## 常见问题

### 我在哪里可以找到 Vite 的 HMR 实现的源代码？

*   [vite/src/client/client.ts](https://github.com/vitejs/vite/blob/main/packages/vite/src/client/client.ts) - 该源代码用于 `/@vite/client` 。
*   [vite/src/shared/hmr.ts](https://github.com/vitejs/vite/blob/main/packages/vite/src/shared/hmr.ts) - 由 `/@vite/client` 使用的 HMR 客户端实现。也为 SSR 中的 HMR 客户端抽象化。（参见 `HMRClient` ）
*   [vite/src/node/server/hmr.ts](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/server/hmr.ts) - 处理 HMR 传播。（参见 `handleHMRUpdate` ）

### 有没有可以学习的 HMR 示例？

HMR 通常由 JS 框架通过“组件”概念来实现，其中每个组件都能够隔离它们的状态并重新初始化自己。因此，你可以查看像 React、Vue、Svelte 等框架是如何实现它们的：

*   React: [Fast Refresh](https://github.com/facebook/react/tree/main/packages/react-refresh) 和 [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/src/fast-refresh.ts)
*   Vue: [`@vue/runtime-core`](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/hmr.ts) 和 [`@vitejs/plugin-vue`](https://github.com/vitejs/vite-plugin-vue/blob/main/packages/plugin-vue/src/main.ts)
*   Svelte: [`svelte-hmr`](https://github.com/sveltejs/svelte-hmr/tree/master/packages/svelte-hmr) 和 [`@vitejs/plugin-svelte`](https://github.com/sveltejs/vite-plugin-svelte/blob/main/packages/vite-plugin-svelte/src/utils/compile.js)

### Vite 的实现与 Webpack 和其他工具有何不同？

我没有深入研究 Webpack 的实现，但是阅读了 [Webpack 文档](https://webpack.js.org/concepts/hot-module-replacement/)和这篇 [NativeScript 文章](https://blog.nativescript.org/deep-dive-into-hot-module-replacement-with-webpack-part-one-the-basics/)来了解它的工作原理。据我所知，一般的区别似乎在于 Webpack 在客户端而不是服务器端处理 HMR 传播。

这种差异的好处在于 HMR API 可以更加动态地使用，相比之下，Vite 需要在服务器端静态分析正在使用的 HMR API，以确定模块是否调用了 `import.meta.hot.accept()` 。然而，在客户端处理 HMR 传播可能会很复杂，因为其他重要信息（例如导入者、导出、id 等）只存在于服务器中。为此进行重构需要在客户端序列化部分模块表示，并与服务器保持同步，这可能会很复杂。

### 服务器端渲染中的 HMR 是如何工作的？

在撰写本文时（Vite 5.0），SSR 中的 HMR 尚未得到支持，但将[作为实验性功能](https://github.com/vitejs/vite/pull/12165)在 Vite 5.1 中推出。即使在 SSR 中没有 HMR，你仍然可以在客户端为像 Vue 和 Svelte 这样的 JS 框架获得 HMR。

服务器端代码的更改需要完全重新执行 SSR 入口点，这可以通过 HMR 传播触发（这也适用于 SSR）。但通常服务器端代码的 HMR 传播会导致整个页面重新加载，这对于客户端重新向服务器发送请求来说是完美的，随后服务器将执行重新执行。

### 如何在 `handleHotUpdate()` 中触发页面重新加载？

The `handleHotUpdate()` API 旨在处理应当作废并通过 HMR 传播的模块。然而，在某些情况下，检测到的更改可能需要立即重新加载页面。

在 Vite 中，你可以使用 `server.ws.send({ type: 'full-reload' })` 来触发全页面重新加载，并且为了确保模块被废弃但不会触发 HMR 传播（这可能会错误地导致不必要的 HMR），你可以使用 `server.moduleGraph.invalidateModule()` 。

```js
function reloadPlugin() {
  return {
    name: 'reload',
    handleHotUpdate(ctx) {
      if (ctx.file.includes('/special/')) {
        // Trigger page reload
        ctx.server.ws.send({ type: 'full-reload' })
        // Invalidate the modules ourselves
        const invalidatedModules = new Set()
        for (const mod of ctx.modules) {
          ctx.server.moduleGraph.invalidateModule(
            mod,
            invalidatedModules,
            ctx.timestamp,
            true
          )
        }
        // Don't return any modules so HMR doesn't happen,
        // and because we already invalidated above
        return []
      }
    }
  }
}
```

### HMR API 有没有具体的规范？

我所知道的唯一规范是 [https://github.com/FredKSchott/esm-hmr](https://github.com/FredKSchott/esm-hmr) ，但该规范已被存档。Vite 在开始时实现了这个规范，但后来有所偏离，例如 `import.meta.hot.decline()` 没有被实现。

如果你有兴趣实现自己的 HMR API，你可能需要在 Vite 或 Webpack 等之间选择一个。但在其核心，接受和废弃更改的术语将保持不变。

### 有没有其他学习 HMR 的资源？

除了 [Vite](https://vitejs.dev/guide/api-hmr.html)、[Webpack](https://webpack.js.org/concepts/hot-module-replacement/) 和 [Parcel](https://parceljs.org/features/development/#hot-reloading) 关于 HMR 的文档之外，没有太多资源能深入理解 HMR 的真正工作原理。然而，这些是我发现有帮助的几个：

*   [HMR 到底是什么？- Pedro Cattori (YouTube)](https://youtu.be/e5M_5jKPaL4)

## 结束语

原来，热模块替换并不那么容易，标题主要是半开玩笑地写的。但我让你读到了这里，希望现在理解起来更容易了。如果你对 HMR 还有其他问题，随时可以跳进 [Vite `#contributing` 频道](https://chat.vitejs.dev/)了解更多！

我还想感谢 [@\_ArnaudBarre](https://twitter.com/_ArnaudBarre) 对这篇博客的审阅。
