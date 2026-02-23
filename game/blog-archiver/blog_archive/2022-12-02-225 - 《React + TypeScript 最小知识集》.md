---
title: "225 - 《React + TypeScript 最小知识集》"
date: 2022-12-02
url: https://sorrycc.com/react-typescript
---

发布于 2022年12月2日

# 225 - 《React + TypeScript 最小知识集》

1、props 类型不要用 React.FC 写法，因为[早已不推荐](https://github.com/facebook/create-react-app/pull/8177)，确定包括不能于泛型一起工作、不能与 defaultProps 一起工作等，用正常的函数参数声明即可。如果对返回值有更严格的要求，可以加 JSX.Element 或 React.ReactElement 返回值类型。

```tsx
type FooProps = { bar: string };
const Foo = (props: FooProps) => <div />;
const Foo = (props: FooProps): JSX.Element => <div />;
// 不推荐
const Foo: React.FC<FooProps> = (props) => <div />;
```

2、useState 能推断出类型时不用加类型，不能推断时用泛型加类型。

```ts
// 可以推断
useState(false);
useState([1,2,3]);
// 不能推断
useState<string[]>([]);
```

3、useEffect 不需要额外处理类型。

4、自定义 Hooks 是普通函数，按照函数的方式处理类型即可。

5、JSX 事件有 inline 和提取函数两种写法，前一种无需处理类型，后一种需要声明 event 类型。这个 event 声明这么长，怎么记呢？要么 google 搜索，要么通过 inline 的方式写一个 `e =>`，这时编辑器会提示 e 的类型，复制粘贴即可。

```tsx
// inline 方式
<button onClick={e => e.preventDefault()}>Go</button>
// 提取函数方式
function onClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {}
<button onClick={onClick}>Go</button>
```

![](https://img.alicdn.com/imgextra/i3/O1CN01IjoZXY1dJ3uXCx8vM_!!6000000003714-1-tps-720-304.gif)

6、[React.ReactElement 和 React.ReactNode 和 JSX.Element 有啥区别？](https://stackoverflow.com/questions/58123398/when-to-use-jsx-element-vs-reactnode-vs-reactelement)ReactElement 是包含 type 和 props 属性的对象，是 React.createElement 的返回类型；ReactNode 在 ReactElement 的基础上，还可以是 ReactFragment、string、number、ReactNode 的数组、null、undefined、布尔值，但不能是 object，同时 render 返回的类型是 ReactNode；JSX.Element 基本等同于 ReactElement，只是稍微宽松些。

7、children 声明类型有两种方式，1）手动加 children 类型，2）基于 react 提供的 PropsWithChildren。个人推荐前者，优点是一致性，在有 children 和无 children 两种状态切换时要变更的代码量相对较少。

```tsx
// 方法 1
type FooProps = {
  children?: React.ReactNode;
}

// 方法 2
import type { PropsWithChildren } from 'react';
type FooProps = PropsWithChildren<{}>;
```

8、希望 props 接受 html 元素（比如 input）的所有属性比如 className、id、placeholder 等？可通过继承自 react 的 HTMLAttributes 的方式实现。

```tsx
import type { HTMLAttributes } from 'react';
interface FooProps extends HTMLAttributes<HTMLInputElement> {}
```

参考：  
[https://profy.dev/article/react-typescript](https://profy.dev/article/react-typescript)  
[https://ente.io/blog/tech/typescript-for-react/](https://ente.io/blog/tech/typescript-for-react/)  
[https://www.yuque.com/chencheng/mdh-weekly/xdmmwv#099a05b8](https://www.yuque.com/chencheng/mdh-weekly/xdmmwv#099a05b8)
