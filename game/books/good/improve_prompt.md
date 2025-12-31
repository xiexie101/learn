**Fabric `improve_prompt` Pattern 深度总结**

你提到的 `improve_prompt` 是 Fabric 库中最具“元能力”的 Pattern 之一。它的核心作用是**“用 AI 来优化 AI 指令”**。它不仅仅是简单的润色，而是基于 OpenAI 官方的最佳实践指南，将你随手写的一句模糊指令，重写为一个符合提示词工程（Prompt Engineering）高标准的专业指令。

以下是基于该 Pattern `system.md` 核心逻辑的详细总结：

### 1. 核心定位 (Identity & Purpose)

该 Pattern 设定 AI 的角色为一位 **Prompt Engineering 专家**。它的任务不是回答你的问题，而是**重写**你的问题，使其能被 LLM 更精准地理解和执行。

### 2. 优化策略 (Strategies & Tactics)

`improve_prompt` 的 System Prompt 内部内嵌了一套完整的“提示词优化指南”，它会强制检查并应用以下策略到你的输入上：

* **设定角色 (Persona Adoption):**
* *原:* "写个代码。"
* *改:* "你是一个资深的 Python 架构师，专注于编写高性能、可维护的代码..."


* **使用分隔符 (Use Delimiters):**
* 强制使用三引号 (`"""`)、XML 标签等符号将指令与数据（上下文）清晰分开，防止模型混淆。


* **思维链 (Chain of Thought):**
* 增加“请一步步思考 (Think step by step)”或“在回答前先自行推理解决方案”的指令，显著提升逻辑任务的准确率。


* **结构化步骤 (Specify Steps):**
* 将复杂任务拆解为 Step 1, Step 2, Step 3 的明确序列。


* **提供示例 (Few-Shot Prompting):**
* 如果适用，它会尝试构建或要求提供“输入-输出”的示例对。


* **明确输出长度与格式:**
* 不再模糊地说“写短点”，而是精确到“输出 3 个要点，每个要点不超过 20 字”。



### 3. 工作流程 (Workflow)

当你运行 `echo "你的原始指令" | fabric -p improve_prompt` 时，Fabric 会执行以下逻辑：

1. **分析:** 理解你的原始意图（Intent）。
2. **诊断:** 识别原始指令的缺陷（如模糊、缺乏上下文、未指定格式）。
3. **重构:** 应用上述策略，生成一个新的 Prompt。
4. **输出:** 返回优化后的 Prompt 文本（通常你可以直接拿这个结果再去喂给 AI）。

### 4. 实际应用场景示例

**输入 (你的原始指令):**

> "帮我总结一下这个会议记录。"

**输出 (Fabric `improve_prompt` 优化后):**

> **Role:** 你是一位专业的行政秘书和商业分析师。
> **Task:** 请阅读由三引号分隔的【会议记录原文】，并生成一份结构化的会议纪要。
> **Steps:**
> 1. 提取会议的核心主题。
> 2. 列出所有已达成的决策（Decisions）。
> 3. 列出所有待办事项（Action Items），并指明责任人。
> 4. 使用清晰的 Markdown 列表格式输出。
> 
> 
> **Constraint:** 保持语气客观、专业，忽略无关的闲聊内容。
> **Input:**
> """
> (此处填入你的会议记录)
> """

### 总结

`improve_prompt` 本质上是将**“如何向 AI 提问”的隐性知识（Knowledge）**，固化为了一段**可执行的代码（Code）**。它是学习 Prompt Engineering 最好的老师——你可以通过观察它如何修改你的指令，来反向学习如何写出更好的 Prompt。