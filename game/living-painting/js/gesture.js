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
