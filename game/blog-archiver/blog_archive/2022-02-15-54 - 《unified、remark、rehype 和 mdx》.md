---
title: "54 - 《unified、remark、rehype 和 mdx》"
date: 2022-02-15
url: https://sorrycc.com/markdown-parser
---

发布于 2022年2月15日

# 54 - 《unified、remark、rehype 和 mdx》

[unified](https://unifiedjs.com/) 是用于文本处理的最底层引擎，拥有数百个插件。基于此有各种上层垂类场景的实现，比如支持 markdown 的 remark，支持 html 的 rehype，支持自然语言的 retext 等，并且每种实现都有自己的 ast，比如 markdown 的 mdast、html 的 hast 等。不同实现之间还可以互转，比如 markdown 转 html 用 remark-rehype，html 转 markdown 用 rehype-remark。

通常不直接用 unified，而是用 remark 和 rehype。示例代码见 [https://github.com/remarkjs/remark#example-turning-markdown-into-html](https://github.com/remarkjs/remark#example-turning-markdown-into-html) 。

![](https://img.alicdn.com/imgextra/i4/O1CN01v2Oqtd1X7G0XZynao_!!6000000002876-2-tps-1168-692.png)

一些常用插件：

❶ remark-gfm，支持 Github 风格的 Markdown（GFM），比如表格、脚注、任务列表、自动链接和文本中划线  
❷ remark-frontmatter，支持 YAML Frontmatter，如果要在 mdx 里使用 frontmatter 定义的数据，还要加上 remark-mdx-frontmatter  
❸ remark-toc，支持 TOC  
❹ rehype-pretty-code 或 @mapbox/rehype-prism 或 rehype-highlight，支持语法高亮  
❺ rehype-slug，给 H 标签增加锚点

更多 remark 和 rehype 的插件可以分别从 [https://github.com/remarkjs/awesome-remark](https://github.com/remarkjs/awesome-remark) 和 [https://github.com/remarkjs/awesome-rehype](https://github.com/remarkjs/awesome-rehype) 找。

[MDX](https://mdxjs.com/) 也是 unified 体系的，基于 remark 加上了 JSX 的能力，同时扩展了 mdast 为 mdxhast，实现的包叫 remark-mdx。详见 MDX 的架构参考 [https://mdxjs.com/packages/mdx/#architecture](https://mdxjs.com/packages/mdx/#architecture) 。

就 markdown 解析这块而言，remark 的竞品有 marked 和 markdown-it 等，marked 简单使用够，但如果要扩展，还得上 unified 这一套。
