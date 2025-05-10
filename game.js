document.addEventListener('DOMContentLoaded', () => {
    // 游戏数据
    const gameState = {
        level: 15,
        numbers: [1, 49, 80, 5, 7, 11, 101],
        clickedNumbers: [],
        clickOrder: [],
        score: 0,
        hintsLeft: 25,
        skipsLeft: 50
    };

    // 初始化游戏
    function initGame() {
        renderNumbers();
        updateScore();
        
        document.querySelector('.submit-btn').addEventListener('click', checkAnswer);
        document.querySelector('.hint-btn').addEventListener('click', useHint);
        document.querySelector('.skip-btn').addEventListener('click', skipLevel);
    }

    // 渲染数字
    function renderNumbers() {
        const container = document.getElementById('numbers-container');
        container.innerHTML = '';

        // 获取容器尺寸以放置数字
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // 创建并随机放置数字
        gameState.numbers.forEach((num, index) => {
            const numElement = document.createElement('div');
            numElement.className = 'number';
            numElement.textContent = num;
            numElement.dataset.number = num;
            
            // 随机位置，但确保不会超出容器边界
            const left = Math.random() * (containerWidth - 60);
            const top = Math.random() * (containerHeight - 60);
            
            numElement.style.left = `${left}px`;
            numElement.style.top = `${top}px`;
            
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
        
        // 更新得分
        updateScore();
    }

    // 更新分数显示
    function updateScore() {
        document.getElementById('current-score').textContent = gameState.clickedNumbers.length;
    }

    // 检查答案
    function checkAnswer() {
        // 获取正确的数字排序（从小到大）
        const correctOrder = [...gameState.numbers].sort((a, b) => a - b);
        const userOrder = gameState.clickedNumbers;
        
        // 检查用户点击的顺序是否正确
        let isCorrect = true;
        
        // 首先检查用户是否点击了所有数字
        if (userOrder.length !== correctOrder.length) {
            isCorrect = false;
        } else {
            // 检查每个位置的数字是否匹配
            for (let i = 0; i < correctOrder.length; i++) {
                if (userOrder[i] !== correctOrder[i]) {
                    isCorrect = false;
                    break;
                }
            }
        }
        
        if (isCorrect) {
            alert('恭喜！通过关卡！');
            resetLevel();
        } else {
            alert('顺序不正确，请再试一次！');
            resetCurrentLevel();
        }
    }

    // 使用提示
    function useHint() {
        if (gameState.hintsLeft <= 0) {
            alert('没有足够的提示！');
            return;
        }
        
        // 找出正确顺序中下一个应该点击的数字
        const correctOrder = [...gameState.numbers].sort((a, b) => a - b);
        const nextIndex = gameState.clickedNumbers.length;
        
        if (nextIndex >= correctOrder.length) {
            alert('你已经点击了所有数字！');
            return;
        }
        
        const nextNumber = correctOrder[nextIndex];
        
        // 高亮显示该数字
        const allNumbers = document.querySelectorAll('.number');
        allNumbers.forEach(numElement => {
            if (parseInt(numElement.dataset.number) === nextNumber) {
                numElement.style.color = '#ff3b30';
                setTimeout(() => {
                    numElement.style.color = '';
                }, 1500);
            }
        });
        
        // 减少提示次数
        gameState.hintsLeft--;
        updateHintCount();
    }

    // 更新提示次数显示
    function updateHintCount() {
        const hintCountElement = document.querySelector('.hint-btn span');
        hintCountElement.textContent = `x${gameState.hintsLeft}`;
    }

    // 跳过关卡
    function skipLevel() {
        if (gameState.skipsLeft <= 0) {
            alert('没有足够的跳过次数！');
            return;
        }
        
        // 减少跳过次数
        gameState.skipsLeft--;
        updateSkipCount();
        
        // 重置并进入下一关
        resetLevel();
    }

    // 更新跳过次数显示
    function updateSkipCount() {
        const skipCountElement = document.querySelector('.skip-btn span');
        skipCountElement.textContent = `x${gameState.skipsLeft}`;
    }

    // 重置当前关卡
    function resetCurrentLevel() {
        gameState.clickedNumbers = [];
        gameState.clickOrder = [];
        renderNumbers();
        updateScore();
    }

    // 重置并进入下一关
    function resetLevel() {
        gameState.level++;
        gameState.clickedNumbers = [];
        gameState.clickOrder = [];
        
        // 为下一关生成新的数字组合
        generateNewNumbers();
        
        // 更新关卡显示
        document.querySelector('.level-text').textContent = `關卡 ${gameState.level}`;
        
        renderNumbers();
        updateScore();
    }

    // 生成新的数字组合
    function generateNewNumbers() {
        // 清空当前数字
        gameState.numbers = [];
        
        // 生成6-8个随机数字
        const count = Math.floor(Math.random() * 3) + 6; // 6-8个数字
        
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
}); 