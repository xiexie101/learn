/**
 * 主应用逻辑
 */

class App {
    constructor() {
        this.initDate();
        this.initUI();
        this.bindEvents();
        this.render();
    }

    initDate() {
        const now = new Date();
        this.todayStr = now.toISOString().split('T')[0];

        // 格式化日期显示
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        this.dateDisplayStr = now.toLocaleDateString('zh-CN', options);
        this.weekdayStr = now.toLocaleDateString('zh-CN', { weekday: 'long' });
    }

    initUI() {
        // DOM 元素
        this.dom = {
            currentDate: document.getElementById('current-date'),
            currentWeekday: document.getElementById('current-weekday'),
            exerciseList: document.getElementById('exercise-list'),
            dailyProgressText: document.getElementById('daily-progress-text'),
            dailyProgressFill: document.getElementById('daily-progress-fill'),
            completeAllBtn: document.getElementById('complete-all-btn'),
            streakDays: document.getElementById('streak-days'),
            totalDays: document.getElementById('total-days'),
            currentLevelName: document.getElementById('current-level-name'),
            levelBadge: document.getElementById('level-badge'),
            zenGarden: document.getElementById('zen-garden')
        };

        // 初始化禅意花园
        if (window.ZenGarden) {
            this.garden = new window.ZenGarden('zen-garden');
        }

        // 初始化音效
        if (window.SoundManager) {
            this.sound = new window.SoundManager();
        }

        // 初始化日历
        if (window.Calendar) {
            this.calendar = new window.Calendar('calendar-container');
        }

        // 设置日期
        this.dom.currentDate.textContent = this.dateDisplayStr;
        this.dom.currentWeekday.textContent = this.weekdayStr;

        // 生成动作列表
        this.renderExerciseList();
    }

    renderExerciseList() {
        this.dom.exerciseList.innerHTML = '';
        EXERCISES.forEach((name, index) => {
            const item = document.createElement('div');
            item.className = 'exercise-item';
            item.dataset.index = index;
            item.innerHTML = `
                <div class="checkbox-custom"></div>
                <span class="exercise-name">${index + 1}. ${name}</span>
            `;

            // 点击事件委托
            item.addEventListener('click', () => this.toggleExercise(index));

            this.dom.exerciseList.appendChild(item);
        });
    }

    bindEvents() {
        this.dom.completeAllBtn.addEventListener('click', () => {
            const prevUser = JSON.parse(JSON.stringify(store.getUserData()));
            store.completeAll(this.todayStr);

            const newUser = store.getUserData();
            this.checkUnlocks(prevUser, newUser);

            this.render();
            this.showCelebration();
        });

        // 设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // 成就按钮
        const achievementsBtn = document.getElementById('achievements-btn');
        if (achievementsBtn) {
            achievementsBtn.addEventListener('click', () => this.openAchievements());
        }
    }

    toggleExercise(index) {
        const prevUser = JSON.parse(JSON.stringify(store.getUserData())); // 深拷贝旧状态
        store.toggleExercise(this.todayStr, index);

        const newUser = store.getUserData();
        this.checkUnlocks(prevUser, newUser);

        if (this.sound) this.sound.playClick();
        this.render();
        if (this.calendar) this.calendar.refresh();
    }

    render() {
        const log = store.getDailyLog(this.todayStr);
        const user = store.getUserData();
        const levelInfo = store.getLevelInfo();

        // 1. 更新动作列表状态
        const items = this.dom.exerciseList.children;
        for (let i = 0; i < items.length; i++) {
            if (log.completed.includes(i)) {
                items[i].classList.add('completed');
            } else {
                items[i].classList.remove('completed');
            }
        }

        // 2. 更新进度条
        const progress = (log.completed.length / EXERCISES.length) * 100;
        this.dom.dailyProgressText.textContent = `${Math.round(progress)}%`;
        this.dom.dailyProgressFill.style.width = `${progress}%`;

        // 3. 更新统计数据
        this.dom.streakDays.textContent = user.streak;
        this.dom.totalDays.textContent = user.totalDays;
        this.dom.currentLevelName.textContent = levelInfo.name;

        // 4. 更新等级徽章
        this.dom.levelBadge.querySelector('.level-text').textContent = `Lv.${user.level} ${levelInfo.name}`;

        // 5. 更新花园信息
        const gardenLevelText = this.dom.zenGarden.querySelector('.garden-level');
        if (gardenLevelText) {
            gardenLevelText.textContent = `Lv.${user.level} ${levelInfo.gardenStage}`;
        }

        // 渲染花园视觉
        if (this.garden) {
            this.garden.render(user.level);
        }

        // 6. 按钮状态
        if (progress === 100) {
            this.dom.completeAllBtn.textContent = "🎉 今日练习已完成";
            this.dom.completeAllBtn.style.opacity = "0.8";
        } else {
            this.dom.completeAllBtn.textContent = "✨ 完成今日练习";
            this.dom.completeAllBtn.style.opacity = "1";
        }
    }

