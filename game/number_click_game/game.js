document.addEventListener('DOMContentLoaded', () => {
    // 游戏数据
    const gameState = {
        level: 1,
        numbers: [], // 原始数字
        targetSequence: [], // 目标点击顺序
        clickedNumbers: [],
        clickOrder: [],
        gameMode: 'normal', // 'normal', 'hidden', 'moving'
        obstacles: [], // 遮挡物信息
        movingIntervals: [], // 移动数字的定时器
        numberCount: 7 // 默认数字数量
    };

    // 初始化游戏
    function initGame() {
        // 初始化下一关按钮状态
        document.querySelector('.next-btn').disabled = true;
        
        // 初始化数字数量
        const numberCountSelect = document.getElementById('number-count');
        gameState.numberCount = parseInt(numberCountSelect.value);
        
        // 生成随机数字
        generateNewNumbers();
        
        // 生成随机目标顺序
        gameState.targetSequence = [...gameState.numbers];
        shuffleArray(gameState.targetSequence);
        
        // 更新指令显示
        updateInstructionDisplay();
        
        // 渲染数字
        renderNumbers();
        
        // 添加事件监听
        document.querySelector('.restart-btn').addEventListener('click', restartLevel);
        document.querySelector('.submit-btn').addEventListener('click', checkAnswer);
        document.querySelector('.next-btn').addEventListener('click', nextLevel);
        
        // 监听数字数量选择
        numberCountSelect.addEventListener('change', (e) => {
            gameState.numberCount = parseInt(e.target.value);
            restartLevel(true); // 传递参数表示是数量变更引起的重启
        });
        
        // 点击数字后隐藏目标序列
        const numbers = document.querySelectorAll('.number');
        numbers.forEach(num => {
            num.addEventListener('click', () => {
                document.querySelector('.target-sequence').classList.add('hidden');
            });
        });
        
        // 添加模式选择按钮事件
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有按钮的活动状态
                modeButtons.forEach(b => b.classList.remove('active'));
                // 添加当前按钮的活动状态
                btn.classList.add('active');
                
                // 设置游戏模式
                const newMode = btn.dataset.mode;
                
                // 如果模式不同，重置游戏
                if (newMode !== gameState.gameMode) {
                    gameState.gameMode = newMode;
                    clearAllMovingIntervals(); // 清除所有移动定时器
                    removeAllObstacles(); // 移除所有障碍物
                    restartLevel();
                }
            });
        });
    }

    // 随机打乱数组
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 更新指令显示，添加目标序列的显示
    function updateInstructionDisplay() {
        const targetSequenceElement = document.querySelector('.target-sequence');
        targetSequenceElement.innerHTML = `依序點擊：${gameState.targetSequence.join('、')}`;
        targetSequenceElement.classList.remove('hidden');
    }

    // 计算不重叠的位置
    function calculateNonOverlappingPosition(containerWidth, containerHeight, numSize, existingPositions) {
        const padding = 20; // 边缘填充
        const minDistance = numSize + 10; // 数字间最小距离
        
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const left = padding + Math.random() * (containerWidth - numSize - padding * 2);
            const top = padding + Math.random() * (containerHeight - numSize - padding * 2);
            
            // 检查与现有位置的距离
            let tooClose = false;
            for (const pos of existingPositions) {
                const distance = Math.sqrt(Math.pow(left - pos.left, 2) + Math.pow(top - pos.top, 2));
                if (distance < minDistance) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                return { left, top };
            }
            
            attempts++;
        }
        
        // 如果尝试了太多次还找不到位置，使用固定网格布局
        const index = existingPositions.length;
        
        // 根据数字总数调整布局
        const cols = gameState.numberCount <= 9 ? 3 : 4;
        const cellWidth = containerWidth / cols;
        const cellHeight = cellWidth;
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        return {
            left: col * cellWidth + (cellWidth - numSize) / 2,
            top: row * cellHeight + (cellHeight - numSize) / 2
        };
    }

    // 渲染数字
    function renderNumbers() {
        const container = document.getElementById('numbers-container');
        container.innerHTML = '';

        // 重置点击状态
        gameState.clickedNumbers = [];
        gameState.clickOrder = [];

        // 获取容器尺寸以放置数字
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // 调整数字大小，根据数量动态调整
        const numSizeBase = 65; // 基础大小
        const numSize = gameState.numberCount > 9 ? numSizeBase * 0.8 : numSizeBase;
        
        // 存储已放置数字的位置
        const positions = [];
        
        // 创建并放置数字，保证不重叠
        gameState.numbers.forEach((num, index) => {
            const numElement = document.createElement('div');
            numElement.className = 'number';
            numElement.textContent = num;
            numElement.dataset.number = num;
            
            // 根据数字数量动态调整样式
            if (gameState.numberCount > 9) {
                numElement.style.width = `${numSize}px`;
                numElement.style.height = `${numSize}px`;
                numElement.style.fontSize = '28px';
            }
            
            // 计算不重叠位置
            const position = calculateNonOverlappingPosition(containerWidth, containerHeight, numSize, positions);
            positions.push(position);
            
            numElement.style.left = `${position.left}px`;
            numElement.style.top = `${position.top}px`;
            
            // 添加点击事件
            numElement.addEventListener('click', () => handleNumberClick(numElement, num, index));
            
            container.appendChild(numElement);
        });
        
        // 根据游戏模式初始化特殊效果
        initGameModeEffects(container, positions, containerWidth, containerHeight);
    }
    
    // 根据游戏模式初始化特殊效果
    function initGameModeEffects(container, positions, containerWidth, containerHeight) {
        // 先清除之前的效果
        clearAllMovingIntervals();
        removeAllObstacles();
        
        if (gameState.gameMode === 'hidden') {
            // 隐藏数字模式：添加障碍物
            createObstacles(container, positions, containerWidth, containerHeight);
        } else if (gameState.gameMode === 'moving') {
            // 动态数字模式：添加移动效果
            const numbers = document.querySelectorAll('.number');
            numbers.forEach(num => {
                num.classList.add('moving');
                startNumberMoving(num, containerWidth, containerHeight);
            });
        }
    }
    
    // 创建障碍物
    function createObstacles(container, positions, containerWidth, containerHeight) {
        // 根据数字数量和关卡动态调整障碍物数量
        const baseObstacleCount = Math.ceil(gameState.numberCount / 3);
        const levelFactor = Math.floor(gameState.level / 2);
        const obstacleCount = Math.min(gameState.numberCount - 1, baseObstacleCount + levelFactor);
        
        const obstacleSize = 80; // 障碍物大小
        
        for (let i = 0; i < obstacleCount; i++) {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            
            // 随机位置
            const left = Math.random() * (containerWidth - obstacleSize);
            const top = Math.random() * (containerHeight - obstacleSize);
            
            obstacle.style.left = `${left}px`;
            obstacle.style.top = `${top}px`;
            
            // 存储障碍物信息
            const obstacleInfo = { element: obstacle, left, top };
            gameState.obstacles.push(obstacleInfo);
            
            // 使障碍物可拖动
            makeObstacleDraggable(obstacle);
            
            container.appendChild(obstacle);
        }
    }
    
    // 使障碍物可拖动
    function makeObstacleDraggable(obstacle) {
        let isDragging = false;
        let offsetX, offsetY;
        
        obstacle.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - obstacle.getBoundingClientRect().left;
            offsetY = e.clientY - obstacle.getBoundingClientRect().top;
            obstacle.style.opacity = '0.8';
            obstacle.style.zIndex = '10';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const container = document.getElementById('numbers-container');
            const containerRect = container.getBoundingClientRect();
            
            let left = e.clientX - containerRect.left - offsetX;
            let top = e.clientY - containerRect.top - offsetY;
            
            // 限制在容器内
            const maxLeft = containerRect.width - obstacle.offsetWidth;
            const maxTop = containerRect.height - obstacle.offsetHeight;
            
            left = Math.max(0, Math.min(left, maxLeft));
            top = Math.max(0, Math.min(top, maxTop));
            
            obstacle.style.left = `${left}px`;
            obstacle.style.top = `${top}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                obstacle.style.opacity = '0.7';
                obstacle.style.zIndex = '3';
            }
        });
        
        // 触摸设备支持
        obstacle.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            offsetX = touch.clientX - obstacle.getBoundingClientRect().left;
            offsetY = touch.clientY - obstacle.getBoundingClientRect().top;
            obstacle.style.opacity = '0.8';
            obstacle.style.zIndex = '10';
            e.preventDefault();
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const touch = e.touches[0];
            const container = document.getElementById('numbers-container');
            const containerRect = container.getBoundingClientRect();
            
            let left = touch.clientX - containerRect.left - offsetX;
            let top = touch.clientY - containerRect.top - offsetY;
            
            // 限制在容器内
            const maxLeft = containerRect.width - obstacle.offsetWidth;
            const maxTop = containerRect.height - obstacle.offsetHeight;
            
            left = Math.max(0, Math.min(left, maxLeft));
            top = Math.max(0, Math.min(top, maxTop));
            
            obstacle.style.left = `${left}px`;
            obstacle.style.top = `${top}px`;
            e.preventDefault();
        });
        
        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                obstacle.style.opacity = '0.7';
                obstacle.style.zIndex = '3';
            }
        });
    }
    
    // 移除所有障碍物
    function removeAllObstacles() {
        gameState.obstacles.forEach(obstacleInfo => {
            if (obstacleInfo.element && obstacleInfo.element.parentNode) {
                obstacleInfo.element.parentNode.removeChild(obstacleInfo.element);
            }
        });
        gameState.obstacles = [];
    }
    
    // 让数字开始移动
    function startNumberMoving(numElement, containerWidth, containerHeight) {
        const moveNumber = () => {
            // 根据数字数量动态调整大小
            const numSize = gameState.numberCount > 9 ? 65 * 0.8 : 65;
            const padding = 20;
            
            // 生成新的随机位置
            const newLeft = padding + Math.random() * (containerWidth - numSize - padding * 2);
            const newTop = padding + Math.random() * (containerHeight - numSize - padding * 2);
            
            // 平滑移动到新位置
            numElement.style.left = `${newLeft}px`;
            numElement.style.top = `${newTop}px`;
        };
        
        // 随机初始延迟，使数字不同步移动
        const initialDelay = Math.random() * 2000;
        setTimeout(() => {
            moveNumber();
            // 每3-7秒移动一次，根据关卡调整速度
            const baseInterval = 5000 - (gameState.level * 300);
            const interval = Math.max(2000, baseInterval + Math.random() * 2000);
            const moveInterval = setInterval(moveNumber, interval);
            gameState.movingIntervals.push(moveInterval);
        }, initialDelay);
    }
    
    // 清除所有移动定时器
    function clearAllMovingIntervals() {
        gameState.movingIntervals.forEach(interval => {
            clearInterval(interval);
        });
        gameState.movingIntervals = [];
    }

    // 处理数字点击
    function handleNumberClick(element, number, index) {
        // 如果数字已经被点击，则忽略
        if (gameState.clickedNumbers.includes(number)) {
            return;
        }
        
        // 添加到已点击数组
        gameState.clickedNumbers.push(number);
        gameState.clickOrder.push(index);
        
        // 更新UI
        element.classList.add('clicked');
        
        // 添加点击顺序指示器
        const orderIndicator = document.createElement('div');
        orderIndicator.className = 'number-order';
        orderIndicator.textContent = gameState.clickedNumbers.length;
        element.appendChild(orderIndicator);
        
        // 点击第一个数字时隐藏目标序列
        if (gameState.clickedNumbers.length === 1) {
            document.querySelector('.target-sequence').classList.add('hidden');
        }
    }

    // 检查答案
    function checkAnswer() {
        // 如果没有点击任何数字，提示用户
        if (gameState.clickedNumbers.length === 0) {
            showNotification('请先点击数字！');
            return;
        }
        
        // 如果没有点击所有数字，确认是否要检查
        if (gameState.clickedNumbers.length !== gameState.targetSequence.length) {
            if (!confirm('你还没有点击所有数字，确定要提交吗？')) {
                return;
            }
        }
        
        // 检查用户点击的顺序是否与目标顺序一致
        const userOrder = gameState.clickedNumbers;
        
        // 检查用户点击的顺序是否正确
        let isCorrect = true;
        
        // 检查已点击数字的顺序是否匹配
        for (let i = 0; i < Math.min(userOrder.length, gameState.targetSequence.length); i++) {
            if (userOrder[i] !== gameState.targetSequence[i]) {
                isCorrect = false;
                break;
            }
        }
        
        // 点击的数字数量必须一致
        if (userOrder.length !== gameState.targetSequence.length) {
            isCorrect = false;
        }
        
        if (isCorrect) {
            showNotification('恭喜！通过关卡！');
            document.querySelector('.next-btn').disabled = false;
        } else {
            showNotification('点击顺序不正确，请重试！');
            // 显示正确顺序，帮助玩家学习
            document.querySelector('.target-sequence').classList.remove('hidden');
        }
    }
    
    // 显示通知
    function showNotification(message) {
        // 如果已有通知，先移除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 自动消失
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }

    // 重新开始当前关卡
    function restartLevel(isNumberCountChange = false) {
        // 重置游戏状态
        gameState.clickedNumbers = [];
        gameState.clickOrder = [];
        
        // 清除效果
        clearAllMovingIntervals();
        removeAllObstacles();
        
        // 如果是数量变更引起的重启，重新生成数字
        if (isNumberCountChange) {
            generateNewNumbers();
            
            // 重新生成随机目标顺序
            gameState.targetSequence = [...gameState.numbers];
            shuffleArray(gameState.targetSequence);
        }
        
        // 重新渲染数字
        renderNumbers();
        
        // 显示目标序列
        updateInstructionDisplay();
        
        // 重置下一关按钮
        document.querySelector('.next-btn').disabled = true;
    }
    
    // 进入下一关
    function nextLevel() {
        // 增加关卡数
        gameState.level++;
        
        // 更新关卡显示
        document.querySelector('.level-text').textContent = `关卡 ${gameState.level}`;
        
        // 清除效果
        clearAllMovingIntervals();
        removeAllObstacles();
        
        // 生成新的数字组合
        generateNewNumbers();
        
        // 重置游戏状态
        gameState.clickedNumbers = [];
        gameState.clickOrder = [];
        
        // 重新生成随机目标顺序
        gameState.targetSequence = [...gameState.numbers];
        shuffleArray(gameState.targetSequence);
        
        // 更新指令显示
        updateInstructionDisplay();
        
        // 渲染新的数字
        renderNumbers();
        
        // 重置下一关按钮
        document.querySelector('.next-btn').disabled = true;
    }

    // 生成新的数字组合
    function generateNewNumbers() {
        // 清空当前数字
        gameState.numbers = [];
        
        // 使用当前设置的数字数量
        const count = gameState.numberCount;
        
        for (let i = 0; i < count; i++) {
            // 生成1-100范围内的随机数
            let num = Math.floor(Math.random() * 100) + 1;
            
            // 确保不重复
            while (gameState.numbers.includes(num)) {
                num = Math.floor(Math.random() * 100) + 1;
            }
            
            gameState.numbers.push(num);
        }
    }

    // 初始化游戏
    initGame();
    
    // 添加窗口大小变化监听器，以重新布局数字
    window.addEventListener('resize', () => {
        if (document.querySelector('.number')) {
            clearAllMovingIntervals();
            renderNumbers();
        }
    });
}); 