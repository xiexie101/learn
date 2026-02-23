---
title: "324 - 《Framer Motion》"
date: 2023-07-21
url: https://sorrycc.com/framer-motion
---

发布于 2023年7月21日

# 324 - 《Framer Motion》

> 简单学习了下 Framer Motion，做下记录。之所以说简单学习，是因为我连官网文档都没看。。

1、Framer Motion 和 Framer 啥关系？Framer 是一个低代码网页生成工具，而 Framer Motion 是一个动画库。前者在部分产品中用了后者。Framer Motion 主要是为 React 设计的，其中部分功能也做了通用化处理，可以适用于原生 DOM。

2、Framer Motion 非常强大，同时也非常大。只用 `import { motion } from 'framer-motion'` 就会让你的产物多增加 97K 的产物尺寸（压缩后 gzip 前）。同时由于他用了一些高级特性比如 Proxy，使用时还需要注意浏览器兼容性，Framer 官网的浏览器兼容性是 Safari 13+、Chrome/Edge 81+ 和 Firefox 100+，还是比较高的。这些也决定了 Framer Motion 其实是有一定使用限制的。

3、Framer Motion 的学习门槛是比较陡的，里面包含大量的概念、配置项和动画类型，但不妨碍我们可以通过几个例子快速入门。

1）基础动画。

图。

```tsx
import { motion } from 'framer-motion';
import React from 'react';
import { styled } from 'styled-components';

const SPRING = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

const ToggleButtonWrapper = styled.div`
  padding: 20px 0;
  div {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #ff02c4;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
  }
`;

export function ToggleButton() {
  const [isEnabled, setIsEnabled] = React.useState(true);
  return (
    <ToggleButtonWrapper>
      <motion.div
        initial={false}
        transition={SPRING}
        animate={{
          x: isEnabled ? 0 : 100,
        }}
        onClick={() => {
          setIsEnabled(!isEnabled);
        }}
      >
        Toggle
      </motion.div>
    </ToggleButtonWrapper>
  );
}
```

我是基于 styled-components 写的样式，可切换成其他的。动画通过 `motion.div` 加配置项实现，比如通过 animate 设置动画属性，通过 transition 设置动画过程，通过把 initial 设置为 false 是禁用初始动画，可以防止初始渲染时闪一下。

补充一些背景知识。1）motion.div 基于 proxy，你甚至可以写 motion.abcde。基于此，motion 可以在 svg 里使用，2）为啥 `<foo />` 需要遵循首字母大写原则，而 motion.div 却不需要遵守？因为首字母大写是为了和 html 标签不冲突，而对象访问形式比如 foo.bar 肯定不会冲突，所以不需要遵守这个原则。

2）Layout 动画。

一旦涉及到一些和布局相关的属性动画时，比如 position、flex 相关的 CSS 属性变化，animate 属性就无能为力了，需要切换的 Layout 动画模式。

图

```tsx
import { motion } from 'framer-motion';
import React from 'react';
import { styled } from 'styled-components';

const LayoutButtonWrapper = styled.div`
  padding: 20px 0;
  button {
    /* 为了让文字动画平滑 */
    display: flex;
    justify-content: center;
    align-items: flex-start;

    background: red;
    color: white;
    font-weight: bold;
    border: 0;
  }
  button.maximized {
    position: absolute;
    inset: 0;
    width: 100%;
  }
`;

const SPRING = {
  type: 'spring',
  stiffness: 180,
  damping: 25,
};

export function LayoutButton() {
  const [isEnabled, setIsEnabled] = React.useState(false);
  return (
    <LayoutButtonWrapper>
      <motion.button
        layout={true}
        transition={SPRING}
        className={`${isEnabled ? 'maximized' : ''}`}
        onClick={() => {
          setIsEnabled(!isEnabled);
        }}
      >
        <motion.p layout="position" transition={SPRING}>
          Toggle
        </motion.p>
      </motion.button>
    </LayoutButtonWrapper>
  );
}
```

