---
title: "译：Claude Code Best practices for agentic coding"
date: 2025-07-11
url: https://sorrycc.com/claude-code-best-practices-for-agentic-coding
---

发布于 2025年7月11日

# 译：Claude Code Best practices for agentic coding

> 原文： [https://simonwillison.net/2025/Apr/19/claude-code-best-practices/](https://simonwillison.net/2025/Apr/19/claude-code-best-practices/)  
> 作者： Simon Willison  
> 译者： Gemini 2.5 Pro

**[Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)** ([via](https://twitter.com/HamelHusain/status/1913702157108592719 "@HamelHusain")) Extensive new documentation from Anthropic on how to get the best results out of their [Claude Code](https://github.com/anthropics/claude-code) CLI coding agent tool, which includes this fascinating tip:

**[Claude Code：agentic 编程最佳实践](https://www.anthropic.com/engineering/claude-code-best-practices)** ([来源](https://twitter.com/HamelHusain/status/1913702157108592719 "@HamelHusain")) Anthropic 发布了一份详尽的新文档，介绍了如何从他们的 [Claude Code](https://github.com/anthropics/claude-code) CLI 编程 agent 工具中获得最佳效果。其中包含了一个很有意思的技巧：

> We recommend using the word “think” to trigger extended thinking mode, which gives Claude additional computation time to evaluate alternatives more thoroughly. These specific phrases are mapped directly to increasing levels of thinking budget in the system: “think” < “think hard” < “think harder” < “ultrathink.” Each level allocates progressively more thinking budget for Claude to use.

> 我们建议使用“think”这个词来触发扩展思考模式，这能给 Claude 更多计算时间，从而更彻底地评估不同方案。这些特定短语直接对应系统中不断增加的思考预算等级：“think” < “think hard” < “think harder” < “ultrathink”。每个等级都会为 Claude 分配更多思考预算。

Apparently **ultrathink** is a magic word!

看来 **ultrathink** 是个魔法咒语！

I was curious if this was a feature of the Claude model itself or Claude Code in particular. Claude Code isn’t open source but you can view the obfuscated JavaScript for it, and make it a tiny bit less obfuscated by running it through [Prettier](https://prettier.io/). With [Claude’s help](https://claude.ai/share/77c398ec-6a8b-4390-91d3-6e9f0403916e) I used this recipe:

我很好奇，这究竟是 Claude 模型本身的功能，还是 Claude Code 特有的功能。Claude Code 并不开源，但你可以查看它混淆过的 JavaScript 代码，然后用 [Prettier](https://prettier.io/) 跑一遍，让代码的可读性高一点点。在 [Claude 的帮助下](https://claude.ai/share/77c398ec-6a8b-4390-91d3-6e9f0403916e)，我用了下面这套方法：

```
mkdir -p /tmp/claude-code-examine
cd /tmp/claude-code-examine
npm init -y
npm install @anthropic-ai/claude-code
cd node_modules/@anthropic-ai/claude-code
npx prettier --write cli.js
```

Then used [ripgrep](https://github.com/BurntSushi/ripgrep) to search for “ultrathink”:

然后用 [ripgrep](https://github.com/BurntSushi/ripgrep) 搜索 “ultrathink”：

```
rg ultrathink -C 30
```

And found this chunk of code:

于是找到了下面这段代码：

```
let B = W.message.content.toLowerCase();
if (
  B.includes("think harder") ||
  B.includes("think intensely") ||
  B.includes("think longer") ||
  B.includes("think really hard") ||
  B.includes("think super hard") ||
  B.includes("think very hard") ||
  B.includes("ultrathink")
)
  return (
    l1("tengu_thinking", { tokenCount: 31999, messageId: Z, provider: G }),
    31999
  );
if (
  B.includes("think about it") ||
  B.includes("think a lot") ||
  B.includes("think deeply") ||
  B.includes("think hard") ||
  B.includes("think more") ||
  B.includes("megathink")
)
  return (
    l1("tengu_thinking", { tokenCount: 1e4, messageId: Z, provider: G }), 1e4
  );
if (B.includes("think"))
  return (
    l1("tengu_thinking", { tokenCount: 4000, messageId: Z, provider: G }),
    4000
  );
```

```
let B = W.message.content.toLowerCase();
if (
  B.includes("think harder") ||
  B.includes("think intensely") ||
  B.includes("think longer") ||
  B.includes("think really hard") ||
  B.includes("think super hard") ||
  B.includes("think very hard") ||
  B.includes("ultrathink")
)
  return (
    l1("tengu_thinking", { tokenCount: 31999, messageId: Z, provider: G }),
    31999
  );
if (
  B.includes("think about it") ||
  B.includes("think a lot") ||
  B.includes("think deeply") ||
  B.includes("think hard") ||
  B.includes("think more") ||
  B.includes("megathink")
)
  return (
    l1("tengu_thinking", { tokenCount: 1e4, messageId: Z, provider: G }), 1e4
  );
if (B.includes("think"))
  return (
    l1("tengu_thinking", { tokenCount: 4000, messageId: Z, provider: G }),
    4000
  );
```

So yeah, it looks like “ultrathink” is a Claude Code feature - presumably that 31999 is a number that affects the token [thinking budget](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#implementing-extended-thinking), especially since “megathink” maps to 1e4 tokens (10,000) and just plain “think” maps to 4,000.

所以，没错，看起来 “ultrathink” 是 Claude Code 的一个特性——那个 31999 很可能是一个影响 token [thinking budget](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#implementing-extended-thinking) 的数字，尤其是 “megathink” 对应 1e4 (10,000) tokens，而普通的 “think” 只对应 4,000。
