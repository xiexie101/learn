---
title: "译：Context engineering 是 AI 魔法的来源"
date: 2025-07-11
url: https://sorrycc.com/context-engineering-is-the-source-of-ai-magic
---

发布于 2025年7月11日

# 译：Context engineering 是 AI 魔法的来源

> 原文： [https://boristane.com/blog/context-engineering/](https://boristane.com/blog/context-engineering/)  
> 作者： Boris Tane  
> 译者： Gemini 2.5 Pro

## 目录

*   [目录](#%E7%9B%AE%E5%BD%95)
*   [什么是 context？](#%E4%BB%80%E4%B9%88%E6%98%AF-context)
*   [Context > 模型](#context--%E6%A8%A1%E5%9E%8B)
*   [邮件示例：优质 context 的魔力](#%E9%82%AE%E4%BB%B6%E7%A4%BA%E4%BE%8B%E4%BC%98%E8%B4%A8-context-%E7%9A%84%E9%AD%94%E5%8A%9B)
*   [像做产品一样构建 context](#%E5%83%8F%E5%81%9A%E4%BA%A7%E5%93%81%E4%B8%80%E6%A0%B7%E6%9E%84%E5%BB%BA-context)
*   [总结一下 (TL;DR)](#%E6%80%BB%E7%BB%93%E4%B8%80%E4%B8%8B-tldr)

Everyone’s busy tweaking prompts, swapping models, chaining tools. Yeah, models are getting better. Tools are getting fancier. But none of that matters if your **context sucks**.

大家都在忙着调 prompt，换模型，串联工具。没错，模型越来越好，工具越来越花哨。但如果你的 **context** 太烂，这一切都毫无意义。

Here’s the uncomfortable truth: **the main thing that really matters when building AI agents is the quality of the context you give the model.** Models are so good that most SOTA models can do most things with outstanding quality.

一个令人不舒服的事实是：**在构建 AI agent 时，真正重要的只有一件事，那就是你提供给模型的 context 的质量。** 现在的模型已经非常出色，大多数 SOTA 模型都能以极高的质量完成大部分任务。

Two products could be doing the exact same thing, but one feels magical and the other feels like a cheap demo. The difference? Context.

两个产品可能在做完全相同的事情，但一个感觉像有魔法，另一个则像个廉价的 demo。区别在哪？就在 Context。

![同样的模型，同样的人物，不同的结果](https://boristane.com/assets/blog/context-engineering/magic-vs-dud.png)  
同样的模型，同样的人物，不同的结果

* * *

## 什么是 context？

Context is everything the model sees before it produces tokens. It includes:

Context 是模型在生成 token 之前看到的一切。它包括：

*   the **system prompt** (what you tell the model it is)
*   the **user message** (what the user is asking)
*   any **external information**, tools, or retrieved documents you stuff in before the call
*   implicit context like **who the user is**, what they’ve done before, what they want right now, etc.
*   **system prompt**（你告诉模型它是什么）
*   **user message**（用户的提问）
*   在调用前塞给模型的任何**外部信息**、工具或检索到的文档
*   隐式 context，比如**用户是谁**、他们之前做过什么、他们现在想要什么等等。

The better this context, the better the model performs. Garbage in, garbage out, still true in 2025.

Context 越好，模型的表现就越好。“垃圾进，垃圾出” 这句老话，在 2025 年依然适用。

* * *

## Context > 模型

Models are already better than most of us at most tasks. But most AI tools still underperform, not because the model is bad, but because we’re feeding it a half-baked view of the world.

在大多数任务上，模型已经比我们大多数人做得更好了。但大多数 AI 工具的表现依然不尽人意，不是因为模型不行，而是因为我们喂给它的是一个半生不熟的世界观。

Let’s look at RAG as an example.

我们以 RAG 为例。

![从 Naive RAG 到 Agentic RAG](https://boristane.com/assets/blog/context-engineering/rag-diagram.png)  
从 Naive RAG 到 Agentic RAG

Naive RAG just dumps the top 3 chunks into the prompt and hopes for the best. Useful, sometimes. But the moment you move beyond toy examples, this starts to fall apart.

Naive RAG 只是把最相关的 3 个文档片段扔进 prompt，然后祈祷最好的结果。这有时有用。但一旦你超出了玩具级别的例子，这套方法就开始失灵了。

Agentic RAG, builds a contextual snapshot that includes data from multiple sources:

而 Agentic RAG 会构建一个情境快照，其中包含来自多个来源的数据：

*   the question
*   related documents
*   source structure
*   metadata
*   and critically, **the user’s intent and environment**
*   问题本身
*   相关文档
*   源数据结构
*   元数据
*   以及至关重要的，**用户的意图和环境**

For example, a coding agent shouldn’t just embed source files and search them. It should know:

例如，一个编程 agent 不应该仅仅是嵌入并搜索代码文件。它应该知道：

*   how to find and read any file in your repository
*   which files were changed recently
*   which files are open in your IDE
*   what the LSP says about types and errors
*   even what production logs and metrics say
*   如何在你的代码库中查找和读取任何文件
*   哪些文件最近被修改过
*   你的 IDE 中打开了哪些文件
*   LSP (语言服务器协议) 提示了哪些类型和错误信息
*   甚至生产环境的日志和指标数据说了些什么

That’s context. And that’s the difference between “meh” and “wow”.

这就是 context。这就是“不过如此”和“惊为天人”之间的区别。

* * *

## 邮件示例：优质 context 的魔力

Let’s say you’re a CTO at a startup. You get an email:

假设你是一家创业公司的 CTO。你收到一封邮件：

> Hey Boris, just checking if you’re around for a quick sync tomorrow. Would love to chat through a few ideas from our last call.

> 嘿 Boris，问一下你明天有没有空快速同步一下？想和你聊聊上次电话里提到的几个想法。

A decent AI email tool will reply like:

一个还不错的 AI 邮件工具会这样回复：

> Dear Jim,
> 
> Thank you for your message. Tomorrow works for me. May I ask what time you had in mind?
> 
> Best regards,  
> Boris

> 亲爱的 Jim，
> 
> 感谢您的来信。我明天有空。请问您想约在什么时间？
> 
> 此致，  
> Boris

**Who writes emails like this?**

**谁会这么写邮件啊？**

A magical agent will do a few things first:

而一个有魔力的 agent 会先做几件事：

*   check your **calendar**: you’re in back-to-back calls all day.
*   look at **previous emails to this person**: you’re friendly, informal.
*   scan **recent meeting notes**: this person is pitching a joint partnership.
*   pull in your **contact list**: they’re a senior PM at a partner org.
*   apply your **system prompt customisation**: “be concise, decisive, warm”
*   检查你的**日历**：你一整天都排满了会。
*   查看**你和这个人的过往邮件**：你们的沟通风格是友好、非正式的。
*   浏览**最近的会议纪要**：这个人正在提议一个合作项目。
*   调取你的**联系人列表**：他们是合作伙伴公司的一位高级产品经理。
*   应用你的 **system prompt 定制化指令**：“简洁、果断、热情”。

And finally generate and autonomously send an email that actually is helpful:

最后，它会生成并自动发送一封真正有用的邮件：

> _Hey Jim! Tomorrow’s packed on my end, back-to-back all day. Thursday AM free if that works for you? Sent an invite, lmk if works._

> _嘿 Jim！我明天日程排满了，一个会接一个。周四上午有空，你看行吗？我发了个日历邀请，如果时间可以麻烦确认下。_

That’s magic. Not because the model is smarter, but because the context is richer.

这就是魔法。不是因为模型更聪明，而是因为 context 更丰富。

![在生成 token 前构建 context](https://boristane.com/assets/blog/context-engineering/building-context.png)  
在生成 token 前构建 context

* * *

## 像做产品一样构建 context

You wouldn’t build a product without thinking deeply about state, user intent, and interaction history. So why treat your AI agent like a stateless chatbot?

你不会在不深入思考状态、用户意图和交互历史的情况下就去构建一个产品。那么，为什么要把你的 AI agent 当成一个无状态的聊天机器人呢？

Context engineering is the new prompt engineering.

Context engineering 就是新的 prompt engineering。

It means:

它意味着：

*   Designing the right structure and format for context
*   Knowing what context actually helps the model perform
*   Building pipelines to fetch, transform and deliver this context at runtime
*   Constantly improving context quality with feedback loops
*   为 context 设计正确的结构和格式
*   知道什么样的 context 才能真正帮助模型提升表现
*   构建在运行时获取、转换和交付这种 context 的 pipeline
*   通过反馈循环不断提升 context 的质量

* * *

## 总结一下 (TL;DR)

*   Models are great.
*   But **context is king**.
*   Context is the difference between a dumb assistant and a superpowered teammate.
*   Build your agents like you build your products: obsess over what they know, when they know it, and how they use it.
*   模型很棒。
*   但 **context 为王**。
*   Context 是一个愚蠢的助手和一个超能队友之间的区别。
*   像打造产品一样打造你的 agent：去琢磨它知道什么，什么时候知道，以及如何使用这些信息。

If your agent isn’t magical yet, don’t swap the model, **fix your context.**

如果你的 agent 还不够神奇，别急着换模型，**先去优化你的 context。**
