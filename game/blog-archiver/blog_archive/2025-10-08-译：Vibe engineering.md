---
title: "译：Vibe engineering"
date: 2025-10-08
url: https://sorrycc.com/vibe-engineering
---

发布于 2025年10月8日

# 译：Vibe engineering

> 原文： [https://simonwillison.net/2025/Oct/7/vibe-engineering/](https://simonwillison.net/2025/Oct/7/vibe-engineering/)  
> 作者： Simon Willison  
> 译者： Gemini 2.5 Pro

7th October 2025

I feel like **vibe coding** is [pretty well established now](https://simonwillison.net/2025/Mar/19/vibe-coding/) as covering the fast, loose and irresponsible way of building software with AI—entirely prompt-driven, and with no attention paid to how the code actually works. This leaves us with a terminology gap: what should we call the other end of the spectrum, where seasoned professionals accelerate their work with LLMs while staying proudly and confidently accountable for the software they produce?

我感觉 **vibe coding** 这个词现在已经[深入人心](https://simonwillison.net/2025/Mar/19/vibe-coding/)了，它指的是那种用 AI 构建软件的快速、松散且不负责任的方式——完全由 prompt 驱动，根本不关心代码的实际工作原理。这就给我们留下了一个术语上的空白：我们该如何称呼光谱的另一端，即经验丰富的专业人士利用 LLM 加速他们的工作，同时又自豪而自信地对自己生产的软件负责？

I propose we call this **vibe engineering**, with my tongue only partially in my cheek.

我建议称之为 **vibe engineering**，这不完全是个玩笑。

One of the lesser spoken truths of working productively with LLMs as a software engineer on non-toy-projects is that it’s _difficult_. There’s a lot of depth to understanding how to use the tools, there are plenty of traps to avoid, and the pace at which they can churn out working code raises the bar for what the human participant can and should be contributing.

作为软件工程师，在非玩具项目上高效地使用 LLM，一个不常被提及的真相是：这很_难_。理解如何使用这些工具需要很深的功力，有许多陷阱需要避开，而且它们生成可用代码的速度，也提高了对人类参与者能够以及应该贡献什么的门槛。

The rise of **coding agents**—tools like [Claude Code](https://www.claude.com/product/claude-code) (released February 2025), OpenAI’s [Codex CLI](https://github.com/openai/codex) (April) and [Gemini CLI](https://github.com/google-gemini/gemini-cli) (June) that can iterate on code, actively testing and modifying it until it achieves a specified goal, has dramatically increased the usefulness of LLMs for real-world coding problems.

**coding agents** 的兴起——像 [Claude Code](https://www.claude.com/product/claude-code)（2025年2月发布）、OpenAI 的 [Codex CLI](https://github.com/openai/codex)（4月）和 [Gemini CLI](https://github.com/google-gemini/gemini-cli)（6月）这类工具，它们可以迭代代码，主动测试和修改，直到实现指定目标——极大地增强了 LLM 在解决真实世界编程问题时的实用性。

I’m increasingly hearing from experienced, credible software engineers who are running multiple copies of agents at once, tackling several problems in parallel and expanding the scope of what they can take on. I was skeptical of this at first but [I’ve started running multiple agents myself now](https://simonwillison.net/2025/Oct/5/parallel-coding-agents/) and it’s surprisingly effective, if mentally exhausting!

我越来越多地听到，那些经验丰富、值得信赖的软件工程师，正在同时运行多个 agent 副本，并行处理多个问题，并扩展了他们能承担的工作范围。起初我对此持怀疑态度，但[现在我自己也开始运行多个 agent 了](https://simonwillison.net/2025/Oct/5/parallel-coding-agents/)，结果出奇地有效，尽管精神上很累！

This feels very different from classic vibe coding, where I outsource a simple, low-stakes task to an LLM and accept the result if it appears to work. Most of my [tools.simonwillison.net](https://simonwillison.net/) collection ([previously](https://simonwillison.net/2025/Sep/4/highlighted-tools/)) were built like that. Iterating with coding agents to produce production-quality code that I’m confident I can maintain in the future feels like a different process entirely.

这与经典的 vibe coding 感觉非常不同。在 vibe coding 中，我把一个简单的、风险不大的任务外包给 LLM，如果结果看起来能用，我就接受了。我的 [tools.simonwillison.net](https://simonwillison.net/) 工具集（[之前的文章](https://simonwillison.net/2025/Sep/4/highlighted-tools/)）大部分都是这样构建的。而与 coding agents 一起迭代，产出我自信未来可以维护的生产级代码，感觉完全是另一个过程。

It’s also become clear to me that LLMs actively reward existing top tier software engineering practices:

我也越来越清楚地认识到，LLM 会主动奖励那些已有的顶尖软件工程实践：

*   **Automated testing**. If your project has a robust, comprehensive and stable test suite agentic coding tools can _fly_ with it. Without tests? Your agent might claim something works without having actually tested it at all, plus any new change could break an unrelated feature without you realizing it. Test-first development is particularly effective with agents that can iterate in a loop.
*   **自动化测试**。如果你的项目有一套健壮、全面且稳定的测试套件，agentic coding 工具就能如虎添翼。没有测试？你的 agent 可能会声称某样东西能工作，但实际上根本没测试过，而且任何新的改动都可能在你不知不觉中破坏一个不相关的功能。测试先行开发对于可以循环迭代的 agent 尤其有效。
*   **Planning in advance**. Sitting down to hack something together goes much better if you start with a high level plan. Working with an agent makes this even more important—you can iterate on the plan first, then hand it off to the agent to write the code.
*   **提前规划**。如果你想坐下来快速搞点东西，从一个高层次的计划开始会顺利得多。与 agent 合作时，这一点甚至更重要——你可以先迭代计划，然后再把它交给 agent 去写代码。
*   **Comprehensive documentation**. Just like human programmers, an LLM can only keep a subset of the codebase in its context at once. Being able to feed in relevant documentation lets it use APIs from other areas without reading the code first. Write good documentation first and the model may be able to build the matching implementation from that input alone.
*   **全面的文档**。就像人类程序员一样，LLM 一次只能在其上下文中保留代码库的一个子集。能够提供相关文档让它可以在不先阅读代码的情况下使用其他领域的 API。先写好文档，模型或许仅凭这些输入就能构建出相应的实现。
*   **Good version control habits**. Being able to undo mistakes and understand when and how something was changed is even more important when a coding agent might have made the changes. LLMs are also fiercely competent at Git—they can navigate the history themselves to track down the origin of bugs, and they’re better than most developers at using [git bisect](https://til.simonwillison.net/git/git-bisect). Use that to your advantage.
*   **良好的版本控制习惯**。当改动可能由 coding agent 做出时，能够撤销错误并理解某项改动是在何时以及如何发生的，就变得更加重要。LLM 对 Git 的掌握也异常出色——它们可以自己浏览历史记录来追溯 bug 的源头，而且在使用 [git bisect](https://til.simonwillison.net/git/git-bisect) 方面比大多数开发者都强。要利用好这一点。
*   Having **effective automation** in place. Continuous integration, automated formatting and linting, continuous deployment to a preview environment—all things that agentic coding tools can benefit from too. LLMs make writing quick automation scripts easier as well, which can help them then repeat tasks accurately and consistently next time.
*   拥有**有效的自动化**。持续集成、自动化格式化和代码检查、持续部署到预览环境——所有这些 agentic coding 工具也都能从中受益。LLM 也让编写快速自动化脚本变得更容易，这反过来又能帮助它们在下一次准确一致地重复任务。
*   A **culture of code review**. This one explains itself. If you’re fast and productive at code review you’re going to have a much better time working with LLMs than if you’d rather write code yourself than review the same thing written by someone (or something) else.
*   **代码审查的文化**。这一点不言自明。如果你在 code review 方面既快速又高效，那么与 LLM 合作时你会过得愉快得多；反之，如果你宁愿自己写代码，也不愿审查别人（或别的东西）写的同样的东西，那情况就不同了。
*   A **very weird form of management**. Getting good results out of a coding agent feels uncomfortably close to getting good results out of a human collaborator. You need to provide clear instructions, ensure they have the necessary context and provide actionable feedback on what they produce. It’s a _lot_ easier than working with actual people because you don’t have to worry about offending or discouraging them—but any existing management experience you have will prove surprisingly useful.
*   一种**非常奇怪的管理形式**。从 coding agent 那里获得好结果，感觉上与从人类合作者那里获得好结果非常相似。你需要提供清晰的指令，确保它们拥有必要的上下文，并对它们产出的东西提供可操作的反馈。这比与真人合作要容易_得多_，因为你不用担心冒犯或打击到他们——但你已有的任何管理经验都会出奇地有用。
*   Really good **manual QA (quality assurance)**. Beyond automated tests, you need to be really good at manually testing software, including predicting and digging into edge-cases.
*   非常出色的**手动 QA（质量保证）**。除了自动化测试，你还需要非常擅长手动测试软件，包括预测和深挖各种边缘情况。
*   Strong **research skills**. There are dozens of ways to solve any given coding problem. Figuring out the best options and proving an approach has always been important, and remains a blocker on unleashing an agent to write the actual code.
*   强大的**研究能力**。任何一个编程问题都有几十种解决方法。找出最佳方案并验证一种方法的可行性一直都很重要，并且这仍然是释放 agent 去写实际代码之前的一个障碍。
*   The ability to **ship to a preview environment**. If an agent builds a feature, having a way to safely preview that feature (without deploying it straight to production) makes reviews much more productive and greatly reduces the risk of shipping something broken.
*   能够**部署到预览环境**。如果一个 agent 构建了一个功能，有一种安全地预览该功能（而不是直接部署到生产环境）的方法，会让审查过程更高效，并大大降低发布损坏产品的风险。
*   An instinct for **what can be outsourced** to AI and what you need to manually handle yourself. This is constantly evolving as the models and tools become more effective. A big part of working effectively with LLMs is maintaining a strong intuition for when they can best be applied.
*   对于**什么可以外包给 AI**，什么需要自己手动处理，有一种直觉。随着模型和工具变得越来越有效，这一点在不断演变。高效使用 LLM 的一个重要部分，就是对何时最适合应用它们保持敏锐的直觉。
*   An updated **sense of estimation**. Estimating how long a project will take has always been one of the hardest but most important parts of being a senior engineer, especially in organizations where budget and strategy decisions are made based on those estimates. AI-assisted coding makes this _even harder_—things that used to take a long time are much faster, but estimations now depend on new factors which we’re all still trying to figure out.
*   更新过的**估算感觉**。估算一个项目需要多长时间，一直以来都是作为一名高级工程师最困难但最重要的部分之一，尤其是在那些预算和战略决策都基于这些估算的组织里。AI 辅助编程让这件事变得_更加困难_——过去需要很长时间的事情现在快了很多，但估算现在依赖于一些我们都还在摸索的新因素。

If you’re going to really exploit the capabilities of these new tools, you need to be operating _at the top of your game_. You’re not just responsible for writing the code—you’re researching approaches, deciding on high-level architecture, writing specifications, defining success criteria, [designing agentic loops](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/), planning QA, managing a growing army of weird digital interns who will absolutely cheat if you give them a chance, and spending _so much time on code review_.

如果你真的想利用这些新工具的能力，你需要让自己处在_最佳状态_。你不仅仅是负责写代码——你还要研究方法、决定高层架构、编写规范、定义成功标准、[设计 agentic loops](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/)、规划 QA、管理一支不断壮大的、只要有机会就绝对会作弊的奇怪数字实习生大军，并且要花_大量时间在 code review 上_。

Almost all of these are characteristics of senior software engineers already!

几乎所有这些，都已经是高级软件工程师的特质了！

AI tools **amplify existing expertise**. The more skills and experience you have as a software engineer the faster and better the results you can get from working with LLMs and coding agents.

AI 工具**放大了已有的专业能力**。作为一名软件工程师，你拥有的技能和经验越多，你与 LLM 和 coding agents 合作得到的结果就越快、越好。

#### 真的是 “Vibe engineering” 吗？ [#](https://simonwillison.net/2025/Oct/7/vibe-engineering/#-vibe-engineering-really-)

Is this a stupid name? Yeah, probably. “Vibes” as a concept in AI feels a little tired at this point. “Vibe coding” itself is used by a lot of developers in a dismissive way. I’m ready to reclaim vibes for something more constructive.

这个名字很蠢吗？是的，可能吧。“Vibes” 作为 AI 领域的一个概念，到如今感觉有点让人厌倦了。“Vibe coding” 本身也被很多开发者以一种轻蔑的方式使用。我准备为 “vibes” 正名，用它来做一些更有建设性的事情。

I’ve never really liked the artificial distinction between “coders” and “engineers”—that’s always smelled to me a bit like gatekeeping. But in this case a bit of gatekeeping is exactly what we need!

我从来都不太喜欢“coder”和“engineer”之间那种人为的区分——这对我来说总有点设门槛的味道。但在这种情况下，一点点的门槛正是我们所需要的！

**Vibe engineering** establishes a clear distinction from vibe coding. It signals that this is a different, harder and more sophisticated way of working with AI tools to build production software.

**Vibe engineering** 与 vibe coding 建立了一个清晰的区分。它表明这是一种不同的、更困难、也更复杂的，使用 AI 工具构建生产级软件的工作方式。

I like that this is cheeky and likely to be controversial. This whole space is still absurd in all sorts of different ways. We shouldn’t take ourselves too seriously while we figure out the most productive ways to apply these new tools.

我喜欢它的俏皮，也很可能引起争议。整个领域在各种方面仍然是荒谬的。在我们摸索如何最有效地应用这些新工具时，我们不应该把自己看得太重。

I’ve tried in the past to get terms like **[AI-assisted programming](https://simonwillison.net/tags/ai-assisted-programming/)** to stick, with approximately zero success. May as well try rubbing some vibes on it and see what happens.

我过去曾试图让像 **[AI-assisted programming](https://simonwillison.net/tags/ai-assisted-programming/)** 这样的术语流行起来，但基本上没成功。不如给它加上点 vibes，看看会发生什么。

I also really like the clear mismatch between “vibes” and “engineering”. It makes the combined term self-contradictory in a way that I find mischievous and (hopefully) sticky.

我也很喜欢“vibes”和“engineering”之间明显的反差。这使得这个组合词本身就自相矛盾，我觉得这很有趣，也（希望）能让人记住。
