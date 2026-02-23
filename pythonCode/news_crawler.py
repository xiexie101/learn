import asyncio
import os
from datetime import datetime

import pyppeteer


async def fetch_news(date):
    """
    获取指定日期的新闻内容
    :param date: 日期格式 YYYY-MM-DD
    :return: 新闻列表和总数
    """
    url = f"https://www.kankanews.com/program/KBkDwmqwldZ/{date}"

    try:
        browser = await pyppeteer.launch({
            'headless': True,
            'args': ['--no-sandbox', '--disable-dev-shm-usage']
        })
        page = await browser.newPage()
        await page.setViewport({'width': 1366, 'height': 768})
        await page.goto(url, {'waitUntil': 'networkidle0'})
        await page.waitForSelector('.tab-list span')

        tabs = await page.querySelectorAll('.tab-list span')

        news_list = []

        for tab in tabs:
            await tab.click()
            await asyncio.sleep(1)

            news_items = await page.querySelectorAll('.scroll-container .current-list li div.title')

            for item in news_items:
                title = await page.evaluate('(element) => element.textContent', item)
                title = title.strip() if title else ""
                if title:
                    news_list.append(title)

        await browser.close()
        return news_list, url

    except Exception as e:
        print(f"获取新闻失败: {e}")
        return [], url


def save_to_markdown(date, news_list, url):
    """
    将新闻保存为Markdown格式，存到 news/日期.md
    """
    # 确保 news 目录存在
    news_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news')
    os.makedirs(news_dir, exist_ok=True)

    filepath = os.path.join(news_dir, f'{date}.md')
    total_news = len(news_list)

    content = f"# 看看新闻 - 本期看点 (共{total_news}条)\n\n"
    content += f"- 来源：{url}\n"
    content += f"- 时间：{date}\n\n"
    content += "---\n\n"

    for i, news in enumerate(news_list, 1):
        content += f"{i}. {news}\n\n"

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return filepath


async def main_async():
    today = datetime.now().strftime('%Y-%m-%d')
    date_input = input(f"直接回车获取当天新闻 ({today})，或输入日期 (YYYY-MM-DD)：").strip()

    if date_input:
        try:
            datetime.strptime(date_input, '%Y-%m-%d')
            date = date_input
        except ValueError:
            print("❌ 日期格式错误，请使用 YYYY-MM-DD 格式")
            return
    else:
        date = today

    print(f"📡 正在获取 {date} 的新闻...")
    news_list, url = await fetch_news(date)

    if news_list:
        filepath = save_to_markdown(date, news_list, url)
        print(f"✅ 成功保存 {len(news_list)} 条新闻到 {filepath}")
    else:
        print("❌ 未获取到新闻内容")


if __name__ == "__main__":
    asyncio.run(main_async())