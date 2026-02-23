---
title: "译：Claude Code：Agentic 编程的最佳实践"
date: 2025-06-24
url: https://sorrycc.com/claude-code-best-practices
---

发布于 2025年6月24日

# 译：Claude Code：Agentic 编程的最佳实践

> 原文： [https://www.anthropic.com/engineering/claude-code-best-practices](https://www.anthropic.com/engineering/claude-code-best-practices)  
> 作者： Anthropic  
> 译者： Gemini 2.5 Pro

Claude Code is a command line tool for agentic coding. This post covers tips and tricks that have proven effective for using Claude Code across various codebases, languages, and environments.

Claude Code 是一款用于 agentic 编程的命令行工具。本文将介绍一些在使用 Claude Code 应对不同代码库、语言和环境时被证明行之有效的技巧和窍门。

We recently [released Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet), a command line tool for agentic coding. Developed as a research project, Claude Code gives Anthropic engineers and researchers a more native way to integrate Claude into their coding workflows.

我们最近[发布了 Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet)，一款用于 agentic 编程的命令行工具。作为一项研究项目，Claude Code 为 Anthropic 的工程师和研究人员提供了一种更原生的方式，将 Claude 融入他们的编码工作流中。

Claude Code is intentionally low-level and unopinionated, providing close to raw model access without forcing specific workflows. This design philosophy creates a flexible, customizable, scriptable, and safe power tool. While powerful, this flexibility presents a learning curve for engineers new to agentic coding tools—at least until they develop their own best practices.

我们特意把 Claude Code 设计得底层且无预设偏好，它提供近乎原始的模型访问能力，而不会强加特定的工作流程。这种设计哲学创造了一个灵活、可定制、可脚本化且安全的强大工具。虽然功能强大，但这种灵活性也给初次接触 agentic 编程工具的工程师带来了学习曲线——至少在他们形成自己的最佳实践之前是这样。

This post outlines general patterns that have proven effective, both for Anthropic’s internal teams and for external engineers using Claude Code across various codebases, languages, and environments. Nothing in this list is set in stone nor universally applicable; consider these suggestions as starting points. We encourage you to experiment and find what works best for you!

这篇文章概述了一些已被证明行之有效的通用模式，无论是对 Anthropic 内部团队，还是对在各种代码库、语言和环境中使用 Claude Code 的外部工程师而言。列表中的内容并非一成不变，也并非普遍适用；请将这些建议视为起点。我们鼓励你大胆尝试，找到最适合自己的方法！

_Looking for more detailed information? Our comprehensive documentation at [claude.ai/code](https://claude.ai/redirect/website.v1.5f05a214-5231-4c56-aed0-89edf27ef46b/code)_ _covers all the features mentioned in this post and provides additional examples, implementation details, and advanced techniques._

_想要了解更详细的信息？我们在 [claude.ai/code](https://claude.ai/redirect/website.v1.5f05a214-5231-4c56-aed0-89edf27ef46b/code) 上的完整文档涵盖了本文提到的所有功能，并提供了更多示例、实现细节和高级技巧。_

## 1\. 定制你的配置

Claude Code is an agentic coding assistant that automatically pulls context into prompts. This context gathering consumes time and tokens, but you can optimize it through environment tuning.

Claude Code 是一个 agentic 编程助手，它会自动将上下文拉取到提示中。这种上下文收集过程会消耗时间和 token，但你可以通过调整环境来优化它。

### a. 创建 `CLAUDE.md` 文件

`CLAUDE.md` is a special file that Claude automatically pulls into context when starting a conversation. This makes it an ideal place for documenting:

`CLAUDE.md` 是一个特殊文件，Claude 在开始对话时会自动将其内容拉取到上下文中。这使得它成为记录以下信息的理想场所：

*   Common bash commands
*   Core files and utility functions
*   Code style guidelines
*   Testing instructions
*   Repository etiquette (e.g., branch naming, merge vs. rebase, etc.)
*   Developer environment setup (e.g., pyenv use, which compilers work)
*   Any unexpected behaviors or warnings particular to the project
*   Other information you want Claude to remember
*   常用的 bash 命令
*   核心文件和工具函数
*   代码风格指南
*   测试说明
*   代码仓库规范（例如，分支命名、merge vs. rebase 等）
*   开发环境设置（例如，pyenv 的使用、哪些编译器可用）
*   项目特有的任何意外行为或警告
*   任何你想让 Claude 记住的其他信息

There’s no required format for `CLAUDE.md` files. We recommend keeping them concise and human-readable. For example:

`CLAUDE.md` 文件没有固定的格式要求。我们建议保持其简洁易读。例如：

```
# Bash commands
- npm run build: Build the project
- npm run typecheck: Run the typechecker

# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')

# Workflow
- Be sure to typecheck when you’re done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
```

You can place `CLAUDE.md` files in several locations:

你可以在以下几个位置放置 `CLAUDE.md` 文件：

*   **The root of your repo**, or wherever you run `claude` from (the most common usage). Name it `CLAUDE.md` and check it into git so that you can share it across sessions and with your team (recommended), or name it `CLAUDE.local.md` and `.gitignore` it
*   **Any parent of the directory** where you run `claude`. This is most useful for monorepos, where you might run `claude` from `root/foo`, and have `CLAUDE.md` files in both `root/CLAUDE.md` and `root/foo/CLAUDE.md`. Both of these will be pulled into context automatically
*   **Any child of the directory** where you run `claude`. This is the inverse of the above, and in this case, Claude will pull in `CLAUDE.md` files on demand when you work with files in child directories
*   **Your home folder** (`~/.claude/CLAUDE.md`), which applies it to all your _claude_ sessions
*   **仓库的根目录**，或者你运行 `claude` 的任何位置（最常见的用法）。将其命名为 `CLAUDE.md` 并提交到 git，以便在不同会话和团队成员间共享（推荐），或者命名为 `CLAUDE.local.md` 并将其加入 `.gitignore`。
*   **运行 `claude` 目录的任何父目录**。这对于 monorepo 仓库尤其有用，比如你可能在 `root/foo` 中运行 `claude`，同时在 `root/CLAUDE.md` 和 `root/foo/CLAUDE.md` 中都有 `CLAUDE.md` 文件。这两个文件都会被自动拉取到上下文中。
*   **运行 `claude` 目录的任何子目录**。这与上一种情况相反，在这种情况下，当你处理子目录中的文件时，Claude 会按需拉取 `CLAUDE.md` 文件。
*   **你的 home 目录**（`~/.claude/CLAUDE.md`），这会将其应用于你所有的 _claude_ 会话。

When you run the `/init` command, Claude will automatically generate a `CLAUDE.md` for you.

当你运行 `/init` 命令时，Claude 会自动为你生成一个 `CLAUDE.md` 文件。

### b. 优化你的 `CLAUDE.md` 文件

Your `CLAUDE.md` files become part of Claude’s prompts, so they should be refined like any frequently used prompt. A common mistake is adding extensive content without iterating on its effectiveness. Take time to experiment and determine what produces the best instruction following from the model.

你的 `CLAUDE.md` 文件会成为 Claude 提示的一部分，所以应该像对待任何常用提示一样对其进行优化。一个常见的错误是添加大量内容，却不迭代验证其效果。花点时间试验一下，看看哪些内容能让模型更好地遵循指令。

You can add content to your `CLAUDE.md` manually or press the `#` key to give Claude an instruction that it will automatically incorporate into the relevant `CLAUDE.md`. Many engineers use `#` frequently to document commands, files, and style guidelines while coding, then include `CLAUDE.md` changes in commits so team members benefit as well.

你可以手动向 `CLAUDE.md` 添加内容，也可以按 `#` 键给 Claude 一个指令，它会自动将该指令整合到相关的 `CLAUDE.md` 文件中。许多工程师在编码时经常使用 `#` 来记录命令、文件和风格指南，然后将 `CLAUDE.md` 的变更包含在提交中，这样团队成员也能受益。

At Anthropic, we occasionally run `CLAUDE.md` files through the [prompt improver](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-improver) and often tune instructions (e.g. adding emphasis with “IMPORTANT” or “YOU MUST”) to improve adherence.

在 Anthropic，我们偶尔会用 [prompt improver](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-improver) 来优化 `CLAUDE.md` 文件，并经常调整指令（例如，用 “IMPORTANT” 或 “YOU MUST” 来强调）以提高模型的遵循度。

![Claude Code tool allowlist](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F6961243cc6409e41ba93895faded4f4bc1772366-1600x1231.png&w=3840&q=75)

### c. 管理 Claude 的工具白名单

By default, Claude Code requests permission for any action that might modify your system: file writes, many bash commands, MCP tools, etc. We designed Claude Code with this deliberately conservative approach to prioritize safety. You can customize the allowlist to permit additional tools that you know are safe, or to allow potentially unsafe tools that are easy to undo (e.g., file editing, `git commit`).

默认情况下，对于任何可能修改你系统的操作，Claude Code 都会请求许可：例如写入文件、许多 bash 命令、MCP 工具等。我们特意采用这种保守的设计来确保安全。你可以自定义白名单，允许那些你知道是安全的额外工具，或者允许那些容易撤销的潜在不安全工具（例如，文件编辑、`git commit`）。

There are four ways to manage allowed tools:

管理允许的工具有四种方法：

*   **Select “Always allow”** when prompted during a session.
*   **Use the`/permissions`command** after starting Claude Code to add or remove tools from the allowlist. For example, you can add `Edit` to always allow file edits, `Bash(git commit:*)` to allow git commits, or `mcp__puppeteer__puppeteer_navigate` to allow navigating with the Puppeteer MCP server.
*   **Manually edit** your `.claude/settings.json` or `~/.claude.json` (we recommend checking the former into source control to share with your team)_._
*   **Use the `--allowedTools` CLI flag** for session-specific permissions.
*   在会话中被提示时，**选择 “Always allow”**。
*   启动 Claude Code 后，**使用 `/permissions` 命令**来添加或移除白名单中的工具。例如，你可以添加 `Edit` 来始终允许文件编辑，`Bash(git commit:*)` 来允许 git commit，或者 `mcp__puppeteer__puppeteer_navigate` 来允许使用 Puppeteer MCP 服务器进行导航。
*   **手动编辑**你的 `.claude/settings.json` 或 `~/.claude.json` 文件（我们建议将前者提交到版本控制中以便与团队共享）。
*   **使用 `--allowedTools` CLI 标志**来设置会话特定的权限。

### d. 如果使用 GitHub，请安装 gh CLI

Claude knows how to use the `gh` CLI to interact with GitHub for creating issues, opening pull requests, reading comments, and more. Without `gh` installed, Claude can still use the GitHub API or MCP server (if you have it installed).

Claude 知道如何使用 `gh` CLI 与 GitHub 交互，以创建 issue、开启 pull request、阅读评论等。如果没有安装 `gh`，Claude 仍然可以使用 GitHub API 或 MCP 服务器（如果你已安装）。

## 2\. 给 Claude 更多工具

Claude has access to your shell environment, where you can build up sets of convenience scripts and functions for it just like you would for yourself. It can also leverage more complex tools through MCP and REST APIs.

Claude 可以访问你的 shell 环境，你可以在其中为它构建一套便利的脚本和函数，就像为自己构建一样。它还可以通过 MCP 和 REST API 利用更复杂的工具。

### a. 结合 bash 工具使用 Claude

Claude Code inherits your bash environment, giving it access to all your tools. While Claude knows common utilities like unix tools and `gh`, it won’t know about your custom bash tools without instructions:

Claude Code 继承了你的 bash 环境，因此可以访问你所有的工具。虽然 Claude 了解像 unix 工具和 `gh` 这样的常用工具，但如果没有说明，它不会知道你自定义的 bash 工具：

1.  Tell Claude the tool name with usage examples
2.  Tell Claude to run`--help`to see tool documentation
3.  Document frequently used tools in `CLAUDE.md`
4.  告诉 Claude 工具的名称并提供使用示例
5.  告诉 Claude 运行 `--help` 来查看工具文档
6.  在 `CLAUDE.md` 中记录常用的工具

### b. 结合 MCP 使用 Claude

Claude Code functions as both an MCP server and client. As a client, it can connect to any number of MCP servers to access their tools in three ways:

Claude Code 同时扮演着 MCP 服务器和客户端的角色。作为客户端，它可以通过三种方式连接到任意数量的 MCP 服务器以访问它们的工具：

*   **In project config** (available when running Claude Code in that directory)
*   **In global config** (available in all projects)
*   **In a checked-in `.mcp.json` file** (available to anyone working in your codebase). For example, you can add Puppeteer and Sentry servers to your `.mcp.json`, so that every engineer working on your repo can use these out of the box.
*   **在项目配置中**（在该目录中运行 Claude Code 时可用）
*   **在全局配置中**（在所有项目中可用）
*   **在已提交的 `.mcp.json` 文件中**（对你代码库中的任何人都可用）。例如，你可以将 Puppeteer 和 Sentry 服务器添加到 `.mcp.json` 文件中，这样仓库中的每位工程师都可以开箱即用地使用这些工具。

When working with MCP, it can also be helpful to launch Claude with the `--mcp-debug` flag to help identify configuration issues.

在使用 MCP 时，使用 `--mcp-debug` 标志启动 Claude 会很有帮助，可以帮你识别配置问题。

### c. 使用自定义斜杠命令

For repeated workflows—debugging loops, log analysis, etc.—store prompt templates in Markdown files within the `.claude/commands` folder. These become available through the slash commands menu when you type `/`. You can check these commands into git to make them available for the rest of your team.

对于重复性的工作流——如调试循环、日志分析等——可以将提示模板存储在 `.claude/commands` 文件夹下的 Markdown 文件中。当你输入 `/` 时，这些命令就会出现在斜杠命令菜单中。你可以将这些命令提交到 git，让团队其他成员也能使用。

Custom slash commands can include the special keyword `$ARGUMENTS` to pass parameters from command invocation.

自定义斜杠命令可以包含特殊关键字 `$ARGUMENTS`，用于传递从命令调用中传入的参数。

For example, here’s a slash command that you could use to automatically pull and fix a Github issue:

例如，这是一个可以用来自动拉取和修复 GitHub issue 的斜杠命令：

```
Please analyze and fix the GitHub issue: $ARGUMENTS.

Follow these steps:

1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message
8. Push and create a PR

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.
```

Putting the above content into `.claude/commands/fix-github-issue.md` makes it available as the `/project:fix-github-issue` command in Claude Code. You could then for example use `/project:fix-github-issue 1234` to have Claude fix issue #1234. Similarly, you can add your own personal commands to the`~/.claude/commands` folder for commands you want available in all of your sessions.

将上述内容放入 `.claude/commands/fix-github-issue.md` 文件后，它就会在 Claude Code 中以 `/project:fix-github-issue` 命令的形式出现。然后你就可以用 `/project:fix-github-issue 1234` 来让 Claude 修复 issue #1234。同样，你也可以将自己的个人命令添加到 `~/.claude/commands` 文件夹中，让这些命令在你所有的会话中都可用。

## 3\. 尝试常见的工作流

Claude Code doesn’t impose a specific workflow, giving you the flexibility to use it how you want. Within the space this flexibility affords, several successful patterns for effectively using Claude Code have emerged across our community of users:

Claude Code 不会强加特定的工作流，这给了你按自己喜欢的方式使用它的灵活性。在这种灵活性带来的空间里，我们的用户社区中涌现出了几种成功有效使用 Claude Code 的模式：

### a. Explore, plan, code, commit

This versatile workflow suits many problems:

这个通用的工作流适用于许多问题：

1.  **Ask Claude to read relevant files, images, or URLs**, providing either general pointers (“read the file that handles logging”) or specific filenames (“read [logging.py](http://logging.py)”), but explicitly tell it not to write any code just yet.
    1.  This is the part of the workflow where you should consider strong use of subagents, especially for complex problems. Telling Claude to use subagents to verify details or investigate particular questions it might have, especially early on in a conversation or task, tends to preserve context availability without much downside in terms of lost efficiency.
2.  **Ask Claude to make a plan for how to approach a specific problem**. We recommend using the word “think” to trigger extended thinking mode, which gives Claude additional computation time to evaluate alternatives more thoroughly. These specific phrases are mapped directly to increasing levels of thinking budget in the system: “think” < “think hard” < “think harder” < “ultrathink.” Each level allocates progressively more thinking budget for Claude to use.
    1.  If the results of this step seem reasonable, you can have Claude create a document or a GitHub issue with its plan so that you can reset to this spot if the implementation (step 3) isn’t what you want.
3.  **Ask Claude to implement its solution in code**. This is also a good place to ask it to explicitly verify the reasonableness of its solution as it implements pieces of the solution.
4.  **Ask Claude to commit the result and create a pull request**. If relevant, this is also a good time to have Claude update any READMEs or changelogs with an explanation of what it just did.
5.  **让 Claude 阅读相关文件、图片或 URL**，可以提供模糊的指引（“读一下处理日志的那个文件”）或具体的文件名（“读一下 [logging.py](http://logging.py)”），但要明确告诉它暂时不要写任何代码。
    1.  在工作流的这个环节，你应该考虑重度使用子智能体 (subagents)，尤其是在处理复杂问题时。让 Claude 使用子智能体来验证细节或研究它可能遇到的特定问题，尤其是在对话或任务的早期，这样做往往能在不牺牲太多效率的情况下，保留上下文的可用性。
6.  **让 Claude 制定一个解决特定问题的计划**。我们建议使用“think”这个词来触发扩展思考模式，这会给 Claude 额外的计算时间来更全面地评估不同方案。系统会将这些特定的短语直接映射到递增的思考预算上：“think” < “think hard” < “think harder” < “ultrathink”。每个级别都会分配给 Claude 更多的思考预算。
    1.  如果这一步的结果看起来合理，你可以让 Claude 用它的计划创建一个文档或一个 GitHub issue，这样如果后续的实现（第 3 步）不符合你的期望，你就可以回退到这个节点。
7.  **让 Claude 用代码实现它的解决方案**。这也是一个好时机，可以要求它在实现方案的各个部分时，明确验证其解决方案的合理性。
8.  **让 Claude 提交结果并创建一个 pull request**。如果需要，这也是让 Claude 更新任何 README 或 changelog，解释它刚才所做工作的好时机。

Steps #1-#2 are crucial—without them, Claude tends to jump straight to coding a solution. While sometimes that’s what you want, asking Claude to research and plan first significantly improves performance for problems requiring deeper thinking upfront.

第 1-2 步至关重要——没有它们，Claude 往往会直接跳到编码阶段。虽然有时这正是你想要的，但对于需要前期深入思考的问题，先让 Claude 进行研究和规划会显著提高其表现。

### b. Write tests, commit; code, iterate, commit

This is an Anthropic-favorite workflow for changes that are easily verifiable with unit, integration, or end-to-end tests. Test-driven development (TDD) becomes even more powerful with agentic coding:

对于那些可以通过单元、集成或端到端测试轻松验证的变更，这是 Anthropic 内部最喜欢的工作流之一。测试驱动开发（TDD）在 agentic 编程的加持下变得更加强大：

1.  **Ask Claude to write tests based on expected input/output pairs**. Be explicit about the fact that you’re doing test-driven development so that it avoids creating mock implementations, even for functionality that doesn’t exist yet in the codebase.
2.  **Tell Claude to run the tests and confirm they fail**. Explicitly telling it not to write any implementation code at this stage is often helpful.
3.  **Ask Claude to commit the tests** when you’re satisfied with them.
4.  **Ask Claude to write code that passes the tests**, instructing it not to modify the tests. Tell Claude to keep going until all tests pass. It will usually take a few iterations for Claude to write code, run the tests, adjust the code, and run the tests again.
    1.  At this stage, it can help to ask it to verify with independent subagents that the implementation isn’t overfitting to the tests
5.  **Ask Claude to commit the code** once you’re satisfied with the changes.
6.  **让 Claude 根据预期的输入/输出对编写测试**。明确告诉它你正在进行测试驱动开发，这样它就不会创建模拟实现，即使是对于代码库中尚不存在的功能。
7.  **告诉 Claude 运行测试并确认它们失败**。在这个阶段明确告诉它不要编写任何实现代码通常很有帮助。
8.  **当你对测试满意后，让 Claude 提交这些测试**。
9.  **让 Claude 编写能通过测试的代码**，并指示它不要修改测试。告诉 Claude 不断尝试，直到所有测试都通过。通常 Claude 需要几次迭代才能完成：编写代码、运行测试、调整代码、再运行测试。
    1.  在这个阶段，让它用独立的子智能体来验证实现是否对测试过拟合，会很有帮助。
10.  **一旦你对变更满意，就让 Claude 提交代码**。

Claude performs best when it has a clear target to iterate against—a visual mock, a test case, or another kind of output. By providing expected outputs like tests, Claude can make changes, evaluate results, and incrementally improve until it succeeds.

当 Claude 有一个明确的目标可以迭代时——比如一个视觉模型、一个测试用例或其他类型的输出——它的表现最好。通过提供像测试这样的预期输出，Claude 就可以进行修改、评估结果，并逐步改进，直到成功。

### c. Write code, screenshot result, iterate

Similar to the testing workflow, you can provide Claude with visual targets:

与测试工作流类似，你也可以为 Claude 提供视觉目标：

1.  **Give Claude a way to take browser screenshots** (e.g., with the [Puppeteer MCP server](https://github.com/modelcontextprotocol/servers/tree/c19925b8f0f2815ad72b08d2368f0007c86eb8e6/src/puppeteer), an [iOS simulator MCP server](https://github.com/joshuayoes/ios-simulator-mcp), or manually copy / paste screenshots into Claude).
2.  **Give Claude a visual mock** by copying / pasting or drag-dropping an image, or giving Claude the image file path.
3.  **Ask Claude to implement the design** in code, take screenshots of the result, and iterate until its result matches the mock.
4.  **Ask Claude to commit** when you’re satisfied.
5.  **给 Claude 一种截取浏览器屏幕的方法**（例如，使用 [Puppeteer MCP server](https://github.com/modelcontextprotocol/servers/tree/c19925b8f0f2815ad72b08d2368f0007c86eb8e6/src/puppeteer)、[iOS 模拟器 MCP server](https://github.com/joshuayoes/ios-simulator-mcp)，或者手动复制/粘贴截图给 Claude）。
6.  **给 Claude 一个视觉设计稿**，可以通过复制/粘贴或拖放图片，或者直接给它图片文件路径。
7.  **让 Claude 用代码实现设计**，截取结果图，然后不断迭代，直到结果与设计稿匹配。
8.  **当你满意后，让 Claude 提交代码**。

Like humans, Claude’s outputs tend to improve significantly with iteration. While the first version might be good, after 2-3 iterations it will typically look much better. Give Claude the tools to see its outputs for best results.

和人一样，Claude 的输出质量会随着迭代而显著提高。虽然第一个版本可能还不错，但经过 2-3 次迭代后，结果通常会好得多。为了获得最佳结果，请给 Claude 工具，让它能“看到”自己的输出。

![Safe yolo mode](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F6ea59a36fe82c2b300bceaf3b880a4b4852c552d-1600x1143.png&w=3840&q=75)

### d. 安全的 YOLO 模式

Instead of supervising Claude, you can use `claude --dangerously-skip-permissions` to bypass all permission checks and let Claude work uninterrupted until completion. This works well for workflows like fixing lint errors or generating boilerplate code.

你可以使用 `claude --dangerously-skip-permissions` 来代替监督 Claude，这样可以跳过所有权限检查，让 Claude 不间断地工作直到完成任务。这种模式非常适合修复 lint 错误或生成样板代码等工作流。

Letting Claude run arbitrary commands is risky and can result in data loss, system corruption, or even data exfiltration (e.g., via prompt injection attacks). To minimize these risks, use `--dangerously-skip-permissions` in a container without internet access. You can follow this [reference implementation](https://github.com/anthropics/claude-code/tree/main/.devcontainer) using Docker Dev Containers.

让 Claude 运行任意命令是有风险的，可能导致数据丢失、系统损坏，甚至数据泄露（例如，通过提示注入攻击）。为了将这些风险降到最低，请在一个没有网络访问的容器中使用 `--dangerously-skip-permissions`。你可以参考这个使用 Docker Dev Containers 的[参考实现](https://github.com/anthropics/claude-code/tree/main/.devcontainer)。

### e. 代码库问答

When onboarding to a new codebase, use Claude Code for learning and exploration. You can ask Claude the same sorts of questions you would ask another engineer on the project when pair programming. Claude can agentically search the codebase to answer general questions like:

在熟悉一个新代码库时，可以使用 Claude Code 进行学习和探索。你可以像结对编程时问另一位工程师那样，向 Claude 提出各种问题。Claude 能够以 agentic 的方式搜索代码库，回答一些普遍性问题，例如：

*   How does logging work?
*   How do I make a new API endpoint?
*   What does `async move { … }` do on line 134 of `foo.rs`?
*   What edge cases does `CustomerOnboardingFlowImpl` handle?
*   Why are we calling `foo()` instead of `bar()` on line 333?
*   What’s the equivalent of line 334 of `baz.py` in Java?
*   日志系统是怎么工作的？
*   我该如何创建一个新的 API 端点？
*   `foo.rs` 文件第 134 行的 `async move { … }` 是做什么的？
*   `CustomerOnboardingFlowImpl` 处理了哪些边界情况？
*   为什么我们在第 333 行调用 `foo()` 而不是 `bar()`？
*   `baz.py` 文件第 334 行的代码，用 Java 怎么写？

At Anthropic, using Claude Code in this way has become our core onboarding workflow, significantly improving ramp-up time and reducing load on other engineers. No special prompting is required! Simply ask questions, and Claude will explore the code to find answers.

在 Anthropic，以这种方式使用 Claude Code 已经成为我们核心的入职流程，它显著缩短了新人的上手时间，并减轻了其他工程师的负担。不需要特殊的提示！只需提问，Claude 就会探索代码库来寻找答案。

![Use Claude to interact with git](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fa08ea13c2359aac0eceacebf2e15f81e8e8ec8d2-1600x1278.png&w=3840&q=75)

### f. 使用 Claude 与 git 交互

Claude can effectively handle many git operations. Many Anthropic engineers use Claude for 90%+ of our _git_ interactions:

Claude 可以高效地处理许多 git 操作。许多 Anthropic 工程师 90% 以上的 _git_ 交互都是通过 Claude 完成的：

*   **Searching _git_ history** to answer questions like “What changes made it into v1.2.3?”, “Who owns this particular feature?”, or “Why was this API designed this way?” It helps to explicitly prompt Claude to look through git history to answer queries like these.
*   **Writing commit messages**.Claude will look at your changes and recent history automatically to compose a message taking all the relevant context into account
*   **Handling complex git operations** like reverting files, resolving rebase conflicts, and comparing and grafting patches
*   **搜索 _git_ 历史**，以回答诸如“v1.2.3 版本包含了哪些变更？”、“这个特定功能是谁负责的？”或“这个 API 为什么是这样设计的？”之类的问题。明确提示 Claude 查阅 git 历史来回答这类问题会很有帮助。
*   **撰写 commit message**。Claude 会自动查看你的变更和最近的历史记录，综合所有相关上下文来撰写消息。
*   **处理复杂的 git 操作**，如回滚文件、解决 rebase 冲突、以及比较和嫁接补丁。

### g. 使用 Claude 与 GitHub 交互

Claude Code can manage many GitHub interactions:

Claude Code 可以管理许多 GitHub 交互：

*   **Creating pull requests**: Claude understands the shorthand “pr” and will generate appropriate commit messages based on the diff and surrounding context.
*   **Implementing one-shot resolutions** for simple code review comments: just tell it to fix comments on your PR (optionally, give it more specific instructions) and push back to the PR branch when it’s done.
*   **Fixing failing builds** or linter warnings
*   **Categorizing and triaging open issues** by asking Claude to loop over open GitHub issues
*   **创建 pull request**：Claude 能理解“pr”这个简写，并会根据 diff 和周边上下文生成合适的 commit message。
*   **一站式解决**简单的代码审查评论：只需告诉它修复你 PR 上的评论（也可以给它更具体的指示），完成后再推送到 PR 分支。
*   **修复失败的构建**或 linter 警告。
*   **分类和分流开放的 issue**，通过让 Claude 遍历所有开放的 GitHub issue 来实现。

This eliminates the need to remember `gh` command line syntax while automating routine tasks.

这让你无需记住 `gh` 的命令行语法，同时还能自动化处理日常任务。

### h. 使用 Claude 处理 Jupyter notebook

Researchers and data scientists at Anthropic use Claude Code to read and write Jupyter notebooks. Claude can interpret outputs, including images, providing a fast way to explore and interact with data. There are no required prompts or workflows, but a workflow we recommend is to have Claude Code and a `.ipynb` file open side-by-side in VS Code.

Anthropic 的研究员和数据科学家使用 Claude Code 来读写 Jupyter notebook。Claude 能够解释输出，包括图片，为探索和与数据交互提供了一种快捷方式。没有特定的提示或工作流要求，但我们推荐的一个工作流是在 VS Code 中并排打开 Claude Code 和一个 `.ipynb` 文件。

You can also ask Claude to clean up or make aesthetic improvements to your Jupyter notebook before you show it to colleagues. Specifically telling it to make the notebook or its data visualizations “aesthetically pleasing” tends to help remind it that it’s optimizing for a human viewing experience.

在向同事展示你的 Jupyter notebook 之前，你还可以让 Claude 清理或美化它。明确告诉它让 notebook 或其数据可视化变得“美观”，通常能提醒它，优化的目标是人类的视觉体验。

## 4\. 优化你的工作流

The suggestions below apply across all workflows:

以下建议适用于所有工作流：

### a. 指令要具体

Claude Code’s success rate improves significantly with more specific instructions, especially on first attempts. Giving clear directions upfront reduces the need for course corrections later.

Claude Code 的成功率会随着指令的具体化而显著提高，尤其是在初次尝试时。一开始就给出明确的方向，可以减少后续纠偏的需要。

例如：

Poor

Good

add tests for [foo.py](http://foo.py)

write a new test case for [foo.py](http://foo.py), covering the edge case where the user is logged out. avoid mocks

why does ExecutionFactory have such a weird api?

look through ExecutionFactory’s git history and summarize how its api came to be

add a calendar widget

look at how existing widgets are implemented on the home page to understand the patterns and specifically how code and interfaces are separated out. HotDogWidget.php is a good example to start with. then, follow the pattern to implement a new calendar widget that lets the user select a month and paginate forwards/backwards to pick a year. Build from scratch without libraries other than the ones already used in the rest of the codebase.

差

好

给 [foo.py](http://foo.py) 加测试

为 [foo.py](http://foo.py) 写一个新的测试用例，覆盖用户未登录的边界情况。避免使用 mock。

为什么 ExecutionFactory 的 api 这么奇怪？

查阅 ExecutionFactory 的 git 历史，总结一下它的 api 是如何演变至今的。

加一个日历小部件

查看首页上现有小部件的实现方式，理解其模式，特别是代码和接口是如何分离的。可以从 HotDogWidget.php 这个好例子开始。然后，遵循该模式实现一个新的日历小部件，让用户可以选择月份，并能前后翻页选择年份。从头开始构建，除了代码库中已有的库之外，不要使用其他库。

Claude can infer intent, but it can’t read minds. Specificity leads to better alignment with expectations.

Claude 能推断意图，但它不会读心术。具体明确的指令才能更好地符合预期。

![Give Claude images](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F75e1b57a0b696e7aafeca1ed5fa6ba7c601a5953-1360x1126.png&w=3840&q=75)

### b. 给 Claude 图片

Claude excels with images and diagrams through several methods:

Claude 可以通过多种方式出色地处理图片和图表：

*   **Paste screenshots** (pro tip: hit _cmd+ctrl+shift+4_ in macOS to screenshot to clipboard and _ctrl+v_ to paste. Note that this is not cmd+v like you would usually use to paste on mac and does not work remotely.)
*   **Drag and drop** images directly into the prompt input
*   **Provide file paths** for images
*   **粘贴截图**（专业提示：在 macOS 上按 _cmd+ctrl+shift+4_ 将截图保存到剪贴板，然后按 _ctrl+v_ 粘贴。注意，这不同于 mac 上常用的 cmd+v 粘贴，且不支持远程操作。）
*   **拖放**图片到提示输入框
*   **提供图片的文件路径**

This is particularly useful when working with design mocks as reference points for UI development, and visual charts for analysis and debugging. If you are not adding visuals to context, it can still be helpful to be clear with Claude about how important it is for the result to be visually appealing.

这在处理 UI 开发时用设计稿作为参考，或用可视化图表进行分析和调试时特别有用。即使你没有在上下文中添加视觉元素，明确告诉 Claude 最终结果的视觉美观度有多重要，也会很有帮助。

![Mention files you want Claude to look at or work on](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F7372868757dd17b6f2d3fef98d499d7991d89800-1450x1164.png&w=3840&q=75)

### c. 提及你希望 Claude 查看或处理的文件

Use tab-completion to quickly reference files or folders anywhere in your repository, helping Claude find or update the right resources.

使用 tab 自动补全功能可以快速引用你仓库中任何地方的文件或文件夹，帮助 Claude 找到或更新正确的资源。

![Give Claude URLs](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fe071de707f209bbaa7f16b593cc7ed0739875dae-1306x1088.png&w=3840&q=75)

### d. 给 Claude URL

Paste specific URLs alongside your prompts for Claude to fetch and read. To avoid permission prompts for the same domains (e.g., [docs.foo.com](http://docs.foo.com)), use`/permissions` to add domains to your allowlist.

在你的提示旁边粘贴特定的 URL，让 Claude 去获取和阅读。为了避免对同一域名（例如 [docs.foo.com](http://docs.foo.com)）重复弹出权限提示，可以使用 `/permissions` 将域名添加到你的白名单中。

### e. 尽早且频繁地纠正方向

While auto-accept mode (shift+tab to toggle) lets Claude work autonomously, you’ll typically get better results by being an active collaborator and guiding Claude’s approach. You can get the best results by thoroughly explaining the task to Claude at the beginning, but you can also course correct Claude at any time.

虽然自动接受模式（按 shift+tab 切换）可以让 Claude 自主工作，但通常情况下，作为一名积极的协作者并引导 Claude 的方向，你会得到更好的结果。在开始时向 Claude 彻底解释任务可以获得最佳结果，但你也可以随时纠正它的方向。

These four tools help with course correction:

这四个工具有助于纠正方向：

*   **Ask Claude to make a plan** before coding. Explicitly tell it not to code until you’ve confirmed its plan looks good.
*   **Press Escape to interrupt** Claude during any phase (thinking, tool calls, file edits), preserving context so you can redirect or expand instructions.
*   **Double-tap Escape to jump back in history**, edit a previous prompt, and explore a different direction. You can edit the prompt and repeat until you get the result you’re looking for.
*   **Ask Claude to undo changes**, often in conjunction with option #2 to take a different approach.
*   在编码前**让 Claude 制定一个计划**。明确告诉它，在你确认计划可行之前不要开始写代码。
*   在任何阶段（思考、工具调用、文件编辑）**按 Escape 键中断** Claude，这会保留上下文，以便你重新引导或扩展指令。
*   **双击 Escape 键跳回历史记录**，编辑之前的提示，并探索一个不同的方向。你可以编辑提示并重复，直到得到你想要的结果。
*   **让 Claude 撤销更改**，这通常与第二种方法结合使用，以采取不同的策略。

Though Claude Code occasionally solves problems perfectly on the first attempt, using these correction tools generally produces better solutions faster.

尽管 Claude Code 偶尔能在第一次尝试中就完美解决问题，但使用这些纠正工具通常能更快地产生更好的解决方案。

### f. 使用 `/clear` 保持上下文专注

During long sessions, Claude’s context window can fill with irrelevant conversation, file contents, and commands. This can reduce performance and sometimes distract Claude. Use the `/clear` command frequently between tasks to reset the context window.

在长时间的会话中，Claude 的上下文窗口可能会被不相关的对话、文件内容和命令填满。这会降低性能，有时还会分散 Claude 的注意力。在任务之间频繁使用 `/clear` 命令来重置上下文窗口。

### g. 对复杂工作流使用清单和草稿板

For large tasks with multiple steps or requiring exhaustive solutions—like code migrations, fixing numerous lint errors, or running complex build scripts—improve performance by having Claude use a Markdown file (or even a GitHub issue!) as a checklist and working scratchpad:

对于包含多个步骤或需要详尽解决方案的大型任务——比如代码迁移、修复大量 lint 错误或运行复杂的构建脚本——可以让 Claude 使用一个 Markdown 文件（甚至是一个 GitHub issue！）作为清单和工作草稿板来提高性能：

For example, to fix a large number of lint issues, you can do the following:

例如，要修复大量的 lint 问题，你可以这样做：

1.  **Tell Claude to run the lint command** and write all resulting errors (with filenames and line numbers) to a Markdown checklist
2.  **Instruct Claude to address each issue one by one**, fixing and verifying before checking it off and moving to the next
3.  **让 Claude 运行 lint 命令**，并将所有结果错误（包括文件名和行号）写入一个 Markdown 清单。
4.  **指示 Claude 逐一解决每个问题**，在修复和验证后将其勾选掉，然后再进行下一个。

### h. 向 Claude 传递数据

Several methods exist for providing data to Claude:

有几种方法可以向 Claude 提供数据：

*   **Copy and paste** directly into your prompt (most common approach)
*   **Pipe into Claude Code** (e.g., `cat foo.txt | claude`), particularly useful for logs, CSVs, and large data
*   **Tell Claude to pull data** via bash commands, MCP tools, or custom slash commands
*   **Ask Claude to read files** or fetch URLs (works for images too)
*   **直接复制粘贴**到你的提示中（最常见的方法）
*   **通过管道输入到 Claude Code**（例如 `cat foo.txt | claude`），这对于日志、CSV 和大量数据特别有用
*   **让 Claude 通过 bash 命令**、MCP 工具或自定义斜杠命令来拉取数据
*   **让 Claude 读取文件**或获取 URL（对图片也有效）

Most sessions involve a combination of these approaches. For example, you can pipe in a log file, then tell Claude to use a tool to pull in additional context to debug the logs.

大多数会话都会结合使用这些方法。例如，你可以通过管道传入一个日志文件，然后让 Claude 使用一个工具来拉取额外的上下文来调试日志。

## 5\. 使用 headless 模式自动化你的基础设施

Claude Code includes [headless mode](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview#automate-ci-and-infra-workflows) for non-interactive contexts like CI, pre-commit hooks, build scripts, and automation. Use the `-p` flag with a prompt to enable headless mode, and `--output-format stream-json` for streaming JSON output.

Claude Code 包含了 [headless 模式](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview#automate-ci-and-infra-workflows)，用于非交互式环境，如 CI、pre-commit钩子、构建脚本和自动化。使用 `-p` 标志和一个提示来启用 headless 模式，并使用 `--output-format stream-json` 来获取流式 JSON 输出。

Note that headless mode does not persist between sessions. You have to trigger it each session.

请注意，headless 模式不会在会话之间保持。你必须在每个会话中触发它。

### a. 使用 Claude 进行 issue 分流

Headless mode can power automations triggered by GitHub events, such as when a new issue is created in your repository. For example, the public [Claude Code repository](https://github.com/anthropics/claude-code/blob/main/.github/actions/claude-issue-triage-action/action.yml) uses Claude to inspect new issues as they come in and assign appropriate labels.

Headless 模式可以为由 GitHub 事件触发的自动化提供动力，例如当你仓库中创建新 issue 时。例如，公开的 [Claude Code 仓库](https://github.com/anthropics/claude-code/blob/main/.github/actions/claude-issue-triage-action/action.yml) 就使用 Claude 来检查新进的 issue 并分配适当的标签。

### b. 使用 Claude 作为 linter

Claude Code can provide [subjective code reviews](https://github.com/anthropics/claude-code/blob/main/.github/actions/claude-code-action/action.yml) beyond what traditional linting tools detect, identifying issues like typos, stale comments, misleading function or variable names, and more.

Claude Code 可以提供超越传统 linting 工具的[主观代码审查](https://github.com/anthropics/claude-code/blob/main/.github/actions/claude-code-action/action.yml)，识别出诸如拼写错误、过时的注释、误导性的函数或变量名等问题。

## 6\. 通过多 Claude 工作流提升水平

Beyond standalone usage, some of the most powerful applications involve running multiple Claude instances in parallel:

除了独立使用，一些最强大的应用场景涉及到并行运行多个 Claude 实例：

### a. 让一个 Claude 写代码；用另一个 Claude 来验证

A simple but effective approach is to have one Claude write code while another reviews or tests it. Similar to working with multiple engineers, sometimes having separate context is beneficial:

一个简单而有效的方法是让一个 Claude 编写代码，同时让另一个 Claude 审查或测试它。这类似于与多位工程师合作，有时拥有独立的上下文是有益的：

1.  Use Claude to write code
2.  Run `/clear` or start a second Claude in another terminal
3.  Have the second Claude review the first Claude’s work
4.  Start another Claude (or `/clear` again) to read both the code and review feedback
5.  Have this Claude edit the code based on the feedback
6.  用 Claude 写代码。
7.  运行 `/clear` 或在另一个终端中启动第二个 Claude。
8.  让第二个 Claude 审查第一个 Claude 的工作。
9.  启动另一个 Claude（或再次 `/clear`）来阅读代码和审查反馈。
10.  让这个 Claude 根据反馈编辑代码。

You can do something similar with tests: have one Claude write tests, then have another Claude write code to make the tests pass. You can even have your Claude instances communicate with each other by giving them separate working scratchpads and telling them which one to write to and which one to read from.

你也可以对测试做类似的事情：让一个 Claude 写测试，然后让另一个 Claude 写代码来通过这些测试。你甚至可以让你的 Claude 实例相互通信，方法是给它们各自的工作草稿板，并告诉它们哪个用来写，哪个用来读。

This separation often yields better results than having a single Claude handle everything.

这种分离通常比让单个 Claude 处理所有事情产生更好的结果。

### b. 拥有仓库的多个 checkout 副本

Rather than waiting for Claude to complete each step, something many engineers at Anthropic do is:

许多 Anthropic 的工程师不会等待 Claude 完成每一步，而是这样做：

1.  **Create 3-4 git checkouts** in separate folders
2.  **Open each folder** in separate terminal tabs
3.  **Start Claude in each folder** with different tasks
4.  **Cycle through** to check progress and approve/deny permission requests
5.  在不同的文件夹中**创建 3-4 个 git checkout 副本**。
6.  在不同的终端标签页中**打开每个文件夹**。
7.  **在每个文件夹中启动 Claude**，分配不同的任务。
8.  **轮流查看**以检查进度并批准/拒绝权限请求。

### c. 使用 git worktrees

This approach shines for multiple independent tasks, offering a lighter-weight alternative to multiple checkouts. Git worktrees allow you to check out multiple branches from the same repository into separate directories. Each worktree has its own working directory with isolated files, while sharing the same Git history and reflog.

对于多个独立任务，这种方法大放异彩，它提供了一种比多个 checkout 更轻量的替代方案。Git worktrees 允许你将同一个仓库的多个分支 checkout 到不同的目录中。每个 worktree 都有自己独立文件的工作目录，同时共享相同的 Git 历史和 reflog。

Using git worktrees enables you to run multiple Claude sessions simultaneously on different parts of your project, each focused on its own independent task. For instance, you might have one Claude refactoring your authentication system while another builds a completely unrelated data visualization component. Since the tasks don’t overlap, each Claude can work at full speed without waiting for the other’s changes or dealing with merge conflicts:

使用 git worktrees 可以让你在项目的不同部分同时运行多个 Claude 会话，每个会话专注于其独立的任务。例如，你可能让一个 Claude 重构你的认证系统，而另一个 Claude 构建一个完全不相关的数据可视化组件。由于任务不重叠，每个 Claude 都可以全速工作，而无需等待对方的变更或处理合并冲突：

1.  **Create worktrees**: `git worktree add ../project-feature-a feature-a`
2.  **Launch Claude in each worktree**: `cd ../project-feature-a && claude`
3.  **Create additional worktrees** as needed (repeat steps 1-2 in new terminal tabs)
4.  **创建 worktrees**：`git worktree add ../project-feature-a feature-a`
5.  **在每个 worktree 中启动 Claude**：`cd ../project-feature-a && claude`
6.  **根据需要创建额外的 worktrees**（在新的终端标签页中重复步骤 1-2）

一些技巧：

*   Use consistent naming conventions
*   Maintain one terminal tab per worktree
*   If you’re using iTerm2 on Mac, [set up notifications](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview#notification-setup) for when Claude needs attention
*   Use separate IDE windows for different worktrees
*   Clean up when finished: `git worktree remove ../project-feature-a`
*   使用一致的命名规范
*   每个 worktree 保持一个终端标签页
*   如果你在 Mac 上使用 iTerm2，可以[设置通知](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview#notification-setup)，以便在 Claude 需要注意时收到提醒
*   为不同的 worktrees 使用独立的 IDE 窗口
*   完成后清理：`git worktree remove ../project-feature-a`

### d. 在自定义框架中使用 headless 模式

`claude -p` (headless mode) integrates Claude Code programmatically into larger workflows while leveraging its built-in tools and system prompt. There are two primary patterns for using headless mode:

`claude -p`（headless 模式）可以将 Claude Code 以编程方式集成到更大的工作流中，同时利用其内置工具和系统提示。使用 headless 模式主要有两种模式：

1.  **Fanning out** handles large migrations or analyses (e.g., analyzing sentiment in hundreds of logs or analyzing thousands of CSVs):
2.  **扇出（Fanning out）** 处理大规模迁移或分析（例如，分析数百个日志的情感或分析数千个 CSV）：
3.  Have Claude write a script to generate a task list. For example, generate a list of 2k files that need to be migrated from framework A to framework B.
4.  Loop through tasks, calling Claude programmatically for each and giving it a task and a set of tools it can use. For example: `claude -p “migrate foo.py from React to Vue. When you are done, you MUST return the string OK if you succeeded, or FAIL if the task failed.” --allowedTools Edit Bash(git commit:*)`
5.  Run the script several times and refine your prompt to get the desired outcome.
6.  让 Claude 编写一个脚本来生成任务列表。例如，生成一个需要从框架 A 迁移到框架 B 的 2000 个文件的列表。
7.  循环遍历任务，为每个任务以编程方式调用 Claude，并给它一个任务和一套它可以使用的工具。例如：`claude -p “将 foo.py 从 React 迁移到 Vue。完成后，如果成功，你必须返回字符串 OK，如果失败，则返回 FAIL。” --allowedTools Edit Bash(git commit:*)`
8.  多次运行脚本并优化你的提示，以获得期望的结果。
9.  **Pipelining** integrates Claude into existing data/processing pipelines:
10.  **管道化（Pipelining）** 将 Claude 集成到现有的数据/处理管道中：
11.  Call `claude -p “<your prompt>” --json | your_command`, where `your_command` is the next step of your processing pipeline
12.  That’s it! JSON output (optional) can help provide structure for easier automated processing.
13.  调用 `claude -p “<你的提示>” --json | your_command`，其中 `your_command` 是你处理管道的下一步。
14.  就这样！JSON 输出（可选）可以帮助提供结构，以便于自动化处理。

For both of these use cases, it can be helpful to use the `--verbose` flag for debugging the Claude invocation. We generally recommend turning verbose mode off in production for cleaner output.

对于这两种用例，使用 `--verbose` 标志来调试 Claude 的调用会很有帮助。我们通常建议在生产环境中关闭 verbose 模式，以获得更简洁的输出。

What are your tips and best practices for working with Claude Code? Tag @AnthropicAI so we can see what you’re building!

你有什么使用 Claude Code 的技巧和最佳实践吗？请 @AnthropicAI，让我们看看你正在构建什么！

## 致谢

Written by Boris Cherny. This work draws upon best practices from across the broader Claude Code user community, whose creative approaches and workflows continue to inspire us. Special thanks also to Daisy Hollman, Ashwin Bhat, Cat Wu, Sid Bidasaria, Cal Rueb, Nodir Turakulov, Barry Zhang, Drew Hodun and many other Anthropic engineers whose valuable insights and practical experience with Claude Code helped shape these recommendations.

作者：Boris Cherny。这项工作借鉴了广大 Claude Code 用户社区的最佳实践，他们富有创造力的方法和工作流不断激励着我们。同时特别感谢 Daisy Hollman、Ashwin Bhat、Cat Wu、Sid Bidasaria、Cal Rueb、Nodir Turakulov、Barry Zhang、Drew Hodun 以及许多其他 Anthropic 工程师，他们宝贵的见解和使用 Claude Code 的实践经验帮助塑造了这些建议。
