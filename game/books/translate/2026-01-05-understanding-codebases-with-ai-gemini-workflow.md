---
title: 我用来理解任何代码库的 AI 工作流
date: 2026-01-05
tags: [AI, Workflow, Gemini, Translation]
original_url: https://steipete.me/posts/2025/understanding-codebases-with-ai-gemini-workflow
---

# 我用来理解任何代码库的 AI 工作流

[在 GitHub 上编辑](https://github.com/steipete/steipete.me/edit/main/src/content/blog/2025/understanding-codebases-with-ai-gemini-workflow.md)

**简述：** 关于我如何使用 [repo2txt](https://repo2txt.simplebasedomain.com/) 和 [Google AI Studio](https://aistudio.google.com/prompts/new_chat) 来理解新代码库的一个小技巧。Gemini 的 100 万 token 上下文窗口非常适合询问有关代码的问题。

## 问题

每当我想了解一个新的代码库时，我发现绝对最好的方法是使用 Agent。这是我的工作流程：

**第 1 步：** 前往 [repo2txt](https://repo2txt.simplebasedomain.com/) 并粘贴 GitHub 仓库 URL。它会为你提供项目的完整树结构。选择所有你感兴趣的源代码文件。为了获得最佳结果，跳过测试，添加文档和源代码。绝对要跳过图片，它们会作为 base64 被拉入，这会冻结浏览器的 JS 引擎并弄乱上下文。

**第 2 步：** 前往 [Google AI Studio](https://aistudio.google.com/prompts/new_chat)，拖入 markdown 文件，然后开始问这样的问题：
- “这个项目有什么值得注意的地方？”
- “他们是如何解决你好奇的这个问题的？”

但这套工作流不仅用于理解现有代码，它也已成为我创建新项目的秘密武器。

## 从想法到 SDD（软件设计文档）

每当我开始一个新项目时，我会把所有的想法都粘贴到 AI Studio 中。这些天我主要通过 [Wispr Flow](https://wisprflow.ai/) 进行口述——Gemini 非常擅长理解并将我的想法转化为软件设计文档（SDD）。在我的研究过程中，我经常会发现其他解决类似问题的开源项目，所以我拖入编译好的 markdown 并问 Gemini 诸如此类的问题：

*这里实现了哪些我没想到的边缘情况？*

## 双上下文技巧

一旦我对输出感到满意，我就会复制 markdown，将其粘贴到一个新的 Gemini 上下文中，并要求它用这个特定的提示词来拆解规范：

*拆解这个 SDD。给我 20 个未详细说明、奇怪或不一致的地方。*

我将这些问题复制回原始的 Gemini 上下文中以改进 SDD。我总是回到原始上下文，因为它拥有我们如何得出规范的完整历史记录——这些上下文在批评窗口中会丢失。我们玩这套来回游戏大概 3-5 轮。通常 Master-Gemini（主 Gemini）已经有了答案，因为它有之前讨论的更多上下文，有时我必须添加新想法或选择边缘情况选项。

随着你的迭代，你会注意到问题变得越来越利基（niche）——这是你的信号，表明规范正变得无懈可击。几轮之后，你将拥有一份全面的 SDD，通常约为 500 行，它捕捉到了你愿景的每一个细节。

## 从 SDD 到实现

一旦你的 SDD 完成，实现就变得几乎微不足道了：

1.  将最终规范保存为仓库中的 `docs/spec.md`
2.  打开 Claude Code 并简单地提示：“Build spec.md”
3.  让它运行 2-4 小时
4.  审查并迭代结果

```
docs/spec.md
```

这种方法的美妙之处在于 Claude Code 不需要复杂的提示或手把手指导——规范包含了它所需的一切。清晰、详细的规范消除了歧义，让 AI 专注于实现而不是猜测你的意图。

这是[我用来构建 Peekaboo 的规范示例](https://github.com/steipete/peekaboo/blob/main/docs/spec.md)（[Peekaboo - 一个给你的 Agent 提供眼睛/截图的 MCP](https://www.peekaboo.boo/)）。关于 Peekaboo 最棒的部分？它使用自己的 Agent 来防止弄乱你的上下文。从规范到工作产品：只需让 Claude Code 做它自己的事几个小时。

想看我的实际操作吗？这有一个[视频，我在其中展示了从想法到最终应用程序的整个过程](https://steipete.com/posts/2025/the-future-of-vibe-coding)。我当时使用的是 Cursor，但现在会使用 Claude Code，因为它可以循环更长时间而无需中断。也许我将来会使用 [Gemini CLI](https://blog.google/technology/developers/introducing-gemini-cli-open-source-ai-agent/)。[AI 发展太快了！](https://x.com/steipete/status/1937919798740214023)

## 处理完善过程中的上下文丢失

你可能会遇到的一个挑战：当你通过多次迭代完善你的规范时，AI 工具可能会达到其输出 token 限制并开始丢失较早的上下文。这种“上下文遗忘”意味着初步规范中的关键需求可能会在后续版本中消失——这是我的朋友 Bruno Virlet 在使用 Gemini 进行规范完善时指出的一个问题。

解决方案是什么？与其要求一次大规模的规范修订，不如将其分解：

1.  **按逻辑块生成：** 分别请求特定部分
    *   “生成架构概述”
    *   “生成 API 规范”
    *   “生成数据模型需求”
2.  **维护主文档：** 手动连接输出，确保没有任何内容丢失
3.  **创建需求清单：** 跟踪跨迭代的关键功能
    *   “生成架构概述”
    *   “生成 API 规范”
    *   “生成数据模型需求”

这种基于块的方法确保你保持对规范演变的控制，同时利用 AI 的分析能力，而不会在过程中丢失关键细节。

## 代码即规范

见鬼，我通过简单地给 Gemini 整个未完成的 SwiftUI 项目（50万 tokens！）并告诉它从中生成 SDD，然后用 Web 技术 + TypeScript 重建，从而重启了我以前的一个旧副业项目。代码就是规范。（涂黑了一些秘密，留给未来的博客文章……）

## 替代方案：DeepWiki, RepoMix 等

值得一提的是：[DeepWiki](https://deepwiki.com/) 在理解代码库方面出奇地好，并且包含一个免费的 Agent。例如，这是 [DeepWiki 上的 VibeTunnel](https://deepwiki.com/amantus-ai/vibetunnel)。[VibeTunnel 是我目前的重点](https://steipete.me/posts/2025/vibetunnel-turn-any-browser-into-your-mac-terminal)，它将任何浏览器变成你的终端，以便随时随地指挥你的 Agent（如 Claude Code 或 Gemini CLI）。

缺点：你不能混合匹配多个仓库，这一点 Gemini 说了算。

值得一提的还有 [Gitingest](https://gitingest.com/) 和 [Repomix](https://repomix.com/)。它们有更好的设计，但在选择你确切想要的文件方面效率不高。如果你保持 Gemini 的上下文集中，你会得到更好的结果。

至于 Google AI Studio 的替代品，我还没有找到任何接近的东西。OpenAI 有很棒的模型，但它们难以生成让此工作流得以奏效的、全面的 500 行 markdown 文件。Gemini 巨大的上下文窗口和生成详细文档的意愿对于这个用例来说是无与伦比的。

## 就是这样！

Twitter 和 Mastodon 上有很多人问我的工作流程，所以每当我发现适合我的流程时，我都会写一篇博客文章并与你们分享。想第一时间听到它吗？关注 [@steipete](https://twitter.com/steipete) 并注册我的时事通讯。

现在去构建一些很棒的东西吧，或者加入我和 [VibeTunnel 团队](https://steipete.me/posts/2025/vibetunnel-turn-any-browser-into-your-mac-terminal#motivation)。我们将确保你的 Agent 不知道是被什么击中的！
