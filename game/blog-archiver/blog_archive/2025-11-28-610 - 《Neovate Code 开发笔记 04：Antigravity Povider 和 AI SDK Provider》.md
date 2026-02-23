---
title: "610 - 《Neovate Code 开发笔记 04：Antigravity Povider 和 AI SDK Provider》"
date: 2025-11-28
url: https://sorrycc.com/neovate-code-04-antigravity-provider-and-ai-sdk-provider
---

发布于 2025年11月28日

# 610 - 《Neovate Code 开发笔记 04：Antigravity Povider 和 AI SDK Provider》

![](https://pic.sorrycc.com/proxy/1764596727455-547855314.png)

Google 的 Antigravity 比较大气，提供 Gemini 3 Pro 和 Sonnet 4.5 免费用。就想着能否把他接到 Neovate Code 里。

这种 Provider 加起来有点在规则边缘，社区其实褒贬不一。比如 Roo Code 的作者会拒绝加 Claude Code 的，因为会违反 [Anthropic 的规则](https://www.anthropic.com/legal/consumer-terms)。而 opencode 作者就比较赞同，加了 Claude Code 和 Github Copilot 的，ChatWise 里也有 Github Copilot 的 Provider 。

然后在社区看到 [https://github.com/liuw1535/antigravity2api-nodejs](https://github.com/liuw1535/antigravity2api-nodejs) ，于是就尝试做接入。但这个项目的思路是提供 OpenAI 兼容接口的 Server 的思路，Neovate Code 则无需这么麻烦，直接请求时转格式即可，无需加一个 Server 这么麻烦。

至于这个库是怎么逆向 Antigravity 的实现的，作者在 [issue](https://github.com/liuw1535/antigravity2api-nodejs/issues/7) 里也有回复，用抓包软件，同时给抓包软件设置一个科学上网的流量出口，比如 v2rayn 的 [http://127.0.0.1:10808](http://127.0.0.1:10808) 。

获取 access\_token 的逻辑比较简单，起一个 server，让用户自己访问 antigravity 的授权页面同时 callback 地址是这个 server，成功后 server 会收到请求，然后记录 access\_token 。

复杂的是请求的转换。

由于 Neovate Code 用的 ai sdk，复杂性又多了一层，我之前还没写过 ai sdk 的 provider，都是用现成的。

最早的思路是用 openai-compatible 的 provider，自定义 fetch，在这里做数据的来回转换，直到遇到 [thought-signatures](https://ai.google.dev/gemini-api/docs/thought-signatures) 的问题。他需要把上一次请求里 tool\_call 的 thought-signatures 带到下一轮的请求，而 openai-compatible 的 provider 里又似乎写死了这一点，然后卡壳了好一会。

然后决定用彻底解，不用 openai-compatible 的 provider，自己写一个。简单看了下 [https://github.com/vercel/ai/blob/main/packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts](https://github.com/vercel/ai/blob/main/packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts) ，基本就理解思路了，provider 需要返回一个 LanguageModelV2 的实现，Model 的实现如下（注：Neovate Code 只需要流式的实现）。

```ts
export class CustomModel implements LanguageModelV2 {
  constructor() {}
  doStream() {
    const { value: response } = await postJsonToApi({});
    const stream = response.pipeThrough(new TransformStream({
      start(controller) {}
      transform(chunk, controller) {}
      flush(controller) {}
    }));
    return { stream };
  }
}
```

其中 postJsonToApi 是用于向 API 发送 JSON 格式数据的 HTTP POST 请求的封装函数，背后调 postToApi，代码见 [https://github.com/vercel/ai/blob/main/packages/provider-utils/src/post-to-api.ts](https://github.com/vercel/ai/blob/main/packages/provider-utils/src/post-to-api.ts) ，通过 failedResponseHandler 和 successfulResponseHandler 参数分别处理失败和成功响应。同时 ai sdk 提供了 createJsonResponseHandler、createEventSourceResponseHandler、createJsonStreamResponseHandler 和 createBinaryResponseHandler 分别用于不同场景的响应处理，这里是流式，所以用 createJsonStreamResponseHandler 。

最后是提了一个库处理 antigravity 和 github-copilot 这种非官方的 provider 的 token 获取、刷新和格式转换，commit 见 [https://github.com/neovateai/neovate-code/commit/b3913e2e8ed33d4bff5cda0108c5617e5350151f](https://github.com/neovateai/neovate-code/commit/b3913e2e8ed33d4bff5cda0108c5617e5350151f) 。效果见下图。

![](https://pic.sorrycc.com/proxy/1764343563541-794322300.png)

后续看时间和需求，应该还会增加 anthropic、amazon q2 等奇奇怪怪的 provider 。

参考：  
[https://github.com/liuw1535/antigravity2api-nodejs](https://github.com/liuw1535/antigravity2api-nodejs)  
[https://github.com/vercel/ai/blob/main/packages/provider-utils/](https://github.com/vercel/ai/blob/main/packages/provider-utils/)  
[https://github.com/vercel/ai/blob/main/packages/openai-compatible/](https://github.com/vercel/ai/blob/main/packages/openai-compatible/)  
[https://github.com/sst/openauth](https://github.com/sst/openauth)  
[https://github.com/sst/opencode-anthropic-auth](https://github.com/sst/opencode-anthropic-auth)  
[https://github.com/sst/opencode-copilot-auth](https://github.com/sst/opencode-copilot-auth)  
[https://github.com/Wei-Shaw/claude-relay-service/blob/main/src/services/claudeAccountService.js](https://github.com/Wei-Shaw/claude-relay-service/blob/main/src/services/claudeAccountService.js)  
[https://ai-sdk.dev/providers/community-providers/custom-providers](https://ai-sdk.dev/providers/community-providers/custom-providers)
