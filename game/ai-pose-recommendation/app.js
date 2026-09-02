const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const poseHint = document.getElementById('pose-hint');
const galleryContainer = document.getElementById('pose-gallery');
const startBtn = document.getElementById('start-btn');
const splashScreen = document.getElementById('splash-screen');
const shutterBtn = document.getElementById('shutter-btn');

// --- 预定义姿势数据 ---
const POSES = [
    {
        id: 'standing-casual',
        name: '随性站姿',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=300&fit=crop',
        landmarks: [
            { x: 0.5, y: 0.15 }, // nose
            { x: 0.5, y: 0.3 },  // neck (approx)
            { x: 0.4, y: 0.35 }, // left shoulder
            { x: 0.6, y: 0.35 }, // right shoulder
            { x: 0.35, y: 0.55 }, // left elbow
            { x: 0.65, y: 0.55 }, // right elbow
            { x: 0.38, y: 0.7 }, // left wrist
            { x: 0.62, y: 0.7 }, // right wrist
            { x: 0.45, y: 0.6 }, // left hip
            { x: 0.55, y: 0.6 }, // right hip
            { x: 0.45, y: 0.8 }, // left knee
            { x: 0.55, y: 0.8 }, // right knee
            { x: 0.45, y: 0.95 }, // left ankle
            { x: 0.55, y: 0.95 }  // right ankle
        ]
    },
    {
        id: 'side-profile',
        name: '侧颜杀',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=300&fit=crop',
        landmarks: [
            { x: 0.4, y: 0.15 }, // nose
            { x: 0.4, y: 0.3 },  // neck
            { x: 0.45, y: 0.35 }, // shoulder
            { x: 0.45, y: 0.6 }, // hip
            { x: 0.45, y: 0.8 }, // knee
            { x: 0.45, y: 0.95 }  // ankle
        ]
    },
    {
        id: 'hands-in-pockets',
        name: '插兜酷飒',
        image: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=200&h=300&fit=crop',
        landmarks: [
            { x: 0.5, y: 0.15 },
            { x: 0.4, y: 0.35 }, { x: 0.6, y: 0.35 },
            { x: 0.3, y: 0.5 }, { x: 0.7, y: 0.5 }, // elbows out
            { x: 0.45, y: 0.65 }, { x: 0.55, y: 0.65 }, // hands at hips
            { x: 0.45, y: 0.95 }, { x: 0.55, y: 0.95 }
        ]
    }
];

let activePoseIndex = 0;
let currentPose = null;
let isAligned = false;
let poseDetector = null;
let currentStream = null;
let facingMode = 'user'; // 'user' (前置) 或 'environment' (后置)
let animationFrameId = null;
let dashOffset = 0; // 用于驱动流动的虚线

// --- 初始化 MediaPipe Pose ---
function initPose() {
    poseDetector = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseDetector.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    poseDetector.onResults(onResults);
}

// --- 处理检测结果 ---
function onResults(results) {
    currentPose = results.poseLandmarks;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (!currentPose) {
        poseHint.textContent = "请移动至画面中";
        poseHint.style.opacity = "1";
        isAligned = false;
    } else {
        poseHint.style.opacity = "0";
        checkAlignment(currentPose);
    }

    drawTargetPose();
    canvasCtx.restore();
}

// --- 辅助：获取渲染坐标 ---
function getRenderPos(p) {
    if (!p) return null;
    const x = facingMode === 'user' ? (1 - p.x) : p.x;
    return {
        x: x * canvasElement.width,
        y: p.y * canvasElement.height
    };
}

// --- 绘制目标姿势辅助线 (高级视觉版) ---
function drawTargetPose() {
    const target = POSES[activePoseIndex].landmarks;
    const isCompletePose = target.length > 7;
    
    const baseColor = isAligned ? '#4CD964' : 'rgba(255, 255, 255, 0.6)';
    const glowColor = isAligned ? '#4CD964' : 'rgba(255, 255, 255, 0.8)';
    
    dashOffset -= 0.5; // 虚线流动速度

    // 1. 绘制躯干半透明填充 (仅限完整姿势)
    if (isCompletePose) {
        const p1 = getRenderPos(target[2]); // L shoulder
        const p2 = getRenderPos(target[3]); // R shoulder
        const p3 = getRenderPos(target[9]); // R hip
        const p4 = getRenderPos(target[8]); // L hip
        
        if (p1 && p2 && p3 && p4) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(p1.x, p1.y);
            canvasCtx.lineTo(p2.x, p2.y);
            canvasCtx.lineTo(p3.x, p3.y);
            canvasCtx.lineTo(p4.x, p4.y);
            canvasCtx.closePath();
            
            // 躯干填充色：对齐时微微透绿，未对齐时玻璃白
            canvasCtx.fillStyle = isAligned ? 'rgba(76, 217, 100, 0.15)' : 'rgba(255, 255, 255, 0.1)';
            canvasCtx.fill();
        }
    }

    // 2. 设置连线样式
    canvasCtx.strokeStyle = baseColor;
    canvasCtx.lineWidth = isAligned ? 6 : 3;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';
    canvasCtx.shadowBlur = isAligned ? 15 : 5;
    canvasCtx.shadowColor = glowColor;
    
    if (!isAligned) {
        canvasCtx.setLineDash([12, 12]);
        canvasCtx.lineDashOffset = dashOffset;
    } else {
        canvasCtx.setLineDash([]);
        canvasCtx.lineDashOffset = 0;
    }

    // 3. 绘制连线
    if (isCompletePose) {
        // 躯干边界
        drawLineFast(target[2], target[3]); 
        drawLineFast(target[2], target[8]); 
        drawLineFast(target[3], target[9]); 
        drawLineFast(target[8], target[9]); 
        // 胳膊
        drawLineFast(target[2], target[4]);
        drawLineFast(target[4], target[6]);
        drawLineFast(target[3], target[5]);
        drawLineFast(target[5], target[7]);
        // 腿
        drawLineFast(target[8], target[10]);
        drawLineFast(target[10], target[12]);
        drawLineFast(target[9], target[11]);
        drawLineFast(target[11], target[13]);
    } else {
        for(let i=0; i<target.length-1; i++) {
            drawLineFast(target[i], target[i+1]);
        }
    }

    // 恢复实线，准备绘制节点
    canvasCtx.setLineDash([]);
    canvasCtx.lineDashOffset = 0;

    // 4. 绘制发光关节节点
    const nodeRadius = isAligned ? 6 : 4;
    canvasCtx.fillStyle = '#ffffff';
    target.forEach((p, index) => {
        // 忽略鼻子(0)和大致脖子(1)的节点显示，使画面更干净
        if (index > 1) {
            const pos = getRenderPos(p);
            if (pos) {
                canvasCtx.beginPath();
                canvasCtx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
                canvasCtx.shadowBlur = isAligned ? 20 : 10;
                canvasCtx.shadowColor = glowColor;
                canvasCtx.fill();
                
                // 对齐时的额外光环点缀
                if (isAligned) {
                    canvasCtx.beginPath();
                    canvasCtx.arc(pos.x, pos.y, nodeRadius + 3, 0, 2 * Math.PI);
                    canvasCtx.strokeStyle = 'rgba(76, 217, 100, 0.5)';
                    canvasCtx.lineWidth = 2;
                    canvasCtx.stroke();
                }
            }
        }
    });
}

