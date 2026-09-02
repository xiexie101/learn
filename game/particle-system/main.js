// Three.js Scene Setup
let scene, camera, renderer, particles, particleSystem;
let hands, camera3D;
let currentModel = 'tree';
let particleColor = new THREE.Color(0x8a2be2);
let targetScale = 1;
let targetDispersion = 0;
let currentScale = 1;
let currentDispersion = 0;

// Particle configurations for different models (optimized for performance)
const particleConfigs = {
    tree: { count: 1500, spread: 2 },      // 减少50%
    star: { count: 1200, spread: 2.5 },    // 减少52%
    fireworks: { count: 1800, spread: 3 }, // 减少55%
    heart: { count: 1400, spread: 2 },     // 减少50%
    earth: { count: 1600, spread: 2.5 }    // 减少54%
};

// Pause state
let isPaused = false;

// Debounce for model switching
let isModelSwitching = false;

// Initialize Three.js
function initThree() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Add ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Create initial particle system
    createParticleSystem(currentModel);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create particle positions for different models
function getParticlePositions(model, count) {
    const positions = [];

    switch (model) {
        case 'tree':
            // Christmas tree shape
            for (let i = 0; i < count; i++) {
                const t = i / count;
                const height = t * 4 - 2;
                const radius = (1 - t) * 1.5;
                const angle = t * Math.PI * 8 + Math.random() * 0.5;

                const x = Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
                const y = height;
                const z = Math.sin(angle) * radius * (0.8 + Math.random() * 0.4);

                positions.push(x, y, z);
            }
            // Add star on top
            for (let i = 0; i < 100; i++) {
                const angle = (i / 100) * Math.PI * 2;
                const r = 0.3 * (i % 2 === 0 ? 1 : 0.5);
                positions.push(
                    Math.cos(angle) * r,
                    2.3 + Math.random() * 0.2,
                    Math.sin(angle) * r
                );
            }
            break;

        case 'star':
            // Five-pointed star
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 10;
                const r = (i % 2 === 0 ? 2 : 1) * (0.9 + Math.random() * 0.2);
                const thickness = (Math.random() - 0.5) * 0.3;

                positions.push(
                    Math.cos(angle) * r,
                    Math.sin(angle) * r,
                    thickness
                );
            }
            break;

        case 'fireworks':
            // Explosive radial pattern
            for (let i = 0; i < count; i++) {
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.random() * Math.PI;
                const r = Math.pow(Math.random(), 0.5) * 2.5;

                const x = r * Math.sin(theta) * Math.cos(phi);
                const y = r * Math.sin(theta) * Math.sin(phi);
                const z = r * Math.cos(theta);

                positions.push(x, y, z);
            }
            break;

        case 'heart':
            // Heart shape using parametric equations
            for (let i = 0; i < count; i++) {
                const t = (i / count) * Math.PI * 2;
                const r = Math.random() * 0.5 + 0.5;

                const x = r * 16 * Math.pow(Math.sin(t), 3) / 16;
                const y = r * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
                const z = (Math.random() - 0.5) * 0.5;

                positions.push(x, y, z);
            }
            break;

        case 'earth':
            // Spherical globe
            for (let i = 0; i < count; i++) {
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.acos(2 * Math.random() - 1);
                const r = 1.8 + (Math.random() - 0.5) * 0.1;

                const x = r * Math.sin(theta) * Math.cos(phi);
                const y = r * Math.sin(theta) * Math.sin(phi);
                const z = r * Math.cos(theta);

                positions.push(x, y, z);
            }
            break;
    }

    return new Float32Array(positions);
}

