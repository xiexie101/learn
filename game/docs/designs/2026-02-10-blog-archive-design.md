# 设计方案：博客归档工具

## 目标
将 `https://sorrycc.com/archive` 中的所有博客文章归档到本地 Markdown 文件中。

## 约束与要求
1.  **身份验证**：利用 *现有的、已登录的* Google Chrome 会话来绕过登录和双重验证 (2FA)。
2.  **内容格式**：将 HTML 内容转换为标准 Markdown。
3.  **图片**：保留原始远程 URL（不下载到本地）。
4.  **输出**：将文件保存到 `blog_archive/` 目录，命名约定为 `YYYY-MM-DD-标题.md`。

## 技术架构

### 1. 浏览器自动化
- **工具**：`playwright-core`（轻量级，无需下载浏览器二进制文件）。
- **连接**：通过 Chrome DevTools Protocol (CDP) 连接到正在运行的 Chrome 实例。
- **命令**：用户必须使用 `--remote-debugging-port=9222` 启动 Chrome。

### 2. 内容提取
- **列表页**：爬取 `https://sorrycc.com/archive` 以获取 `{ 日期, 标题, URL }` 列表。
- **详情页**：访问每个 URL，提取主要内容容器（例如 `article` 或 `.post-content`）。
- **Markdown 转换**：使用 `turndown` 库将 HTML 转换为 Markdown。
    - 配置 `turndown` 以保留 `<img>` 标签或转换为 `![]()` 语法（标准行为）。

### 3. 工作流脚本
1.  连接浏览器 (`chromium.connectOverCDP`)。
2.  开启新的页面上下文。
3.  导航至归档页面。
4.  提取所有文章链接。
5.  遍历链接（顺序执行或限制并发以避免频率限制）。
6.  针对每篇文章：
    - 导航至 URL。
    - 提取内容 HTML。
    - 转换为 Markdown。
    - 保存到文件。
7.  关闭上下文（保持浏览器运行）。

## 文件结构
```
blog-archiver/
├── package.json
├── index.js          # 主脚本
└── blog_archive/     # 输出目录
    ├── 2024-03-21-标题.md
    └── ...
```

## 风险
- **网络稳定性**：大量请求可能会失败。需要具备基本的重试或断点续传能力（在下载前检查文件是否已存在）。
- **频率限制**：在请求之间添加延迟。
