# 🎲 Rigamaroll · 拟真骰子决斗 RPG 奇幻冒险

> **100% 纯前端高保真原生复刻 Inkwell 经典作品 [Rigamaroll](https://inkwell.ing/games/rigamaroll/play)**  
> 结合 **Three.js 物理投骰管线**、**SVG 动态木偶骨骼动画系统 (Puppet Animator)**、**动态时序重填轮盘 (Reload Timing Bar)** 与 **Web Audio 原创拟真音效**。  
> 零外部网络依赖、180+ 离线全套矢量与声效资源、500ms 极速冷启动、60FPS 丝滑战斗。

---

## 📸 视觉与交互对比

| 界面状态 | 复刻版截图 | 特性描述 |
| :--- | :--- | :--- |
| **标题画面** | `screenshot_replica_title.png` | 3D D20 悬浮翻滚、实时投射阴影、加载进度感知与一键跳过 |
| **对决舞台** | `screenshot_replica_ready.png` | 橙兜帽游侠 vs 骷髅怪偶、实时生命心之槽、伤害剑标、D4 骰子与尘埃颗粒 |
| **时钟重填** | `screenshot_replica_timing.png` | 剑/盾/骷髅/红心动态目标窗、实时扫描撞针、连击与暴击判定 |
| **暗黑模式** | `screenshot_replica_dark_mode.png` | 完美支持深色 (`#11120f`) 与浅色 (`#f4f0e8`) 主题一键无缝切换 |
| **全屏宽屏** | `screenshot_replica_wide.png` | 侧边栏折叠后自适应撑满，Three.js 视口无级动态重算 |

---

## ✨ 核心系统与技术特性

### 1. 🎲 3D 拟真物理投骰系统 (Three.js Physics Engine)
- **多面体骰子池**：包含 D4, D6, D8, D10, D12, D20 等多面体三维网格建模；
- **真实滚落与震颤**：投掷初速度、重力加速度、桌面多点反弹、减速停滞及动态落地粒子（落地震尘、火花飞溅）；
- **动态柔和阴影**：Three.js 阴影贴图配合实时光照追踪，还原桌游台面的真实立体质感。

### 2. 🎭 SVG 木偶骨骼动力学 (Puppet Studio Animator)
- **多动作状态机**：支持 `idle`（待机呼吸）、`windup`（蓄力起手）、`attack`（出击）、`hurt`（受创震颤）、`recoil`（后仰）、`recover`（回正）、`victory`（胜利雀跃）、`defeat`（倒地）；
- **角色库丰富**：橙色游侠 (Orange Adventurer)、独眼巨怪 (Nobody)、狂暴巨熊 (Bear)、拳斗士 (Brawler)、食人花 (Flower)、绿林蛙 (Frog)、女巫 Hex、稻草人 (Scarecrow)、骷髅 (Skeleton)、公羊 (Ram) 等十余种角色；
- **候场队列与轮替**：支持击溃当前敌人后，候场队列敌人平滑切入战场前线。

### 3. ⏱️ 节奏判定时序重填条 (Reload Timing Meter)
- **扫频撞针判定**：撞针从左至右以动态倍速扫描，按 `Space` 或点击实时刹停；
- **多类型格点交互**：
  - ⚔️ **Swords (利剑)**：成功命中触发角色突刺攻击与伤害结算；
  - 🛡️ **Shields (盾牌)**：激活防御姿态阻挡敌方反击或招架弹反；
  - 💀 **Skulls (骷髅)**：敌意威胁格，增加博弈风险；
  - ❤️ **Hearts (红心)**：恢复生命槽，修补战损；
  - ⏩ **Speed Changes**：变速格调节时序条运动速率；
- **评级与连击反馈**：`GOOD`、`PERFECT +2`、`CRITICAL STRIKE` 与绚丽连击火花动效。

### 4. 🏰 完整 Inkwell 门户容器体验
- **官方 Geist 字体离线集成**：全面采用官方 `Geist` 及 `Geist Mono` 字体，提供原汁原味的字符度量与排版美感；
- **顶栏交互**：
  - `Share`：一键复制游戏链接弹窗；
  - `Give feedback`：反馈提交弹窗；
  - `Theme toggle`：明暗主题（持久化保存至 `localStorage['inkwell-theme']`）；
  - `Invite`：生成对战邀请链接；
  - `Sign in`：支持自定义冒险者玩家昵称；
- **控制台与侧边栏**：
  - 左侧边栏抽屉式折叠/展开（动态切换 `panel-left-close` / `panel-left-open` 图标，自适应撑满舞台）；
  - 实时在线玩家状态指示（`1 person playing`，带有 `users-round` 徽标）；
  - 全屏沉浸切换按钮（动态切换 `maximize` / `minimize` 图标）；
  - 互动聊天流输入框与自适应滚动；
  - **Inkwell 专属加载卡片蒙层**：显示小绿点 + inkwell 品牌、"Loading rigamaroll…" 标题、脉冲进度条与实时加载比例，100% 准备就绪后平滑淡出揭幕舞台；
  - **全域键盘按键无缝透传**：消除焦点丢失导致的吞键现象，任意位置敲击空格或按键均可即时启动标题屏并投骰，带来零延迟打击感。

---

## 🕹️ 操作指南

| 操作 | 键盘按键 | 触控 / 鼠标 | 说明 |
| :--- | :--- | :--- | :--- |
| **启动对决** | 任意键 / `Space` | 单击舞台画布 | 穿透标题屏进入战场 |
| **投掷骰子** | `Space` 或 `Enter` | 单击舞台画布 | 掷出多面体骰子，启动时序条 |
| **时钟判定** | `Space` 或 `Enter` | 单击舞台画布 | 撞针划过目标区间时抓准时机截停 |
| **重新开始** | `Space` 或 `Enter` | 单击“点击重试” | 角色败北后重置关卡与对战队列 |
| **切换主题** | 点击顶栏月亮/太阳图标 | 单击图标 | 浅色米白纸感 / 暗夜深灰黑曜质感 |
| **折叠侧栏** | 点击左侧折叠图标 | 单击图标 | 展开/隐藏左侧聊天面板，释放对决视野 |
| **全屏沉浸** | 点击四角放大图标 | 单击图标 | 进入浏览器沉浸全屏模式 |

---

## 📁 目录架构说明

```
webapp/rigamaroll/
├── index.html                   # 纯净全屏沉浸游戏入口（已移除外围站点栏与侧栏，仅保留游戏核心与全域按键透传）
├── game.html                    # 独立舞台备用启动器
├── game-authoring.json          # 根目录作者配置文件兼容副本
├── README.md                    # 本设计与复刻全景文档
├── dice/
│   ├── index.html               # 核心决斗引擎页面
│   ├── app.bundle.js            # 决斗主逻辑、状态机、投掷与时序管理
│   ├── runtime.bundle.js        # Three.js 物理管线与木偶骨骼渲染器
│   ├── style.css                # 决斗核心样式表（含 Inkwell 字体定义）
│   └── game-authoring.json      # 调色盘与作者配置文件
├── scene3d/
│   └── assets/
│       ├── landing-sprite.svg   # 骰子落地粒子喷溅矢量图
│       ├── landing-sprite-parts.json
│       └── dice/
│           ├── characters/      # 90+ 角色全动作矢量 SVG 与骨骼包围盒
│           ├── emotes/          # 表情气泡矢量图
│           ├── icons/           # 剑、盾、心、升级卡片等 35+ 图标
│           ├── music/           # 3 首高质量原创 Descent 背景音乐
│           └── voices/          # 英雄与怪物全套 Web Audio 语音原声
└── assets/
    ├── fonts/
    │   ├── geist-sans.woff2     # Inkwell 官方 Geist 字体
    │   └── geist-mono.woff2     # Inkwell 官方 Geist Mono 字体
    └── bramble-map/
        └── fonts/
            └── InkwellText-Variable.woff2 # 官方手绘衬线可变字体
```

---

## 🧪 自动化测试与验证

本项目配套完整的端到端对比测试用例，集成 Playwright 与 Python PIL 像素级比对：

```bash
node test_rigamaroll_comparison.js
```

测试覆盖以下 11 项硬核检验点：
1. 本地轻量化 HTTP 服务托管与全静态资产 MIME 规范响应；
2. Inkwell 顶栏品牌标识、导航按钮布局及 Geist 字体加载；
3. 明亮/暗黑模式（Light/Dark Mode）无缝切换与 localStorage 持久化；
4. 左侧边栏折叠/展开与图标动态切换（`panel-left-close` ↔ `panel-left-open`）；
5. 社交弹窗（Share、Feedback、Invite）打开与关闭状态流；
6. Inkwell 专属加载卡片蒙层感知与 100% 准备就绪平滑揭幕；
7. 全域键盘事件无缝透传校验（顶层窗口无需点击直接敲击 Space 穿透标题屏）；
8. 空格按键投掷交互与时序重填轮盘（Timing Bar）呼出校验；
9. 二次按键时序击打与伤害/受创状态机推进校验；
10. 多回合战斗循环与状态机数据流验证；
11. 控制台零致命错误检验。

