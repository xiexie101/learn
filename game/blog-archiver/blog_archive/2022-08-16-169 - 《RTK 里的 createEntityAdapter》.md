---
title: "169 - 《RTK 里的 createEntityAdapter》"
date: 2022-08-16
url: https://sorrycc.com/rtk-create-entity-adapter
---

发布于 2022年8月16日

# 169 - 《RTK 里的 createEntityAdapter》

最近在考虑 dva 3，所以对数据流相关的比较关注。

createEntityAdapter 是 Redux Toolkit 中的一个辅助方法，周末写 MDH 前端周刊时看到一篇文章中提到，顺着过去看了下，感觉能解一些问题。之前我也想过类似方案，但没这么具体。业务项目中 80% 的数据处理是 CURD，尤其是中后台，如果能让这些操作自动化，是能省不少人力的。

```ts
const booksAdapter = createEntityAdapter();
```

创建 adapter 之后，就可以用 booksAdapter 做 book 实体的数据增加、删除、修改和查询了。

比如：

```ts
booksAdapter.getSelectors().selectAll()
booksAdapter.getSelectors().selectById()
booksAdapter.addOne()
booksAdapter.setOne()
booksAdapter.updateOne()
booksAdapter.removeOne()
...
```

可以和 RTK 结合使用，也可以和 dva 结合使用。比如用于 dva 的 model。

```ts
export default {
  namespace: 'books',
  initialState: booksAdapter.getInitialState(),
  reducers: booksAdapter,
}
```

然后就可以通过 dispatch action 调用了。

```ts
dispatch({
  type: 'books/addOne',
  payload: { id: 1, name: 'foo' },
});
```

这能省一些事，但大家可能有发现，这里漏了 effects 层以及 service 层的处理。纯 reducer 只能解一部分问题，如果能把 effects 和 service 层一起做自动化生成，就能解更多问题了。

等等，还有视图层？

参考：  
[https://redux-toolkit.js.org/api/createEntityAdapter](https://redux-toolkit.js.org/api/createEntityAdapter)  
[https://ngrx.io/guide/entity/adapter](https://ngrx.io/guide/entity/adapter)
