# 「画中游」实现计划
**日期:** 2025-12-24  
**项目:** AI赋能传统古画互动体验  
**状态:** 待实施

---

## 📋 项目概述

### 目标
创建一个 Web 应用，让用户通过手指触摸"唤醒"《清明上河图》——手指所在位置显示动画，手指离开恢复静态。

### 技术栈
- HTML5 + CSS3 + JavaScript
- Canvas API（遮罩层）
- Video 元素（动画层）
- Touch/Mouse Events（手势识别）

### 预计工期
- MVP: 3-5 天
- 含音效版: +1-2 天

---

## 🗂️ 项目结构

```
living-painting/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式表
├── js/
│   ├── main.js         # 入口文件
│   ├── gesture.js      # 手势识别模块
│   ├── mask.js         # 遮罩层控制
│   └── audio.js        # 音效模块
├── assets/
│   ├── static/         # 静态古画图片
│   ├── video/          # 动画视频
│   └── audio/          # 音效文件
└── README.md           # 项目说明
```

---

## 📦 任务分解

### 任务 1: 项目初始化
**预计时间:** 30 分钟

#### 1.1 创建项目目录
```bash
mkdir -p living-painting/{css,js,assets/{static,video,audio}}
cd living-painting
touch index.html css/style.css js/{main,gesture,mask,audio}.js README.md
```

#### 1.2 初始化 HTML 骨架
**文件:** `index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>画中游 - 清明上河图</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="app">
        <div id="painting-container">
            <!-- Layer 1: 静态层 -->
            <img id="static-layer" src="assets/static/qingming.jpg" alt="清明上河图">
            <!-- Layer 2: 动画层 -->
            <video id="video-layer" loop muted playsinline></video>
            <!-- Layer 3: 遮罩层 -->
            <canvas id="mask-layer"></canvas>
        </div>
    </div>
    <script src="js/gesture.js"></script>
    <script src="js/mask.js"></script>
    <script src="js/audio.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

#### 1.3 基础样式
**文件:** `css/style.css`

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    overflow: hidden;
    background: #1a1a1a;
    touch-action: none; /* 禁用默认触摸行为 */
}

#painting-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow-x: auto;
    overflow-y: hidden;
}

#static-layer,
#video-layer,
#mask-layer {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: auto;
}

#video-layer {
    z-index: 1;
}

#mask-layer {
    z-index: 2;
}
```

#### ✅ 验证方式
1. 用浏览器打开 `index.html`
2. 确认页面无报错
3. 确认三层结构正确叠加

#### 📝 提交信息
```
feat: 初始化项目结构和基础 HTML/CSS
```

---

### 任务 2: 素材准备
**预计时间:** 2-4 小时

#### 2.1 获取静态图片
- 来源: 故宫博物院数字资源 / 维基百科
- 格式: JPG/PNG，高清长卷版本
- 存放: `assets/static/qingming.jpg`

#### 2.2 生成动画视频
**工具:** Runway Gen-3 / Pika Labs / 可灵

**操作步骤:**
1. 将完整长卷切分为 3-5 个片段（如：码头、虹桥、店铺街）
2. 对每个片段上传到 AI 工具生成 3-5 秒循环动画
3. 使用 FFmpeg 拼接成完整长视频：
   ```bash
   ffmpeg -i "concat:part1.mp4|part2.mp4|part3.mp4" -c copy assets/video/qingming-animated.mp4
   ```
4. 转换为 WebM 格式以获得更好压缩：
   ```bash
   ffmpeg -i qingming-animated.mp4 -c:v libvpx-vp9 -b:v 2M assets/video/qingming-animated.webm
   ```

#### 2.3 准备音效（可选）
- 水流声、市井喧嚣、鸟鸣等
- 格式: MP3/OGG
- 存放: `assets/audio/`

#### ✅ 验证方式
1. 静态图和动画视频尺寸一致
2. 动画视频可循环播放无明显跳帧
3. 视频加载性能可接受（< 20MB 为佳）

#### 📝 提交信息
```
feat: 添加清明上河图静态和动画素材
```

---

### 任务 3: 手势识别模块
**预计时间:** 1 小时

#### 3.1 实现手势模块
**文件:** `js/gesture.js`

