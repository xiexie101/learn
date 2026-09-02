/**
 * 主程序
 * 职责: 初始化各模块，协调工作流程
 * 
 * 实现原理：
 * - 动画层在底部，静态层在上面
 * - 使用 clip-path 在静态层挖洞，露出下面的动画层
 * - 手指位置就是挖洞的圆心
 */

(function () {
    'use strict';

    // DOM 元素
    const container = document.getElementById('painting-container');
    const staticLayer = document.getElementById('static-layer');
    const animatedLayer = document.getElementById('animated-layer');
    const videoLayer = document.getElementById('video-layer');
    const guide = document.getElementById('guide');

    // 状态
    let isFirstTouch = true;
    let currentPosition = null;
    let animationFrame = null;

    // 配置
    const CONFIG = {
        radius: 120,        // 透明圆半径
        feather: 40,        // 羽化边缘宽度（暂不使用，clip-path不支持）
        smoothing: 0.15     // 平滑系数
    };

    /**
     * 初始化
     */
    function init() {
        // 等待静态图加载完成
        if (staticLayer.complete && staticLayer.naturalWidth > 0) {
            onImageLoaded();
        } else {
            staticLayer.addEventListener('load', onImageLoaded);
            staticLayer.addEventListener('error', onImageError);
        }
    }

    /**
     * 图片加载失败处理
     */
    function onImageError() {
        console.error('❌ 图片加载失败，请检查 assets/static/qingming.jpg');
        createPlaceholder();
    }

    /**
     * 创建占位图用于演示
     */
    function createPlaceholder() {
        const canvas = document.createElement('canvas');
        canvas.width = 3000;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        // 绘制渐变背景
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#d4c4a8');
        gradient.addColorStop(0.3, '#e8dcc8');
        gradient.addColorStop(0.5, '#f0e6d2');
        gradient.addColorStop(0.7, '#e8dcc8');
        gradient.addColorStop(1, '#d4c4a8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制山水装饰
        drawMountains(ctx, canvas.width, canvas.height);
        drawRiver(ctx, canvas.width, canvas.height);
        drawBuildings(ctx, canvas.width, canvas.height);

        // 添加标题
        ctx.fillStyle = '#5a4a3a';
        ctx.font = 'bold 42px "楷体", "STKaiti", serif';
        ctx.textAlign = 'center';
        ctx.fillText('清明上河图 · 画中游', canvas.width / 2, 80);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        staticLayer.src = dataUrl;
        animatedLayer.querySelector('img').src = dataUrl;

        setTimeout(onImageLoaded, 100);
    }

    /**
     * 绘制山脉
     */
    function drawMountains(ctx, width, height) {
        ctx.fillStyle = 'rgba(100, 90, 70, 0.25)';

        for (let i = 0; i < 8; i++) {
            const x = (width / 8) * i + 150;
            const y = height - 80;
            const mountainHeight = 80 + Math.random() * 120;

            ctx.beginPath();
            ctx.moveTo(x - 180, y);
            ctx.quadraticCurveTo(x - 60, y - mountainHeight * 0.6, x, y - mountainHeight);
            ctx.quadraticCurveTo(x + 60, y - mountainHeight * 0.6, x + 180, y);
            ctx.fill();
        }
    }

    /**
     * 绘制河流
     */
    function drawRiver(ctx, width, height) {
        ctx.fillStyle = 'rgba(100, 130, 160, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, height - 120);

        for (let x = 0; x <= width; x += 100) {
            const y = height - 120 + Math.sin(x * 0.01) * 20;
            ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 绘制建筑
     */
    function drawBuildings(ctx, width, height) {
        ctx.fillStyle = 'rgba(80, 60, 50, 0.35)';

        for (let i = 0; i < 15; i++) {
            const x = (width / 15) * i + 50 + Math.random() * 80;
            const y = height - 150 - Math.random() * 50;
            const buildingWidth = 40 + Math.random() * 60;
            const buildingHeight = 50 + Math.random() * 80;

            // 屋体
            ctx.fillRect(x, y, buildingWidth, buildingHeight);

            // 屋顶
            ctx.beginPath();
            ctx.moveTo(x - 10, y);
            ctx.lineTo(x + buildingWidth / 2, y - 30);
            ctx.lineTo(x + buildingWidth + 10, y);
            ctx.closePath();
            ctx.fill();
        }
    }

    /**
     * 图片加载完成后初始化
     */
    function onImageLoaded() {
        const width = staticLayer.naturalWidth || 3000;
        const height = staticLayer.naturalHeight || 600;

        // 设置动画层尺寸
        animatedLayer.style.width = width + 'px';
        animatedLayer.style.height = height + 'px';

        // 初始化手势监听
        bindEvents();

        console.log('🎨 画中游初始化完成', { width, height });
    }

    /**
     * 绑定事件
     */
    function bindEvents() {
        // 触摸事件
        container.addEventListener('touchstart', handleStart, { passive: true });
        container.addEventListener('touchmove', handleMove, { passive: true });
        container.addEventListener('touchend', handleEnd);
        container.addEventListener('touchcancel', handleEnd);

        // 鼠标事件
        container.addEventListener('mousedown', handleStart);
        container.addEventListener('mousemove', handleMove);
        container.addEventListener('mouseup', handleEnd);
        container.addEventListener('mouseleave', handleEnd);
    }

    /**
     * 获取事件坐标
     */
    function getPosition(e) {
        const rect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft || 0;

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

    /**
     * 手势开始
     */
    function handleStart(e) {
        // 隐藏引导
        if (isFirstTouch) {
            guide.classList.add('hidden');
            isFirstTouch = false;
        }

        // 播放视频
        if (videoLayer) {
            videoLayer.play().catch(() => { });
        }

        currentPosition = getPosition(e);
        updateClipPath();
    }

    /**
     * 手势移动
     */
    function handleMove(e) {
        if (!currentPosition && e.type === 'mousemove') return;

        currentPosition = getPosition(e);

        // 使用 requestAnimationFrame 节流
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(() => {
                updateClipPath();
                animationFrame = null;
            });
        }
    }

    /**
     * 手势结束
     */
    function handleEnd() {
        currentPosition = null;
        // 移除 clip-path，恢复静态层完整显示
        staticLayer.style.clipPath = '';
        staticLayer.style.webkitClipPath = '';

        // 暂停视频以节省资源
        if (videoLayer) {
            videoLayer.pause();
        }
    }

    /**
     * 更新 clip-path 在静态层挖洞
     * 使用 polygon 创建一个带圆孔的遮罩
     */
    function updateClipPath() {
        if (!currentPosition) return;

        const { x, y } = currentPosition;
        const r = CONFIG.radius;

        // 使用 circle() 函数创建圆形裁剪
        // 外部是整个图片，内部挖掉一个圆
        // 这里用反向思路：先覆盖全图，再排除圆形区域
        // CSS clip-path 不直接支持这种操作，所以使用 SVG 或多边形模拟

        // 简化方案：使用 polygon 模拟挖洞效果
        // 创建一个大矩形，中间有圆形缺口（通过多边形近似）
        const points = generateHolePolygon(x, y, r, staticLayer.naturalWidth, staticLayer.naturalHeight);

        const clipPath = `polygon(${points})`;
        staticLayer.style.clipPath = clipPath;
        staticLayer.style.webkitClipPath = clipPath;
    }

    /**
     * 生成带圆孔的多边形路径
     */
    function generateHolePolygon(cx, cy, radius, imgWidth, imgHeight) {
        // 外边框四个角
        const outer = [
            '0% 0%',           // 左上
            '100% 0%',         // 右上
            '100% 100%',       // 右下
            '0% 100%',         // 左下
            '0% 0%'            // 回到左上
        ];

        // 从外边框连接到圆孔
        const angleStart = Math.PI;  // 从左边开始
        const connectionX = (cx - radius) / imgWidth * 100;
        const connectionY = cy / imgHeight * 100;

        // 生成圆形路径点（反向，顺时针，因为多边形填充规则）
        const circlePoints = [];
        const segments = 32;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius;
            const percentX = (px / imgWidth * 100).toFixed(2);
            const percentY = (py / imgHeight * 100).toFixed(2);
            circlePoints.push(`${percentX}% ${percentY}%`);
        }

        // 组合：外框 -> 连接到圆 -> 圆形 -> 连接回外框
        // 使用 evenodd 填充规则需要特殊处理，这里用另一种方式

        // 简化：直接裁剪出圆形区域的"反向"
        // 由于 clip-path polygon 不支持孔洞，我们改用 CSS mask

        // 改用 mask-image 方案
        const maskGradient = `radial-gradient(circle ${radius}px at ${cx}px ${cy}px, transparent ${radius - 5}px, black ${radius}px)`;
        staticLayer.style.webkitMaskImage = maskGradient;
        staticLayer.style.maskImage = maskGradient;

        // 返回空，因为我们用 mask 替代了
        return '0% 0%, 100% 0%, 100% 100%, 0% 100%';
    }

    // 启动
    init();
})();