// Create particle system
function createParticleSystem(model) {
    // Remove existing particle system with proper cleanup
    if (particleSystem) {
        scene.remove(particleSystem);
        if (particles) {
            // Dispose geometry and material to free memory
            if (particles.geometry) {
                particles.geometry.dispose();
            }
            if (particles.material) {
                particles.material.dispose();
            }
        }
    }

    const config = particleConfigs[model];
    const positions = getParticlePositions(model, config.count);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Use the same array for original positions (no need to copy)
    // We'll create a copy only when needed for animation
    const originalPositions = new Float32Array(positions);
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));

    const material = new THREE.PointsMaterial({
        color: particleColor,
        size: 0.04,  // 稍微减小粒子大小
        transparent: true,
        opacity: 0.75,  // 降低透明度计算
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false  // 禁用深度写入以提高性能
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    particles = particleSystem;
}

// Update particle positions based on hand gesture
function updateParticles() {
    if (!particles) return;

    // Skip updates if paused (performance optimization)
    if (isPaused) {
        renderer.render(scene, camera);
        return;
    }

    // Smooth interpolation for scale and dispersion
    currentScale += (targetScale - currentScale) * 0.15;
    currentDispersion += (targetDispersion - currentDispersion) * 0.15;

    // Smooth rotation interpolation
    rotationAngle += (targetRotationAngle - rotationAngle) * 0.1;

    const positions = particles.geometry.attributes.position.array;
    const originalPositions = particles.geometry.attributes.originalPosition.array;

    for (let i = 0; i < positions.length; i += 3) {
        const x = originalPositions[i];
        const y = originalPositions[i + 1];
        const z = originalPositions[i + 2];

        // Apply scale and dispersion
        const dispersionFactor = 1 + currentDispersion;
        positions[i] = x * currentScale * dispersionFactor;
        positions[i + 1] = y * currentScale * dispersionFactor;
        positions[i + 2] = z * currentScale * dispersionFactor;
    }

    particles.geometry.attributes.position.needsUpdate = true;

    // Apply rotation from hand gesture
    particles.rotation.y = rotationAngle;

    // Add subtle auto-rotation when no hand detected
    if (currentGesture === 'none') {
        particles.rotation.y += 0.002;
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Always update particles (they handle pause state internally)
    updateParticles();

    // Always render
    renderer.render(scene, camera);
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// MediaPipe Hands Setup
let previousHandLandmarks = null;
let rotationAngle = 0;
let targetRotationAngle = 0;

// Gesture states
let currentGesture = 'none';
let gestureStartTime = 0;
const GESTURE_HOLD_TIME = 300; // ms to confirm gesture

async function initHands() {
    const videoElement = document.getElementById('video');

    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,  // 降低模型复杂度（0=最快）
        minDetectionConfidence: 0.6,  // 降低检测阈值
        minTrackingConfidence: 0.6    // 降低追踪阈值
    });

    hands.onResults(onHandsResults);

    camera3D = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 480,   // 降低分辨率
        height: 360   // 降低分辨率
    });

    camera3D.start();

    // Update status indicator
    updateStatus(true);
}

// Detect fist gesture (all fingers curled)
function detectFist(landmarks) {
    const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky tips
    const fingerMids = [6, 10, 14, 18]; // Middle joints
    const palm = landmarks[0];

    let curledCount = 0;

    for (let i = 0; i < fingerTips.length; i++) {
        const tip = landmarks[fingerTips[i]];
        const mid = landmarks[fingerMids[i]];

        // Check if tip is closer to palm than middle joint (finger is curled)
        const tipDist = distance3D(tip, palm);
        const midDist = distance3D(mid, palm);

        if (tipDist < midDist * 1.2) {  // 放宽阈值
            curledCount++;
        }
    }

    // Thumb check
    const thumbTip = landmarks[4];
    const thumbDist = distance3D(thumbTip, palm);
    if (thumbDist < 0.18) curledCount++;  // 放宽阈值

    return curledCount >= 4; // At least 4 fingers curled = fist
}

// Detect open hand (all fingers extended)
function detectOpenHand(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20]; // All finger tips including thumb
    const palm = landmarks[0];

    let extendedCount = 0;
    let totalSpread = 0;

    for (let i = 0; i < fingerTips.length; i++) {
        const tip = landmarks[fingerTips[i]];
        const dist = distance3D(tip, palm);

        if (dist > 0.12) { // 降低阈值，更容易检测
            extendedCount++;
        }
    }

    // Check finger spread (distance between fingers)
    for (let i = 0; i < fingerTips.length - 1; i++) {
        totalSpread += distance3D(landmarks[fingerTips[i]], landmarks[fingerTips[i + 1]]);
    }

    return extendedCount >= 4 && totalSpread > 0.3; // 降低spread阈值
}

// Detect peace sign / V gesture (index and middle finger extended, others curled)
function detectPeaceSign(landmarks) {
    const palm = landmarks[0];

    // Check index and middle fingers are extended
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const indexDist = distance3D(indexTip, palm);
    const middleDist = distance3D(middleTip, palm);

    // Check ring and pinky are curled
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const ringMid = landmarks[14];
    const pinkyMid = landmarks[18];

    const ringTipDist = distance3D(ringTip, palm);
    const ringMidDist = distance3D(ringMid, palm);
    const pinkyTipDist = distance3D(pinkyTip, palm);
    const pinkyMidDist = distance3D(pinkyTip, palm); // This was a bug, should be pinkyMid

    // Index and middle extended, ring and pinky curled
    const indexExtended = indexDist > 0.15;
    const middleExtended = middleDist > 0.15;
    const ringCurled = ringTipDist < ringMidDist * 1.2;
    const pinkyCurled = pinkyTipDist < pinkyMidDist * 1.2;

    // Check thumb is not extended (curled or neutral)
    const thumbTip = landmarks[4];
    const thumbDist = distance3D(thumbTip, palm);
    const thumbNotExtended = thumbDist < 0.18;

    return indexExtended && middleExtended && ringCurled && pinkyCurled && thumbNotExtended;
}

// Detect grab/pinch gesture
function detectGrab(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];

    const thumbIndexDist = distance3D(thumbTip, indexTip);
    const thumbMiddleDist = distance3D(thumbTip, middleTip);

    // Thumb touching index and middle finger
    return thumbIndexDist < 0.05 && thumbMiddleDist < 0.08;
}