// 使用已计算好的渲染坐标画线
function drawLineFast(p1, p2) {
    const rp1 = getRenderPos(p1);
    const rp2 = getRenderPos(p2);
    if (!rp1 || !rp2) return;
    canvasCtx.beginPath();
    canvasCtx.moveTo(rp1.x, rp1.y);
    canvasCtx.lineTo(rp2.x, rp2.y);
    canvasCtx.stroke();
}

// --- 检查对齐度 ---
function checkAlignment(detected) {
    const target = POSES[activePoseIndex].landmarks;
    const threshold = 0.12;

    if (detected[11] && detected[12]) {
        const currentCenter = {
            x: (detected[11].x + detected[12].x) / 2,
            y: (detected[11].y + detected[12].y) / 2
        };
        
        let tLSh, tRSh;
        if (target.length > 7) {
            tLSh = target[2]; tRSh = target[3];
        } else {
            tLSh = target[1]; tRSh = target[2];
        }

        // 处理镜像匹配逻辑
        const tCenterX = facingMode === 'user' ? (1 - (tLSh.x + tRSh.x) / 2) : (tLSh.x + tRSh.x) / 2;
        
        const targetCenter = {
            x: tCenterX,
            y: (tLSh.y + tRSh.y) / 2
        };

        const dist = Math.sqrt(
            Math.pow(currentCenter.x - targetCenter.x, 2) +
            Math.pow(currentCenter.y - targetCenter.y, 2)
        );

        isAligned = dist < threshold;
    } else {
        isAligned = false;
    }
}

// --- 初始化画廊 ---
function initGallery() {
    galleryContainer.innerHTML = '';
    POSES.forEach((pose, index) => {
        const card = document.createElement('div');
        card.className = `pose-card ${index === activePoseIndex ? 'active' : ''}`;
        card.innerHTML = `<img src="${pose.image}" alt="${pose.name}">`;
        card.onclick = () => selectPose(index);
        galleryContainer.appendChild(card);
    });
}

function selectPose(index) {
    activePoseIndex = index;
    const cards = document.querySelectorAll('.pose-card');
    cards.forEach((c, i) => {
        c.classList.toggle('active', i === index);
    });
    if (window.navigator.vibrate) window.navigator.vibrate(10);
}

// --- 播放快门音效 ---
function playShutterSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

// --- 拍照逻辑 ---
function takePhoto() {
    const flash = document.createElement('div');
    flash.className = 'flash-effect';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    playShutterSound();
    if (window.navigator.vibrate) window.navigator.vibrate([50, 30, 50]);

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = videoElement.videoWidth;
    captureCanvas.height = videoElement.videoHeight;
    const ctx = captureCanvas.getContext('2d');

    if (facingMode === 'user') {
        ctx.translate(captureCanvas.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(videoElement, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `AI_POSE_${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();
}

// --- 原生相机控制逻辑 ---
async function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        videoElement.srcObject = currentStream;
        videoElement.style.transform = facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
        
        // 等待视频加载完成后开始检测循环
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            if (!animationFrameId) {
                detectLoop();
            }
            resizeCanvas();
        };
    } catch (err) {
        console.error("Camera access failed:", err);
        alert("无法访问摄像头，请检查权限。");
    }
}

async function detectLoop() {
    if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
        await poseDetector.send({image: videoElement});
    }
    animationFrameId = requestAnimationFrame(detectLoop);
}

function toggleCamera() {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera();
    
    // 切换相机时增加视觉反馈
    videoElement.style.opacity = 0;
    setTimeout(() => {
        videoElement.style.opacity = 1;
    }, 300);
}

function resizeCanvas() {
    canvasElement.width = videoElement.clientWidth;
    canvasElement.height = videoElement.clientHeight;
}

// --- 启动流程 ---
async function startApp() {
    splashScreen.style.display = 'none';
    initPose();
    initGallery();
    startCamera();
    
    window.addEventListener('resize', resizeCanvas);
}

const switchCameraBtn = document.getElementById('switch-camera');
switchCameraBtn.onclick = toggleCamera;
startBtn.onclick = startApp;
shutterBtn.onclick = takePhoto;
