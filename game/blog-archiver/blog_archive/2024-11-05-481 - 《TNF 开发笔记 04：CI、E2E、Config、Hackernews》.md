---
title: "481 - 《TNF 开发笔记 04：CI、E2E、Config、Hackernews》"
date: 2024-11-05
url: https://sorrycc.com/tnf-04
---

发布于 2024年11月5日

# 481 - 《TNF 开发笔记 04：CI、E2E、Config、Hackernews》

1、CI 是 Cursor Composer 帮我加的，见 [https://github.com/umijs/tnf/blob/master/.github/workflows/ci.yml](https://github.com/umijs/tnf/blob/master/.github/workflows/ci.yml) 。几个注意点，1）他默认加了 Pnpm Store 的 Cache，作用是上一次 CI 完成之后把 Pnpm Store 存起来，然后下一次如果 pnpm-lock.yaml 没有变更时，会把上一次的 Pnpm Store 拉下来而不是重新安装。但是当 Pnpm Store 的保存很慢时，这就是个反优化了，所以我又把他去了，CI 时间从 2m 降回到 25s，见 [https://github.com/umijs/tnf/pull/11](https://github.com/umijs/tnf/pull/11) 。2）Windows 做下 prettier CI 会挂，先去了。

2、E2E 也是 Cursor Composer 写的，需求 prompt 如下。先加了个简单的，确保不会把 build 搞挂。基于 playwright 做 browser test。Cursor Composer 这次没有一次性给出答案，他以为 serve 有 createServer 之类的方法，其实没有，查了下文档，然后让他改用 serve-handler 来实现后解决。

```
在 ci 阶段增加 e2e 测试，单独跑。新增 pnpm run test:e2e 命令，相关脚本存于 scripts/e2e.ts 中，对 examples/normal 下的项目跑 pnpm run build 和用 serve package 启一个 server，然后用 playwright 打开相应的地址来验证 dom 结构下是否有值。
```

3、Config 基于 [c12](https://github.com/unjs/c12) 和 [zod](https://github.com/colinhacks/zod) 来做，见 [https://github.com/umijs/tnf/pull/9](https://github.com/umijs/tnf/pull/9) 。c12 的功能比较强大，帮我省了好多代码，缺点是依赖比较多和杂。zod 用于做配置校验，好处是你只需要写一份 Schema 配置，zod 会自动做推断类型，并帮你做好值校验。

注：Config 尝试让 Cursor Composer 来写失败了，自己手动调整的，需求 prompt 如下。

```
新增一个 src/config.ts 来处理配置读取，基于 c12。提供 loadConfig 和 watchConfig 方法，接受 { cwd: string } 参数，配置文件为 cwd + .tnfrc.ts 。
```

4、Hackernews Example 是同事加的。目前能跑，但和预期（性能最优化）还差不少，比如，1）没有用 loader 的方式装载数据，这样就没法用上 TanStack Router 强大的请求优化方案，2）详情页刷新后请求失败，因为用了全局数据存 list 数据，而详情页打开是没有 list 数据的，3）没有 preload 机制，点过去才装载数据会有些慢，4）没有做路由 component 的拆包和按需加载，当然就这个例子而言，因为 component 都比较小，做这一步提升效果比较有限。

参考：  
[https://github.com/unjs/c12](https://github.com/unjs/c12)  
[https://github.com/colinhacks/zod](https://github.com/colinhacks/zod)
