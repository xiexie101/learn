// 全局变量
let words = []; // 将在初始化时从allWords加载
let loadedImages = 0;
let isSpeaking = false;
let currentCategory = 'all';
let learnedWordsCount = 0;
let listenCount = 0;
let wordCards = {};  // 存储单词卡片的引用
let currentFocusIndex = null;  // 当前选中的卡片索引
let touchStartY = 0; // 触摸开始的Y坐标
let touchStartX = 0; // 触摸开始的X坐标

// 从localStorage加载学习状态
function loadLearningState() {
    try {
        const savedState = localStorage.getItem('englishLearningState');
        if (savedState) {
            const state = JSON.parse(savedState);
            learnedWordsCount = state.learnedWords || 0;
            listenCount = state.listenCount || 0;
            
            // 恢复学习状态
            if (state.learnedWordsIds) {
                state.learnedWordsIds.forEach(id => {
                    const card = wordCards[id];
                    if (card) {
                        card.classList.add('learned');
                    }
                });
            }
        }
    } catch (error) {
        console.error('加载学习状态失败:', error);
    }
}

// 保存学习状态到localStorage
function saveLearningState() {
    try {
        const learnedWordsIds = Object.keys(wordCards).filter(id => 
            wordCards[id].classList.contains('learned')
        );
        
        const state = {
            learnedWords: learnedWordsCount,
            listenCount: listenCount,
            learnedWordsIds: learnedWordsIds
        };
        
        localStorage.setItem('englishLearningState', JSON.stringify(state));
    } catch (error) {
        console.error('保存学习状态失败:', error);
    }
}

// 更新统计信息
function updateStats() {
    document.getElementById('totalWords').textContent = words.length;
    document.getElementById('learnedWords').textContent = learnedWordsCount;
    document.getElementById('listenCount').textContent = listenCount;
    
    // 检查是否学习完所有单词
    if (learnedWordsCount === words.length) {
        showCelebration();
    }
}

// 显示庆祝弹窗
function showCelebration() {
    const celebration = document.getElementById('celebration');
    celebration.style.display = 'block';
    
    // 添加关闭按钮事件
    document.getElementById('celebrationCloseBtn').addEventListener('click', () => {
        celebration.style.display = 'none';
    });
}

