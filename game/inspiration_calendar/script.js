document.addEventListener('DOMContentLoaded', () => {
    console.log('Inspiration Calendar Loaded');

    // Current date state
    let currentDate = new Date('2025-11-19');

    // DOM Elements
    const yiText = document.getElementById('yi-text');
    const mainTitle = document.getElementById('main-title');
    const pinyin = document.getElementById('pinyin');
    const sideText = document.getElementById('side-text');
    const dayEl = document.getElementById('day');
    const monthEl = document.getElementById('month');
    const weekdayEl = document.getElementById('weekday');
    const lunarEl = document.getElementById('lunar');
    const currentDateText = document.getElementById('current-date-text');

    // Helper to format date as YYYY-MM-DD
    function formatDateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Render function
    function renderDate(date) {
        const key = formatDateKey(date);
        const data = calendarData.find(item => item.date === key);

        if (data) {
            yiText.textContent = data.yi;
            mainTitle.textContent = data.title;
            pinyin.textContent = data.pinyin;
            sideText.textContent = data.sideText;
            dayEl.textContent = date.getDate();
            monthEl.textContent = `/${date.getMonth() + 1}`;
            weekdayEl.textContent = data.weekday;
            lunarEl.textContent = data.lunar;

            // Update footer text
            currentDateText.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        } else {
            // Fallback or "No Data" state
            console.log('No data for date:', key);
            mainTitle.textContent = "暂无";
            sideText.textContent = "今日暂无灵感，休息一下。";
            pinyin.textContent = "z a n w u";
            dayEl.textContent = date.getDate();
            monthEl.textContent = `/${date.getMonth() + 1}`;
            currentDateText.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        }
    }

    // Initial Render
    renderDate(currentDate);

    // Navigation Handlers
    document.getElementById('prev-btn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        renderDate(currentDate);
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        renderDate(currentDate);
    });
});
