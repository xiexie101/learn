---
title: "译：用插件定制你的 Claude Code"
date: 2025-10-11
url: https://sorrycc.com/claude-code-plugins
---

发布于 2025年10月11日

# 译：用插件定制你的 Claude Code

> 原文： [https://www.anthropic.com/news/claude-code-plugins](https://www.anthropic.com/news/claude-code-plugins)  
> 作者： Anthropic  
> 译者： Gemini 2.5 Pro

Claude Code 现在支持插件了：它是一种自定义集合，包含了斜杠命令 (slash commands)、agent、MCP 服务器和 hook，用一条命令就能安装。

## 用插件分享你的 Claude Code 配置

斜杠命令 (slash commands)、agent、MCP 服务器和 hook 都是你可以用来定制 Claude Code 体验的扩展点。在我们陆续推出这些功能后，我们看到用户搭建了越来越强大的配置，并且他们希望把这些配置分享给队友和更广泛的社区。为了让分享变得更容易，我们开发了插件。

插件是一种轻量级的方式，用来打包和分享以下任意组合：

*   **Slash commands**: 为常用操作创建自定义快捷方式
*   **Subagents**: 为专门的开发任务安装特定用途的 agent
*   **MCP servers**: 通过模型上下文协议 (Model Context Protocol) 连接到工具和数据源
*   **Hooks**: 在 Claude Code 工作流的关键节点定制其行为

现在，你可以通过 `/plugin` 命令在 Claude Code 中直接安装插件，该功能已进入公开测试 (public beta) 阶段。它的设计初衷就是可以按需开启和关闭。当你需要特定功能时就启用它们，不需要时就禁用，这样可以减少系统提示词的上下文和复杂度。

![Product screenshot showing Claude Code plugin menu](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F81805a2d45f087f2cc153168759f8bf015706b04-1920x1035.png&w=3840&q=75)

未来，插件将成为我们捆绑和分享 Claude Code 定制功能的标准方式，并且随着我们增加更多的扩展点，我们会继续迭代这个格式。

## 使用场景

插件可以帮助你围绕一套共享的最佳实践来标准化 Claude Code 环境。常见的插件使用场景包括：

*   **强制执行标准：** 工程负责人可以用插件来确保团队在代码审查或测试流程中运行特定的 hook，从而保持团队的一致性。
*   **支持用户：** 例如，开源项目维护者可以提供斜杠命令，帮助开发者正确使用他们的软件包。
*   **分享工作流：** 开发者可以轻松地将自己构建的、能提高生产力的工作流——比如调试配置、部署流水线或测试工具集——分享给其他人。
*   **连接工具：** 需要通过 MCP 服务器连接内部工具和数据源的团队，可以使用具有相同安全和配置协议的插件来加速这一过程。
*   **捆绑定制功能：** 框架作者或技术负责人可以将多个协同工作的定制功能打包在一起，以适应特定的使用场景。

## 插件市场

为了让分享这些定制功能变得更容易，任何人都可以构建和托管插件，并创建插件市场——这是一个精心策划的集合，其他开发者可以在这里发现和安装插件。

你可以使用插件市场与社区分享插件，在你的组织内分发经过批准的插件，并基于现有解决方案来应对常见的开发挑战。

要托管一个市场，你只需要一个 git repository、GitHub repository 或一个包含格式正确的 `.claude-plugin/marketplace.json` 文件的 URL。详情请参阅我们的文档。

要使用来自市场的插件，运行 `/plugin marketplace add user-or-org/repo-name`，然后通过 `/plugin` 菜单浏览和安装插件。

## 发现新市场

插件市场放大了我们社区已经形成的各种最佳实践，而社区成员正在引领潮流。例如，工程师 Dan Ávila 的[插件市场](https://www.aitmpl.com/plugins)提供了用于 DevOps 自动化、文档生成、项目管理和测试套件的插件；而工程师 Seth Hobson 则在他的 [GitHub repository](https://github.com/wshobson/agents) 中整理了超过 80 个专门的 sub-agent，让开发者可以通过插件即时访问。

你也可以看看我们自己开发的几个[示例插件](https://github.com/anthropics/claude-code)，它们用于 PR 审查、安全指导、[Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 开发，甚至还有一个用于创建新插件的元插件 (meta-plugin)。

## 开始使用

插件现在对所有 Claude Code 用户开放公测。使用 `/plugin` 命令安装它们，即可在你的终端和 VS Code 中使用。

查阅我们的文档来[开始使用](https://docs.claude.com/en/docs/claude-code/plugins-reference)，[构建你自己的插件](https://docs.claude.com/en/docs/claude-code/plugins)，或者[发布一个市场](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)。要看看插件的实际效果，可以试试我们用来开发 Claude Code 的这个多 agent 工作流：

```
/plugin marketplace add anthropics/claude-code
```

```
/plugin install feature-dev
```
