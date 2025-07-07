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
     achievements: new Set(),
     startDate: null  // 添加开始时间
 };

 // 励志语录
 const motivationalQuotes = [
    "每日坚持，强身健体，心境平和",
    "天行健，君子以自强不息",
    "身体是革命的本钱，健康是人生的财富",
    "一日练一日功，一日不练十日空",
    "锻炼身体，磨练意志，追求更好的自己",
    "持之以恒，必有所成",
    "健康的身体是灵魂的客厅",
    "汗水是成长的催化剂",
    "别让懒惰打败你的理想",
    "运动不止是身体，更是精神的磨砺",
    "今天不努力，明天努力找医生",
    "只有流过血的手指，才能弹出世间的绝唱",
    "每一次坚持，都是自我超越",
    "不怕慢，就怕站",
    "你要逼自己优秀，然后骄傲地生活",
    "成功从来不是偶然，而是日日的习惯",
    "你不去拼，永远不会知道自己有多强",
    "不怕千万人阻挡，只怕自己投降",
    "晨起一练，精神一整天",
    "好习惯成就好人生",
    "改变从第一步开始",
    "你现在偷的懒，都会变成未来的苦",
    "你的身材，藏着你对生活的态度",
    "别说自己不行，你根本没努力过",
    "别抱怨，改变才是唯一的出路",
    "挥洒汗水，燃烧卡路里",
    "每次跳动的心脏，都是生命的赞歌",
    "身材不会撒谎，努力看得见",
    "放弃容易，坚持很酷",
    "管住嘴，迈开腿",
    "人活着就该动起来",
    "你流下的每一滴汗，都会变成未来的惊艳",
    "你和梦想之间，只差一次次坚持",
    "能自律的人，才配得上自由",
    "健身不是一阵子，而是一辈子",
    "你不努力，谁也给不了你想要的生活",
    "别等到了明天，才后悔今天没开始",
    "练的是肌肉，强的是内心",
    "清晨的第一缕阳光，属于坚持的人",
    "你可以不完美，但不能不努力",
    "再苦也不退，再累也不放弃",
    "不放弃，是最动人的力量",
    "你不是累，只是还没习惯努力",
    "不逼自己一把，你永远不知道你有多优秀",
    "跑步是和自己最直接的对话",
    "别人跑十圈，你就跑十一圈",
    "你练的不是动作，是未来的自己",
    "有汗水的地方，就有改变",
    "比你优秀的人都在努力，你凭什么偷懒",
    "你不强大，谁替你扛",
    "只有经历过地狱般的训练，才能炼出创造天堂的力量",
    "如果你连坚持都做不到，怎么配谈未来",
    "懒惰会逐渐消磨你的潜力",
    "选择痛苦的努力，胜过安逸的放弃",
    "少熬夜，多锻炼，身体才不会负你",
    "不打破舒适圈，怎会拥有新人生",
    "你的腹肌藏在你拒绝的每一次宵夜里",
    "努力是对平庸最有力的反击",
    "没有天生的好身材，只有不间断的锻炼",
    "自律，才是自由的前提",
    "运动，是对生活最基本的尊重",
    "再多的鸡汤，不如起身运动一场",
    "最好的医生，是你自己",
    "健身不仅塑形，还塑心",
    "今天偷的懒，明天都要加倍还",
    "不问收获，但问耕耘",
    "相信自己，坚持到底",
    "热爱可抵岁月漫长，运动点燃每一天",
    "跑不动了也别停，走也要走完今天的份",
    "你的毅力，决定你的体力",
    "流汗，是快乐的咸味",
    "你走的每一步，都会被未来看见",
    "你选择放弃的那一刻，也选择了普通",
    "人这一辈子，不能输给自己",
    "成长就是，每天都和昨天的自己较劲",
    "别让三分钟热度，毁了你的全部可能",
    "心有多强，身体就能走多远",
    "坚持是最慢的捷径",
    "每一次锻炼，都是在和懒惰对抗",
    "做不到全力以赴，就别抱怨事与愿违",
    "坚持不是选择，而是习惯",
    "没有谁的努力是白费的",
    "积累，才有底气",
    "健身不是潮流，是责任",
    "好身材不是目的，而是副产品",
    "你不动，世界也不会为你动",
    "越努力，越幸运",
    "没人能随随便便成功，但你可以天天练",
    "再多的理由，不如一次行动",
    "比昨天多做一次，就算赢了",
    "拼到不能再拼，才有资格谈放松",
    "运动，是和生活的对话",
    "你对生活认真，它就对你温柔",
    "身体强健，心灵才有力量",
    "所有坚持，都会照亮未来",
    "别怕起点低，怕的是根本不开始",
    "赢的不是天赋，是态度",
    "每一次流汗，都是一次洗礼",
    "人生就是一场马拉松，拼的是耐力",
    "你的极限，只是你不敢碰的起点",
    "日拱一卒，功不唐捐"
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
     gameData.startDate = saved.startDate || null;
 }

 // 保存数据
 function saveData() {
     const dataToSave = {
         completedDays: Array.from(gameData.completedDays),
         exerciseCompletion: gameData.exerciseCompletion,
         totalDays: gameData.totalDays,
         currentStreak: gameData.currentStreak,
         level: gameData.level,
         achievements: Array.from(gameData.achievements),
         startDate: gameData.startDate
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
     
     // 更新开始时间和修行天数
     if (gameData.startDate) {
         const startDate = new Date(gameData.startDate);
         const today = new Date();
         const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
         
         document.getElementById('startDate').textContent = 
             `${startDate.getMonth() + 1}/${startDate.getDate()}`;
         document.getElementById('daysSinceStart').textContent = daysSinceStart;
     } else {
         document.getElementById('startDate').textContent = '未开始';
         document.getElementById('daysSinceStart').textContent = '0';
     }
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
     
     // 如果是第一次练习，记录开始时间
     if (!gameData.startDate) {
         gameData.startDate = today;
     }
     
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
             achievements: new Set(),
             startDate: null
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