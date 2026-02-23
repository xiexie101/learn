---
title: "译：与 Claude Code 共事的六周"
date: 2025-08-04
url: https://sorrycc.com/six-weeks-of-claude-code
---

发布于 2025年8月4日

# 译：与 Claude Code 共事的六周

> 原文： [https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/)  
> 作者： Orta Therox  
> 译者： Gemini 2.5 Pro

想想看，这才过去短短几周，真是不可思议。

Claude Code 极大地改变了我与大规模编写和维护代码之间的关系。我写的代码质量一如既往，但我感觉自己获得了一种全新的、难以言喻的表达自由。

Claude Code 让我不再需要亲手写下每一行代码。我仍然对我发布到 Puzzmo 的所有东西负全责，但这种能瞬间创造出整个场景，而不是一行行、一个词一个词敲代码的能力，实在太强大了。

我相信，有了 Claude Code，我们正处于编程的“摄影术发明”时期。当一个想法就能直接生成，你再用自己的代码审查和编辑技巧将其塑造成你想要的样子时，亲手绘画就再也没有那么大的吸引力了。

如果这种想法让你感到不安，那欢迎来到 2020 年代中期，这里的一切都不再稳定，变化是唯一的不变。抱歉。文化上的变化几乎都是_坏_的，这锅我不背，而且我认为 LLM 已经在造成社会损害，未来还会更糟——但这个精灵已经从瓶子里跑出来了，它将从根本上改变我们对编程的看法。

## 回顾过去六周[#](#a-retrospective-on-the-last-6-weeks)

