---
title: "611 - 《AI 羊毛 02：Antigravity、AI Studio、Cerebras、IFlow、Poe、Github Copilot》"
date: 2025-12-02
url: https://sorrycc.com/ai-wool-02-antigravity-ai-studio-cerebras-iflow-poe-github-copilot
---

发布于 2025年12月2日

# 611 - 《AI 羊毛 02：Antigravity、AI Studio、Cerebras、IFlow、Poe、Github Copilot》

![](https://pic.sorrycc.com/proxy/1764650519285-132733319.png)

整理下在用的免费 AI 模型服务，均可通过 API 的方式使用，并且可以在 Neovate Code 里使用。

## Antigravity

[Antigravity](https://antigravity.google/) IDE 可以免费用 Gemini 3 Pro、Sonnet 4.5、Opus 4.5 等，只要有 google 账号即可，没有 google 账号的可参考 [609 - 《AI 羊毛 01：Google 学生、Google 账号、ChatGPT Team》](https://sorrycc.com/ai-yang-mao-01) 注册一个。

你可以通过 2api 把 Antigravity 转成 api 使用，同时 Neovate Code 也支持 Antigravity 作为 Provider，直接 `/login` 选 Antigravity 即可。

![](https://pic.sorrycc.com/proxy/1764645013336-832330371.png)

## AI Studio

> Deprecated. AI Studio 只能用很差的模型了。

还是 Google，AI Studio 可以创建免费的 API Key，可用于 Gemini 2.5 系列的 Pro 和 Flash，不支持 Gemini 3 。他有 Rate Limit，所以得多搞点 API Key。一个 Google 账号可以创建 10 个项目，每个项目创建一个 API Key。然后多几个 Google 账号，搞个 40-50 个 API Key，基本就可以 Google API 自由了。

同时 Neovate Code 支持多 apiKey 轮询调用，如果你的 apiKey 里包含「,」，则会轮询调用。

附 Gemini + Neovate Code 手把手步骤：

1、访问 [https://aistudio.google.com/api-keys](https://aistudio.google.com/api-keys) 创建 10 个 api key 分别对应 10 个项目  
2、收集 key，以逗号分隔，比如「a,b,c」  
3、执行 neovate /login，选择 google，粘贴 key，回车  
4、执行 neovate -m gemini，用 gemini 2.5 pro 模型跑。

## Cerebras

[Cerebras](https://cerebras.ai/) 可实现 glm-4.6 自由。

Cerebras 的 glm-4.6 很快，多用 gmail 账号注册几个，然后 `neovate /login` 后选 cerebras 时，用「,」分隔，跳 rate limit，做一些简单的任务还是很好用的。比如用于 Commit 和简单任务的执行。

![](https://pic.sorrycc.com/proxy/1764650404734-317771293.png)

## IFlow

[iFlow](https://iflow.cn/) 支持[大多国产模型](https://platform.iflow.cn/models)，但最新的没有跟进，包括 Qwen 3 Coder Plus、Qwen 3 Max、GLM 4.6、DeepSeek 3.2 Exp 等。实测 Qwen 3 系列的速度比较快，Kimi 2 的速度比较慢。

缺点是 API Key 7 天需要重置一次，想一劳永逸可以把请求的 curl 复制下来，然后定期跑和更新（他们的 Session Cookie 失效时间好像很长）。

![](https://pic.sorrycc.com/proxy/1764649576692-827359607.png)

## Poe

[Poe](https://poe.com/) 一个账号 3000 credit 一天，比较少，得多开点账号，但聊胜于无。

![](https://pic.sorrycc.com/proxy/1764650350731-822662177.png)

## Github Copilot

如果你有参与开源，Github 每个月会送你 Pro 权限。这里的额度也可通过 API 的方式使用，Neovate Code 也支持 Github Copilot 的登录。注意要在 [https://github.com/settings/copilot/features](https://github.com/settings/copilot/features) 下把相关模型 Enable 下。
