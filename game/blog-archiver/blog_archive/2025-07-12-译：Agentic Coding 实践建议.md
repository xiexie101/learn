---
title: "译：Agentic Coding 实践建议"
date: 2025-07-12
url: https://sorrycc.com/agentic-coding-best-practices
---

发布于 2025年7月12日

# 译：Agentic Coding 实践建议

> 原文： [https://lucumr.pocoo.org/2025/6/12/agentic-coding/](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)  
> 作者： Armin Ronacher  
> 译者： Gemini 2.5 Pro

最近，分享 agentic coding 经验的人如雨后春笋般涌现。在我最近发表了关于这个话题的[两篇](https://lucumr.pocoo.org/2025/6/4/changes/) [文章](https://lucumr.pocoo.org/2025/6/10/genai-criticism/)后，收到了不少关于我个人实践的提问。所以，我在这里就献丑了。

## 前言

简单来说，我主要用的是 [Claude Code](https://www.anthropic.com/claude-code)，订阅了每月 100 美元较便宜的 Max 套餐 [1](#fn-1)。这么做效果不错，原因有几点：

*   我只用更便宜的 Sonnet 模型。它完全能满足我的需求，实际上，我更喜欢它的输出，而不是更贵的 Opus 模型。
*   我优化了我的工具使用方式，以提高 token 效率。我尽可能避免使用截图和浏览器交互。后面会详细谈到这点。

我的大致工作流是：给 agent（实际上拥有完全权限）分配一个任务，然后等它完成。除非是小任务，我很少打断它。因此，IDE 的作用——以及 IDE 中 AI 的作用——被大大削弱了；我主要用它做最终编辑。这种方法甚至让我重新用起了 Vim，一个没有 AI 集成的编辑器。

一个提醒：我估计这篇博客会很快过时。这个领域的创新速度太疯狂了；一个月前还成立的道理，今天可能就不再适用了。因此，我将专注于那些我认为具有持久生命力的概念。

如果你想看我用它来为一个开源库做贡献的一小段过程，我这里有[一段录像可供观看](https://www.youtube.com/watch?v=sQYXZCUvpIc)。

## 基础入门

我禁用了所有权限检查。基本上就是运行 `claude --dangerously-skip-permissions`。更具体地说，我设置了一个叫 `claude-yolo` 的别名。你可以说这不负责任，也确实有风险，但你可以通过把开发环境移到 docker 里来管理这些风险。不过，我得说，如果你能稍微看着它点，就算不用 docker，效果也出奇地好。当然，你的情况可能不同（YMMV）。

MCP。这是一个你无法回避的术语。它基本上是一个标准化协议，用来让 agent 访问更多工具。老实说：目前我很少用它，但确实在用。我之所以很少用，是因为 Claude Code 本身就很擅长直接运行常规工具。所以对我来说，只有当我想让 Claude 访问一些它觉得不好用的东西时，才需要 MCP。一个很好的例子是用于浏览器自动化的 [playwright-mcp](https://github.com/microsoft/playwright-mcp)。我用它是因为我还没找到更好的替代品。但比如说，当我想让 agent 捣鼓我的数据库时，我就让它用它能找到的任何工具。在我的例子里，它喜欢用 `psql`，这已经足够好了。

总的来说，我只在备选方案太不可靠时才开始使用 MCP。因为 MCP 服务器本身有时也不是特别可靠，它们是又一个可能出错的东西。我力求保持简单。我的自定义工具就是些普通脚本，它直接运行就行。

## 语言的选择

我评估了 agent 在我工作负载下使用不同语言时的表现，如果你可以选择语言，我强烈推荐新后端项目使用 Go。有几个因素非常有利于 Go：

*   **Context 系统：** Go 提供了一个强大的写时复制 (copy-on-write) 数据包，它会显式地流经代码执行路径，类似于 Python 中的 contextvars 或 .NET 的执行上下文。其显式特性极大地为 AI agent 简化了事情。如果 agent 需要将数据传递到任何调用点，它都知道该怎么做。
*   **测试缓存：** 这对高效的 agentic 循环来说出奇地关键。在 Rust 中，agent 有时会因为误解 `cargo test` 的调用语法而失败。而在 Go 中，测试运行直接且增量，极大地增强了 agentic 工作流。它不需要去搞清楚该运行哪些测试，Go 会自己搞定。
*   **Go 很“草率”：** Rob Pike 有句名言，说 Go 适合那些还没准备好驾驭复杂语言的开发者。把“开发者”换成“agent”，这句话就完美地诠释了为什么 Go 的简单性对 agentic coding 有益。
*   **结构化接口：** Go 的接口是结构化的。如果一个类型拥有接口所期望的方法，它就符合该接口。这对 LLM 来说“理解”起来异常容易。对 agent 来说，几乎没有什么意外。
*   **Go 的生态系统变动小：** Go 的整个生态系统都拥抱向后兼容和显式的版本迁移。这大大降低了 AI 生成过时代码的可能性——与 JavaScript 快速变化的生态系统形成鲜明对比。

作为对比，我最初选择的 Python 常常带来巨大挑战。Agent 很难处理 Python 的“魔法”（比如：Pytest 的 fixture 注入）或复杂的运行时问题（比如：使用 async 时错误的事件循环），经常生成错误代码，连 agentic 循环本身都难以解决。Python 还有实际的性能问题。我不是说它写的代码慢，我是说 agent 循环本身很慢。这是因为 agent 喜欢生成进程和测试脚本，而解释器启动和初始化整个应用可能需要相当长的时间。

在前端，我选择了 tailwind、react、tanstack 的 query 和 router，以及 vite。我对此不是特别满意，但发现它比其他选择要好。Tailwind 和 vite 很棒，没什么可抱怨的。Tanstack 基于文件的路由让我不太爽。部分原因是它喜欢在文件名中使用美元符号，而这真的很容易迷惑 agent。例如，它常常试图编辑 `$param.tsx`，结果却因为被 shell 的变量插值搞混了，而去编辑 `.tsx` 文件。这是个小问题，但非常烦人。

## 工具，工具，还是工具

无论用什么语言，高效的工具都至关重要。关键原则如下：

*   **万物皆为工具**。一个 shell 脚本可以是工具，一个 MCP 服务器可以是工具，一个日志文件也可以是工具。只要 agent 能与之交互或观察到它，就算是个工具。
*   工具必须**快**。它们响应越快（产生的无用输出越少）越好。崩溃可以容忍；卡死则是个大问题。
*   工具必须**对用户友好**！工具必须清楚地告知 agent 误用或错误，以确保它能继续前进。
*   工具需要**防止被一个 LLM 混沌猴完全用错**。不存在所谓的用户错误或未定义行为！
*   Tools need to provide the right **debuggability and observability**.
*   工具需要提供恰当的**可调试性和可观察性**。

举个例子：我把关键工具都放进一个 `Makefile` 里。一个 `make dev` 命令通过一个进程管理器来启动我的服务。和我通常的做法相比，我做了两个关键改动：

1.  我必须保护进程管理器，防止在它已经运行时被二次启动。我用了一个 [shoreman 的 fork](https://gist.github.com/mitsuhiko/8ca80fda0bf48045d54bcd34d76ad887)，它会写入一个 pidfile。当第二次启动时，它会报错并记录“服务已在运行”。这为什么重要？因为 agent 有时不知道服务器是否已在运行，否则它会很乐意地再次启动它，导致两个版本的服务绑定到同一个端口。
2.  我不仅将输出打印到终端，还会一直将其记录到文件中。这使得 agent 可以读取日志文件来诊断发生了什么。

下面是一个能很好地说明这一点的 agentic 交互示例：

```
⏺ Great! The formatting looks good. Now let me run the development server to test the dynamic onboarding:

⏺ Bash(make dev)
  ⎿  Error: error: services are already running make: *** [dev] Error 1

⏺ The development server is already running. Let me check the logs to see the frontend URL:

⏺ Bash(make tail-log)
  ⎿ 01:06:55 backend    | Starting server on localhost:8080
    01:07:39 backend    | [Running: sh -c 'cd backend && go run cmd/server/main.go serve']
    01:07:39 backend    | Starting server on localhost:8080
    08:45:34 backend    | "GET http://localhost:8080/api/users/me HTTP/1.1" from 127.0.0.1:61804 - 200
    39.252666ms
    … +96 lines (ctrl+r to expand)

⏺ Perfect! I can see the frontend is running on http://localhost:3000/ and the latest changes
   have been hot-reloaded. Let me test the dynamic onboarding functionality using playwright:
```

总的来说，日志记录超级重要。例如，我的应用目前有一个注册登录流程，会给用户发送一封邮件。在调试模式下（agent 运行的模式），邮件内容会直接记录到标准输出。这至关重要！它使得 agent 能够用一个远程控制的浏览器，无需额外帮助就能完成整个登录流程。agent 知道邮件会被记录下来，这是因为它收到了一个 `CLAUDE.md` 指令，它会自动查阅日志以获取需要点击的链接。

这算是一个工具吗？在我看来，算的。

## 一切为了速度

Agentic coding 的低效主要源于推理成本和次优的工具使用。我再重申一遍：快速、清晰的工具响应至关重要。我们还没谈到的是，有些工具是“涌现的”，由 agent 自己临时编写。快速的编译和执行能极大地提升 agent 的生产力。那么我们该如何帮助它呢？

通过正确的指令，AI 必须能够通过遵循现有惯例，非常迅速地创建一个新工具。这是必要的，因为你希望 AI 编写一些新代码并运行它。如果一个工具运行需要 3 毫秒，而另一个工具需要编译 5 秒，然后再花一分钟启动、连接数据库和 Kafka，并输出 100 行无意义的日志，那么工作流的质量和速度将有天壤之别。

如果你的东西确实很慢，可以考虑 vibe-coding 一个守护进程，你可以动态地加载东西进去。举个例子，Sentry 重载代码和重启都太慢了。为了在那上面试验一些 agentic coding，我的变通方法是写一个模块，监视一个文件系统位置，然后导入并执行放在那里的所有 Python 模块，再将输出写入一个它能查看的日志里。这不完美，但对 agent 在应用上下文中评估一些基础代码非常有帮助。

平衡日志的冗余度至关重要：信息丰富而又简洁的日志可以优化 token 使用和推理速度，避免不必要的成本和速率限制。如果你找不到这个平衡点，就提供一些简单的开关让 AI 来控制。

在理想的设置中，有用的日志输出是 agent 编写代码的自然副产品。从第一次代码生成就获得可观察性，要远胜于先写代码，运行失败，然后再回到调试循环中添加调试信息。

## 稳定性和复制/粘贴

你真正需要的是稳定的生态系统。LLM 很擅长 Go，也喜欢用 Flask，因为这些都是变化很少的相当稳定的生态系统。你的代码库也是同理。AI 在写代码时喜欢留下各种各样的“面包屑”，这些东西以后可能会造成混淆。例如，我见过 agent 留下有用的注释，解释它为什么选择这条路而不是另一条。如果你随随便便让 AI 升级库，导致其中一些决策不再合理，那么你可能会发现 AI 还在继续沿用一个已经过时的模式。

理论上，这对 agent 和人类来说应该是一样的，但现实是，agent 让升级变得如此“廉价”，以至于人们很想就让 AI 去做，然后看看测试是否还能通过。我发现这根本不是一条成功的路。对待升级要比以前更加保守。

同样地，在使用 AI 时，我强烈倾向于生成更多代码，而不是使用更多依赖。我之前写过为什么你[应该自己写代码](https://lucumr.pocoo.org/2025/1/24/build-it-yourself/)，但随着我越来越多地使用 agentic coding，我对此愈发深信不疑。

## 写简单的代码

在 agentic 的上下文中，简单的代码远胜于复杂的代码。我最近刚写过关于[丑陋代码](https://lucumr.pocoo.org/2025/2/20/ugly-code/)的文章，我认为在 agent 的背景下，这篇文章值得重读。让 agent 去做“能奏效的最蠢的事”。

*   **优先使用函数**而非类，函数名要清晰、描述性强，并且比平时更长。
*   避免继承和过于聪明的技巧。
*   **使用原生 SQL**。我是认真的。你能从 agent 那里得到非常出色的 SQL，而且它们能将自己写的 SQL 与 SQL 日志进行匹配。这比让它们去挖掘你 ORM 的能力极限，然后在日志的 SQL 输出中迷失要好得多。
*   **将重要的检查放在本地。** 你真的需要确保权限检查对 AI 来说非常清晰，并且这些检查发生在 AI 能看到的地方。把权限检查藏在另一个文件或某个配置文件里，几乎可以保证 AI 在添加新路由时会忘记加上权限检查。

## 使其可并行化

Agent 单个运行速度并不算特别快，但并行化可以提升整体效率。要想办法管理好共享状态，比如文件系统、数据库或 Redis 实例，这样你才能同时运行多个 agent。要么避免共享状态，要么找到一种能快速将东西分割开来的方法。

你最初的共享状态就是文件系统，再 checkout 一份代码就行。但说实话，我还没有一个绝佳的解决方案。目前有一些不错的初步尝试。例如，一个值得关注的工具是 [container-use](https://github.com/dagger/container-use)。它是一个 MCP 服务器，指示 Claude 或其他 agent 完全在 Docker 中运行它们的实验。

然后还有像 Cursor 的后台 agent 和 Codex 这样的工具，它们正在把整套东西都搬到 CI 里，这会很有趣。目前，这套方案对我来说还行不通，但一个月后再看看吧。

## 学会重构

Agentic coding 改变了重构的优先级。Agent 能有效地处理任务，直到项目复杂性超过某个可管理的阈值。这里的“太大”指的是它必须考虑的东西的总量。举个例子，你可以用 vibe code 的方式把前端拼凑一段时间，但最终你会达到一个临界点，你必须告诉它去创建一个组件库。为什么？因为如果 tailwind 的 class 乱七八糟地分布在 50 个文件里，你会发现很难让 AI 在不引入重大回归的情况下进行重新设计或提取组件。

一个 agentic 工作流会鼓励你在恰当的时机进行良好的代码维护和重构。你不想做得太早，也绝不想做得太晚。

## 接下来呢？

Agentic coding 正在飞速发展，我今天的工作流明天可能就会大不相同。但有一点是明确的：将 agent 集成到你的开发流程中可以释放巨大的生产力。我鼓励你继续试验。工具和技术会不断演进，但核心原则——简单、稳定、可观察性和智能并行化——将依然至关重要。

最终，目标不仅仅是利用 agent 更快地写代码，而是写出更好、更可维护、更有弹性的代码。即使是今天，代码也已经和几个月前那种糟糕的浆糊完全不同了。保持适应性，编码愉快！

1.  这不是 Claude Code 的广告。它只是我目前在用的 agent。还有别的选择吗？在用户体验上类似的替代品有 [OpenCode](https://github.com/sst/opencode)、[goose](https://block.github.io/goose/)、[Codex](https://github.com/openai/codex) 等等。此外还有 [Devin](https://devin.ai/) 和 Cursor 的[后台 agent](https://docs.cursor.com/background-agent)，但它们的工作方式略有不同，是在云端运行的。[↩](#fnref-1)
