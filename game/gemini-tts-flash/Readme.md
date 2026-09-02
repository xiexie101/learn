# Simon Willison's Tools 调研笔记

这份文档记录了对 [simonw/tools](https://github.com/simonw/tools) 仓库的分类总结。该仓库是学习如何利用 AI 快速构建实用小工具（特别是 Single File Apps）的绝佳参考。

## 🛠️ 工具分类总结

### 🤖 1. AI 与 大语言模型 (LLM) 工具
这是该仓库最核心的部分，展示了直接在浏览器中与模型 API 交互的模式。
- **对话与界面**：
  - `gemini-chat.html`: 完整的 Gemini Pro 聊天界面（支持流式响应）。
  - `openai-audio.html`: OpenAI 语音 API 测试工具。
  - `gpt-4o-audio-player.html`: 针对 GPT-4o 语音功能的专用播放器。
  - `chrome-prompt-playground.html`: 测试 Chrome 浏览器内置 AI (Window.ai) 的实验场。
- **辅助与计算**：
  - `claude-token-counter.html`: 离线计算 Claude 模型的 Token 数量。
  - `token-usage.html`: 可视化展示 LLM Token 使用情况。
  - `prompt-caching.html`: 测试和演示 Prompt 缓存机制。
  - **`gemini-flash-tts.html`**: 演示 Gemini Flash 的语音合成能力（重点参考）。

### 📊 2. 数据处理与开发辅助
- **数据库与 JSON**：
  - `sqlite-wasm.html`: 在浏览器里运行完整的 SQLite（由 WASM 驱动）。
  - `json-diff.html`: 极简的 JSON 差异对比工具。
  - `json-to-yaml.html`: JSON 与 YAML 格式互转。
- **代码与调试**：
  - `pyodide-repl.html`: 浏览器中的 Python 运行环境（基于 Pyodide）。
  - `sql-pretty-printer.html`: SQL 语句美美化工具。
  - `unix-timestamp.html`: 时间戳转换。

### 🖼️ 3. 图像、视频与多媒体
- **图像处理**：
  - `gif-optimizer.html`: 浏览器中压缩 GIF（WASM 驱动）。
  - `exif.html`: 查看图片的 EXIF 元数据。
  - `image-to-svg.html`: 位图转矢量图。
- **视频与图形**：
  - `ffmpeg-crop.html`: 生成裁剪视频的命令行。
  - `svg-render.html`: 即时预览 SVG 代码。

### 🌐 4. 社交媒体与网页内容
- **Bluesky (AT Protocol)**：搜索工具和实时 Firehose 查看器。
- **Hacker News**：过滤查看器和帖子导出工具。
- **网页抓取**：`link-extractor.html` (提取链接), `jina-reader.html` (网页转 Markdown)。

### 🐍 5. Python 命令行工具 (位于 `python/` 目录)
- `extract_har.py`: 从 HAR 文件提取资源。
- `claude_code_to_gist.py`: 自动同步聊天记录到 Gist。
- `mistral_ocr.py`: 使用 Mistral API 进行文字识别。

### ⏱️ 6. 生产力与趣味工具
- `pomodoro.html`: 番茄钟。
- `cooking-timer.html`: 多任务烹饪计时器。
- `word-counter.html`: 字数统计。

---

## 💡 核心设计模式：Single File Apps (SFA)
1. **零构建步骤**：直接使用原生 HTML/JS/CSS。
2. **CDN 依赖**：通过 `https://esm.run/` 引入外部库（如 Google AI SDK）。
3. **本地存储**：API 密钥存在 `localStorage`，不经过服务器。
4. **AI 优先**：代码结构清晰，方便 LLM 进行后续修改和扩展。
