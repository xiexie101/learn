---
title: "译：使用 React Query 和 Zod 使 REST API 类型安全"
date: 2024-08-26
url: https://sorrycc.com/typesafe-rest-api
---

发布于 2024年8月26日

# 译：使用 React Query 和 Zod 使 REST API 类型安全

> 原文：[https://noahflk.com/blog/typesafe-rest-api](https://noahflk.com/blog/typesafe-rest-api)  
> 作者：Noah  
> 译者：ChatGPT 4 Turbo

**编者注：tRPC 方案的缺点是，前后端都必须用 TypeScript 编写，这不适用于大部分项目。而只用 TypeScript 声明类型的问题是，无法对 response 做校验，这是一种虚假的安全感。然后补几个想法，1）需要注意的是，zod 验证不应用于生产，2）zod 可以考虑和工程化结合，基于接口约定生成 zod schema。**

长久以来，我一直是使用 tRPC 构建端到端类型安全 API 的倡导者。这是一个令人惊叹的库，它允许你直接从前端调用后端函数，并完全保证类型安全。它能自动推断类型，因此你不必担心像使用 GraphQL 那样的代码生成。此外，它还封装了 React Query。这意味着你将享受到 React Query 提供的所有状态管理的好处。

一个很大的缺点是，tRPC 不仅要求你的前端，而且还要求你的后端都用 TypeScript 编写。即便如此，你还需要把所有东西放入一个单体仓库中，以便在前端和后端之间进行类型推断。对许多项目来说，这是一个无法启动的条件，因为你可能已经用完全不同的技术定义了一个完整的 REST API。所以，假设我们正在使用一个用 Django 编写的 REST API，并且我们要从用 TypeScript 编写的 React 前端调用它。我们怎样才能获得最佳的开发体验？

备注：这不会是一个完整的教程，展示如何在你的代码库中配置这些库。官方文档可以帮你解决这个问题。相反，请将这视为一个概念性的概述，说明如何将这些技术结合起来获得最佳可能的开发体验。

## 使用 React Query 进行数据获取

React Query，也被称为 TanStack Query，因为它已经被移植到不同的网络框架上，理所当然地成为了最受欢迎的 React 库之一。在我参与的每个项目中，我都直接或通过 tRPC 来使用它。一个常见的误解是 React Query 是一个数据获取库，但它不是。它是一个使异步状态同步化的工具。所以你仍然需要一个数据获取工具。内置的 `fetch` 浏览器 API 是默认的选择。React Query 所做的是包装一个异步的 fetch 函数，并通过一个 React 钩子将其作为同步数据返回给你。让我们看一个例子：

在 React 组件中获取数据的传统方式如下：

*   为数据初始化空的 `useState`
*   在 `useEffect` 中挂载时触发数据获取
*   使用 `setState` 存储结果数据
*   状态中保存的数据触发重新渲染显示数据

代码形式如下：

```ts
function DataFetchingComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('https://api.example.com/data');
      const result = await response.json();
      setData(result);
    };

    fetchData();
  }, []);

  if (!data) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <pre>{JSON.stringify(data)}</pre>
    </div>
  );
}
```

使用 React Query，我们可以简化为：

```ts
function DataFetchingComponent() {
  const fetchData = async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  };

  const { data, isLoading } = useQuery('data', fetchData);

  if (!isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <pre>{JSON.stringify(data)}</pre>
    </div>
  );
}
```

更加简洁，不是吗？但这还不是全部。现在想象一下，你需要编写自定义代码来处理以下事情：

*   在多个组件中访问同一数据而不重复获取
*   在变更过程中刷新数据
*   缓存和缓存失效
*   乐观更新
*   后台重新获取

React Query 为你处理了所有这些！所以它成为我项目中的核心技术并不令人惊讶。你会注意到的是，两个例子都没有关联任何 TypeScript 类型。那么让我们解决这个问题。

## 手动 API 类型安全

之前的代码示例没有办法知道类型。我们从常规 HTTP 端点获取数据，不论是否使用 React Query，端点都不提供任何类型信息。一种常见的使其类型安全的方法是设置一个 TypeScript 类型。一些项目通过代码生成来做到这一点，意味着有一个脚本从后端确定类型，然后在你的前端生成一个类型定义文件。这是一个有效的策略，但它需要复杂的设置和构建过程。因此，许多项目选择手动设置类型。

```ts
// 示例数据，可以是任何东西
interface FetchedData {
  id: number;
  name: string;
}

function DataFetchingComponent() {
  const fetchData = async (): Promise<FetchedData> => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  };

  const { data, isLoading } = useQuery('data', fetchData);

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

这样工作得很好。你的 `data` 对象现在拥有了定义的类型 `FetchedData`。但存在一个大问题：**你无法保证响应与你的类型之间的一致性**。TypeScript 给你一种虚假的安全感，以为某个属性总会存在。如果 API 突然不再包含这个属性在响应中，你无从知晓。

## Zod 验证

为了保证一致性，我们需要一种验证 API 响应的方法。这里，Zod 派上用场。你定义了一个描述 API 响应应该是什么样的模式：

```ts
import { z } from 'zod';

const FetchedDataSchema = z.object({
  id: z.number(),
  name: z.string(),
});
```

到目前为止，这看起来与我们的类型定义类似，但具有稍微不同的语法。但最好的部分是，我们可以基于这个模式自动生成一个类型定义。

```ts
type FetchedData = z.infer<typeof FetchedDataSchema>;
```

现在我们可以使用这个来验证 API 响应：

```ts
const FetchedDataSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type FetchedData = z.infer<typeof FetchedDataSchema>;

function DataFetchingComponent() {
  const fetchData = async (): Promise<FetchedData> => {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return FetchedDataSchema.parse(data);
  };

  const { data, isLoading } = useQuery('data', fetchData);

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <pre>{JSON.stringify(data)}</pre>
    </div>
  );
}
```

`parse(data)` 函数如果响应不符合模式，将会引发一个错误。然后，你可以按照你喜欢的方式来处理那个错误。现在我们已经有了如何从 React 使用 React Query 和 Zod 以类型安全的方式调用 REST API 的完整工作流。在生产应用中，你会将模式和获取函数移动到单犬的文件中，这样它们可以在你的应用程序中被重复使用。但除此之外，我们已经拥有了可以扩展到大型应用的完整设置。
