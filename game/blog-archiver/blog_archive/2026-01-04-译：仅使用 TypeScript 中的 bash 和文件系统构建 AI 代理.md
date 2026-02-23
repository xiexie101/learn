---
title: "译：仅使用 TypeScript 中的 bash 和文件系统构建 AI 代理"
date: 2026-01-04
url: https://sorrycc.com/building-ai-agent-with-bash-and-filesystem-in-typescript
---

发布于 2026年1月4日

# 译：仅使用 TypeScript 中的 bash 和文件系统构建 AI 代理

> 原文： [https://turso.tech/blog/agentfs-just-bash](https://turso.tech/blog/agentfs-just-bash)  
> 作者： Pekka Enberg  
> 译者： Gemini 3 Pro High

2026年1月2日

Bash 是你能给予 AI 代理的最有效工具之一。基础模型在训练过程中接触过大量的 Shell 脚本，因此它们能够熟练使用 `grep`、`sed`、`awk` 和 `cat` 等命令。给代理一个 Bash 访问权限，它就能探索数据、处理文本和操作文件，而无需为每个任务使用自定义工具。

问题在于，真正的 Bash 需要真正的 Shell 和文件系统。这意味着要么在具有适当隔离的服务器上运行，要么启动容器，或者接受让代理在你的机器上运行命令的安全风险。如果你想在像 Cloudflare Workers 这样的轻量级环境中部署代理，或者想避免容器编排的成本和复杂性，这些选项都不太适用。

然而，来自 Vercel 的 [Malte Ubl](https://x.com/cramforce/status/2004992618913251786) 最近发布了 [just-bash](https://github.com/vercel-labs/just-bash)，它通过完全用 TypeScript 重新实现 Bash 解决了这个问题。它不是一个真正 Shell 的包装器——它是对编码代理实际使用的命令（`grep`, `sed`, `awk`, `jq`, `cat`, `ls` 等）的从头实现。你把它作为一个工具提供给你的代理。代理运行 Shell 命令。这些命令在你的 JavaScript 进程中执行，无法访问你的宿主文件系统。

## 如何工作？

`just-bash` 包在 TypeScript 中实现了 Bash 及其许多命令。默认情况下，它使用内存文件系统，但也提供了一个可插拔的文件系统接口，这使其成为 AgentFS 的一个明显的集成点。

它的工作原理是，当你的代理执行诸如 `cat /README.md` 之类的命令时，`just-bash` 会向 AgentFS 请求该文件，而 AgentFS 使用 Turso 从 SQLite 数据库文件中读取它。代理并不知道它没有运行真正的 Shell。但每个文件都存在于数据库中，每一次更改都被捕获，代理无法逃逸到你的宿主文件系统。

## 示例：AI SDK 集成

以下是在 [AI SDK](https://sdk.vercel.ai/) 中如何将 just-bash 与 AgentFS 连接起来：

```typescript
import { agentfs } from "agentfs-sdk/just-bash";
import { createBashTool } from "just-bash/ai";
import { streamText } from "ai";

const fs = await agentfs({ id: "ai-agent-1" });
const bashTool = createBashTool({ fs });

const result = streamText({
  tools: { bash: bashTool },
});
```

如你所见，我们首先打开一个 agentfs 文件系统，然后使用 `just-bash` 包创建一个 bash 工具，并将其提供给 AI SDK 供基础模型使用。

虽然 AgentFS 是建立在 Turso 之上的，但同样的方法通过 `agentfs-sdk/cloudflare` 集成也适用于 Cloudflare Workers，该集成使用 Cloudflare 的托管 SQLite。你使用 just-bash 和 AgentFS 的方式完全相同，只是用到了一些 Cloudflare Worker API：

```typescript
import { DurableObject } from "cloudflare:workers";
import { streamText } from "ai";
import { createBashTool } from "just-bash/ai";
import { AgentFS } from "agentfs-sdk/cloudflare";
import { agentfs } from "agentfs-sdk/just-bash";

export class Agent extends DurableObject {
  private fs = AgentFS.create(this.ctx.storage);

  async chat(message: string) {
    const bashFs = await agentfs({ fs: this.fs });
    const bashTool = createBashTool({ fs: bashFs });

    const result = streamText({
      tools: { bash: bashTool },
    });

    return result.toDataStream();
  }
}
```

## 何时使用 just-bash

AgentFS 根据你的需求支持不同的集成模式：

**直接 SDK 调用** 最适合构建自定义工具（PDF 解析器、代码分析器）时使用。你在工具实现中直接调用 AgentFS，这给了你完全的控制权。

**`agentfs run` 或 `agentfs mount`** 赋予你宿主系统的全部能力。将 AgentFS 挂载到文件系统，你的代理就可以使用任何工具：git、ffmpeg、语言运行时。这需要系统级设置，但对可用命令没有限制。

**just-bash** 是折衷方案。代理获得透明的 Bash 访问权限——它认为自己正在运行 Shell 命令——但一切都停留在 TypeScript 中。没有容器，没有特定于平台的配置，可在任何 JavaScript 运行的地方运行。权衡在于你仅限于 just-bash 实现的内容，这涵盖了常用命令但并非全部。

对于许多代理应用来说，just-bash 是正确的选择：对模型透明，包含在你的进程中，可部署在任何地方。

## 开始使用

just-bash 和 Cloudflare Worker 集成在 AgentFS 0.4.1 中可用。有关完整示例，请参阅 [GitHub 仓库](https://github.com/tursodatabase/agentfs/?tab=readme-ov-file#examples)。
