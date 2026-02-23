---
title: "译：Waku：Server actions 来了"
date: 2024-08-27
url: https://sorrycc.com/waku-server-actions-are-here
---

发布于 2024年8月27日

# 译：Waku：Server actions 来了

> 原文：[https://waku.gg/blog/server-actions-are-here](https://waku.gg/blog/server-actions-are-here)  
> 作者：Sophia Andren  
> 译者：ChatGPT 4 Turbo

尽管 Waku 已经对 Server Action 有了有限的支持，但今天的 v0.21 版本带来了对 React [Server Action](https://react.dev/reference/rsc/server-actions) API 的全面支持。这包括在服务器组件中创建的内联 Server Action，从单独文件导入的 Server Action，以及通过 `<form>` 元素操作属性调用 Server Action。

Server Action 允许您直接从 React 组件中定义和安全执行服务器端逻辑，无需手动设置 API 端点、使用 fetch 向它们发送 POST 请求，或管理挂起状态和错误。

继续了解更多关于新 API 的信息。

## [Server Action API](#server-actions-api)

#### [定义和保护操作](#defining-and-protecting-actions)

‘use server’ 指令将异步函数标记为 Server Action。Waku 自动创建一个可以作为 props 传递或导入到客户端组件的操作引用，然后可以调用引用的函数。

当指令放置在函数体的顶部时，它将标记那个特定函数为一个 Action。另外，指令可以放在文件的顶部，这将一次性标记 _所有_ 导出的函数为 Action。

注意不要在不适当的地方添加指令，以避免无意中创建不需要的端点。Server Action创建的端点在没有添加自己的认证和授权逻辑到函数体内时，是 _不_ 安全的。

> 注意
> 
> ‘use server’ 指令与 ‘use client’ 指令无关。它 **不** 将组件标记为服务器组件，也 **不应** 放置在服务器组件的顶部！

#### [创建和消费 Action](#making-and-consuming-actions)

在服务器组件内创建一个内联 Server Action 时，它可以作为 props 传递给客户端组件。

```ts
// ./src/pages/contact.tsx

import db from 'some-db';

export default async function ContactPage() {
  'use server';
  const sendMessage = async (message: string) => {
    await db.messages.create(message);
  };

  return <ContactForm sendMessage={sendMessage} />;
}
```

```ts
// ./src/components/contact-form.tsx
'use client';

import { useState } from 'react';

export const ContactForm = ({ sendMessage }) => {
  const [message, setMessage] = useState('');

  return (
    <>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
      />
      <button onClick={() => sendMessage(message)}>发送消息</button>
    </>
  );
};
```

在单独的文件中创建 Server Action 时，可以直接将它们导入到客户端组件中。

> 注意
> 
> 当使用顶级 ‘use server’ 指令时，请注意 _所有_ 导出的函数将被制作成 API 端点。因此，请仅导出计划用于此目的的函数。如果合适，添加服务器端逻辑以验证适当的身份验证和授权。

```ts
// ./src/actions/send-message.ts
'use server';

import db from 'some-db';

export async function sendMessage(message: string) {
  await db.messages.create(message);
}
```

```ts
// ./src/components/contact-button.tsx
'use client';

import { sendMessage } from '../actions/send-message';

export const ContactButton = () => {
  const message = `Hello world!`;

  return <button onClick={() => sendMessage(message)}>发送消息</button>;
};
```

#### [调用 Action](#invoking-actions)

可以通过 onClick 或 onSubmit 等事件处理程序调用操作，如上述示例所示，也可以在 useEffect 钩子中基于您选择的任何条件调用。

也可以通过原生 `<form>` 元素上的一个动作 prop 调用它们。在这种情况下，Server Action 将自动接收一个包含所有表单字段值的 FormData 参数，包括隐藏的字段。

```ts
// ./src/actions/send-message.ts
'use server';

import db from 'some-db';

export async function sendMessage(formData: FormData) {
  const message = formData.get('message');

  await db.messages.create(message);
}
```

```tsx
// ./src/components/create-todo-button.tsx
'use client';

import { sendMessage } from '../actions/send-message';

export const ContactForm = () => {
  return (
    <form action={sendMessage}>
      <textarea name="message" rows={4} />
      <input type="hidden" name="secret-message" value="This too!" />
      <button type="submit">发送消息</button>
    </form>
  );
};
```

如果您需要向表单操作传递额外的参数，超出其原生表单字段，您可以使用 bind 方法创建一个带有额外参数的扩展 Server Action。

```ts
// ./src/components/create-todo-button.tsx
'use client';

import { sendMessage } from '../actions/send-message';

export const ContactForm = ({ author = 'guest' }) => {
  const sendMessageWithAuthor = sendMessage.bind(null, author);

  return (
    <form action={sendMessageWithAuthor}>
      <textarea name="message" rows={4} />
      <button type="submit">发送消息</button>
    </form>
  );
};
```

#### [增强 Action](#enhancing-actions)

Server Action 与许多其他 React API 集成，例如 [useTransition](https://react.dev/reference/react/useTransition) 钩子用于处理待定状态，[useActionState](https://react.dev/reference/react/useActionState) 钩子用于访问返回值，以及 [useOptimistic](https://react.dev/reference/react/useOptimistic) 钩子用于执行乐观 UI 更新。

查看演讲 [React 19 中有什么新内容？](https://www.youtube.com/watch?v=AJOGzVygGcY) 以了解更多信息。

## [Waku 的夏天](#summer-of-waku)

我们很高兴看到您将使用 Waku 构建什么，现在它完全支持 Server Action。享受加速开发许多常见用例，如表单提交、数据库操作等等！

一如既往，我们非常感谢您在我们的 [GitHub 讨论](https://github.com/dai-shi/waku/discussions) 中的反馈，并欢迎您加入我们的 [Discord 服务器](https://discord.gg/MrQdmzd) 分享您正在构建的内容。

请继续关注我们即将发布的 v0.22 版本，该版本将特性 API 路由，支持更复杂或资源密集型的服务器端功能。
