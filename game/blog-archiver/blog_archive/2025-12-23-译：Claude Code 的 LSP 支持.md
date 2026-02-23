---
title: "译：Claude Code 的 LSP 支持"
date: 2025-12-23
url: https://sorrycc.com/claude-code-lsp-support
---

发布于 2025年12月23日

# 译：Claude Code 的 LSP 支持

> 原文： [https://azukiazusa.dev/blog/claude-code-lsp-support](https://azukiazusa.dev/blog/claude-code-lsp-support)  
> 作者： azukiazusa1  
> 译者： Gemini 3 Pro High

Claude Code 从版本 2.0.74 开始增加了 LSP（语言服务器协议）支持。通过 LSP 支持，Claude Code 可以对代码库执行符号定义查找、引用查找、获取悬停信息等操作。本文将介绍 Claude Code 的 LSP 支持概要及使用方法。

## 目录

1.  [启用 LSP 功能](#lsp-%E6%A9%9F%E8%83%BD%E3%82%92%E6%9C%89%E5%8A%B9%E5%8C%96%E3%81%99%E3%82%8B)
2.  [使用自定义 LSP 服务器](#%E8%87%AA%E4%BD%9C%E3%81%AE-lsp-%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC%E3%82%92%E4%BD%BF%E7%94%A8%E3%81%99%E3%82%8B)
3.  [总结](#%E3%81%BE%E3%81%A8%E3%82%81)
4.  [参考](#%E5%8F%82%E8%80%83)

编码代理通过掌握 LSP（语言服务器协议），可以更高效地执行任务。与通过字符串搜索整个代码库不同，通过 LSP 可以访问代码结构和符号信息，从而能够迅速获取和编辑准确信息，大幅节省 Token 和时间。对于尝试过为编码代理提供语义代码搜索和编辑工具 [Serena](https://github.com/oraios/serena) 的人来说，这尤其容易理解。

Claude Code 从 v2.0.74 开始增加了 LSP 支持。LSP 支持作为 Claude Code [插件功能](https://code.claude.com/docs/en/plugins-reference)的一部分提供。启用 LSP 功能后，Claude Code 可以对代码库执行以下操作：

*   goToDefinition: 查找符号定义的位置
*   findReferences: 查找符号的所有引用
*   hover: 获取符号的悬停信息（文档、类型信息）
*   documentSymbol: 获取文档内的所有符号（函数、类、变量）
*   workspaceSymbol: 在整个工作区搜索符号
*   goToImplementation: 查找接口或抽象方法的实现
*   prepareCallHierarchy: 获取指定位置的调用层次结构项（函数/方法）
*   incomingCalls: 查找调用指定位置函数的所有函数/方法
*   outgoingCalls: 查找指定位置函数调用的所有函数/方法

本文将介绍 Claude Code 的 LSP 支持概要及使用方法。

## 启用 LSP 功能

要启用 LSP 功能，请启动 Claude Code 并运行 `/plugin` 命令，以交互方式启用插件。要安装插件，需要添加提供目标插件的市场。LSP 插件在 Claude Code 官方市场（claude-plugins-official）中提供。官方市场通常无需任何设置即可默认使用。请在“Marketplaces”选项卡中确认官方市场已启用。

![](https://images.ctfassets.net/in6v9lxmm5c8/joIMAKUY95x8O8MStRcpx/0088c1c7da3694f6267715ea9d2c177c/%C3%A3__%C3%A3__%C3%A3_%C2%AA%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3___2025-12-20_15.30.05.png?q=50&fm=webp)

接下来移动到“Discover”选项卡，将显示可用插件列表。在搜索框中输入“LSP”进行搜索，LSP 插件列表将按语言显示。可用语言如下：

*   C/C++
*   C#
*   Go
*   Java
*   Lua
*   PHP
*   Python
*   Rust
*   Swift

使用 `Space` 键选择要使用的语言的 LSP 插件，然后按 `i` 键开始安装。

![](https://images.ctfassets.net/in6v9lxmm5c8/3Y8PminQyLfSYTjqgk9aaz/f1efc19d89f4b040856098e20b40db33/%C3%A3__%C3%A3__%C3%A3_%C2%AA%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3___2025-12-20_15.40.55.png?q=50&fm=webp)

已安装的插件可以在“Installed”选项卡中确认。

![](https://images.ctfassets.net/in6v9lxmm5c8/37C174Atrm8Gpb6HmIDHDk/406a12aa3d0b91e81b1154129d4f45d4/%C3%A3__%C3%A3__%C3%A3_%C2%AA%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3___2025-12-20_15.44.33.png?q=50&fm=webp)

此外，还需要安装对应 LSP 插件语言的 LSP 服务器。例如，如果想使用 TypeScript 的 LSP 功能，请安装 [typescript-language-server](https://www.npmjs.com/package/typescript-language-server)。

```
npm install -g typescript-language-server typescript
```

实际上，我尝试启用了 TypeScript LSP 插件并在 TypeScript 代码库中进行了测试，但目前似乎无法正常工作。LSP 服务器插件似乎需要一个名为 .lsp.json 的配置文件，但目前似乎只提供了 [README.md](http://README.md)。让我们期待未来的更新。

## 使用自定义 LSP 服务器

如果想使用 Claude Code 官方市场不支持的语言的 LSP 服务器，可以创建自定义插件来提供 LSP 插件。要创建插件，请创建一个新目录，并创建一个 `/.claude-plugin` 子目录。

```
mkdir -p my-lsp-plugin/.claude-plugin
```

创建 `.claude-plugin/plugin.json` 文件，并按如下方式编写：

```
{
  "name": "my-typescript-lsp-plugin",
  "description": "TypeScript/JavaScript language server for Claude Code, providing code intelligence features like go-to-definition, find references, and error checking.",
  "version": "1.0.0",
  "author": {
    "name": "Your Name"
  }
}
```

为了向插件添加 LSP 支持，请在插件目录的根目录下创建 `.lsp.json` 文件，并按如下方式编写。这是一个使用 TypeScript LSP 服务器的示例。

```
{
  "typescript": {
    "command": "typescript-language-server",
    "args": ["--stdio"],
    "extensionToLanguage": {
      ".ts": "typescript",
      ".tsx": "typescript"
    }
  }
}
```

要测试创建的插件，请使用 `--plugin-dir` 选项启动 Claude Code。

```
claude --plugin-dir ./my-lsp-plugin
```

运行 `/plugin` 命令以确认插件已被正确识别。通过 `--plugin-dir` 指定的插件将被识别为 `inline` 市场。

![](https://images.ctfassets.net/in6v9lxmm5c8/2k4vfRliDsTB2iXe7sHh3K/7a50a30fe5b0ef06599d2212463cbb6a/%C3%A3__%C3%A3__%C3%A3_%C2%AA%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3___2025-12-20_16.35.44.png?q=50&fm=webp)

在 v2.0.74 中，由于存在插件和 LSP 服务器冲突的问题，似乎无法正常工作。 [https://github.com/anthropics/claude-code/issues/13952](https://github.com/anthropics/claude-code/issues/13952)

为了避开上述问题并测试 LSP 功能，可以将 Claude Code 版本降级到 v2.0.67，并将环境变量 `ENABLE_LSP_TOOL` 设置为 `true` 启动。

```
ENABLE_LSP_TOOL=true npx @anthropic-ai/claude-code@2.0.67 --plugin-dir ./my-lsp-plugin
```

当 Claude Code 使用 LSP 功能时，会使用 `LSP(…)` 工具。这里为了重命名 `<Button>` 组件，使用 `findReferences` 命令来搜索定义 `Button` 符号的位置。

![](https://images.ctfassets.net/in6v9lxmm5c8/6xQK0x5qLCcHQkPy0QGJwk/645f6b52baf932fcdac90ee8e5b9f7c8/%C3%A3__%C3%A3__%C3%A3_%C2%AA%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3__%C3%A3___2025-12-20_17.12.41.png?q=50&fm=webp)

## 总结

*   Claude Code 从 v2.0.74 开始增加了 LSP 支持
*   要启用 LSP 功能，请从官方市场安装对应语言的 LSP 插件
*   要使用自定义 LSP 服务器，请创建插件并添加 `.lsp.json` 文件
*   LSP 功能在 v2.0.74 中存在与插件冲突的问题，可以通过使用 v2.0.67 并将环境变量 `ENABLE_LSP_TOOL` 设置为 `true` 启动来规避

## 参考

*   [Plugins reference - LSP servers](https://code.claude.com/docs/en/plugins-reference#lsp-servers)
*   [Create plugins - Claude Code Docs](https://code.claude.com/docs/en/plugins)
*   [claude-code/CHANGELOG.md at main · anthropics/claude-code](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
*   [\[BUG\] LSP servers not loading due to race condition between LSP Manager initialization and plugin loading · Issue #13952 · anthropics/claude-code](https://github.com/anthropics/claude-code/issues/13952)
