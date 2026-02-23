---
title: "译：介绍 Model Context Protocol"
date: 2024-11-28
url: https://sorrycc.com/model-context-protocol
---

发布于 2024年11月28日

# 译：介绍 Model Context Protocol

> 原文：[https://www.anthropic.com/news/model-context-protocol](https://www.anthropic.com/news/model-context-protocol)  
> 译者：ChatGPT 4 Turbo

![An abstract illustration of critical context connecting to a central hub](https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F3aabd8804251c0364cbde9d2e4be6dc8e8c2faec-2880x1620.png&w=3840&q=75)

今天，我们开源了 [模型上下文协议](https://modelcontextprotocol.io)（MCP），这是一种新的标准，用于将人工智能助手与数据所在的系统连接起来，包括内容仓库、商业工具和开发环境。其目的是帮助前沿模型产生更好、更相关的响应。

随着人工智能助手获得主流采用，行业已大力投资于模型能力，取得了在推理和质量上的快速进步。然而，即使是最复杂的模型也受到它们与数据隔离的限制——被困在信息孤岛和遗留系统之后。每个新的数据源都需要自己的定制实现，使真正连接的系统难以扩展。

MCP 解决了这一挑战。它提供了一种通用的、开放的标准，用于将 AI 系统与数据源连接起来，用单一协议替换了碎片化的集成。结果是一种更简单、更可靠的方式，使 AI 系统能够访问它们需要的数据。

### 模型上下文协议

模型上下文协议是一个开放标准，使开发者能够建立安全的、双向的连接，连接他们的数据源和 AI 驱动的工具。架构很直接：开发者可以通过 MCP 服务器暴露他们的数据，或者构建连接到这些服务器的 AI 应用程序（MCP 客户端）。

今天，我们为开发者介绍模型上下文协议的三个主要组件：

*   模型上下文协议[规范和 SDK](https://github.com/modelcontextprotocol)
*   [Claude 桌面应用](https://claude.ai/download)中的本地 MCP 服务器支持
*   一个[MCP 服务器的开源仓库](https://github.com/modelcontextprotocol/servers)

Claude 3.5 Sonnet 是擅长快速构建 MCP 服务器实现的高手，使得组织和个人能够迅速将他们最重要的数据集与一系列 AI 驱动的工具连接起来变得容易。为了帮助开发者开始探索，我们分享了为流行的企业系统（如 Google Drive、Slack、GitHub、Git、Postgres 和 Puppeteer）预构建的 MCP 服务器。

早期采用者如 Block 和 Apollo 已经将 MCP 集成到他们的系统中，而包括 Zed、Replit、Codeium 和 Sourcegraph 在内的开发工具公司正与 MCP 合作，以增强他们的平台——使 AI 代理能够更好地检索相关信息以进一步理解编码任务周围的上下文，并以更少的尝试生成更细腻、功能更丰富的代码。

Block 的首席技术官 Dhanji R. Prasanna 说：“在 Block，开源不仅是一种开发模式——它是我们工作的基础和承诺，旨在创造对所有人都有意义的变革，并作为公共利益提供技术。像模型上下文协议这样的开放技术是连接 AI 与现实应用的桥梁，确保创新是可访问的、透明的，并植根于协作之中。我们很高兴能够合作开发这样的协议，并使用它来构建代理系统，这些系统去除了机械性的负担，让人们可以专注于创造性工作。”

开发者现在不必为每一个数据源维护单独的连接器，而是可以针对一个标准协议进行构建。随着生态系统的成熟，AI 系统将在不同工具和数据集之间移动时保持上下文，用更可持续的架构替代今天的碎片化集成。

### 入门

开发者今天就可以开始构建和测试 MCP 连接器。现有的 Claude for Work 客户可以开始在本地测试 MCP 服务器，将 Claude 连接到内部系统和数据集。我们很快将提供开发者工具包，用于部署远程生产 MCP 服务器，这些服务器可以服务于您整个 Claude for Work 组织。

要开始构建：

*   通过 [Claude Desktop 应用](https://claude.ai/download) 安装预构建的 MCP 服务器
*   跟随我们的 [快速入门指南](https://modelcontextprotocol.io/quickstart) 构建您的第一个 MCP 服务器
*   为我们的 [开源仓库](https://github.com/modelcontextprotocol) 贡献连接器和实现

### 一个开放的社区

我们致力于将 MCP 构建为一个协作的、开源的项目和生态系统，我们渴望听到您的反馈。无论您是 AI 工具开发者、一个寻求利用现有数据的企业，还是一个探索前沿的早期采用者，我们都邀请您共同构建未来的上下文感知 AI。
