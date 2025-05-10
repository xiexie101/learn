document.addEventListener('DOMContentLoaded', () => {
    // 游戏数据
    const gameState = {
        level: 1,
        numbers: [1, 49, 80, 5, 7, 11, 101], // 原始数字
        targetSequence: [], // 目标点击顺序
        clickedNumbers: [],
        clickOrder: [],
        score: 0,
        hintsLeft: 25,
        skipsLeft: 50
    };

    // 初始化游戏
    function initGame() {
        // 初始化下一关按钮状态
        document.querySelector('.next-btn').disabled = true;
        
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
        
        // 点击数字后隐藏目标序列
        const numbers = document.querySelectorAll('.number');
        numbers.forEach(num => {
            num.addEventListener('click', () => {
                document.querySelector('.target-sequence').classList.add('hidden');
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
        const cols = 3;
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
        const numSize = 65; // 与CSS中的数字尺寸一致
        
        // 存储已放置数字的位置
        const positions = [];
        
        // 创建并放置数字，保证不重叠
        gameState.numbers.forEach((num, index) => {
            const numElement = document.createElement('div');
            numElement.className = 'number';
            numElement.textContent = num;
            numElement.dataset.number = num;
            
            // 计算不重叠位置
            const position = calculateNonOverlappingPosition(containerWidth, containerHeight, numSize, positions);
            positions.push(position);
            
            numElement.style.left = `${position.left}px`;
            numElement.style.top = `${position.top}px`;
            
            // 添加点击事件
            numElement.addEventListener('click', () => handleNumberClick(numElement, num, index));
            
            container.appendChild(numElement);
        });
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
    function restartLevel() {
        // 重置游戏状态
        gameState.clickedNumbers = [];
        gameState.clickOrder = [];
        
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
        document.querySelector('.level-text').textContent = `關卡 ${gameState.level}`;
        
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
        
        // 生成7个随机数字
        const count = 7; // 固定7个数字
        
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
            renderNumbers();
        }
    });
}); 