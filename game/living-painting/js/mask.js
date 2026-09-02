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