```javascript
/**
 * 手势识别模块
 * 职责: 监听触摸/鼠标事件，返回当前触点位置
 */

class GestureHandler {
    constructor(element) {
        this.element = element;
        this.isActive = false;
        this.position = { x: 0, y: 0 };
        this.callbacks = {
            onStart: null,
            onMove: null,
            onEnd: null
        };
        this._bindEvents();
    }

    _bindEvents() {
        // 触摸事件
        this.element.addEventListener('touchstart', this._handleStart.bind(this), { passive: true });
        this.element.addEventListener('touchmove', this._handleMove.bind(this), { passive: true });
        this.element.addEventListener('touchend', this._handleEnd.bind(this));
        this.element.addEventListener('touchcancel', this._handleEnd.bind(this));

        // 鼠标事件（桌面端兼容）
        this.element.addEventListener('mousedown', this._handleStart.bind(this));
        this.element.addEventListener('mousemove', this._handleMove.bind(this));
        this.element.addEventListener('mouseup', this._handleEnd.bind(this));
        this.element.addEventListener('mouseleave', this._handleEnd.bind(this));
    }

    _getPosition(e) {
        const rect = this.element.getBoundingClientRect();
        const scrollLeft = this.element.scrollLeft || 0;
        
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left + scrollLeft,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left + scrollLeft,
            y: e.clientY - rect.top
        };
    }

    _handleStart(e) {
        this.isActive = true;
        this.position = this._getPosition(e);
        if (this.callbacks.onStart) {
            this.callbacks.onStart(this.position);
        }
    }

    _handleMove(e) {
        if (!this.isActive && e.type === 'mousemove') return;
        this.position = this._getPosition(e);
        if (this.callbacks.onMove) {
            this.callbacks.onMove(this.position);
        }
    }

    _handleEnd() {
        this.isActive = false;
        if (this.callbacks.onEnd) {
            this.callbacks.onEnd();
        }
    }

    on(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }
}

// 导出
window.GestureHandler = GestureHandler;
```

#### ✅ 验证方式
1. 在控制台测试：
   ```javascript
   const gesture = new GestureHandler(document.getElementById('painting-container'));
   gesture.on('onMove', pos => console.log(pos));
   ```
2. 触摸/移动鼠标时能正确输出坐标

#### 📝 提交信息
```
feat: 实现手势识别模块，支持 touch 和 mouse 事件
```

---

### 任务 4: 遮罩层控制模块
**预计时间:** 1.5 小时

#### 4.1 实现遮罩模块
**文件:** `js/mask.js`

```javascript
/**
 * 遮罩层控制模块
 * 职责: 使用 Canvas 绘制遮罩，在手指位置挖出透明圆形
 */

class MaskController {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.radius = options.radius || 120;        // 透明圆半径
        this.feather = options.feather || 40;       // 羽化边缘宽度
        this.isRevealed = false;
        this.position = { x: 0, y: 0 };
    }

    /**
     * 调整 Canvas 尺寸以匹配容器
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.hide(); // 重绘遮罩
    }

    /**
     * 在指定位置显示透明区域
     */
    reveal(x, y) {
        this.isRevealed = true;
        this.position = { x, y };
        this._draw();
    }

    /**
     * 隐藏透明区域，恢复全遮罩
     */
    hide() {
        this.isRevealed = false;
        this._draw();
    }

    _draw() {
        const { ctx, canvas, radius, feather, position, isRevealed } = this;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 填充黑色遮罩
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (isRevealed) {
            // 使用 destination-out 模式挖洞
            ctx.globalCompositeOperation = 'destination-out';
            
            // 绘制带羽化的圆形渐变
            const gradient = ctx.createRadialGradient(
                position.x, position.y, radius - feather,
                position.x, position.y, radius
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.beginPath();
            ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 中心完全透明
            ctx.beginPath();
            ctx.arc(position.x, position.y, radius - feather, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
            
            // 恢复合成模式
            ctx.globalCompositeOperation = 'source-over';
        }
    }
}

// 导出
window.MaskController = MaskController;
```

#### ✅ 验证方式
1. 手动测试遮罩效果：
   ```javascript
   const mask = new MaskController(document.getElementById('mask-layer'));
   mask.resize(3000, 600);
   mask.reveal(500, 300); // 应该在 (500, 300) 位置出现透明圆
   mask.hide();           // 应该恢复全黑遮罩
   ```

#### 📝 提交信息
```
feat: 实现遮罩层控制，支持带羽化的圆形透明区域
```

---

### 任务 5: 主程序集成
**预计时间:** 1 小时

#### 5.1 实现主程序
**文件:** `js/main.js`

