---
title: "574 - 《Vibe Coding Tips》"
date: 2025-07-05
url: https://sorrycc.com/vibe-coding-tips
---

发布于 2025年7月5日

# 574 - 《Vibe Coding Tips》

关于 Vibe Coding 有个不错的比喻。传统编码像雕刻大理石。你从一块空白的石料开始，小心翼翼地一刀一刀雕琢，一行一行代码，一个一个函数。每一笔都经过深思熟虑，每个决定都由你做出。这很有成就感，但速度很慢。Vibe-coding 更像是指挥一个交响乐团。你不是在演奏每一种乐器，而是在指挥、塑造、引导。AI 提供了原始的音乐天赋，但没有你的愿景，它就只是一堆噪音。

1、选最好的工具和最好的模型。对于我来说，工具目前是 Claude Code > Cursor > 其他，模型是 Claude Opus 4 > Claude Sonnet 4 > Gemini 2.5 Pro > 其他。不要为了节省 Token 和成本而使用较差的模型。好模型的优势是会复利式增长的。同时，也不要为了节省 token 而吝啬于提供上下文，实际上会让你花费更多。这就像为了省油钱每次只加半箱油——结果只会让你更频繁地跑加油站。

2、AI 辅助在未来应该是常态了，如果 AI 辅助了你的代码，不需要藏。所以给每个包含了 AI 工作的 commit 加上 Flag，可以让工作更加透明化。同时也可以让 Review 你代码的人可以更加谨慎一些。

比如可以这样。

```
# [AI] - Significant AI assistance (>50% generated)
# [AI-minor] - Minor AI assistance (<50% generated)
# [AI-review] - AI used for code review only
```

这是我在 takumi 里仓库里的实践。

