# 🎮 WHACK! · 3D 卡通打地鼠

一款基于 **Three.js** 开发的卡通着色（Cel-shaded / Toon Shader）3D 打地鼠网页游戏。

在线对标：`https://whack-game.pages.dev/`

---

## ✨ 核心特性

- 🎨 **卡通着色管线 (Cel-Shading & Inverted-Hull Outlines)**：
  - 定制阶梯色阶渐变（DataTexture GradientMap）与动漫风格高光。
  - 动态反向法线多边形外描边（Inverted Hull Technique），随网格形变自动贴合。
  - 暖色调环境阴影与柔和边缘光（Rim Lighting）。
- 🐹 **生动怪物与表情状态机**：
  - 9 洞独立状态机：出洞起伏、惊讶眨眼、受击挤压扁平化（Squash & Stretch）。
  - 多样化角色：普通可爱小怪、金色高倍率小怪、带引线火花的危险炸弹。
  - 锤子悬停接近时触发惊恐（Surprised）表情。
- 🔨 **物理弹性悬浮锤子**：
  - 弹簧阻尼物理跟随（Spring-Damper Physics），根据移动速度动态侧倾。
  - 击打挥动四次方加速动画曲线（Quartic Ease-In），击中瞬间产生弹性压扁与敲击震颤。
  - 触控屏即点即敲，桌面端支持鼠标平滑滑动敲击与小键盘 1–9 快捷映射。
- 💥 **丰富的视觉反馈与震动体验**：
  - InstancedMesh 星星粒子四散喷发、烟雾团、冲击波环圈。
  - 经典美式漫画拟声词飘字（`BONK!`、`POW!`、`WHAM!`、`OUCH!`、`BOOM!`、`+3x!`）。
  - 摄像机镜头剧烈晃动（Screen Shake）与触屏设备物理震动（Vibration API）。
- 🎵 **纯原生 Web Audio API 程序化声效合成**：
  - 零外部音频素材依赖，纯数学波形实时生成：挥锤呼啸（Whoosh）、击中清脆敲击（Bonk + 连击音高爬升）、炸弹爆炸轰鸣（Boom）、失手空击（Whiff）、倒计时 Tick 与通关 Jingle。
- 📱 **多端性能自适应**：
  - 移动端与低配设备自适应合批网格（`mergeByMaterial`）、简化阴影投射与动态 DPR 调整。
  - 离线/模型加载失败兜底：内置程序化 3D 几何体（Procedural Placeholder）无缝降级运行。

---

## 🕹️ 游戏操作指南

| 操作方式 | 行为 |
| :--- | :--- |
| **鼠标点击 / 移动** | 移动锤子落点，左键挥锤敲击 |
| **移动端触控** | 手指点击屏幕任意位置瞬间落锤 |
| **小键盘 1 – 9** | 对应 9 个地洞（前排 1-2-3，中排 4-5-6，后排 7-8-9）瞬间移锤并敲击 |
| **空格 / 回车 (Space / Enter)** | 快速开始游戏 / 再玩一局 |
| **H 键** | 切换影院无 UI 观赏模式（Cinema Mode） |

---

## 🏆 计分规则

- **普通小怪**：+10 分，累积连击数。
- **金色小怪**：+30 分 × 当前连击倍率（最高 8 倍倍率）。
- **炸弹**：-25 分，清空连击，引发强震动与屏幕爆炸震颤。
- **连击系统 (Combo)**：连续命中提升计分倍率，小怪逃脱或挥空敲在空洞将重置连击。
- **每局时限**：45 秒倒计时挑战。

---

## 📂 项目结构

```text
webapp/whack-game/
├── index.html           # 游戏入口、HUD 布局、ImportMap 与样式
├── assets/              # 3D 二进制模型与孔位布局数据
│   ├── cabinet.glb      # 打地鼠木质机台
│   ├── monster.glb      # 可爱小怪 3D 模型
│   ├── hammer.glb       # 充气玩具锤 3D 模型
│   └── layout.json      # 9 洞三维坐标、倾角与尺寸规范
├── icons/               # 高清 Favicon 与 PWA 图标
├── src/
│   ├── main.js          # 核心游戏循环、Three.js 场景渲染与输入调度
│   ├── assets.js        # GLTF 加载器与几何体降级兜底生成
│   ├── toon.js          # Cel-shading 卡通着色器与描边管线
│   ├── monsters.js      # 9 洞怪物状态机与形变插值
│   ├── hammer.js        # 3D 弹性锤子物理运动与击打曲线
│   ├── aim.js           # 落点投影阴影与动态呼吸瞄准环
│   ├── particles.js     # 星星/烟雾粒子与漫画文本精灵
│   ├── audio.js         # Web Audio API 原生声学合成器
│   ├── ui.js            # 分数板、连击动画与倒计时 HUD
│   ├── tier.js          # 设备性能分级与画质自适应策略
│   └── director.js      # 演示模式与自动化录制驱动系统
└── README.md
```

---

## 🚀 本地运行

由于浏览器出于安全策略（CORS）禁止通过 `file://` 协议读取本地 `.glb` 模型与 ES Module 依赖，请在本地启动 HTTP 静态服务器运行：

```bash
# 进入目录
cd webapp/whack-game

# 使用 Python 启动本地服务
python3 -m http.server 8080

# 或使用 Node.js npx serve
npx serve .
```

在浏览器中打开 `http://localhost:8080` 即可开始游戏！
