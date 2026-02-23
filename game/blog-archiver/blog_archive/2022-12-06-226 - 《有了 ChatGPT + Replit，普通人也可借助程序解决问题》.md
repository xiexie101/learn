---
title: "226 - 《有了 ChatGPT + Replit，普通人也可借助程序解决问题》"
date: 2022-12-06
url: https://sorrycc.com/chatgpt-replit
---

发布于 2022年12月6日

# 226 - 《有了 ChatGPT + Replit，普通人也可借助程序解决问题》

ChatGPT 太火了，出来第一时间就玩上，淘宝花 9 块钱买了个账号，后来又用 sms-activate 接码平台花 1 块 4 自己注册了一个。感觉带来了很多可能性，我想到的有，1）在 google、stackoverflow 之外，多了一个问问题的地方，当然问问题的能力至关重要，问不出好问题自然就得不到好答案，2）可能会取代一堆线上的低级工具，像辞职信生成器、请假条生成器这种，3）ProCode 门槛降低，可能会让 LowCode/NoCode 份额降低？4）普通人（非程序员）也能勤工是哪个借助程序解决问题。下文有个 4）的具体案例。

之前在「鹈鹕社」的 Slack 社区有同学问：

![](https://img.alicdn.com/imgextra/i3/O1CN01BOqz2B23b5VhS49NT_!!6000000007273-2-tps-752-380.png)

这对于会程序的同学来说可能很简单，方案很多。比如，1）用正则匹配标题，2）用 remark 或 marked 分析语法树拿到标题同时带层级信息，3）如果用 Obsidian 会有相关的 toc 插件（其他工具应该也会有相关的）。

但对于非程序员来说，给出的解可能是相对复杂的，比如当时管理员给的解。

![](https://img.alicdn.com/imgextra/i2/O1CN01ZJB2zH1K7Aw0eR43c_!!6000000001116-0-tps-766-1000.jpg)

最近出的 ChatGPT 很强大，感觉之后会有个趋势，让更多非程序员用程序的方式去解决问题。比如前面的问题，我尝试问了下 ChatGPT，他直接给出了程序解，并推荐了 remark 和 marked。注：你也可以用中文提问，由于 token 计算的差异，给出的结果内容会少一些。

![](https://img.alicdn.com/imgextra/i2/O1CN01EfKlnv1JjojcwAEPO_!!6000000001065-2-tps-1264-1572.png)

然后我让他改用 marked 的实现。

![](https://img.alicdn.com/imgextra/i2/O1CN01rqK7Nf1xiWF4c6DqR_!!6000000006477-2-tps-1666-2742.png)

为了验证效果，我在 [replit.com](http://replit.com) 上新建了代码库，选「Node.js」，输入标题，点「Create Repl」。

![](https://image-1256177414.cos.ap-shanghai.myqcloud.com/picgo/20221206163500.png)  
进入后会自动打开「index.js」文件，我们把代码贴进去，然后在左侧新增「[file.md](http://file.md)」作为测试文件，再点击「Run」按钮。就能得到右侧的输出了。

![](https://img.alicdn.com/imgextra/i2/O1CN01kT7BEC1wFNQLazF2t_!!6000000006278-2-tps-3168-1520.png)
