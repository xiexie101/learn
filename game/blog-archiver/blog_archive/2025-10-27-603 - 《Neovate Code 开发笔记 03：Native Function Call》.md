---
title: "603 - 《Neovate Code 开发笔记 03：Native Function Call》"
date: 2025-10-27
url: https://sorrycc.com/neovate-code-02-native-function-call
---

发布于 2025年10月27日

# 603 - 《Neovate Code 开发笔记 03：Native Function Call》

刚把 Neovate Code 的 Function Call 实现[切回原生的了](https://github.com/neovateai/neovate-code/pull/352)，简单做下记录。

1、关于二者的区别，可以看我用 Gemini Deep Research 的文章。

[https://docs.google.com/document/d/1oeaeFO1IphIMv4T\_JcVsuRcuQ2UQpka7cdKNKLK4etM/edit?usp=sharing](https://docs.google.com/document/d/1oeaeFO1IphIMv4T_JcVsuRcuQ2UQpka7cdKNKLK4etM/edit?usp=sharing)

2、Neovate Code 之前是用的结构化输出的方式做 Function Call，背景参考 [572 - 《Code Agent 开发笔记 02 - 一个 Response 里返回 Content + Tool》](https://sorrycc.com/code-agent-02-content-tool-in-one-response)，有几个考虑，1）支持一个 Response 里流式返回 Content + Tool，当时觉得这个 feature 挺重要的，但实际上并不重要… 2）兼容老的模型，那会内网部署的模型有些是不支持 Native Function Call 的，比如那会国内部署的 DeepSeek 3 仅有几家有对 Function Call 做支持，3）同时觉得 Structure Output 的方式应该是通用的，那会的开源方案 Cline 也是这种方式（现在不清楚）。

3、但是，实际应用下来有不少问题。

1）主要是幻觉问题，用 XML 的方式做结构化输出的要求，模型的返回有时候就会缺胳膊少腿，所有有了各种 [jsonrepair](https://www.google.com/search?ie=UTF-8&q=jsonrepair&gws_rd=cr,ssl&fg=1) 的方案，但是只能解一部分问题，日常答疑还是大量 tool\_use 的格式解析问题，聪明的 sonnet 模型也会出现这个问题。

2）消息尺寸也会更大一些。

3）对接社区库时的不变，比如 ai 和 @openai/agents 等都是用的 native function call，要切成 structure output 的方式，需要自行处理这部分，以及做格式的转换，以及自己对接 mcp 层的处理等，多了很多不必要的复杂度。

4）不够面向未来。时移世易，现在 Native Function Call 是模型的标配。

4、所以，切到 native function call 了。

实现由于基于 ai@5，用他的全套方案就好了。[pr](https://github.com/neovateai/neovate-code/pull/352) 看着比较大，实际是在处理各种格式的转换，以便 Neovate Code 可以渐进式地切过去。

参考：  
[572 - 《Code Agent 开发笔记 02 - 一个 Response 里返回 Content + Tool》](https://sorrycc.com/code-agent-02-content-tool-in-one-response)  
[https://community.openai.com/t/difference-between-structured-outputs-and-function-calling-required/937697/4](https://community.openai.com/t/difference-between-structured-outputs-and-function-calling-required/937697/4)
