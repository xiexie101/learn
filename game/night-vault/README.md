# 💎 Night Vault · 金库潜行大盗

> 100% 纯前端高保真复刻 Boris Cherny (Anthropic Claude Code 负责人) 的 Claude Artifacts 经典平台跳跃游戏《Night Vault》。<br />
> 包含全部 35 个完整金库关卡、涵盖全套五幕演进体系（The Heist / Upside / Freefall / Tilt / Put It Back）以及 Dream Vaults 梦境关卡生成器，激光挖砖困敌、重力颠倒机关、失重反转、地面倾斜滑移与物归原位防盗机制，零外链依赖的原生 Web Audio 8-bit 程序化音效，以及手机端复古街机虚拟控制。

---

## 🌟 核心特性与工程亮点 (Features & Architecture)

### 1. 🧱 逐像素还原的复古点阵精灵系统 (`sprites.js`)
- **双层红砖瓦片**：错落交错砌砖纹理、深红底色、高光倒角边缘与黑棕砂浆缝隙；被挖掘时呈现坑穴虚化边缘与即将复原时的红光闪烁倒计时。
- **加固防暴钢块**：冷灰蓝工业钢板底色、内嵌阴影导槽与四角防爆铆钉，具备不可挖掘属性。
- **金色逃生梯与金库防爆门**：拾取完全部金条后从顶层显现金色梯子，或开启重型金库防爆门，逃脱通关。
- **角色与守卫多帧像素精灵**：
  - **飞贼小主角**：红色鸭舌帽、白T恤、工装牛仔裤、攀爬/跑动/滑索双手悬挂及挖掘多帧平滑骨骼帧。
  - **巡逻警卫**：绿色安保制服、黑领带与白手套，追捕、落坑挣扎、被压碎与背部携带盗得金条的状态表现。

### 2. 🎵 100% 零依赖 Web Audio 离线音效引擎 (`audio.js`)
- **脚步声 (Footsteps)**：120Hz 极轻微三角波顿促音，伴随走动节奏低噪触发。
- **攀爬咔嗒声 (Ladder Ticks)**：高频短阶跃音，模拟脚踏梯阶的轻脆机械声。
- **激光挖洞声 (Laser Drill)**：扫频方波 + 800Hz 动态带通滤波白噪声颗粒。
- **金条拾取音 (Gold Pickup)**：双音和弦清脆叮咚（C6 -> G6，1046.5Hz / 1567.98Hz）。
- **警卫掉坑 (Trap Thud)**：180Hz 快速衰减方波低沉闷响。
- **逃生梯开启 (Fanfare)**：五音上行分解琶音（C5 - E5 - G5 - C6 - E6），标志通关通道打开。
- **被捕告警 (Busted Siren)**：440Hz -> 80Hz 锯齿波下行低频警报。

### 3. 🎯 35 座完整金库全套关卡数据库 (`levels.js`)
- **ACT I: The Heist (Vault 1 ~ 12)**：掘地、攀爬、绳索与经典逃生梯（Ground Floor, Dig Down, Wire Walk, Cellar, Long Drop, Crossfire, Steel Cage, Clockwork, Deep Mine, Gauntlet, Vault Door, Grand Heist）。
- **ACT II: Upside (Vault 13 ~ 18)**：杠杆翻转机构，踏上操纵杆金库颠倒，金条锁定位移，终点金库门开启（Turnover, Baskets, Elevator, Trapdoor, Pendulum, Topsy Turvy）。
- **ACT III: Freefall (Vault 19 ~ 23)**：铁锹转变为重力反转按钮，空间失重坠落反差解谜（Freefall, Ceiling Walk, Guard Drop, Hourglass, Mirror Maze）。
- **ACT IV: Tilt (Vault 24 ~ 29)**：倾斜滑动金库，惯性滑步与动量困敌（Toy Box, Rattle, Company, Pothole, Marbles, Snow Globe）。
- **ACT V: Put It Back (Vault 30 ~ 35)**：拂晓警报物归原位，将所有金条归还至原位展示柜并在日出前全身而退（Put It Back, Night Watch, Ricochet, Divebomb, Bricklayers, Daybreak）。
- **ACT VI: Dream Vaults**：梦境生成关卡，支持自制与生成自定义迷宫金库。

### 4. 📱 移动端与桌面端双适配交互 (`index.html`)
- **原版复古圆形 D-pad**：左侧 184px 圆形按键盘，支持触控滑动、按压高亮反馈与全向移动。
- **经典高低错落 DIG 按钮**：右侧红褐色街机凹面按钮，左斜下与右斜下激光挖掘。
- **完备的关卡与战绩系统**：
  - 关卡解锁轮播、已解锁/未解锁状态感知与本地 `localStorage` 存档。
  - **CRACKED 结算弹窗**：通关时间、最佳纪录、被捕次数统计及下一关无缝进入。
  - **BUSTED 捕获弹窗**：重试关卡与选关入口。
  - **🌐 中英文即时双向切换**：选关界面与顶部 HUD 提供双语言一键无缝热切换，全套关卡名称、剧情故事、教学提示及界面按键双语覆盖，本地自动持久化保存语言偏好。

---

## 🕹️ 操作指南 (Controls)

| 控制方式 | 移动方向 | 左下挖坑 | 右下挖坑 | 暂停 / 选关 | 静音开关 | 语言切换 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **手机 / 触控屏** | 左侧圆形 D-pad 虚拟方向盘 | 右侧 `↙ 掘地` 按钮 | 右侧 `↘ 掘地` 按钮 | 顶部 `⏸` 按钮 / `✕` | 顶部 `🔊` 按钮 | 选关右上角 / 顶部 `🌐` 按钮 |
| **键盘 (WASD)** | `W / A / S / D` | `Q` 键 或 `Z` 键 | `E` 键 或 `C` 键 | `P` 键 | `M` 键 | 点击右上角 `🌐` 按钮 |
| **键盘 (方向键)** | `↑ / ← / ↓ / →` | `J` 键 | `K` 键 | `P` 键 | `M` 键 | 点击右上角 `🌐` 按钮 |
