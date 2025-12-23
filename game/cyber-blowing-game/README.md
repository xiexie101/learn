# 🎤 赛博吹气游戏 | Cyber Blowing Game

通过麦克风检测吹气强度的 3D 互动游戏。

## 🎮 游戏模式

| 模式 | 说明 |
|------|------|
| 🕯️ 吹灭蜡烛 | 吹气熄灭 3D 蜡烛 |
| 🫧 吹泡泡 | 吹出飘动的泡泡 |
| 🎡 吹风车 | 让风车旋转起来 |
| 🌼 吹蒲公英 | 吹散蒲公英种子 |

## 🚀 快速开始

```bash
cd cyber-blowing-game
python3 -m http.server 8080
```

打开浏览器访问：http://localhost:8080

## 📱 使用说明

1. **授权麦克风** - 点击授权按钮允许麦克风访问
2. **选择模式** - 从四种游戏模式中选择
3. **调节灵敏度** - 根据麦克风性能调整灵敏度
4. **对着麦克风吹气** - 观察 3D 效果！

## ⚙️ 项目结构

```
cyber-blowing-game/
├── index.html      # 主页面
├── style.css       # 样式
├── app.js          # 主逻辑
├── modes/          # 游戏模式
│   ├── candle.js   # 蜡烛模式
│   ├── bubble.js   # 泡泡模式
│   ├── pinwheel.js # 风车模式
│   └── dandelion.js# 蒲公英模式
└── utils/          # 工具函数
    ├── audio.js    # 音频处理
    └── windMeter.js# 风力计
```

## 📱 设备要求

- 现代浏览器（Chrome / Safari / Edge）
- 麦克风
- 网络连接（加载 Three.js 库）

---

Made with ❤️ using Three.js
