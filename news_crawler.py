import requests
from bs4 import BeautifulSoup
import markdown
from datetime import datetime
import re
import os
import time
import asyncio
import pyppeteer

async def fetch_news(date):
    """
    获取指定日期的新闻内容
    :param date: 日期格式 YYYY-MM-DD
    :return: 新闻列表和总数
    """
    # 将日期转换为URL格式
    date_formatted = date.replace('-', '')
    url = f"https://www.kankanews.com/program/KBkDwmqwldZ/{date}"
    
    try:
        # 启动浏览器
        browser = await pyppeteer.launch({
            'headless': True,
            'args': ['--no-sandbox', '--disable-dev-shm-usage']
        })
        page = await browser.newPage()
        
        # 设置视窗大小
        await page.setViewport({'width': 1366, 'height': 768})
        
        # 访问URL
        await page.goto(url, {'waitUntil': 'networkidle0'})
        
        # 等待页面加载完成
        await page.waitForSelector('.tab-list span')
        
        # 获取所有标签页
        tabs = await page.querySelectorAll('.tab-list span')
        
        news_list = []
        total_news = 0
        
        # 遍历点击每个标签页
        for tab in tabs:
            await tab.click()
            # 等待内容加载
            await asyncio.sleep(1)
            
            # 获取当前标签页下的新闻列表
            news_items = await page.querySelectorAll('.scroll-container .current-list li div.title')
            
            # 提取每条新闻的标题
            for item in news_items:
                title = await page.evaluate('(element) => element.textContent', item)
                title = title.strip() if title else ""
                if title:
                    news_list.append(title)
                    total_news += 1
        
        await browser.close()
        return news_list, total_news, url
        
    except Exception as e:
        print(f"Error fetching news: {e}")
        return [], 0, url

def save_to_markdown(date, news_list, total_news, url):
    """
    将新闻保存为Markdown格式
    """
    markdown_content = f"# 看看新闻 - 本期看点 (共{total_news}条)\n\n"
    markdown_content += f"## 来源：{url}\n\n"
    markdown_content += f"## 时间：{date}\n\n"
    
    for i, news in enumerate(news_list, 1):
        markdown_content += f"{i}. {news}\n\n"
    
    with open('news_summary.md', 'w', encoding='utf-8') as f:
        f.write(markdown_content)

async def main_async():
    date = input("请输入要获取的新闻日期 (格式: YYYY-MM-DD): ")
    try:
        # 验证日期格式
        datetime.strptime(date, '%Y-%m-%d')
        news_list, total_news, url = await fetch_news(date)
        
        if news_list:
            save_to_markdown(date, news_list, total_news, url)
            print(f"成功保存{total_news}条新闻到 news_summary.md")
        else:
            print("未获取到新闻内容")
            
    except ValueError:
        print("日期格式错误，请使用 YYYY-MM-DD 格式")

def main():
    asyncio.get_event_loop().run_until_complete(main_async())

if __name__ == "__main__":
    main()