---
title: "285 - 《minicc 和 OpenAI embedding》"
date: 2023-04-07
url: https://sorrycc.com/minicc
---

发布于 2023年4月7日

# 285 - 《minicc 和 OpenAI embedding》

> 上周末刚习地的技能，感觉不写下来，这个知识点就要被遗忘了。

背景是写了个 minicc 的命令，接入在 Telegram 里。他的训练集里包含 90% 的日更文章里的内容，并且可以根据你的问题作出回答。效果图如下。

![](https://img.alicdn.com/imgextra/i4/O1CN0115urGW1gMfmxW4UO9_!!6000000004128-2-tps-1514-1810.png_1200x1200.jpg)

怎么实现的？分两步。

1、生成 embeddings 向量数据  
2、回答问题

提取了个最简可运行的代码如下，保存、填入 apiKey，安装 openai 和 @stdlib/blas 依赖，然后就可以跑了。如果顺利，他会回答你「Node is chicken.」。

```ts
import { Configuration, OpenAIApi } from "openai";
import ddot from '@stdlib/blas/base/ddot';
import assert from "assert";

const contents = [
  `what's javascript? javascript is egg.`,
  `what's node? node is chicken.`,
];
const question = 'what is node?';
const apiKey = ''; /* 替换成自己的 */

(async () => {
  const config = new Configuration({
    apiKey,
  });
  const openai = new OpenAIApi(config);

  // 1、Generate embedding map
  const embeddingsMap = new Map();
  const { data } = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: contents,
  });
  data.data.forEach((item, index) => {
    embeddingsMap.set(contents[index], item.embedding);
  });

  // 2、Ask and answer
  // 2.1、Generate question embedding
  const { data: questionData } = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: [question],
  });
  const questionEmbedding = questionData.data[0].embedding;
  // 2.2、Calculate cosine similarity
  const x = new Float64Array(questionEmbedding);
  const matched = Array.from(embeddingsMap.entries())
    .map(([k, v]) => {
      const y = new Float64Array(v);
      return {
        ddot: ddot(x.length, x, 1, y, 1),
        text: k,
      };
    })
    .sort((a, b) => b.ddot - a.ddot)
    .filter((k) => k.ddot > 0.8);
  assert(matched.length > 0, 'no matched content found');
  const mostSimilarContent = matched[0].text;
  // 2.3 Get the answer
  const prompt = `
Answer the question based on the context below, and if the question can't be answered based on the context, say "I don't know".

Context:
${mostSimilarContent}

Question:
${question}

Answer: 
  `;
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0,
  });
  const answer = completion?.data?.choices?.[0].message?.content;
  console.log(answer);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
```

生成 embeddings 向量数据就是调 openai 的 API，有几个要注意的点，1）token 数别超了，2）input 支持数组，可以批量传，具体限额忘了，所以别分开传，分开调 API 很容易触发每分钟的 API 请求数限制。

回答问题分三步，1）拿到问题的 embedding，2）和前面生成的 embedding 数据集做匹配，找到最匹配的，通常要 > 0.8，（注：此步不消耗 openai api），3）拼问题、背景知识，调 openai chat completion API 拿到最终回答。

由于是最简代码，所以对很多东西都做了简化。

一、内容压缩。由于 openai 对于 token 数的限制，这里还有个绕不开的问题是内容压缩，让内容尽可能少，但又能让 openai 识别出来。目前看下来有这些方案，

1、删除一些不必要的信息，比如做文章总结的话，可以把图片、链接、代码等都去掉  
2、替换中文标点为英文标点，全角到半角，标点部分可以省一半  
3、基于字词做提取，把重复出现的词用简单的词语代替，然后最后给一个映射表，openai 支持这种  
4、上一步中，如果内容为中文，需要做分词的，分词可以用 nodejieba 这个库  
5、太长的文章做分段处理，比如按 H2 切割

二、token 计算。token 计算会大量应用，比如用在 embeddings 计算上，太长就要做压缩或拆分，比如最后一步提问时，既要让 token 数不超，又要保证足够的 token 数给 openai 回答用。实现上可以用 @dqbd/tiktoken 这个库。

三、获取上下文内容。现在是用了最匹配的那项。但是通常是会把 > 0.8 都尽可能多的加上，只要不超限。上下文信息越多，后面回答问题时能给的答案会越准确。

参考：  
[openai-cookbook/Question\_answering\_using\_embeddings.ipynb at main · openai/openai-cookbook · GitHub](https://github.com/openai/openai-cookbook/blob/main/examples/Question_answering_using_embeddings.ipynb)  
[Web Q&A - OpenAI API](https://platform.openai.com/docs/tutorials/web-qa-embeddings)  
[如何让 ChatGPT 读懂超长保险条款？ - 知乎](https://zhuanlan.zhihu.com/p/613112156)  
[fibjs/ask.js at a80336feff7658c12d2556a8f2bf40dff139413f · fibjs/fibjs · GitHub](https://github.com/fibjs/fibjs/blob/a80336feff7658c12d2556a8f2bf40dff139413f/tools/ask.js)  
[fibjs/gen\_index.js at a80336feff7658c12d2556a8f2bf40dff139413f · fibjs/fibjs · GitHub](https://github.com/fibjs/fibjs/blob/a80336feff7658c12d2556a8f2bf40dff139413f/tools/gen_index.js)  
[GitHub - kkaaddff/chat-embeddings-server](https://github.com/kkaaddff/chat-embeddings-server)  
[https://github.com/GanymedeNil/document.ai](https://github.com/GanymedeNil/document.ai)  
[GitHub - hwchase17/langchainjs](https://github.com/hwchase17/langchainjs)  
\[\[GPT x Doc\]\]
