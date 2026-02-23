---
title: "译：HTML 脚本元素属性：async 与 defer 与 type='module'"
date: 2024-06-06
url: https://sorrycc.com/html-script-element-attributes-async-vs-defer-vs-typemodule
---

发布于 2024年6月6日

# 译：HTML 脚本元素属性：async 与 defer 与 type='module'

> 原文：[https://webdeveloper.beehiiv.com/p/html-script-element-attributes-async-vs-defer-vs-typemodule](https://webdeveloper.beehiiv.com/p/html-script-element-attributes-async-vs-defer-vs-typemodule)  
> 作者：Zachary Lee  
> 译者：ChatGPT 4 Turbo

**编者注：一图胜千言，建议拉到最后直接看图，一目了然。**

![](https://images.unsplash.com/photo-1619545493446-b378e885c6de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0ODM4NTF8MHwxfHNlYXJjaHw0fHxsb2FkfGVufDB8fHx8MTcxNjM4ODQwNnww&ixlib=rb-4.0.3&q=80&w=1080&utm_source=beehiiv&utm_medium=referral)

我相信你对 HTML 中的 script 元素并不陌生。它有一些属性，例如 async、defer 等。你知道它们的作用以及它们之间的区别吗？

如果 script 元素没有添加任何属性，那么当浏览器遇到脚本时，会立即加载并执行它。在等待执行完成之后，才会继续解析后续的标签。这个阶段被称为解析 HTML。

![](https://cdn-images-1.medium.com/max/1117/1*B4dnRdJiDywdFML4uIWZUw.png)

如果脚本体积大或执行时间长，页面会长时间出现空白。就像上面的截图一样。这在一些 [SPA](https://en.wikipedia.org/wiki/Single-page_application?utm_source=webdeveloper.beehiiv.com&utm_medium=referral&utm_campaign=html-script-element-attributes-async-vs-defer-vs-type-module) 前端项目中尤其常见。

因此，针对这种情况，我们可以给 script 元素添加属性来进行优化。接下来，我将 script 元素分为三类，分别进行解释：

# **经典脚本**

当我们对 script 元素省略 `type` 属性或配置为 [JavaScript MIME 类型](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types?utm_source=webdeveloper.beehiiv.com&utm_medium=referral&utm_campaign=html-script-element-attributes-async-vs-defer-vs-type-module#textjavascript)（目前唯一有效的值是 `text/javascript`）时，该脚本为经典脚本。

```ts
<script type="text/javascript" async></script>
```

为经典脚本配置 async 属性时，脚本会立即获取，但不会阻塞 HTML 的解析。**一旦获取完成**，它就会立即执行，如果这时 HTML 还没有解析完，就会被阻塞。

```ts
<script type="text/javascript" src="/test.js" defer></script>
```

当为经典脚本配置 `defer` 属性时，脚本会立即被获取但不会阻塞 HTML 解析。它会在 HTML 解析完成后才执行，但它会阻塞 `DOMContentLoaded` 事件。

应当注意的是，如果这个经典脚本没有使用 src 属性，即一个内联脚本，`defer` 属性将没有效果。

# **模块脚本**

当我们为脚本元素配置 `type="module"` 时，该脚本就是一个模块脚本。

```ts
<script type="module"></script>
```

[ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules?utm_source=webdeveloper.beehiiv.com&utm_medium=referral&utm_campaign=html-script-element-attributes-async-vs-defer-vs-type-module) 可以在模块脚本内部使用，并且即使相同的模块脚本被加载多次，该脚本只会被执行一次。

在加载机制上，**其效果与经典脚本的 defer 相同。**

值得注意的是，如果模块脚本配置了 `src` 属性，那么与经典脚本（允许跨域）不同，这个模块脚本需要使用 CORS 协议进行跨域获取。

```ts
<script type="module" async></script>
```

当为模块脚本配置 async 属性时，其加载机制与配置了 async 的经典脚本相同。

```ts
<script type="module" defer></script>
```

当为模块脚本配置 defer 属性时，此属性无效。因为模块脚本默认是“defer”的。

# **其他**

当脚本元素的 type 属性值不是上述两个有效值时。那么这个脚本元素中的内容（包括 src）将被浏览器丢弃，不会被下载和执行。

# **结论**

下面的截图清楚地展示了这些类型之间的差异：

![](https://cdn-images-1.medium.com/max/1117/1*nmzAKz_RSbZ-E-m5B6pPaA.png)

图片来自 [WHATWG](https://html.spec.whatwg.org/multipage/scripting.html?utm_source=webdeveloper.beehiiv.com&utm_medium=referral&utm_campaign=html-script-element-attributes-async-vs-defer-vs-type-module)
