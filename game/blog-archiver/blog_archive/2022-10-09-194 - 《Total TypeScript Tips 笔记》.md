---
title: "194 - 《Total TypeScript Tips 笔记》"
date: 2022-10-09
url: https://sorrycc.com/total-typescript-tips
---

发布于 2022年10月9日

# 194 - 《Total TypeScript Tips 笔记》

1、从对象派生出 Union 类型

```ts
const foo = {
  a: 1, b: 2, c: 3,
};
type Foo = typeof foo;
type Bar = {
  [K in keyof Foo]: {
    [K2 in K]: number
  };
}[keyof Foo];
const bar: Bar = {
  a: 1
};
```

2、Union 类型转换，比如添加额外属性

```ts
type Foo = { type: 'user' } | { type: 'post' };
// 目标类型
// type Bar = { type: 'user', userId: string } | { type: 'post', postId: string };
type Bar = {
  [Type in Foo["type"]]: { type: Type } & Record<`${Type}Id`, string>
}[Foo["type"]];
const bar: Bar = {
  type: 'user',
  userId: '1234',
};
```

3、解码 URL 搜索参数

```ts
import { String, Union } from "ts-toolbelt";
const query = `home?a=foo&b=bar`;
type Query = typeof query;
type SecondQueryPart = String.Split<Query, "?">[1];
type QueryElements = String.split<SecondQueryPart, "&">;
type QueryParams = {
  [QueryElement in QueryElements[number]]: {
    [key in String.Split<QueryElement, "=">[0]]: String.split<QueryElement, "=">[1]
  }
}[QueryElements[number]];
// 合并 Union 为 Object
const obj: Union.Merge<QueryParams> = {
  a: "foo"
};
```

4、利用函数重载和泛型定义 compose 函数

```ts
function compose<Input, FirstArg>(
  func: (input: Input) => FirstArg,
): (input: Input) => FirstArg;
function compose<Input, FirstArg, SecondArg>(
  func: (input: Input) => FirstArg,
  func2: (input: FirstArg) => SecondArg,
): (input: Input) => SecondArg;
function compose<Input, FirstArg, SecondArg, ThirdArg>(
  func: (input: Input) => FirstArg,
  func2: (input: FirstArg) => SecondArg,
  func3: (input: SecondArg) => ThirdArg,
): (input: Input) => ThirdArg;
function compose(...args: any[]) {
  return {} as any;
}

const addOne = (a:number) => a + 1;
const numToString = (a:number) => a.toString();
const stringToNum = (a:string) => parseInt(a);

const x = compose(addOne, numToString, stringToNum);
x(1);
```

5、利用 extends 缩小泛型的范围

```ts
const getDeepValue = <
  Obj,
  FirstKey extends keyof Obj,
  SecondKey extends keyof Obj[FirstKey],
>(
  obj: Obj,
  firstKey: FirstKey,
  secondKey: SecondKey,
): Obj[FirstKey][SecondKey] => {
  return {} as any;
}
const obj = {
  foo: { f: true, b: 2 }
};
const x = getDeepValue(obj, 'foo', 'f');
```

7、实现 PropsFrom 从组件中提取 props

```ts
import React from 'react';
const MyComponent = (props: { enable: boolean }) => null;
class MyOtherComponent extends React.Component<{ enable: boolean }> {}
type PropsFrom<TComponent> =
  TComponent extends React.FC<infer Props>
    ? Props
    : TComponent extends React.Component<infer Props>
    ? Props
    : never;
const props: PropsFrom<typeof MyComponent> = {
  enable: false,
};
```

8、用泛型和 keyof 实现 objectKeys 函数

```ts
const foo = { a: 1, b: 2, c: 3 };
const objectKeys = <Obj extends Object>(obj: Obj): (keyof Obj)[] => {
  return Object.keys(obj) as (keyof Obj)[];
};
objectKeys(foo).forEach(key => {
  console.log(foo[key]);
});
```

9、使用泛型让 React 组件更灵活

```ts
interface TableProps<TItem> {
  items: TItem[];
  renderItem: (item: TItem) => React.ReactNode;
}
function Table<TItem>(props: TableProps<TItem>) {
  return null;
}
function Foo() {
  return <Table
    items={[{ id: "1", name: "Matt" }]}
    renderItem={(item) => <div>{item.id}</div>}
  />
}
```

10、实现 key remover

