const puppeteer = require('puppeteer');
const fs = require('fs');

async function fetchNews(date) {
    // 格式化URL
    const url = `https://www.kankanews.com/program/KBkDwmqwldZ/${date}`;
    
    try {
        // 启动浏览器
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        
        // 访问URL
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // 等待页面加载
        await page.waitForSelector('.tab-list span');
        
        // 获取所有标签页
        const tabs = await page.$$('.tab-list span');
        
        let newsList = [];
        
        // 遍历点击每个标签页
        for (const tab of tabs) {
            await tab.click();
            // 等待内容加载
            await page.waitForTimeout(1000);
            
            // 获取当前标签页下的新闻列表
            const newsItems = await page.$$('.scroll-container .current-list li div.title');
            
            // 提取每条新闻的标题
            for (const item of newsItems) {
                const title = await page.evaluate(element => element.textContent.trim(), item);
                if (title) {
                    newsList.push(title);
                }
            }
        }
        
        await browser.close();
        
        return {
            newsList,
            totalNews: newsList.length,
            url
        };
    } catch (error) {
        console.error(`Error fetching news: ${error}`);
        return {
            newsList: [],
            totalNews: 0,
            url
        };
    }
}

function saveToMarkdown(date, { newsList, totalNews, url }) {
    let markdownContent = `# 看看新闻 - 本期看点 (共${totalNews}条)\n\n`;
    markdownContent += `## 来源：${url}\n\n`;
    markdownContent += `## 时间：${date}\n\n`;
    
    newsList.forEach((news, index) => {
        markdownContent += `${index + 1}. ${news}\n\n`;
    });
    
    fs.writeFileSync('news_summary.md', markdownContent, 'utf-8');
}

async function main() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question('请输入要获取的新闻日期 (格式: YYYY-MM-DD): ', async (date) => {
        // 简单验证日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            console.log('日期格式错误，请使用 YYYY-MM-DD 格式');
            readline.close();
            return;
        }
        
        const result = await fetchNews(date);
        
        if (result.newsList.length > 0) {
            saveToMarkdown(date, result);
            console.log(`成功保存${result.totalNews}条新闻到 news_summary.md`);
        } else {
            console.log('未获取到新闻内容');
        }
        
        readline.close();
    });
}

main(); 