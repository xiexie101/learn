# Ethereal Touch ✨

基于 MediaPipe 手势识别与 Three.js 3D 粒子系统的沉浸式交互体验。

![Three.js](https://img.shields.io/badge/Three.js-0.160-black?logo=three.js)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-blue)

## 功能特性

- 🖐️ **实时手势追踪** - 使用 MediaPipe Hands 进行精准手部识别
- ✨ **3000 粒子系统** - 高性能 Three.js 粒子渲染
- 🔄 **形状变换** - 支持 7 种形态：球体、圆环、爱心、星形、螺旋、DNA双螺旋、立方体
- 👆 **响指特效** - 拇指中指捏合触发蓄力爆发效果
- 🎨 **赛博朋克美学** - 暗色背景、霓虹光效、雾化效果

## 快速开始

### 1. 本地运行

```bash
# 在 hand-magic 目录下启动本地服务器
python -m http.server 8000
# 或
npx serve .
```

### 2. 访问页面

打开浏览器访问 `http://localhost:8000`，允许摄像头权限即可开始体验。

## 交互指南

| 手势 | 效果 |
|------|------|
| 手掌平摊 | 粒子聚拢形成形状，再次平摊切换形状 |
| 手掌侧立 | 粒子扩散飘散 |
| 拇指中指捏合 | 蓄力效果（青白光芒） |
| 松开捏合 | 触发金色爆发特效 |

## 技术栈

- **前端框架**: 纯 HTML/CSS/JS
- **3D 引擎**: Three.js 0.160
- **手势识别**: MediaPipe Hands
- **渲染模式**: WebGL + 粒子系统（Additive Blending）

## 浏览器兼容

- ✅ Chrome 80+
- ✅ Edge 80+
- ✅ Firefox 75+
- ⚠️ Safari (需 HTTPS)

## 项目结构

```
hand-magic/
├── index.html      # 主程序（HTML + 内嵌 JS）
├── README.md       # 使用说明
└── docs/
    └── designs/    # 设计文档
```

## 已知限制

- 需要良好的光照条件以保证手势识别准确率
- 移动端浏览器需通过 HTTPS 访问
- 建议使用外置摄像头获得更好体验

## License

MIT
