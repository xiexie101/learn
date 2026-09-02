/**
 * 数据管理模块
 * 处理 LocalStorage 的读写和数据结构
 */

const STORAGE_KEY = 'baduanjin_tracker_data_v1';

// 默认初始数据
const DEFAULT_DATA = {
    user: {
        level: 1,
        exp: 0,
        streak: 0,
        totalDays: 0,
        lastPracticeDate: null,
        longestStreak: 0
    },
    settings: {
        soundEnabled: true,
        theme: 'default'
    },
    // 每日记录: key为日期字符串 "YYYY-MM-DD", value为 { completed: [index], timestamp }
    logs: {}
};

// 八段锦八式名称
const EXERCISES = [
    "双手托天理三焦",
    "左右开弓似射雕",
    "调理脾胃须单举",
    "五劳七伤往后瞧",
    "摇头摆尾去心火",
    "两手攀足固肾腰",
    "攒拳怒目增气力",
    "背后七颠百病消"
];

// 等级配置
const LEVEL_CONFIG = [
    { level: 1, name: "初学者", expRequired: 0, gardenStage: "荒芜石地" },
    { level: 2, name: "入门", expRequired: 70, gardenStage: "青苔初现" }, // 假设每天10经验，7天升级
    { level: 3, name: "熟练", expRequired: 210, gardenStage: "嫩草萌发" },
    { level: 4, name: "精通", expRequired: 500, gardenStage: "清池涟漪" },
    { level: 5, name: "专家", expRequired: 1000, gardenStage: "莲花绽放" },
    { level: 6, name: "大师", expRequired: 2000, gardenStage: "锦鲤游弋" },
    { level: 7, name: "宗师", expRequired: 3650, gardenStage: "树木石灯" }
];

// 成就配置
const ACHIEVEMENTS = [
    { id: 'first_step', name: '初窥门径', desc: '完成第一次练习', icon: '🎯', condition: (user, log) => user.totalDays >= 1 },
    { id: 'streak_3', name: '三日之约', desc: '连续练习3天', icon: '🔥', condition: (user) => user.streak >= 3 },
    { id: 'streak_7', name: '七日禅心', desc: '连续练习7天', icon: '🔥', condition: (user) => user.streak >= 7 },
    { id: 'streak_30', name: '月下行者', desc: '连续练习30天', icon: '🌙', condition: (user) => user.streak >= 30 },
    { id: 'streak_100', name: '百日筑基', desc: '连续练习100天', icon: '⛰️', condition: (user) => user.streak >= 100 },
    { id: 'level_5', name: '专家', desc: '达到专家等级', icon: '⭐', condition: (user) => user.level >= 5 },
    { id: 'perfect_week', name: '完美一周', desc: '连续7天完成所有动作', icon: '💯', condition: (user) => false } // 逻辑较复杂，暂略
];

class DataStore {
    constructor() {
        this.data = this.load();
        // 初始化成就状态
        if (!this.data.achievements) {
            this.data.achievements = [];
        }
    }

