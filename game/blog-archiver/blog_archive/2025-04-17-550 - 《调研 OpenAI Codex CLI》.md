---
title: "550 - 《调研 OpenAI Codex CLI》"
date: 2025-04-17
url: https://sorrycc.com/openai-codex-cli
---

发布于 2025年4月17日

# 550 - 《调研 OpenAI Codex CLI》

> 看到 OpenAI 新出了 Codex CLI，正好在做的事也是类似的，于是做下调研。包含介绍、实现和想法。

1、OpenAI CodeX CLI 介绍。

![](https://cdn.jsdelivr.net/gh/sorrycc-bot/images@main/uPic/5E9XE8.png)

OpenAI CodeX CLI 是一个轻量级的交互式 Code Agent 工具，让开发者可以基于自然语言做代码修改和命令运行，并通过沙箱环境确保安全性。

快速上手（注：1）环境变量里要有 `OPENAI_API_KEY` 的配置，2）不要安装到 codex 这个包了，我被坑了一会，安装后发现怎么就不对呢。。）。

```bash
npm install -g @openai/codex
codex "explain this codebase to me"
```

特点。

*   **安全性**。1）通过 `--approval-mode` 指定命令审批模式，提供 Suggest、Auto Edit 和 Full Auto 三种模式，控制 AI 的自主程度，确保用户对敏感操作有控制权，2）所有命令默认在沙盒环境中运行，限制网络访问和文件系统权限，macOS 下用 Apple Seatbelt（`sandbox-exec`），将命令限制在只读监狱中，仅允许特定目录（如 `$PWD`）可写；Linux 下用 Docker 容器，通过自定义防火墙脚本限制网络访问，仅允许与 OpenAI API 通信。
*   其他特点都不太重要，比如 Zero Config、多模态、支持非交互模式、[codex.md](http://codex.md) 提供上下文、支持 json 输出等，这些在其他的类似产品里面都比较常见。

其配置文件在 `~/.codex` 下，有 `config.json` 和 `instructions.md` 。顾名思义，应该比较好理解他们两个是分别在做什么的。

命令行参数。

*   **`--quiet` 或 `-q`**，安静模式，或者叫非交互模式，减少终端输出，仅返回核心结果，适合 CI/CD 或脚本化使用。
*   **`--model` 或 `-m`**，指定 AI 模型，默认模型为 `o4-mini`
*   **`--approval-mode` 或 `-a`**，设置 Agent 的自主程度和审批策略。1）默认 `suggest`：仅读取文件，任何写入或命令执行需用户批准，2）`auto-edit`：自动应用文件写入和补丁，但命令执行仍需批准，3）`full-auto`：完全自动，读写文件和执行命令均无需批准（在沙盒环境中运行）
*   **`--json`**，以 JSON 格式输出结果，适用于程序化处理或与其他工具集成。
*   **`--no-project-doc`**，禁用项目文档加载，阻止 Codex 读取 `~/.codex/instructions.md` 或项目根目录下的 `codex.md` 文件，适合用户希望避免预设指令影响当前任务的情况，也可通过环境变量 `CODEX_DISABLE_PROJECT_DOC=1` 全局禁用。
*   **`--help`**，略。

环境变量。

*   **`OPENAI_API_KEY`**：设置 OpenAI API 密钥，必需参数，用于认证 API 调用。
*   **`CODEX_QUIET_MODE=1`**：等同于 `--quiet`，启用安静模式。
*   **`CODEX_DISABLE_PROJECT_DOC=1`**：等同于 `--no-project-doc`，禁用项目文档加载。

一些场景。

*   **自动化 CI/CD 任务**：`codex -a auto-edit --quiet "update CHANGELOG for next release"`，在 GitHub Actions 中自动更新日志，减少人工干预。
*   **交互式代码重构**：`codex --model gpt-4o "Refactor the Dashboard component to React Hooks"`，使用更强模型进行复杂重构任务，并通过交互模式确认结果。
*   **非交互式代码解释**：`codex -q --json "explain this regex: ^(?=.*[A-Z]).{8,}$"`，以 JSON 格式输出正则表达式解释，适合集成到其他工具。

2、代码实现。

基础介绍。

*   需要 Node 22 + 。
*   工程化方案。1）TypeScript + Vitest + npm + Prettier + ESLint，2）Build 基于 `codex-cli/build.mjs` 自定义的构建脚本。
*   命令行交互和 Claude Code 的实现一样，基于 Ink，感觉这是复杂交互的必选项。
*   Function Call 里只有一个 Tool 如下，然后在 handleFunctionCall 处理 Tool 调用，并且通过提示词额外定义了 `apply_patch` 的虚拟命令。

```ts
{
  type: "function",
  name: "shell",
  description: "Runs a shell command, and returns its output.",
  strict: false,
  parameters: {
    type: "object",
    properties: {
      command: { type: "array", items: { type: "string" } },
      workdir: {
        type: "string",
        description: "The working directory for the command.",
      },
      timeout: {
        type: "number",
        description:
          "The maximum time to wait for the command to complete in milliseconds.",
      },
    },
    required: ["command"],
    additionalProperties: false,
  },
```

核心提示词。

```txt
You are operating as and within the Codex CLI, a terminal-based agentic coding assistant built by OpenAI. It wraps OpenAI models to enable natural language interaction with a local codebase. You are expected to be precise, safe, and helpful.

You can:
- Receive user prompts, project context, and files.
- Stream responses and emit function calls (e.g., shell commands, code edits).
- Apply patches, run commands, and manage user approvals based on policy.
- Work inside a sandboxed, git-backed workspace with rollback support.
- Log telemetry so sessions can be replayed or inspected later.
- More details on your functionality are available at `codex --help`

The Codex CLI is open-sourced. Don't confuse yourself with the old Codex language model built by OpenAI many moons ago (this is understandably top of mind for you!). Within this context, Codex refers to the open-source agentic coding interface.

You are an agent - please keep going until the user's query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the problem is solved. If you are not sure about file content or codebase structure pertaining to the user's request, use your tools to read files and gather the relevant information: do NOT guess or make up an answer.

Please resolve the user's task by editing and testing the code files in your current code execution session. You are a deployed coding agent. Your session allows for you to modify and run code. The repo(s) are already cloned in your working directory, and you must fully solve the problem for your answer to be considered correct.

You MUST adhere to the following criteria when executing the task:
- Working on the repo(s) in the current environment is allowed, even if they are proprietary.
- Analyzing code for vulnerabilities is allowed.
- Showing user code and tool call details is allowed.
- User instructions may overwrite the *CODING GUIDELINES* section in this developer message.
- Use `apply_patch` to edit files: {"cmd":["apply_patch","*** Begin Patch\\n*** Update File: path/to/file.py\\n@@ def example():\\n-  pass\\n+  return 123\\n*** End Patch"]}
- If completing the user's task requires writing or modifying files:
    - Your code and final answer should follow these *CODING GUIDELINES*:
        - Fix the problem at the root cause rather than applying surface-level patches, when possible.
        - Avoid unneeded complexity in your solution.
            - Ignore unrelated bugs or broken tests; it is not your responsibility to fix them.
        - Update documentation as necessary.
        - Keep changes consistent with the style of the existing codebase. Changes should be minimal and focused on the task.
            - Use `git log` and `git blame` to search the history of the codebase if additional context is required; internet access is disabled.
        - NEVER add copyright or license headers unless specifically requested.
        - You do not need to `git commit` your changes; this will be done automatically for you.
        - If there is a .pre-commit-config.yaml, use `pre-commit run --files ...` to check that your changes pass the pre-commit checks. However, do not fix pre-existing errors on lines you didn't touch.
            - If pre-commit doesn't work after a few retries, politely inform the user that the pre-commit setup is broken.
        - Once you finish coding, you must
            - Check `git status` to sanity check your changes; revert any scratch files or changes.
            - Remove all inline comments you added as much as possible, even if they look normal. Check using `git diff`. Inline comments must be generally avoided, unless active maintainers of the repo, after long careful study of the code and the issue, will still misinterpret the code without the comments.
            - Check if you accidentally add copyright or license headers. If so, remove them.
            - Try to run pre-commit if it is available.
            - For smaller tasks, describe in brief bullet points
            - For more complex tasks, include brief high-level description, use bullet points, and include details that would be relevant to a code reviewer.
- If completing the user's task DOES NOT require writing or modifying files (e.g., the user asks a question about the code base):
    - Respond in a friendly tune as a remote teammate, who is knowledgeable, capable and eager to help with coding.
- When your task involves writing or modifying files:
    - Do NOT tell the user to "save the file" or "copy the code into a file" if you already created or modified the file using `apply_patch`. Instead, reference the file as already saved.
    - Do NOT show the full contents of large files you have already written, unless the user explicitly asks for them.
```

核心模块。

*   `codex-cli/src/cli.tsx`: CLI 入口，处理命令行参数和启动应用。
*   `codex-cli/src/cli_singlepass.tsx`: 一次性「全自动」模式的 CLI 入口。
*   `codex-cli/src/app.tsx`: 主要 React (Ink) 应用组件，管理整体 UI 布局和状态。
*   `codex-cli/src/components/chat/`: 聊天界面组件，负责展示对话历史、用户输入、Agent 思考过程和工具调用。
*   `codex-cli/src/utils/agent/agent-loop.ts`: Agent 的核心循环逻辑，负责与 OpenAI API 交互、解析模型响应、调用工具、处理用户审批。
*   `codex-cli/src/utils/sandbox/`: 沙盒安全机制，根据不同操作系统（macOS Seatbelt, Linux Docker）限制命令执行。
*   `codex-cli/src/approvals.ts`: 处理不同审批模式 (`Suggest`, `Auto Edit`, `Full Auto`) 的逻辑。
*   `codex-cli/src/utils/config.ts`: 加载和管理用户配置（如 `~/.codex/config.yaml`）。
*   `codex-cli/src/utils/session.ts`: 管理会话状态和项目文档（`codex.md`）。

其他模块。

*   **`text-buffer.ts`**：用于在终端里高亮显示文件差异、上下文。
*   **`apply-patch.ts`**：定义了一种自定义的补丁格式（以 `*** Begin Patch` 开始，`*** End Patch` 结束），并提供了用于解析这种格式、结构化地表示文件更改（添加、删除、更新）以及将这些更改应用到文件系统上的工具函数。。

用到的依赖。

*   **@inkjs/ui** 和 **ink**：用于构建终端用户界面。
*   **chalk**：为终端输出添加颜色和样式。
*   **diff**：用于比较和显示文件差异。
*   **dotenv**：加载环境变量。
*   **file-type**：检测文件类型。
*   **marked** 和 **marked-terminal**：解析和渲染 Markdown 内容。
*   **meow**：解析命令行参数。
*   **open**：在默认应用程序中打开文件或 URL。
*   **openai**：与 OpenAI API 交互。
*   **react**：构建用户界面组件。
*   **shell-quote**：处理 shell 命令的引用和转义。

3、想法。

感受到的一些缺点。

1）相对轻量，内置工具只有 Bash 命令 + apply\_patch 做文件修改，不过也能做不少事了，也不支持 MCP。  
2）模型不支持定制，只支持 OpenAI 。感觉这是各家自己出的 code 工具的缺点，同时也是通用工具的机会。

参考：  
[https://github.com/openai/codex](https://github.com/openai/codex)