```ts
const makeKeyRemover =
  <Key extends string>(keys: Key[]) =>
  <Obj extends object>(obj: Obj): Omit<Obj, Key> => {
    return {} as any;
  }
const keyRemover = makeKeyRemover(['a', 'b']);
const x = keyRemover({ a: 1, b: 2, c: 3 });
x.c;
```

11、类型里主动报错

```ts
type checkArgs<Args> = Args extends any[] ? 'error args' : Args;
function foo<Arg>(args: checkArgs<Arg>) {}
foo(123);
foo([1]); // 报错
```

12、实现 DeepPartial

略。

13、允许任意字符串但同时具备自动提示怎么办？

```ts
type Size = 'xs' | 'sm' | Omit<string, 'xs' | 'sm'>;
function foo(size: Size) {}  
foo('xs'); // webstorm 下试了不会自动提示？
```

14、把模块转换为类型

```ts
// actions.ts
export const ADD_TODO = "ADD_TODO";
export const REMOVE_TODO = "REMOVE_TODO";

// another_file.ts
type ActionModule = typeof import('./actions');
type Action = ActionModule[keyof ActionModule];
```

15、使用 declare global 让类型跨模块生效

略。

16、使用泛型动态声明函数的参数数量和类型

```ts
type Event = { type: "FOO", payload: { userId: string } } | { type: "BAR" };
const sendEvent = <Type extends Event["type"]>(
  ...args: Extract<Event, { type: Type }> extends { payload: infer TPayload }
    ? [type: Type, payload: TPayload]
    : [type: Type]
) => {};
sendEvent({ type: "FOO", { payload: { userId: '123' } } });
sendEvent({ type: "BAR" });
```

17、开启 noUncheckedIndexedAccess 可以让对象访问更安全

```ts
const obj: Record<string, string[]> = {};
obj.foo.push('bar');
```

obj.foo 可能是 null，不开 noUncheckedIndexedAccess 是检测不出来的。

18、对 Union 类型做 Map，比如删除其中一项

```ts
type Foo = 'a' | 'b' | 'c';
type RemoveC<TType> = TType extends 'c' ? never : TType;
type FooWithoutC = RemoveC<Foo>;
```

19、知道什么时候该用泛型

当不清楚类型的可能性时，否则用 Union 即可。

20、使用泛型提取变量来简化类型声明

比如要提取 key 以 a 开头的部分。

```ts
type Foo<Obj> = {
  [K in Extract<keyof Obj, `a${string}`>]: Obj[K]
}[Extract<keyof Obj, `a${string}`>];
```

提取后。

```ts
type Foo<Obj, _ExtractKeys extends keyof Obj = Extract<keyof Obj, `a${string}`>> = {
  [K in _ExtractKeys]: Obj[K]
}[_ExtractKeys];
```

21、class 里使用 assert 函数

```ts
class Foo {
  createPost(title: string) {
    this.assertuserIsLoginIn();
    creatPost(this.loggedInUserId, title);
  }
  assertUserisLoggedIn(): asserts this is this & {
    loggedInUserId: string;
  } {
    if (!this.loggedInUserId) throw new Error('xxx');
  }
}
```

22、2 分钟完成 TypeScript 包发布准备

基于 [@preconstruct/cli](https://github.com/preconstruct/preconstruct)。

```bash
$ pnpm i @preconstruct/cli -D
$ npx preconstruct fix
$ npx preconstruct build
```

23、获取对象或者的值类型

```ts
interface Colors {
  foo: 'blue',
  bar: 'red',
}
type ColorValues = Colors[keyof Colors];
type Letters = ['a', 'b', 'c'];
type Letter = Letter[number];
```

24、用 infter 加 string 字面量操作对象的 key

```ts
interface ApiData {
  "maps:foo": string;
  "maps:bar": string;
}
type RemoveMapFromObj<T> = {
  [K in keyof T as RemovedMaps<K>]: T[K];
};
type RemovedMaps<T> = T extends `maps:${infer U}` ? U : T;
type Removed = RemoveMapFromObj<ApiData>;
//   ^?
```

25、用泛型代替函数重载可简化类型声明代码

略。

参考：  
[https://www.totaltypescript.com/tips](https://www.totaltypescript.com/tips)  
[https://github.com/millsp/ts-toolbelt](https://github.com/millsp/ts-toolbelt)
