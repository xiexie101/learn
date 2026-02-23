---
title: "615 - 《基于 Neovate Code 的 AI 编程最佳实践》"
date: 2025-12-31
url: https://sorrycc.com/neovate-code-best-practices
---

发布于 2025年12月31日

# 615 - 《基于 Neovate Code 的 AI 编程最佳实践》

> 注：AI 辅助创作，但观点是自己的。

AI 编程的难点不是"能不能生成代码"，而是"能否稳定交付"。

Andrej Karpathy 在 2025 年初提出了 Vibe Coding 的概念：向 AI 描述需求，AI 生成代码，你不做 review，只关注最终产出。这种方式适合快速验证和业余项目，但对于生产项目而言，显然不够。

于是有了 Vibe Engineer：在 Vibe Coding 的基础上，加上工程化——自动化测试、详细的 spec 和文档、版本管理、code review、人为审查。人在此发挥的作用是：提供清晰的指令、管理上下文、验证输出、做顶层设计。

以我自己为例：Feature 开发时一天 Commit 能到 40+，功能开发基本指哪打哪，80% 代码由 Neovate Code 完成，95% 代码由 AI 完成。这不是炫技，而是 Vibe Engineer 方法论落地后的真实效率。

![](https://mdn.alipayobjects.com/huamei_9rin5s/afts/img/Wo7TQoq78NgAAAAAR4AAAAgADiB8AQFr/original)

本文以 [Neovate Code](https://github.com/neovateai/neovate-code/)（读作 `['niːəʊveɪt]`）为例，分享我在日常开发中总结的最佳实践。Neovate Code 是一个开源的 Code Agent，内置 AI 编程最佳实践，支持生成代码、修复 bug、代码审查、添加测试等，可以交互式运行、headless 模式运行，或通过 SDK 封装自己的 Code Agent。

针对 AI 编程的六个核心挑战，我将介绍六个对应的解法：

1.  **复杂需求返工多** → Spec Driven
2.  **串行低效** → Parallel Agents
3.  **定制化需求难满足** → Skills & Slash Commands
4.  **重复操作繁琐** → AI 辅助命令
5.  **CI/CD 与自动化难集成** → Headless
6.  **二次开发缺乏接口** → SDK

## 挑战一：复杂需求返工多 → Spec Driven

### 问题

需求到实现之间有 100 条路可以走。直接 prompt → code，AI 生成的方案可能和你预期的完全不同。

更常见的情况是：你让 AI 出 plan，它输出几百行的文字墙。你没耐心看完，心想"大概没问题吧"，然后直接执行。结果不符合预期，反复返工。

### 解法：Spec Driven

根据场景复杂度，我有三种做法：

*   **简单场景**：直接 prompt → code
*   **复杂但方案笃定**：prompt → plan → code
*   **复杂但方案不笃定**：prompt → brainstorm → design → code

关键在 **Brainstorm 模式**。它通过 1-10+ 道选择题，一小块一小块地让你做决策，而不是一次性甩给你几百行 plan。这样做的好处是：用户和 AI 对整体设计都有清晰认识，减少黑盒和 vibe coding。

操作上，`shift-tab` 两次切到 brainstorm 模式。脑暴完成后，要求 AI「save the design to docs/design」存档。Design Doc 比 Plan Doc 更适合人阅读——全面但不冗余，也方便团队协作和回溯。

![Brainstorm 模式](https://pic.sorrycc.com/proxy/1767090216772-811096895.gif)

工程化支撑：

*   `esc-esc` 回滚会话，减少无用 context 累积
*   `/spec:save-design` 保存设计方案
*   `/spec:write-plan` 生成详细执行计划
*   `/spec:execute-plan` 按计划执行

![Spec Driven Slash Commands](https://pic.sorrycc.com/proxy/1767090290500-47030596.png)

## 挑战二：串行低效 → Parallel Agents

### 问题

一个项目只能跑一个任务，等 AI 响应的时间被浪费，多个需求只能排队处理。

### 解法：Parallel Agents

核心理念：同时雇 N 个 Agent 实习生帮你干活，每个 Agent 跑在独立环境，互不干扰。

技术上基于 **Git Worktree** 实现隔离。Git Worktree 允许一个仓库同时 checkout 多个分支到不同目录，共享核心仓库数据，分离工作区状态。

命令：

```bash
neovate workspace create   # 创建独立工作区
neovate workspace list     # 列出所有工作区
neovate workspace complete # 完成并合并/提PR
```

完整 Workflow：

```
workspace create → brainstorm → save design → implement → workspace complete
```

![Workspace 命令](https://pic.sorrycc.com/proxy/1767090327930-667105487.png)

**实际并发量的思考**：理论上可以开很多 workspace，但人脑极限通常是 2-3 个需求。不是每个需求都需要独立 workspace，小改动冲突不大，根据复杂度灵活选择。

多端支持：

*   **CLI**：命令行操作
*   **Desktop**：一个界面管理所有项目的所有需求
*   **Background/Remote**：长任务异步执行

![Neovate Code Desktop](https://pic.sorrycc.com/proxy/1767090412708-340791236.png)

## 挑战三：定制化需求难满足 → Skills & Slash Commands

### 问题

每个团队、每个项目有不同的规范和流程。重复的操作每次都要手写 prompt。希望沉淀最佳实践，降低使用门槛。

### 解法：两种扩展机制

**1\. Slash Commands - 用户主动调用**

你输入 `/command` 触发，适合固定流程的操作。

示例：

*   `/review` 代码审查
*   `/commit` 生成提交信息
*   `/spec:brainstorm` 进入脑暴模式

**2\. Skills - 模型自动调用**

可复用的能力包，AI 根据任务自动判断何时使用。

例如安装了 `sql-helper` skill 后，当你问「查询最近注册用户」时，AI 会自动调用该 skill 连接数据库，而无需你手动提供 schema。

一个 Skill 是一个目录，包含 `SKILL.md`（带 YAML frontmatter 的 markdown 指令）和可选的辅助文件。特点是可组合、token 高效、轻量聚焦。

位置：

*   项目级：`.neovate/skills/`（团队共享，提交到 git）
*   个人级：`~/.neovate/skills/`（跨项目使用）

安装社区 Skills：

```bash
neovate skill add user/repo
```

**3\. [AGENTS.md](http://AGENTS.md) - 项目级规则**

每次对话都会加载，定义项目通用规范。

我的全局 [AGENTS.md](http://AGENTS.md) 配置：

```
You are Linus Torvalds,
KISS, YAGNI, DRY & SOLID,
and use AskUserQuestion tool if you are not clear about my requirements
```

关键是最后一句：让 AI 在给方案前先理解需求，而不是直接开干。

**三者对比**：

类型

触发方式

适用场景

Skills

模型自动选择

特定领域专业知识

[AGENTS.md](http://AGENTS.md)

每次对话加载

项目通用规范

Slash Commands

用户输入触发

固定流程操作

## 挑战四：重复操作繁琐 → AI 辅助命令

### 问题

每次提交都要手写 commit message，格式不统一；Shell 命令参数记不住，每次都要查文档；从编码到 Git/Shell 操作需要频繁切换工具和思维模式。

### 解法：AI 辅助命令

**1\. neovate commit - AI 生成提交信息**

分析 staged changes，生成语义化的 commit message。支持检测 breaking changes，自动建议分支名。

```bash
neovate commit -s -c --push
```

一行搞定：暂存所有变更 → AI 生成 commit message → 提交 → 推送。

![AI Commit](https://pic.sorrycc.com/proxy/1767090567415-421512944.gif)

交互模式下，你可以预览、编辑、重新生成，确认后再提交。

**2\. neovate run - 自然语言转 Shell 命令**

用自然语言描述你想做什么，AI 生成精确的 Shell 命令。

```bash
neovate run "找出最近7天修改的文件"
# → find . -type f -mtime -7

neovate run "搜索所有 JS 文件中的 TODO 注释"
# → grep -r "TODO" --include="*.js" .
```

交互式确认，避免误操作。加 `--yes` 可以跳过确认直接执行。

**好处**：

*   不用记复杂的命令参数
*   不用离开终端去查文档
*   减少上下文切换成本

## 挑战五：CI/CD 与自动化难集成 → Headless

### 问题

AI 编程通常是交互式的，但很多场景需要无人值守：CI/CD 中的代码审查、测试生成、PR 自动处理；批量任务、cron 定时任务、工具链集成。这些场景无法打开 TUI 交互。

### 解法：Headless 模式

`-q` 参数进入 headless 模式，静默执行，只输出结果。

```bash
neovate -q "Review the changes"
```

**三种输出格式**：

```bash
# Text（默认）- 直接输出文本结果
neovate -q "ping"
# Output: pong

# Stream JSON - 流式输出，每行一个 JSON 事件
neovate -q --output-format stream-json "ping"

# JSON - 执行完成后输出完整 JSON
neovate -q --output-format json "ping"
```

**CI/CD 集成示例**：

```yaml
# GitHub Actions 中自动 review PR
- name: AI Code Review
  run: neovate -q "Review the PR changes, focus on security and performance"
```

**批量处理示例**：

```bash
# 批量为所有 JS 文件生成测试
for file in src/*.js; do
  neovate -q "Generate unit tests for $file"
done
```

**好处**：

*   将 AI 编程能力集成到现有工作流
*   支持无人值守的自动化场景
*   灵活的输出格式适配不同工具链

## 挑战六：二次开发缺乏接口 → SDK

### 问题

想基于 Neovate Code 构建自己的 Code Agent 或将 AI 编程能力嵌入自有产品，但 CLI 不够灵活，缺乏程序化接口。

### 解法：SDK

`@neovate/code` 提供程序化 API，支持单轮调用和流式会话。

```typescript
import { prompt, createSession } from '@neovate/code';

// 单轮调用
const result = await prompt('Explain this code', { model: 'sonnet' });

// 流式会话
const session = await createSession({ model: 'sonnet' });
await session.send('Refactor to async/await');
for await (const msg of session.receive()) {
  console.log(msg);
}
```

**适用场景**：

*   构建自己的 Code Agent 产品
*   IDE 插件集成
*   内部工具平台嵌入 AI 编程能力
*   复杂工作流编排

**实际案例**：快手等公司都有基于 `@neovate/code` 封装自己的 Code Agent 来服务团队，根据内部规范和工具链定制交互流程。

## 我的日常实践

**模型选择**：能用最好的就用最好的。在方案设计上用弱模型，犯的低级错误浪费的时间不值得。

**日常 Workflow**：简化版是 Brainstorm → Save Design → Implement。不是每个需求都需要 workspace，根据复杂度灵活选择。并发 2-3 个需求已是人脑极限。

**Git 提交**：用 `neovate commit -s -c --push` 一键完成。AI 生成的 commit message 比手写更规范，格式统一，还能自动检测 breaking changes。

**沉淀习惯**：

*   完成任务后检查 [AGENTS.md](http://AGENTS.md) 是否需要更新
*   重复 3 次的任务，写个 Slash Command
*   Design Doc 存档，方便回溯

## 结语

AI 编程的核心不是"能生成代码"，而是"稳定交付"。

*   **Spec Driven** 解决可预测性
*   **Parallel Agents** 解决效率
*   **Skills & Slash Commands** 解决定制化
*   **Headless** 解决自动化集成
*   **SDK** 解决二次开发

没有银弹，最佳实践迭代很快。这套方法过一两个月可能就要更新。持续学习，持续调整。

* * *

欢迎加入 Neovate Code 钉钉交流群：[https://qr.dingtalk.com/action/joingroup?code=v1,k1,pg0fnyLgK7i92GKORvxNDlJMQ8dud4Tacx/jt/TMJf0=&\_dt\_no\_comment=1&origin=11](https://qr.dingtalk.com/action/joingroup?code=v1,k1,pg0fnyLgK7i92GKORvxNDlJMQ8dud4Tacx/jt/TMJf0=&_dt_no_comment=1&origin=11)
