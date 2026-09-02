/**
 * 日历模块
 * 负责渲染月度练习记录
 */

class Calendar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.render();
        this.bindEvents();
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('prev-month')) {
                this.changeMonth(-1);
            } else if (e.target.classList.contains('next-month')) {
                this.changeMonth(1);
            }
        });
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 is Sunday

        const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

        let html = `
            <div class="calendar-header">
                <button class="icon-btn prev-month">◀</button>
                <span class="month-title">${year}年 ${monthNames[month]}</span>
                <button class="icon-btn next-month">▶</button>
            </div>
            <div class="calendar-grid">
                <div class="weekday">日</div>
                <div class="weekday">一</div>
                <div class="weekday">二</div>
                <div class="weekday">三</div>
                <div class="weekday">四</div>
                <div class="weekday">五</div>
                <div class="weekday">六</div>
        `;

        // 填充空白
        for (let i = 0; i < startDayOfWeek; i++) {
            html += `<div class="day empty"></div>`;
        }

        // 填充日期
        const todayStr = new Date().toISOString().split('T')[0];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const log = store.getDailyLog(dateStr);
            const isToday = dateStr === todayStr;

            let statusClass = '';
            if (log.completed.length === 8) {
                statusClass = 'full';
            } else if (log.completed.length > 0) {
                statusClass = 'partial';
            }

            html += `
                <div class="day ${statusClass} ${isToday ? 'today' : ''}" title="${log.completed.length}/8">
                    ${day}
                </div>
            `;
        }

        html += `</div>`;
        this.container.innerHTML = html;
    }

    refresh() {
        this.render();
    }
}

window.Calendar = Calendar;
