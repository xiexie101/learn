---
title: "447 - 《笔记：React Unpacked：A Roadmap to React 19》"
date: 2024-06-13
url: https://sorrycc.com/react-unpacked
---

发布于 2024年6月13日

# 447 - 《笔记：React Unpacked：A Roadmap to React 19》

> 2024.08.26，发现图裂了，我找时间修下。。

> 读 [https://www.youtube.com/live/T8TZQ6k4SLE?t=10112s](https://www.youtube.com/live/T8TZQ6k4SLE?t=10112s) 做的笔记，以及一些自己的想法。这个演讲很好，作者通过一个例子把 React 的部分新特性都串起来了，有时间的推荐直接看视频。

![](https://res.cloudinary.com/sorrycc/image/upload/v1718201899/blog/bzyz9vdf.png)

这是之前的写法，当用户在点击「加入购物车」时，会执行 handleAddToCart。这里有两个问题，1）race condition，当我们多次点击按钮触发时，由于发请求是异步，先后顺序可能不能保障，尤其是在有错误场景（比如库存不足）的时候，2）写法复杂，需手动处理 error 和 pending 状态。

![](https://res.cloudinary.com/sorrycc/image/upload/v1718202799/blog/iljuebv8.png)

React 19 的 startTransition 支持了异步，可以把整个 handleAddToCart 无改动直接包进来。但这里的问题是，由于 transition 包的任务是非紧急任务，所以多次点击时，transition 内部的 pending 状态变更不会即时反馈到 UI 上。

![](https://res.cloudinary.com/sorrycc/image/upload/v1718202869/blog/ntmawflu.png)

上一个问题的解法是，用 useTransition()，其返回值包含 pending 状态，基于此，可在 UI 里反馈 pending 状态。

![](https://res.cloudinary.com/sorrycc/image/upload/v1718203084/blog/yvxgzt9y.png)

由于是表单操作（注：非表单也能用 action），这里更简洁的写法是用 React 19 的新特性 action。通过给 form 加 action 属性指定 action 处理函数即可（注：通常这个处理函数应以 Action 结尾）。然后由于 action 内置了 transition，就不需要手动包一层 startTransition 了。但有个新问题，应该如何获取 pending 状态呢？

![](https://res.cloudinary.com/sorrycc/image/upload/v1718203169/blog/oj4gaaxh.png)

解法 1，是用 useFormStatus() Hook。但是，由于是基于 Context 的实现，使用时得往 form 下抽一层。

![](https://res.cloudinary.com/sorrycc/image/upload/v1718203378/blog/j6mjvqsc.png)

解法 2（个人更推荐），用 useActionState 把 action 包起来，其中就会包含 pending 状态，还可以返回额外的数据作为 state。

![](https://res.cloudinary.com/sorrycc/image/upload/v1718203568/blog/4ioesnnq.png)

返回 error 用于处理错误状态，非常简洁。

![](https://res.cloudinary.com/sorrycc/image/upload/v1718203665/blog/lx7ruy7a.png)

这是前后的代码对比，光从代码量上看就简单不少。

![](https://res.cloudinary.com/sorrycc/image/upload/v1718203996/blog/2pxzarnn.png)

React 19 还支持用 useOptimistic 做乐观更新。

![](https://res.cloudinary.com/sorrycc/image/upload/v1718204310/blog/833cfr8e.png)

![](https://res.cloudinary.com/sorrycc/image/upload/v1718204510/blog/hhu0ww6q.png)

![](https://res.cloudinary.com/sorrycc/image/upload/v1718204568/blog/fo48tj6o.png)

Next.js 的 Action 支持 server component。

参考：

[https://www.youtube.com/live/T8TZQ6k4SLE?t=10112s](https://www.youtube.com/live/T8TZQ6k4SLE?t=10112s)  
[React 19 全览 - 砖家](https://mp.weixin.qq.com/s/VsMr-420DOoyYdkGcGTjoQ)  
[React 19 Beta Release: A Quick Guide | by Zachary Lee | Apr, 2024 | Medium](https://javascript.plainenglish.io/react-19-beta-release-a-quick-guide-05678e2ed571)  
[译：React 19 Beta](https://sorrycc.com/react-19)  
[译：React 19 Beta 升级指南](https://sorrycc.com/react-19-upgrade-guide)  
[译：React 19 计划推出的新 Hooks](https://sorrycc.com/react-19-new-hooks)