这篇文章建立在我使用 Claude 一周后所写的《[与 Claude 结对编程](https://blog.puzzmo.com/posts/2025/06/07/orta-on-claude/)》一文的基础上。如果你觉得我是个 AI 吹，你可以在那篇文章的[开头部分](https://blog.puzzmo.com/posts/2025/06/07/orta-on-claude/#before-we-start)读到我对 LLM 更细致的看法。

话虽如此，这确实是变革性的。我想从过去 6 周 Puzzmo 工程领域的动态中，给你提供一些视角，让你看看我所看到的景象。

### 维护成本显著降低[#](#maintenance-is-significantly-cheaper)

我曾和许多人一起做过项目，其中一些单调乏味的任务需要花费数周全职时间：“把这个 JS 代码库转换成 TypeScript”、“升级到 Swift X”、“切换到 monorepo”，这些都是需要无数次 rebase 的精细迁移工作。

自从能用上 Claude Code，以下是我**独自**完成的事情清单：

*   将数百个 React Native 组件转换为纯 React
*   用自研或成熟、有支持的方案替换了 3 个不小的 RedwoodJS 系统
*   为多个内部和外部项目构建了复杂的 REPL
*   将几乎所有的数据库模型都切换到了统一的布尔值 ‘flags’ 系统
*   从 Jest 迁移到了 Vitest
*   为 React 创建了我们的前端测试策略
*   将许多在代码中定义的东西移至通过 CMS 运行
*   在服务器端渲染方面取得了重大进展
*   因废弃特性重写了 iOS 应用的启动系统
*   为排行榜、每日谜题等系统构建了一套由 LLM 创建（并明确标注如此，然后手动注释）的文档
*   将我们设计系统的大量基础组件转换为使用 base-ui
*   将大量代码从内联样式迁移到 stylex
*   将 [puzzmo.com](http://puzzmo.com) 的所有动画转换为使用与游戏相同的技术
*   修复了多个自 Puzzmo 诞生以来就存在的 bug
*   更新了所有 Vite 集成
*   将所有 Puzzmo 生产项目迁移到 node 22
*   将游戏仓库转换为真正的 monorepo
*   为 Puzzmo 应用构建了 iPad 支持

这些项目没有一个是我今年作为 Puzzmo “业务开发”负责人日常需要做的“本职工作”。这些_实际上都是_我在做别的事情时_自己_完成的副业项目。

为了让大家更清楚地理解，我再说一遍，因为这对我自己来说都感到震惊：在过去 6 周里，我在完成 Claude Code 出现之前的既定路线图工作的同时，独自完成了所有这些事情。大部分是在后台完成的（对于一些大项目，会有一天专门进行润色）。我也并没有因此从每天工作约 10 小时变成 16 小时。

这对我来说是积压了多年的\*“技术债”/“技术创新”\*任务！一个半月多一点就搞定了。

只要你清楚自己在做什么，处理那些通常被归为“技术债”的繁杂任务的能力已经变得如此强大，以至于它们_不再需要被当作债务来对待_，你完全可以在处理其他工作时顺手就把它们做了。

\*“在日程表上挤出点时间”\*这件事，现在变得极其廉价，以至于你可以在开会前就启动一项任务并取得实质性进展，然后在会后决定这个方向是否正确。这简直颠覆认知。

### 先写，后决定[#](#write-first-decide-later)

我一直在努力养成一个习惯：在彻底否定一个想法之前，先动手试一试。例如，从 Puzzmo 第一天开始，我就一直在等待确定前端的测试策略，因为我希望能够雇佣一个人来全权负责“[puzzmo.com](http://puzzmo.com)”，而其中的一部分工作就是想办法避免我们遇到的那么多回归问题。

为前端制定测试策略不是一件轻松活，我见过很多糟糕的测试套件，它们过度测试，变得脆弱，工程师们都不愿碰。网络、react、上下文范围、dom、工具的脆弱性，这些因素混在一起，让你只能在自己用过且有信心维护的方案中，寻找那个最不坏的。

我曾想，我是不是该等别人来做这件事。但后来，我没有直接“添加一个测试套件”，而是选择让 Claude Code 在两周内为我提交的每一个前端 pull request 编写测试。

然后，在看过这些测试后，我把它们删掉了。这个过程每次只多花我 5 分钟，但却让我得以一窥其他项目处理这个问题的不同方式。几周下来，我已经准备好系统性地审视这个问题了。

为每个 pull request 写测试然后再删掉，这个想法要是放在以前，会耗费大量时间，我绝不可能同意这么做。

或者，最近在 slack 上的一个例子，我只是在后台随性地花了半天时间，试图为我们 CMS 工具中的 CRUD 资源创建一个抽象层：

[![一张关于用 relay + graphql 创建 CRUD 应用的 slack 消息截图](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/slack-screenshot-crud.png)](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/slack-screenshot-crud.png)

成功了吗？没有。值得探索一番吗？当然。

### “双克隆”生活方式[#](#living-the-two-clones-lifestyle)

Anthropic 提供了如何使用 [worktrees](https://docs.anthropic.com/en/docs/claude-code/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees) 的信息——但我想提倡一种更简单的方法。两个克隆仓库，不同的 [VS Code profiles](https://code.visualstudio.com/docs/configure/profiles)。

[![一张 Missing Link 谜题的图片，其中的单元格被打乱了。](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/dual-clone.png)](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/dual-clone.png)

这意味着你可以在每个克隆仓库中独立工作，并通过使用不同的主题来直观地识别工作区的差异：

![alt text](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/clone-2-settings.png)

我最好的理由很简单：每个克隆仓库代表一个你可以同时处理的 pull request。如果你需要编写 pull request 并与他人协作，这一点仍然非常重要。我设置了让我们的开发服务器能关闭任何占用你所需端口的进程，这样在 Claude Code 忙着处理事情时，你就可以轻松地在两个克隆仓库之间切换，而无需等待构建完成。

### 游戏设计协作[#](#game-design-collaboration)

自 Puzzmo 创立以来，我们创造一款游戏的流程是这样的：

*   我们使用各种技术创建一些原型
*   我们集体讨论原型并提供反馈
*   我们决定这款游戏是否值得发布
*   游戏团队在我们的技术栈中从头开始重写游戏，并与 Puzzmo 的系统集成

这个过程在编写任何生产代码之前（如果会写的话）就要花费数周。以我们目前的产出速度，我们大约每季度发布一款达到我们期望打磨水平的游戏。

在后 Claude Code 时代，这个模型可以大大简化，这也是我们正在探索的领域。我创建了一个新的 Puzzmo monorepo（现在有三个了：“app”、“games”和这个新的“prototypes”），它模仿了游戏仓库的基础设施，但对交付的代码类型有着截然不同的期望。有了这个仓库，游戏设计师可以在几个小时内将一个想法变成在 [puzzmo.com](http://puzzmo.com) 上供管理员使用的东西，你写好代码，然后进入我们的管理后台 CMS 点击几个按钮就完成了。

从“这对团队来说不错”到“我们应该公开发布”，需要我和 Saman 的一些亲手操作，但这与我们目前的生产流程相比，工作量完全不在一个量级。

我们用这种方法发布了《[Missing Link](https://blog.puzzmo.com/posts/2025/07/04/missing-link/)》，似乎很受欢迎。但这……其实给我们带来了一点小麻烦。我乐于让游戏设计师的代码在 Puzzmo 上作为限时实验运行，但我不能接受它就此成为 Puzzmo 的正式游戏，与其它游戏并列。

正是这种让游戏设计师能够制作原型的灵活性，使其不适合编写长期的生产代码。这给我们留下了几个选择：

*   结束实验，将游戏从网站下架
*   将游戏重写为生产代码
*   宣布某些游戏不完全具备所有 Puzzmo 的集成功能
*   探索在原型中编写“生产级别”代码的可能性
*   延长实验时间，以便我们有时间想出其他方案

所有这些都有利有弊，正确的做法并不明朗。这个问题之所以新颖，是因为在 Claude Code 出现之前，将原型代码与 Puzzmo 的系统集成起来费力不讨好——而现在，这事儿变得轻而易举，团队里的任何人都能完成。我们现在真的可以兑现我们发布时提出的“实验性”游戏理念了，但这也意味着我们必须更审慎地考虑风险：发布太多人们希望我们保留的游戏。

### 在分类讨论时就动手尝试[#](#taking-a-shot-during-triage)

我一直在尝试一件事：在我们每周对所有 GitHub issues 进行分类讨论时，让 Claude Code 的 GitHub action 在我们工程师团队讨论的同时，就先尝试生成一个 pull request：

![一张 GitHub issues 的截图](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/claude-code-pr.png)

或者像这个，我在 issue 里自己提供了足够的上下文：

![另一张 github issue 的截图](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/nuanced-issue.png)

由于我负责将这个 Pull Request 推向生产环境，这算是完成了最初的几步。对于一些小任务，既然仓库已经配置得很好，我发现它一次就能搞定。

## 内部哪些人成功地使用了它？[#](#who-has-been-successful-using-it-internally)

我觉得有必要在这里提一下，从我个人意识到 Claude Code 是一个多么强大的工具那一刻起，我们就把它提供给了团队里的每一个人。

我观察到，在我们的团队里，那些使用 Claude Code 并发现其最大价值的人，往往是那些兼具产品、技术能力，并且有自主性，感觉自己可以放手去尝试的人。

其中一位说，Claude Code 让他摆脱了编程时常常面临的“第一步焦虑”。

Justin Searls 写了一篇有趣的文章，他提出了一个“[全广度开发者](https://justin.searls.co/posts/full-breadth-developers/)”的概念，其中他认为：

> 几个月前，最优秀的开发者是拉小提琴的。如今，他们指挥整个交响乐团。

我认为这是对的。在 Puzzmo 团队内部，那些技能是自我驱动的、能独立负责自己领域、并感觉自己有自由去探索和突破界限的人，正在做着非常酷的工作。它打破了所有明确的岗位界限，让我们能以比以往更大、更快的规模就各种想法进行协作，这成了一种乐趣。

所以，我敢加倍肯定地说，[Justin 的文章](https://justin.searls.co/posts/full-breadth-developers/)中所说的一切，都与 Puzzmo 工程团队内部正在发生的事情相呼应，他的文章非常值得深思。

### 我认为它在我们的代码库中取得成功的原因是什么[#](#what-do-i-think-makes-it-successful-in-our-codebases)

1.  我们使用 monorepos。我很幸运[一年前](https://blog.puzzmo.com/posts/2025/01/22/turborepo/)花时间把所有项目都迁移到了两个主要环境中。这最初是为了反映工程团队的工作流程。我的目标是能够在一个 pull request 中完成从数据库 schema 变更到前端组件的修改。
    
    Monorepo 非常适合与 LLM 协同工作，因为它可以读取代表我们 schema 的文件，可以读取定义公共 GraphQL API 的 sdl 文件，读取每个页面的请求，从而搞清楚你想要做什么。在一个地方拥有如此多的上下文，意味着作为 Claude Code 的用户，_我_不需要告诉它那些东西，一句模糊的指令，比如\*“在数据库的用户模型中添加一个 xyz 字段，并让它显示在这个屏幕上”\*，Claude Code 就能做到。
    
2.  我的技术选型是十年前做出的。我[2018 年的一个会议演讲视频](https://www.youtube.com/watch?v=1Z3loALSVQM)仍然是我向人们介绍 Puzzmo 代码库和这些技术选择背后心态的方式。React、Relay、GraphQL、TypeScript 和（现在的 StyleX）都是乏味但_极其明确_的技术。所有这些系统都有编译步骤，这意味着一切都必须在本地可用且正确才能运行，这使得学习曲线有点陡峭，但一旦你做对了——你就知道你做对了。对于我们的管理工具，技术选型甚至更乏味/成熟，我还在用 [Bootstrap](https://getbootstrap.com)！
    
    对于一个 LLM 来说，这些技术已经深深地融入了它的训练集，Claude Code 知道要做诸如“运行 Relay 编译器”之类的事情（当我第一次看到 Claude Code 这样做时，我就知道这将是一段疯狂的旅程），这给了它增量验证其更改是否有效的方法。
    
3.  这不是什么开创性的工作。我们日常做的大部分工作，都是相当普通的、脚踏实地的 CRUD 风格应用。
    
4.  这些代码库不大，也不旧。没有东西比 2021 年更老了，虽然我一直保持更新，但我尽量保持长期的支持/向后兼容性。
    
5.  我们的业务本身就是这些模型的测试套件/基准。例如，在 6 月 28 日，也就是发布这篇文章的两天前，[GLM-4.5](https://z.ai/blog/glm-4.5) 发布了。它提供了一种在本地运行一个[性能约为 Claude Code 80%](https://simonwillison.net/2025/Jul/29/space-invaders/) 的模型的方法。他们是如何衡量这 80% 的呢？这是他们基准测试[所用数据集的表格](https://huggingface.co/datasets/zai-org/CC-Bench-trajectories#test-dataset)：
    
    ![alt text](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/dataset-GLM-45.png)
    
    Puzzmo 的日常工作在他们的测试基础设施中占了大约 (39/52)%！
    

### 量化变化很困难[#](#quantifying-the-change-is-hard)

我本以为在过去 6 周里，Pull Requests、Commits 和合并的代码行数这些指标会有急剧变化。但我觉得这个想法站不住脚：

[![一张 Missing Link 谜题的图片，其中的单元格被打乱了。](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/diagrams.png)](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/diagrams.png)

这是一张 3 个月的图表，其中包含一个月后 Claude Code 时代的数据。我只是让它写个脚本，通过查看我硬盘上的仓库来生成一个 CSV。

话虽如此，我认为内部任何人都会感觉到 Puzzmo 内部的变化速度确实加快了（至少在我贡献的领域），但那些数字实际上并没有_真正_改变。

最近有[一篇论文](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)（来自前 Claude Code 时代）说，使用 AI 的开发者会高估其影响，也许我也是如此。

但_感觉_上完全不是这样。你看到文章开头那个列表了吗？我感觉自己一直在打破自己通常的时间预估，以至于很难衡量一项任务到底需要多长时间。

### 你不必沉迷于 LLM 的潮流[#](#you-dont-have-to-obsess-over-llm-trends)

刚开始可能会让人陶醉，但过了一段时间，使用 Claude Code 就变成了一件平淡无奇的日常工具使用。你不需要花时间去担心 Sonnet 还是 Opus，也不需要去追逐每一个 Claude Code 的竞争对手，比如 Gemini CLI、Qwen Code 或其他什么酷炫的模型。我除了用我每月 100 美元的账户里的 Claude Code，别的什么都没用，而且我用得很好。我听说过在 Claude Code 卡住时去问问 Gemini 不错，但我发现，如果 Claude Code 卡住了，那通常是我没有把工作框架描述好，重新审视一下问题是值得的。

我从没配置过 MCP server，我觉得语音聊天超级尴尬所以也没用过，我也不关注推特上那些简介里带着“.ai”的“蓝 V 大佬”。那些人可以做他们的事，但我很高兴不参与其中。

未来某个时候，考虑看看生态系统中的其他工具可能会变得有意义，但对我来说，前 Claude Code 时代和后 Claude Code 时代的差异是如此巨大，以至于它与其他工具之间的任何增量改进（在某些方面更好，在另一些方面更差）都不值得为那么一点点微小的胜利而折腾。

在本地运行模型很诱人，但像 Claude Code 这样的网络版本总会领先一步，只要我不需要考虑使用限制（[是的，我知道这事](https://techcrunch.com/2025/07/17/anthropic-tightens-usage-limits-for-claude-code-without-telling-users/)），我们就处于一个很好的位置。

### 你可以给 Claude 歇歇[#](#you-can-let-claude-rest)

就像手机一样，你可能会被一种想法占据：因为 Claude Code 可以随时运行，所以你就应该让它随时运行。这实际上无异于在你的终端里（或者手机里？！）“末日刷屏”（doom-scrolling）。

值得记住的是，任何工具都可以随时使用，但驱动它的是你，而你做出明智决策的精力/能力是有限的。

### 我用 `claude yolo` 模式运行[#](#i-run-via-claude-yolo)

我一直在尝试列出我能接受的所有操作：

.claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Bash(grep:*)",
      "Bash(yarn run *)",
      "Bash(yarn lint:*)",
      "Bash(yarn workspace:*)",
      "Bash(find:*)",
      "Bash(mkdir:*)",
      "Bash(rg:*)",
      "Bash(ls:*)",
      "mcp__ide__getDiagnostics",
      "Bash(awk:*)",
      "Bash(yarn build)",
      "Bash(yarn why:*)",
      "Bash(yarn info:*)",
      "Edit(*)"
    ],
    "deny": ["Bash(npx prisma migrate dev:*)", "Bash(git checkout:*)", "Bash(git add:*)"],
    "defaultMode": "acceptEdits"
  }
}

```

但这还不够，我还是经常感觉被问一些我不需要确认的事情。所以我用 `claude --dangerously-skip-permissions`（即 `claude yolo`）来运行。发生在我身上的最糟糕的事情，就是一次糟糕的 Prisma 迁移把我的开发数据库给清空了，还有一次是 Claude Code 决定自己创建一个 commit，然后又发了一个 Pull Request。

我对于后两者的理论是：如果一段内容需要人来读，那它就应该由人来写。我能接受这样的格式：

```
[人写的描述，或一句话总结]

---

[代码生成的 PR 模板]

```

但我不会在生产环境中乱来。

### 面向初级开发者的“平行构建”法[#](#parallel-construction-for-juniors)

我和一些职业生涯早期的同事聊过，他们仍然想亲手做很多基础工作。我给他们的建议是，可以考虑先自己写，然后将自己的成果与向 Claude Code 请求相同任务得到的结果进行比较。

“[平行构建](https://en.wikipedia.org/wiki/Parallel_construction)”是一种鱼与熊掌兼得的方法。你仍然在学习和成长，但你的成果可以通过观察 Claude Code 训练数据中的“集体智慧”是如何做的来加以磨练。Claude Code 可能对生态系统有更深的理解，可能会读取当前代码库中更多的源代码，并且知道一些你尚未学习的抽象概念。

在我看来，把它当作一个可以学习的竞争对手，是比两种极端更健康的选择：一种是放弃，觉得反正自己什么都不用知道了；另一种是把头埋进沙子里，假装这种变化不会影响到你。

### 副业项目：“想做就做”[#](#you-can-just-do-it-for-side-projects)

在我的整个编程生涯中，像所有人一样，我的副业项目和一次性项目的能力很大程度上受限于我仍然想拥有个人生活这个事实。我选择投身于大型开源项目，以让我对自己投入到这门手艺上的时间感到满意。

具体来说，这意味着我花时间在 CocoaPods、Danger、Jest、GraphQL 这样的项目上，而不是去做一些有趣的项目来探索一项技术，或者修复一个小问题。

现在不同了。我可以先动手试试，然后再决定我是否喜欢结果。我感觉，用 Claude Code 探索一小时，大概相当于我以前一个周末的探索量。

#### 例子：内联聊天[#](#eg-inline-chats)

比如这篇博文。当我在构思它时，我想，_“如果能把与 Claude Code 的对话内联显示出来就好了”_，然后我又想，_“为它恢复 Adium 主题不是很有趣吗”_。于是，我就动手了。

我构思了一个我想要的大致想法。提前把它描述得很清楚，然后带狗出去散步了一小时，回来时就得到了一个 CLI 的合理近似版本，而这个东西如果我亲手做，可能要花几个小时。

代码量不大，但研究工作很多：如何重新创建 Adium 主题的 HTML，如何理解 claude code 的消息格式，如何处理本地预览所需的资源。

当它基本能用，可以正确地混合这些想法后，我对其进行了一轮润色。

我润色和部署过的 npm 模块足够多（[174个？！](https://www.npmjs.com/~orta)），所以，这完全在我能力范围内，不用太费脑子。相反，我把这个项目当作一个有趣的副业，一边看[《Apex 英雄》](https://www.youtube.com/watch?v=0LRyOw1R_SE)一边做。

如果你读了聊天记录，你会发现我确实花了一些时间来搞清楚如何过滤一些东西，如何以特定方式显示消息，但这是一种系统性的“保姆式”工作，是我真正不关心的代码。

像这样的功能对我来说是一个_整个周末_的项目，轻松需要 10-12 个小时才能做好并感觉可以发布。但现在，大部分工作在我不在的时候就完成了，然后润色工作是零星进行的。也许整个过程只花了我大约 2 个小时的思考时间？_这太疯狂了_。

如果你想看剩下的对话，了解我是如何完成这篇博文的，它们在这里：

*   按时间顺序接续以上两条：[3](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/claude-conversations/claude-conversation--Users-orta-dev-claude-code-to-adium-ebd791d4/conversation.html), [4](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/claude-conversations/claude-claude-code-to-adium--Users-orta-dev-claude-code-to-adium-0ec8943e/conversation.html), [5](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/claude-conversations/claude-claude-code-to-adium--Users-orta-dev-claude-code-to-adium-594e201d/conversation.html), [6](https://blog.puzzmo.com/posts/2025/07/30/six-weeks-of-claude-code/claude-conversations/claude-conversation--Users-orta-dev-claude-code-to-adium-5f5c097b/conversation.html)

如果你[安装 Adium](https://adium.im)，然后运行 `npx claude-code-to-adium`，你现在就可以使用它。它会引导你完成一个向导，最终生成一个包含 html/css/图片的独立子文件夹。

### 一些对话实例[#](#some-examples-of-what-these-conversations-look-like)

我将尝试从我开始使用以来，在 19 个独立仓库/项目中进行的 147 次对话中挑选一些。我将力求涵盖不同目标，并在旁边给出我的看法。

#### 创建一个“删除 30 天前游戏”的任务[#](#making-a-delete-30-day-old-games-task)

这次对话中，我大致知道我想要什么，但我不确定 postgres 索引及其对批量删除的影响。

所以我首先问了一个一般性问题，让它使用我的 prisma 定义文件来确定数据库中当前的设置。

我们迭代改进脚本，并使其可以在本地测试。

在本地尝试后，我给了它一个“还行”的评价，然后要求一种更明确的技术。

设置好之后，我检查了所有代码，在本地进行审查，修复了风格问题，让它按照我会写的方式工作。

你可能会注意到它做了一些猜测（“我们 10-20% 的游戏记录是匿名用户的”），然后基于这个猜测做出大胆的承诺：

> _索引大小减少了 80-85%！_

对此我表示怀疑。然而，代码是可靠的，它比我自己写的日志要多得多（这对于一个日常任务很有用），而且我感觉我理解了索引的作用。我后来添加了一些胶水注释，比如\*“这个脚本与迁移 y 中的索引一起工作，所以任何更新……”\*

#### 为填字游戏添加栏杆式网格支持[#](#adding-barred-grid-support-to-a-crossword)

我知道这将是一个噩梦般的 PR，你可以在[这里](https://github.com/puzzmo-com/xd-crossword-tools/pull/42)看到。

我首先在仓库中添加了一些测试数据，并通过一个我之前留下想法的 [issue](https://github.com/puzzmo-com/xd-crossword-tools/issues/31) 提供上下文。为了开始，我将任务描述为“这是长期目标，为了开始，我们先做 Y”。这里的 Y 是栏杆的 ASCII 快照。

我们首先构建了一种可视化工作的方法，Claude Code 做得非常接近。最后，我接手了它的工作并自己完成了集成。

一旦我有了可视化解决方案的方法，我们就可以开始处理工作的主要部分了。

我使用基于 ASCII 快照的测试，来对导入的 jpz 文件格式中栏杆的显式版本进行硬编码测试，然后创建了一个依赖于我们即将创建的算法的测试。这意味着我，以及 Claude，都有一个非常明确的方法来判断算法的工作情况。

现有的 jpz 导入算法太天真了，导入的线索是错误的，这意味着我们花了很长时间试图让两个快照匹配。Claude 一直在作弊，直接硬编码答案！直到我重新评估了所有的线索（通过为这些线索的导入创建一个单独的测试），对算法进行重新审视，才开始有所进展。

#### 为一个谜题创建 REPL[#](#creating-a-repl-for-a-puzzle)

一个为[游戏 Circuits](https://circuitsgame.com) 可视化设计谜题的快速、完全随性的原型。

我给了一张截图，并试图描述游戏如何运作，以及我设想的 REPL 可以如何工作。我们迭代了几次，我基本上没有写任何代码。

然后将这个原型交给其他人进行实验，并征求他们关于如何为游戏制作一个可用的开发工具的意见。

#### 填字游戏的打印页面[#](#print-pages-for-crosswords)

我想为填字游戏的可打印 PDF 构建一个设计。我已经有了一个可以生成它们的有效工作流，需要专门处理布局问题。

我本以为这是一个相对容易处理的问题，但结果发现，根本没有一套 CSS 原语可以同时支持列布局_和_围绕图像的文本重排。

Claude 在尝试我正在使用的不同 CSS 属性和系统方面表现不错，我尝试了不同的方式来描述或展示问题，但始终没能让它正常工作。

我认为在这些对话中，我脑子里的核心抽象是错误的，要么是我的建议太具体，要么是通过半吊子的答案进行实验。

最后，我想我将不得不重写它，用 JavaScript 来做布局。

### 但说真的，这东西到底有多好？[#](#but-seriously-how-good-is-this-thing)

也许一个有趣的结尾是，我如何看待这个工具的能力。Claude Code 知道很多东西，你可以轻松地通过链接、截图和额外的代码向它发送参考材料以提供上下文。我发现它处于[“后初级”](https://artsy.github.io/blog/2016/09/10/Help%21-I%27m-becoming-Post-Junior/)阶段的某个位置，那里有丰富的经验和充沛的精力，但它在记住你要求的事情方面做得并不好（即使通过 `CLAUDE.md`），而且它的所有权范围显然是微不足道的。

在 Artsy，早期我们为工程师设立了[一个 5 级技术阶梯](https://artsy.github.io/blog/2015/04/03/artsy-engineering-compensation-framework/)：

> 工程师 1 - 能交付一个明确定义的产品功能。
> 
> 工程师 2 - 能独立负责一个产品功能，并能处理好与其他人的沟通。

达到第二部分要求以某种形式实际存在，并具有某种所有权意识。这是一个值得思考的有趣问题，因为我猜它可能在某种意义上拥有所有权，即代码库中那些完全随性生成且人类不怎么[阅读的部分完全由这些工具“拥有”](https://www.youtube.com/watch?v=LCEmiRjPEtQ)。

然而，从务实的角度来看，当它与一位经验丰富的工程师结对，后者不断审查、修改和理解其输出时——你真的可以把 Claude 当作一个结对编程的伙伴，它有无限的时间和耐心，有点过于谄媚，并且能在我前所未见的速度下，在合理的约束下交付合理的代码。

而这，就像是一种全新的创造方式。
