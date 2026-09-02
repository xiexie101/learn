# 八段锦每日运动追踪器 (Eight-Section Brocade Tracker)

这是一个融合了传统养生理念与现代Web技术的渐进式Web应用(PWA)，旨在帮助用户养成每日练习八段锦的习惯。

## 🌟 核心功能

*   **每日打卡**: 轻松记录八段锦八式练习进度。
*   **禅意花园**: 随着您的坚持，荒芜的石地将逐渐演变成繁茂的禅意花园 (SVG动画)。
*   **音效反馈**: 内置Web Audio合成的木鱼声和钟声，无需外部资源。
*   **成就系统**: 追踪连击、等级和特殊里程碑，解锁精美徽章。
*   **月度日历**: 直观查看每月的练习历史。
*   **离线可用**: 支持PWA，安装到手机后可离线使用。

## 🚀 快速开始

### 方式 1: 直接运行
双击项目目录下的 `index.html` 文件，即可在浏览器中打开应用。

### 方式 2: 本地服务器 (推荐)
为了获得完整的 PWA 体验（如安装到手机、离线支持），建议使用本地服务器运行。

1.  打开终端，进入项目目录：
    ```bash
    cd /Users/xieshijin/jin/learn/ai/baduanjin-tracker
    ```

2.  启动 Python 简易服务器：
    ```bash
    python3 -m http.server 8000
    ```

3.  在浏览器中访问：
    `http://localhost:8000`

## 📱 移动端安装 (PWA)

您可以将此应用添加到手机主屏幕，获得类似原生应用的体验：

1.  在手机浏览器 (Safari/Chrome) 中打开应用。
2.  点击浏览器的 "分享" (iOS) 或 "菜单" (Android) 按钮。
3.  选择 "添加到主屏幕"。

## 📂 项目文档

更多详细文档请查看 `docs/` 目录：

*   [设计方案 (DESIGN.md)](docs/DESIGN.md): 详细的设计理念、视觉风格和功能规划。
*   [任务清单 (TASKS.md)](docs/TASKS.md): 开发过程中的任务追踪列表。
*   [功能演示 (WALKTHROUGH.md)](docs/WALKTHROUGH.md): 详细的功能介绍和使用演示。

## 🛠️ 技术栈

*   **HTML5**: 语义化标签，SVG 绘图
*   **CSS3**: CSS 变量，Flexbox/Grid 布局，动画
*   **JavaScript (ES6+)**: 模块化开发，Web Audio API，LocalStorage
*   **PWA**: Service Worker, Web App Manifest

## 📄 许可证

MIT License
