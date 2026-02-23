---
title: "译：Agentic Coding 中那些不奏效的方法"
date: 2025-08-01
url: https://sorrycc.com/things-that-didnt-work-in-agentic-coding
---

发布于 2025年8月1日

# 译：Agentic Coding 中那些不奏效的方法

> 原文： [https://lucumr.pocoo.org/2025/7/30/things-that-didnt-work/](https://lucumr.pocoo.org/2025/7/30/things-that-didnt-work/)  
> 作者： Armin Ronacher  
> 译者： Gemini 2.5 Pro

使用 Claude Code 和其他 agentic coding 工具已经变得风靡一时。它不仅获得了[数百万的下载量](https://npmtrends.com/%40anthropic-ai/claude-code-vs-%40sentry/react)，而且这些工具也在不断增加新功能以简化工作流程。如你所知，我在五月份时对 [agentic coding 感到非常兴奋](https://lucumr.pocoo.org/2025/6/4/changes/)，并尝试了许多新增的功能。我花了相当多的时间来探索我能接触到的一切。

但奇怪的是，我尝试过的东西，最终很少能坚持用下来。我的大多数尝试都半途而废了，我想分享一下哪些东西没能奏效可能会有点意思。这不代表这些方法行不通或是坏主意；它只意味着我没能让它们为我所用。或许其他人能从这些失败中学到点什么。

## 自动化的原则

思考我使用方法的最佳方式是：

1.  我只自动化我经常做的事情。
2.  如果我为一件我经常做的事情创建了自动化，但后来我不再使用它了，我便视其为失败的自动化，然后删掉它。

无效的自动化其实相当普遍。要么是我没法让自己去用它们，要么是我忘了它们，要么是我最终陷入了无休止的微调。对我来说，删除一个失败的工作流辅助工具至关重要。你不会希望一堆没用的 Claude 命令把你的工作区搞得一团糟，还让别人感到困惑。

所以，大多数时候我最终会做最简单的事情：多和机器对话，给它更多上下文，保持音频输入，把我的思路一股脑儿地丢进 prompt。这就是我 95% 的工作流。剩下的部分可能是对复制/粘贴的善用。

## Slash Commands

斜杠命令允许你预加载 prompt，以便在会话中随时可用。我曾期望它们会比实际情况更有用。我确实在使用它们，但我添加的很多命令最终都从未使用过。

斜杠命令的一些限制使其用途打了折扣。一个限制是，传递参数的方式只有一种，而且是非结构化的。在我的实践中，这被证明并非最佳选择。我一直遇到的另一个关于 Claude Code 的问题是，如果你使用斜杠命令，其参数出于某种原因[不支持基于文件的自动补全](https://github.com/anthropics/claude-code/issues/818)。

为了让它们更好地工作，我经常让 Claude 使用当前的 Git 状态来决定要操作哪些文件。例如，我在这篇博客中有一个修复语法错误的命令。它几乎完全基于当前的 git status 上下文进行操作，因为在没有自动补全的情况下，显式地提供文件名很麻烦。

这是我实际使用的少数几个斜杠命令之一：

```ts
## Context

- git status: !`git status`
- Explicitly mentioned file to fix: "$ARGUMENTS"

## Your task

Based on the above information, I want you to edit the mentioned file or files
for grammar mistakes.  Make a backup (eg: change file.md to file.md.bak) so I
can diff it later.  If the backup file already exists, delete it.

If a blog post was explicitly provided, edit that; otherwise, edit the ones
that have pending changes or are untracked.
```

我现在的工作流假设 Claude 几乎每次都能从 Git 状态中判断出我指的是哪些文件，这使得显式参数在很大程度上变得多余。

以下是我曾经创建但最终没有使用的一些斜杠命令：

*   `/fix-bug`：我曾有一个命令，指示 Claude 通过从 GitHub 拉取 issue 并添加额外上下文来修复 bug。但我发现，与简单地提及 GitHub issue URL 并说出我关于如何修复它的想法相比，并没有看到任何有意义的改进。
*   `/commit`：我试过让 Claude 写出好的 commit message，但它们从来都不符合我的风格。我停止使用这个命令，尽管我还没有完全放弃这个想法。
*   `/add-tests`：我真的希望这个能奏效。我的想法是让 Claude 在开发过程中跳过测试，然后在最后使用一个精心设计的可复用 prompt 来正确地生成它们。但是这种方法并不比自动测试生成效果更好，而且我对自动测试生成整体上仍不满意。
*   `/fix-nits`：我曾有一个命令用来修复 linting 问题和运行格式化工具。我不再使用它，因为它从未成为我的肌肉记忆，而且 Claude 已经知道如何做这件事了。我只需在 [CLAUDE.md](http://CLAUDE.md) 文件中告诉它“fix lint”即可，不需要斜杠命令。
*   `/next-todo`：我在一个 [to-do.md](http://to-do.md) 文件中追踪一些小事项，并有一个命令来拉取下一个事项并处理它。即使是在这里，工作流自动化也没多大帮助。我使用这个命令的频率远低于预期。

那么，如果我用更少的斜杠命令，我转而做什么呢？

1.  语音转文本。这一点再怎么强调也不为过，但和机器交谈意味着你更有可能分享更多关于你想让它做什么的信息。
2.  我会维护一些基本的 prompt 和上下文，以便在我输入内容的开头或结尾进行复制粘贴。

复制/粘贴真的非常有用，因为 LLM 是模糊的。例如，我维护了一些链接集合，在需要时粘贴进去。有时我会主动获取文件，把它们放到一个被 git 忽略的文件夹里，然后提及它们。这很简单、容易且有效。你仍然需要有所选择，以避免过多地污染你的上下文，但与让它在错误的地方乱翻相比，多提供一些文本并没有那么大的害处。

## Hooks

我努力尝试让 hooks 发挥作用，但至今没有看到任何效率提升。我认为部分问题在于我使用了 yolo mode。我希望 hook 能够真正地操纵将要执行的内容。如今指导 Claude 的唯一方法是通过 denies（拒绝），但这在 yolo mode 下不起作用。例如，我曾试图用 hooks 让它使用 uv 而不是常规的 Python，但我没能做到。最后，我通过在 PATH 中预加载可执行文件来覆盖默认的程序，从而引导 Claude 使用正确的工具。

例如，这其实是我让它更可靠地使用 `uv run python` 而非 `python` 的一个 hack：

```
#!/bin/sh
echo "This project uses uv, please use 'uv run python' instead."
exit 1
```

I really just have a bunch of these in `.claude/interceptors` and preload that  
folder onto `PATH` before launching Claude:

我其实只是在 `.claude/interceptors` 文件夹里放了一堆这样的脚本，并在启动 Claude 之前把这个文件夹预加载到 `PATH` 中：

```
CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1 \
    PATH="`pwd`/.claude/interceptors:${PATH}" \
    claude --dangerously-skip-permissions
```

我还发现很难在恰当的时机触发 hook。我希望我能在一个漫长的编辑会话结束时运行格式化工具。目前，你必须在每次 Edit 工具操作后都运行格式化工具，这常常迫使 Claude 重新读取文件，浪费了上下文。即使有了 Edit 工具的 hook，我也不确定是否会继续使用它。

我其实很好奇大家是否能把 hook 用好。我在 Twitter 上看到一些讨论，似乎有一些很好的方法能让它们奏效，但我自己最终选择了简单得多的解决方案。

## Claude Print Mode

我最初非常看好 Claude 的 print mode。我努力让 Claude 生成内部使用 print mode 的脚本。例如，我让它创建一个模拟数据加载脚本——大部分是确定性代码，只带有一个小的推理部分，用 Claude Code 生成测试数据。

挑战在于实现可靠性，这一点我还没能做好。Print mode 很慢，而且难以调试。所以，尽管我非常喜欢这种大部分是确定性、只带少量推理组件的脚本概念，但我使用它的频率远低于我的期望。无论使用 Claude SDK 还是命令行的 print 标志，我都没有达到我所希望的效果。

我被 Print Mode 所吸引，因为推理太像一台老虎机了。许多编程任务实际上是相当刻板和确定性的。我们喜欢 linter 和格式化工具，因为它们毫不含糊。任何我们能完全自动化的事情，都应该自动化。在我看来，将 LLM 用于不需要推理的任务是错误的方法。

这就是 print mode 的吸引力所在。只可惜它要是能更好用就好了。用 LLM 来写 commit message，但用常规脚本来执行 commit 和 gh pr 命令。让模拟数据加载做到 90% 的确定性，只留 10% 用于推理。

我仍在使用它，但我看到的潜力比我目前所利用的要大得多。

## 子任务和子 Agent

我经常使用 task 工具来进行基本的并行化和上下文隔离。Anthropic 最近推出了一个旨在简化这个过程的 agents 功能，但我并没有发现它更容易使用。

子任务和子 agent 可以实现并行，但你必须小心。那些不易并行的任务——尤其是混合了读和写的任务——会造成混乱。除了调查性任务外，我得不到好的结果。虽然子 agent 应该能更好地保留上下文，但我发现通过开启新会话、将想法写入 Markdown 文件，甚至在聊天界面切换到 o3，往往能得到更好的结果。

## 它有帮助吗？

关于工作流自动化的有趣之处在于，如果你作为开发者没有一套严格且始终遵循的规则，那么花时间与机器交谈、给出清晰的指令，其效果会优于精心预设的 prompt。

例如，我不使用表情符号或 commit 前缀。我也不强制使用 pull request 模板。因此，我能教给机器的结构就更少。

我也缺乏时间和动力去彻底评估我创建的所有工作流。这使我无法对它们的价值建立信心。

上下文工程和管理仍然是主要的挑战。尽管我努力帮助 agent 从各种文件和命令中提取正确的数据，但它们尚未能可靠地成功。它们要么提取得太多，要么太少。长时间的会话会导致遗忘最初的上下文。无论是手动操作还是使用斜杠命令，结果都感觉太随机了。用临场发挥的方式已经够难了，而静态的 prompt 和命令让事情变得更难。

我现在遵循的规则是，如果我确实想自动化某件事，我必须已经做过好几次了，然后我再评估通过我的自动化，agent 是否能得到更好的结果。这其中没有精确的科学，但我目前的衡量方式主要是让它做同样任务三次，然后手动观察其结果的差异，衡量的标准是：我是否会接受这个结果。

## 保持大脑在线

强迫自己去评估自动化还有另一个好处：我不太可能盲目地假设它对我有帮助。

因为通过 LLM 实现自动化存在一个巨大的隐藏风险：它会助长思维上的“脱离”。当你不再像工程师一样思考时，质量就会下降，时间会被浪费，你也不会去理解和学习。LLM 本身就已经够糟糕了，但每当我倾向于自动化时，我注意到“脱离”变得更加容易。随着时间的推移，我倾向于高估 agent 的能力。那里真的有恶龙！

你仍然可以在事情完成时进行审查，但事后审查会变得越来越难。虽然 LLM 正在降低重构的成本，但这个成本并没有降到零，而且出现回归是常有的事。
