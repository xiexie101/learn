---
title: "译：Claude Code 就是我的电脑"
date: 2025-06-24
url: https://sorrycc.com/claude-code-is-my-computer
---

发布于 2025年6月24日

# 译：Claude Code 就是我的电脑

> 原文： [https://steipete.me/posts/2025/claude-code-is-my-computer](https://steipete.me/posts/2025/claude-code-is-my-computer)  
> 作者： Peter Steinberger  
> 译者： Gemini 2.5 Pro

![](https://steipete.me/assets/img/2025/claude-code-is-my-computer/hero.png)

**TL;DR**: I run Claude Code in no-prompt mode; it saves me an hour a day and hasn’t broken my Mac in two months. The $200/month [Max plan](/posts/2025/stop-overthinking-ai-subscriptions/) pays for itself.

**长话短说**：我以无提示模式运行 Claude Code，每天为我节省一小时，并且在两个月内没有搞坏我的 Mac。每月 200 美元的 [Max 套餐](https://steipete.me/posts/2025/stop-overthinking-ai-subscriptions/) 物有所值。

For the past two months, I’ve been living dangerously. I launch [Claude Code](https://claude.ai/code) ([released in late February](https://www.anthropic.com/news/claude-3-7-sonnet)) with `--dangerously-skip-permissions`, the flag that bypasses all permission prompts. According to [Anthropic’s docs](https://docs.anthropic.com/en/docs/claude-code), this is meant “only for Docker containers with no internet”, yet it runs perfectly on regular macOS.

在过去的两个月里，我一直在冒险。我用 `--dangerously-skip-permissions` 标志启动 [Claude Code](https://claude.ai/code)（[二月底发布](https://www.anthropic.com/news/claude-3-7-sonnet)），这个标志可以跳过所有权限提示。根据 [Anthropic 的文档](https://docs.anthropic.com/en/docs/claude-code)，这本应“只用于没有互联网的 Docker 容器”，但它在普通的 macOS 上运行得很好。

Yes, a rogue prompt could theoretically nuke my system. That’s why I keep hourly [Arq](https://www.arqbackup.com/) snapshots (plus a [SuperDuper!](https://www.shirt-pocket.com/SuperDuper/SuperDuperDescription.html) clone), but after two months I’ve had zero incidents.

是的，一个恶意的 prompt 理论上可以干掉我的系统。所以我保留了每小时一次的 [Arq](https://www.arqbackup.com/) 快照（外加一个 [SuperDuper!](https://www.shirt-pocket.com/SuperDuper/SuperDuperDescription.html) 克隆备份），但两个月下来，我没遇到任何事故。

## 从“AI 助手”到万能终端

When I first installed Claude Code, I thought I was getting a smarter command line for coding tasks. What I actually got was a universal computer interface that happens to run in text. The mental shift took a few weeks, but once it clicked, I realized Claude can literally do anything I ask on my computer.

刚安装 Claude Code 时，我以为我得到的是一个用于编程任务的更智能的命令行。而我实际得到的，是一个碰巧以文本形式运行的通用计算机接口。这种思维转变花了我几周时间，但一旦想通了，我意识到 Claude 真的能在我电脑上做任何我要求的事情。

The breakthrough moment came when I was migrating to a new Mac. Instead of doing the usual restore dance, I pointed Claude at my backup disk and said: “Restore this Mac from my backup disk—start with dotfiles, then system preferences, CLI tools, and restore Homebrew formulae and global npm packages.” Claude drafts a migration plan, executes it step by step, and has my new machine ready in under an hour.[1](#user-content-fn-1)

顿悟的时刻发生在我迁移到一台新 Mac 时。我没有再折腾那套常规的恢复流程，而是把 Claude 指向我的备份磁盘，然后说：“从我的备份盘恢复这台 Mac——先从 dotfiles 开始，然后是系统偏好设置、命令行工具，最后恢复 Homebrew 公式和全局 npm 包。” Claude 起草了一份迁移计划，一步步执行，不到一小时就让我的新机器准备就绪了。[1](#user-content-fn-1)

## 我实际用它来做什么

My daily Claude Code usage falls into several main outcomes:

我日常使用 Claude Code 主要达成以下几类成果：

**Ship Content**: “Convert ~40 posts from Jekyll to MDX format here. Make sure to copy over the images and preserve the redirects.” Twenty minutes later, Claude had processed every single post, set up proper redirects, validated all image paths, and pushed a merge-ready branch.

**发布内容**：“把这里约 40 篇 Jekyll 格式的文章转换成 MDX 格式。确保图片被复制过来，并保留重定向。”二十分钟后，Claude 处理完了每一篇文章，设置好了正确的重定向，验证了所有图片路径，并推送了一个可以直接合并的分支。

**Extract Features**: “Extract this feature into a Swift project” (that’s how I released [Demark](/posts/2025/introducing-demark-html-to-markdown-in-swift/)) where Claude creates the package structure, writes tests, documentation, and handles the entire open-source release process.

**提取功能**：“把这个功能提取到一个 Swift 项目里”（我就是这样发布 [Demark](https://steipete.me/posts/2025/introducing-demark-html-to-markdown-in-swift/) 的）。Claude 创建了包结构，编写了测试和文档，并处理了整个开源发布流程。

**Automate Content**: Like this very post. I use [Wispr Flow](https://wisprflow.ai/) to talk with Claude, explain the topic and tell it to read my past blog posts to write in my style. Instead of wrestling with Markdown formatting, Claude creates the document, helps formulate thoughts, and tests that everything displays correctly.

**自动化内容**：就像这篇文章本身。我用 [Wispr Flow](https://wisprflow.ai/) 和 Claude 对话，解释主题，告诉它去读我过去的文章来学习我的写作风格。我不用再跟 Markdown 格式较劲，Claude 会创建文档，帮我梳理思路，并测试所有内容是否显示正确。

**Generate Test Data**: “[Create seed data for a project](https://x.com/steipete/status/1923897903698887036)” turns into Claude analyzing my codebase, understanding the data models, and generating realistic test data with proper relationships.

**生成测试数据**：“[为项目创建种子数据](https://x.com/steipete/status/1923897903698887036)” 这条指令，会让 Claude 分析我的代码库，理解数据模型，并生成具有正确关系的真实测试数据。

**Ship Code**: I haven’t typed `git commit -m` in weeks. Instead, I say “commit everything in logical chunks” and Claude handles the entire flow—staging changes, writing meaningful commit messages, pushing, opening PRs, watching CI, and fixing any CI failures. When builds break, it analyzes the errors and patches them automatically. It’s also extremely good at resolving merge conflicts.

**交付代码**：我已经好几周没敲过 `git commit -m` 了。取而代之，我说“把所有东西按逻辑分块提交”，然后 Claude 会处理整个流程——暂存更改、撰写有意义的 commit 信息、推送、创建 PR、监控 CI，并修复任何 CI 失败。当构建失败时，它会分析错误并自动打上补丁。它解决合并冲突的能力也极强。

**Clean the OS**: “Hide recent apps in the Dock” becomes a single natural language command instead of Googling for the right `defaults write` incantation. Claude knows macOS internals and happily calls `killall Dock` to restart the Dock after modifying the plist.

**清理系统**：“在 Dock 中隐藏最近使用的应用”，这变成了一条单一的自然语言命令，而不用去 Google 搜索正确的 `defaults write` 指令。Claude 了解 macOS 的内部机制，并且会在修改 plist 文件后愉快地调用 `killall Dock` 来重启 Dock。

**Spin Up New Machines**: Recently when setting up [CodeLooper’s](https://www.codelooper.app/) code signing and notarization, Claude handled installing Homebrew packages, creating private keys, adding them to the keychain, creating backups, building the project, uploading to GitHub, running tests, and monitoring the process. The only manual part was clicking through the update UI, but with my [macOS Automator MCP Server](https://github.com/steipete/macos-automator-mcp), I could probably teach it that too.

**启动新机器**：最近在为 [CodeLooper](https://www.codelooper.app/) 设置代码签名和公证时，Claude 处理了 Homebrew 包的安装、创建私钥、添加到钥匙串、创建备份、构建项目、上传到 GitHub、运行测试以及监控整个过程。唯一需要手动操作的部分是点击更新 UI，但有了我的 [macOS Automator MCP Server](https://github.com/steipete/macos-automator-mcp)，我或许也能教会它做这件事。

I use an alias in my shell config[2](#user-content-fn-2) so just typing `cc` runs Claude with the permission flag.

我在我的 shell 配置里用了一个别名[2](#user-content-fn-2)，所以只需输入 `cc` 就能带着权限标志运行 Claude。

## 为什么这能行（以及什么时候不行）

Claude Code shines because it was built command-line-first, not bolted onto an IDE as an afterthought. The agent has full access to my filesystem (if you are bold enough…), can execute commands, read output, and iterate based on results.

Claude Code 之所以出色，是因为它从一开始就是为命令行而构建的，而不是事后才被硬塞进 IDE 的一个功能。这个 agent 能完全访问我的文件系统（如果你够胆的话……），可以执行命令、读取输出，并根据结果进行迭代。

Anthropic’s [best practices guide](https://www.anthropic.com/engineering/claude-code-best-practices) recommends keeping a `CLAUDE.md` file at your repo root with project-specific context. I’ve adopted this pattern and noticed Claude asks fewer clarifying questions and writes more accurate code. You can check out [my Claude Code rules](https://github.com/steipete/agent-rules) for examples of how I structure these files. Little optimizations like this compound quickly.

Anthropic 的[最佳实践指南](https://www.anthropic.com/engineering/claude-code-best-practices)建议在你的仓库根目录放一个 `CLAUDE.md` 文件，里面包含项目特定的上下文。我采纳了这个模式，并注意到 Claude 提出的澄清问题变少了，写的代码也更准确了。你可以看看[我的 Claude Code 规则](https://github.com/steipete/agent-rules)作为例子，了解我是如何组织这些文件的。像这样的小优化会很快产生复利效应。

The main limitation is response time. Claude’s thinking process takes a few seconds, and for rapid-fire debugging sessions, I sometimes reach for traditional tools. However, you can prefix commands with `!` to run them directly without waiting for token evaluation—Claude will execute your command either way, but this is faster when you know exactly what you’re calling. For exploratory work where I’m not sure what I need, Claude’s reasoning ability more than compensates for the brief pause.

主要的限制是响应时间。Claude 的思考过程需要几秒钟，在需要快速连续调试的场景下，我有时还是会用回传统工具。不过，你可以在命令前加上 `!` 来直接运行它们，无需等待 token 评估——无论如何 Claude 都会执行你的命令，但当你知道确切要调用什么时，这样做会更快。对于那些我不确定需要什么的探索性工作，Claude 的推理能力足以弥补那短暂的停顿。

## Warp 的不足之处

[Warp’s](https://www.warp.dev/) mission is to “reinvent the command line with AI”. They’ve built beautiful GPU-accelerated panels and smart autocomplete.

[Warp](https://www.warp.dev/) 的使命是“用 AI 重塑命令行”。他们构建了漂亮的 GPU 加速面板和智能自动补全。

The fundamental difference comes down to trust and execution flow. Claude operates purely through text and is remarkably intelligent about understanding context and intent. With this setup, I can pre-authorize Claude to execute commands without constant confirmation prompts. Warp, while excellent, requires individual approval for each command—there’s no equivalent to Claude’s “dangerous mode” where you can grant blanket execution trust. This means Claude maintains conversational flow while Warp still interrupts with permission requests.

根本的区别在于信任和执行流程。Claude 完全通过文本操作，在理解上下文和意图方面非常智能。通过我的这套设置，我可以预先授权 Claude 执行命令，而无需不断的确认提示。Warp 虽然也很出色，但它要求对每条命令进行单独批准——它没有类似 Claude“危险模式”那样的东西，让你能够授予一揽子的执行信任。这意味着 Claude 能够保持对话的流畅性，而 Warp 却会因为权限请求而不断打断你。

I signed up for Warp because I like their mission and I hope they eventually go where Claude is. But it seems they have a fundamentally different idea about safety. Also, [Ghostty](https://ghostty.org/) is just the better command line, native, not Electron-based and faster.

我注册了 Warp，因为我喜欢他们的使命，也希望他们最终能达到 Claude 的境界。但看起来他们对安全有着根本不同的看法。另外，[Ghostty](https://ghostty.org/) 就是一个更好的命令行工具，它是原生的，不是基于 Electron，而且速度更快。

## 未来的方向

We’re in the very early days of AI-native development tools. Claude Code represents a paradigm shift: from tools that help you run commands to tools that understand intent and take action. I’m not just typing commands faster—I’m operating at a fundamentally higher level of abstraction. Instead of thinking “I need to write a bash script to process these files, chmod it, test it, debug it,” I think “organize these files by date and compress anything older than 30 days.”

我们正处于 AI 原生开发工具的极早期阶段。Claude Code 代表了一种范式转变：从帮助你运行命令的工具，转变为理解意图并采取行动的工具。我不仅仅是在更快地输入命令——我正在一个根本上更高的抽象层次上进行操作。我不再去想“我需要写个 bash 脚本来处理这些文件，给它加权限，测试它，调试它”，而是想“按日期整理这些文件，并压缩所有超过 30 天的”。

This isn’t about AI replacing developers—it’s about developers becoming orchestrators of incredibly powerful systems. The skill ceiling rises: syntax fades, system thinking shines.

这无关乎 AI 取代开发者——而是关乎开发者成为强大系统的“编排者” (orchestrator)。技能的天花板提高了：语法变得次要，系统性思维大放异彩。

## 你应该试试吗？

If you’re comfortable with calculated risks and have solid backups, absolutely. The learning curve is essentially zero—you just start talking to your computer like it’s a competent colleague. Within days, you’ll wonder how you ever worked without it.

如果你能接受经过计算的风险，并且有可靠的备份，那绝对应该试试。学习曲线基本为零——你只需开始像和一位能干的同事交谈那样，跟你的电脑说话。几天之内，你就会想，以前没有它自己是怎么工作的。

Your computer isn’t just a computer anymore. It’s Claude. And Claude is absurdly capable.

你的电脑不再只是一台电脑。它现在是 Claude。而 Claude 的能力强得离谱。

## 脚注

1.  Note that full backup migrations can sometimes cause [various system issues](https://discussions.apple.com/thread/255759421) with newer macOS versions. [↩︎](#user-content-fnref-1)
2.  `alias cc="claude --dangerously-skip-permissions"` [↩︎](#user-content-fnref-2)
