---
title: "译：Boris Cherny 的 Claude Code 使用指南"
date: 2026-01-04
url: https://sorrycc.com/boris-cherny-claude-code-guide
---

发布于 2026年1月4日

# 译：Boris Cherny 的 Claude Code 使用指南

> **原文：** [https://threadreaderapp.com/thread/2007179832300581177.html](https://threadreaderapp.com/thread/2007179832300581177.html)  
> **作者：** Boris Cherny  
> **译者：** Gemini 3 Pro High

我是 Boris，我创建了 Claude Code。很多人问我是如何使用 Claude Code 的，所以我想稍微展示一下我的设置。

我的设置可能出奇地普通！Claude Code 开箱即用，效果很好，所以我个人并没有对其进行太多定制。使用 Claude Code 没有一种所谓的"正确"方式：我们特意将其构建为您可以随意使用、定制和修改的方式。Claude Code 团队中的每个人使用它的方式都截然不同。

那么，开始吧。

## 1\. 终端中并行运行多个 Claude 实例

我在终端中并行运行 5 个 Claude。我将标签页编号为 1-5，并使用系统通知来获知 Claude 何时需要输入。

**参考文档：** [优化您的终端设置](https://code.claude.com/docs/en/terminal-config#iterm-2-system-notifications)

当您的终端配置得当时，Claude Code 的效果最佳。请遵循这些指南以优化您的体验。

![](https://pbs.twimg.com/media/G9rtc4EasAELEzh.jpg)

## 2\. Web 端与本地端协同工作

我还在 [claude.ai/code](http://claude.ai/code) 上并行运行 5-10 个 Claude，与我本地的 Claude 一起运行。当我在终端中编写代码时，我经常会将本地会话移交给 Web 端（使用 `&`），或者在 Chrome 中手动启动会话，有时我会在两者之间使用 `--teleport` 来回切换。我还在每天早上和一天中的其他时间通过手机（使用 Claude iOS 应用程序）启动一些会话，稍后再查看它们。

![](https://pbs.twimg.com/media/G9reZjqaYAA9btU.jpg)

## 3\. 使用 Opus 4.5 with Thinking

我使用带有思维链的 Opus 4.5 处理所有事情。这是我用过的最好的编码模型，尽管它比 Sonnet 更大且更慢，但因为你需要更少地引导它，而且它更擅长使用工具，所以最终它几乎总是比使用较小的模型更快。

## 4\. 团队共享 [CLAUDE.md](http://CLAUDE.md) 文件

我们的团队为 Claude Code 仓库共享一个 `CLAUDE.md` 文件。我们将它检入 git，整个团队每周都会多次贡献内容。每当我们看到 Claude 做错事时，我们都会将其添加到 `CLAUDE.md` 中，这样 Claude 下次就知道不要再这样做了。

其他团队维护他们自己的 `CLAUDE.md`。保持文件更新是每个团队的工作。

![](https://pbs.twimg.com/media/G9rfKYRbkAA6Q3w.jpg)

## 5\. 代码审查中使用 Claude

在代码审查期间，我经常会在同事的 PR 上标记 `@.claude`，以便作为 PR 的一部分向文件中添加内容。我们为此使用 Claude Code Github action (`/install-github-action`)。这是我们版本的复利工程 `CLAUDE.md`。

**参考文档：** [Claude Code 概览](https://code.claude.com/docs)

了解 Claude Code，这是 Anthropic 的代理编码工具，驻留在您的终端中，帮助您以前所未有的速度将想法转化为代码。

![](https://pbs.twimg.com/media/G9rhsVFasAIUCYj.jpg)

## 6\. Plan 模式的重要性

大多数会话都从计划模式开始（按两次 `shift+tab`）。如果我的目标是编写 Pull Request，我会使用计划模式，与 Claude 反复沟通，直到我满意它的计划。之后，我会切换到自动接受编辑模式，Claude 通常可以一次性搞定。**一个好的计划真的非常重要！**

![](https://pbs.twimg.com/media/G9rjZcwasAQpPN6.png)

## 7\. 使用斜杠命令提高效率

对于我每天需要执行多次的每个"内循环"工作流，我都使用斜杠命令。这使我免于重复提示，并让 Claude 也能使用这些工作流。命令已检入 git 并位于 `.claude/commands/` 中。

例如，Claude 和我每天都要使用几十次 `/commit-push-pr` 斜杠命令。该命令使用内联 bash 预先计算 git 状态和其他一些信息，以使命令快速运行并避免与模型来回交互。

**参考文档：** [Bash 命令执行](https://code.claude.com/docs/en/slash-commands#bash-command-execution)

![](https://pbs.twimg.com/media/G9rj3eFasAEK_8J.jpg)

## 8\. 子代理自动化工作流

我经常使用几个子代理：

*   **code-simplifier**：在 Claude 完成工作后简化代码
*   **verify-app**：包含端到端测试 Claude Code 的详细说明
*   等等

与斜杠命令类似，我认为子代理是自动化我在大多数 PR 中所做的最常见工作流。

**参考文档：** [子代理](https://code.claude.com/docs/en/sub-agents)

在 Claude Code 中创建并使用专门的 AI 子代理，以用于特定任务的工作流并改进上下文管理。

![](https://pbs.twimg.com/media/G9rnUzEasAElFcN.png)

## 9\. 使用 PostToolUse 钩子格式化代码

我们使用 PostToolUse 钩子来格式化 Claude 的代码。Claude 通常开箱即可生成格式良好的代码，而该钩子处理剩下的 10% 问题，以避免稍后在 CI 中出现格式错误。

![](https://pbs.twimg.com/media/G9rrnTxasAAMoZ_.jpg)

## 10\. 权限管理最佳实践

我不使用 `--dangerously-skip-permissions`。相反，我使用 `/permissions` 预先允许我知道在我的环境中是安全的常见 bash 命令，以避免不必要的权限提示。其中大多数已检入 `.claude/settings.json` 并与团队共享。

![](https://pbs.twimg.com/media/G9rlDa-asAAXlHx.jpg)

## 11\. 工具集成与 MCP

Claude Code 为我使用所有工具。它经常：

*   搜索并发布到 Slack（通过 MCP 服务器）
*   运行 BigQuery 查询以回答分析问题（使用 bq CLI）
*   从 Sentry 获取错误日志
*   等等

Slack MCP 配置已检入我们的 `.mcp.json` 并与团队共享。

![](https://pbs.twimg.com/media/G9rl_pQb0AAILz8.jpg)

## 12\. 长时间运行任务的处理

对于运行时间非常长的任务，我会：

*   **(a)** 提示 Claude 在完成后使用后台代理验证其工作
*   **(b)** 使用代理停止钩子更确定地执行此操作
*   **©** 使用 ralph-wiggum 插件（最初由 @GeoffreyHuntley 构想）

我也经常在沙箱中使用 `--permission-mode=dontAsk` 或 `--dangerously-skip-permissions` 来避免会话的权限提示，这样 Claude 就可以在不被我阻塞的情况下大展身手。

**参考资源：**

*   [ralph-wiggum 插件](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-wiggum)
*   [Hooks 指南](https://code.claude.com/docs/en/hooks-guide)

![](https://pbs.twimg.com/media/G9ro4W5bEAAQ3ug.jpg)

## 13\. 最重要的建议：验证工作

**最后一个提示：** 从 Claude Code 获得出色结果的最重要的一点——**给 Claude 一种验证其工作的方法**。如果 Claude 拥有该反馈循环，它将使最终结果的质量提高 2-3 倍。

Claude 使用 Claude Chrome 扩展程序测试我提交到 [claude.ai/code](http://claude.ai/code) 的每一项更改。它打开浏览器，测试 UI，并不断迭代，直到代码正常工作且 UX 感觉良好。

每个领域的验证看起来都不同。它可能就像：

*   运行 bash 命令
*   运行测试套件
*   在浏览器或手机模拟器中测试应用程序

**请务必投入精力使其坚如磐石。**

**参考文档：** [Chrome 扩展](https://code.claude.com/docs/en/chrome)

* * *

希望这有所帮助！您使用 Claude Code 有什么技巧？接下来您想听什么内容？
