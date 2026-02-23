---
title: "600 - 《Claude Code + AI 写作流》"
date: 2025-10-24
url: https://sorrycc.com/claude-code-ai-writing-workflow
---

发布于 2025年10月24日

# 600 - 《Claude Code + AI 写作流》

> 梳理下我这几天的实践经验。

## 我的经验

周一系统梳理了下利用 AI 写作的工作流，基于 Claude Code 或 Neovate Code，包括从信息收集、选题、大纲、配图的全过程，然后周二周三简单实践了下，写了两篇如下，全程 AI 辅助，效率直接起飞。虽然 AI 味还比较重，以及各个环节都还有所欠缺。但整体感觉还行，尤其是第一篇的前半部分感觉写的很好，分享下方法给大家。

*   [ChatGPT Atlas: 浏览器的终局之战，还是又一个泡沫？](https://modelwatch.dev/p/chatgpt-atlas)
*   [Claude Code for Web: 当云端编码助手遭遇安全现实](https://modelwatch.dev/p/claude-code-for-web)

用传统的方式写一篇这种还是挺费精力的，一篇 3000 字的文章，从选题到写完，少说要 4-5 个小时。如果需要查资料、找例子，时间就更长了。

## 基本流程

基本流程如下。

*   信息收集（包括 deep research）
*   选题讨论（产出大纲）
*   产出初稿（按照大纲产出初稿，包括风格模仿）
*   审核校对
*   配图

巧妇难为无米之炊，「信息收集」就是把各种链接和资料收集起来，方法是不断把链接丢给 ai 要求 `「read https://…」` 就好，他会加到上下文里的。同时，如果觉得资料不够，也可以让 ai 自己搜索资料做 deep research。最终做下信息汇总。

「选题讨论」很重要，决定了文章的立意和方向。方法是给 ai 提供一个主题，然后让他生成几个选题方向，每个方向包含标题、核心角度、工作量评估、优劣势分析、大致大纲。然后从中选择一个最感兴趣的，进一步细化。我通常会在这里花比较多的时间，同时也会参考不同的选题下的大纲汇总成一个自己想要的。

有了选题和大纲后，就可以「产出初稿」了。一些 Tips，1）要让 ai 模仿之前的已有风格，当然也可以模仿别人的… 2）让 ai 参考你之前写过的文章库，加下引用，也可以让内容更有连贯性，3）可以从已有上下文中提取配图添加到文章里，4）加上相关链接，5）如果是技术文章，可以加上代码示例。

「审核校对」是保证文章质量的关键。我时间比较少，目前写的两篇都没咋做就发了…

最后是「配图」。我是让 ai 产出 5 种题图的 prompt 然后分别去生成，最后我做选择。

## 环境搭建和我的 Slash Commands

以 Claude Code 为例，任何其他支持 Slash Command 的 Code Agent 都可以，比如 Neovate Code。

创建 .claude/commands 目录，在下面组织你各个环节的 slash commands 即可，图省事可以拷贝下面我放的示例。

![](https://pic.sorrycc.com/proxy/1761114100359-670346498.png)

附上一些 prompt 。

```
---
name: Deep Research
---

Research the topic for a blog post. A well-done research should include:

- The basic overview of the topic
- Historical perspective, if applicable
- Current opinions on the topic, if applicable
- Any controversies that might be surrounding the topic
- Any future developments around the topic

The topic for the blog post is:
$ARGUMENTS
```

```
---
name: Topic
---

# Blog Topic Selection

## Your Task

Present 3-4 blog topic directions for the user to choose from. Each topic should be well-researched and carefully considered.

answer in Chinese.

## Process

### Step 1: Understand Context
- Ask the user about their general interest area or theme (if not already specified)

### Step 2: Present Topic Options

For each of the 3-4 topic directions, provide:

**Title** (Catchy, engaging title)
- Make it compelling and click-worthy
- Should clearly indicate the value to readers

**Core Angle** (Core angle/perspective)
- What unique perspective or insight does this take?
- Why is this angle interesting or valuable?

**Effort Estimation** (Effort estimation)
- ⭐ (1-2 hours: Simple topic, mostly conceptual)
- ⭐⭐ (3-5 hours: Moderate complexity, some examples/testing)
- ⭐⭐⭐ (6-10 hours: Complex topic, requires extensive testing/examples)
- ⭐⭐⭐⭐ (10+ hours: Deep dive, original research, multiple experiments)

**Advantages** (Advantages)
- Why this topic is strong
- Potential reader interest
- Relevance to current trends

**Disadvantages** (Disadvantages)
- Potential challenges
- What might make this harder to execute
- Any risks or limitations

**Outline** (Outline with 3-7 main sections)
- Section 1 title (estimated 300-500 words)
- Section 2 title (estimated 400-600 words)
- Section 3 title (estimated 500-700 words)
- ... (continue for 3-7 sections)
- Total estimated word count

### Step 3: Get User Choice
- Ask which topic direction resonates most
- Or if they want to combine elements from multiple options
- Or if they want to explore different directions

## Important Guidelines

- Make titles compelling and specific (avoid generic titles)
- Ensure each angle is genuinely different from the others
- Be realistic about effort estimation
- Consider the blog's existing voice and audience
- Focus on topics that provide real value to readers
- Prefer topics that showcase unique insights or practical knowledge

Now begin by understanding the context and presenting your 3-4 topic options.
```

```
---
name: Write
---

Produce a blog post using the information you have gathered and the blog post outline.

- The blog post will follow the outline and further enrich it with relevant details from the research report.
- Write in Chinese.
- Add relevant links to the blog post.
- Add relevant images to the blog post.
- Add relevant code snippets to the blog post.

Follow the style of what I wrote before.

<blog-post>
[Your previous blog posts as style reference]
</blog-post>
```

配图我用的 [image-gen-mcp](https://github.com/simonChoi034/image-gen-mcp)，背后是 gemini-2.5-flash-preview-image。google free key 好像用不了这个模型，我用的 openrouter 的 key，一张图人民币 2 毛 8 左右。

```
claude mcp add --transport stdio image-gen-mcp --env OPENROUTER_API_KEY=YOUR_KEY -- uvx --from image-gen-mcp image-gen-mcp
```

## 实战：以「ChatGPT Atlas」为例

1、信息收集

由于 ChatGPT Atlas 是刚发布的产品，所以资料比较少，所以让 ai 自己搜索内容做 deep research。同时我附加了几个高质量的链接地址。

```
>/aiblog/deep-research ChatGPT Atlas
>read https://openai.com/index/introducing-chatgpt-atlas/ and https://simonwillison.net/2025/Oct/21/introducing-chatgpt-atlas/
```

但是 [https://openai.com/index/introducing-chatgpt-atlas/](https://openai.com/index/introducing-chatgpt-atlas/) 这个链接的 server 做了限制，ai 无法访问。我手动访问，贴了内容告诉他的。

最后让他保存到本地文档做备份。

```
>save to chatgpt-atlas.research.md in chinese
```

2、选题讨论

```
>/aiblog/topic 
```

然后他会给 4 个选题供选择。（之前的没存图，配图临时换一个主题）

![](https://pic.sorrycc.com/proxy/1761111641928-122554022.png)

权衡后觉得第一个不错，就选了第一个，没做讨论。

3、产出初稿

```
>/aiblog/write choose 「Option 1」and write, then save to chatgpt-atlas.md
```

写完后发现没有遵循要求加链接，又手动让他加了下相关链接。

```
>add relevant links to @chatgpt-atlas.md
```

4、配图

```
>/aiblog/generate-images for chatgpt-atlas.md
```

他会用 google/gemini-2.5-flash-preview-image 模型生成 5 张图，保存到 images 目录下。

## 想法

虽然我目前的会员文章都是手写，但感觉借助 ai 写作是未来的趋势，只要保证案例、观点、风格等，其他的借助 ai 加工也无不可，可能产出文章的质量还会更好一些。

Claude Code 默认的 Sonnet 和 Opus 模型的技能点更偏向编程，写作能力可能相对较弱，之后会尝试用 Neovate Code 切到其他模型做下对比。