```javascript
/**
 * 主程序
 * 职责: 初始化各模块，协调工作流程
 */

(function() {
    'use strict';

    // DOM 元素
    const container = document.getElementById('painting-container');
    const staticLayer = document.getElementById('static-layer');
    const videoLayer = document.getElementById('video-layer');
    const maskLayer = document.getElementById('mask-layer');

    // 模块实例
    let gesture, mask;

    /**
     * 初始化
     */
    function init() {
        // 设置视频源
        videoLayer.src = 'assets/video/qingming-animated.webm';
        videoLayer.load();

        // 等待静态图加载完成
        if (staticLayer.complete) {
            onImageLoaded();
        } else {
            staticLayer.addEventListener('load', onImageLoaded);
        }
    }

    /**
     * 图片加载完成后初始化尺寸和模块
     */
    function onImageLoaded() {
        const width = staticLayer.naturalWidth;
        const height = staticLayer.naturalHeight;

        // 设置容器和各层尺寸
        videoLayer.style.width = width + 'px';
        videoLayer.style.height = height + 'px';
        
        // 初始化遮罩
        mask = new MaskController(maskLayer, {
            radius: 120,
            feather: 40
        });
        mask.resize(width, height);

        // 初始化手势
        gesture = new GestureHandler(container);
        gesture.on('onStart', handleGestureStart);
        gesture.on('onMove', handleGestureMove);
        gesture.on('onEnd', handleGestureEnd);

        console.log('🎨 画中游初始化完成');
    }

    /**
     * 手势开始
     */
    function handleGestureStart(pos) {
        videoLayer.play().catch(() => {}); // 静默处理自动播放限制
        mask.reveal(pos.x, pos.y);
    }

    /**
     * 手势移动
     */
    function handleGestureMove(pos) {
        mask.reveal(pos.x, pos.y);
    }

    /**
     * 手势结束
     */
    function handleGestureEnd() {
        mask.hide();
        // 可选: 暂停视频以节省资源
        // videoLayer.pause();
    }

    // 启动
    init();
})();
```

#### ✅ 验证方式
1. 打开 `index.html`
2. 用手指/鼠标在画面上滑动
3. 确认：
   - 手指位置显示动画内容
   - 手指离开后恢复静态
   - 边缘有羽化过渡效果

#### 📝 提交信息
```
feat: 集成各模块，实现核心交互功能
```

---

### 任务 6: 音效模块（可选）
**预计时间:** 1 小时

#### 6.1 实现音效模块
**文件:** `js/audio.js`

```javascript
/**
 * 音效模块
 * 职责: 管理背景音效，可根据手指位置调整音量/声源
 */

class AudioController {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.masterGain = null;
    }

    async init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0;
    }

    async loadSound(name, url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds[name] = audioBuffer;
    }

    play(name, loop = true) {
        if (!this.sounds[name]) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.loop = loop;
        source.connect(this.masterGain);
        source.start();
        return source;
    }

    fadeIn(duration = 0.5) {
        this.masterGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + duration);
    }

    fadeOut(duration = 0.3) {
        this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

window.AudioController = AudioController;
```

#### 📝 提交信息
```
feat: 实现音效模块，支持淡入淡出效果
```

---

### 任务 7: 优化与收尾
**预计时间:** 1 小时

#### 7.1 性能优化
- [ ] 使用 `requestAnimationFrame` 节流遮罩重绘
- [ ] 添加 loading 状态指示
- [ ] 视频预加载策略

#### 7.2 用户体验优化
- [ ] 添加首次使用引导提示
- [ ] 支持双指缩放（可选）
- [ ] 添加全屏按钮

#### 7.3 兼容性测试
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] 桌面 Chrome/Firefox/Safari

#### 7.4 编写 README
**文件:** `README.md`

```markdown
# 画中游 - 清明上河图互动体验

用手指唤醒千年古画！

## 快速开始

1. 启动本地服务器:
   ```bash
   npx serve .
   ```
2. 在浏览器打开 `http://localhost:3000`

## 技术栈
- HTML5 Canvas
- Video API
- Touch/Mouse Events

## 开发
...
```

#### 📝 提交信息
```
docs: 添加 README 和使用说明
chore: 性能优化和兼容性适配
```

---

## 🧪 测试清单

### 功能测试
| 测试项 | 预期结果 | 通过 |
|-------|---------|-----|
| 页面加载 | 静态古画正常显示，无报错 | ⬜ |
| 手势触发 | 手指位置出现动画圆形区域 | ⬜ |
| 手势移动 | 动画区域跟随手指移动 | ⬜ |
| 手势结束 | 动画区域消失，恢复静态 | ⬜ |
| 横向滚动 | 可左右滚动浏览全图 | ⬜ |
| 边缘羽化 | 透明区域边缘有柔和过渡 | ⬜ |

### 兼容性测试
| 平台 | 浏览器 | 通过 |
|-----|-------|-----|
| iOS | Safari | ⬜ |
| Android | Chrome | ⬜ |
| macOS | Chrome | ⬜ |
| macOS | Safari | ⬜ |
| Windows | Chrome | ⬜ |

### 性能测试
| 指标 | 目标 | 通过 |
|-----|-----|-----|
| 首次加载 | < 5s (4G网络) | ⬜ |
| 交互帧率 | >= 30fps | ⬜ |
| 内存占用 | < 200MB | ⬜ |

---

## 📚 参考资料

- [Canvas API - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)
- [Touch Events - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Touch_events)
- [Runway Gen-3](https://runway.ml/)
- [故宫博物院数字资源](https://www.dpm.org.cn/)

---

## 📝 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关
