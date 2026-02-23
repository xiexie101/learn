---
title: "299 - 《Google Bard API 逆向》"
date: 2023-05-15
url: https://sorrycc.com/bard-api
---

发布于 2023年5月15日

# 299 - 《Google Bard API 逆向》

早上试了下 Google Bard，感觉相比 ChatGPT 的优点是，1）速度快，2）有网络功能，能直接总结 url 里的内容（但注意可能不准），3）支持的 token 数好像更多。

想着可以把他接入我的总结脚本里，当文章内容超出 ChatGPT TOKEN 限制时，切 bard 应应急。于是找了个逆向的库，google 搜 `bard api site:github.com` 可以找到很多，最终选了 TypeScript [实现的库](https://github.com/AdamSEY/bard-unofficial-api)翻了下。提了下最简代码如下。

```ts
import axios from 'axios';
import assert from 'assert';

const BARD_PSID = '';
const BASE_URL = 'https://bard.google.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36';

export async function ask(opts: { message: string }) {
  const psid = BARD_PSID;
  assert(opts.message, 'message is required');
  const headers = {
    Host: 'bard.google.com',
    'X-Same-Domain': '1',
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    Origin: BASE_URL,
    Referer: BASE_URL + '/',
    Cookie: `__Secure-1PSID=${psid}`,
  };
  const session = axios.create({
    headers,
    withCredentials: true,
  });
  const resp1 = await session.get(BASE_URL, { timeout: 10000 });
  const SNlM0e = resp1.data.match(/"SNlM0e":"(.*?)"/)[1];
  const messageStruct = [
    [opts.message],
    null,
    [/*conversationId*/ '', /*responseId*/ '', /*choiceId*/ ''],
  ];
  const resp2 = await session.post(
    BASE_URL +
      '/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate',
    new URLSearchParams({
      'f.req': JSON.stringify([null, JSON.stringify(messageStruct)]),
      at: SNlM0e,
    }).toString(),
    {
      params: {
        bl: 'boq_assistant-bard-web-server_20230315.04_p2',
        _reqid: Math.floor(Math.random() * 10000),
        rt: 'c',
      },
      timeout: 10000,
    },
  );
  // console.log('resp2.data', resp2.data);
  const chatData = JSON.parse(resp2.data.split('\n')[3])[0][2];
  assert(chatData, 'chatData is empty');
  const jsonChatData = JSON.parse(chatData);
  // console.log('jsonChatData', jsonChatData);
  const results = {
    content: jsonChatData[0][0],
    conversationId: jsonChatData[1][0],
    responseId: jsonChatData[1][1],
    factualityQueries: jsonChatData[3],
    textQuery: jsonChatData[2]?.[0] || '',
    choices: jsonChatData[4].map((i: any) => ({ id: i[0], content: i[1] })),
  };
  return results;
}

ask({ message: 'What is the meaning of life?' }).catch((err) => {
  console.error(err);
  process.exit(1);
});
```

运行效果是，

![](https://img.alicdn.com/imgextra/i3/O1CN01mvu7bt1iHkm6WC5Rm_!!6000000004388-2-tps-2522-1024.png)

Bard 的缺点是不支持中文，所以总结完还需要用 DeepL 的接口翻译下。

参考：  
[https://github.com/AdamSEY/bard-unofficial-api](https://github.com/AdamSEY/bard-unofficial-api)  
[https://twitter.com/FinanceYF5/status/1657596978291970056](https://twitter.com/FinanceYF5/status/1657596978291970056)
