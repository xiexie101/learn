---
title: "222 - 《styled-components vs. emotion》"
date: 2022-11-29
url: https://sorrycc.com/styled-components-vs-emotion
---

发布于 2022年11月29日

# 222 - 《styled-components vs. emotion》

背景是我们要做 CSS 方案的选择，经过前一篇文章的分析，大致选择了 CSS-in-JS 的方向，然后现在在 styled-components 和 emotion 之间做最终抉择。

1、使用数据上二者差不多，从下载量看，styled-components 每周 464 万，emotion 每周 433 万。styled-components 更老牌，但 emotion 后来居上后也不差。

2、写法上，二者都支持 style.element 和 css props 的形式。区别是 styled-components 优先推荐前者，而 emotion 优先推荐后者。同时他们也都支持 Object 风格的写法，个人比较倾向 CSS 风格，对从 CSS 过来的同学更友好，由于有编辑器插件的支持，语法高亮和提示都不是问题。

```ts
// 写法 1
const Div = styled.div`color: red`;
// 写法 2
<div css=`color:red` />
```

```ts
// CSS 风格
styled.div`color: red`;
// Object 风格
styled.div({ color: 'red' });
```

3、产物尺寸上 emotion 略小。styled-components gzip 后 12.7K（6.0 测试版降到 10.7K），emotion gzip 后 8.5K。

4、功能上大家也差不多，不存在一个能做另一个不能做的情况。比如动态样式、动态 tag、扩展样式、伪元素伪类嵌套媒体查询动画、主题、全局样式、SSR。但是 Variants 两个都是不支持。。

```tsx
// 动态样式方法 1
const Button = styled.button`color: ${p => p.color}`;
<Button color="red" />;
// 动态样式方法 2，推荐，更简单，但要小心媒体查询的场景
const Button = styled.button`color: var(--color)`;
<Button style={{ '--color': 'red' }} />;
// 动态 Tag，作为 A 标签使用
const Button = styled.button``;
<Button as="a" href="" />;
// 伪元素伪类嵌套媒体查询动画
// 略
// 扩展样式
const Button = styled.button``;
const RedButton = styled(Button)`color: red`;
// 主题，借助 styled-theming 支持 variants 同时体验更好
const Button = styled.button`color: ${p => p.theme.mainColor}`;
<ThemeProvider theme={{ mainColor: 'red' }}><Button /></ThemeProvider>
// 全局样式
const GlobalStyle = createGlobalStyle``;
<GlobalStyle />;
```

5、文档上感觉 styled-components 更胜一筹。1）更详尽，2）emotion 的文档看着比较分裂，只花了一页篇幅介绍 styled 风格，我在看其他页面时会想通 styled 风格应该怎么做。

6、工具上。1）编辑器辅助层，styled-components 通过 [VSCode 官方插件](https://marketplace.visualstudio.com/items?itemName=styled-components.vscode-styled-components) 可以让模板字符串里的样式有高亮和提示，WebStorm 则是内置支持 styled-components，emotion 没具体试过，我理解由于语法相同，应该是借助 styled-components 的插件顺便支持 emotion 的，2）babel 插件功能差不多，分别是 babel-plugin-styled-components 和 @emotion/babel-plugin，swc 对于他们也都有配套的官方插件。

所以我选啥？我会选 styled-components。但是他们两个真的查不了多少，更多是看个人口味。我的原因如下。

1、styled-components 更「厚重」，就像我更偏爱 Google Docs、Reeder、Instapaper、OmniGraffle 等功能齐全历史「悠久」的工具，重器轻通常风险更小。

2、emotion 拆了好多包，虽然各有职责，但拆包也意味着额外的上手和选择成本。我其实是替蚂蚁的同学选，背后有大量的外包和数字马力的同学，选择的技术栈需要尽可能降低学习成本。

3、emotion 更灵活，包括支持非 React 技术栈，这些其实并不是我们所需要的。比如更灵活，对于团队而言，要求的是一致性，并不希望一个功能存在多种写法。

参考：  
[https://styled-components.com/](https://styled-components.com/)  
[https://emotion.sh/](https://emotion.sh/)  
[https://courses.joshwcomeau.com/css-for-js/03-components/03-styled-components-101](https://courses.joshwcomeau.com/css-for-js/03-components/03-styled-components-101)  
[https://blog.logrocket.com/styled-components-vs-emotion-for-handling-css/](https://blog.logrocket.com/styled-components-vs-emotion-for-handling-css/)  
[https://mxstbr.blog/2016/11/styled-components-magic-explained/](https://mxstbr.blog/2016/11/styled-components-magic-explained/)
