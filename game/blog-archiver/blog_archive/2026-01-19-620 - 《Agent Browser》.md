---
title: "620 - 《Agent Browser》"
date: 2026-01-19
url: https://sorrycc.com/agent-browser
---

发布于 2026年1月19日

# 620 - 《Agent Browser》

> 昨晚用了下 Agent browser，感觉还是挺惊艳的，做下记录。他可以把现有的浏览器给利用起来。开一个 remote port 的端口，启动之后，就可以用这个库来连接它，并且做相应的控制。然后背后去接大模型，就能够通过 AI 去控制你现有的浏览器去做很多的事情。

![AI 与浏览器的连接桥梁](https://pic.sorrycc.com/proxy/1768746027063-592762344.png)

1、[Agent Browser](https://github.com/vercel-labs/agent-browser) 是由 Vercel Labs 开发的一款专为 AI Agent 设计的浏览器自动化 CLI 工具。

基于 Rust 构建，专为 AI 设计。它会输出页面的「可访问性树」（Accessibility Tree，简单理解就是页面结构的精简版，只保留按钮、链接、输入框等可交互元素），并为每个元素生成唯一引用（如 @e2），这样 AI 就能准确地说「点击 @e2」而不是模糊地描述位置。

![UI 到可访问性树的转换](https://pic.sorrycc.com/proxy/1768746044970-851501281.png)

它是连接 AI Agent 与浏览器的桥梁，让 AI 能够像人一样浏览网页、点击按钮、填写表单。

2、快速上手。

安装。

```bash
npm install -g agent-browser
agent-browser install
```

基本工作流。

Step 1：打开页面并获取快照

```bash
agent-browser open https://example.com
agent-browser snapshot
```

快照会生成页面的可访问性树，每个元素都有唯一引用（如 @e2、@e5）。

Step 2：与元素交互

```bash
# 点击元素
agent-browser click @e2
```

```bash
# 填写输入框
agent-browser fill @e5 "Hello World"
```

3、使用本地 Google Chrome。

为什么要用本地 Chrome 而不是 Agent Browser 自带的浏览器？因为自带的是个干净的浏览器实例，没有登录状态、没有 Cookie、没有你的账号信息。而很多自动化场景需要「已登录」的状态，比如让 AI 帮你发推、管理 GitHub Issues、操作内部系统等。

Agent Browser 支持通过 Chrome DevTools Protocol (CDP) 连接到已运行的浏览器实例。我专门为此备了几个 Chrome 实例，把常用账号登上去，让 AI 可以直接操作这些已登录的会话。

![带有登录状态的本地浏览器配置](https://pic.sorrycc.com/proxy/1768746068420-863088488.png)

以 macOS 为例。

```bash
# 启动带调试端口的 Chrome，指定独立的用户数据目录
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/path/to/your/ChromeProfile

# Agent Browser 连接
agent-browser --cdp 9222
```

4、SKILLS。

他有提供 skills，如果你用 [Neovate Code](https://github.com/neovateai/neovate-code/) 可通过以下命令一键添加。

```bash
neovate skill add https://github.com/vercel-labs/agent-browser/tree/main/skills
```

然后要求 AI 用这个 skill 去做自动化的事情，比如获取 hackernews 上最新 ai 相关的内容。

```markdown
Use agent-browser skill to fetch and summarize
AI-related top stories from Hacker News:

1. Open https://news.ycombinator.com/
2. Extract the top 30 stories including:
- Title
- URL (link)
- Source domain
- Points (upvotes)
- Time posted
- Comment count

3. Filter results to show only AI-related stories
(identify by keywords: AI, LLM, Cursor, Langfuse, FLUX,
machine learning, generative AI, etc.)

4. For each AI-related story, visit the link URL
and generate a brief summary (2-3 sentences) of the
article content.

5. Display in format:
**Title**
source.com • X points • time ago
https://url.com
> Summary: Brief summary of the article content
```

结果如下。

![](https://pic.sorrycc.com/proxy/1768734863946-520358538.png)

或者打开 gmail 发一封邮件。

![](https://pic.sorrycc.com/proxy/1768738034498-637153075.png)

5、接入 undetected\_chromedriver，用于灰色地带场景。

有些网站会检测自动化工具（比如 Selenium、Puppeteer），一旦发现就拒绝访问或触发验证码。[undetected\_chromedriver](https://github.com/ultrafunkamsterdam/undetected-chromedriver) 可以绕过这些检测，适用于反爬、自动注册账号等场景。

用法：开启 remote debug port 启动，然后让 Agent Browser 连接即可。

```bash
uv run python -c "
import undetected_chromedriver as uc
options = uc.ChromeOptions()
options.add_argument('--user-data-dir=/path/to/your/ChromeProfiles')
options.add_argument('--profile-directory=Default')
driver = uc.Chrome(options=options, port=9222)
driver.get('https://google.com')
input('Browser running on port 9222. Press Enter to quit...')
driver.quit()
"
```

参考：  
[https://github.com/vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)  
[https://agent-browser.dev/](https://agent-browser.dev/)  
[https://github.com/ultrafunkamsterdam/undetected-chromedriver](https://github.com/ultrafunkamsterdam/undetected-chromedriver)