    showCelebration() {
        // 简单的庆祝动画效果 (震动)
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // 花园反馈动画
        if (this.garden) {
            this.garden.playFeedbackAnimation();
        }

        // 播放音效
        if (this.sound) {
            this.sound.playCelebration();
        }

        console.log("Celebration!");
    }

    // --- 通知系统 ---

    showToast(title, message, type = 'normal', icon = '✨') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // 播放音效
        if (this.sound && type === 'unlock') {
            this.sound.playCelebration(); // 解锁用庆祝音效
        }

        // 自动移除
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // 检查解锁状态
    checkUnlocks(prevUser, newUser) {
        // 1. 检查等级提升
        if (newUser.level > prevUser.level) {
            const levelInfo = store.getLevelInfo();
            this.showToast(
                "等级提升!",
                `恭喜达到 Lv.${newUser.level} ${levelInfo.name}，花园已升级!`,
                'unlock',
                '🎉'
            );
            if (this.garden) this.garden.playFeedbackAnimation();
        }

        // 2. 检查成就
        const achievements = store.getAchievements();
        achievements.forEach(ach => {
            if (!ach.unlocked && ach.condition(newUser)) {
                if (store.unlockAchievement(ach.id)) {
                    this.showToast(ach.name, `解锁成就: ${ach.desc}`, 'unlock', ach.icon);
                }
            }
        });
    }

    openAchievements() {
        const list = store.getAchievements();
        const unlockedCount = list.filter(a => a.unlocked).length;

        let html = `
            <div style="margin-bottom: 20px; text-align: center; color: var(--text-secondary);">
                已解锁: ${unlockedCount} / ${list.length}
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 15px;">
        `;

        list.forEach(a => {
            const style = a.unlocked ?
                'background: rgba(255,215,0,0.1); border-color: var(--primary-gold);' :
                'background: rgba(0,0,0,0.05); border-color: transparent; opacity: 0.5; filter: grayscale(1);';

            html += `
                <div style="
                    display: flex; flex-direction: column; align-items: center; gap: 5px;
                    padding: 10px; border-radius: 10px; border: 1px solid; ${style}
                " title="${a.desc}">
                    <div style="font-size: 2rem;">${a.icon}</div>
                    <div style="font-size: 0.8rem; text-align: center;">${a.name}</div>
                </div>
            `;
        });

        html += '</div>';
        this.showModal('成就殿堂', html);
    }

    // --- 模态框系统 ---

    showModal(title, contentHTML) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${contentHTML}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 关闭事件
        const closeBtn = overlay.querySelector('.modal-close');
        const close = () => {
            overlay.style.animation = 'fadeOut 0.3s forwards'; // 需要定义fadeOut给overlay
            setTimeout(() => overlay.remove(), 300);
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    openSettings() {
        const user = store.getUserData();
        const soundEnabled = this.sound ? this.sound.enabled : false;

        const content = `
            <div class="setting-item">
                <span class="setting-label">音效</span>
                <label class="switch">
                    <input type="checkbox" id="sound-toggle" ${soundEnabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-item">
                <span class="setting-label">重置数据</span>
                <button class="icon-btn" id="reset-data-btn" style="color: var(--error)">🗑️</button>
            </div>
            <div style="margin-top: 20px; font-size: 0.8rem; color: var(--text-secondary); text-align: center;">
                八段锦每日追踪 v1.0.0<br>
                当前等级: Lv.${user.level}
            </div>
        `;

        this.showModal('设置', content);

        // 绑定设置事件
        setTimeout(() => {
            const soundToggle = document.getElementById('sound-toggle');
            if (soundToggle) {
                soundToggle.addEventListener('change', (e) => {
                    if (this.sound) this.sound.toggle(e.target.checked);
                });
            }

            const resetBtn = document.getElementById('reset-data-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
                        localStorage.removeItem('baduanjin_tracker_data_v1');
                        location.reload();
                    }
                });
            }
        }, 0);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