// 确保这个脚本在DOM完全加载后运行
document.addEventListener('DOMContentLoaded', function() {
    // 使用来自word_data.js的单词数据，该文件中定义了allWords变量
    const words = allWords;
    
    // 全局变量
    let currentWordIndex = 0; // 当前显示的单词索引
    let learningState = {}; // 学习状态
    let cardFlipped = false; // 卡片是否已翻转
    let audioQueue = []; // 音频队列
    let isPlaying = false; // 是否正在播放音频
    let autoPlayIntervalId = null; // 自动播放的计时器ID
    let wordsByCategory = {}; // 按类别分组的单词
    let selectedCategory = null; // 当前选择的类别

    // 加载保存的学习状态
    loadLearningState();

    const wordContainer = document.getElementById('wordContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    
    // 生成单词卡片
    words.forEach((word, index) => {
        const card = createWordCard(word, index);
        wordContainer.appendChild(card);
        wordCards[index] = card;  // 存储卡片引用
    });

    // 隐藏没有图片的分类按钮
    hideEmptyCategoryButtons();

    // 处理图片加载的计数器和超时检测
    let loadTimeout;
    
    // 添加超时检测，防止无限等待
    loadTimeout = setTimeout(() => {
        if (loadedImages < words.length) {
            console.warn(`图片加载超时，已加载 ${loadedImages}/${words.length} 张图片`);
            loadingContainer.classList.add('hidden');
            loadLearningState();
            updateStats();
            setFocusToCard(0);
        }
    }, 8000); // 8秒超时，缩短超时时间更适合移动端

    // 预加载所有图片并在完成后隐藏加载动画
    words.forEach(word => {
        const img = new Image();
        img.onload = () => {
            loadedImages++;
            checkAllImagesLoaded();
        };
        img.onerror = () => {
            console.error(`无法加载图片: ${word.image}`);
            
            // 使用默认图像或者设置一个占位符
            word.imageError = true;
            loadedImages++;
            checkAllImagesLoaded();
        };
        img.src = word.image;
    });
    
    // 检查是否所有图片都已加载
    function checkAllImagesLoaded() {
        if (loadedImages === words.length) {
            // 所有图片加载完成或已处理错误
            clearTimeout(loadTimeout);
            
            setTimeout(() => {
                loadingContainer.classList.add('hidden');
                
                // 加载学习状态
                loadLearningState();
                
                // 更新统计信息
                updateStats();
                
                // 初始化第一张卡片为选中状态
                setFocusToCard(0);
            }, 500);
        }
    }

    // 初始化分类按钮事件
    initCategoryButtons();
    
    // 初始化键盘导航
    initKeyboardNavigation();
    
    // 初始化触摸事件
    initTouchNavigation();
});

// 初始化键盘导航
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // 如果加载动画还在显示，或者正在说话，则不处理键盘事件
        if (!document.getElementById('loadingContainer').classList.contains('hidden') || isSpeaking) {
            return;
        }
        
        // 获取可见的卡片索引列表
        const visibleCardIndices = Object.keys(wordCards).filter(index => 
            wordCards[index].style.display !== 'none'
        );
        
        if (visibleCardIndices.length === 0) return;
        
        // 如果当前没有选中卡片，选择第一个
        if (currentFocusIndex === null) {
            setFocusToCard(parseInt(visibleCardIndices[0]));
            return;
        }
        
        // 获取当前选中卡片在可见卡片中的位置
        const currentVisibleIndex = visibleCardIndices.indexOf(currentFocusIndex.toString());
        
        // 根据按键移动焦点
        switch (e.key) {
            case 'ArrowRight':
                if (currentVisibleIndex < visibleCardIndices.length - 1) {
                    setFocusToCard(parseInt(visibleCardIndices[currentVisibleIndex + 1]));
                }
                e.preventDefault();
                break;
                
            case 'ArrowLeft':
                if (currentVisibleIndex > 0) {
                    setFocusToCard(parseInt(visibleCardIndices[currentVisibleIndex - 1]));
                }
                e.preventDefault();
                break;
                
            case 'ArrowUp':
                // 在网格布局中，向上移动通常是移动到上一行的相同位置
                // 假设一行有3个卡片
                const cardsPerRow = window.innerWidth <= 480 ? 1 : (window.innerWidth <= 768 ? 2 : 3);
                if (currentVisibleIndex >= cardsPerRow) {
                    setFocusToCard(parseInt(visibleCardIndices[currentVisibleIndex - cardsPerRow]));
                }
                e.preventDefault();
                break;
                
            case 'ArrowDown':
                // 在网格布局中，向下移动通常是移动到下一行的相同位置
                const perRow = window.innerWidth <= 480 ? 1 : (window.innerWidth <= 768 ? 2 : 3);
                if (currentVisibleIndex + perRow < visibleCardIndices.length) {
                    setFocusToCard(parseInt(visibleCardIndices[currentVisibleIndex + perRow]));
                }
                e.preventDefault();
                break;
                
            case 'Enter':
            case ' ': // 空格键
                // 点击当前选中的卡片
                if (currentFocusIndex !== null) {
                    wordCards[currentFocusIndex].click();
                }
                e.preventDefault();
                break;
        }
    });
}

// 设置焦点到特定卡片
function setFocusToCard(index) {
    // 移除之前卡片的焦点
    if (currentFocusIndex !== null && wordCards[currentFocusIndex]) {
        wordCards[currentFocusIndex].classList.remove('keyboard-focus');
    }
    
    // 设置新的焦点
    currentFocusIndex = index;
    
    if (wordCards[currentFocusIndex]) {
        wordCards[currentFocusIndex].classList.add('keyboard-focus');
        
        // 滚动到视图内
        wordCards[currentFocusIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// 初始化分类按钮
function initCategoryButtons() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active类
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // 添加当前按钮的active类
            button.classList.add('active');
            
            // 更新当前分类并筛选单词
            currentCategory = button.dataset.category;
            filterWordsByCategory(currentCategory);
            
            // 重置焦点到第一个可见卡片
            resetFocusAfterFilter();
        });
    });
}