    // 加载数据
    load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                // 合并默认数据，防止新版本字段缺失
                return { ...DEFAULT_DATA, ...JSON.parse(stored), user: { ...DEFAULT_DATA.user, ...JSON.parse(stored).user } };
            }
        } catch (e) {
            console.error("Failed to load data:", e);
        }
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    // 保存数据
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error("Failed to save data:", e);
        }
    }

    // 获取今日记录
    getDailyLog(dateStr) {
        if (!this.data.logs[dateStr]) {
            this.data.logs[dateStr] = { completed: [], timestamp: Date.now() };
            this.save();
        }
        return this.data.logs[dateStr];
    }

    // 更新今日动作状态
    toggleExercise(dateStr, exerciseIndex) {
        const log = this.getDailyLog(dateStr);
        const idx = log.completed.indexOf(exerciseIndex);

        if (idx === -1) {
            log.completed.push(exerciseIndex);
        } else {
            log.completed.splice(idx, 1);
        }

        // 排序以便保持一致性
        log.completed.sort((a, b) => a - b);

        this.updateUserStats(dateStr);
        this.save();
        return log;
    }

    // 完成所有动作
    completeAll(dateStr) {
        const log = this.getDailyLog(dateStr);
        log.completed = EXERCISES.map((_, i) => i); // [0, 1, ... 7]

        this.updateUserStats(dateStr);
        this.save();
        return log;
    }

    // 更新用户统计信息 (经验值、连击等)
    updateUserStats(dateStr) {
        const log = this.data.logs[dateStr];
        const isFullComplete = log.completed.length === EXERCISES.length;

        // 简单的经验值计算: 每个动作1点，全套额外奖励2点 (共10点/天)
        // 这里简化处理：只在每次操作时重新计算总经验可能比较耗时，
        // MVP阶段我们简单累加：实际逻辑需要更严谨的防止重复加分。
        // 修正策略：根据总完成天数和动作数计算经验值，或者只在当天结算。

        // 重新计算连击逻辑 (简化版)
        // 检查昨天是否有记录，如果有且完成度>0，连击+1
        // 这是一个复杂的逻辑，MVP先做简单处理：
        // 如果今天有完成动作，且lastPracticeDate是昨天，streak++
        // 如果lastPracticeDate是今天，streak不变
        // 否则 streak = 1

        const today = new Date(dateStr);
        const lastDate = this.data.user.lastPracticeDate ? new Date(this.data.user.lastPracticeDate) : null;

        // 只有当今天有完成动作时才更新连击
        if (log.completed.length > 0) {
            if (!lastDate) {
                this.data.user.streak = 1;
                this.data.user.totalDays = 1;
            } else {
                const diffTime = Math.abs(today - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // 连续
                    // 注意：这里有个bug，如果用户今天多次操作，会导致重复计算吗？
                    // 应该只在日期变更时计算。
                    // 更好的做法是：遍历logs计算streak，或者只在第一次打卡时更新。
                } else if (diffDays > 1) {
                    // 断签
                    // this.data.user.streak = 1; 
                    // 这里暂时不重置，因为用户可能只是漏了打卡，下次打开应用再重置
                }
            }

            // 更新最后练习日期
            if (this.data.user.lastPracticeDate !== dateStr) {
                this.data.user.lastPracticeDate = dateStr;
                // 只有是新的一天练习才增加总天数
                // 需要更严谨的判断：检查logs的keys数量或者遍历
                this.data.user.totalDays = Object.keys(this.data.logs).filter(d => this.data.logs[d].completed.length > 0).length;

                // 重新计算连击 (暴力法，MVP适用)
                this.recalculateStreak();
            }
        }

        // 计算经验值: 简单的基于天数和完成度
        // Exp = TotalDays * 10 (假设每天满勤) + CurrentDayCompletedCount
        // 这只是一个近似值
        this.data.user.exp = (this.data.user.totalDays - 1) * 10 + log.completed.length + (isFullComplete ? 2 : 0);

        // 更新等级
        this.updateLevel();
    }

    recalculateStreak() {
        const dates = Object.keys(this.data.logs).sort();
        if (dates.length === 0) {
            this.data.user.streak = 0;
            return;
        }

        let currentStreak = 0;
        // 从今天倒推
        const todayStr = new Date().toISOString().split('T')[0];
        let checkDate = new Date();

        // 如果今天没记录，从昨天开始查
        if (!this.data.logs[todayStr] || this.data.logs[todayStr].completed.length === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (this.data.logs[dateStr] && this.data.logs[dateStr].completed.length > 0) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        this.data.user.streak = currentStreak;
    }

    updateLevel() {
        const exp = this.data.user.exp;
        let currentLevel = 1;
        for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
            if (exp >= LEVEL_CONFIG[i].expRequired) {
                currentLevel = LEVEL_CONFIG[i].level;
                break;
            }
        }
        this.data.user.level = currentLevel;
    }

    getUserData() {
        return this.data.user;
    }

    getLevelInfo() {
        return LEVEL_CONFIG.find(l => l.level === this.data.user.level) || LEVEL_CONFIG[0];
    }

    // 解锁成就
    unlockAchievement(id) {
        if (!this.data.achievements.includes(id)) {
            this.data.achievements.push(id);
            this.save();
            return true; // 新解锁
        }
        return false; // 已解锁
    }

    getAchievements() {
        return ACHIEVEMENTS.map(a => ({
            ...a,
            unlocked: this.data.achievements.includes(a.id)
        }));
    }
}

// 导出实例
const store = new DataStore();
