# OVERPRINT — ISKRA.GRAPHICS 404 复刻项目

> 本项目为 **[iskra.graphics/404](https://iskra.graphics/404)** 的 1:1 高保真原生复刻工程。

---

## 🎨 页面美学与设计哲学深度分析

### 1. 瑞士网格与印刷质感 (Swiss Brutalism & Printmaking Aesthetic)
- **套印（Overprinting）隐喻**：
  - 灵感源自传统胶印与丝网分色印刷工艺。整个 404 页面被设计为一张正在印刷的纸张，404 错误代表版面出现异常。
  - 玩家通过消灭侵蚀印版的“油墨杂质与故障几何体”，最终完成“404 RESTORED”并修复版面。
- **色彩规范 (Strict CMYK Palette)**：
  - **底纸色 (Paper)**: `#EFECE3`（温润哑光米白底）
  - **主墨色 (Ink)**: `#161513`（高浓度炭黑）
  - **专色油墨**:
    - Cyan: `#12A3DA`
    - Magenta: `#EC0A63` (主交互高亮色)
    - Yellow: `#F7CF16`
    - Green (C+Y): `#00A651`
    - Violet (C+M): `#4A44A0`
    - Red (M+Y): `#E40808`
- **版式与细节**：
  - 字体采用工整硬朗的等宽字体 **IBM Plex Mono**。
  - 四角与视口边缘分布有印刷校色对齐十字（Registration Plusses `+`）。
  - 所有 UI、准星、小地图、波次指示器均以纯几何线条与排印文本呈现。

---

## 🛠️ 技术架构与亮点解析

### 1. 纯原生现代标准 (Zero Dependencies)
- **无打包依赖**：无需 Node.js/Webpack/Vite，基于原生 **ES Modules**。
- **零外部素材**：所有矢量字符、标识（Wordmark）、武器形状、粒子和特效全部在 Canvas 2D 中实时数学绘制。

### 2. 120Hz 固定时间步长仿真 (Fixed Timestep Simulation)
- 在 `main.js` 与 `game.js` 中采用 `FIXED = 1 / 120` 的恒定微步进逻辑。
- 保证物理碰撞、子弹弹道、敌人追踪在任何刷新率（60Hz、120Hz、144Hz）屏幕和设备上完全确定性（Deterministic），为排行榜竞速（Speedrun）提供防作弊与回放基础。

### 3. 纯代码 Web Audio 合成器 (`src/audio.js`)
- **零音频文件加载**：没有 `.mp3`/`.wav`。
- **物理层叠音效**：
  - 每次开火由「瞬态白噪声爆破音 (Transient Crack)」+「带音调振荡主体 (Pitched Body)」+「衰减尾音 (Decay Tail)」三层并行调制。
  - 贯穿式总线低通滤波（BiquadFilter）与动态压缩器（DynamicsCompressor），支持子弹时间（Time Dilation）沉浸音效。

### 4. 移动端与跨平台支持 (`src/touch.js`)
- 移动端自动激活虚拟双摇杆（左侧移动、右侧射击）。
- 适配 Safe Area Inset，禁用页面滚动与双击缩放。

### 5. 双轨排行榜机制 (`src/net.js`)
- 原生支持远程 API 代理。
- 增强本地 `LocalStorage` 持久化与排行榜自动沉淀机制，单机离线状态下同样可体验通关竞速与登记排名的完整乐趣。

---

## 🎮 操作指南 (Controls)

| 操作 | 桌面端 (Desktop) | 移动端 (Touch) |
|---|---|---|
| **移动** | `W` / `A` / `S` / `D` 或 方向键 | 左半屏虚拟摇杆 |
| **瞄准/射击** | 鼠标移动瞄准 + 鼠标左键开火 | 右半屏虚拟摇杆 |
| **冲刺 (Dash)** | `Space` 空格键 | 双击或冲刺按钮 |
| **重掷/副技能** | 鼠标右键 或 `Q` 键 | 专用触控按键 |
| **重新开始本层** | `Backspace` 退格键 | - |
| **静音切换** | `M` 键 | - |
| **开始游戏** | `Enter` 回车键 或 点击屏幕 | 触碰屏幕 |

---

## 📂 文件目录结构

```text
webapp/iskra-404/
├── index.html          # 主入口文件（包含 Canvas 视口与响应式控制）
├── README.md           # 架构分析与操作手册
└── src/
    ├── main.js         # 游戏主循环、事件监听与时间步长调度
    ├── game.js         # 游戏核心状态机、碰撞检测与战斗逻辑
    ├── render.js       # Canvas 2D 渲染引擎与视觉特效管线
    ├── entities.js     # 武器库、敌人、护盾、实体定义
    ├── level.js        # 程序化关卡与房间生成算法
    ├── hud.js          # 印刷风格 HUD、排行榜、标题与胜利画面
    ├── touch.js        # 移动端触控摇杆与手势系统
    ├── audio.js        # Web Audio 程序化声音合成器
    ├── board.js        # 排行榜种子与规则配置 (Daily/Classic/Free)
    ├── brand.js        # 品牌设计系统、调色板与字标绘制
    ├── net.js          # 本地/远程排行榜网络数据层
    ├── dev.js          # 开发与调试参数
    ├── micro.js        # 微交互与辅助动画
    └── util.js         # 向量数学、缓动与随机数工具库
```

---

## 🚀 运行方式

由于使用了原生 ES Modules，推荐通过任意本地静态 HTTP 服务器打开：

```bash
# 进入目录
cd /Users/xieshijin/jin/learn/ai/webapp/iskra-404

# 使用 Python 启动本地静态服务器
python3 -m http.server 8080

# 在浏览器中访问
# http://localhost:8080/
```
