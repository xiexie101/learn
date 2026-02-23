---
title: "译：使用 GitHub Actions 发布简单的客户端 JavaScript 包到 npm"
date: 2024-12-26
url: https://sorrycc.com/npm-publish-github-actions
---

发布于 2024年12月26日

# 译：使用 GitHub Actions 发布简单的客户端 JavaScript 包到 npm

> 原文：[https://til.simonwillison.net/npm/npm-publish-github-actions](https://til.simonwillison.net/npm/npm-publish-github-actions)  
> 作者：Simon Willison  
> 译者：ChatGPT 4 Turbo

**编者注：本文详细介绍了如何将单文件 JavaScript 包发布到 NPM 的完整流程。主要内容包括：1) 创建一个简单的客户端 JavaScript 包，只需要 package.json 和 index.js 两个核心文件，无需构建步骤和依赖; 2) 配置 package.json 的关键字段，包括 name、version、main 等; 3) 使用 GitHub Actions 自动化发布流程，通过设置 NPM\_TOKEN 和编写工作流配置文件，实现在创建 GitHub Release 时自动发布到 NPM。这是一个非常实用的教程，特别适合想要发布简单 JavaScript 库的开发者。**

这是我为 [Prompts.js](https://simonwillison.net/2024/Dec/7/prompts-js/) 项目发布单文件 JavaScript 包到 NPM 时学到的经验。

代码托管在 GitHub 上的 [simonw/prompts-js](https://github.com/simonw/prompts-js)。NPM 包名为 [prompts-js](https://www.npmjs.com/package/prompts-js)。

## 一个简单的单文件客户端包

对于这个项目，要想创建一个传统的 JavaScript 文件，可以通过 `<script>` 标签在网页中引入。不需要 TypeScript，不需要 React JSX，不需要额外的依赖，也不需要构建步骤。

我也想将它发布到 NPM，主要是为了让它能够从各种 CDN 自动获取。

我认为我已经将这个过程简化到最简单的程度。以下是 `package.json` 文件的内容：

```json
{
  "name": "prompts-js",
  "version": "0.0.4",
  "description": "async alternatives to browser alert() and prompt() and confirm()",
  "main": "index.js",
  "homepage": "https://github.com/simonw/prompts-js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Simon Willison",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/simonw/prompts-js.git"
  },
  "keywords": [
    "alert",
    "prompt",
    "confirm",
    "async",
    "promise",
    "dialog"
  ],
  "files": [
    "index.js",
    "README.md",
    "LICENSE"
  ]
}
```

那个 “scripts.test” 块可能并不必要。`keywords` 在发布到 NPM 时使用，而 `files` 块告诉 NPM 在包中需要包含哪些文件。

`"repository"` 块用于 NPM 的 [provenance statements](https://docs.npmjs.com/generating-provenance-statements)。不用太担心这个 - 只有在使用 `npm publish --provenance` 选项时才需要。

实际上这里最重要的三个字段是 `"name"`（需要在 NPM 上是唯一的）、`"version"` 和 `"main"` 。我将 `"main"` 设置为 `index.js`。

现在只需要那个 `index.js` 文件 - 如果想在包中包含 `README.md` 和 `LICENSE` 文件的话，这些是可选的。建议包含 `README.md`，因为它会显示在 NPM 列表页面上。

这是我的 [index.js](https://github.com/simonw/prompts-js/blob/main/index.js) 文件。它的开始和结束是这样的（一个 [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)）：

```js
const Prompts = (function () {
  // ...
  return { alert, confirm, prompt };
})();
```

## 发布到 NPM

准备好这些文件后，在项目根目录运行 `npm publish` 就可以将包发布到 NPM - 当然，首先需要登录你的 NPM 账号。

## 使用 GitHub Actions 自动化

我使用 GitHub Actions 在任何发布时自动将我的 Python 项目发布到 PyPI。我想为这个 JavaScript 项目做同样的事情。

我在 GitHub 文档中找到了[这个示例](https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-nodejs-packages#publishing-packages-to-the-npm-registry)，它提供了我需要的大部分内容。这是 [.github/workflows/publish.yml](https://github.com/simonw/prompts-js/blob/main/.github/workflows/publish.yml) 的内容：

```yaml
name: Publish Package to npmjs
on:
  release:
    types: [published]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

这里使用了 `--provenance` 选项，它只有在 `package.json` 中设置了 `repository` 块时才能工作。

这需要在 GitHub 仓库设置中设置一个名为 `NPM_TOKEN` 的密钥。

我试了几次才弄对。它需要在 NPM 网站上使用 Access Tokens 菜单项创建一个令牌，然后选择 Generate New Token -> Classic Token。据我所知，新的"Granular Access Token"格式不适用于此，因为它不允许创建永不过期的令牌，而我不想在将来还要记得更新密钥。

"Automation"令牌应该可以满足需求 - 它在发布时会绕过双因素认证。

在 GitHub Actions 中将其设置为名为 `NPM_TOKEN` 的密钥后，你就可以通过以下步骤发布包的新版本到 NPM：

1.  更新 `package.json` 中的版本号
2.  在 GitHub 上创建一个标签匹配版本号的新发布
