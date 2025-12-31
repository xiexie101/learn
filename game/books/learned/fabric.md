Fabric 的核心在于它的 **Patterns（模式/提示词库）**。虽然官方没有发布实时的“全球使用量排行榜”，但根据社区活跃度、Github 讨论以及 Daniel Miessler 本人的推荐，以下是 **20 个最常用且功能最强大的 Patterns**，按应用场景分类：

### 👑 绝对核心 (The MVPs)

这几个是 Fabric 的招牌功能，几乎每个用户都会用到：

1. **`extract_wisdom`**
* **功能**：Fabric 的“镇店之宝”。它不仅仅是总结，而是从长文章或视频中提取出“智慧”——包括核心观点、引言、习惯、事实和参考资料。
* **适用**：读长文、看 YouTube 教程、听播客。


2. **`summarize`**
* **功能**：生成标准的高质量摘要。
* **适用**：快速了解任何文本的大意。


3. **`analyze_claims`**
* **功能**：分析内容中提出的主张，并检查其证据和逻辑。
* **适用**：鉴别假新闻、分析辩论、验证营销软文的真实性。


4. **`rate_content`**
* **功能**：根据质量、价值和相关性给内容打分（Tier S/A/B/C...）。
* **适用**：决定是否值得花时间读完一本书或一篇文章。



---

### ✍️ 写作与创作 (Writing & Creation)

5. **`write_essay`**
* **功能**：根据一个简单的想法或主题，写出一篇结构清晰、论点有力的短文。
* **适用**：博客写作、只有碎片想法时生成初稿。


6. **`improve_writing`**
* **功能**：优化你的粗糙草稿，提升清晰度、语气和语法，但保留原意。
* **适用**：邮件润色、文档修改。


7. **`create_social_media_post`** (或 `tweet`)
* **功能**：将长内容转化为适合 Twitter/LinkedIn 的短贴，包含 emoji 和 hashtag。
* **适用**：自媒体运营。


8. **`create_video_script`**
* **功能**：根据主题生成 YouTube 或 TikTok 的视频脚本。
* **适用**：视频创作者。


9. **`create_art_prompt`**
* **功能**：读取文本描述，生成适合 Midjourney 或 Stable Diffusion 的专业提示词。
* **适用**：AI 绘画辅助。



---

### 🧠 深度思考与学习 (Thinking & Learning)

10. **`extract_main_idea`**
* **功能**：用一句话或极简的方式提炼核心思想。
* **适用**：电梯演讲准备、极速阅读。


11. **`find_logical_fallacies`**
* **功能**：找出文本中的逻辑谬误（如稻草人攻击、滑坡谬误等）。
* **适用**：分析网络争论、批判性阅读。


12. **`explain_docs`**
* **功能**：用通俗易懂的语言解释复杂的文档。
* **适用**：阅读复杂的法律条文、说明书。


13. **`create_quiz`**
* **功能**：根据输入的内容生成测验题。
* **适用**：复习学习资料、教师出题。



---

### 💻 编程与技术 (Coding & Tech)

14. **`explain_code`**
* **功能**：解释一段代码在做什么，逻辑是什么。
* **适用**：接手屎山代码、学习新库。


15. **`write_documentation`** (或 `create_design_document`)
* **功能**：为代码生成清晰的文档或设计文档。
* **适用**：开发者偷懒神器。


16. **`summarize_git_changes`**
* **功能**：根据 git diff 生成 commit message 或 PR 描述。
* **适用**：代码提交。



---

### 🛡️ 安全与极客专用 (Security & Geek)

17. **`analyze_threat_report`**
* **功能**：提取网络安全威胁报告中的关键 IOCs (入侵指标) 和 TTPs (战术技术过程)。
* **适用**：安全分析师（这是作者的老本行）。


18. **`find_hidden_message`**
* **功能**：分析文本，寻找潜台词、宣传意图或作者未明说的动机。
* **适用**：政治新闻分析、商业情报。


19. **`summarize_paper`**
* **功能**：专门针对学术论文的总结，注重研究方法和结论。
* **适用**：科研人员。


20. **`create_micro_summary`**
* **功能**：生成极其简短的摘要（通常用于列表视图）。
* **适用**：整理大量 RSS 订阅或新闻流。



---


### 企业核心 Pattern:

create_design_doc: 根据简短描述生成详细的技术设计文档（PRD/RFC）。

explain_code: 用极其清晰的逻辑解释复杂的代码段（适合接手屎山代码）。

improve_prompt: 优化你的原始 Prompt，这是“元 Prompting”。

write_pull_request: 自动生成规范、清晰的 PR 描述，提升 Code Review 效率。

create_swagger: 从代码或描述生成 Swagger/OpenAPI 文档。
### 

### 💡 如何查看你当前的所有 Patterns？

安装 Fabric 后，你可以在命令行输入以下命令查看你本地可用的所有 Pattern：

```bash
fabric --list
# 或者简写
fabric -l

```

**建议：** 初学者先死磕 **`extract_wisdom`**，它是 Fabric 哲学的最佳体现——不是为了读得更少，而是为了理解得更深。

https://github.com/danielmiessler/Fabric/blob/main/data/patterns/extract_wisdom/system.md

💡 极简记忆法 (Cheat Sheet)
如果你记不住这么多，只需要记住这 "三板斧"，能覆盖 80% 的日常需求：

想读懂什么 (文章/视频/代码) ➡️ 用 extract_wisdom 或 explain_code

想写点什么 (文档/博客/推文) ➡️ 用 write_essay 或 improve_writing

想挑刺/分析 (找逻辑漏洞/找Bug) ➡️ 用 find_logical_fallacies