---
title: "326 - 《手写 styled-components》"
date: 2023-07-26
url: https://sorrycc.com/toy-styled-components
---

发布于 2023年7月26日

# 326 - 《手写 styled-components》

> 之前排查一个问题时把 styled-components 的源码大概翻了一遍，想着既然时间已经花了，就再多花点写个 toy version 记录下吧。

目标是支持最简的 styled-components 使用场景，如下。1）可以用 Tagged Template Literals 声明样式，2）支持 CSS 嵌套语法。

```tsx
import React from 'react';
import { styled } from '../libs/styled-components';

const Wrapper = styled.div`
  font-size: 12px;
  h1 {
    color: blue;
  }
`;

export default function Page() {
  return (
    <Wrapper>
      <h1>Page index</h1>
    </Wrapper>
  );
}
```

toy-styled-components 代码如下。

```tsx
import React from "react";
import * as stylis from "stylis";

function normalizeCSS(css, selector) {
  const compiled = stylis.compile(`${selector} {${css}}`);
  return stylis.serialize(compiled, stylis.stringify);
}

function insertRules(id, rules) {
  const style = document.createElement("style");
  style.id = id;
  document.head.appendChild(style);
  style.innerHTML = rules;
  return style;
}

class ComponentStyle {
  constructor(rules, componentId) {
    this.rules = rules;
    this.componentId = componentId;
  }
  generateAndInjectStyles() {
    const name = this.componentId;
    const css = this.rules.join("");
    insertRules(name, normalizeCSS(css, `.${name}`));
    return name;
  }
}

function useInjectedStyle(componentStyle: ComponentStyle) {
  const className = componentStyle.generateAndInjectStyles();
  return className;
}

function useStyledComponentImpl(forwardedComponent, props, forwardRef) {
  const propsForElement = { ...props, ref: forwardRef };
  const generatedClassName = useInjectedStyle(
    forwardedComponent.componentStyle
  );
  let classString = "";
  if (generatedClassName) {
    classString += ` ${generatedClassName}`;
  }
  propsForElement.className = classString;
  return React.createElement(forwardedComponent.target, propsForElement);
}

function createStyledComponent(tag: String, rules) {
  const componentId = "sc-" + Math.random().toString(36).substring(2, 9);
  const componentStyle = new ComponentStyle(rules, componentId);
  function forwardRefRender(props, ref) {
    return useStyledComponentImpl(Wrapped, props, ref);
  }
  const Wrapped = React.forwardRef(forwardRefRender);
  Wrapped.componentStyle = componentStyle;
  Wrapped.target = tag;
  return Wrapped;
}

const styled = {};
const domElements = new Set(["div"]);
domElements.forEach((tag) => {
  styled[tag] = (styles) => {
    return createStyledComponent(tag, styles);
  };
});

export { styled };
```

一些说明。

1、要实现前面例子里的要求，主要得做两件事，1）修改当前元素的 className，2）把通过 `style.xxx` 创建的样式连带 className 一起以 style 元素的形式插入到 dom 中。

2、Tagged Template Literals 实际上就是「函数调用数组参数」。这个实现中没有处理插值，就直接当数组处理了。

3、createStyledComponent 中，通过 React.forwardRef 透传 ref，让 ref 使用保持有效。

4、className 的生成这里直接用 sc- 前缀加随机值。

5、css 的序列化用的 stylis 库，emotion 和 styled-components 都基于此，可以想象成是 postcss 的 browser 轻量版。功能比如支持嵌套语法、Vendor Prefixing 等，还可以用中间件做很底层的事。

参考：  
[GitHub - styled-components/styled-components: Visual primitives for the component age. Use the best bits of ES6 and CSS to style your apps without stress 💅](https://github.com/styled-components/styled-components)  
[GitHub - thysultan/stylis: light – weight css preprocessor](https://github.com/thysultan/stylis)  
\[\[styled-components\]\]
