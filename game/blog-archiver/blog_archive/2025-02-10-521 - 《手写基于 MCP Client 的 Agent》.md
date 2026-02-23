---
title: "521 - 《手写基于 MCP Client 的 Agent》"
date: 2025-02-10
url: https://sorrycc.com/toy-agent-with-mcp-client
---

发布于 2025年2月10日

# 521 - 《手写基于 MCP Client 的 Agent》

1、Agent = LLM + Tools。MCP Server 是目前唯一的 tools 标准，当然他不仅有 tools 还有 resouces 和 prompts，只不过大家都只用他的 tools 部分而已。参考 [520 - 《Cursor 和 MCP》](https://sorrycc.com/cursor-and-mcp)，现在已有大量 MCP Server，社区有的就不需要手动重新实现一遍，同时照着这个趋势，MCP Server 会越来越多。所以写一个 Agent，只要基于 MCP Servers，再补上自己特有的 tools 实现即可。

2、我写了个极简的 Agent，通过 MCP Client 和 MCP Server 交互来扩展能力，比如问「how old is Zhang Zi Yi? Please search with brave\_web\_search」，他会用 brave\_web\_search 这个 server 提供的 tool 去做 web 搜索，然后再提供结果。

![](https://tcc.sorrycc.com/p/42a874f2-71f6-4117-9697-b1fa541c8d13.png)

1）写了个 clientToTools 方法，把 MCP Client 转成标准的 tools  
2）用 ai 包，可以简化下 openai 对 tools 的调用

```ts
import { createOpenAI } from '@ai-sdk/openai';
import * as pc from 'picocolors';
import { CoreMessage, generateText, tool } from 'ai';
import type { CoreTool } from 'ai';
import assert from 'assert';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { jsonSchemaToZod } from '@n8n/json-schema-to-zod';

interface AgentOptions {
  model?: string;
  apiKey?: string;
}

export async function run(opts: AgentOptions) {
  const transport = new StdioClientTransport({
    command: 'env',
    args: [
      'BRAVE_API_KEY=YOUR_KEY',
      'npx',
      '-y',
      '@modelcontextprotocol/server-brave-search',
    ],
  });
  const client = new Client({
    name: 'brave_search',
    version: '1.0.0',
  });
  await client.connect(transport);
  const tools = await clientToTools(client);
  const { model = 'gpt-3.5-turbo' } = opts;
  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
  assert(apiKey, 'opts.apiKey or OPENAI_API_KEY is not set');
  const openai = createOpenAI({
    apiKey,
  });
  const messages: CoreMessage[] = [
    { role: 'system', content: '' },
    {
      role: 'user',
      content: 'how old is Zhang Zi Yi? Please search with brave_web_search',
    },
  ];
  const response = await generateText({
    model: openai(model),
    system: '',
    maxSteps: 10,
    tools,
    messages,
  });
  await client.close();
  console.log(response.text);
  console.log('done');
}

async function clientToTools(client: Client) {
  const { tools: clientTools } = await client.listTools();
  const tools = {} as Record<string, CoreTool>;
  clientTools.forEach((t) => {
    const params = jsonSchemaToZod(t.inputSchema as any);
    tools[t.name] = tool({
      description: t.description,
      parameters: params,
      execute: async (args) => {
        console.log(
          pc.green(
            `> tool ${t.name} called with args: ${JSON.stringify(args)}`,
          ),
        );
        const result = await client.callTool({
          name: t.name,
          arguments: args,
        });
        console.log(
          pc.green(`< tool ${t.name} result: ${JSON.stringify(result)}`),
        );
        return result;
      },
    });
  });
  return tools;
}
```

注：clientToTools 也可以用 `@smithery/sdk` 。

```ts
import { OpenAIChatAdapter } from "@smithery/sdk";
const adapter = new OpenAIChatAdapter(client);
const tools = await adapter.listTools();
```

3、下一步。

1）集成更多 tools，两个来源，1）社区的 MCP Server，筛选后加入，2）我本地的脚本（有合适的我也会封成 MCP Server）。

2）然后通过自然语言的方式调用他们，比如「save [https://timsh.org/tracking-myself-down-through-in-app-ads/](https://timsh.org/tracking-myself-down-through-in-app-ads/) , summarize and translate, then post to [sorrycc.com](http://sorrycc.com)」，比如「download [https://modelcontextprotocol.io/llms-full.txt](https://modelcontextprotocol.io/llms-full.txt) then write a tweet about MCP, then send to [x.com](http://x.com)」，比如「collect ai news, rate and sort, then send a summarized version to sorrycc#[gmail.com](http://gmail.com)」诸如此类。未来的交互形式应是如此吧。

参考：  
[520 - 《Cursor 和 MCP》](https://sorrycc.com/cursor-and-mcp)  
[https://www.librechat.ai/docs/features/agents](https://www.librechat.ai/docs/features/agents)  
[https://github.com/danny-avila/LibreChat/pull/5015](https://github.com/danny-avila/LibreChat/pull/5015)  
[https://github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)  
[https://github.com/block/goose](https://github.com/block/goose)
