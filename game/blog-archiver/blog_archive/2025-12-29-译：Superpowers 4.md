---
title: "译：Superpowers 4"
date: 2025-12-29
url: https://sorrycc.com/superpowers-4
---

发布于 2025年12月29日

# 译：Superpowers 4

> 原文： [https://blog.fsck.com/2025/12/18/superpowers-4/](https://blog.fsck.com/2025/12/18/superpowers-4/)  
> 作者： Jesse Vincent  
> 译者： Gemini 3 Pro High

很高兴宣布 [Superpowers 4.0](https://github.com/obra/superpowers) 发布。

这个版本的主要改进包括：

*   子 Agent 驱动的开发变得更好了

Superpowers 所围绕的软件开发流程一直都在每个实现步骤后有一个“代码审查”步骤。代码审查现在已被拆分为两个独立的 Agent，每个 Agent 都有自己的任务。首先，“规范审查” Agent 会评估工作，以确保它实现了计划中要求构建的内容。只有在规范审查 Agent 批准后，代码审查 Agent 才会深入研究代码质量。

这两个步骤现在都已正式成为循环，而不是被写成潜在的一次性流程。（协调 Agent 现在知道，在实施者修复了第一次代码审查的问题后，需要重新运行代码审查。）

子 Agent 驱动的开发非常出色，以至于我快要移除旧的“双窗口”工作流了，该工作流需要你充当实施 Agent 和协调者之间的桥梁。目前，阻碍这一变化的最大因素是 OpenAI Codex 尚不支持子 Agent。我已经有了解决方案，但还没有_完全_准备好发布。

*   技能触发和描述的变更。

从 Opus 4.5 开始，Claude 似乎更有可能根据描述猜测它已经知道某个技能的作用。这表现为它声称要使用某个技能，然后……在没有实际阅读该技能的情况下即兴发挥。我相信这主要是由于技能 `description` 字段除了说明何时使用技能外，还解释了技能的作用。

为了缓解这个问题，我修改了技能描述，使其_仅_包含有关何时使用该技能的信息。例如，头脑风暴技能的描述从：

```
Use when creating or developing, before writing code or implementation plans - refines rough ideas into fully-formed designs through collaborative questioning, alternative exploration, and incremental validation. Don't use during clear 'mechanical' processes.
```

变为

```
You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.
```

另外，有些人已经开始遇到 Claude Code 的 [技能描述字符数隐藏限制](https://blog.fsck.com/2025/12/17/claude-code-skills-not-triggering/)，超过该限制后 Claude 会开始隐藏某些技能。

为了缓解这个问题，我将一些实际上不需要作为独立技能的技能压缩为更通用技能的渐进式披露部分。`test-driven-development` 现在包含 `testing-anti-patterns`。事后看来，testing-anti-patterns 是一个_糟糕_的技能，因为它是关于不做什么，而不是关于做什么，并附带有关危险模式的说明。

同样，`systematic-debugging` 技能现在包含来自 `root-cause-tracing`、`defense-in-depth` 和 `condition-based-waiting` 的内容。

*   内部开始有了测试套件。

这还不是一个合适的评估套件，但我们现在有一些基本的端到端测试，确保 Agent 运行完整的头脑风暴 - 规划 - 实施流程并验证技能使用情况。我们要利用这一点来改进 Superpowers 的技能触发。

*   更多地使用 GraphViz

这不太可能对用户可见，但 Superpowers 内部更多地依赖 GraphViz ‘dot’ 符号来进行流程文档记录。dot 是一种图形和流程符号，读起来有点像 ASCII 艺术。作为一种稍微形式化的符号，dot 比散文的歧义要少一些。[Claude 特别擅长遵循用 dot 编写的流程](https://blog.fsck.com/2025/09/29/using-graphviz-for-claudemd/)。

## 题外话 [#](#an-aside)

我制作并免费提供 Superpowers，是因为我喜欢构建帮助人们制作软件的工具。我最近启用了 [GitHub Sponsorships](https://github.com/sponsors/obra)，让人们可以赞助我的开源工作。你没有义务赞助我或为 Superpowers 支付任何费用，但如果你在工作中从中获得了价值，并想给我一些支持，我将非常感激，这将有助于激励我继续制作并免费提供工具。[你可以在这里赞助我的工作](https://github.com/sponsors/obra)

谢谢！
