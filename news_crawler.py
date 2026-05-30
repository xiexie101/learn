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
    browser = None

    try:
        # 优先尝试连接到现有的浏览器实例
        try:
            browser = await pyppeteer.connect({
                'browserURL': 'http://127.0.0.1:9222',
                'defaultViewport': {'width': 1366, 'height': 768}
            })
            print("✅ 已连接到正在运行的 Chrome。")
        except Exception:
            # 如果连接失败，尝试自行启动
            print("📡 正在启动新的 Chromium 实例...")
            browser = await pyppeteer.launch({
                'headless': True,
                'args': [
                    '--no-sandbox', 
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                ],
                'defaultViewport': {'width': 1366, 'height': 768}
            })

        page = await browser.newPage()
        print(f"  - 正在导航至: {url}")
        
        # 增加超时时间并优化等待条件
        await page.goto(url, {'waitUntil': 'domcontentloaded', 'timeout': 60000})
        await asyncio.sleep(3)
        
        try:
            await page.waitForSelector('.tab-list span', {'timeout': 15000})
        except Exception:
            print(f"⚠️ 在 {date} 页面未发现栏目列表，可能该日无节目存档。")
            return [], url

        tabs = await page.querySelectorAll('.tab-list span')
        news_list = []

        for tab in tabs:
            try:
                tab_name = await page.evaluate('(element) => element.textContent', tab)
                print(f"    - 正在处理栏目: {tab_name.strip() if tab_name else 'Unknown'}")
                await tab.click()
                await asyncio.sleep(1.5)

                news_items = await page.querySelectorAll('.scroll-container .current-list li div.title')

                for item in news_items:
                    title = await page.evaluate('(element) => element.textContent', item)
                    title = title.strip() if title else ""
                    if title and title not in news_list:
                        news_list.append(title)
            except Exception as tab_err:
                print(f"    ⚠️ 栏目处理出错: {tab_err}")

        return news_list, url

    except Exception as e:
        print(f"获取新闻失败: {e}")
        return [], url
    finally:
        if browser:
            try:
                await browser.close()
            except Exception:
                pass


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
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"程序运行异常: {e}")