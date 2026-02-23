---
title: "588 - 《Neovate Code 开发笔记 01：接下来的重要 Feature》"
date: 2025-10-11
url: https://sorrycc.com/neovate-code-01-next-important-features
---

发布于 2025年10月11日

# 588 - 《Neovate Code 开发笔记 01：接下来的重要 Feature》

目前有四个。

*   spec driven
*   native app
*   plugin market
*   sub agent

1、spec driven。

spec driven 本质上是对 code agent 场景的 workflow 的探索，业界应该已经公认了「有 spec 之后再执行，对于复杂场景来说是更好和更可控的」。包括 cline 的 plan、claude code 的 plan、qoder 的 quest、cursor 新上的详细 plan、kiro 的 spec 等，都是这个领域的探索，这些 spec 有些是临时，有些是物理文件，但本质上是一样。

neovate code 和 claude code 类似，有个 plan 的模式（shift + tab 切出）出临时的 spec，可以做 plan then execution 的 workflow 。但是，略显简单。

现在更好的 workflow 是「git worktree、brain storm、plan、execute」，参考 [译：我在 2025.09 如何使用 Code Agent](https://sorrycc.com/how-im-using-coding-agents-in-september-2025) 。我个人也是类似的 workflow，其中 git worktree 的部分基于 [Conductor](https://conductor.build/) 。claude code 社区的 [ccpm](https://github.com/automazeio/ccpm)、[spec-kit](https://github.com/github/spec-kit)、[superpowers](https://github.com/obra/Superpowers/) 等也是这个方向的，spec-kit 详细看过，太重，spec 还分了 requment doc、design doc 和 tasks doc，感觉没必要。

![](https://pic.sorrycc.com/proxy/1760174527675-117946682.jpg)

实现思路是加一个 `/spec` 的 slash command（含子 slash command）来覆盖上图「git worktree、brain storm、plan、execute」的整个 workflow。

但是，这一套还是太 geek，对于大多数同学来说会有上手门槛。所以准备搞个 native app 来降低门槛同时把这个 workflow 给固化下来，类似 [Conductor](https://conductor.build/) 。

2、native app。

![](https://pic.sorrycc.com/proxy/1760175042799-968643463.jpg)

native app 的作用包括，a）降低上手门槛，b）固化 workflow，c）parallel agent，让 100 个 agent 一起帮你干活。也可以把 native app 理解成 remote agent 的本地版本，remote agent 比如 [codex platform](https://chatgpt.com/codex) 。

最重要的是 parallel agent，通过他你可以在一个地方管理所有项目，以及这个项目的所有需求。这样，能并发开发多少个需求，就只决定于你的脑力了。所以，他不能是 vscode 插件，也不能是 ide 。这些是以项目为维度的，你需要为每个项目的每个需求单独开一个 ide 窗口，这样太繁琐。

3、plugin market。

这几天 gemini cli 和 claude code 都推出了自己 plugin/extension 体系，见 [https://geminicli.com/docs/extensions/](https://geminicli.com/docs/extensions/) 和 [https://www.anthropic.com/news/claude-code-plugins](https://www.anthropic.com/news/claude-code-plugins) 。

neovate code 有 [plugin 体系](https://neovateai.dev/en/docs/plugins/)，开发者基于此可以做二次开发封装自己的 code agent，但怎么消费之前并没有想清楚，也就是 neovate code 的 plugin 还缺了 market、bundle、use 等环节，需要做一下补全，成本比较低。

4、sub agent。

属于功能上和 claude code 的对齐，但实用性和复杂度不成正比。

参考：  
\[\[Takumi Roadmap 2025.08.12\]\]  
\[\[Takumi Roadmap 2025.07.04\]\]