// 根据分类筛选单词
function filterWordsByCategory(category) {
    Object.values(wordCards).forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// 筛选后重置焦点
function resetFocusAfterFilter() {
    // 获取第一个可见卡片的索引
    const visibleCardIndex = Object.keys(wordCards).find(index => 
        wordCards[index].style.display !== 'none'
    );
    
    if (visibleCardIndex) {
        setFocusToCard(parseInt(visibleCardIndex));
    } else {
        currentFocusIndex = null;
    }
}

// 初始化触摸导航
function initTouchNavigation() {
    const wordContainer = document.getElementById('wordContainer');
    
    // 添加触摸事件处理
    wordContainer.addEventListener('touchstart', handleTouchStart, false);
    wordContainer.addEventListener('touchmove', handleTouchMove, false);
    wordContainer.addEventListener('touchend', handleTouchEnd, false);
    
    // 处理触摸开始
    function handleTouchStart(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
    }
    
    // 处理触摸移动
    function handleTouchMove(e) {
        // 如果没有触摸开始坐标，则返回
        if (!touchStartY || !touchStartX) return;
        
        // 防止滚动冲突
        if (Math.abs(e.touches[0].clientY - touchStartY) > 30) {
            return;
        }
        
        // 防止默认滚动行为
        e.preventDefault();
    }
    
    // 处理触摸结束
    function handleTouchEnd(e) {
        if (!touchStartY || !touchStartX) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        
        // 计算水平和垂直滑动距离
        const diffY = touchEndY - touchStartY;
        const diffX = touchEndX - touchStartX;
        
        // 如果滑动距离太小，则认为是点击
        if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) {
            // 重置触摸坐标
            touchStartY = 0;
            touchStartX = 0;
            return;
        }
        
        // 判断滑动方向
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 水平滑动
            if (diffX > 0) {
                // 向右滑动，显示上一个卡片
                showPreviousCard();
            } else {
                // 向左滑动，显示下一个卡片
                showNextCard();
            }
        }
        
        // 重置触摸坐标
        touchStartY = 0;
        touchStartX = 0;
    }
}

// 显示上一个卡片
function showPreviousCard() {
    // 获取可见的卡片索引列表
    const visibleCardIndices = Object.keys(wordCards).filter(index => 
        wordCards[index].style.display !== 'none'
    );
    
    if (visibleCardIndices.length === 0) return;
    
    // 如果当前没有选中卡片，选择第一个
    if (currentFocusIndex === null) {
        setFocusToCard(parseInt(visibleCardIndices[0]));
        return;
    }
    
    // 获取当前选中卡片在可见卡片中的位置
    const currentVisibleIndex = visibleCardIndices.indexOf(currentFocusIndex.toString());
    
    if (currentVisibleIndex > 0) {
        setFocusToCard(parseInt(visibleCardIndices[currentVisibleIndex - 1]));
    }
}

// 显示下一个卡片
function showNextCard() {
    // 获取可见的卡片索引列表
    const visibleCardIndices = Object.keys(wordCards).filter(index => 
        wordCards[index].style.display !== 'none'
    );
    
    if (visibleCardIndices.length === 0) return;
    
    // 如果当前没有选中卡片，选择第一个
    if (currentFocusIndex === null) {
        setFocusToCard(parseInt(visibleCardIndices[0]));
        return;
    }
    
    // 获取当前选中卡片在可见卡片中的位置
    const currentVisibleIndex = visibleCardIndices.indexOf(currentFocusIndex.toString());
    
    if (currentVisibleIndex < visibleCardIndices.length - 1) {
        setFocusToCard(parseInt(visibleCardIndices[currentVisibleIndex + 1]));
    }
}

