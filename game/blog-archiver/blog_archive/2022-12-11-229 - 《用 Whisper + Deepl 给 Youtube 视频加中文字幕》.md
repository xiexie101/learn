---
title: "229 - 《用 Whisper + Deepl 给 Youtube 视频加中文字幕》"
date: 2022-12-11
url: https://sorrycc.com/youtube-subtle-with-whisper
---

发布于 2022年12月11日

# 229 - 《用 Whisper + Deepl 给 Youtube 视频加中文字幕》

跑通了的流程，踩了几个小坑，简单做下笔记。不仅适用于 Youtube，可以给任意语言的视频加中文字幕。我是在 Win 上跑的，因为可以利用显卡用 GPU 跑，比 CPU 跑快太多了。

1、安装 Whisper。

git 配代理。（安装 whisper 不开会报错）

```bash
git config --global http.proxy http://127.0.0.1:7890
```

安装 scoop。（用来安装 ffmpeg）

```bash
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh -outfile 'install.ps1'
.\install.ps1 'D:\Work\Scoop' -RunAsAdmin
```

安装 ffmpeg。（whisper 依赖他）

```bash
scoop install ffmpeg
```

安装 Python 3.9。（不能安装最新的 3.11，有些库不兼容）

```bash
scoop bucket add versions
scoop install python39
```

安装 whisper。

```bash
pip install git+https://github.com/openai/whisper.git
whisper -h
```

安装带 cuda 版的 torch。（默认是不带 cuda 版的，只能用 cpu 跑，慢地很）

```bash
pip install torch==1.12.1+cu116 torchvision==0.13.1+cu116 torchaudio==0.12.1 --extra-index-url https://download.pytorch.org/whl/cu116
```

2、下载 Youtube 视频。

我是用 Downie 下的，可以选择视频或音频。我是两个都下一份，然后把音频的给 whisper 转换，会快好多。

3、提取英文字幕。

```bash
whisper ./foo.mp3 --device cuda 
```

会得到 foo.mp3.srt、foo.mp3.txt 和 foo.mp3.vtt 三个文件。

4、DeepL 翻译字幕。

翻译有多个方案。比如，1）用在线的 [SubtitleEdit Online](https://www.nikse.dk/subtitleedit/online)，可惜不支持 DeepL，2）编程处理 .srt 文件，提取内容、翻译、再放回去，需要注意断句的处理，3）[DeepL 官网](https://www.deepl.com/en/translator/files)支持 docx 文件的翻译，新建 docx 文件把 srt 的内容贴进去，让 DeepL 翻译，拿到只读版本的 docx，然后另存为 html 文件，复制内容倒 srt 文件。

我选的是方案 3。

5、找个视频播放器验证，我用的 IINA。或者用 Chrome 把外挂的 srt 内置到 youtube 原有视频里展示，比如 [youtube.external.subtitle](https://github.com/siloor/youtube.external.subtitle)。

![](https://img.alicdn.com/imgextra/i1/O1CN01ZxU0Qa1mgGWKpNX0g_!!6000000004983-2-tps-2144-1304.png)

跑完流程后想到的一些 TODO：

1、把整个流程做成自动的，输入是 Youtube URL，输出是中文 .srt 文件。  
2、尝试 cpp 版本的 whisper，缺点是不支持 gpu，如果输入是音频，用 cpu 跑应该也不慢。  
3、可以包成一个产品，对外提供服务。

参考：  
[找不到现成的字幕？Whisper 让不懂外语的你也能看懂日剧 - 少数派](https://sspai.com/post/76899)  
[找不到字幕？Whisper 让不懂外语的你也能看懂日剧 | LearnData-开源笔记](https://newzone.top/_posts/2022-11-18-whisper_ai_subtitles.html)  
[GitHub - ScoopInstaller/Install: 📥 Next-generation Scoop (un)installer](https://github.com/ScoopInstaller/Install#for-admin)  
[Previous PyTorch Versions | PyTorch](https://pytorch.org/get-started/previous-versions/)  
[Nikse - Subtitle Edit online](https://www.nikse.dk/subtitleedit/online)  
[GitHub - openai/whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://github.com/openai/whisper)  
[GitHub - ggerganov/whisper.cpp: Port of OpenAI’s Whisper model in C/C++](https://github.com/ggerganov/whisper.cpp)  
[GitHub - siloor/youtube.external.subtitle: Add subtitle to Embedded YouTube videos](https://github.com/siloor/youtube.external.subtitle)  
[Subtitles For YouTube | Chrome Web Store - Extensions](https://chrome.google.com/webstore/detail/subtitles-for-youtube/oanhbddbfkjaphdibnebkklpplclomal/related?hl=en)  
[Whisper - a Hugging Face Space by openai](https://huggingface.co/spaces/openai/whisper)  
[GitHub - chidiwilliams/buzz: Buzz transcribes and translates audio offline on your personal computer. Powered by OpenAI’s Whisper.](https://github.com/chidiwilliams/buzz)  
[Youtube Whisperer - a Hugging Face Space by jeffistyping](https://huggingface.co/spaces/jeffistyping/Youtube-Whisperer)
