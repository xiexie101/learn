---
title: "423 - 《Github Copilot CLI》"
date: 2024-03-21
url: https://sorrycc.com/github-copilot-cli
---

发布于 2024年3月21日

# 423 - 《Github Copilot CLI》

> 2024.03.21 16:52 更新：应该不是用的 GPT 4，相同的问题问了 GPT 4，明显后者效果更好。

早上收到 GitHub Copilot CLI 的邮件，又试了下，做下记录。

安装。

```bash
# 更新 gh
$ brew update && brew upgrade gh
# 确认已登录
$ gh auth status
# 安装 github/gh-copilot 扩展
$ gh extension install github/gh-copilot
```

然后就有两个命令。

```bash
$ gh copilot explain
$ gh copilot suggest
```

比如。

```bash
$ gh copilot suggest -t shell "找出所有 .js 文件并删除"
```

![](https://img.alicdn.com/imgextra/i2/O1CN01i8MZ6c1K4sxzIgcBZ_!!6000000001111-2-tps-1308-914.png)

参考：  
[https://docs.github.com/en/copilot/github-copilot-in-the-cli](https://docs.github.com/en/copilot/github-copilot-in-the-cli)  
[https://github.com/cli/cli](https://github.com/cli/cli)
