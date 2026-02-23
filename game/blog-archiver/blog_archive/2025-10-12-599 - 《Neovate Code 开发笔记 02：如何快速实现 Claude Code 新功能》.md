---
title: "599 - 《Neovate Code 开发笔记 02：如何快速实现 Claude Code 新功能》"
date: 2025-10-12
url: https://sorrycc.com/neovate-code-02-learn-claude-code-features
---

发布于 2025年10月12日

# 599 - 《Neovate Code 开发笔记 02：如何快速实现 Claude Code 新功能》

思路是：给关键词，让 Claude Code 用搜索的方法分析 Claude Code 实现，再用 Claude Code 实现。

1、先下载 `@anthropic-ai/claude-code` 最新版并用 prettier 格式化 cli.js 文件。

我写了个 script 帮我干这活，每次执行下 `pnpm fetch_latest` 就好。

```bash
pnpm fetch_latest
$ node scripts/fetch_latest.js
Fetching latest version of @anthropic-ai/claude-code...
Target version: 2.0.14
Creating directory: versions/2.0.14
Downloading @anthropic-ai/claude-code@2.0.14...
Extracting to versions/2.0.14...
✅ Successfully downloaded @anthropic-ai/claude-code v2.0.14 to versions/2.0.14
Running prettier on cli.js...
✅ Successfully formatted cli.js with prettier

Contents of versions/2.0.14:
  📄 LICENSE.md
  📄 README.md
  📄 cli.js
  📄 package.json
  📄 sdk-tools.d.ts
  📄 sdk.d.ts
  📄 sdk.mjs
  📁 vendor
  📄 yoga.wasm
```

2、用 claude code 分析现有实现。

以昨天加的「ctrl -g 唤起编辑器编辑 prompt」功能为例，PR 见 [https://github.com/neovateai/neovate-code/pull/307](https://github.com/neovateai/neovate-code/pull/307) 。

这个功能的关键词是「ctrl-g」，我先手动去源码里搜了下，果然有。

```ts
Y9.createElement($,{ dimColor: !0 },"ctrl-g to edit prompt in"," ",...
```

然后要求 Claude Code 分析代码，prompt 如下。（注：cli.js 14M+，全部丢给大模型是不行的，现在还没那么大 context 的模型。所以让 ai 用人的思路，基于关键词去搜索，然后对相关的代码去找对应的函数定义等，最终汇集在一起，就是一套完整的实现了。）

```
search 'ctrl-g' in @versions/2.0.13/cli.js and tell me the detailed implementation. ultrathink
```

他给的结果如下，看了下基本没啥问题。

![](https://pic.sorrycc.com/proxy/1760198190984-639122249.png)

3、实现到 Neovate 。

```
[前面的分析结果]

add ctrl-g feature to @ChatInput.tsx
extract "Main External Editor Function" to file under src/utils
extract react hooks if need
no tengu bacon/telemetry
```

然后，一遍过。

![](https://pic.sorrycc.com/proxy/1760198534811-443214381.jpg)
