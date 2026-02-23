---
title: "译：使用 Claude Code 和 Codex 等异步编程智能体进行代码研究项目"
date: 2025-12-31
url: https://sorrycc.com/async-code-research-with-claude-code-and-codex
---

发布于 2025年12月31日

# 译：使用 Claude Code 和 Codex 等异步编程智能体进行代码研究项目

> 原文：[https://simonwillison.net/2025/Nov/6/async-code-research/](https://simonwillison.net/2025/Nov/6/async-code-research/)  
> 作者：Simon Willison  
> 译者：Gemini 3 Pro High

2025年11月6日

我最近一直在尝试一种 LLM 使用模式，效果非常好：**异步代码研究任务**。选一个研究问题，启动一个异步编程智能体，让它去运行一些实验，并在完成后回来报告。

*   [代码研究](https://simonwillison.net/2025/Nov/6/async-code-research/#code-research)
*   [编程智能体](https://simonwillison.net/2025/Nov/6/async-code-research/#coding-agents)
*   [异步编程智能体](https://simonwillison.net/2025/Nov/6/async-code-research/#asynchronous-coding-agents)
*   [给它们一个专用的 GitHub 仓库](https://simonwillison.net/2025/Nov/6/async-code-research/#give-them-a-dedicated-github-repository)
*   [让它们尽情使用无限的网络访问权限](https://simonwillison.net/2025/Nov/6/async-code-research/#let-them-rip-with-unlimited-network-access)
*   [我的 simonw/research 合集](https://simonwillison.net/2025/Nov/6/async-code-research/#my-simonw-research-collection)
*   [当然，这完全是粗制滥造](https://simonwillison.net/2025/Nov/6/async-code-research/#this-is-total-slop-of-course)
*   [亲自尝试一下](https://simonwillison.net/2025/Nov/6/async-code-research/#try-it-yourself)

#### 代码研究 [#](https://simonwillison.net/2025/Nov/6/async-code-research/#code-research)

软件开发从我所说的**代码研究**中获益良多。关于代码的问题，最棒的一点是，它们通常可以通过编写和执行代码来得到确定的回答。

我经常在论坛上看到一些问题，暗示提问者缺乏这种技能。

“Redis 能用来支持我应用的通知流吗？”就是一个很好的例子。答案\_永远\_是“视情况而定”，但更好的答案是，一个优秀的程序员已经拥有了回答这个问题所需的一切。建立一个概念验证（PoC），模拟你在生产环境中预期的模式，然后运行实验看看它是否行得通。

长期以来，我一直是代码研究的积极实践者。我的许多最有趣的项目最初都只是几十行实验代码，用来向自己证明某件事是可行的。

#### 编程智能体 [#](https://simonwillison.net/2025/Nov/6/async-code-research/#coding-agents)

事实证明，像 Claude Code 和 Codex 这样的**编程智能体**也非常适合这类工作。给它们一个正确的目标和一个有用的环境，它们就能在没有任何进一步监督的情况下完成一个基本的代码研究项目。

大语言模型（LLM）会产生幻觉并犯错。但这对于代码研究任务来说不那么重要，因为代码本身不会撒谎：如果它们编写并执行代码，且代码做出了正确的事情，那么它们就向它们自己和你证明了某件事确实行得通。

它们无法证明某事是不可能的——仅仅因为编程智能体找不到做某事的方法并不意味着它不能被完成——但它们通常可以在几分钟的运算内证明某事\_是\_可能的。

#### 异步编程智能体 [#](https://simonwillison.net/2025/Nov/6/async-code-research/#asynchronous-coding-agents)

我已经使用像 Claude Code 和 Codex CLI 这样的交互式编程智能体做了一堆这样的事情，但今天我越来越多地转向使用它们的**异步编程智能体**家族成员。

异步编程智能体是一种基于“发射后不管”（fire-and-forget）模式运行的编程智能体。你给它布置一个任务，它就在某处的服务器上忙活，当它完成后，它会向你选择的 GitHub 仓库提交一个 Pull Request。

OpenAI 的 [Codex Cloud](https://chatgpt.com/codex)、Anthropic 的 [Claude Code for web](https://claude.ai/code)、Google Gemini 的 [Jules](https://jules.google/) 和 GitHub 的 [Copilot coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent?utm_source=chatgpt.com) 是这种模式的四个杰出代表。

这些是进行代码研究项目的\_绝佳\_工具。想出一个明确的目标，把它写成几段提示词，放手让它们去干，十分钟后再回来看看它们搞出了什么。

我现在每天都要启动 2-3 个代码研究项目。我自己投入的时间很少，而它们经常带回有用或有趣的结果。

#### 给它们一个专用的 GitHub 仓库 [#](https://simonwillison.net/2025/Nov/6/async-code-research/#give-them-a-dedicated-github-repository)

你可以针对现有的 GitHub 仓库运行代码研究任务，但我发现拥有一个单独的、专用的仓库来让你的编程智能体运行项目要自由得多。

这使你不再局限于仅针对已编写的代码进行研究，也意味着你可以对让智能体做的事情少一些顾虑。

我有两个用于此目的的仓库——一个公开的，一个私有的。我使用公开仓库进行无需保密的研究任务，而私有仓库则用于任何我还未准备好与世界分享的内容。

#### 让它们尽情使用无限的网络访问权限 [#](https://simonwillison.net/2025/Nov/6/async-code-research/#let-them-rip-with-unlimited-network-access)

专用仓库的最大好处是，你不需要对在该仓库中操作的智能体能做什么而小心翼翼。

Codex Cloud 和 Claude Code for web 都默认在锁定环境中运行智能体，严格限制它们访问网络的方式。如果它们是针对敏感仓库运行，这完全合理——[致命三连击（lethal trifecta）](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)类型的提示注入攻击很容易被用来窃取敏感代码或环境变量。

如果你是在一个新的、非敏感的仓库中运行，你完全不需要担心这个！我已经将我的研究仓库配置为全网络访问，这意味着我的编程智能体可以安装它们需要的任何依赖项，从网络上获取数据，并且通常可以做我在自己的电脑上能做的任何事情。

#### 我的 simonw/research 合集 [#](https://simonwillison.net/2025/Nov/6/async-code-research/#my-simonw-research-collection)

让我们看一些例子。我的公开研究仓库在 GitHub 上的 [simonw/research](https://github.com/simonw/research)。目前它包含 13 个文件夹，每个文件夹都是一个独立的研究项目。我两周前才创建它，所以我已经平均每天将近一个了！

它还包含 [一个 GitHub Workflow](https://github.com/simonw/research/blob/main/.github/workflows/update-readme.yml)，使用 [GitHub Models](https://docs.github.com/en/github-models) 自动更新 [README](https://github.com/simonw/research/blob/main/README.md) 文件，添加每个新项目的摘要，使用了 [Cog](https://cog.readthedocs.io/)、[LLM](https://llm.datasette.io/)、[llm-github-models](https://github.com/tonybaloney/llm-github-models) 和 [这段 Python 代码](https://github.com/simonw/research/blob/b059108dfefeb05a48e1c27f7a127dc9fd648129/README.md#L9-L116)。

以下是仓库中的一些研究项目示例。

**[node-pyodide](https://github.com/simonw/research/tree/main/node-pyodide)** 展示了一个 [Node.js 脚本](https://github.com/simonw/research/blob/main/node-pyodide/server-simple.js) 的例子，它在内部运行 Python 的 [Pyodide](https://pyodide.org/) WebAssembly 发行版——这是我为了寻找在服务器上的 WebAssembly 沙箱中运行 Python 的好方法而进行的[持续尝试](https://simonwillison.net/tags/sandboxing%2Bpython/)中的又一次尝试。

**[python-markdown-comparison](https://github.com/simonw/research/tree/main/python-markdown-comparison)** ([记录](https://gistpreview.github.io/?fb07c2a3fd2d4cfb814a46696a58a00e)) 提供了七个不同 Python Markdown 库的详细性能基准测试。我启动这个项目是因为我偶然发现了 [cmarkgfm](https://pypi.org/project/cmarkgfm/)，这是一个围绕 GitHub 的 C 语言 Markdown 实现的 Python 绑定，我想看看它与其他选项相比如何。这个项目生成了一些图表！`cmarkgfm` 以显著优势名列前茅：

![条形图，标题为“相对性能 vs cmarkgfm（大文档）”，比较了 markdown 库的相对速度，marko 为 52.1x，markdown2 为 16.9x，mistletoe 为 14.1x，markdown 为 12.9x，commonmark 为 12.1x，mistune 为 10.0x，cmarkgfm 为 1.0x 基准线（用红色虚线标记）；x 轴标记为“相对速度（越低越好）”，范围从 0 到 50+](https://static.simonwillison.net/static/2025/markdown-performance.png)

这是我用于该项目的完整提示词：

> Create a performance benchmark and feature comparison report on PyPI cmarkgfm compared to other popular Python markdown libraries—check all of them out from github and read the source to get an idea for features, then design and run a benchmark including generating some charts, then create a report in a new python-markdown-comparison folder (do not create a \_summary.md file or edit anywhere outside of that folder). Make sure the performance chart images are directly displayed in the [README.md](http://README.md) in the folder.

> 创建一份关于 PyPI cmarkgfm 与其他流行 Python markdown 库的性能基准测试和功能比较报告——从 github 检出所有库并阅读源代码以了解功能，然后设计并运行基准测试，包括生成一些图表，然后在一个新的 python-markdown-comparison 文件夹中创建报告（不要创建 \_summary.md 文件或在该文件夹之外进行任何编辑）。确保性能图表图像直接显示在文件夹中的 [README.md](http://README.md) 中。

请注意，除了 `cmarkgfm` 之外，我没有指定任何 Markdown 库——Claude Code 运行了一个搜索并自己找到了其他六个。

**[cmarkgfm-in-pyodide](https://github.com/simonw/research/tree/main/cmarkgfm-in-pyodide)** 要有趣得多。将所有研究项目放在同一个仓库中的一个好处是，新项目可以建立在以前项目的基础上。在这里，我决定看看让 `cmarkgfm`（它有一个 C 扩展）在 Node.js 内部的 Pyodide 中工作有多难。Claude 成功编译了一个 88.4KB 的 `cmarkgfm_pyodide-2025.10.22-cp312-cp312-emscripten_3_1_46_wasm32.whl` 文件，其中包含必要的 C 扩展，并证明了它可以加载到 Node.js 内部的 WebAssembly 中的 Pyodide 里。

在最初的尝试失败后，我在笔记本电脑上使用 Claude Code 运行了这个项目。起始提示词是：

> Figure out how to get the cmarkgfm markdown lover _\[typo in prompt, this should have been “library” but it figured it out anyway\]_ for Python working in pyodide. This will be hard because it uses C so you will need to compile it to pyodide compatible webassembly somehow. Write a report on your results plus code to a new cmarkgfm-in-pyodide directory. Test it using pytest to exercise a node.js test script that calls pyodide as seen in the existing node.js and pyodide directory  
> \\n> There is an existing branch that was an initial attempt at this research, but which failed because it did not have Internet access. You do have Internet access. Use that existing branch to accelerate your work, but do not commit any code unless you are certain that you have successfully executed tests that prove that the pyodide module you created works correctly.

> 弄清楚如何让 Python 的 cmarkgfm markdown lover _\[提示词中有拼写错误，这本应是“library”（库），但它还是理解了\]_ 在 pyodide 中工作。这会很难，因为它使用 C 语言，所以你需要以某种方式将其编译为 pyodide 兼容的 webassembly。将结果报告和代码写入一个新的 cmarkgfm-in-pyodide 目录。使用 pytest 测试它，以运行一个调用 pyodide 的 node.js 测试脚本，就像在现有的 node.js 和 pyodide 目录中看到的那样。  
> \\n> 有一个现有的分支是这项研究的初步尝试，但由于没有互联网访问权限而失败了。你有互联网访问权限。利用那个现有的分支来加速你的工作，但不要提交任何代码，除非你确定你已经成功执行了证明你创建的 pyodide 模块工作正常的测试。

这个项目进行到一半就放弃了，抱怨说 emscripten 会花太长时间。我告诉它：

> 完成这个项目，实际运行 emscripten，我不在乎花多长时间，如果成功就更新报告

它又忙活了一会儿，抱怨说现有的 Python 库使用了 CFFI，而这在 Pyodide 中不可用。我问它：

> 你能想出如何重写 cmarkgfm 以不使用 FFI，而是使用一种对 pyodide 友好的方式来集成该 C 代码吗？

……结果它做到了。你可以[在这里查看完整的记录](https://gistpreview.github.io/?6d778a8f9c4c2c005a189ff308c3bc47)。

**[blog-tags-scikit-learn](https://github.com/simonw/research/tree/main/blog-tags-scikit-learn)**。暂时从 WebAssembly 中抽身出来，我想让 [scikit-learn](https://scikit-learn.org/stable/) 在针对我博客的文本分类任务上大显身手，这应该很有趣：

> Work in a new folder called blog-tags-scikit-learn  
> \\n> Download `https://datasette.simonwillison.net/simonwillisonblog.db`—a SQLite database. Take a look at the blog\_entry table and the associated tags—a lot of the earlier entries do not have tags associated with them, where the later entries do. Design, implement and execute models to suggests tags for those earlier entries based on textual analysis against later ones  
> \\n> Use Python scikit learn and try several different strategies  
> \\n> Produce JSON of the results for each one, plus scripts for running them and a detailed markdown description  
> \\n> Also include an HTML page with a nice visualization of the results that works by loading those JSON files.

> 在一个名为 blog-tags-scikit-learn 的新文件夹中工作  
> \\n> 下载 `https://datasette.simonwillison.net/simonwillisonblog.db`——一个 SQLite 数据库。看看 blog\_entry 表和关联的标签——很多早期的条目没有关联标签，而较晚的条目有。设计、实现并执行模型，基于对较晚条目的文本分析，为那些较早的条目建议标签  
> \\n> 使用 Python scikit learn 并尝试几种不同的策略  
> \\n> 为每种策略生成结果的 JSON，加上运行它们的脚本和详细的 markdown 描述  
> \\n> 还要包含一个 HTML 页面，通过加载这些 JSON 文件来对结果进行漂亮的可视化。

这产生了七个 `.py` 文件，四个 `.json` 结果文件和一份详细的 [报告](https://github.com/simonw/research/blob/main/blog-tags-scikit-learn/README.md)。（由于某种原因，它忽略了关于带有漂亮可视化的 HTML 页面的部分。）对于在手机上输入的几分钟闲暇好奇心来说，这还不赖！

这只是目前仓库中十三个项目中的三个。如果你想看它们是如何展开的，每个项目的提交历史通常会链接到提示词，有时还会链接到记录。

最近，我在仓库中添加了一个简短的 `AGENTS.md` 文件，为我的研究智能体提供了一些额外的提示。你可以[在这里查看](https://github.com/simonw/research/blob/b059108dfefeb05a48e1c27f7a127dc9fd648129/AGENTS.md)。

#### 当然，这完全是粗制滥造 [#](/2025/Nov/6/async-code-research/#this-is-total-slop-of-course)

我对 [AI slop](https://simonwillison.net/2024/May/8/slop/)（AI 垃圾内容）的首选定义是：未经人工审核就发布的 AI 生成内容。我自己并没有非常仔细地审核这些报告，通常也不会在没有认真编辑和验证的情况下将它们发布到网上。

不过，我想分享我正在使用的这种模式，所以我决定将它们隔离在这个公开的 `simonw/research` 仓库中。

给 GitHub 提一个小小的功能请求：我希望能够将仓库标记为"从搜索引擎索引中排除"，这样它就会被添加 `<meta name=\"robots\" content=\"noindex\">` 标签。我仍然希望将 AI 生成的内容排除在搜索之外，以避免为[死亡互联网](https://en.wikipedia.org/wiki/Dead_Internet_theory)贡献更多内容。

#### 亲自尝试一下 [#](/2025/Nov/6/async-code-research/#try-it-yourself)

开始尝试这种编程智能体研究模式非常简单。创建一个免费的 GitHub 仓库（公开或私有），然后让一些智能体在上面自由发挥，看看会发生什么。

你可以在本地运行智能体，但我发现异步智能体更方便——特别是我可以运行它们（或从手机上触发它们），而不用担心它们会损坏我自己的机器或泄露我的任何私人数据。

Claude Code for web 在限定时间内（截至 2025 年 11 月 18 日）为其每月 20 美元的用户提供[免费的 250 美元额度](https://support.claude.com/en/articles/12690958-claude-code-promotion)。Gemini Jules 有[免费层级](https://jules.google/docs/usage-limits/)。还有很多其他编程智能体可以尝试。

如果你的研究智能体带回了什么有趣的东西，请告诉我！