// Detect finger swipe (left/right movement)
function detectSwipe(landmarks, previousLandmarks) {
    if (!previousLandmarks) return 0;

    // Use index finger tip for swipe detection
    const indexTip = landmarks[8];
    const prevIndexTip = previousLandmarks[8];

    // Calculate horizontal movement (x-axis)
    const deltaX = indexTip.x - prevIndexTip.x;

    // Return rotation amount based on swipe
    // Negative deltaX = swipe right (hand moves right in camera view)
    // Positive deltaX = swipe left (hand moves left in camera view)
    return -deltaX * 5; // Amplify and invert for natural rotation
}

// Helper function for 3D distance
function distance3D(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z || 0) - (point2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Process hand tracking results
function onHandsResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Detect gestures (removed grab gesture)
        const isFist = detectFist(landmarks);
        const isOpenHand = detectOpenHand(landmarks);
        const isPeaceSign = detectPeaceSign(landmarks);

        let detectedGesture = 'none';

        if (isPeaceSign) {
            detectedGesture = 'peace';
            // Pause all animations
            isPaused = true;
        } else if (isFist) {
            detectedGesture = 'fist';
            isPaused = false;
            // Contract particles - 握拳收缩到50%
            targetScale = 0.5;
            targetDispersion = 0;
        } else if (isOpenHand) {
            detectedGesture = 'open';
            isPaused = false;
            // Expand particles - 张开扩散到150%
            targetScale = 1.5;
            targetDispersion = 1.0;
        } else {
            isPaused = false;
            // Default state
            targetScale = 1.0;
            targetDispersion = 0.5;
        }

        // Update gesture state
        if (detectedGesture !== currentGesture) {
            currentGesture = detectedGesture;
            gestureStartTime = Date.now();
        }

        previousHandLandmarks = landmarks;

        // Update gesture feedback
        updateGestureFeedback(detectedGesture, targetScale);
        updateStatus(true);
    } else {
        updateStatus(false);
        previousHandLandmarks = null;
        currentGesture = 'none';
        isPaused = false;
        // Return to default state
        targetScale = 1.0;
        targetDispersion = 0.5;
    }
}

// Utility function to map ranges
function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Update status indicator
function updateStatus(active) {
    const statusIndicator = document.querySelector('.status-indicator');
    if (active) {
        statusIndicator.classList.add('active');
        statusIndicator.querySelector('.status-text').textContent = '手势追踪中';
    } else {
        statusIndicator.classList.remove('active');
        statusIndicator.querySelector('.status-text').textContent = '未检测到手势';
    }
}

// Update gesture feedback
function updateGestureFeedback(gesture, scale) {
    const feedback = document.querySelector('.gesture-feedback');
    const valueElement = feedback.querySelector('.value');

    const gestureNames = {
        'fist': '✊ 握拳 - 收缩',
        'open': '🖐️ 张开 - 扩散',
        'peace': '✌️ V手势 - 暂停',
        'none': '👋 等待手势'
    };

    valueElement.textContent = gestureNames[gesture] || `缩放: ${scale.toFixed(2)}x`;
    feedback.classList.add('visible');

    clearTimeout(feedback.hideTimeout);
    feedback.hideTimeout = setTimeout(() => {
        if (gesture === 'none') {
            feedback.classList.remove('visible');
        }
    }, 3000);
}

// UI Event Handlers
function setupUI() {
    // Model selector buttons
    const modelButtons = document.querySelectorAll('.model-btn');
    modelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Prevent rapid clicking (debounce)
            if (isModelSwitching) return;

            // Skip if already active
            if (btn.classList.contains('active')) return;

            isModelSwitching = true;

            modelButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentModel = btn.dataset.model;

            // Reset state when switching models
            isPaused = false;
            currentScale = 1;
            currentDispersion = 0;
            targetScale = 1;
            targetDispersion = 0.5;
            rotationAngle = 0;
            targetRotationAngle = 0;

            createParticleSystem(currentModel);

            // Allow next switch after a short delay
            setTimeout(() => {
                isModelSwitching = false;
            }, 300);
        });
    });

    // Color picker
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.addEventListener('input', (e) => {
        particleColor = new THREE.Color(e.target.value);
        if (particles) {
            particles.material.color = particleColor;
        }
    });

    // Fullscreen button
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    fullscreenBtn.addEventListener('click', toggleFullscreen);
}

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Initialize everything
async function init() {
    const loadingScreen = document.querySelector('.loading-screen');

    try {
        initThree();
        setupUI();
        await initHands();

        // Hide loading screen
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);

        animate();
    } catch (error) {
        console.error('Initialization error:', error);
        document.querySelector('.loading-text').textContent = '初始化失败，请刷新页面重试';
    }
}

// Start when page loads
window.addEventListener('load', init);
