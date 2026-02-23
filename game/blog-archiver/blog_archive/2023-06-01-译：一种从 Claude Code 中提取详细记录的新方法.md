---
title: "译：一种从 Claude Code 中提取详细记录的新方法"
date: 2023-06-01
url: https://sorrycc.com/claude-code-transcripts
---

发布于 2025年12月29日

# 译：一种从 Claude Code 中提取详细记录的新方法

> 原文： [https://simonwillison.net/2025/Dec/25/claude-code-transcripts/](https://simonwillison.net/2025/Dec/25/claude-code-transcripts/)  
> 作者： Simon Willison  
> 译者： Claude

2025年12月25日

我发布了 [claude-code-transcripts](https://github.com/simonw/claude-code-transcripts)，这是一个新的 Python CLI 工具，可以将 [Claude Code](https://claude.ai/code) 的对话记录转换为详细的 HTML 页面，比 Claude Code 本身提供更好的界面来了解 Claude Code 做了什么。生成的记录也可以通过任何静态 HTML 托管甚至通过 GitHub Gists 进行分享。

如果你已经安装了 [uv](https://docs.astral.sh/uv/)，无需额外安装即可快速开始：

```
uvx claude-code-transcripts
```

（或者你也可以先运行 `uv tool install claude-code-transcripts` 或 `pip install claude-code-transcripts`。）

这将显示你本地的 Claude Code 会话列表。按上下键选择一个，然后按 `<enter>`。该工具将创建一个新文件夹，其中包含一个显示记录摘要的 `index.html` 文件，以及一个或多个包含完整细节的 `page_x.html` 文件。

访问[这个示例页面](https://static.simonwillison.net/static/2025/claude-code-microjs/index.html)查看使用此工具生成的一个长篇（12页）记录。

![Screenshot of a claude code transcript spanning 12 pages - the first page shows a summary starting with the first user prompt to clone bellard/quickjs to /tmp](https://static.simonwillison.net/static/2025/claude-code-transcripts-example.jpg)

如果你安装并认证了 [gh CLI 工具](https://cli.github.com/)，可以添加 `--gist` 选项——你选择的记录将自动分享到一个新的 Gist，并提供一个 `gistpreview.github.io` 的链接来查看。

`claude-code-transcripts` 也可以从网页版 Claude Code 获取会话。我逆向工程了私有 API（所以希望它能继续工作），目前你可以运行：

```
uvx claude-code-transcripts web --gist
```

然后选择一个网页版 Claude Code 会话，它会被转换为 HTML 并作为 Gist 发布。

[claude-code-transcripts README](https://github.com/simonw/claude-code-transcripts/blob/main/README.md) 有该工具提供的其他选项的完整详情。

#### 我为什么构建这个 [#](https://simonwillison.net/2025/Dec/25/claude-code-transcripts/#why-i-built-this)

如今，我通过 Claude Code 编写的代码比我自己在文本编辑器中输入的要多得多。多亏了 Anthropic 的 Claude iPhone 应用中的 Claude Code 界面，我实际上在_手机上_完成的编码工作比在笔记本电脑上还多。

能够在散步时有一个想法，然后通过手机上的几个提示将其变成可工作的、经过测试和文档化的代码，这真是一种科幻般的工作方式。我非常享受。

但有一个问题：我实际做的_工作_现在越来越多地由这些 Claude 对话来代表。这些记录捕获了关于我项目的极其重要的上下文：我要求了什么，Claude 建议了什么，我做了什么决定，以及 Claude 在实现功能时为其决定所做的解释。

我非常重视这些记录！它们帮助我弄清楚哪些提示策略有效，并且提供了构建功能所做决策的宝贵记录。

在 LLM 时代之前，我依靠 issues 和 issue 评论来记录所有这些额外的项目上下文，但现在这些对话发生在 Claude Code 界面中。

我过去曾多次尝试解决这个问题。第一次是将 Claude Code 终端会话粘贴到可分享的格式中——我[为此构建了一个自定义工具](https://simonwillison.net/2025/Oct/23/claude-code-for-web-video/)（叫做 [terminal-to-html](https://tools.simonwillison.net/terminal-to-html/)），我经常使用它，但它遗漏了很多细节——包括 Claude Code 在处理任务时生成的默认不可见的思考痕迹。

我还构建了 [claude-code-timeline](https://tools.simonwillison.net/colophon#claude-code-timeline.html) 和 [codex-timeline](https://tools.simonwillison.net/colophon#codex-timeline.html) 作为 Claude Code 和 Codex 的 JSON 记录的 HTML 工具查看器。它们工作得很好，但仍然不如我希望的那样对人友好。

一个更大的问题是网页版 Claude Code——Anthropic 的异步编码代理，这是我一直在手机上使用的东西。从中获取记录更加困难！我一直在将它们同步到我的笔记本电脑上，这样我就可以从终端复制和粘贴，但这是一个相当不优雅的解决方案。

#### 我如何构建 claude-code-transcripts [#](https://simonwillison.net/2025/Dec/25/claude-code-transcripts/#how-i-built-claude-code-transcripts)

你不会惊讶地听到，这个新工具的每一寸都是用 Claude 构建的。

你可以浏览[提交日志](https://github.com/simonw/claude-code-transcripts/commits/main/)来找到每个提交的记录链接，其中许多是使用该工具本身发布的。

以下是一些最近的例子：

*   [c80b1dee](https://github.com/simonw/claude-code-transcripts/commit/c80b1dee9429637318f4fae3e5d733ae5c05ab2c) Rename tool from claude-code-publish to claude-code-transcripts—[transcript](https://gistpreview.github.io/?814530b3a70af8408f3bb8ca10f70d57/index.html)
*   [ad3e9a05](https://github.com/simonw/claude-code-transcripts/commit/ad3e9a05058c583bf7327421f727ba08c15aa8a0) Update README for latest changes—[transcript](https://gistpreview.github.io/?9b3fe747343d32c95a8565ef1f8b6e11/index.html)
*   [e1013c54](https://github.com/simonw/claude-code-transcripts/commit/e1013c54a601e79e62a9bf204c5a94acc8845c5f) Add autouse fixture to mock webbrowser.open in tests—[transcript](https://gistpreview.github.io/?1671b49de273d80280ab2ceab690db8c/index.html)
*   [77512e5d](https://github.com/simonw/claude-code-transcripts/commit/77512e5d6905ee8ba678af0e30bcee2dccb549f3) Add Jinja2 templates for HTML generation (#2)—[transcript](https://gistpreview.github.io/?ffc01d1c04e47ed7934a58ae04a066d1/index.html)
*   [b3e038ad](https://github.com/simonw/claude-code-transcripts/commit/b3e038adeac56e81d7c7558f0a7d39a8d44d9534) Add version flag to CLI (#1)—[transcript](https://gistpreview.github.io/?7bdf1535f7bf897fb475be6ff5da2e1c/index.html)

我让 Claude 使用以下依赖项：

*   [click](https://pypi.org/project/click/) 和 [click-default-group](https://pypi.org/project/click-default-group/) 用于构建 CLI
*   [Jinja2](https://pypi.org/project/Jinja2/) 用于 HTML 模板——这是后期重构的，初始系统使用 Python 字符串拼接
*   [httpx](https://pypi.org/project/httpx/) 用于发起 HTTP 请求
*   [markdown](https://pypi.org/project/Markdown/) 用于将 Markdown 转换为 HTML
*   [questionary](https://pypi.org/project/questionary/)——对我来说是新的，由 Claude 建议——用于实现交互式列表选择 UI

开发依赖项：

*   [pytest](https://pypi.org/project/pytest/)——必备
*   [pytest-httpx](https://pypi.org/project/pytest-httpx/) 用于在测试中模拟 HTTP 请求
*   [syrupy](https://pypi.org/project/syrupy/) 用于快照测试——对于像这样生成复杂 HTML 的工具，快照测试是保持测试健壮和简单的好方法。这是[那些快照的集合](https://github.com/simonw/claude-code-transcripts/tree/main/tests/__snapshots__/test_generate_html)。

唯一没有用 Claude Code 完成的部分是逆向工程 Claude Code 本身，以弄清楚如何从网页版 Claude Code 获取会话 JSON。

我知道 Claude Code 可以逆向工程自己，但让 OpenAI Codex CLI 来做感觉更有颠覆性。[这是那个记录](https://gistpreview.github.io/?e4159193cd2468060d91289b5ccdece3)——我让 Codex 使用 `npx prettier` 来美化打印混淆的 Claude Code JavaScript，然后让它挖掘 API 和认证细节。

Codex 想出了这个_漂亮的_ `curl` 命令：

```
curl -sS -f \
    -H "Authorization: Bearer $(security find-generic-password -a "$USER" -w -s "Claude Code-credentials" | jq-r .claudeAiOauth.accessToken)"  \
    -H "anthropic-version: 2023-06-01" \
    -H "Content-Type: application/json" \
    -H "x-organization-uuid: $(jq -r '.oauthAccount.organizationUuid' ~/.claude.json)" \
    "https://api.anthropic.com/v1/sessions"
```

这里真正巧妙的技巧是它使用 `security find-generic-password` 命令从 macOS 钥匙串中提取 Claude Code 的 OAuth 令牌的方式。我最终在 `claude-code-transcripts` 本身中使用了这个技巧！

发布于 [2025年12月25日](https://simonwillison.net/2025/Dec/25/) 晚上 11:52 · 在 [Mastodon](https://fedi.simonwillison.net/%40simon)、[Bluesky](https://bsky.app/profile/simonwillison.net)、[Twitter](https://twitter.com/simonw) 关注我或[订阅我的通讯](https://simonwillison.net/about/#subscribe)
