---
title: "433 - 《VSCode Essentials 笔记》"
date: 2024-04-26
url: https://sorrycc.com/vscode-essentials-note
---

发布于 2024年4月26日

# 433 - 《VSCode Essentials 笔记》

> 内容是 [https://microsoft.github.io/vscode-essentials](https://microsoft.github.io/vscode-essentials) 的阅读笔记，花时间对每天在用的工具多了解一些。

1、下载使用。

1）Windows 和 Mac 都可以通过命令行安装。

```bash
# win
$ winget install Microsoft.VisualStudioCode
# mac
$ brew install --cask visual-studio-code
```

2）访问 [https://vscode.dev/](https://vscode.dev/) ，无需安装即可使用。

3）通过「Remote > SSH」可以连远程服务器的 VSCode，可以访问终端和文件系统。无法直接连的场景可以用「VS Code Server」建立安全通道（会有潜在的安全问题）。

4）如果你喜欢尝鲜，可以用 [https://insiders.vscode.dev/](https://insiders.vscode.dev/) 内部版，这个版本每天都会更新。

2、自定义编辑器。

1）点击菜单「Help > Keyboard Shortcut Reference」可获取全部快捷键的 PDF 文档。

2）主题在「扩展」Tab 搜「@category:“themes”」可获取，分 a）Interface colors，b）File icons，c）Product icons，可单独选择。默认会应用于工作区（workbench）。

3）如果希望基于某个主题更改部分颜色，用「Preferences: Open Settings (JSON)」命令打开配置文件 settings.json，然后通过修改属性「workbench.colorCustomizations」和「editor.tokenColorCustomizations」实现。比如。

```json
"workbench.colorCustomizations": {
    "activityBar.background": "#223355",
}
```

4）通过「Profiles: Create Profile」可创建新的 Profile，然后通过「Profiles: Switch Profile」切换。当你需要在不同环境或不同语言下工作时会非常有用。

3、Git。

1）微软有个 Git 的入门教程，见 [https://learn.microsoft.com/en-us/training/paths/intro-to-vc-git/](https://learn.microsoft.com/en-us/training/paths/intro-to-vc-git/) 。

2）文中推荐了「Git Graph」扩展，可进行一些更进阶的 Git 操作。

4、进阶编辑。

1）快速导航用「Cmd+P」打开文件，输入「@」可以在文件中找符号，输入「:」可以访问指定行。输入「Cmd+Shift+.」可以展开当前文件结构。

2）重构可以，a）按「F2」重命名，b）选中代码后，点击前面的「小灯泡」或按「Shift+Ctrl+R」做特定重构操作，c）按「Shift+Alt+F」可自动格式化代码。

3）还有多光标编辑、代码片段、协作编辑，略。

5、扩展。

如何初始化一个扩展？

```bash
npm install -g yo generator-code
yo code
```
