# 喵喵机手势分解视图 (Gesture Explode Viewer)

这是一个纯前端的交互式网页 Demo。用户可以通过电脑摄像头，使用**握拳/张开手掌**的手势，实时控制喵喵机的爆炸分解/组合动画进度。

## 功能特性

- **🖐️ 实时手势控制**：使用 Google MediaPipe Hands 方案，精准捕捉手势。
  - **握拳**：展示喵喵机组装完成的初始状态。
  - **张开手掌**：随着手指张开的程度，喵喵机零件逐渐分离，完全张开时展示完全爆炸分解状态。
- **✨ 极简 Apple 风格设计**：纯白呼吸感背景，无冗余按钮与控制条。手势提示采用科技感蓝紫渐变及呼吸发光动效。
- **📷 实时反馈窗**：左下角提供去除了背景干扰的半透明摄像头小窗，并配有状态指示灯（绿色表示识别到手势）。
- **⚡ 纯本地无后端**：不需要任何复杂的后端服务，纯客户端 HTML/JS 运行。

## 目录结构

```text
gesture-explode/
├── index.html         # 核心代码与页面结构（包含基于 MediaPipe 的 JS 逻辑代码）
├── frames/            # 存放 74 张由视频提取出的逐帧 PNG 图片
│   ├── frame_0001.png # 组装完成状态
│   ├── ...
│   └── frame_0074.png # 完全爆炸分解状态
└── README.md          # 项目文档
```

## 运行方式 (本地测试)

由于浏览器对调用摄像头的安全策略（`getUserMedia` 必须在 HTTPS 或 `localhost` 环境下运行），你不能直接双击打开 HTML 文件，而是需要启动一个本地 HTTP 服务。

### 方法一：使用 Python (推荐)

Mac/Linux 通常自带 Python 环境。在终端中进入项目根目录：

```bash
cd /Users/xieshijin/jin/learn/ai/gesture-explode
python3 -m http.server 8080
```

然后在浏览器中打开：[http://localhost:8080](http://localhost:8080)

### 方法二：使用 Node.js (http-server)

如果你有 Node 环境，可以使用 `http-server`：

```bash
npx http-server -p 8080
```

## 依赖声明与致谢

- **MediaPipe Tasks Vision**: 用于实时的本地手势识别 (`@mediapipe/tasks-vision`)。模型文件通过 jsDelivr CDN 加载。
- 视频逐帧提取由 `FFmpeg` 完成。
- UI/UX 设计理念参考极简白底的产品展示风格。

test