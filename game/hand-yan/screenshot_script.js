const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file://' + __dirname + '/index.html');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({path: 'screenshot.png'});
  await browser.close();
})();
