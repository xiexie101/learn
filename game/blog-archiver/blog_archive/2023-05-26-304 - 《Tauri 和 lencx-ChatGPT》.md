---
title: "304 - 《Tauri 和 lencx/ChatGPT》"
date: 2023-05-26
url: https://sorrycc.com/tauri-and-lencx-chatgpt
---

发布于 2023年5月26日

# 304 - 《Tauri 和 lencx/ChatGPT》

lencx/ChatGPT 是一个 ChatGPT 官网的套壳客户端，个人一直在用，用他的原因主要是可以结合 Thor 软件实现一键激活和隐藏。这个软件可以通过「⌘+⇧+R」切出配置后台，里面包含 Prompt、Scripts、Notes 等功能，但我一个都没用过，哈哈。

他基于 tauri 实现，地址是 [GitHub - lencx/ChatGPT: 🔮 ChatGPT Desktop Application (Mac, Windows and Linux)](https://github.com/lencx/ChatGPT) 。今天算是我第二次接触 tauri，第一次接触时只跑过 hello world。简单翻了下 tauri 的文档和 lencx/ChatGPT 的源码，发现好简单。

先介绍下我理解的 tauri。

```bash
sh <(curl https://create.tauri.app/sh)
cd tauri-app
pnpm i && pnpm tauri dev
```

1、通过以上三行命令可以创建一个项目尝鲜。创建之后，整理目录是前端项目，其中有个 src-tauri 的目录是 Rust 端的目录，src-tauri/tauri.conf.json 是项目配置文件。

2、tauri 封装了大量 API 常用 API，可以在 Rust 层调，部分也可以在前端直接调，这相比 Electron 的开发体验会好很多。

3、前后端通讯通过 command 和 event。Rust 层定义 command，然后前端通过 `await invoke('command_name')` 的方式调用；event 也是前后端可以互通。

4、此外，常用的菜单注册、系统托盘、多窗口、测试、分发、调试等也都有官方方案。同时 tauri 2-alpha 还支持 mobile 端，可以产出 ios 和 andriod App。

再看 lencx/ChatGPT。

1、如果抛开后台配置功能，他所做的就是注册菜单、注册命令、打开 [chat.openai.com](http://chat.openai.com)，以及注入自定义脚本。

2、没了。写到这发现没啥好写的了。。

参考：  
[Tauri 官网](https://tauri.app/)  
[GitHub - tauri-apps/awesome-tauri: 🚀 Awesome Tauri Apps, Plugins and Resources](https://github.com/tauri-apps/awesome-tauri)
