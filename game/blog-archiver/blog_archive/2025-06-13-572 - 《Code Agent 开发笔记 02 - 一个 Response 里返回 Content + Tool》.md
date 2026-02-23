---
title: "572 - 《Code Agent 开发笔记 02 - 一个 Response 里返回 Content + Tool》"
date: 2025-06-13
url: https://sorrycc.com/code-agent-02-content-tool-in-one-response
---

发布于 2025年6月13日

# 572 - 《Code Agent 开发笔记 02 - 一个 Response 里返回 Content + Tool》

> 看似挺简单的基础能力，其实很挺复杂的。

![](https://cdn.jsdelivr.net/gh/sorrycc-bot/image-2025-04@main/uPic/tool-content.gif)

1、实现 Agent 有个常见的需求是，当用户输入一个任务时，Agent 在调用 Tool 之前，要先给用户一个意图的反馈。比如，用户说「东京的天气是什么」，要先反馈「为了给你结果，我准备去查一下东京的天气」，然后再「调用 Tools 拿结果」。我本来觉得这是基本的实现，应该很简单。但实际上，需要绕个大圈来实现这一点。

2、我查了 OpenAI 的文档和社区讨论后发现并不行。他的 Response 里虽然有 content 和 tool 的 response，但这两者是二选一的，不会同时出现。这意味着我们不能用 Function Call 这个特性。

[https://community.openai.com/t/getting-tool-calls-and-content-back-from-same-api-call/1031026](https://community.openai.com/t/getting-tool-calls-and-content-back-from-same-api-call/1031026)  
[https://community.openai.com/t/is-it-possible-to-have-tool-call-and-content-in-single-completion-message/540568](https://community.openai.com/t/is-it-possible-to-have-tool-call-and-content-in-single-completion-message/540568)

3、除了「content 需要和 tool 在同一个 response 里面返回」之外，还有个要求是「在流式场景下，content 需要先与 tool 返回」，以便于用户先看到 content，再去做 tool 调用。所以，这意味着 JSON Output 的方式也不行，因为不能保证 content 和 tool\_use json 结构的前后顺序。

4、所以，看来只剩最后一个方法了，「通过 xml 的方式组织结果」。

prompt 如下。

```
====
TOOLS

You only have access to the tools provided below. You can only use one tool per message, and will receive the result of that tool use in the user's response. You use tools step-by-step to accomplish a given task, with each tool use informed by the result of the previous tool use.

# Tool Use Formatting
Tool use is formatted using XML-style tags. The tool use is enclosed in <use_tool></use_tool> and each parameter is similarly enclosed within its own set of tags.

Description: Tools have defined input schemas that specify required and optional parameters.

Parameters:
- tool_name: (required) The name of the tool to execute
- arguments: (required) A JSON object containing the tool's input parameters, following the tool's input schema, quotes within string must be properly escaped, ensure it's valid JSON

Usage:
<use_tool>
  <tool_name>tool name here</tool_name>
  <arguments>
    {"param1": "value1","param2": "value2 \"escaped string\""}
  </arguments>
</use_tool>

When using tools, the tool use must be placed at the end of your response, top level, and not nested within other tags. Do not call tools when you don't have enough information.

Always adhere to this format for the tool use to ensure proper parsing and execution.

# Available Tools
```

参考：  
[https://github.com/cline/cline/blob/main/src/core/prompts/system.ts](https://github.com/cline/cline/blob/main/src/core/prompts/system.ts)

Tools 的 Prompt 如下。

```
<tool>
<name>${key}</name>
<description>${tool.description}</description>
<input_json_schema>${JSON.stringify(tool.parameters.jsonSchema || zodToJsonSchema(tool.parameters))}</input_json_schema>
</tool>
```

然后，Response 里会拿到比如这样的 text 输出。

```
I will to tool `write` to create a.txt file.

<use_tool>
  <tool_name>write</tool_name>
  <arguments>
    {"file_path": "/path/to/a.txt", "content": "hello world"}
  </arguments>
</use_tool>
```

此外，如果要支持流式，得支持只返回了文本时解析的能力。

参考：  
[https://github.com/cline/cline/blob/084c0a7/src/core/assistant-message/parse-assistant-message.ts#L477](https://github.com/cline/cline/blob/084c0a7/src/core/assistant-message/parse-assistant-message.ts#L477)

5、我觉得应该是有更好的解法的，只是我还不知道。比如 OpenAI 的 Response API 还没有尝试过。同时我觉得，1）xml 结构化组织还是挺 Hack 的，我在自己写的 Agent 工具里有在尝试换 Function Call 的方式，2）在调用工具之前打印意图也可能并没那么重要。
