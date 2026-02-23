---
title: "577 - 《“学习” Claude VSCode Extension》"
date: 2025-07-09
url: https://sorrycc.com/learn-claude-vscode-extension
---

发布于 2025年7月9日

# 577 - 《“学习” Claude VSCode Extension》

1、背景是准备把 [Claude Code for VSCode](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) 的功能学习到 Takumi 里，这样用户在 VSCode/Cursor 里打开 Takumi 时，就可以让 Cli 和 VSCode Extension 进行通讯，使用 Editor 的能力来增强 Takumi 的能力，比如获取打开的文件、获取选中的行列、获取诊断信息等。

2、首先，下载和解压 extension 也可以用 AI 。

```
download https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code extension to ./ and then extract
```

这时会得到压缩后的一个 extension.js 文件，目测是用 `bun build --min` 产出的。

3、然后我尝试了不少方法尝试解析。

1）[prettier playground](https://prettier.io/playground/) 把文件复制进去手动 prettier 。然后通过观察 prettier 之后的文件，手动检查逻辑。

2）由于 extension.js 文件尺寸较大，199KB，直接让 ai 读取，Claude Sonnet 模型是不够的，但 Gemini 2.5 Pro 够。所以我尝试让 ai 把文件做拆解，prompt 如下。我尝试了 Cursor + Gemini 2.5 Pro、Takumi + Gemini 2.5 Pro、Claude Code，效果都不太理想，能拆解一些文件出来，但感觉是少模块和功能的。

```
帮我把这个文件合理的拆分到 ./extension-splitted 目录下。
```

3）直接让 Claude Code 分析压缩后的代码，效果比前一步要好，他会美化代码、分析模块、创建变量映射、提取模块（有了前面几步所以更准确）、生成报告。

4）直接把代码贴给 Gemini 2.5 Pro，让其「详细解释这些代码的逻辑」「请产出一份详细的功能报告，以 markdown 的格式」。

3、重新实现 Claude VSCode Extension 。

1）初始化，我也是问的 Gemini 2.5 Pro 。

```
怎么初始化一个 vscode extension ? 
```

他让我用 yo 和 generator-code。

```
npm install -g yo generator-code
yo code
```

2）然后我接着基于代码问 Gemini 2.5 Pro 。

```
我需要实现一个 vscode 插件，包含其中的部分功能。包括，

1、启动 websocket server 和 client 交互
2、注入环境变量 CLAUDE_CODE_SSE_PORT 方便 client 发现服务器的端口
3、websocket server 需要提供 openDiff、openFile、getDiagnostics、getOpenEditors、getWorkspaceFolders、getCurrentSelection、getLatestSelection、close_tab、closeAllDiffTabs 功能

请给出完整的代码，要求简洁。 
```

然后拿着产出的代码文档保存为 [spec.md](http://spec.md)，去要求 claude code 实现。

```
参考 @spec.md 在 src 中实现
```

```
update CLAUDE_CODE_SSE_PORT to TAKUMI_SSE_PORT
```

```
add test.js script for test, to connect to the server and print the open tabs
```

```
how to release this vscode extension to market
```

目前进行到这一步，但基本已能用了，后续慢慢补充功能即可。
