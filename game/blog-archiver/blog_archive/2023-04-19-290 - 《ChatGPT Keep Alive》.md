---
title: "290 - 《ChatGPT Keep Alive》"
date: 2023-04-19
url: https://sorrycc.com/chatgpt-keep-alive
---

发布于 2023年4月19日

# 290 - 《ChatGPT Keep Alive》

背景是，上周末用台湾节点升级 ChatGPT 之后，然后就把到 ChatGPT 的 节点路线换成了台湾区域。结果这几天在用 ChatGPT 时，频繁遇到 Session 失效问题，平均 30s 多点就失效，很影响效率。我以为是 ChatGPT 更新了，然后上午群里有同事在讨论这个，有人建议换 IP 试试。然后我试了下，结合我调研 [https://github.com/xcanwin/KeepChatGPT](https://github.com/xcanwin/KeepChatGPT) 的实现，整理结论如下。

我的结论如下，包含 Plus 和非 Plus 的不同解。

1、首先得确保 IP 没问题，比如我用台湾区不行，切日本区就可以。如果 IP 有问题，不管是 Plus 用户还是免费用户，不管用不用脚本，30s 左右都会失效，得刷新才行。

2、尊贵的 Plus 用户默认就是 Keep Alive 的，无需额外脚本。如果有遇到，那是 IP 问题，切代理解，用脚本 keep Alive 无效。

3、免费用户用 [https://github.com/xcanwin/KeepChatGPT](https://github.com/xcanwin/KeepChatGPT) 应该是可以的，但是这个脚本，1）比较花哨，2）轮询是定时 30s，没加随机。可以考虑用我刚整理的 [https://github.com/sorrycc/keep-chatgpt-simple](https://github.com/sorrycc/keep-chatgpt-simple)

4、如果你不希望全局代理走日本，可以加规则，只让 [cdn.openai.com](http://cdn.openai.com) [api.openai.com](http://api.openai.com) [chat.openai.com](http://chat.openai.com) 这三个域名走代理。

5、如果是 [https://github.com/lencx/ChatGPT](https://github.com/lencx/ChatGPT) 客户端用户 + 免费版，可按快捷键「⌘+J」打开注入脚本文件，添加 [https://github.com/sorrycc/keep-chatgpt-simple](https://github.com/sorrycc/keep-chatgpt-simple) 里的脚本部分 Keep Alive。

6、如果不是冲着 GPT-4 去的，免费用户建议用 TOKEN + 客户端的方式，3.5 的 TOKEN 那么便宜。。所以，从最佳实践角度看，这个脚本其实没啥存在的意义。