![](https://cdn.jsdelivr.net/gh/sorrycc-bot/image-2025-04@main/uPic/0144e9139434dcef146dbe62a8b2ec42.jpg)

3、AI 是一个放大器。如果你这个系数本身很小，你不会看到多少增益。如果系数是负的，那么… 同时个人感觉是经验丰富的工程师往往能从 AI 工具中获得多得多的价值，因为他们更加会问问题（写出合理的 prompt）。

对比下下面两则 Prompt，效果好坏应该很好预期。

```
写一个 Python 的限流器，限制用户每分钟 10 次请求。
```

和

```
用 Python 实现一个 Token 桶限流器，要求如下：
- 每个用户（通过 `user_id` 字符串识别）每分钟 10 次请求
- 线程安全，支持并发访问
- 自动清理过期条目
- 返回一个元组 (allowed: bool, retry_after_seconds: int)

请考虑：
- Token 是应该逐渐补充还是一次性补满？
- 当系统时钟发生变化时会怎样？
- 如何防止因不活跃用户导致的内存泄漏？

优先选择简单、可读的实现，而不是过早优化。仅使用标准库（不要用 Redis 或其他外部依赖）。
```

这里分享两个技巧。一个是 metaprompting，先给模型一个简单的任务，然后让它帮我发现其中的权衡和边界情况；另一个是 Plan 模式，给简单任务，然后评估模型给的计划是否合理，不合理则接着调整，直到满意为止。

4、Rules 文件至关重要。这是 Code Agent 在被调用时会自动读取的自定义文档。他让你不用一遍遍地解释你项目的规范，让 Code Agent 的效率会变得出奇地高。

比如这个。

```
## Project: Analytics Dashboard

This is a Next.js dashboard for visualizing user analytic:

### Architecture Decisions
- Server Components by default, Client Components only when necessary
- tRPC for type-safe API calls
- Prisma for database access with explicit select statements
- Tailwind for styling (no custom CSS files)

### Code Style
- Formatting: Prettier with 100-char lines
- Imports: sorted with simple-import-sort
- Components: Pascal case, co-located with their tests
- Hooks: always prefix with 'use'

### Patterns to Follow
- Data fetching happens in Server Components
- Client Components receive data as props
- Use Zod schemas for all external data
- Error boundaries around every data display component

### What NOT to Do
- Don't use useEffect for data fetching
- Don't create global state without explicit approval
- Don't bypass TypeScript with 'any' types
```

或者[这个](https://github.com/julep-ai/julep/blob/dev/AGENTS.md)，或者[这个](https://github.com/steipete/agent-rules)。

关于 Rules 文件的一个技巧是。你可能会同时或交叉用多个 Code Agent，而不同工具虽然都支持 Rules 文件，但命名往往不同。技巧是，把规则文件写在 `RULES.md` 里，然后通过软链的方式 link 到 `.cursorrules`、`.windsurfrules`、`CLAUDE.md`、`TAKUMI.md` 等。

5、上下文管理也至关重要。完成一个任务之后要记得清空 Session，Cursor 里是「Ctrl + R」，Claude Code 里是 `/clear` Slash Command。手动 @ 相关的文件和文件夹，可以让目标更明确，效率也更高，AI 不至于在整个仓库里去搜索。

6、Git 工作流有两种方式。1）在不同的文件夹中创建 3-4 个 git checkout 副本，在不同的终端标签页中打开每个文件夹，在每个文件夹启动 Code Agent，分配不同的任务，然后轮流查看进度，2）使用 git worktrees 来为 AI 实验创建隔离的环境，详见[《how to use worktrees》](https://dev.to/yankee/practical-guide-to-git-worktree-58o0)。

```bash
git worktree add ../ai-experiments/cool-feature -b ai/cool-feature

# 让 Code Agent 在隔离的 worktree 里尽情发挥
cd ../ai-experiments/cool-feature
# ... 大量实验性的 commit ...

# 把好的部分 cherry-pick 回主干
cd ../main-repo
git cherry-pick abc123  # 只保留那些有用的 commit

# 完成后清理
git worktree remove ../ai-experiments/cool-feature
```

7、启用 Yolo 模式可以省去大量 Approve Permission 的操作，让整体流程更流畅，尤其是对于一些耗时较长的任务，我真的不想因为每用一个新终端命令就得切换回去确认一次。这样每次确认完需求之后，过个 10 分钟回来，代码就写好了。需要注意的是，一个恶意的 prompt 可能把我的系统干挂，但个人目前还没有遇到过。有安全顾虑的可以考虑开 [Arq](https://www.arqbackup.com/) 快照加 [SuperDuper!](https://www.shirt-pocket.com/SuperDuper/SuperDuperDescription.html) 克隆备份，也可以考虑[在 Docker 里运行](https://www.youtube.com/watch?v=8dqqa0dLpGU)。

不同 Agent 应该度有 Yolo 或 Dangerous 模式，以下是 Claude Code 的。

```bash
alias cc="claude --dangerously-skip-permissions"
```

8、两个有用的 AI Coding 工作流。

1）Explore、Plan、Code、Commit。 先让 Code Agent 读相关资料，指定计划，指定计划时可以用「ultrathink」增加思考预算，再用代码实现，最后提交。

2）Test、Commit、Code、Commit。测试驱动开发。先明确告诉 Code Agent 你在 TDD，要求写用例并确认他们失败，提交测试用例。然后写代码实现这些用例，要求不能修改测试代码，完成后提交代码。

9、不仅仅是 Code，Code Agent 还可以帮你干任何事。

```
把这里约 40 篇 Jekyll 格式的文章转换成 MDX 格式。确保图片被复制过来，并保留重定向。
```

```
把这个功能提取到一个 Npm Package 里。
```

```
把所有代码按逻辑分块提交
```

```
在 Dock 中隐藏最近使用的应用
```

```
创建一个 Deep Research 任务，弄清楚如何将一个网站从 tailwind 3 迁移到 4，然后给我一份简短的结果总结。
```

```
帮我创建一个名为 deep_work.sh 的脚本。这个脚本需要：1. 打开 Obsidian。 2. 关闭所有浏览器和通讯软件。 3. 开启系统的‘勿扰模式’。 4. 播放我本地 /music/focus 文件夹里的白噪音。
```

10、语音输入。我用 [Wispr Flow](https://wisprflow.ai/)，免费额度就足够。当要写一个较长的 prompt 时，这很有用，因为它能让我更快地把脑子里的想法表达出来。

参考：  
[530 - 《我怎么用 AI 辅助编程》](https://sorrycc.com/how-to-use-ai-to-assist-programming)  
[563 - 《Vibe Coding》](https://sorrycc.com/vibe-coding)  
[569 - 《再聊 Vibe Coding》](https://sorrycc.com/vibe-coding-2)  
[https://mp.weixin.qq.com/s/Frdf\_Gh3Xhvvmw2g-zOolA](https://mp.weixin.qq.com/s/Frdf_Gh3Xhvvmw2g-zOolA)
