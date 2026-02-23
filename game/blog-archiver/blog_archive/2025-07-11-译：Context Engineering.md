---
title: "译：Context Engineering"
date: 2025-07-11
url: https://sorrycc.com/langchain-context-engineering
---

发布于 2025年7月11日

# 译：Context Engineering

> 原文： [https://blog.langchain.com/context-engineering/](https://blog.langchain.com/context-engineering/)  
> 作者： LangChain Team  
> 译者： Gemini 2.5 Pro

### TL;DR

Agents need context to perform tasks. Context engineering is the art and science of filling the context window with just the right information at each step of an agent’s trajectory. In this post, we break down some common strategies — **write, select, compress, and isolate —** for context engineering by reviewing various popular agents and papers. We then explain how LangGraph is designed to support them!

Agent 要完成任务，就离不开 context。Context engineering 是一门艺术和科学，它研究如何在 agent 的每一步执行路径中，都恰到好处地为其 context 窗口填充所需的信息。在这篇文章里，我们会回顾一些流行的 agent 和论文，并把常见的 context engineering 策略分解为四类：**写入 (write)、选择 (select)、压缩 (compress) 和隔离 (isolate)**。然后，我们会解释 LangGraph 是如何设计来支持这些策略的。

**Also, see our video on context engineering** [**here**](https://youtu.be/4GiqzUHD5AA?ref=blog.langchain.com)**.**

**另外，可以[在这里](https://youtu.be/4GiqzUHD5AA?ref=blog.langchain.com)观看我们关于 context engineering 的视频。**

![](https://blog.langchain.com/content/images/2025/07/image.png)

Context engineering 的几个通用类别

### Context Engineering

As Andrej Karpathy puts it, LLMs are like a [new kind of operating system](https://www.youtube.com/watch?si=-aKY-x57ILAmWTdw&t=620&v=LCEmiRjPEtQ&feature=youtu.be&ref=blog.langchain.com). The LLM is like the CPU and its [context window](https://docs.anthropic.com/en/docs/build-with-claude/context-windows?ref=blog.langchain.com) is like the RAM, serving as the model’s working memory. Just like RAM, the LLM context window has limited [capacity](https://lilianweng.github.io/posts/2023-06-23-agent/?ref=blog.langchain.com) to handle various sources of context. And just as an operating system curates what fits into a CPU’s RAM, we can think about “context engineering” playing a similar role. [Karpathy summarizes this well](https://x.com/karpathy/status/1937902205765607626?ref=blog.langchain.com):

用 Andrej Karpathy 的话来说，LLM 就像一种[新型操作系统](https://www.youtube.com/watch?si=-aKY-x57ILAmWTdw&t=620&v=LCEmiRjPEtQ&feature=youtu.be&ref=blog.langchain.com)。LLM 好比是 CPU，而它的 [context 窗口](https://docs.anthropic.com/en/docs/build-with-claude/context-windows?ref=blog.langchain.com)则像是 RAM，充当模型的工作内存。和 RAM 一样，LLM 的 context 窗口容量有限，处理各种来源的 context 时会受到[限制](https://lilianweng.github.io/posts/2023-06-23-agent/?ref=blog.langchain.com)。就像操作系统需要精心管理哪些数据能放入 CPU 的 RAM 一样，“context engineering” 扮演着类似的角色。[Karpathy 对此总结得很好](https://x.com/karpathy/status/1937902205765607626?ref=blog.langchain.com)：

> _\[Context engineering is the\] ”…delicate art and science of filling the context window with just the right information for the next step.”_

> _\[Context engineering 是\] “……一门精巧的艺术和科学，它研究如何为下一步操作，恰到好处地填充 context 窗口。”_

![](https://blog.langchain.com/content/images/2025/07/image-1.png)

LLM 应用中常用的 context 类型

What are the types of context that we need to manage when building LLM applications? Context engineering as an [umbrella](https://x.com/dexhorthy/status/1933283008863482067?ref=blog.langchain.com) that applies across a few different context types:

构建 LLM 应用时，我们需要管理哪些类型的 context？Context engineering 是一个[总括性](https://x.com/dexhorthy/status/1933283008863482067?ref=blog.langchain.com)概念，它涵盖了以下几种不同的 context 类型：

*   **Instructions** – prompts, memories, few‑shot examples, tool descriptions, etc
*   **Knowledge** – facts, memories, etc
*   **Tools** – feedback from tool calls
*   **指令 (Instructions)** – prompts、记忆、few-shot 示例、工具描述等
*   **知识 (Knowledge)** – 事实、记忆等
*   **工具 (Tools)** – 工具调用的返回结果

### Agent 的 Context Engineering

This year, interest in [agents](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com) has grown tremendously as LLMs get better at [reasoning](https://platform.openai.com/docs/guides/reasoning?api-mode=responses&ref=blog.langchain.com) and [tool calling](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com). [Agents](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com) interleave [LLM invocations and tool calls](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com), often for [long-running tasks](https://blog.langchain.com/introducing-ambient-agents/). Agents interleave [LLM calls and tool calls](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com), using tool feedback to decide the next step.

今年，随着 LLM 在[推理](https://platform.openai.com/docs/guides/reasoning?api-mode=responses&ref=blog.langchain.com)和[工具调用](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com)方面的能力越来越强，人们对 [agent](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com) 的兴趣大增。[Agent](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com) 会交替进行 [LLM 调用和工具调用](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com)，通常是为了执行[长时间运行的任务](https://blog.langchain.com/introducing-ambient-agents/)。Agent 交替执行 [LLM 调用和工具调用](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com)，并利用工具的返回结果来决定下一步该做什么。

![](https://blog.langchain.com/content/images/2025/07/image-2.png)

Agents interleave [LLM calls and](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com) [tool calls](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com), using tool feedback to decide the next step

Agent 交替进行 [LLM 调用](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com)和[工具调用](https://www.anthropic.com/engineering/building-effective-agents?ref=blog.langchain.com)，并利用工具的返回结果来决定下一步

However, long-running tasks and accumulating feedback from tool calls mean that agents often utilize a large number of tokens. This can cause numerous problems: it can [exceed the size of the context window](https://cognition.ai/blog/kevin-32b?ref=blog.langchain.com), balloon cost / latency, or degrade agent performance. Drew Breunig [nicely outlined](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com) a number of specific ways that longer context can cause perform problems, including:

然而，长时间运行的任务和不断累积的工具调用结果，意味着 agent 常常会消耗大量的 token。这会引发很多问题：可能会[超出 context 窗口的大小](https://cognition.ai/blog/kevin-32b?ref=blog.langchain.com)，导致成本和延迟激增，或者降低 agent 的性能。Drew Breunig [清晰地概述了](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com)过长的 context 会导致性能问题的几种具体方式，包括：

*   [Context Poisoning: When a hallucination makes it into the context](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com#context-poisoning)
*   [Context Distraction: When the context overwhelms the training](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com#context-distraction)
*   [Context Confusion: When superfluous context influences the response](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com#context-confusion)
*   [Context Clash: When parts of the context disagree](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com#context-clash)
*   [Context 污染 (Context Poisoning): 当幻觉进入了 context](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com#context-poisoning)
*   [Context 干扰 (Context Distraction): 当 context 压过了模型的训练数据](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com#context-distraction)
*   [Context 混淆 (Context Confusion): 当无关的 context 影响了模型的回答](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com#context-confusion)
*   [Context 冲突 (Context Clash): 当 context 中的不同部分相互矛盾](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html?ref=blog.langchain.com#context-clash)

![](https://blog.langchain.com/content/images/2025/07/image-3.png)

来自工具调用的 context 会在 agent 的多次交互中不断累积

考虑到这一点，[Cognition](https://cognition.ai/blog/dont-build-multi-agents?ref=blog.langchain.com) 公司指出了 context engineering 的重要性：

> _“Context engineering” … is effectively the #1 job of engineers building AI agents._

> _“Context engineering” …… 实际上是构建 AI agent 的工程师们的头等大事。_

[Anthropic](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com) 也明确地指出了这一点：

> _Agents often engage in conversations spanning hundreds of turns, requiring careful context management strategies._

> _Agent 常常会进行长达数百轮的对话，这需要非常精细的 context 管理策略。_

So, how are people tackling this challenge today? We group common strategies for agent context engineering into four buckets — **write, select, compress, and isolate —** and give examples of each from review of some popular agent products and papers. We then explain how LangGraph is designed to support them!

那么，现在人们是如何应对这个挑战的呢？我们把常见的 agent context engineering 策略分为四类——**写入 (write)、选择 (select)、压缩 (compress) 和隔离 (isolate)**——并通过回顾一些流行的 agent 产品和论文，为每一类提供实例。然后，我们会解释 LangGraph 是如何设计来支持它们的！

![](https://blog.langchain.com/content/images/2025/07/image-4.png)

Context engineering 的几个通用类别

### 写入 Context

_Writing context means saving it outside the context window to help an agent perform a task._

_写入 context，指的是将信息保存在 context 窗口之外，以帮助 agent 完成任务。_

**便笺 (Scratchpads)**

When humans solve tasks, we take notes and remember things for future, related tasks. Agents are also gaining these capabilities! Note-taking via a “[scratchpad](https://www.anthropic.com/engineering/claude-think-tool?ref=blog.langchain.com)” is one approach to persist information while an agent is performing a task. The idea is to save information outside of the context window so that it’s available to the agent. [Anthropic’s multi-agent researcher](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com) illustrates a clear example of this:

当人类解决任务时，我们会做笔记，并为未来相关的任务记住一些事情。Agent 也正在获得这些能力！通过“便笺 ([scratchpad](https://www.anthropic.com/engineering/claude-think-tool?ref=blog.langchain.com))”来记笔记，就是一种在 agent 执行任务时持久化信息的方法。这个想法是把信息保存在 context 窗口之外，以便 agent 需要时可以随时取用。[Anthropic 的多 agent 研究系统](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com)清楚地展示了这一点：

> _The LeadResearcher begins by thinking through the approach and saving its plan to Memory to persist the context, since if the context window exceeds 200,000 tokens it will be truncated and it is important to retain the plan._

> _主研究员（LeadResearcher）会首先思考方法，并将计划保存到“记忆”中以持久化 context，因为如果 context 窗口超过 20 万个 token，它就会被截断，而保留计划至关重要。_

Scratchpads can be implemented in a few different ways. They can be a [tool call](https://www.anthropic.com/engineering/claude-think-tool?ref=blog.langchain.com) that simply [writes to a file](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem?ref=blog.langchain.com). They can also be a field in a runtime [state object](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state) that persists during the session. In either case, scratchpads let agents save useful information to help them accomplish a task.

Scratchpad 可以用几种不同的方式实现。它可以是一个简单的[工具调用](https://www.anthropic.com/engineering/claude-think-tool?ref=blog.langchain.com)，仅仅是[写入一个文件](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem?ref=blog.langchain.com)。它也可以是运行时[状态对象 (state object)](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state) 中的一个字段，在整个会话期间保持不变。无论哪种方式，scratchpad 都让 agent 能够保存有用的信息来帮助它们完成任务。

**记忆 (Memories)**

Scratchpads help agents solve a task within a given session (or [thread](https://langchain-ai.github.io/langgraph/concepts/persistence/?ref=blog.langchain.com#threads)), but sometimes agents benefit from remembering things across _many_ sessions! [Reflexion](https://arxiv.org/abs/2303.11366?ref=blog.langchain.com) introduced the idea of reflection following each agent turn and re-using these self-generated memories. [Generative Agents](https://ar5iv.labs.arxiv.org/html/2304.03442?ref=blog.langchain.com) created memories synthesized periodically from collections of past agent feedback.

Scratchpad 帮助 agent 在单个会话（或[线程](https://langchain-ai.github.io/langgraph/concepts/persistence/?ref=blog.langchain.com#threads)）内解决任务，但有时 agent 需要跨越_多个_会话来记忆事情！[Reflexion](https://arxiv.org/abs/2303.11366?ref=blog.langchain.com) 论文引入了在每轮 agent 交互后进行反思，并重用这些自我生成的记忆的想法。[Generative Agents](https://ar5iv.labs.arxiv.org/html/2304.03442?ref=blog.langchain.com) 则会从过去 agent 的反馈集合中定期合成记忆。

![](https://blog.langchain.com/content/images/2025/07/image-5.png)

LLM 可以被用来更新或创建记忆

These concepts made their way into popular products like [ChatGPT](https://help.openai.com/en/articles/8590148-memory-faq?ref=blog.langchain.com), [Cursor](https://forum.cursor.com/t/0-51-memories-feature/98509?ref=blog.langchain.com), and [Windsurf](https://docs.windsurf.com/windsurf/cascade/memories?ref=blog.langchain.com), which all have mechanisms to auto-generate long-term memories that can persist across sessions based on user-agent interactions.

这些概念已经进入了像 [ChatGPT](https://help.openai.com/en/articles/8590148-memory-faq?ref=blog.langchain.com)、[Cursor](https://forum.cursor.com/t/0-51-memories-feature/98509?ref=blog.langchain.com) 和 [Windsurf](https://docs.windsurf.com/windsurf/cascade/memories?ref=blog.langchain.com) 这样的流行产品中。它们都有机制，可以根据用户与 agent 的互动，自动生成能跨会话持久化的长期记忆。

### 选择 Context

_Selecting context means pulling it into the context window to help an agent perform a task._

_选择 context，指的是将信息拉入 context 窗口，以帮助 agent 完成任务。_

**便笺 (Scratchpad)**

The mechanism for selecting context from a scratchpad depends upon how the scratchpad is implemented. If it’s a [tool](https://www.anthropic.com/engineering/claude-think-tool?ref=blog.langchain.com), then an agent can simply read it by making a tool call. If it’s part of the agent’s runtime state, then the developer can choose what parts of state to expose to an agent each step. This provides a fine-grained level of control for exposing scratchpad context to the LLM at later turns.

从 scratchpad 中选择 context 的机制取决于 scratchpad 是如何实现的。如果它是一个[工具](https://www.anthropic.com/engineering/claude-think-tool?ref=blog.langchain.com)，那么 agent 只需进行一次工具调用就可以读取它。如果它是 agent 运行时状态的一部分，那么开发者可以选择在每一步向 agent 暴露状态的哪些部分。这为在后续的交互中向 LLM 暴露 scratchpad context 提供了细粒度的控制。

**记忆 (Memories)**

If agents have the ability to save memories, they also need the ability to select memories relevant to the task they are performing. This can be useful for a few reasons. Agents might select few-shot examples ([episodic](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#memory-types) [memories](https://arxiv.org/pdf/2309.02427?ref=blog.langchain.com)) for examples of desired behavior, instructions ([procedural](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#memory-types) [memories](https://arxiv.org/pdf/2309.02427?ref=blog.langchain.com)) to steer behavior, or facts ([semantic](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#memory-types) [memories](https://arxiv.org/pdf/2309.02427?ref=blog.langchain.com)) for task-relevant context.

如果 agent 有能力保存记忆，它们也需要有能力选择与当前任务相关的记忆。这有几个好处。Agent 可以选择 few-shot 示例（[episodic](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#memory-types) [记忆](https://arxiv.org/pdf/2309.02427?ref=blog.langchain.com)）作为期望行为的例子，选择指令（[procedural](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#memory-types) [记忆](https://arxiv.org/pdf/2309.02427?ref=blog.langchain.com)）来引导行为，或者选择事实（[semantic](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#memory-types) [记忆](https://arxiv.org/pdf/2309.02427?ref=blog.langchain.com)）作为与任务相关的 context。

![](https://blog.langchain.com/content/images/2025/07/image-6.png)

One challenge is ensuring that relevant memories are selected. Some popular agents simply use a narrow set of files that are _always_ pulled into context. For example, many code agent use specific files to save instructions (”procedural” memories) or, in some cases, examples (”episodic” memories). Claude Code uses [`CLAUDE.md`](http://claude.md/?ref=blog.langchain.com). [Cursor](https://docs.cursor.com/context/rules?ref=blog.langchain.com) and [Windsurf](https://windsurf.com/editor/directory?ref=blog.langchain.com) use rules files.

一个挑战是确保选出的记忆是相关的。一些流行的 agent 只是简单地使用一小部分_总是_被拉入 context 的文件。例如，许多代码 agent 使用特定的文件来保存指令（“procedural” 记忆），或者在某些情况下，保存示例（“episodic” 记忆）。Claude Code 使用 [`CLAUDE.md`](http://claude.md/?ref=blog.langchain.com)。[Cursor](https://docs.cursor.com/context/rules?ref=blog.langchain.com) 和 [Windsurf](https://windsurf.com/editor/directory?ref=blog.langchain.com) 使用规则文件。

But, if an agent is storing a larger [collection](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#collection) of facts and / or relationships (e.g., [semantic](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#memory-types) memories), selection is harder. [ChatGPT](https://help.openai.com/en/articles/8590148-memory-faq?ref=blog.langchain.com) is a good example of a popular product that stores and selects from a large collection of user-specific memories.

但是，如果一个 agent 存储了大量的[事实和/或关系](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#collection)集合（例如，[semantic](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#memory-types) 记忆），选择就变得更难了。[ChatGPT](https://help.openai.com/en/articles/8590148-memory-faq?ref=blog.langchain.com) 就是一个很好的例子，它存储了大量针对特定用户的记忆，并从中进行选择。

Embeddings and / or [knowledge](https://arxiv.org/html/2501.13956v1?ref=blog.langchain.com#:~:text=In%20Zep%2C%20memory%20is%20powered,subgraph%2C%20and%20a%20community%20subgraph) [graphs](https://neo4j.com/blog/developer/graphiti-knowledge-graph-memory/?ref=blog.langchain.com#:~:text=changes%20since%20updates%20can%20trigger,and%20holistic%20memory%20for%20agentic) for memory indexing are commonly used to assist with selection. Still, memory selection is challenging. At the AIEngineer World’s Fair, [Simon Willison shared](https://simonwillison.net/2025/Jun/6/six-months-in-llms/?ref=blog.langchain.com) an example of selection gone wrong: ChatGPT fetched his location from memories and unexpectedly injected it into a requested image. This type of unexpected or undesired memory retrieval can make some users feel like the context window “_no longer belongs to them_”!

用于记忆索引的 Embeddings 和/或[知识](https://arxiv.org/html/2501.13956v1?ref=blog.langchain.com#:~:text=In%20Zep%2C%20memory%20is%20powered,subgraph%2C%20and%20a%20community%20subgraph)[图谱](https://neo4j.com/blog/developer/graphiti-knowledge-graph-memory/?ref=blog.langchain.com#:~:text=changes%20since%20updates%20can%20trigger,and%20holistic%20memory%20for%20agentic)常被用来辅助选择。尽管如此，记忆选择仍然具有挑战性。在 AIEngineer World’s Fair 上，[Simon Willison 分享了](https://simonwillison.net/2025/Jun/6/six-months-in-llms/?ref=blog.langchain.com)一个选择出错的例子：ChatGPT 从记忆中获取了他的位置信息，并出乎意料地将其注入到一张被请求的图片中。这种意想不到或不希望发生的记忆检索，可能会让一些用户觉得 context 窗口“_不再属于他们了_”！

**工具 (Tools)**

Agents use tools, but can become overloaded if they are provided with too many. This is often because the tool descriptions overlap, causing model confusion about which tool to use. One approach is [to apply RAG (retrieval augmented generation) to tool descriptions](https://arxiv.org/abs/2410.14594?ref=blog.langchain.com) in order to fetch only the most relevant tools for a task. Some [recent papers](https://arxiv.org/abs/2505.03275?ref=blog.langchain.com) have shown that this improve tool selection accuracy by 3-fold.

Agent 会使用工具，但如果提供的工具太多，它们可能会不堪重负。这通常是因为工具的描述相互重叠，导致模型在选择使用哪个工具时感到困惑。一种方法是[对工具描述应用 RAG（检索增强生成）](https://arxiv.org/abs/2410.14594?ref=blog.langchain.com)，以便只为任务获取最相关的工具。一些[最近的论文](https://arxiv.org/abs/2505.03275?ref=blog.langchain.com)表明，这样做可以将工具选择的准确率提高 3 倍。

**知识 (Knowledge)**

[RAG](https://github.com/langchain-ai/rag-from-scratch?ref=blog.langchain.com) is a rich topic and it [can be a central context engineering challenge](https://x.com/_mohansolo/status/1899630246862966837?ref=blog.langchain.com). Code agents are some of the best examples of RAG in large-scale production. Varun from Windsurf captures some of these challenges well:

[RAG](https://github.com/langchain-ai/rag-from-scratch?ref=blog.langchain.com) 是一个内容丰富的话题，它[可能是 context engineering 的核心挑战之一](https://x.com/_mohansolo/status/1899630246862966837?ref=blog.langchain.com)。代码 agent 是 RAG 在大规模生产中应用的一些最佳范例。来自 Windsurf 的 Varun 很好地抓住了其中一些挑战：

> _Indexing code ≠ context retrieval … \[We are doing indexing & embedding search … \[with\] AST parsing code and chunking along semantically meaningful boundaries … embedding search becomes unreliable as a retrieval heuristic as the size of the codebase grows … we must rely on a combination of techniques like grep/file search, knowledge graph based retrieval, and … a re-ranking step where \[context\] is ranked in order of relevance._

> _代码索引 ≠ context 检索……\[我们正在做索引和 embedding 搜索……\[通过\] AST 解析代码并沿着有语义意义的边界进行分块……随着代码库规模的增长，embedding 搜索作为一种检索启发式方法变得不可靠……我们必须依赖多种技术的组合，比如 grep/文件搜索、基于知识图谱的检索，以及……一个重排步骤，其中 \[context\] 会按相关性排序。_

### 压缩 Context

_Compressing context involves retaining only the tokens required to perform a task._

_压缩 context，指的是只保留执行任务所必需的 token。_

**Context 摘要 (Context Summarization)**

Agent interactions can span [hundreds of turns](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com) and use token-heavy tool calls. Summarization is one common way to manage these challenges. If you’ve used Claude Code, you’ve seen this in action. Claude Code runs “[auto-compact](https://docs.anthropic.com/en/docs/claude-code/costs?ref=blog.langchain.com)” after you exceed 95% of the context window and it will summarize the full trajectory of user-agent interactions. This type of compression across an [agent trajectory](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#manage-short-term-memory) can use various strategies such as [recursive](https://arxiv.org/pdf/2308.15022?ref=blog.langchain.com#:~:text=the%20retrieved%20utterances%20capture%20the,based%203) or [hierarchical](https://alignment.anthropic.com/2025/summarization-for-monitoring/?ref=blog.langchain.com#:~:text=We%20addressed%20these%20issues%20by,of%20our%20computer%20use%20capability) summarization.

Agent 的交互可能长达[数百轮](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com)，并使用消耗大量 token 的工具调用。摘要是一种应对这些挑战的常用方法。如果你用过 Claude Code，你肯定见过它的实际应用。当你的 context 窗口使用超过 95% 时，Claude Code 会运行“[自动压缩 (auto-compact)](https://docs.anthropic.com/en/docs/claude-code/costs?ref=blog.langchain.com)”，它会总结用户与 agent 的全部交互轨迹。这种对[agent 轨迹](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#manage-short-term-memory)的压缩可以使用多种策略，例如[递归式](https://arxiv.org/pdf/2308.15022?ref=blog.langchain.com#:~:text=the%20retrieved%20utterances%20capture%20the,based%203)或[层级式](https://alignment.anthropic.com/2025/summarization-for-monitoring/?ref=blog.langchain.com#:~:text=We%20addressed%20these%20issues%20by,of%20our%20computer%20use%20capability)摘要。

![](https://blog.langchain.com/content/images/2025/07/image-7.png)

摘要可以应用的几个地方

It can also be useful to [add summarization](https://github.com/langchain-ai/open_deep_research/blob/e5a5160a398a3699857d00d8569cb7fd0ac48a4f/src/open_deep_research/utils.py?ref=blog.langchain.com#L1407) at specific points in an agent’s design. For example, it can be used to post-process certain tool calls (e.g., token-heavy search tools). As a second example, [Cognition](https://cognition.ai/blog/dont-build-multi-agents?ref=blog.langchain.com#a-theory-of-building-long-running-agents) mentioned summarization at agent-agent boundaries to reduce tokens during knowledge hand-off. Summarization can be a challenge if specific events or decisions need to be captured. [Cognition](https://cognition.ai/blog/dont-build-multi-agents?ref=blog.langchain.com#a-theory-of-building-long-running-agents) uses a fine-tuned model for this, which underscores how much work can go into this step.

在 agent 设计的特定点[加入摘要](https://github.com/langchain-ai/open_deep_research/blob/e5a5160a398a3699857d00d8569cb7fd0ac48a4f/src/open_deep_research/utils.py?ref=blog.langchain.com#L1407)也很有用。例如，它可以用来后处理某些工具的调用（比如消耗大量 token 的搜索工具）。第二个例子是，[Cognition](https://cognition.ai/blog/dont-build-multi-agents?ref=blog.langchain.com#a-theory-of-building-long-running-agents) 提到了在 agent 之间的边界处进行摘要，以在知识传递过程中减少 token。如果需要捕捉特定的事件或决策，摘要可能会成为一个挑战。[Cognition](https://cognition.ai/blog/dont-build-multi-agents?ref=blog.langchain.com#a-theory-of-building-long-running-agents) 为此使用了一个微调模型，这突显了这一步可能需要投入多少工作。

**Context 修剪 (Context Trimming)**

Whereas summarization typically uses an LLM to distill the most relevant pieces of context, trimming can often filter or, as Drew Breunig points out, “[prune](https://www.dbreunig.com/2025/06/26/how-to-fix-your-context.html?ref=blog.langchain.com)” context. This can use hard-coded heuristics like removing [older messages](https://python.langchain.com/docs/how_to/trim_messages/?ref=blog.langchain.com) from a list. Drew also mentions [Provence](https://arxiv.org/abs/2501.16214?ref=blog.langchain.com), a trained context pruner for Question-Answering.

摘要通常使用 LLM 来提炼 context 中最相关的部分，而修剪则通常是过滤或者像 Drew Breunig 指出的那样，“[剪枝](https://www.dbreunig.com/2025/06/26/how-to-fix-your-context.html?ref=blog.langchain.com)” context。这可以使用硬编码的启发式规则，比如从列表中移除[较早的消息](https://python.langchain.com/docs/how_to/trim_messages/?ref=blog.langchain.com)。Drew 还提到了 [Provence](https://arxiv.org/abs/2501.16214?ref=blog.langchain.com)，一个为问答任务训练的 context 剪枝器。

### 隔离 Context

_Isolating context involves splitting it up to help an agent perform a task._

_隔离 context，指的是将其拆分开来，以帮助 agent 完成任务。_

**多 Agent (Multi-agent)**

One of the most popular ways to isolate context is to split it across sub-agents. A motivation for the OpenAI [Swarm](https://github.com/openai/swarm?ref=blog.langchain.com) library was [separation of concerns](https://openai.github.io/openai-agents-python/ref/agent/?ref=blog.langchain.com), where a team of agents can handle specific sub-tasks. Each agent has a specific set of tools, instructions, and its own context window.

最流行的隔离 context 的方法之一，就是将其分散到不同的子 agent 中。OpenAI 的 [Swarm](https://github.com/openai/swarm?ref=blog.langchain.com) 库的一个动机就是[关注点分离](https://openai.github.io/openai-agents-python/ref/agent/?ref=blog.langchain.com)，即让一组 agent 来处理特定的子任务。每个 agent 都有自己特定的工具、指令和独立的 context 窗口。

![](https://blog.langchain.com/content/images/2025/07/image-8.png)

将 context 分散到多个 agent 中

Anthropic’s [multi-agent researcher](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com) makes a case for this: many agents with isolated contexts outperformed single-agent, largely because each subagent context window can be allocated to a more narrow sub-task. As the blog said:

Anthropic 的[多 agent 研究系统](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com)也证明了这一点：拥有独立 context 的多个 agent 的表现超过了单个 agent，这很大程度上是因为每个子 agent 的 context 窗口可以专注于一个更窄的子任务。正如其博客所说：

> _\[Subagents operate\] in parallel with their own context windows, exploring different aspects of the question simultaneously._

> _\[子 agent\] 并行运行，拥有各自的 context 窗口，同时探索问题的不同方面。_

Of course, the challenges with multi-agent include token use (e.g., up to [15× more tokens](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com) than chat as reported by Anthropic), the need for careful [prompt engineering](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com) to plan sub-agent work, and coordination of sub-agents.

当然，多 agent 架构的挑战包括 token 的使用（例如，Anthropic 报告称其 token 用量比聊天多达 [15 倍](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com)）、需要精细的 [prompt engineering](https://www.anthropic.com/engineering/built-multi-agent-research-system?ref=blog.langchain.com) 来规划子 agent 的工作，以及子 agent 之间的协调。

**通过环境隔离 Context**

HuggingFace’s [deep researcher](https://huggingface.co/blog/open-deep-research?ref=blog.langchain.com#:~:text=From%20building%20,it%20can%20still%20use%20it) shows another interesting example of context isolation. Most agents use [tool calling APIs](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview?ref=blog.langchain.com), which return JSON objects (tool arguments) that can be passed to tools (e.g., a search API) to get tool feedback (e.g., search results). HuggingFace uses a [CodeAgent](https://huggingface.co/papers/2402.01030?ref=blog.langchain.com), which outputs that contains the desired tool calls. The code then runs in a [sandbox](https://e2b.dev/?ref=blog.langchain.com). Selected context (e.g., return values) from the tool calls is then passed back to the LLM.

HuggingFace 的[深度研究员](https://huggingface.co/blog/open-deep-research?ref=blog.langchain.com#:~:text=From%20building%20,it%20can%20still%20use%20it)展示了另一个有趣的 context 隔离例子。大多数 agent 使用[工具调用 API](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview?ref=blog.langchain.com)，API 返回 JSON 对象（工具参数），这些参数可以传递给工具（例如，搜索 API）以获取工具的反馈（例如，搜索结果）。HuggingFace 使用一个 [CodeAgent](https://huggingface.co/papers/2402.01030?ref=blog.langchain.com)，它输出包含所需工具调用的代码。然后，这些代码在一个[沙箱 (sandbox)](https://e2b.dev/?ref=blog.langchain.com) 中运行。从工具调用中选择的 context（例如，返回值）随后被传回给 LLM。

![](https://blog.langchain.com/content/images/2025/07/image-9.png)

沙箱可以将 context 与 LLM 隔离。

This allows context to be isolated from the LLM in the environment. Hugging Face noted that this is a great way to isolate token-heavy objects in particular:

这使得 context 可以在环境中与 LLM 隔离。Hugging Face 指出，这尤其是一种隔离消耗大量 token 的对象的好方法：

> _\[Code Agents allow for\] a better handling of state … Need to store this image / audio / other for later use? No problem, just assign it as a variable_ [_in your state and you \[use it later\]_](https://deepwiki.com/search/i-am-wondering-if-state-that-i_0e153539-282a-437c-b2b0-d2d68e51b873?ref=blog.langchain.com)_._

> _\[Code Agent 能够\] 更好地处理状态……需要存储这个图片/音频/或其他东西以便以后使用？没问题，只需将其作为一个变量赋值_[_到你的状态中，你就可以\[稍后使用它\]_](https://deepwiki.com/search/i-am-wondering-if-state-that-i_0e153539-282a-437c-b2b0-d2d68e51b873?ref=blog.langchain.com)_。_

**状态 (State)**\*\*

It’s worth calling out that an agent’s runtime [state object](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state) can also be a great way to isolate context. This can serve the same purpose as sandboxing. A state object can be designed with a [schema](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#schema) that has fields that context can be written to. One field of the schema (e.g., `messages`) can be exposed to the LLM at each turn of the agent, but the schema can isolate information in other fields for more selective use.

值得一提的是，agent 的运行时[状态对象 (state object)](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state) 也是隔离 context 的一个好方法。这可以达到与沙箱相同的目的。状态对象可以设计一个[模式 (schema)](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#schema)，其中包含可以写入 context 的字段。schema 中的一个字段（例如 `messages`）可以在 agent 的每一轮交互中暴露给 LLM，但 schema 可以将信息隔离在其他字段中，以便更有选择性地使用。

### 使用 LangSmith / LangGraph 进行 Context Engineering

So, how can you apply these ideas? Before you start, there are two foundational pieces that are helpful. First, ensure that you have a way to [look at your data](https://hamel.dev/blog/posts/evals/?ref=blog.langchain.com) and track token-usage across your agent. This helps inform where best to apply effort context engineering. [LangSmith](https://docs.smith.langchain.com/?ref=blog.langchain.com) is well-suited for agent [tracing / observability](https://docs.smith.langchain.com/observability?ref=blog.langchain.com), and offers a great way to do this. Second, be sure you have a simple way to test whether context engineering hurts or improve agent performance. LangSmith enables [agent evaluation](https://docs.smith.langchain.com/evaluation/tutorials/agents?ref=blog.langchain.com) to test the impact of any context engineering effort.

那么，你该如何应用这些想法呢？在开始之前，有两个基础工作会很有帮助。首先，确保你有一种方法可以[审视你的数据](https://hamel.dev/blog/posts/evals/?ref=blog.langchain.com)，并跟踪你的 agent 的 token 使用情况。这有助于你判断在哪里投入精力进行 context engineering 效果最好。[LangSmith](https://docs.smith.langchain.com/?ref=blog.langchain.com) 非常适合 agent 的[追踪/可观测性 (tracing / observability)](https://docs.smith.langchain.com/observability?ref=blog.langchain.com)，并为此提供了一个很好的方法。其次，确保你有一个简单的方法来测试 context engineering 是损害还是提升了 agent 的性能。LangSmith 支持[agent 评估](https://docs.smith.langchain.com/evaluation/tutorials/agents?ref=blog.langchain.com)，可以用来测试任何 context engineering 尝试所带来的影响。

**Write context**

LangGraph was designed with both thread-scoped ([short-term](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#short-term-memory)) and [long-term memory](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#long-term-memory). Short-term memory uses [checkpointing](https://langchain-ai.github.io/langgraph/concepts/persistence/?ref=blog.langchain.com) to persist [agent state](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state) across all steps of an agent. This is extremely useful as a “scratchpad”, allowing you to write information to state and fetch it at any step in your agent trajectory.

**写入 context**

LangGraph 的设计同时考虑了线程范围的（[短期](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#short-term-memory)）记忆和[长期记忆](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#long-term-memory)。短期记忆使用[检查点 (checkpointing)](https://langchain-ai.github.io/langgraph/concepts/persistence/?ref=blog.langchain.com) 来持久化 agent 在所有步骤中的[状态 (agent state)](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state)。这作为一个“scratchpad”非常有用，允许你将信息写入状态，并在 agent 轨迹的任何步骤中获取它。

LangGraph’s long-term memory lets you to persist context _across many sessions_ with your agent. It is flexible, allowing you to save small sets of [files](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#profile) (e.g., a user profile or rules) or larger [collections](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#collection) of memories. In addition, [LangMem](https://langchain-ai.github.io/langmem/?ref=blog.langchain.com) provides a broad set of useful abstractions to aid with LangGraph memory management.

LangGraph 的长期记忆让你可以在 agent 的_多个会话_之间持久化 context。它非常灵活，允许你保存小量的[文件](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#profile)（例如，用户资料或规则）或大量的记忆[集合](https://langchain-ai.github.io/langgraph/concepts/memory/?ref=blog.langchain.com#collection)。此外，[LangMem](https://langchain-ai.github.io/langmem/?ref=blog.langchain.com) 提供了一套广泛而有用的抽象，以辅助 LangGraph 的记忆管理。

**选择 context**

Within each node (step) of a LangGraph agent, you can fetch [state](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state). This give you fine-grained control over what context you present to the LLM at each agent step.

在 LangGraph agent 的每个节点（步骤）中，你都可以获取[状态 (state)](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state)。这让你能够细粒度地控制在 agent 的每一步向 LLM 呈现哪些 context。

In addition, LangGraph’s long-term memory is accessible within each node and supports various types of retrieval (e.g., fetching files as well as [embedding-based retrieval on a memory collection).](https://langchain-ai.github.io/langgraph/cloud/reference/cli/?ref=blog.langchain.com#adding-semantic-search-to-the-store) For an overview of long-term memory, see [our Deeplearning.ai course](https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/?ref=blog.langchain.com). And for an entry point to memory applied to a specific agent, see our [Ambient Agents](https://academy.langchain.com/courses/ambient-agents?ref=blog.langchain.com) course. This shows how to use LangGraph memory in a long-running agent that can manage your email and learn from your feedback.

此外，LangGraph 的长期记忆可以在每个节点内访问，并支持各种类型的检索（例如，获取文件以及[对记忆集合进行基于 embedding 的检索](https://langchain-ai.github.io/langgraph/cloud/reference/cli/?ref=blog.langchain.com#adding-semantic-search-to-the-store)）。要了解长期记忆的概况，请看我们的 [Deeplearning.ai 课程](https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/?ref=blog.langchain.com)。如果想了解如何将记忆应用于特定 agent，可以看我们的 [Ambient Agents](https://academy.langchain.com/courses/ambient-agents?ref=blog.langchain.com) 课程。该课程展示了如何在一个可以管理你的邮件并从你的反馈中学习的长期运行 agent 中使用 LangGraph 记忆。

![](https://blog.langchain.com/content/images/2025/07/image-10.png)

带有用户反馈和长期记忆的邮件 agent

For tool selection, the [LangGraph Bigtool](https://github.com/langchain-ai/langgraph-bigtool?ref=blog.langchain.com) library is a great way to apply semantic search over tool descriptions. This helps select the most relevant tools for a task when working with a large collection of tools. Finally, we have several [tutorials and videos](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_agentic_rag/?ref=blog.langchain.com) that show how to use various types of RAG with LangGraph.

对于工具选择，[LangGraph Bigtool](https://github.com/langchain-ai/langgraph-bigtool?ref=blog.langchain.com) 库是一个很好的方式，可以对工具描述进行语义搜索。当你有大量工具时，这有助于为任务选择最相关的工具。最后，我们还有一些[教程和视频](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_agentic_rag/?ref=blog.langchain.com)，展示了如何将各种类型的 RAG 与 LangGraph 结合使用。

**压缩 context**

Because LangGraph [is a low-level orchestration framework](https://blog.langchain.com/how-to-think-about-agent-frameworks/), you [lay out your agent as a set of nodes](https://www.youtube.com/watch?v=aHCDrAbH_go&ref=blog.langchain.com), [define](https://blog.langchain.com/how-to-think-about-agent-frameworks/) the logic within each one, and define an state object that is passed between them. This control offers several ways to compress context.

因为 LangGraph 是一个[底层的编排框架](https://blog.langchain.com/how-to-think-about-agent-frameworks/)，你可以[将你的 agent 布局为一组节点](https://www.youtube.com/watch?v=aHCDrAbH_go&ref=blog.langchain.com)，[定义](https://blog.langchain.com/how-to-think-about-agent-frameworks/)每个节点内的逻辑，并定义一个在它们之间传递的状态对象。这种控制力提供了几种压缩 context 的方法。

One common approach is to use a message list as your agent state and [summarize or trim](https://langchain-ai.github.io/langgraph/how-tos/memory/add-memory/?ref=blog.langchain.com#manage-short-term-memory) it periodically using [a few built-in utilities](https://langchain-ai.github.io/langgraph/how-tos/memory/add-memory/?ref=blog.langchain.com#manage-short-term-memory). However, you can also add logic to post-process [tool calls](https://github.com/langchain-ai/open_deep_research/blob/e5a5160a398a3699857d00d8569cb7fd0ac48a4f/src/open_deep_research/utils.py?ref=blog.langchain.com#L1407) or work phases of your agent in a few different ways. You can add summarization nodes at specific points or also add summarization logic to your tool calling node in order to compress the output of specific tool calls.

一种常见的方法是使用消息列表作为 agent 的状态，并使用[一些内置工具](https://langchain-ai.github.io/langgraph/how-tos/memory/add-memory/?ref=blog.langchain.com#manage-short-term-memory)定期对其进行[摘要或修剪](https://langchain-ai.github.io/langgraph/how-tos/memory/add-memory/?ref=blog.langchain.com#manage-short-term-memory)。然而，你也可以用几种不同的方式添加逻辑来后处理[工具调用](https://github.com/langchain-ai/open_deep_research/blob/e5a5160a398a3699857d00d8569cb7fd0ac48a4f/src/open_deep_research/utils.py?ref=blog.langchain.com#L1407)或 agent 的工作阶段。你可以在特定点添加摘要节点，或者在你的工具调用节点中添加摘要逻辑，以压缩特定工具调用的输出。

**隔离 context**

LangGraph is designed around a [state](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state) object, allowing you to specify a state schema and access state at each agent step. For example, you can store context from tool calls in certain fields in state, isolating them from the LLM until that context is required. In addition to state, LangGraph supports use of sandboxes for context isolation. See this [repo](https://github.com/jacoblee93/mini-chat-langchain?tab=readme-ov-file&ref=blog.langchain.com) for an example LangGraph agent that uses [an E2B sandbox](https://e2b.dev/?ref=blog.langchain.com) for tool calls. See this [video](https://www.youtube.com/watch?v=FBnER2sxt0w&ref=blog.langchain.com) for an example of sandboxing using Pyodide where state can be persisted. LangGraph also has a lot of support for building multi-agent architecture, such as the [supervisor](https://github.com/langchain-ai/langgraph-supervisor-py?ref=blog.langchain.com) and [swarm](https://github.com/langchain-ai/langgraph-swarm-py?ref=blog.langchain.com) libraries. You can [see](https://www.youtube.com/watch?v=4nZl32FwU-o&ref=blog.langchain.com) [these](https://www.youtube.com/watch?v=JeyDrn1dSUQ&ref=blog.langchain.com) [videos](https://www.youtube.com/watch?v=B_0TNuYi56w&ref=blog.langchain.com) for more detail on using multi-agent with LangGraph.

LangGraph 是围绕[状态 (state)](https://langchain-ai.github.io/langgraph/concepts/low_level/?ref=blog.langchain.com#state) 对象设计的，允许你指定一个状态 schema 并在每个 agent 步骤中访问状态。例如，你可以将工具调用的 context 存储在状态的特定字段中，将其与 LLM 隔离，直到需要该 context 为止。除了状态，LangGraph 还支持使用沙箱进行 context 隔离。可以看这个 [repo](https://github.com/jacoblee93/mini-chat-langchain?tab=readme-ov-file&ref=blog.langchain.com) 中的一个 LangGraph agent 示例，它使用 [E2B 沙箱](https://e2b.dev/?ref=blog.langchain.com)进行工具调用。也可以看这个[视频](https://www.youtube.com/watch?v=FBnER2sxt0w&ref=blog.langchain.com)，它展示了如何使用 Pyodide 进行沙箱操作，并持久化状态。LangGraph 对构建多 agent 架构也有很多支持，比如 [supervisor](https://github.com/langchain-ai/langgraph-supervisor-py?ref=blog.langchain.com) 和 [swarm](https://github.com/langchain-ai/langgraph-swarm-py?ref=blog.langchain.com) 库。你可以观看[这些](https://www.youtube.com/watch?v=4nZl32FwU-o&ref=blog.langchain.com)、[这些](https://www.youtube.com/watch?v=JeyDrn1dSUQ&ref=blog.langchain.com)和[这些](https://www.youtube.com/watch?v=B_0TNuYi56w&ref=blog.langchain.com)视频，了解更多关于如何使用 LangGraph 构建多 agent 系统的细节。

### 结论

Context engineering is becoming a craft that agents builders should aim to master. Here, we covered a few common patterns seen across many popular agents today:

Context engineering 正在成为一门 agent 构建者应该努力掌握的技艺。在这里，我们介绍了几种在当今许多流行 agent 中常见的模式：

*   _Writing context - saving it outside the context window to help an agent perform a task._
*   _Selecting context - pulling it into the context window to help an agent perform a task._
*   _Compressing context - retaining only the tokens required to perform a task._
*   _Isolating context - splitting it up to help an agent perform a task._
*   _写入 context - 将其保存在 context 窗口之外，以帮助 agent 完成任务。_
*   _选择 context - 将其拉入 context 窗口，以帮助 agent 完成任务。_
*   _压缩 context - 只保留执行任务所必需的 token。_
*   _隔离 context - 将其拆分开来，以帮助 agent 完成任务。_

LangGraph makes it easy to implement each of them and LangSmith provides an easy way to test your agent and track context usage. Together, LangGraph and LangGraph enable a virtuous feedback loop for identifying the best opportunity to apply context engineering, implementing it, testing it, and repeating.

LangGraph 让实现以上每一种策略都变得容易，而 LangSmith 则提供了一种简单的方法来测试你的 agent 并跟踪 context 的使用情况。LangGraph 和 LangSmith 共同构成了一个良性反馈循环：发现应用 context engineering 的最佳时机，实施它，测试它，然后不断重复这个过程。
