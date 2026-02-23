---
title: "262 - 《Nuxt Devtool 和 Umi UI》"
date: 2023-02-15
url: https://sorrycc.com/nuxt-devtool-and-umi-ui
---

发布于 2023年2月15日

# 262 - 《Nuxt Devtool 和 Umi UI》

1、前几天看到 Nuxt Devtool 就想起了被我们废弃的 Umi UI，截图如下，第一眼还是挺惊艳的。简单试用了下，发现功能上比较纯粹简单，至少相比之前的 Umi UI 更简单一些，只有读和展示，没有比如修改配置、修改代码之类的写功能。

![](https://img.alicdn.com/imgextra/i1/O1CN01Lv5zq81GLapOGvSY5_!!6000000000606-0-tps-2568-1544.jpg)

2、由于 Nuxt 脚手架是通过 git clone 的方式做项目初始化，国内用户可能会遇到墙的问题。如果要尝鲜，可尝试以下三种方法。

1）命令行配代理，然后用官方脚手架创建的命令。（我试过没成功）

2）clone nuxt/starter 然后开启 devtools。

```bash
git clone git@github.com:nuxt/starter.git
cd starter
git checkout v3
pnpm i
pnpx nuxi@latest devtools enable
pnpm dev
```

3）clone nuxt/devtools 然后 npm run dev。

```bash
git clone git@github.com:nuxt/devtools.git
cd devtools
pnpm i
pnpm dev
```

3、基本原理是这样。1）提供两个路由，entry 和 client，entry 做 socket 连接用，client 提供 devtools 的客户端代码，2）添加 runtime/plugins/devtools.client 为 client plugin，随项目代码一起打包运行，3）devtools.client 点击后会通过 iframe 的方式加载 /client 路由，4）/client 路由会和 /entry 建立 socket 连接，继而做后续的数据拉取和展示。

为啥通过 iframe 挂载 /client，而不是让 /client 随着项目一起打包运行？我觉得是这样可以让 /client 对应用的影响控制在最小。

4、插件机制。Nuxt Devtools 提供了一套插件机制，可以让三方插件添加额外的 Panel，以 iframe 的形式。

```ts
nuxt.hook('devtools:customTabs', (tabs) => {
  tabs.push({
    // unique identifier
    name: 'my-module',
    // title to display in the tab
    title: 'My Module',
    // any icon from Iconify, or a URL to an image
    icon: 'carbon:apps',
    // iframe view
    view: {
      type: 'iframe',
      src: '/url-to-your-module-view',
    },
  });
})
```

5、Umi UI 为啥没做起来？Umi UI 基本上长下图这样，提供任务管理、配置、资产管理等能力，不仅仅是数据的展现，还包含大量对用户代码的修改和操作能力。没做起来有几个原因，1）开发成本高，尤其是涉及通过 ast 修改用户代码的部分时，2）没有解到用户痛点，内网使用人数较少，当时设计的杀手级功能「资产」也用的人不多，3）自己和团队成员的 KPI 压力。

![](https://img.alicdn.com/imgextra/i3/O1CN011lkkxd1wBi91hvO85_!!6000000006270-0-tps-1182-819.jpg)

6、今年要把 Umi UI 捡起来做吗？Umi 4 里其实有个极简版的 Umi UI。没对外，自己排查问题用的。大家启用 umi 项目后，加 `/__umi/` 路由，会看下以下界面。这里包含大量运行时和 Node 场景下的数据。看到 Nuxt Devtools 时其实有点想重新做，但是还没想好对于用户来说的痛点功能是啥，用户为啥用这个而不是用其他工具。

![](https://img.alicdn.com/imgextra/i1/O1CN01LaN7GX1niNr3Ohheo_!!6000000005123-2-tps-1776-1174.png)

6、如果做 Umi UI，计划会包含啥？脑暴了下发现有好多可以做，想想还有点小激动。可能会包含配置（含写操作）、路由（含写操作）、Doctor、DeadCode、Plugins（含写操作）、Imports、Module Graph（引用关系图）、内部数据（即现在的 appData）、MFSU、测试等，还有插件层的 React Query（集成 React Query 工具）、数据流、国际化，以及还有内部其他同学有计划要做的测试平台、监控等。

7、Umi UI 不应该做啥？不应该做其他工具能做地更好的事，比如任务管理、Terminal、ESLint、TSC 等等。应该发挥自身优点。那有啥优点呢？我觉得是，1）交互式，比如 import 之间的关系图谱，2）运行时，比如 React Query 的请求缓存、用户最终配置、Webpack 最终配置、路由最终配置等，3）Umi 内部数据，这也是外部拿不到的。

8、BONUS：与 Umi UI 相关的是，我一直想做个 npm script runner，基于 tauri。这样我就不需要每次都要打开 Terminal 进入项目目录执行 npm run dev 了。
