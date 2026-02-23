---
title: "译：Claude Code for web——来自 Anthropic 的新型异步编程代理"
date: 2025-10-21
url: https://sorrycc.com/claude-code-for-web
---

发布于 2025年10月21日

# 译：Claude Code for web——来自 Anthropic 的新型异步编程代理

> 原文： [https://simonwillison.net/2025/Oct/20/claude-code-for-web/](https://simonwillison.net/2025/Oct/20/claude-code-for-web/)  
> 作者： Simon Willison  
> 译者： Gemini 2.5 Pro

今天早上，Anthropic 推出了 Claude Code for web。它是一个[异步编程代理](https://simonwillison.net/tags/async-coding-agents/)（asynchronous coding agent）——这是他们对 OpenAI 的 [Codex Cloud](https://simonwillison.net/2025/May/16/openai-codex/) 和 Google 的 [Jules](https://simonwillison.net/2025/May/19/jules/) 的回应，形态也十分相似。我周末提前体验了一下，已经看到了一些非常有前景的结果。

你可以在 [claude.ai/code](https://claude.ai) 网站上使用它，它也作为 Claude iPhone 应用中的一个标签页出现：

![Claude AI 界面截图，显示了一个关于更新 README 文件的对话。左侧边栏顶部是“Claude”，随后是导航项：“聊天”、“项目”、“工件”和“代码”（高亮显示）。下方是“已加星标”部分，列出了几个带垃圾桶图标的项目：“LLM”、“Python app”、“检查我的帖子”、“工件”、“摘要”和“Alt 文本编写器”。中间面板显示了一个对话列表，项目包括“进行中”、“运行系统 C”、“空闲”、“更新 Rese”、“运行 Matplotl”、“运行 Marketin”、“WebAssembl”、“基准测试 M”、“构建 URL Qu”和“添加 Read-Or”。右侧面板显示了当前名为“更新研究项目 README”的对话，展示了一个更新 GitHub README 文件的任务，地址为 https://github.com/simonw/research/blob/main/deepseek-ocr-nvidia-spark/README.md，后面是 Claude 的回应和命令输出，显示了带有 10 月 20 日 17:53 时间戳的文件列表。](https://static.simonwillison.net/static/2025/claude-code-for-web.jpg)

据我所知，它就是 Anthropic 最新的 [Claude Code CLI](https://www.claude.com/product/claude-code) 应用，被打包在一个 container 里（Anthropic 最近在 [container 技术](https://simonwillison.net/2025/Sep/9/claude-code-interpreter/)上真是越来越厉害了），并且配置了 `--dangerously-skip-permissions` 参数。它的行为似乎和 CLI 工具完全一样，还包含一个很酷的“teleport”功能，如果你想在本地接管，它可以将聊天记录和编辑过的文件一同复制到你本地的 Claude Code CLI 工具中。

使用起来非常直接。你将 Claude Code for web 指向一个 GitHub 仓库，选择一个环境（完全锁定、限制于一个域名白名单、或者配置成访问你选择的域名，包括用“\*”代表所有域名），然后用一个 prompt 启动它。

在它运行时，你可以发送额外的 prompt，这些 prompt 会被放入队列，并在它完成当前步骤后执行。

任务完成后，它会在你的仓库上创建一个包含其工作的分支，并且可以选择性地创建一个 pull request。

#### 让 Claude Code for web 干活 [#](https://simonwillison.net/2025/Oct/20/claude-code-for-web/#putting-claude-code-for-web-to-work)

Claude Code for web 提交的 PR 和 Claude Code CLI 的没什么区别，所以 Anthropic 告诉我，即使在内部预览期间，向公共仓库提交这些 PR 也是可以的。以下是这个周末的一些例子：

*   [添加 query-string-stripper.html 工具](https://github.com/simonw/tools/pull/73)，针对我的 simonw/tools 仓库——一个_非常_简单的任务，创建（并通过 GitHub Pages 部署）了这个 [query-string-stripper](https://tools.simonwillison.net/query-string-stripper) 工具。
*   [minijinja vs jinja2 性能基准测试](https://github.com/simonw/research/tree/main/minijinja-vs-jinja2)——我在一个私有仓库上运行了这个任务，然后把结果复制到了这里，所以没有 PR。这是我使用的 [prompt](https://github.com/simonw/research/blob/main/minijinja-vs-jinja2/README.md#the-prompt)。
*   [更新 deepseek-ocr README 以反映项目成功完成](https://github.com/simonw/research/pull/1)——我注意到 Claude Code CLI 为[这个项目](https://simonwillison.net/2025/Oct/20/deepseek-ocr-claude-code/)生成的 README 已经过时并有误导性，所以我让 Claude Code for web 修复了这个问题。

第二个例子最有趣。我看到 [Armin 的一条推文](https://x.com/mitsuhiko/status/1980034078297514319)，说他的 [MiniJinja](https://github.com/mitsuhiko/minijinja) Rust 模板语言[增加了对 Python 3.14 free threading 的支持](https://github.com/mitsuhiko/minijinja/pull/841)。我之前都不知道这个项目_有_ Python 绑定，所以我觉得做一个 MiniJinja 和 Jinja2 之间的快速性能比较会很有意思。

我针对一个私有仓库运行了 Claude Code for web，环境完全开放（白名单里填了 `*`），然后给了它这个 prompt：

> 我有兴趣对 [https://github.com/mitsuhiko/minijinja](https://github.com/mitsuhiko/minijinja) 的 Python 绑定和使用 Python jinja2 的等效模板进行基准测试。
> 
> 为此设计并实现一个基准测试。它应该使用 minijinja 的最新 main 分支代码和 jinja2 的最新稳定版本。基准测试应使用 uv 版本的 Python 3.14，并应同时测试常规的 3.14 和 3.14t 的 free threaded 版本——总共四种情景。
> 
> 基准测试应该针对一个相当复杂的模板示例运行，使用模板继承、循环等特性。在 PR 中包含一个运行整个基准测试的 shell 脚本，基准测试的实现，一个详细描述基准测试和结果的 markdown 文件，以及一些使用 matplotlib 创建的说明性图表。

这段话是我在手机键盘上输入到 Claude iPhone 应用里的，所以有些拼写错误。

它埋头工作了几分钟，然后给了我我想要的一切。这是它创建的四张图表之一：

![名为“各迭代渲染时间”的折线图，显示了渲染时间（毫秒，y 轴，范围约 1.0 到 2.5 毫秒）与迭代次数（x 轴，范围 0 到 200+）的关系。四条不同的线代表不同版本：minijinja (3.14t) 为蓝色实线，jinja2 (3.14) 为橙色实线，minijinja (3.14) 为绿色实线，jinja2 (3.14t) 为红色虚线。绿色线 (minijinja 3.14) 显示出持续较高的渲染时间，并在第 25、75 和 150 次迭代附近有几个达到 2.5 毫秒的明显峰值。其他三条线则显示出更稳定、更低的渲染时间，在 1.0-1.5 毫秒之间，并有偶尔的波动。](https://static.simonwillison.net/static/2025/minijinja-timeline.jpg)

（看到 MiniJinja 的性能不如 Jinja2，我有些惊讶，但我想 Jinja2 已经有十年的巧妙性能优化历史，而且它也不需要处理调用 Rust 带来的额外开销。）

需要注意的是，如果我在笔记本上用 Claude CLI 运行这个 prompt，很可能会得到_完全相同_的结果。Claude Code for web 的好处完全在于它的便利性，它让你可以在一个由 Anthropic 管理的托管 container 中运行这些任务，并且在其上层提供了一个舒适的网页和移动端 UI。

#### Anthropic 将此视为其沙盒策略的一部分 [#](https://simonwillison.net/2025/Oct/20/claude-code-for-web/#anthropic-are-framing-this-as-part-of-their-sandboxing-strategy)

有趣的是 Anthropic 选择宣布这项新功能的方式：产品发布的消息被埋在了他们新工程博客文章[《超越权限提示：让 Claude Code 更安全、更自主》](https://www.anthropic.com/engineering/claude-code-sandboxing)的中间部分，文章开头是这样写的：

> Claude Code 新的沙盒功能，一个 bash 工具和网页版 Claude Code，通过启用文件系统和网络隔离这两个边界，减少了权限提示并增强了用户安全。

听到 Claude Code CLI 开始更认真地对待沙盒技术，我_非常_兴奋。我还没深入研究细节——但看起来它在 macOS 上使用了 seatbelt，在 Linux 上使用了 [Bubblewrap](https://github.com/containers/bubblewrap)。

Anthropic 发布了一个新的开源库（Apache 2 协议），[anthropic-experimental/sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime)，其中包含了他们到目前为止的实现。

文件系统沙盒相对容易。更难的问题是网络隔离，他们是这样描述的：

> **网络隔离**，通过只允许通过连接到沙盒外运行的代理服务器的 unix domain socket 进行互联网访问。该代理服务器强制执行进程可以连接的域名的限制，并处理用户对新请求域名的确认。如果您希望进一步提高安全性，我们还支持自定义此代理以对出站流量强制执行任意规则。

这对于防范 prompt injection 和 [lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)（致命三元攻击）至关重要。防止 lethal trifecta 攻击的最好方法是砍掉三条腿中的一条，而网络隔离正是移除数据泄露这条腿的方式，它能阻止成功的攻击者窃取你的数据。

如果你在“无网络访问”模式下运行 Claude Code for web，就没什么好担心的。

我对他们的“受信任网络访问”环境有点担心。它本意是只允许访问与依赖安装相关的域名，但[默认域名列表](https://docs.claude.com/en/docs/claude-code/claude-code-on-the-web#default-allowed-domains)里有几十个条目，这让我担心会有意想不到的数据泄露途径混进来。

你也可以配置一个自定义环境，使用自己的白名单。我有一个叫做“Everything”的环境，白名单里填了“\*”，因为对于像我上面做的 MiniJinja/Jinja2 比较这样的项目，不涉及任何需要保护的秘密或源代码。

我认为 Anthropic 对沙盒的关注，是在承认一件事：以 YOLO 模式（比如使用 `--dangerously-skip-permissions`）运行的编程代理，比那些每一步都需要你批准的代理，其价值和生产力要_高得多_。

挑战在于如何让它们既方便又安全地运行。在我看来，这种沙盒技术是唯一可靠的安全方法。

**更新**：关于成本的说明：我目前正在使用 Anthropic 提供给我的 Claude “Max” 套餐来测试他们的一些功能，所以对于这类项目，Claude Code 的成本是多少，我没有一个很好的概念。

从运行 `npx ccusage@latest`（一个[非官方成本估算工具](https://github.com/ryoppippi/ccusage)）来看，我目前每天调用 Claude CLI 的花费大约在 1 到 5 美元之间。
