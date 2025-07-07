    // 当前查看的月份
    let currentViewMonth = new Date().getMonth();
    let currentViewYear = new Date().getFullYear();

    // 数据存储
    let gameData = {
        completedDays: new Set(),
        exerciseCompletion: {},
        totalDays: 0,
        currentStreak: 0,
        level: 1,
        achievements: new Set()
    };

    // 励志语录
    const motivationalQuotes = [
        "每日坚持，强身健体，心境平和",
        "天行健，君子以自强不息",
        "身体是革命的本钱，健康是人生的财富",
        "一日练一日功，一日不练十日空",
        "锻炼身体，磨练意志，追求更好的自己",
        "持之以恒，必有所成",
        "健康的身体是灵魂的客厅"
    ];

    // 等级系统
    const levels = [
        { name: "初学者", minDays: 0, color: "#95a5a6" },
        { name: "入门者", minDays: 7, color: "#3498db" },
        { name: "练习者", minDays: 21, color: "#9b59b6" },
        { name: "熟练者", minDays: 50, color: "#e74c3c" },
        { name: "专家", minDays: 100, color: "#f39c12" },
        { name: "大师", minDays: 200, color: "#2ecc71" },
        { name: "宗师", minDays: 365, color: "#e67e22" }
    ];

    // 初始化
    function init() {
        loadData();
        updateQuote();
        generateCalendar();
        updateStats();
        updateLevel();
        checkAchievements();
        loadTodayProgress();
    }

    // 加载数据
    function loadData() {
        const saved = JSON.parse(localStorage.getItem('baduanjinData') || '{}');
        if (saved.completedDays) {
            gameData.completedDays = new Set(saved.completedDays);
        }
        if (saved.exerciseCompletion) {
            gameData.exerciseCompletion = saved.exerciseCompletion;
        }
        if (saved.achievements) {
            gameData.achievements = new Set(saved.achievements);
        }
        gameData.totalDays = saved.totalDays || 0;
        gameData.currentStreak = saved.currentStreak || 0;
        gameData.level = saved.level || 1;
    }

    // 保存数据
    function saveData() {
        const dataToSave = {
            completedDays: Array.from(gameData.completedDays),
            exerciseCompletion: gameData.exerciseCompletion,
            totalDays: gameData.totalDays,
            currentStreak: gameData.currentStreak,
            level: gameData.level,
            achievements: Array.from(gameData.achievements)
        };
        localStorage.setItem('baduanjinData', JSON.stringify(dataToSave));
    }

    // 更新励志语录
    function updateQuote() {
        const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        document.getElementById('motivationalQuote').textContent = quote;
    }

    // 生成日历
    function generateCalendar() {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';
        
        // 更新标题
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                            '7月', '8月', '9月', '10月', '11月', '12月'];
        document.getElementById('calendarTitle').textContent = 
            `${currentViewYear}年${monthNames[currentViewMonth]}`;
        
        // 获取当前月份的第一天和最后一天
        const firstDay = new Date(currentViewYear, currentViewMonth, 1);
        const lastDay = new Date(currentViewYear, currentViewMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // 获取第一天是星期几 (0-6, 0是周日)
        const firstDayWeekday = firstDay.getDay();
        
        // 获取上个月的最后几天
        const prevMonth = new Date(currentViewYear, currentViewMonth, 0);
        const prevMonthDays = prevMonth.getDate();
        
        // 添加上个月的最后几天
        for (let i = firstDayWeekday - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.textContent = day;
            calendar.appendChild(dayElement);
        }
        
        // 添加当前月份的天数
        const today = new Date();
        const isCurrentMonth = currentViewMonth === today.getMonth() && 
                                currentViewYear === today.getFullYear();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const dateStr = `${currentViewYear}-${String(currentViewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            if (gameData.completedDays.has(dateStr)) {
                dayElement.classList.add('completed');
            }
            
            if (isCurrentMonth && day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            calendar.appendChild(dayElement);
        }
        
        // 添加下个月的前几天来填满日历
        const totalCells = Math.ceil((firstDayWeekday + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - firstDayWeekday - daysInMonth;
        
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.textContent = day;
            calendar.appendChild(dayElement);
        }
    }

    // 切换月份
    function changeMonth(direction) {
        currentViewMonth += direction;
        
        if (currentViewMonth > 11) {
            currentViewMonth = 0;
            currentViewYear++;
        } else if (currentViewMonth < 0) {
            currentViewMonth = 11;
            currentViewYear--;
        }
        
        generateCalendar();
    }

    // 更新统计数据
    function updateStats() {
        document.getElementById('totalDays').textContent = gameData.totalDays;
        document.getElementById('streak').textContent = gameData.currentStreak;
        
        const completionRate = gameData.totalDays > 0 ? 
            Math.round((gameData.completedDays.size / gameData.totalDays) * 100) : 0;
        document.getElementById('completionRate').textContent = completionRate + '%';
        
        document.getElementById('currentLevel').textContent = gameData.level;
    }

    // 更新等级系统
    function updateLevel() {
        const currentLevelInfo = levels.find(l => gameData.totalDays >= l.minDays) || levels[0];
        const nextLevel = levels.find(l => l.minDays > gameData.totalDays);
        
        gameData.level = levels.indexOf(currentLevelInfo) + 1;
        
        document.getElementById('levelBadge').textContent = 
            `${currentLevelInfo.name} - 等级 ${gameData.level}`;
        
        if (nextLevel) {
            const progress = ((gameData.totalDays - currentLevelInfo.minDays) / 
                (nextLevel.minDays - currentLevelInfo.minDays)) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressText').textContent = 
                `${gameData.totalDays} / ${nextLevel.minDays} 天 (${nextLevel.name})`;
        } else {
            document.getElementById('progressFill').style.width = '100%';
            document.getElementById('progressText').textContent = '已达到最高等级！';
        }
    }

    // 检查成就
    function checkAchievements() {
        const achievements = {
            'achievement-first': gameData.totalDays >= 1,
            'achievement-week': gameData.currentStreak >= 7,
            'achievement-month': gameData.totalDays >= 30,
            'achievement-perfect': hasCompletedAllExercisesToday(),
            'achievement-streak': gameData.currentStreak >= 14,
            'achievement-master': gameData.totalDays >= 100
        };
        
        for (const [id, unlocked] of Object.entries(achievements)) {
            const element = document.getElementById(id);
            if (unlocked) {
                element.classList.add('unlocked');
                gameData.achievements.add(id);
            }
        }
    }

    // 检查今日是否完成所有练习
    function hasCompletedAllExercisesToday() {
        const today = new Date().toISOString().split('T')[0];
        const todayCompletion = gameData.exerciseCompletion[today];
        return todayCompletion && todayCompletion.length === 8;
    }

    // 加载今日进度
    function loadTodayProgress() {
        const today = new Date().toISOString().split('T')[0];
        const todayCompletion = gameData.exerciseCompletion[today] || [];
        
        document.querySelectorAll('.baduanjin-checkbox').forEach((checkbox, index) => {
            checkbox.checked = todayCompletion.includes(index);
            if (checkbox.checked) {
                checkbox.closest('.baduanjin-item').classList.add('completed');
            }
        });
    }

    // 练习项目点击事件
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.baduanjin-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const exerciseIndex = parseInt(this.dataset.exercise);
                const today = new Date().toISOString().split('T')[0];
                
                if (!gameData.exerciseCompletion[today]) {
                    gameData.exerciseCompletion[today] = [];
                }
                
                if (this.checked) {
                    if (!gameData.exerciseCompletion[today].includes(exerciseIndex)) {
                        gameData.exerciseCompletion[today].push(exerciseIndex);
                    }
                    this.closest('.baduanjin-item').classList.add('completed');
                } else {
                    gameData.exerciseCompletion[today] = 
                        gameData.exerciseCompletion[today].filter(i => i !== exerciseIndex);
                    this.closest('.baduanjin-item').classList.remove('completed');
                }
                
                saveData();
                checkAchievements();
            });
        });
    });

    // 完成今日练习
    function markTodayComplete() {
        const today = new Date().toISOString().split('T')[0];
        
        if (!gameData.completedDays.has(today)) {
            gameData.completedDays.add(today);
            gameData.totalDays++;
            updateStreak();
            
            // 标记所有练习为完成
            gameData.exerciseCompletion[today] = [0, 1, 2, 3, 4, 5, 6, 7];
            document.querySelectorAll('.baduanjin-checkbox').forEach(checkbox => {
                checkbox.checked = true;
                checkbox.closest('.baduanjin-item').classList.add('completed');
            });
            
            saveData();
            generateCalendar();
            updateStats();
            updateLevel();
            checkAchievements();
            
            // 成功动画
            showSuccessAnimation();
        }
    }

    // 更新连击数
    function updateStreak() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (gameData.completedDays.has(yesterdayStr)) {
            gameData.currentStreak++;
        } else {
            gameData.currentStreak = 1;
        }
    }

    // 成功动画
    function showSuccessAnimation() {
        const container = document.querySelector('.container');
        container.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            container.style.animation = '';
        }, 500);
    }

    // 重置进度
    function resetProgress() {
        if (confirm('确定要重置所有进度吗？此操作无法撤销！')) {
            gameData = {
                completedDays: new Set(),
                exerciseCompletion: {},
                totalDays: 0,
                currentStreak: 0,
                level: 1,
                achievements: new Set()
            };
            localStorage.removeItem('baduanjinData');
            init();
        }
    }

    // 添加脉冲动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // 初始化应用
    init();