---
title: "译：TypeScript 5.2 的新关键词 using"
date: 2024-03-22
url: https://sorrycc.com/typescript-5-2-new-keyword-using
---

发布于 2024年3月22日

# 译：TypeScript 5.2 的新关键词 using

> 原文：[https://www.totaltypescript.com/typescript-5-2-new-keyword-using](https://www.totaltypescript.com/typescript-5-2-new-keyword-using)  
> 作者：Matt Pocock  
> 译者：ChatGPT 4 Turbo

TypeScript 5.2 引入了一个新关键词 - `using` - 你可以用它来处理任何具有 `Symbol.dispose` 函数的对象，当它离开作用域时自动释放。

```ts
{
  const getResource = () => {
    return {
      [Symbol.dispose]: () => {
        console.log('Hooray!')
      }
    }
  }

  using resource = getResource();
} // 控制台会输出 'Hooray!'
```

这是基于 [TC39 提案](https://github.com/tc39/proposal-explicit-resource-management) 的，该提案最近达到了其进度的阶段 3（共 4 个阶段），意味着它已经准备好被早期采用者测试。

`using` 将对管理资源非常有用，比如文件句柄、数据库连接等。

## `Symbol.dispose`

`Symbol.dispose` 是 JavaScript 中一个新的全局符号。任何分配给 `Symbol.dispose` 函数的对象将被视为一个 ‘资源’ - [“一个具有特定生命周期的对象”](https://github.com/tc39/proposal-explicit-resource-management#definitions) - 并且可以使用 `using` 关键词。

```ts
const resource = {
  [Symbol.dispose]: () => {
    console.log("Hooray!");
  },
};
```

## `await using`

你也可以使用 `Symbol.asyncDispose` 和 `await using` 来处理需要异步释放的资源。

```ts
const getResource = () => ({
  [Symbol.asyncDispose]: async () => {
    await someAsyncFunc();
  },
});

{
  await using resource = getResource();
}
```

这会在继续之前等待 `Symbol.asyncDispose` 函数。

这对于资源如数据库连接非常有用，当你想确保在程序继续执行前连接已经被关闭。

## 使用场景

### 文件句柄

使用 `using`，通过 node 中的文件句柄访问文件系统可能会更加容易。

没有 `using`：

```ts
import { open } from "node:fs/promises";

let filehandle;
try {
  filehandle = await open("thefile.txt", "r");
} finally {
  await filehandle?.close();
}
```

有了 `using`：

```ts
import { open } from "node:fs/promises";

const getFileHandle = async (path: string) => {
  const filehandle = await open(path, "r");

  return {
    filehandle,
    [Symbol.asyncDispose]: async () => {
      await filehandle.close();
    },
  };
};

{
  await using file = await getFileHandle("thefile.txt");

  // 使用 file.filehandle 做一些事情

} // 自动释放！
```

### 数据库连接

在 C# 中，管理数据库连接是使用 `using` 的常见用途。

不使用 `using`：

```ts
const connection = await getDb();

try {
  // 使用 connection 做一些事情
} finally {
  await connection.close();
}
```

使用 `using`：

```ts
const getConnection = async () => {
  const connection = await getDb();

  return {
    connection,
    [Symbol.asyncDispose]: async () => {
      await connection.close();
    },
  };
};

{
  await using db = await getConnection();

  // 使用 db.connection 做一些事情

} // 自动关闭！
```