通过给 [motion.xxx](http://motion.xxx) 标签加 layout 属性即可切换到 layout 动画模式。需要注意的是，我们给里面的「Toggle」文本也套了个 [motion.xxx](http://motion.xxx) 标签，并且使用 layout 为 position，同时给他加上和外部 motion 标签相同的 SPRING 动画过程，这是为了让文本动画更流畅。你可以删除这些试试，会发现文本动画很诡异的。

补充一些背景知识。1）Layout 动画的实现原理叫 FLIP 技术，2）layout 动画基于 CSS transforms 实现，3）transition 属性不会集成，所以如果有嵌套，需要为子元素单独设置，4）浏览器标准里的 View Transitions API 可以做不少 layout 动画可以做的事，但目前还处于[非常早期](https://caniuse.com/?search=View%20Transition%20API)。

3）Shared Layout 动画。

Shared Layout 我的理解就是让两个或更多元素共用一个 LayoutId，这样一个消失另一个出现时，就可以实现 Layout 动画。一个经典的例子是菜单背景色块动画，可以参考 Vercel Dashboard 页面。我记得在 Flash 时代就有这个效果了，当时要实现这种是需要写大量的代码的。

图。

```tsx
import { motion } from 'framer-motion';
import React from 'react';
import { styled } from 'styled-components';

const SharedLayoutButtonWrapper = styled.div`
  display: flex;
  div {
    position: relative;
    span {
      position: absolute;
      inset: 0;
      background: hsl(0deg 0% 100% / 0.2);
      border-radius: 12px;
    }
    a {
      position: relative;
      display: block;
      padding: 10px 20px;
    }
  }
`;
export function SharedLayoutButton() {
  const links = ['oneoneone', 'two', 'threethreethree'];
  const [selectedId, setSelectedId] = React.useState<String | null>(null);

  return (
    <SharedLayoutButtonWrapper
      onMouseLeave={() => {
        setSelectedId(null);
      }}
    >
      {links.map((item) => {
        return (
          <div
            key={item}
            onMouseEnter={() => {
              setSelectedId(item);
            }}
          >
            {selectedId === item && <motion.span layoutId="anim-nav" />}
            <a href={`/${item}`}>{item}</a>
          </div>
        );
      })}
    </SharedLayoutButtonWrapper>
  );
}

```

代码很简单，通过给不同菜单元素下的 span 标签赋予相同的 layoutId 就可以了。

4、除了这些，Framer Motion 还有更多高级的动画功能，比如 Group Layout、Scroll 动画、SVG 描线动画等。

5、Framer Motion 是用 [motion.xxx](http://motion.xxx)，styled-components 是用 [styled.xxx](http://styled.xxx)，二者如何结合使用？方法很多，我想到的一共三种，1）第一种在前面已经看到了，嵌套法，[styled.xxx](http://styled.xxx) 里面的标签用 [motion.xxx](http://motion.xxx) 即可，2）as 法，比如 `<RedButton as={motion.button} />`，3）组装法，比如 `const RedButton = styled(motion.button)'color:red';` 。

参考：  
[Intro to Framer Motion • Josh W Comeau’s Course Platform](https://courses.joshwcomeau.com/joy-of-react/07-framer-motion/01-framer-motion)  
[Spring Physics animation in JavaScript](https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/)  
[Documentation | Framer for Developers](https://www.framer.com/motion/)  
[Inside Framer Motion’s Layout Animations - Matt Perry - YouTube](https://www.youtube.com/watch?v=5-JIu0u42Jc)  
[Aerotwist - FLIP Your Animations](https://aerotwist.com/blog/flip-your-animations/)  
[Animated SVG Logo](https://antfu.me/posts/animated-svg-logo)  
[Animated line drawing in SVG - JakeArchibald.com](https://jakearchibald.com/2013/animated-line-drawing-svg/)  
[How SVG Line Animation Works | CSS-Tricks - CSS-Tricks](https://css-tricks.com/svg-line-animation-works/)
