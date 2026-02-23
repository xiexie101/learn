---
title: "604 - 《基于 Neovate Code 做 AI 编程的最佳实践》"
date: 2025-11-11
url: https://sorrycc.com/best-practices-with-neovate-code
---

发布于 2025年11月11日

# 604 - 《基于 Neovate Code 做 AI 编程的最佳实践》

整理下目前我基于 neovate code 的 ai coding 实践一个需求的 workflow，整体是 parallel code agent + spec driven，再加上 neovate code 提供的一些工具。也适用于其他 code agent，比如 claude code 。

![](https://pic.sorrycc.com/proxy/1762826404036-734814472.jpg)

1、跑 neovate workspace create 创建这个需求的 workspace，就保存到 .neovate-workspaces/xxx 下，基于 git worktree 创建，空间单独分离。

2、进入 .neovate-workspaces/xxx，然后执行 neovate 。开始做 spec driven 的 ai 编程。

1）脑暴。shift - tab 两次切到 brainstorm 模式，尽量描述清楚问题，对于清楚怎么实现的问题，可以用 @ 指定文件来缩小范围，然后 ai 会问 1 - 10+ 选择题，最终和你确认 design，反复调整，直到确认没问题（此时，你对 design 整体会是清晰的）。

[https://t.me/yqtalk/793](https://t.me/yqtalk/793)  
[https://t.me/yqtalk/803](https://t.me/yqtalk/803)

2）design 存档。要求「save the design to docs/design」，ai 完成后，这里会有一些无用的 context 累积。所以，双击 esc，选回「save the design to …」这一条进行回滚，省点 context 。

3）if (很长的任务)，执行「/spec/write-plan」，然后「/spec/execute-plan」。else 执行「implement directly」，完成实施任务。

4）新开一个 session，执行「/review」让 ai review 代码。

5）最后用 necvate commit 生成 git commit 信息。

3、执行 neovate workspace complete，会让你选 workspace，然后可以选择 merge 回 root 或者提 pr 到 github。

* * *

**补一个 2025.11.11 下午修改 [sorrycc.com](http://sorrycc.com) 上功能的真实案例。**

1、起手 brainmode 。我知道大概要改哪里，所以通过 @ 指定文件，缩小范围，这样 ai 有个起点，理解起来就更容易，也更省 token。不然他得从文件树上去猜，然后 grep 和读取文件，费时费 token 。

![](https://pic.sorrycc.com/proxy/1762845775106-105841988.png)

2、然后他会问一些问题，帮你理清楚逻辑，但是让你做选择。比如这个交互形式，我会倾向于 inline 的方式编辑。如果不经过这个脑暴的选择题环节，ai 会帮你盲选一个，最终结果可能和你想的完全不同。所以脑暴，可以减少抽奖，让方案确定化。

![](https://pic.sorrycc.com/proxy/1762845787659-447609178.png)

3、经过一系列问题之后，产出设计方案如下。

比较长，我放 gist 了，见 [https://gist.github.com/sorrycc/a80674c9a783fd7fdc554176ee407cbc](https://gist.github.com/sorrycc/a80674c9a783fd7fdc554176ee407cbc)

4、然后，save the design doc、esc-esc 回一轮会话，implement directly 。等几分钟，done 。

结果如下。  
![](https://pic.sorrycc.com/proxy/1762845723762-852996211.gif)
