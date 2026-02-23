---
title: "516 - 《AI Notes：DeepSeek-R1》"
date: 2025-01-24
url: https://sorrycc.com/ai-notes-deepseek-r1
---

发布于 2025年1月24日

# 516 - 《AI Notes：DeepSeek-R1》

1、什么是 DeepSeek-R1？

DeepSeek-R1 是推理模型。在给出最终答案之前，该模型首先会生成一个思维链（CoT），以提高回答的准确性。

参考：  
[Reasoning Model (deepseek-reasoner) | DeepSeek API Docs](https://api-docs.deepseek.com/guides/reasoning_model)  
[DeepSeek-R1 发布，性能对标 OpenAI o1 正式版](https://mp.weixin.qq.com/s/atKyfC5l-BaStje8-F3FGQ)

2、定价。

相比 ChatGPT 的 o1-mini、o1-preview 和 o1 都便宜很多。

DeepSeek-R1 API 服务定价为每百万输入 tokens 1 元（缓存命中）/ 4 元（缓存未命中），每百万输出 tokens 16 元。

![](https://tcc.sorrycc.com/p/8d635d76-9630-4f79-92ac-0d74145c5f82.png)

3、API。

1）model 声明为 deepseek-reasoner  
2）然后用 reasoning\_content 拿思考结果

4、使用场景。

1）需要深度逻辑推理、多步推导或链式思考（CoT）的任务，例如数学问题求解、法律分析、医学诊断等。  
2）对实时性要求不高，因为加了推理后，响应时间会相对较长。  
3）。

5、本地使用。

> 除 CodeGPT 外，也可用 [OpenWebUI](https://github.com/open-webui/open-webui) 或 [ChatBox](https://github.com/Bin-Huang/chatbox) 或 [ChatWise](https://chatwise.app?atp=sorrycc) 或 [Cherry Studio](https://github.com/CherryHQ/cherry-studio)。

0）先在 [https://tools.thinkinai.xyz](https://tools.thinkinai.xyz) 评估下自己的电脑可以跑什么量级的模型  
1）Cursor 或 VSCode 里安装 [CodeGPT](https://docs.codegpt.co/docs/tutorial-basics/installation)  
2）安装 [Ollama](https://ollama.com/)，然后执行 `ollama run deepseek-r1:1.5b`  
3）CodeGPT 里在「Local LLMs」里选「deepseek-r1」模型

![](https://tcc.sorrycc.com/p/66fc8afa-7b42-4b5e-a7fa-5b92b7675f76.png)

6、满血版

参考：  
[https://x.com/xiaokedada/status/1887732279642104172](https://x.com/xiaokedada/status/1887732279642104172)  
[522 - 《AI Tips（3）》](https://sorrycc.com/ai-tips-03)
