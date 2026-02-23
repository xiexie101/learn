---
title: "译：我如何使用 Claude Code"
date: 2025-06-24
url: https://sorrycc.com/how-i-use-claude-code
---

发布于 2025年6月24日

# 译：我如何使用 Claude Code

> 原文： [https://spiess.dev/blog/how-i-use-claude-code](https://spiess.dev/blog/how-i-use-claude-code)  
> 作者： Philipp Spiess  
> 译者： Gemini 2.5 Pro

One month ago, I subscribed to Claude Max. I’ve been using AI agents including Claude Code for some time prior, but with the flat pricing, my usage skyrocketed and it’s become a daily driver for many tasks. I find myself going to VS Code much less often now.

一个月前，我订阅了 Claude Max。在此之前，我已经使用包括 Claude Code 在内的 AI agent 一段时间了，但自从有了固定价格套餐，我的使用量猛增，它也成了我许多任务的日常主力。我发现自己现在打开 VS Code 的频率都少了很多。

Since AI agents are new for everyone right now, I thought it might be fun to share some patterns I’ve been noticing recently. Here’s how I use Claude code.

因为 AI agent 对每个人来说都还是新事物，我想分享一些我最近注意到的使用模式或许会很有趣。以下就是我使用 Claude Code 的方式。

## 开启新会话

If there’s one thing I want you to take away from this, it’s that you should absolutely call `/clear` more often.

如果说我希望你从这篇文章中记住一件事，那就是你应该更频繁地使用 `/clear` 命令。

AI agents tend to become more unpredictable the longer a conversation goes. This is especially true when you’re asking different questions. I found that it’s often much more effective to create a new prompt even if that means repeating some instructions.

AI agent 的对话时间越长，其行为就越难以预测。当你问不同问题时尤其如此。我发现，即使这意味着需要重复一些指令，另起一个 prompt 往往要有效得多。

Once I started doing this more aggressively, my results improved dramatically. And [I’m definitely not the only one](https://ampcode.com/how-i-use-amp) with this advice.

当我开始更频繁地这样做之后，我得到的结果有了显著的提升。而且，给出这个建议的[肯定不止我一个](https://ampcode.com/how-i-use-amp)。

## 创建精准的 Prompt

I feel like this goes without saying, but when you’re working with _a new grad with amnesia_ (that’s how I like to think of Claude), it’s important that you write out all the context that you have in your head. This is hard, and frankly I don’t think I’m very good at it myself yet, but the more context you can give Claude, the more effective it’ll be. If you’re thinking of some edge-cases, absolutely mention it to Claude. If you remember “there’s a similar pattern that we’ve used for this type of problem in this codebase in the past”, write it down! The more precise the prompt, the better Claude will do. Mind-reading technology isn’t there _just yet_.

这一点似乎不言自明，但当你在和一个_失忆应届生_（我喜欢这样想 Claude）一起工作时，把你脑子里所有的上下文都写出来非常重要。这很难，坦白说，我自己也还没完全掌握，但你给 Claude 的上下文越多，它就会越有效。如果你想到了某些边缘情况，一定要告诉 Claude。如果你记得“过去在这个代码库里，我们用过一个类似的模式来解决这类问题”，那就写下来！Prompt 越精确，Claude 的表现就越好。毕竟，读心术还没发展到那个地步。

Try to think of any implicit context too. For example, if you ask Claude to create a _modern design_, it probably has no idea what you refer to as modern. It might be better to give examples instead (e.g., create a Linear-like app UI design).

也要试着思考任何隐藏的上下文。例如，如果你让 Claude 创建一个_现代风格的设计_，它可能根本不知道你所说的现代是什么。更好的方式是给出例子（比如，创建一个类似 Linear 的 App UI 设计）。

## 让 Claude Code 使用 Claude Code

Did you know that you can use Claude Code’s tools as an MCP server (`claude mcp serve`)? When I found out, I looked into what tools it exposes and noticed one called `Task`. The premise of this tool is to spin off a sub-agent that will have the same access to tools as your main agent (except that it cannot spawn another sub-task) and reports back the results.

你知道你可以把 Claude Code 的工具当作一个 MCP 服务器来用吗（`claude mcp serve`）？当我发现这一点后，我研究了它暴露了哪些工具，并注意到了一个叫做 `Task` 的工具。这个工具的原理是启动一个子 agent，它拥有和主 agent 相同的工具访问权限（只是不能再创建另一个子任务），并向主 agent 汇报结果。

Knowing this is available is super handy when you have a more complex problem that you need a supervisor for. Here’s a recent example of how I used this feature to do a deep-dive of the same problem with four different personas:

当你需要一个“主管”来处理更复杂的问题时，知道有这个功能会非常方便。下面是我最近如何使用这个功能，用四个不同的“人设”来深度研究同一个问题的例子：

```
> Read files in the current directory to deduct a pattern for building Tailwind Plus components. You should spawn 4 sub-tasks with slightly different priorities (e.g. design color export, accessibility export, mobile/responsive expert, overall style expert) and compare their results.

> 读取当前目录下的文件，推导出一个构建 Tailwind Plus 组件的模式。你应该启动 4 个具有略微不同优先级的子任务（例如，设计颜色导出、可访问性导出、移动/响应式专家、整体风格专家），并比较它们的结果。

✻ Thinking…

  Now I'll spawn 4 specialized sub-tasks with different priorities to analyze various aspects of the components.

  现在我将启动 4 个具有不同优先级的专业子任务来分析组件的各个方面。

⏺ Task(Design Color Expert Analysis)
  ⎿  Done (24 tool uses · 41.5k tokens · 3m 4.4s)

⏺ Task(Accessibility Expert Analysis)
  ⎿  Done (15 tool uses · 38.0k tokens · 2m 0.0s)

⏺ Task(Mobile/Responsive Expert Analysis)
  ⎿  Done (14 tool uses · 45.5k tokens · 2m 1.2s)

⏺ Task(Overall Style Expert Analysis)
  ⎿  Done (23 tool uses · 58.7k tokens · 2m 22.0s)
```

It’s magnificent _and_ can be done in parallel. This is such a good way to keep the context window of your main task in order and keep Claude focused.

这简直太棒了，_而且_可以并行处理。这是一个保持主任务上下文窗口整洁、让 Claude 保持专注的绝佳方式。

## 让 Claude 思考

Just like us old humans of flesh, Claude is lazy by default. E.g., when you tell Claude to do something, it’ll choose the path of least resistance. If you tell it to do _at least_ three things, I bet you it will not do a single thing more.

就像我们这些凡夫俗子一样，Claude 默认也是懒惰的。比如，你让 Claude 做某件事，它会选择阻力最小的路径。如果你让它做_至少_三件事，我打赌它一件都不会多做。

The same holds true about using [extended thinking capabilities](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips). To get better results, especially during planning processes, I recommend telling Claude to _ultrathink_.

使用[扩展思考能力](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips)时也是如此。为了获得更好的结果，尤其是在规划阶段，我建议告诉 Claude 进行_深度思考 (ultrathink)_。

## 编辑之前的消息

Whenever you’re too eager to hit send or just feel like a previous message could be more precise to get better results, you can press `Escape` twice to jump to a previous message and fork the conversation. I use this all the time to refine prompts or simply have Claude _try again_.

每当你太急于发送，或者觉得之前的某条消息可以更精确以获得更好结果时，你可以按两次 `Escape` 键跳回到那条消息，并从那里开启一个新的对话分支。我一直用这个功能来优化 prompt，或者干脆让 Claude _再试一次_。

Oh, and if you somehow want to get back to the previous state, you can start Claude with the `--resume` flag to list all prior threads.

哦，如果你想回到之前的状态，可以用 `--resume` 标志启动 Claude，它会列出所有之前的会话。

## YOLO 模式

This is probably extremely irresponsible of me, but I mostly run Claude with `--dangerously-skip-permissions` now (thanks [Peter](https://steipete.me/posts/2025/claude-code-is-my-computer) for being a bad influence). It’s not necessary for everything, but if I have Claude working on some longer-running tasks, I _really_ don’t want to have to focus-switch back to it every minute because it uses a new terminal command.

这可能显得我极其不负责任，但我现在大部分时间都用 `--dangerously-skip-permissions` 参数来运行 Claude（感谢 [Peter](https://steipete.me/posts/2025/claude-code-is-my-computer) 带的坏头）。虽然不是所有任务都需要它，但如果我让 Claude 执行一些耗时较长的任务，我_真的_不想因为每用一个新终端命令就得切换回去确认一次。

I have this set up in my zsh profile:

我在我的 zsh 配置文件里设置了这个：

```bash
alias yolo="claude --dangerously-skip-permissions"
```

Funny enough, now that Claude can do whatever it wants, I have been running against the rate limit quota warning much more often too.

有趣的是，既然 Claude 可以为所欲为，我也更频繁地撞到速率限制的警告了。

## MCP 服务器

I’m personally not super excited about MCP servers since none have really brought me any value. In most cases, I find they just use up valuable tokens with stuff that I don’t need most of the time. The built-in tools in Claude Code are enough for me (especially when used to the ways I outline here).

我个人对 MCP 服务器并不感冒，因为它们没有给我带来任何真正的价值。多数情况下，我发现它们只是用我大部分时间都不需要的东西来消耗宝贵的 token。Claude Code 的内置工具对我来说已经足够了（特别是当我按照这里概述的方式使用时）。

In the past, I used [Playwright MCP](https://github.com/microsoft/playwright-mcp). While it’s incredibly fascinating to see Claude start a browser, click buttons, and make screenshots, I found that it mostly just fills the context window very quickly without really making for a better result.

过去，我用过 [Playwright MCP](https://github.com/microsoft/playwright-mcp)。虽然看着 Claude 启动浏览器、点击按钮、截图非常有趣，但我发现它主要是迅速填满了上下文窗口，却并未带来更好的结果。

## Claude SDK

Claude has an [SDK](https://docs.anthropic.com/en/docs/claude-code/sdk). It’s quite powerful, especially if you’re happy to deal with the `stream-json` output format. But even for small things, being able to pass a prompt directly to `claude` and have it print back the reply is making for great shortcuts.

Claude 有一个 [SDK](https://docs.anthropic.com/en/docs/claude-code/sdk)。它非常强大，特别是如果你不介意处理 `stream-json` 这种输出格式的话。但即使是做些小事，能够直接把 prompt 传递给 `claude` 并让它打印回复，也创造了极佳的捷径。

As an example, I have a `gcauto` executable in my path that does the following:

举个例子，我在我的 PATH 路径里放了一个叫 `gcauto` 的可执行文件，它做的事情如下：

```bash
#!/bin/bash
git commit -m "$(claude -p "Look at the staged git changes and create a summarizing git commit title. Only respond with the title and no affirmation.")"
```

So whenever I commit stuff now, I just stage them and run `gcauto`.

所以现在每当我提交代码时，我只需把改动暂存起来，然后运行 `gcauto` 就行了。

## 规划模式

Claude Code has a built-in planning mode, that is triggered when you press `Shift+Tab` twice. In this mode, Claude won’t write to your file system.

Claude Code 有一个内置的规划模式，按两次 `Shift+Tab` 就可以触发。在这个模式下，Claude 不会写入你的文件系统。

I personally like to do planning with another model though, just to spice it up a bit. In the past weeks, I’ve been using Gemini 2.5 Pro in [Google AI Studio](https://aistudio.google.com) directly. I don’t really know how that’s possible but I don’t think I have to pay for it even?

不过，我个人喜欢用另一个模型来做规划，只是为了换换口味。在过去几周里，我一直在直接使用 [Google AI Studio](https://aistudio.google.com) 里的 Gemini 2.5 Pro。我不太清楚怎么回事，但我好像甚至都不用为它付费？

## 让 Claude 去读文档

A rookie mistake I’ve made in the beginning is to tell Claude to set up a new project with _framework x_. It works, sure, but I noticed Claude often using outdated setups and project structures, especially for fast-moving frontend frameworks!

我一开始犯的一个新手错误是，直接让 Claude 用_某个框架_来搭建新项目。当然，这也能行，但我发现 Claude 经常使用过时的配置和项目结构，特别是对于那些快速迭代的前端框架！

What I do now is ask Claude to read the manual first. This can be done in different ways:

我现在做的，是先让 Claude 去读文档。这有几种不同的方法：

*   Paste a link to the docs and ask Claude to read it first
*   Ask Claude to find out the state-of-the-art
*   Use the `Task` tool and have Claude conduct deep-research on a particular topic
*   粘贴一个文档链接，让 Claude 先阅读
*   让 Claude 去找出最新的方法
*   使用 `Task` 工具，让 Claude 对特定主题进行深度研究

An example for a deep research task can look like this:

一个深度研究任务的例子可以是这样的：

```
> create a deep research task to figure out how to migrate a website from tailwind 3 to 4 and then present me with a short summary of the results

> 创建一个深度研究任务，弄清楚如何将一个网站从 tailwind 3 迁移到 4，然后给我一份简短的结果总结。

⏺ I'll create a research task to investigate migrating from Tailwind CSS v3 to v4, focusing on the specific context of your Tailwind UI codebase.

⏺ 我将创建一个研究任务，调查从 Tailwind CSS v3 迁移到 v4 的过程，重点关注你的 Tailwind UI 代码库的具体情况。

⏺ Task(Tailwind v3 to v4 migration research)
  ⎿  Done (4 tool uses · 29.9k tokens · 5m 47.6s)

⏺ Summary

  Migrating from Tailwind CSS v3 to v4 involves significant changes but comes with major performance improvements (3.5x faster builds) and a better developer experience.

  Key points:
  - Use the automated upgrade tool: npx @tailwindcss/upgrade@next
  - Configuration moves from JavaScript to CSS-first using @theme directive
  - Breaking changes include dropped browser support, new import syntax, and removed deprecated utilities
  - Performance gains: builds are now measured in microseconds
  - Container queries are now built-in (no plugin needed)

  The migration is straightforward with the upgrade tool, but plan for testing time to ensure all components render correctly.

⏺ 总结

  从 Tailwind CSS v3 迁移到 v4 涉及重大变更，但带来了主要的性能提升（构建速度快 3.5 倍）和更好的开发者体验。

  要点：
  - 使用自动化升级工具：npx @tailwindcss/upgrade@next
  - 配置从 JavaScript 转向 CSS-first，使用 @theme 指令
  - 破坏性变更包括放弃了对某些浏览器的支持、新的导入语法以及移除了废弃的工具类
  - 性能提升：现在的构建时间以微秒计算
  - 容器查询现在是内置的（不再需要插件）

  使用升级工具迁移过程很直接，但要为测试留出时间，以确保所有组件都能正确渲染。
```

## 语音输入

Apps like [Superwhisper](https://superwhisper.com/) make it very easy to dictate a prompt. I found this super effective when I want to write a longer prompt since it’ll get the ideas out of my head much faster.

像 [Superwhisper](https://superwhisper.com/) 这样的应用让口述 prompt 变得非常容易。我发现当我想写一个较长的 prompt 时，这非常有效，因为它能让我更快地把脑子里的想法表达出来。

This works incredibly well with any LLM input field, really, because LLMs can usually figure out what you mean even if the transcript is poor and full of mistakes.

这和任何 LLM 的输入框配合得都非常好，真的，因为即使语音转录质量不佳、错误百出，LLM 通常也能弄懂你的意思。

## 尽早暂存，频繁暂存

One feature I’m missing in Claude Code is the ability to make automatic file system snapshots. It happens quite often for me that Claude gets a bit too _trigger happy_ and starts to make large changes when I don’t want it to. If this happens after I’ve been getting some good changes, this can screw up the working directory quite a bit.

Claude Code 少了一个我很想要的功能：自动创建文件系统快照。我经常遇到 Claude 有点_手太快_，在我不想让它做大改动的时候它偏要改。如果这发生在我已经得到一些不错的改动之后，它会把工作目录搞得一团糟。

To circumvent this, I started to stage (i.e. `git add`) changes early and often. If I’m happy after a turn, I’m usually going to stage everything just so I know I can easily revert to it later.

为了规避这个问题，我开始尽早且频繁地暂存（即 `git add`）改动。如果我对一轮交互的结果感到满意，我通常会把所有东西都暂存起来，这样我就知道之后可以轻松地回滚到这个状态。

## Git Worktrees

I am so obsessed by Claude Code that I now have at least two working trees of every major project I work on on my machine. This allows me to have Claude running on two different problems _in the same repository_.

我非常着迷于 Claude Code，以至于我现在为我手上的每个主要项目都至少准备了两个工作树。这让可以在_同一个仓库_里，让 Claude 同时处理两个不同的问题。

It’s very easy to set up, too! It’s like creating a branch but the code will be in a different directory. Inside your git repository, run:

设置起来也非常简单！就像创建一个分支，但代码会放在一个不同的目录里。在你的 git 仓库里，运行：

```
git worktree add ../tailwindcss.com-2 chore/upgrade-next
```

And, voila, you now have another working directory for Claude Code to go absolutely feral in.

然后，瞧！你就有了另一个工作目录，可以任由 Claude Code 在里面大展拳脚了。

## 用一次性工作来做实验

With AI, code is becoming _really cheap_. This means that you can now build stuff that you only ever use once without feeling bad about it. Everything that you wish would make your current task easier can just be created out of thin air. Here are some examples of things I built recently that would never have been worth my time before coding agents:

有了 AI，代码变得_非常廉价_。这意味着你现在可以去构建那些只用一次的东西，而不会有负罪感。任何你希望用来简化当前任务的东西，都可以凭空创造出来。以下是我最近构建的一些东西，在有编程 agent 之前，这些东西绝对不值得我花时间去做：

*   A dashboard that visualizes my current progress during a large migration at work
*   A chrome extension that shows me which version of Tailwind CSS a website is using (or, god-forbid, wether it isn’t using Tailwind CSS at all)
*   A [CLI and backend](https://github.com/philipp-spiess/claude-code-viewer) to upload Claude Code transcripts to be shared publicly
*   A [CLI to sum up my Claude Code API costs](https://github.com/philipp-spiess/claude-code-costs) to see how much value I get out of the Max plan (oh so much…)
*   An [Electron app that experiments with Claude Code inside a git GUI](https://github.com/philipp-spiess/claude-code-app)
*   一个仪表盘，用于可视化我在工作中一次大型迁移的当前进度
*   一个 Chrome 扩展，用来显示一个网站正在使用哪个版本的 Tailwind CSS（或者，天啊，它根本没用 Tailwind CSS）
*   一个 [CLI 和后端](https://github.com/philipp-spiess/claude-code-viewer)，用于上传 Claude Code 的对话记录并公开分享
*   一个 [CLI 工具，用于汇总我的 Claude Code API 费用](https://github.com/philipp-spiess/claude-code-costs)，看看我从 Max 套餐中获得了多少价值（哦，太多了……）
*   一个 [Electron 应用，用于在 git GUI 中试验 Claude Code](https://github.com/philipp-spiess/claude-code-app)

## 如果可能，别想一次搞定

I’m currently focused on a large-scale change that requires me to touch many Tailwind Plus components in the process. My naive first idea was to create an amazing, thought-out prompt with a lot of detail that can surely make the AI do all of this in one go… That surely must be possible, right?

我目前正专注于一个大规模的改动，需要在此过程中接触许多 Tailwind Plus 组件。我最初天真的想法是，创建一个包含大量细节、构思精妙的 prompt，AI 肯定能一次性搞定所有事情……这肯定可行，对吧？

Well, spoiler alert but I failed miserably with this approach. Not only did it not do what I wanted it to do in the first place, it also made it impossible for me to review the changes or make any meaningful changes. I had to start fresh.

好吧，剧透一下，我用这种方法惨败了。它不仅没有完成我最初想要它做的事，还让我无法审查改动或做出任何有意义的调整。我只能从头再来。

This time I asked Claude Code questions about the problems first. We discussed possible changes before writing any code. Only when I felt certain it knew what I wanted, I let it change one component. After some testing and feedback, I let it do two more. Then another five until I finally let it fan out and do the remainder of the work.

这一次，我先向 Claude Code 提问关于问题本身。我们在写任何代码之前讨论了可能的改动。只有当我确定它明白我的意图后，我才让它改一个组件。经过一些测试和反馈，我让它再改两个。然后再改五个，直到最后我才让它铺开来完成剩下的工作。

While this obviously wasn’t as spectacular as creating the perfect prompt, it got me to the end result much faster and with tighter feedback loops and supervision. I still was able to save so much time compared to doing this change by hand across hundreds of different components.

虽然这显然不如创建一个完美的 prompt 那样壮观，但它让我更快地达到了最终目标，并且反馈循环和监督也更紧密。与手动在数百个不同组件中进行这项更改相比，我仍然节省了大量时间。

This might very well be an issue of me _holding it wrong_. I’ve been seeing a lot of other people claiming to be successful with large one-shot tasks (some of which say that Claude is working for _hours_ straight). However, in my own experience, errors compound quickly and LLMs often loose the thread with a growing context window (and that was with extensive sub-agent calls and even trying Gemini 2.5 Pro). I would love it if someone could share their secrets with me!

这很可能是我_使用方法不对_的问题。我看到很多其他人声称他们成功地完成了一次性的大任务（有些人说 Claude 可以连续工作_好几个小时_）。然而，根据我自己的经验，错误会迅速累积，随着上下文窗口的增长，LLM 常常会跟丢思路（即便我大量使用了子 agent，甚至还试了 Gemini 2.5 Pro）。如果有人能和我分享他们的秘诀，我将不胜感激！

## 自主反馈还是人在环路？

Related to the issue above, this is also an area I still struggle with. Whenever I see people praising AI agents, they mention the importance of some autonomous feedback cycles so that the LLM can improve the result on their own.

与上面的问题相关，这也是一个我仍在挣扎的领域。每当我看到人们称赞 AI agent 时，他们都会提到某种自主反馈循环的重要性，这样 LLM 就可以自行改进结果。

However, I have not been able to do this effectively yet. When I try to set up unit tests or linter feedback, Claude _will read it and then suggest everything is working just fine when there still many are issues/warnings left_. When I set it up so it can navigate to the page and make screenshots, the context window is quickly full with tokens. Safe to say that the experience hasn’t been great for me.

然而，我还没能有效地做到这一点。当我尝试设置单元测试或 linter 反馈时，Claude _会读取它们，然后表示一切正常，即使还有很多问题/警告_。当我设置它以便它可以浏览页面并截图时，上下文窗口很快就被 token 填满了。可以肯定地说，我的体验并不好。

What I like to do instead is just have the dev server running myself. Whenever Claude gets back to me, I take a look at it myself and either copy paste any eventual stack traces as-is, or give some hints as to what I want done differently. I personally find this approach is far more likely to get me to what I want.

我更喜欢自己运行开发服务器。每当 Claude 回复我时，我都会自己看一眼，要么直接把可能出现的堆栈跟踪原样复制粘贴给它，要么就给一些提示，告诉它我希望它换种方式做。我个人发现这种方法更有可能让我得到我想要的结果。

## 尽早打断，频繁打断

Whenever I see something going wrong, I usually press `Escape` to interrupt Claude right away and ask it to revert the latest changes and then guide it more to the direction I want. Of course this only works when you’re keeping an eye which I frankly often don’t do.

每当我看到事情不对劲时，我通常会按 `Escape` 键立即打断 Claude，让它撤销最近的改动，然后引导它朝着我想要的方向走。当然，这只有在你一直盯着它的时候才有效，坦白说我并不经常这样做。

## 配置你的终端

Claude Code has a hidden `/terminal-setup` command that will look at your current terminal setup and make some changes like making it possible to use `Shift+Enter` to add newlines or register the right bell type. While I wasn’t able to figure out the newline thing with Warp, my terminal now beeps whenever Claude needs some human input again.

Claude Code 有一个隐藏的 `/terminal-setup` 命令，它会查看你当前的终端设置并做一些改动，比如让你能用 `Shift+Enter` 来换行，或者注册正确的提示音类型。虽然我没能在 Warp 终端里搞定换行功能，但现在每当 Claude 需要人工输入时，我的终端都会发出提示音。

## 连接你的 IDE

Another relatively new feature is that you can connect Claude to see what files you have open in your IDE and read linter warnings, etc. This is set up either when you run `claude` from within your IDE’s terminal, or by running the `/ide` command. This is handy if you want to tell Claude to “fix my linter issues.”

另一个相对较新的功能是，你可以连接 Claude，让它看到你在 IDE 中打开了哪些文件，并读取 linter 警告等。你可以在 IDE 的终端里运行 `claude`，或者运行 `/ide` 命令来设置。如果你想告诉 Claude “修复我的 linter 问题”，这个功能会很方便。

## 自定义命令

You can create [custom slash commands](https://docs.anthropic.com/en/docs/claude-code/tutorials#create-custom-slash-commands) in Claude Code. If you find yourself writing a similar prompt more than once, this might be your chance to save even more time.

你可以在 Claude Code 中创建[自定义斜杠命令](https://docs.anthropic.com/en/docs/claude-code/tutorials#create-custom-slash-commands)。如果你发现自己不止一次地写同一个类似的 prompt，这可能是你节省更多时间的机会。

I have something set up to clean up temporary scripts or helper files that Claude is very eager to create, for better or worse.

我设置了一个命令来清理 Claude 很热衷于创建的临时脚本或辅助文件，不管它们是好是坏。

## 向 Claude 粘贴图片

You can paste in images into Claude Code. Just copy the image directly or drag a file into your Terminal, and it’ll be added as an attachment to your next message. I use this sometimes when i want to make small visual changes.

你可以向 Claude Code 粘贴图片。直接复制图片，或者把文件拖到你的终端里，它就会作为附件添加到你的下一条消息中。我有时会用这个功能来做一些小的视觉调整。

## 结论

Claude Code has fundamentally changed how I approach many programming tasks. While it’s not perfect and requires adapting your workflow, the productivity gains are real. The key is finding the right balance between automation and human oversight, and being willing to experiment with different approaches.

Claude Code 从根本上改变了我处理许多编程任务的方式。虽然它并不完美，也需要你调整工作流程，但生产力的提升是实实在在的。关键在于找到自动化和人类监督之间的平衡点，并愿意尝试不同的方法。

As AI coding assistants continue to evolve, I expect many of these patterns will change. But for now, these techniques have made my daily coding life significantly more productive and, dare I say, more fun.

随着 AI 编程助手的不断发展，我预计这些模式中的许多都会改变。但就目前而言，这些技巧已经让我的日常编码生活效率显著提高，而且，恕我直言，也更有趣了。
