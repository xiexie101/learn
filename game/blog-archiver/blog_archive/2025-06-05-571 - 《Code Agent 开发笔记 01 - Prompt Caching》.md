---
title: "571 - 《Code Agent 开发笔记 01 - Prompt Caching》"
date: 2025-06-05
url: https://sorrycc.com/code-agent-01-prompt-caching
---

发布于 2025年6月5日

# 571 - 《Code Agent 开发笔记 01 - Prompt Caching》

Prompt Caching 是省钱（Token）和提升 AI 响应速度的必须要考虑的一点。 很多人可能会忽略，但是它很重要。

1、如何验证 Prompt Caching？两个思路，1）看 token 消耗，2）在执行速度。

比如。在 OpenRouter 上看消耗。开启 Prompt Caching 之后，相同的 Prompt 执行，第一次和第 N 次在 OpenRouter 上的消耗差异。

![](https://cdn.jsdelivr.net/gh/sorrycc-bot/image-2025-04@main/uPic/bidlAc.png)

![](https://cdn.jsdelivr.net/gh/sorrycc-bot/image-2025-04@main/uPic/6eUfee.png)

2、Caching 有最少 token 要求。Gemini 2.5 Pro 2048 tokens，Gemini 2.5 Flash 1024 tokens，Claude Sonnet 和 Opus 1024 tokens，Openai 1024 tokens，DeepSeek 64 tokens。

3、开启方法看 Provider 。Claude 通过给每个 message 加 `cache_control: {"type": "ephemeral"}` 实现；Gemini 有 caching 的 CURD 操作，但是通过 openrouter 的可以用 Claude 的方法进行设置，再但是通过 openai 库调用的时候又需要设置额外的头即可，再但是通过 [@ai-sdk/google](https://ai-sdk.dev/providers/ai-sdk-providers/openai#prompt-caching) 开启只要配个 key 即可，各种简化和封装；OpenAI 和 DeepSeek 都是隐式的，默认开启。

4、Caching 有时间限制的。比如 Claude 的是 5min，所以可能需要做下保活。

5、某些场景下做下 System Prompt 的 prefetch 可以提高后续任务的速度。

6、要做 Prompt Caching 就有一些要注意的地方。比如要拆分 Prompt 以增加缓存命中率，比如要让 system prompt 等需要缓存的 prompt 保持稳定，比如要考虑跨 session 和 conversation 的 Caching。

参考：  
[https://aider.chat/docs/usage/caching.html](https://aider.chat/docs/usage/caching.html)  
[https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)  
[https://openrouter.ai/docs/features/prompt-caching](https://openrouter.ai/docs/features/prompt-caching)  
[https://ai.google.dev/gemini-api/docs/caching](https://ai.google.dev/gemini-api/docs/caching)  
[https://platform.openai.com/docs/guides/prompt-caching](https://platform.openai.com/docs/guides/prompt-caching)  
[https://api-docs.deepseek.com/guides/kv\_cache](https://api-docs.deepseek.com/guides/kv_cache)  
[https://docs.roocode.com/providers/openrouter](https://docs.roocode.com/providers/openrouter)  
[https://ai-sdk.dev/providers/ai-sdk-providers/openai#prompt-caching](https://ai-sdk.dev/providers/ai-sdk-providers/openai#prompt-caching)  
[553 - 《调研 Aider》](https://sorrycc.com/aider)
