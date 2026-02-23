---
title: "362 - 《用 Azure 申请 OpenAI API》"
date: 2023-08-01
url: https://sorrycc.com/azure-openai
---

发布于 2023年10月28日

# 362 - 《用 Azure 申请 OpenAI API》

> 之前听群里朋友说起过，由于有 ChatGPT Plus 可用，一直没尝试。周五周会时闲来无事，就想着申请试试，没想到第二天早上就通过了。Azure API 的好处是可以用国内信用卡付款，同时国内不翻墙可以直连。

这篇文章 [https://atlassc.net/2023/04/25/azure-openai-service](https://atlassc.net/2023/04/25/azure-openai-service) 讲得比较详细，相同的内容我就不复述了，只补充差异化的内容。大家可以结合在一起看。

1、注册 Azure。

用国际版 [https://azure.microsoft.com/](https://azure.microsoft.com/) 注册，国家可以选中国，手机可以填 +86，信用卡可以用真实的。

2、申请 Azure OpenAI Service 试用。

申请地址是 [https://azure.microsoft.com/en-us/products/cognitive-services/openai-service](https://azure.microsoft.com/en-us/products/cognitive-services/openai-service) ，邮箱不能用 gmail、outlook 等公共地址，我是之前在 cloudflare 上申请的域名附带的邮箱服务，地址不清楚大陆行不行，我用的台湾的地址。

以下是我申请用的信息，

```
Chatfish Corporation    (这个得换成你的)
sorrycc@chatfish.io     (这个得换成你的)
Chen Cheng  
No. 333, Section 1, Keelung Rd, Xinyi District, Taipei City  
Taipei  
222  （邮编）
Taiwan  
https://chatfish.io/   (这个得换成你的)
902752650  （电话）
Systems Integrator (SI)
```

说过 7 个工作日给消息，结果第二天早上就收到通过邮件了。

3、部署。

如果要用 GPT-4 和 GPT-4 Turbo，需要注意选区。参考[这个](https://techcommunity.microsoft.com/t5/ai-azure-ai-services-blog/azure-openai-service-launches-gpt-4-turbo-and-gpt-3-5-turbo-1106/ba-p/3985962)一共九个区有 GPT-4 Turbo，我用的是 Canada East。部署后会拿到 access token 和 entrypoint（API URL）。

4、费用（每 1000 tokens）。

GPT-4 一定要用 Turbo 的，又快又大又便宜。

模型

Input 费用

Output 费用

gpt-4-1106-preview（128K）

$0.01

$0.03

gpt-35-turbo-1106

$0.001

$0.002

GPT-4（8K）

$0.03

$0.06

GPT-4（32K）

$0.06

$0.12

详见 [https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) 。

5、写代码调试。

JS 可以用 openai 这个库。其中 apiVersion 可以在 [https://learn.microsoft.com/en-us/azure/ai-services/openai/reference?WT.mc\_id=AZ-MVP-5004796](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference?WT.mc_id=AZ-MVP-5004796) 找到最新可用的。

```ts
const resource = ''; // 填你的
const deployName = '';    // 填你的
const apiVersion = '2023-08-01-preview';
const apiKey = process.env['AZURE_OPENAI_API_KEY']; // 填你的
if (!apiKey) {
  throw new Error(
    'The AZURE_OPENAI_API_KEY environment variable is missing or empty.',
  );
}
const openai = new OpenAI({
  apiKey,
  baseURL: `https://${resource}.openai.azure.com/openai/deployments/${deployName}`,
  defaultQuery: { 'api-version': apiVersion },
  defaultHeaders: { 'api-key': apiKey },
});
const result = await openai.chat.completions.create({
  model: '', // 填不填一样，和 deployment 绑定了
  messages: [{ role: 'user', content: 'Say hello!' }],
});
console.log(result.choices[0]!.message?.content);
```

参考：  
[https://atlassc.net/2023/04/25/azure-openai-service](https://atlassc.net/2023/04/25/azure-openai-service)  
[https://www.chatgoo.cn/20231900/](https://www.chatgoo.cn/20231900/)  
[https://learn.microsoft.com/en-us/azure/ai-services/openai/reference?WT.mc\_id=AZ-MVP-5004796](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference?WT.mc_id=AZ-MVP-5004796)  
[https://github.com/openai/openai-node](https://github.com/openai/openai-node)  
[https://techcommunity.microsoft.com/t5/ai-azure-ai-services-blog/azure-openai-service-launches-gpt-4-turbo-and-gpt-3-5-turbo-1106/ba-p/3985962](https://techcommunity.microsoft.com/t5/ai-azure-ai-services-blog/azure-openai-service-launches-gpt-4-turbo-and-gpt-3-5-turbo-1106/ba-p/3985962)
