const startScreen = document.getElementById('start-screen');
const app = document.getElementById('app');
const startBtn = document.getElementById('start-btn');
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const emojiPuppet = document.getElementById('emoji-puppet');
const fingerCountEl = document.getElementById('finger-count');
const currentStateEl = document.getElementById('current-state');

// 状态映射表
const stateMap = {
    0: { emoji: '😴', desc: '睡觉 / 待机', text: '呼呼呼' },
    1: { emoji: '😐', desc: '平静 / 关注', text: '嗯' },
    2: { emoji: '😊', desc: '微笑 / 友好', text: '嘿嘿' },
    3: { emoji: '😂', desc: '大笑 / 欢乐', text: '哈哈哈' },
    4: { emoji: '😱', desc: '惊讶 / 错愕', text: '啊？' },
    5: { emoji: '🤩', desc: '兴奋 / 期待', text: '哇哦！' }
};

let currentFingers = 0;
let lastFingers = -1;
let synth = window.speechSynthesis;
let voices = [];

// 初始化语音
function initSpeech() {
    voices = synth.getVoices();
    if (voices.length === 0) {
        synth.onvoiceschanged = () => {
            voices = synth.getVoices();
        };
    }
}

// 播放语音
function speak(text) {
    if (synth.speaking) {
        synth.cancel(); // 取消上一个正在播放的声音
    }
    const utterThis = new SpeechSynthesisUtterance(text);
    // 尝试寻找中文语音
    const zhVoice = voices.find(v => v.lang.includes('zh'));
    if (zhVoice) {
        utterThis.voice = zhVoice;
    }
    utterThis.rate = 1.2; // 稍微加快一点语速，显得更活泼
    synth.speak(utterThis);
}

// 启动应用
startBtn.addEventListener('click', async () => {
    initSpeech();
    startScreen.style.display = 'none';
    app.style.display = 'block';
    
    // 初始化 MediaPipe 手部识别
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions({
        maxNumHands: 1, // 只跟踪一只手，避免混乱
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults(onResults);
    
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 640,
        height: 480
    });
    
    camera.start();
});

// 处理手部识别结果
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // 设置画布尺寸以匹配视频
    if (canvasElement.width !== videoElement.videoWidth) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const handedness = results.multiHandedness[0].label; // 'Left' or 'Right'
        
        // 绘制骨架（用于调试/展示在小窗里）
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 2});
        
        // 1. 计算伸出的手指数量
        const fingersCount = countFingers(landmarks, handedness);
        
        // 2. 更新表情和语音 (加入简单的防抖逻辑)
        updatePuppetState(fingersCount);
        
        // 3. 计算手掌中心位置，控制木偶旋转
        updatePuppetRotation(landmarks);
        
    } else {
        // 如果没有检测到手，可以让木偶慢慢回正，并进入待机
        emojiPuppet.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
        updatePuppetState(0);
    }
    canvasCtx.restore();
}

// 计算伸出的手指数量
function countFingers(landmarks, handedness) {
    let count = 0;
    
    // 手指指尖和对应指节的索引
    // Thumb: 4, Index: 8, Middle: 12, Ring: 16, Pinky: 20
    
    // 拇指逻辑：根据左右手不同，判断指尖在 X 轴上的位置
    // 注意：MediaPipe 中的图像是未镜像的，但我们显示时镜像了。
    // landmark x 坐标从左到右 0->1
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3]; // 也可以用 2 (mcp)
    
    // 简化处理：检测拇指指尖距离根部(0)的距离是否大于掌指关节距离
    // 或者根据 x 坐标，右手大拇指伸出时 tip.x < ip.x (因为手心向镜头)，左手 tip.x > ip.x
    // MediaPipe Hands returned 'Right' actually means the image left hand (if mirrored).
    // Let's use distance for robustness.
    
    // 更准确的拇指检测：
    const isRightHand = handedness === 'Right';
    if (isRightHand) {
        if (thumbTip.x < thumbIp.x) count++;
    } else {
        if (thumbTip.x > thumbIp.x) count++;
    }

    // 其余四指：指尖 Y 坐标小于第一指节 Y 坐标 (屏幕坐标系，Y朝下)
    if (landmarks[8].y < landmarks[6].y) count++;  // 食指
    if (landmarks[12].y < landmarks[10].y) count++; // 中指
    if (landmarks[16].y < landmarks[14].y) count++; // 无名指
    if (landmarks[20].y < landmarks[18].y) count++; // 小指
    
    return count;
}

// 更新木偶状态
function updatePuppetState(fingersCount) {
    // 确保在 0-5 范围内
    const count = Math.max(0, Math.min(5, fingersCount));
    
    if (count !== lastFingers) {
        currentFingers = count;
        const state = stateMap[currentFingers];
        
        // 更新 UI
        emojiPuppet.textContent = state.emoji;
        fingerCountEl.textContent = `手指数量: ${currentFingers}`;
        currentStateEl.textContent = `状态: ${state.desc}`;
        
        // 播放语音
        speak(state.text);
        
        // 添加一个弹跳的微小缩放动画效果
        emojiPuppet.style.transform += ' scale(1.1)';
        setTimeout(() => {
            // 这里不直接重置 transform，因为有旋转状态，交由 requestAnimationFrame 或下一次帧处理
            // 这里我们只是触发一下重新渲染，通过 CSS transition 会平滑过去
            // 实际缩放恢复在 updatePuppetRotation 中通过覆盖 transform 实现
        }, 150);

        lastFingers = currentFingers;
    }
}

// 控制木偶旋转
function updatePuppetRotation(landmarks) {
    // 使用手掌中心（大致用 0, 5, 17 三个点的中心来估算）
    const palmX = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3;
    const palmY = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3;
    
    // 映射到旋转角度
    // 当手在屏幕中心(0.5, 0.5)时，旋转为0
    // X 坐标 (0 -> 1) 映射到 rotateY (-30deg -> 30deg)
    // Y 坐标 (0 -> 1) 映射到 rotateX (30deg -> -30deg)
    
    // 注意我们的 video 和 canvas 是水平镜像的，所以 X 需要反转回来，或者直接在这里处理
    // 如果手在画面左边 (镜像后用户看到的左边)，x 较小。
    const mappedX = (0.5 - palmX) * 60; // range roughly -30 to 30
    const mappedY = (palmY - 0.5) * 60; // range roughly -30 to 30

    // 应用变换
    emojiPuppet.style.transform = `rotateX(${mappedY}deg) rotateY(${mappedX}deg) scale(1)`;
}
