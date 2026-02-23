---
title: "264 - 《本地 ChatGPT Telegram 机器人》"
date: 2023-02-20
url: https://sorrycc.com/chatgpt-telegram-bot
---

发布于 2023年2月20日

# 264 - 《本地 ChatGPT Telegram 机器人》

> 上周跑通的，做下记录。注：1）非 GPT-3，GPT-3 的相对比较笨，是 ChatGPT，2）需要有 ChatGPT 账号，3）需要会科学上网。

1、基于 [ChatGPT Single](https://github.com/bytemate/chatapi-single) 搭建 ChatGPT API Server。

```bash
git clone git@github.com:bytemate/chatapi-single.git
cd chatapi-single
# 复制出 .env 文件并填入 ChatGPT 的邮箱和密码
cp .env.example .env
npm i
npm run dev
```

然后通过 curl 验证下。

```bash
curl -X "POST" "http://localhost:4000/message" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "message": "Hello"
}'
```

2、申请 Telegram 机器人，并记录 TOKEN。可参考 [235 - 《Telegram 机器人》](https://sorrycc.com/telegrm-bot)，几分钟之内就可以搞定。然后创建一个包含此机器人的 Group，为了让机器人只回复此群的消息。

3、搭建 Telegram 机器人网关。

```
git clone git@github.com:sorrycc/chatgpt-telegram-bot.git
cd chatgpt-telegram-bot
# 复制出 .env 文件并填入 Telegram 机器人的 TOKEN
cp .env.example .env
npm i
npm run dev
```

4、用 ngrok 实现内网穿透。

```bash
ngrok http 9001
```

然后你可以得到一个地址，比如 [xxx.xx.ngrok.io](http://xxx.xx.ngrok.io) 。

5、更新 Telegram 机器人的 webhook 地址为 [ngrok.io](http://ngrok.io) 的服务器地址。

```bash
curl https://api.telegram.org/bot%TOKEN%/setWebhook?url=https://xxx.xx.ngrok.io/webhook
```

6、验证下。如果顺利，你在群里发送 `/chat who are you`，会看到这样效果。

![](https://img.alicdn.com/imgextra/i4/O1CN01YYVqO31UXs4OCMhwH_!!6000000002528-1-tps-470-536.gif)

参考：  
[235 - 《Telegram 机器人》](https://sorrycc.com/telegrm-bot)