// 创建单词卡片
function createWordCard(word, index) {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.dataset.category = word.category;
    card.dataset.index = index;
    
    const image = document.createElement('img');
    image.className = 'word-image';
    image.src = word.image;
    image.alt = word.english;
    
    // 添加图片加载错误处理
    image.onerror = function() {
        // 设置默认图片或者只显示文字
        this.onerror = null; // 防止循环触发
        this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20500%20180%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17b00354c6c%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3A-apple-system%2CBlinkMacSystemFont%2C%26quot%3BSegoe%20UI%26quot%3B%2CRoboto%2C%26quot%3BHelvetica%20Neue%26quot%3B%2CArial%2C%26quot%3BNoto%20Sans%26quot%3B%2Csans-serif%2C%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Symbol%26quot%3B%2C%26quot%3BNoto%20Color%20Emoji%26quot%3B%2C%20monospace%3Bfont-size%3A25pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17b00354c6c%22%3E%3Crect%20width%3D%22500%22%20height%3D%22180%22%20fill%3D%22%23373940%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22180.5%22%20y%3D%2295.5%22%3E%E5%9B%BE%E7%89%87%E6%9C%AA%E6%89%BE%E5%88%B0%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
        console.warn(`无法加载图片: ${word.image}`);
    };
    
    const info = document.createElement('div');
    info.className = 'word-info';
    
    const englishWord = document.createElement('h2');
    englishWord.className = 'english-word';
    englishWord.textContent = word.english;
    
    const chineseWord = document.createElement('p');
    chineseWord.className = 'chinese-word';
    chineseWord.textContent = word.chinese;
    
    const soundIcon = document.createElement('div');
    soundIcon.className = 'sound-icon';
    soundIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#333"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    
    info.appendChild(englishWord);
    info.appendChild(chineseWord);
    
    card.appendChild(image);
    card.appendChild(info);
    card.appendChild(soundIcon);
    
    // 添加点击事件
    let clickCount = 0;
    card.addEventListener('click', () => {
        // 防止重复播放
        if (isSpeaking) return;
        
        // 增加听读次数
        listenCount++;
        
        // 更新统计信息
        updateStats();
        
        // 记录点击次数，用于标记为已学习
        clickCount++;
        if (clickCount >= 3 && !card.classList.contains('learned')) {
            card.classList.add('learned');
            learnedWordsCount++;
            updateStats();
            
            // 震动反馈（如果浏览器支持）
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        }
        
        card.classList.add('speaking');
        speakWord(word, () => {
            card.classList.remove('speaking');
            
            // 保存学习状态
            saveLearningState();
        });
    });
    
    // 添加鼠标悬停事件，设置焦点
    card.addEventListener('mouseenter', () => {
        setFocusToCard(index);
    });
    
    return card;
}

// 语音功能
function speakWord(word, callback) {
    isSpeaking = true;
    
    // 检查是否支持语音合成
    if (!window.speechSynthesis) {
        console.error('您的浏览器不支持语音合成功能');
        alert('您的浏览器不支持语音合成功能，请使用现代浏览器访问。');
        isSpeaking = false;
        if (callback) callback();
        return;
    }
    
    // 先用英文发音
    speakEnglish(word.english, () => {
        // 等待短暂时间后播放中文
        setTimeout(() => {
            speakChinese(word.chinese, () => {
                isSpeaking = false;
                if (callback) callback();
            });
        }, 500);
    });
}

// 英文发音
function speakEnglish(text, callback) {
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.lang = 'en-US';
    speech.volume = 1;
    speech.rate = 0.8;  // 放慢语速，适合儿童学习
    speech.pitch = 1;
    
    speech.onend = function() {
        if (callback) callback();
    };
    
    speech.onerror = function(event) {
        console.error('语音合成错误:', event);
        if (callback) callback();
    };
    
    window.speechSynthesis.speak(speech);
}

// 中文发音
function speakChinese(text, callback) {
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.lang = 'zh-CN';
    speech.volume = 1;
    speech.rate = 0.8;
    speech.pitch = 1;
    
    speech.onend = function() {
        if (callback) callback();
    };
    
    speech.onerror = function(event) {
        console.error('语音合成错误:', event);
        if (callback) callback();
    };
    
    window.speechSynthesis.speak(speech);
}

// 添加错误处理
window.addEventListener('error', (event) => {
    console.error('错误：', event.message);
    alert('发生错误，请确保您使用的是支持语音功能的现代浏览器');
});

// 隐藏没有图片的分类按钮
function hideEmptyCategoryButtons() {
    // 获取所有分类
    const categories = {};
    allWords.forEach(word => {
        if (word.category) {
            categories[word.category] = true;
        }
    });
    
    // 隐藏没有对应单词的分类按钮
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        const category = button.dataset.category;
        if (category !== 'all' && !categories[category]) {
            button.style.display = 'none';
        }
    });
} 