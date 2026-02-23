---
title: "译：我如何 Vibe Coding"
date: 2025-07-11
url: https://sorrycc.com/how-i-vibe-coding
---

发布于 2025年7月11日

# 译：我如何 Vibe Coding

> 原文： [https://xuanwo.io/2025/03-how-i-vibe-coding/](https://xuanwo.io/2025/03-how-i-vibe-coding/)  
> 作者： Xuanwo  
> 译者： Gemini 2.5 Pro

Hello everyone, long time no see. I’ve been evaluating various AI copilots extensively lately and have developed a fairly stable workflow that suits my context and background. I’m now writing it down to hopefully inspire you and to receive some feedback as well.

大家好，好久不见。最近我深入体验了各种 AI 辅助编程工具，并摸索出了一套相当稳定、适合我个人背景和工作场景的工作流。我把它写下来，希望能给你一些启发，也期待能收到一些反馈。

## 背景

I’m [Xuanwo](https://github.com/Xuanwo/), an open source Rust engineer.

我是 [Xuanwo](https://github.com/Xuanwo/)，一名开源 Rust 工程师。

_Open source_ means I primarily work in open source environments. I can freely allow LLMs to access my code as context, without needing to set up a local LLM to prevent code leaks or meet company regulations. It also means my work is publicly available, so LLMs can easily search for and retrieve my code and API documentation.

_开源_意味着我的主要工作环境是开源社区。我可以放心地让 LLM 访问我的代码作为上下文，而无需为了防止代码泄露或遵守公司规定而部署本地 LLM。这也意味着我的工作是公开的，LLM 可以轻松地搜索和获取我的代码及 API 文档。

_Rust_ means I spend most of my time writing Rust. It’s a nice language has _great documentation, a friendly compiler with useful error messages, and top-notch tooling_. Rust has a strong ecosystem for developer tools and is highly accessible. Most LLMs already know how to use `cargo check`, `cargo clippy`, and `cargo test`. Writing Rust also means that both I and AI only need to work with code in text form. We don’t need complex workflows like those often seen in frontend development: coding, screen capturing, image diffing, and so on.

_Rust_ 意味着我大部分时间都在写 Rust。这是一门很棒的语言，拥有_出色的文档、友好的编译器和有用的错误信息，以及顶级的工具链_。Rust 的开发者工具生态非常强大，且易于上手。大多数 LLM 都已经知道如何使用 `cargo check`、`cargo clippy` 和 `cargo test`。写 Rust 还意味着我和 AI 都只需要处理文本形式的代码。我们不需要像前端开发中常见的那种复杂工作流：编码、截图、比对图像等等。

_Engineer_ means I’m an engineer by profession. I earn my living through my coding work. I’m not a content producer or advertiser. As an engineer, I choose the most practical tools for myself. I want these tools to be fast, stable, and useful. I don’t need them to be flashy, and I don’t care whether they can build a website in one shot or write a flappy bird with correct collision detection.

_工程师_意味着这是我的职业。我靠写代码谋生，我不是内容生产者或广告商。作为一名工程师，我为自己选择最实用的工具。我希望这些工具快速、稳定、有用。我不需要它们花里胡哨，也不在乎它们能否一键生成网站，或者写出一个碰撞检测完美无误的 flappy bird。

## 工具集

My current toolset consists of [`Zed`](https://github.com/zed-industries/zed) and [`Claude Code`](https://github.com/anthropics/claude-code). More specifically, I run `claude` in a Zed terminal tab, which allows me to access both the code and its changes alongside the LLM.

我目前的工具集由 [`Zed`](https://github.com/zed-industries/zed) 和 [`Claude Code`](https://github.com/anthropics/claude-code) 组成。更具体地说，我会在 Zed 的一个终端标签页中运行 `claude`，这样我就可以在与 LLM 交互的同时，方便地查看代码及其变更。

![](https://xuanwo.io/2025/03-how-i-vibe-coding/claude-code-in-zed.png)

To give `claude-code` its full capabilities, it’s actually running in [a container I built myself](https://gist.github.com/Xuanwo/68e04e11949d130a6a579d8eeb6c6a03). Whenever I need to run `claude`, I use `docker run` instead. I also have an alias `claudex` for this purpose:

为了让 `claude-code` 发挥全部能力，它实际上运行在[一个我自己构建的容器](https://gist.github.com/Xuanwo/68e04e11949d130a6a579d8eeb6c6a03)里。每次需要运行 `claude` 时，我都会使用 `docker run`。为此我还设置了一个别名 `claudex`：

```
# claudex
alias claudex='docker run -it --rm \
  -v $(pwd):/workspace \
  -v ~/.claude:/home/user/.claude \
  -v ~/.claude.json:/home/user/.claude.json \
  -v ~/.config/gh:/home/user/.config/gh \
  -v ~/Notes:/home/user/Notes \
  xuanwo-dev'
```

## Mindset

Before introducing my workflow, I want to share my current mindset on LLMs. At the time of writing, I see LLMs as similar to recent graduates at a junior level.

在介绍我的工作流之前，我想先分享一下我对 LLM 的看法。在写这篇文章的时候，我将 LLM 视作初级水平的应届毕业生。

As juniors, they have several strengths: They possess a solid understanding of widely used existing techniques. They can quickly learn new tools or patterns. They are friendly and eager to tackle any task you assign. They never complain about your requests. They excel at repetitive or highly structured tasks, as long as you pay them.

作为初级人员，他们有几个优点：他们对广泛使用的现有技术有扎实的理解；能快速学习新工具或新模式；态度友好，渴望完成你分配的任何任务；从不抱怨你的要求；只要你给钱，他们就擅长处理重复性或结构性强的任务。

However, as juniors, they also have some shortcomings. They lack knowledge of your specific project or tasks. They don’t have a clear goal or vision and require your guidance for direction. At times, they can be overly confident, inventing nonexistent APIs or using APIs incorrectly. Occasionally, they may get stuck and fail to find a way out.

然而，作为初级人员，他们也有一些缺点：他们对你特定的项目或任务缺乏了解；没有明确的目标或愿景，需要你的指导来确定方向；有时会过于自信，凭空捏造不存在的 API 或错误地使用 API；偶尔会陷入困境，找不到出路。

As a mentor, leader, or boss, my job is to provide the right context, set a clear direction, and always be prepared to step in when needed. Currently, my approach is to have AI write code that I can personally review and take responsibility for.

作为导师、领导或老板，我的工作就是提供正确的上下文，设定明确的方向，并随时准备在需要时介入。目前，我的方法是让 AI 去写那些我能亲自 review 并为其负责的代码。

For example, I find that LLMs are most effective when refactoring projects that have a clear API and nive test coverage. I will refactor the service for `aws` first, and then have the LLMs follow the same patterns to refactor the `azure` and `gcs` services. I rarely allow LLMs to initiate entirely new projects or create completely new components. Most of the time, I define the API myself and ask the LLMs to follow the same design and handle the implementation details.

例如，我发现 LLM 在重构那些有清晰 API 和良好测试覆盖率的项目时效率最高。我会先自己重构 `aws` 的服务，然后让 LLM 遵循同样的模式去重构 `azure` 和 `gcs` 的服务。我很少让 LLM 从零开始一个全新的项目或创建全新的组件。大多数时候，我会自己定义好 API，然后让 LLM 遵循相同的设计并处理实现细节。

## Workflow

My workflow is quiet simple: I arrange my day in 5 hours chunk which aligns with [claude usage limits](https://support.anthropic.com/en/articles/11014257-about-claude-s-max-plan-usage). I map those two chunks to every day’s morning and afternoon.

我的工作流非常简单：我把一天安排成若干个 5 小时的区块，这与 [Claude 的使用限制](https://support.anthropic.com/en/articles/11014257-about-claude-s-max-plan-usage)相吻合。我将这些时间块分配到每天的上午和下午。

In the morining, I will collect, read, think and plan. I will write my thinking down in my `Notes`, powered by [`Obsidian`](https://obsidian.md/). All my notes is in markdown formats, so LLMs like Claude Opus 4 can understand without any other tools. I will feed my notes to claude code directly, and request them to read my notes while needed.

上午，我会收集信息、阅读、思考和规划。我会用 [`Obsidian`](https://obsidian.md/) 把我的想法记录在 `Notes` 目录中。我所有的笔记都是 markdown 格式，所以像 Claude Opus 4 这样的 LLM 无需任何额外工具就能理解。我会直接把笔记喂给 Claude Code，并要求它在需要时阅读我的笔记。

In the afternoon, I will run `claudex` inside my projects, as I mentioned earlier. I will monitor their progress from time to time and prepare myself to step in when necessary. Sometimes, I use `git worktree` to spawn additional Claude instances so they can collaborate on the same projects.

下午，我会在项目目录里运行 `claudex`，就像我前面提到的那样。我会时时监控它们的进展，并准备好在必要时介入。有时，我还会使用 `git worktree` 来启动额外的 Claude 实例，让它们可以在同一个项目上协同工作。

Claude works very quickly, so I spend most of my time reviewing code. To reduce the burden of code review, I also design robust test frameworks for my projects to ensure correct behavior. `rust`’s excellent developer experience allows me to instruct the LLMs to run `cargo check`, `cargo clippy`, and `cargo test` on the code independently. They may need to repeat this process a few times to get everything right, but most of the time, they figure it out on their own.

Claude 工作得非常快，所以我大部分时间都花在 review 代码上。为了减轻代码审查的负担，我也为我的项目设计了健壮的测试框架来确保行为的正确性。`rust` 卓越的开发者体验让我可以指示 LLM 独立地对代码运行 `cargo check`、`cargo clippy` 和 `cargo test`。它们可能需要重复这个过程几次才能把所有事情都做对，但大多数时候，它们都能自己搞定。

While reviewing code, I pay close attention to the public API and any tricky parts within the codebase. LLMs are like junior developers. Sometimes, they might overemphasize certain aspects of a task and lose sight of the overall context. For example, they can focus too much on minor details of API design without realizing that the entire approach could be improved with a better overall design. This also reinforces my belief that you should only allow LLMs to write code you can control. Otherwise, you can’t be sure the LLMs are doing things correctly. It’s very dangerous if the LLMs are working in a direction you don’t understand.

在 review 代码时，我会特别关注公开的 API 和代码库中一些棘手的部分。LLM 就像初级的开发者，有时它们可能会过分强调任务的某些方面而忽略了全局。例如，它们可能过于关注 API 设计的细枝末节，却没有意识到整个方法可以通过一个更好的总体设计来改进。这也再次印证了我的信念：你应该只让 LLM 写你能够掌控的代码。否则，你无法确定 LLM 是否在正确地做事。如果 LLM 在一个你完全不理解的方向上工作，那将非常危险。

In my workflow, I only need `claude` and `zed`. `claude` excels at using tools and understanding context, while `zed` is fast and responsive. As a Rust developer, I don’t have a strong need for various extensions, so the main drawback of `zed`, its limited extension support, isn’t a major issue for me.

在我的工作流中，我只需要 `claude` 和 `zed`。`claude` 擅长使用工具和理解上下文，而 `zed` 则快速且响应灵敏。作为一名 Rust 开发者，我对各种扩展的需求并不强烈，所以 `zed` 的主要缺点——扩展支持有限——对我来说不是大问题。

## Tips

这里有一些我最近探索 AI agent 和 LLM 时学到的技巧。

### Claude 4 是目前最好的 Vibe 编程模型

Claude 4 Sonnet and Opus are the best coding models available so far.

到目前为止，Claude 4 Sonnet 和 Opus 是最好的编程模型。

Many people have different opinions on this and might argue: hey, o3, gemini-2.5-pro, or deepseek-r1 are better than Claude 4, they can build a working website in one shot! Unfortunately, I disagree, at least for my needs right now. As a Rust developer, I don’t care if a model can build a website or demonstrate strong reasoning. What matters to me is whether it can use tools intelligently and efficiently. LLMs used for vibe coding should have a strong sense of planning and be skilled at coding. A smart model that doesn’t know how to edit files can’t truly serve as your coding copilot.

很多人对此有不同看法，可能会争辩说：嘿，o3、gemini-2.5-pro 或者 deepseek-r1 比 Claude 4 更好，它们能一键生成一个可运行的网站！可惜，我不同意，至少从我目前的需求来看是这样。作为一名 Rust 开发者，我不在乎一个模型能否建网站或展示强大的推理能力。对我来说，重要的是它能否智能高效地使用工具。用于 Vibe 编程的 LLM 应该有很强的规划意识并且精于编码。一个聪明的模型如果不知道如何编辑文件，就不能真正成为你的编程搭档。

I’m not a content creator; I’m an engineer. I need a reliable tool that can help me complete my work. I’m not building demos or marketing materials. This isn’t a game or a show that can be restarted repeatedly. I’m working on a project with downstream users, and I have to take responsibility for whatever the LLMs do. I need to collaborate with LLMs to achieve both my goals and my company’s goals.

我不是内容创作者，我是一名工程师。我需要一个可靠的工具来帮助我完成工作。我不是在做演示或营销材料。这不是一场可以反复重来的游戏或表演。我正在开发一个有下游用户的项目，我必须为 LLM 所做的一切负责。我需要与 LLM 协作，以实现我个人和公司的目标。

Claude 4 is the right tool.

Claude 4 就是那个合适的工具。

### MCP是个谎言

MCP is uesless for vibe coding.

MCP 对于 Vibe 编程毫无用处。

Claude 4 is good at using tools. As long as you let it know that a tool is installed locally, it can use the tool effectively. It can even use `--help` to learn how to use it correctly. I’ve never encountered a scenario where I needed to use an MCP server. I tried the GitHub MCP server before, but it performed much worse than simply letting LLMs use the `gh` CLI locally.

Claude 4 很擅长使用工具。只要你让它知道某个工具已经本地安装，它就能有效地使用它，甚至能用 `--help` 来学习如何正确使用。我从未遇到过需要使用 MCP 服务器的场景。我之前试过 GitHub 的 MCP 服务器，但它的表现远不如直接让 LLM 在本地使用 `gh` 命令行工具。

Use tools instead of configuring MCP servers.

用本地工具，别去配置 MCP 服务器。

### 将 AI 融入你的工作流

Integrate AI into your existing workflow instead of adapting yourself to AI.

将 AI 融入你现有的工作流，而不是让你自己去适应 AI。

AI workflows are constantly evolving. Stay calm and add the best tools to your toolkit. Don’t change yourself just to fit a particular AI workflow. It’s the tool’s problem that can’t be integrated into your existing workflow.

AI 的工作流总是在不断变化。保持冷静，把最好的工具添加到你的工具箱里。不要为了适应某个特定的 AI 工作流而改变自己。如果一个工具无法融入你现有的工作流，那是工具本身的问题。

I’ve had some unsuccessful attempts at using Cursor or Windsurf. My progress began when I started incorporating Claude Code into portions of my daily workflow, rather than completely switching to a new IDE.

我曾尝试使用 Cursor 或 Windsurf，但都不太成功。我的进步始于我将 Claude Code 融入我日常工作流的某些部分，而不是完全切换到一个新的 IDE。

## 推荐阅读

Thank you for reading my post. I also recommend the following posts if you want to try vibe coding:

感谢你阅读我的文章。如果你也想尝试 Vibe 编程，我推荐以下几篇文章：

*   [Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/06/12/agentic-coding/) from [@mitsuhiko](https://x.com/mitsuhiko)
*   [Here’s how I use LLMs to help me write code](https://simonwillison.net/2025/Mar/11/using-llms-for-code/) from [@simonw](https://x.com/simonw)
*   来自 [@mitsuhiko](https://x.com/mitsuhiko) 的 [Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/06/12/agentic-coding/)
*   来自 [@simonw](https://x.com/simonw) 的 [Here’s how I use LLMs to help me write code](https://simonwillison.net/2025/Mar/11/using-llms-for-code/)

Hope you’re enjoying the coding vibes: create more, hype less.

希望你也能享受 Vibe 编程的乐趣：多创造，少吹捧。
