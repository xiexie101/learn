---
title: "367 - 《webpack externals 里用 React 和 window.React 有何区别》"
date: 2023-11-03
url: https://sorrycc.com/externals-react-vs-window-react
---

发布于 2023年11月3日

# 367 - 《webpack externals 里用 React 和 window.React 有何区别》

真实场景下遇到的问题。问过 ChatGPT，他只答对了一半。很多经验都是问题驱动的，你遇不到这个问题，自然就不会想到他背后的原因。估计往上遇到这类问题的人太少，所以 ChatGPT 也不知道。

两种配置如下。

```ts
externals: {
  "react": "React"
}
```

和

```ts
externals: {
  "react": "window.React"
}
```

他们分别会产出这样的代码。

```ts
module.exports = React;
```

和

```ts
module.exports = window.React;
```

直接给答案吧，答案是在没有 window.React 时，前者 require 这个模块时会报错，而后者不会，只是结果是 undefined。

所以，当 externals 了 react 了模块，但又没有插入 react 的 umd 脚本时，就会触发这个问题。但你可能会觉得 externals 了 react 不是肯定会加 react 的 umd 吗？

换个场景，qiankun 的子应用里，依赖了 qiankun 做父子通讯之类的事，然后 externals 了 qiankun，但此时不需要通过 scripts 引入 qiankun 的 umd，因为父应用有提供 window.qiankun。看起来没啥问题，但是当子应用有被「单独打开」的需要时，就没有只有父应用才会提供 window.qiankun，然后就会触发这个问题。
