# 看看新闻爬虫

这是一个用于抓取看看新闻"本期看点"栏目内容的爬虫工具。通过指定日期，程序会自动抓取对应日期的新闻标题，并保存为Markdown格式。

## 功能特点

- 通过日期抓取新闻标题
- 支持多标签页新闻内容抓取
- 使用Pyppeteer实现动态网页抓取
- 提供Python和Node.js两种实现版本
- 自动生成Markdown格式报告

## 安装

### Python版本
1. 克隆或下载本仓库
2. 安装依赖：
```
pip install -r requirements.txt
```
3. 首次运行时，Pyppeteer会自动下载Chromium浏览器（约150MB）

### Node.js版本
1. 确保已安装Node.js环境
2. 进入项目目录，安装依赖：
```
npm install
```

## 使用方法

### Python版本
1. 运行程序：
```
python news_crawler.py
```

2. 按提示输入日期（格式：YYYY-MM-DD）
3. 程序将自动抓取指定日期的新闻标题，并保存为`news_summary.md`文件

### Node.js版本
1. 运行程序：
```
npm start
```
或
```
node puppeteer_version.js
```

2. 按提示输入日期（格式：YYYY-MM-DD）
3. 程序将自动抓取指定日期的新闻标题，并保存为`news_summary.md`文件

## 技术说明

- Python版本：使用Pyppeteer（Python版Puppeteer）实现网页自动化
- Node.js版本：使用原生Puppeteer实现网页自动化
- 异步处理提高性能和效率
- 支持动态页面内容加载和交互

## 版本对比

| 特点 | Python版本 | Node.js版本 |
| ---- | ---------- | ----------- |
| 速度 | 较慢 | 较快 |
| 资源占用 | 较高 | 较低 |
| 依赖安装 | 简单 | 简单 |
| 适用场景 | Python环境 | Node.js环境 |

## 注意事项

- 首次运行时需要网络连接以下载Chromium
- 确保网络连接正常
- 由于网站结构可能变化，程序可能需要不定期更新 

###
使用每个HTML文件中<title>标签的实际内容作为页面功能名字。让我先提取所有HTML文件的title信息，然后更新导航页面。
find . -name "*.html" -type f | grep -v ".venv" | sort | xargs -I {} sh -c 'title=$(grep -i "<title>" "{}" | head -1 | sed "s/<[^>]*>//g" | xargs); echo "{}|$title"'