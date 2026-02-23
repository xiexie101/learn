# 深度解析：Claude Code 的 /insights 命令是如何工作的

原文链接：[Deep Dive: How Claude Code's /insights Command Works](https://www.zolkos.com/2026/02/04/deep-dive-how-claude-codes-insights-command-works.html)

Claude Code 中的 `/insights` 命令会生成一份全面的 HTML 报告，分析你在所有 Claude Code 会话中的使用模式。它的设计初衷是帮助你了解通过何种方式与 Claude 交互、哪些方面运作良好、哪里存在阻碍，以及如何改进你的工作流。

```bash
/insights
```

它的输出非常酷，我鼓励你尝试一下并通读报告！

*   **命令**: `/insights`
*   **描述**: “生成一份分析你的 Claude Code 会话的报告”
*   **输出**: 保存到 `~/.claude/usage-data/report.html` 的交互式 HTML 报告

但在底层到底发生了什么？让我们追踪整个管道流程。

## 分析管道 (The Analysis Pipeline)

Insights 的生成是一个多阶段的过程：

1.  从 `~/.claude/projects/` 收集你所有的会话日志
2.  过滤掉代理（Agent）子会话和内部操作
3.  从每个会话中提取元数据（Token、使用的工具、时长等）
4.  运行 LLM 分析，从会话记录中提取“Facets”（定性的评估切面）
5.  聚合所有会话的数据
6.  使用多个专门的 Prompt 生成洞察
7.  渲染交互式 HTML 报告

Facets 会被缓存到 `~/.claude/usage-data/facets/` 中，因此后续运行会更快。

## 第一阶段：会话过滤与元数据提取 (Session Filtering & Metadata Extraction)

在进行任何 LLM 调用之前，Claude Code 会处理你的会话日志以提取结构化元数据。

### 会话过滤规则：
*   排除代理子会话（以 `agent-` 开头的文件）
*   排除内部的 facet 提取会话
*   排除少于 2 条用户消息的会话
*   排除时长短于 1 分钟的会话

### 每个会话提取的元数据：
*   `session_id` - 唯一标识符
*   `start_time` - 会话开始时间
*   `duration_minutes` - 会话持续时长
*   `user_message_count` - 用户消息数量
*   `input_tokens` / `output_tokens` - Token 使用量
*   `tool_counts` - 使用了哪些工具以及使用的频率
*   `languages` - 从文件扩展名通过检测到的编程语言
*   `git_commits` / `git_pushes` - Git 活动
*   `user_interruptions` - 你打断 Claude 的频率
*   `tool_errors` - 工具失败及其类别
*   `lines_added` / `lines_removed` / `files_modified` - 代码变更
*   `uses_task_agent` / `uses_mcp` / `uses_web_search` / `uses_web_fetch` - 功能使用情况
*   `first_prompt` - 你的初始消息
*   `summary` - 简短的会话摘要

## 第二阶段：对话摘要（针对长会话）

如果会话记录超过 30,000 个字符，它会被分割成 25,000 个字符的片段，并在提取 Facet 之前对每个片段进行摘要。

### 摘要 Prompt (Transcript Summarization Prompt)

```text
Summarize this portion of a Claude Code session transcript. Focus on:
1. What the user asked for
2. What Claude did (tools used, files modified)
3. Any friction or issues
4. The outcome
Keep it concise - 3-5 sentences. Preserve specific details like file names, error messages, and user feedback.
TRANSCRIPT CHUNK:
```

*(译注：该 Prompt 要求总结用户请求、Claude 的操作、遇到的阻碍及结果，保持简洁并保留关键细节。)*

## 第三阶段：Facet（切面）提取

这是核心的定性分析。对于每个会话（每次运行最多分析 50 个新会话），Claude 会分析对话记录以提取结构化的 "Facets" —— 即对发生了什么的定性评估。
*   **模型**: Haiku (快速，具有成本效益)
*   **最大输出 Token**: 4096

### Facet 提取 Prompt

```text
Analyze this Claude Code session and extract structured facets.

CRITICAL GUIDELINES:
1. **goal_categories**: Count ONLY what the USER explicitly asked for.
   - DO NOT count Claude's autonomous codebase exploration
   - DO NOT count work Claude decided to do on its own
   - ONLY count when user says "can you...", "please...", "I need...", "let's..."
2. **user_satisfaction_counts**: Base ONLY on explicit user signals.
   - "Yay!", "great!", "perfect!" → happy
   - "thanks", "looks good", "that works" → satisfied
   - "ok, now let's..." (continuing without complaint) → likely_satisfied
   - "that's not right", "try again" → dissatisfied
   - "this is broken", "I give up" → frustrated
3. **friction_counts**: Be specific about what went wrong.
   - misunderstood_request: Claude interpreted incorrectly
   - wrong_approach: Right goal, wrong solution method
   - buggy_code: Code didn't work correctly
   - user_rejected_action: User said no/stop to a tool call
   - excessive_changes: Over-engineered or changed too much
4. If very short or just warmup, use warmup_minimal for goal_category

SESSION: <session transcript is inserted here>

RESPOND WITH ONLY A VALID JSON OBJECT matching this schema:
{
  "underlying_goal": "What the user fundamentally wanted to achieve",
  "goal_categories": {"category_name": count, ...},
  "outcome": "fully_achieved | mostly_achieved | partially_achieved | not_achieved | unclear_from_transcript",
  "user_satisfaction_counts": {"level": count, ...},
  "claude_helpfulness": "unhelpful | slightly_helpful | moderately_helpful | very_helpful | essential",
  "session_type": "single_task | multi_task | iterative_refinement | exploration | quick_question",
  "friction_counts": {"friction_type": count, ...},
  "friction_detail": "One sentence describing friction or empty",
  "primary_success": "none | fast_accurate_search | correct_code_edits | good_explanations | proactive_help | multi_file_changes | good_debugging",
  "brief_summary": "One sentence: what user wanted and whether they got it"
}
```

### 目标类别 (Goal Categories)
包括：`debug_investigate` (调试调查), `implement_feature` (实现功能), `fix_bug` (修复Bug), `write_script_tool` (编写脚本工具), `refactor_code` (重构代码), `configure_system` (配置系统), `create_pr_commit` (创建PR/提交), `analyze_data` (分析数据), `understand_codebase` (理解代码库), `write_tests` (编写测试), `write_docs` (编写文档), `deploy_infra` (部署基础设施), `warmup_minimal` (简单热身)。

### 满意度级别 (Satisfaction Levels)
`frustrated` (沮丧) → `dissatisfied` (不满意) → `likely_satisfied` (可能满意) → `satisfied` (满意) → `happy` (开心) → `unsure` (不确定)

### 结果类别 (Outcome Categories)
`not_achieved` (未达成) → `partially_achieved` (部分达成) → `mostly_achieved` (主要达成) → `fully_achieved` (完全达成) → `unclear_from_transcript` (不清楚)

### 摩擦类别 (Friction Categories)
包括：`misunderstood_request` (误解请求), `wrong_approach` (方法错误), `buggy_code` (代码Bug), `user_rejected_action` (用户拒绝操作), `claude_got_blocked` (Claude 受阻), `user_stopped_early` (用户提前停止), `wrong_file_or_location` (错误文件或位置), `excessive_changes` (过度变更), `slow_or_verbose` (缓慢或啰嗦), `tool_failed` (工具失败), `user_unclear` (用户表述不清), `external_issue` (外部问题)。

### Claude 帮助程度 (Claude Helpfulness Levels)
`unhelpful` (无帮助) → `essential` (至关重要)

### 会话类型 (Session Types)
`single_task` (单一任务), `multi_task` (多任务), `iterative_refinement` (迭代优化), `exploration` (探索), `quick_question` (快速提问)

## 第四阶段：聚合分析 (Aggregated Analysis)

一旦收集了所有会话数据和 Facets，它们就会被聚合并通过多个专门的分析 Prompt 进行处理。
*   **模型**: Haiku
*   **最大输出 Token**: 每个 Prompt 8192

### 传递给分析 Prompt 的数据
每个分析 Prompt 都会接收到聚合后的统计数据：
```json
{
  "sessions": <total sessions>,
  "analyzed": <sessions with facets>,
  "date_range": { "start", "end" },
  "messages": <total messages>,
  "hours": <total duration in hours>,
  "commits": <git commits>,
  "top_tools": [top 8 tools by usage],
  "top_goals": [top 8 goal categories],
  "outcomes": { outcome distribution },
  "satisfaction": { satisfaction distribution },
  "friction": { friction type counts },
  "success": { success category counts },
  "languages": { language usage counts }
}
```
加上文本摘要：
*   **SESSION SUMMARIES**: 最多 50 个简短摘要
*   **FRICTION DETAILS**: 最多 20 个来自 Facets 的摩擦细节
*   **USER INSTRUCTIONS TO CLAUDE**: 用户给 Claude 的最多 15 条重复指令

### 4.1 项目领域分析 (Project Areas Analysis)
识别你正在从事的项目领域（Project Areas），排除内部操作。

### 4.2 交互风格分析 (Interaction Style Analysis)
分析你如何与 Claude 互动（例如：快速迭代还是预先详细说明？经常打断还是让 Claude 运行？）。

### 4.3 运作良好的方面 (What Works Well)
识别对该用户来说效果很好的工作流。

### 4.4 摩擦分析 (Friction Analysis)
识别用户的痛点和摩擦模式。

### 4.5 建议与改进 (Suggestions & Improvements)
这是最长的 Prompt，提供可操作的建议：
1.  **MCP Servers**: 通过模型上下文协议连接外部工具、数据库和 API。
2.  **Custom Skills (自定义技能)**: 定义为 Markdown 文件的可重用 Prompt。
3.  **Hooks**: 在特定生命周期事件自动运行的 Shell 命令。
4.  **Headless Mode (无头模式)**: 从脚本和 CI/CD 非交互式运行 Claude。
5.  **Task Agents (任务代理)**: Claude 生成的专注于复杂探索或并行工作的子代理。

生成的建议包括：
*   **claude_md_additions**: 基于工作流模式建议添加到 `CLAUDE.md` 的内容（例如：“修改 auth 相关文件后始终运行测试”）。
*   **features_to_try**: 推荐尝试的功能。
*   **usage_patterns**: 建议采用的使用模式。

### 4.6 展望未来 (On The Horizon)
识别未来机会，如自主工作流、并行代理等。

### 4.7 有趣的结尾 (Fun Ending)
从记录中寻找一个难忘的定性时刻——人性化的、有趣的或令人惊讶的瞬间。

## 第五阶段：概览摘要 (At a Glance Summary)

最后的 LLM 调用生成一份执行摘要，将所有内容串联起来。此 Prompt 接收之前生成的所有洞察作为上下文。

### 概览 Prompt (At a Glance Prompt)
该 Prompt 要求生成 4个部分的结构：
1.  **What's working (运作良好的方面)**: 用户独特的交互风格和有影响力的成果。
2.  **What's hindering you (阻碍你的方面)**: 分为 Claude 的错误和用户侧的摩擦。
3.  **Quick wins to try (速赢尝试)**: 具体的 Claude Code 功能或工作流技巧。
4.  **Ambitious workflows for better models (面向更好模型的雄心勃勃的工作流)**: 为未来 3-6 个月更强大的模型做准备。

## 第六阶段：报告生成 (Report Generation)

所有收集的数据和 LLM 生成的洞察被渲染成一个交互式的 HTML 报告。

### 统计仪表极大 (Statistics Dashboard):
*   总会话数、消息数、时长、Token
*   Git 提交和推送
*   活跃天数和连续记录
*   高峰活动时间

### 可视化 (Visualizations):
*   每日活动图表
*   工具使用分布
*   语言细分
*   满意度分布
*   结果追踪

### 叙述部分 (Narrative Sections):
*   项目领域描述
*   交互风格分析
*   运作良好的方面
*   摩擦分析及具体示例
*   CLAUDE.md 添加建议
*   功能探索
*   未来机会
*   难忘时刻

## 管道伪代码 (Pipeline Pseudocode)

```javascript
function generateInsights():
  // Stage 1: Load and filter sessions
  sessions = loadSessionLogs("~/.claude/projects/")
  sessions = sessions.filter(s =>
    !isAgentSession(s) &&
    !isInternalSession(s) &&
    s.userMessageCount >= 2 &&
    s.durationMinutes >= 1
  )

  // Extract metadata from each session
  metadata = sessions.map(extractMetadata)

  // Stage 2 & 3: Extract facets (with caching)
  facets = {}
  for session in sessions:
    cached = loadCachedFacet(session.id)
    if cached:
      facets[session.id] = cached
    else:
      transcript = session.transcript
      if transcript.length > 30000:
        transcript = summarizeInChunks(transcript)
      facets[session.id] = callLLM(FACET_EXTRACTION_PROMPT + transcript)
      saveFacetToCache(session.id, facets[session.id])

  // Stage 4: Aggregate and analyze
  aggregated = aggregateAllData(metadata, facets)

  insights = {}
  insights.project_areas = callLLM(PROJECT_AREAS_PROMPT, aggregated)
  insights.interaction_style = callLLM(INTERACTION_STYLE_PROMPT, aggregated)
  insights.what_works = callLLM(WHAT_WORKS_PROMPT, aggregated)
  insights.friction = callLLM(FRICTION_PROMPT, aggregated)
  insights.suggestions = callLLM(SUGGESTIONS_PROMPT, aggregated)
  insights.on_the_horizon = callLLM(ON_THE_HORIZON_PROMPT, aggregated)
  insights.fun_ending = callLLM(FUN_ENDING_PROMPT, aggregated)

  // Stage 5: Generate executive summary
  insights.at_a_glance = callLLM(AT_A_GLANCE_PROMPT, aggregated + insights)

  // Stage 6: Render HTML report
  html = renderReport(aggregated, insights)
  saveFile("~/.claude/usage-data/report.html", html)
  return insights
```

## 数据存储
*   `~/.claude/projects/<hash>/`
*   `~/.claude/usage-data/facets/<session-id>.json`
*   `~/.claude/usage-data/report.html`

由于 Facets 是按会话缓存的，因此通过多次运行 `/insights` 只会分析新的会话。

## 隐私考量
所有分析都在本地使用 Anthropic API 进行。你的会话数据保留在你的机器上——HTML 报告在本地生成，可以由你自行决定分享。
Facet 提取关注的是你的**交互模式**，而不是你的代码内容：
*   你请求的任务类型
*   你如何回应 Claude 的输出
*   工作流中摩擦发生的位置
*   你使用的工具和功能

## 获取更好洞察的技巧

1.  **经常使用 Claude Code** - 更多会话 = 更丰富的分析
2.  **给予反馈** - 说“谢谢”或“不对”，以便追踪满意度
3.  **不要过滤自己** - 自然的使用模式能揭示最有用的洞察
4.  **定期运行** - 每月检查一次，看看你的模式如何演变
