---
title: Poltergeist：让您的构建保持新鲜的幽灵
date: 2025-01-05
tags: [AI, Tooling, Build, Translation]
original_url: https://steipete.me/posts/2025/poltergeist-ghost-keeps-builds-fresh
---

# Poltergeist：让您的构建保持新鲜的幽灵

[在 GitHub 上编辑](https://github.com/steipete/steipete.me/edit/main/src/content/blog/2025/poltergeist-ghost-keeps-builds-fresh.md)

**简述：** [Poltergeist](http://polter.build) 是一个对 AI 友好的通用文件监视器，它可以自动检测任何项目，并在文件发生更改时立即重新构建。它是原生应用程序的 `npm run dev`，具有自动配置、通知和智能构建队列功能。

```bash
npm run dev
```

## 故事背景

在 Agentic 工程（Agentic Engineering）中，循环迭代速度就是一切。在构建 [Peekaboo](https://peekaboo.boo)（一个用 Swift 编写的 macOS 自动化代理/CLI/MCP）时，我主要的痛点是构建时间。Swift 并不以编译器速度快而闻名，一旦你开始做更多的 Web 开发，这一点尤其明显。在 Swift 计算依赖关系的时间里，我的 TypeScript 项目早就重新编译完成了。

更糟糕的是，Agent 有时会在测试前忘记重建，导致在已经修复的代码上进行调试。

Poltergeist 解决了这个问题。一旦文件发生更改，它就会在后台构建，从而加快代理和人类的代码/调试循环。

所以我写了一个快速的 bash 脚本来监视 Swift 文件并在后台自动重建。问题解决了——对于 Swift 来说。但随后我意识到这对任何类型的项目都非常有用。我已经让 CLI 和 Mac 应用程序都自动构建了，我想这也可以适用于许多其他用例。

就在那时，我决定把它做成一个像样的东西——并进入了另一个兔子洞：为我的 Agent 构建工具，以便我可以更快地为我的 Agent 构建工具。

## 通用解决方案

我用 TypeScript 重写了整个系统，目标只有一个：让它适用于任何项目、任何语言、任何构建系统。[Poltergeist](https://github.com/steipete/poltergeist) 成为了一个“缠着”你项目的通用文件监视器。

虽然有像 watchexec 这样的工具，但我没有找到任何考虑到 Agentic 工程流程的设计。Poltergeist 甚至会[检测是人类还是 Agent 调用它](https://github.com/steipete/poltergeist/blob/85d8edfdd48ae4c6b30813264ce453d1df78ee83/src/cli.ts#L389)，并添加有用的消息来引导 Agent 正确使用，即使没有污染你的 `AGENTS.md` 文件。

```bash
watchexec
```

一切都在无形中发生。保存文件。当你准备好测试时，新鲜的二进制文件已经在等待了。对于 Mac 应用程序，它甚至会自动退出并重新启动（是的，我听到了，这是一个配置设置）。真正的热重载虽然好，但那是未来的事情。

## 通灵（Channeling the Spirit）

我完全用 Claude Code 构建了 Poltergeist。它是一个构建工具，一开始我并不打算把它做成一个产品，直到我看到它有多有用，我才决定花额外的时间专注于它，让它成为一个独立的东西。它最初是一堆 bash 脚本，最终我让我的 Agent 将这些转换为 TypeScript，然后不断迭代。

像“全自动生成的代码”这样的句子在某种程度上不再有意义，因为我肯定已经写了（或者更确切地说：说了）20 页的提示词来完善设计。有了 AI，英语就是新的编程语言，而它是 TypeScript 这一点更多是一个实现细节。

为什么是 TypeScript？Agent 非常擅长编写它，迭代流程非常快，编译是即时的，它是跨平台的，而且 Watchman 有针对它的 TypeScript 绑定。

## 与 Agent 共舞

你已经注意到了——我喜欢构建开发者工具和让我的生活更轻松的东西。Poltergeist 似乎是一个非常明显的想法，我很惊讶它居然还不存在。

我通常在新项目中使用[基于 spec.md 的方法](https://steipete.me/posts/2025/understanding-codebases-with-ai-gemini-workflow)，然而这个项目是从一些 bash 脚本演变为一个成熟的开发工具的，所以没有规范，只有大量的提示词和迭代。

构建它感觉太容易了。Agent 非常擅长编写 TypeScript 和 Go，所以 Claude 一次性通过了我大部分的提示词。我使用 [WisprFlow](https://wisprflow.ai)，我的提示词通常是很长的漫谈。我学到，多说话并给出你想要的东西的理由，真的有助于 Agent 理解并构建正确的东西。

流程在大多数情况下是：长提示词 + `plan only ultrathink`。有时也是：给我几个选项——尤其是当我不确定该做什么的时候。

我不使用 Claude 的计划模式，简单地说“plan only”同样有效，而且更适合我的流程（[别让我开始谈论子 Agent](https://x.com/steipete/status/1952763998266372231)）。我经常在一个计划上迭代多次，然后才输入“y”来构建它。

完成后，我通常会写“add tests + update docs”——按功能添加测试比试图在最后添加它们要好得多，而且如果你在上下文中有功能实现，编写测试几乎总是会发现实现中的错误，而且由于 Agent 拥有所有上下文，这是修复它的最佳时机。如果我一次性提示所有内容，它们通常还是会停下来，而且似乎不太专注——因此要显式分离。

我很早就添加了 [GitHub CI](https://github.com/steipete/poltergeist/actions/runs/16762891298)（再次，只需询问 cc），这是另一层测试，这样我可以确保项目在所有操作系统上都能工作，而不仅仅是在我的 Mac 上。

在写这篇博客文章时，我问了 Claude 对我的语言选择的看法，[它没有给我我预期的答案](https://x.com/steipete/status/1952748261472641170)。所以——你已经猜到了——我做了显而易见的事情，让它循环几个小时用 Go 重写它。

## 从 Poltergeist 到 Poltergohst

将你的项目移植到不同的语言在几个月前还是疯狂的，现在我只需使用 Agent 并让它们循环运行直到完成。我把这看作是一个再次尝试开放模型和替代 CLI 的实验，[并在推特上发了关于它的内容](https://x.com/steipete/status/1952748261472641170)——目前 Qwen 3 Coder 和 GLM 4.5 与 OpenCode 和 Crush 周围仍有太多的 bug，所以我不能推荐其中任何一个。

它们都有潜力，但还没有经过开放模型的良好测试，你最终会遇到 API 错误和减速。这很不幸，因为 Qwen 3 Coder 的 100 万上下文窗口本来可以完美地一次性吸收整个项目并进行转换。

我在 Claude Code 上的流程是转换所有重要文件（源代码、测试，不包括示例）到一个大的 1.1MB markdown 文件，然后复制/粘贴完整的文本并命令“convert to Go”。这样你就可以绕过 256KB 的限制，该限制会导致 Claude 只能部分且缓慢地读取文件。

有很多网站可以进行 GitHub 转换，[这也是我更喜欢的一个](https://repo2txt.simplebasedomain.com)，因为它可以轻松选择文件类型并且快速+简单。

我在转换中没有使用任何 todo 结构，只是简单地推动 Claude 几次以此继续——模型往往最终会停止（在约 30-60 分钟的循环后），尽管不需要复杂的提示词。

虽然我主要用 Claude Sonnet 构建了 Poltergeist，但我用 [Opus 4.1](https://www.anthropic.com/news/claude-opus-4-1) 完成了转换，以庆祝它的发布。为了提高代码质量，我搜索了[一份地道、现代的 Go 指南](https://gist.github.com/ashokallu/47a70a70c7f6857ff29e1cd3cb97bbd3)并据此进行了一些重构。

最终我决定不使用 Go，因为我对此不是很舒服，而且有了 [Bun 的 SPA 模式](https://x.com/jarredsumner/status/1952827266440019986)，启动时间约为 44ms，并且非常适合作为 Homebrew 上的单个二进制文件（约 20 MB 压缩后）分发。

还有一个我最初没有看到的生态系统论点。Poltergeist 底层使用 Watchman，它有极好的 TypeScript 绑定，但没有官方的 Go 绑定，导致需要维护更多的代码。[唯一存在的 Go 绑定项目](https://github.com/sjansen/watchman)已经多年没有维护了。

我保留了这个实验在 GitHub 上——[查看 poltergohst](https://github.com/steipete/poltergohst)。

## 降神会时间（Seance Time）

如果你使用的是现代 Mac，请选择 homebrew，否则请选择 npm。npm 版本需要 [Watchman](https://facebook.github.io/watchman/docs/install.html) 和 [Node](https://nodejs.org/en/download)。

```bash
# 适用于现代 macOS
brew tap steipete/tap
brew install poltergeist

# Windows, Linux, Intel Mac (Node 20+)
npm install -g @steipete/poltergeist

# 自动检测并配置你的项目
poltergeist init

# 就这样！(`start` 也可以，得让 Agent 开心！)
poltergeist haunt

# 运行你的工具（总是新鲜的！）
polter my-cli --help
```

哦，在我忘记之前——还有一个原生 macOS 菜单栏应用程序！它还需要一些工作，所以我还没有发布它，但你完全[可以获取源代码](https://github.com/steipete/poltergeist/tree/main/apps/mac)并试玩一下。有了它，你将始终看到 Poltergeist 是否正在编译，以及你的构建是红色还是绿色的。也许就叫它捉鬼敢死队（Ghostbuster）吧。

### 捉住幽灵（Catch the Ghost）

Poltergeist 是一种以人类和 Agent 为中心构建的新型工具——我们肯定会在未来看到更多这样的工具。你安装一次，然后就可以忘掉它，因为它会淡入背景，你的 Agent 会自动使用它，你可以使用它或继续用手动方式做事。它是完美的无形补充——你看不到它，但它就在那里，帮助你更快地获得结果。

最好的工具在你需要它们之前是无形的，一旦拥有了它们，就变得不可或缺。[Poltergeist](http://polter.build) 两者兼备——而且只需一个 `init`。

```bash
init
```
