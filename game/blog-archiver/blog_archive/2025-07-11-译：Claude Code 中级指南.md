---
title: "译：Claude Code 中级指南"
date: 2025-07-11
url: https://sorrycc.com/claude-code-intermediate-guide
---

发布于 2025年7月11日

# 译：Claude Code 中级指南

> 原文： [https://zenn.dev/gatsby/articles/claude-code-intermediate-guide](https://zenn.dev/gatsby/articles/claude-code-intermediate-guide)  
> 作者： Gatsby  
> 译者： Gemini 2.5 Pro

这篇文章是人写的。虽然我用 AI 检查了错别字，但文章的表述和结构都出自人类之手！

本文基于官方文档和可靠的第三方信息，也请你一并查阅参考来源。

你好，我是 Gatsby。

`Claude` 简直不可思议，让我感受到了奇点将至。

我每天都很焦虑，觉得再不抓紧掌握它就落伍了。但想要系统学习，又发现**官方文档相当厚重，而且关于 `Claude` 的信息非常零散**。于是，我决定自己动手整理一份！

这篇文章基于我自己的学习心得，为各位指明**一条成为 `Claude Code` 中级用户的捷径**（各功能的详细用法我会另写文章说明）。希望能帮到大家。🙇

# 安装与初始设置💻

1.  安装 `Claude Code`。
    
    ```
    npm install -g @anthropic-ai/claude-code
    ```
    
2.  启动 `claude`，开始一个会话。
    
    ```
    claude
    ```
    
3.  首先，让它为你的项目写一个摘要。
    
    ```
    > summarize this project
    ```
    
    这一步至关重要。让 `Claude` 先准确理解当前的代码、目录结构和技术栈，能**显著提升它后续任务的回答精度**。**这是一个最佳实践**。
    
4.  使用 `/init` 命令创建 `CLAUDE.md` 文件。
    
    ```
    > /init
    ```
    
    它会把你刚才生成的摘要写入 `CLAUDE.md`。**`CLAUDE.md` 相当于 `Claude` 的记忆，每次启动新会话时都会被读取**。
    

参考：[Initialize your project - Anthropic Docs](https://docs.anthropic.com/en/docs/claude-code/setup#initialize-your-project)

到这里，初始设置就完成了。即使只做到这一步，`Claude` 也已经足够强大。但**作为一名中级用户，要想进一步提升它的回答精度，你还需要掌握接下来要介绍的一些调优方法和技巧**。

# 大幅提升精度的最佳实践

下面介绍一些能立竿见影的技巧，帮你提升 `Claude` 的回答精度。

## 用 `CLAUDE.md` 持久化上下文

**`Claude` 的会话是无状态的（stateless）**。也就是说，一旦你结束了会话，其中的对话内容就会从内存中消失。理所当然，关于项目的代码、目录结构、技术栈等信息也会在每个新会话开始时被重置。

因此，**那些你希望 `Claude` 始终参考、或者跨会话记忆的信息，都应该写在用 `/init` 命令创建的 `CLAUDE.md` 文件里。**`CLAUDE.md` 会在每个新会话开始时被自动加载，这样 `Claude` 就能始终掌握最新的项目上下文。

不过，从零开始编写上下文信息很麻烦。我们可以利用官方提供的示例提示，来高效地填充 `CLAUDE.md`。下面是一些示例提示。

```
> what does this project do?, and write it in Japanse in CLAUDE.md
> give me an overview of this codebase, and write it in Japanse in CLAUDE.md
> what technologies does this project use?, and write it in Japanse in CLAUDE.md
> explain the main architecture patterns used here, and write it in Japanse in CLAUDE.md
> where is the main entry point?, and write it in Japanse in CLAUDE.md
> explain the folder structure, and write it in Japanse in CLAUDE.md
> analyze the database schema, and write it in Japanse in CLAUDE.md
> what are the key data models?, and write it in Japanse in CLAUDE.md
> how does error handling work in this app?, and write it in Japanse in CLAUDE.md
> how is authentication handled?, and write it in Japanse in CLAUDE.md
```

参考：

*   [Ask your first question - Anthropic Docs](https://docs.anthropic.com/en/docs/claude-code/quickstart#step-2%3A-ask-your-first-question)
*   [Understand new codebases - Anthropic Docs](https://docs.anthropic.com/en/docs/claude-code/common-workflows#understand-new-codebases)

## 不要在提示中输入大量文本

`Claude` 似乎不太擅长处理直接粘贴到提示框里的大段文本。这是 LLM 的一个固有特性。所以，**如果你有大量的指令或配置要提供，最好把它们写在一个文件里，再让 `Claude` 读取**。这样它能更高效地处理信息，生成更高质量的回答。

参考：[Handling large inputs - Anthropic Docs](https://docs.anthropic.com/en/docs/claude-code/setup#handling-large-inputs)

## ultrathink

`Claude` 内部有一个控制其“思考深度”的概念。通过使用特定的关键词，你可以让它思考得更深入，从而提升回答的质量，代价是会消耗更多的 token。

**如果你用的是 Max 套餐，那么 token 的消耗量不影响价格，所以我推荐你始终使用 `ultrathink`**。

*   `think` (上限 4,000 token)
*   `think hard` (上限 10,000 token)
*   `think harder` (上限 31,999 token)
*   `ultrathink` (上限 31,999 token)

如上所示，`ultrathink` 的思考深度最深，当你需要处理复杂问题并获得更高质量的答案时，它非常有效。

**※补充**

**顺便一提，这一点在官方文档里没有写**。它是直接写在 `@anthropic-ai/claude-code` 的 `cli.js` 文件里的。

确认步骤如下：

1.  进入 `Claude Code` 的安装路径
    
    我用的是 `bun`，但**如果你用的是 npm、anyenv 之类的工具，请用 `which claude` 命令来确认你的安装路径**。
    

```
cd ~/.bun/install/global/node_modules/@anthropic-ai/claude-code
```

2.  还原被压缩的代码
    
    发布出来的包代码自然是**被压缩（`minify`）过的，很难直接阅读**。
    
    我们用 `prettier` 把它格式化一下。
    
    ```
    bunx prettier --write cli.js
    
    ```
    
3.  用你喜欢的编辑器打开并搜索
    
    我用的是 `Cursor`，所以用下面的命令打开文件。
    
    **请用你喜欢的编辑器打开，然后按 `cmd + F` 搜索 `ultrathink` 就能看到了**。
    
    ```
    cursor cli.js (From here, press cmd + F and search for ultrathink.)
    ```
    

为以防万一，我附上一张版本 `1.0.29`（截至 2025年6月20日）的代码截图。

![](https://storage.googleapis.com/zenn-user-upload/2fcdc3b39868-20250620.png)

参考：[https://simonwillison.net/2025/Apr/19/claude-code-best-practices/](https://simonwillison.net/2025/Apr/19/claude-code-best-practices/)

## Explore, Plan, Code, Commit

`Claude` 的一大优点是灵活，不依赖特定的 `Workflow`，但这也意味着，**如果你给出的指令含糊不清，它可能会过度解读，然后朝着错误的方向前进**。

为了获得更高的精度和更可靠的产出，最佳实践是**不要直接抛给它一个实现任务，而是按照代码理解、设计、实现、提交的顺序来下达指令**。

1.  **Explore**。首先是理解代码库和相关文件的阶段。

```
> find the files that handle user authentication
```

2.  **Plan**。深入思考实现计划和设计的阶段，在这里使用 `ultrathink` 会很有效。

```
> ultrathink how to implement Role Based User Authentication
```

3.  **Code**。根据计划，请求具体代码实现的阶段。

```
> implement its solution
```

4.  **Commit**。提交已实现变更的阶段。

```
> commit this
```

像这样分阶段下达指令，可以极大地提升回答的精度。

参考：[Explore, Plan, Code, Commit - Anthropic Engineering](https://www.anthropic.com/engineering/claude-code-best-practices#a-explore-plan-code-commit)

## TDD (测试驱动开发)

我就不解释什么是 `TDD` 了。

`TDD Workflow` 是 `Anthropic` 官方认可的工作流。

1.  命令它实现测试。首先，**让 `Claude` 为你想要实现的功能编写测试代码**，然后提交它。这个测试最初会失败（因为功能还没实现）。
2.  命令它实现能通过测试的代码。接下来，**命令 `Claude` 在不修改测试代码的前提下，编写能让测试通过的实现代码**。这样做可以极大地减少输出结果的偏差。

需要注意的是，最终的实现有时可能会对测试数据过度拟合。因此，对于 `Claude` 生成的代码，务必要由人来审查，并根据需要调整测试用例或具体实现。

我找到了一个看起来不错的提示，链接贴在下面。

[https://x.com/ncaq/status/1934833838263554331?s=12&t=HEFImWRTF5N0e3Kpaf5CFg](https://x.com/ncaq/status/1934833838263554331?s=12&t=HEFImWRTF5N0e3Kpaf5CFg)

## /clear

当一个会话变得很长时，`Claude` 可能会被之前的对话内容所影响，**导致它误解上下文，给出奇怪的回答**。当你感觉不对劲时，可以在提示框中执行 `/clear` 命令来**重置当前的对话记录**。

## claude --resume

你是否也曾有过这样的经历：关掉了一个会话，但又想重新打开它？比如，为了处理一个紧急任务，你关闭了当前的会话，切换到另一个分支，开启一个新会话；等紧急任务处理完，你又想切回原来的分支继续……

这时候，`--resume`（或 `-r`）这个选项就派上用场了。执行该命令后，它会**显示一个过去会话（官方文档称之为 `conversation`）的列表**。你只需选择想要返回的会话，就可以重新开始。

```
claude --resume
```

至于过去的会话能保存多少天，我还没找到答案……

参考：[Resume previous conversations - Anthropic Docs](https://docs.anthropic.com/en/docs/claude-code/common-workflows#resume-previous-conversations)

## 设置任务完成通知

`Claude` 在执行复杂任务时，有时会花费 10 分钟、20 分钟甚至更长时间，期间可能没有任何输出。这样你就不知道它到底什么时候能完成，影响工作效率。所以，我们应该**设置任务完成后自动通知**。

```
claude config set --global preferredNotifChannel terminal_bell
```

参考：[Notification setup - Anthropic Docs](https://docs.anthropic.com/en/docs/claude-code/setup#notification-setup)

## npx ccusage

你不好奇自己每天到底用了多少 `Claude` 吗？我反正很好奇！为了值回票价，我最近一直在探索怎么才能把它用到极致（虽然有点本末倒置）。

运行这个命令，你就可以**查看每天的 token 使用量，以及如果是按量付费的话，大概会花多少钱**。

```
npx ccusage
```

每天检查一下使用情况，得意地笑一笑，然后朝着更高效的目标努力吧！

Reference: [CLI tool “ccusage” to visualize Claude Code usage fees](https://zenn.dev/ryoppippi/articles/6c9a8fe6629cd6)

## 其他专业技巧

除此以外，还有一些细节技巧我没有在这里列出，可以查看下面的链接。

官方文档里公布了一系列更详尽的技巧，可以帮你更好地驾驭 `Claude Code`。快去看看，早日成为**Claude 大神（笑）**。💪

[https://docs.anthropic.com/en/docs/claude-code/quickstart#pro-tips-for-beginners](https://docs.anthropic.com/en/docs/claude-code/quickstart#pro-tips-for-beginners)

[https://docs.anthropic.com/en/docs/claude-code/common-workflows](https://docs.anthropic.com/en/docs/claude-code/common-workflows)

[https://www.anthropic.com/engineering/claude-code-best-practices](https://www.anthropic.com/engineering/claude-code-best-practices)

# 总结

现在，你们也是 `Claude Code` 的中级用户了！

牢记这次介绍的最佳实践，善用 `CLAUDE.md` 管理记忆，采用分步工作流，实践 TDD，并调整好相关设置，努力成为\*\*Claude 大神（笑）\*\*吧。👴

P.S. 我正在写《Claude Code 大神指南》，敬请期待（笑）。
