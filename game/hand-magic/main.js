/**
 * Hand Magic - 凝聚光球 (3D 增强版)
 * 优化：体积感、内部动态流动、更真实的景深
 */

// ============================================================
// 配置
// ============================================================
const CONFIG = {
    PARTICLE_COUNT: 1000,      // 保持适中数量以维持间隙感
    LERP_SPEED: 0.05,          // 更加平滑的跟随

    // 光球设置
    ORB_OFFSET_Y: 0.5,
    SCATTER_RADIUS: 4.0,

    // 动态
    ROTATION_SPEED: 0.2,       // 整体旋转速度
    TURBULENCE: 0.05           // 内部扰动强度
};

// ============================================================
// 全局变量
// ============================================================
let scene, camera, renderer;
let particles, geometry;
let currentPositions = [];
let targetPositions = [];
let particleData = [];

let handPosition = { x: 0, y: 0, z: 0 };
let isPalmUp = false;
let handDetected = false;
let palmSize = 0.8;

// ============================================================
// 初始化
// ============================================================
async function init() {
    initThreeJS();
    initParticles();
    await initMediaPipe();

    document.getElementById('loading').classList.add('hidden');
    animate();
}

function initThreeJS() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('canvas'),
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function initParticles() {
    geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(CONFIG.PARTICLE_COUNT * 3);
    const sizes = new Float32Array(CONFIG.PARTICLE_COUNT);
    const alphas = new Float32Array(CONFIG.PARTICLE_COUNT);

    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        // 3D 体积分布 (不仅仅是表面)
        // 使用球体随机点算法: r * cbrt(random)
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const rInitial = Math.cbrt(Math.random()); // 均匀体积分布

        // 我们希望核心稍微密集一点，边缘稀疏一点，制造"能量球"的感觉
        // 所以我们混合一点高斯分布的感觉
        const distributionMix = Math.random() * 0.5 + 0.5; // 偏向外层的分布混合
        const rFinal = rInitial * distributionMix;

        // 保存每个粒子的球体坐标参数
        particleData.push({
            theta: theta,
            phi: phi,
            rRatio: rFinal,           // 相对半径 (0-1)
            orbitSpeed: (Math.random() - 0.5) * 2.0, // 轨道速度
            orbitAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), // 随机旋转轴
            sizeBase: 2 + Math.random() * 8,    // 大小差异
            pulseSpeed: 1 + Math.random() * 3,  // 呼吸速度
            pulseOffset: Math.random() * Math.PI * 2
        });

        // 初始位置：随机散布
        const angle = Math.random() * Math.PI * 2;
        const dist = 1 + Math.random() * CONFIG.SCATTER_RADIUS;

        positions[i3] = Math.cos(angle) * dist;
        positions[i3 + 1] = (Math.random() - 0.5) * CONFIG.SCATTER_RADIUS;
        positions[i3 + 2] = Math.sin(angle) * dist * 0.3;

        // 大小和透明度
        sizes[i] = particleData[i].sizeBase;
        alphas[i] = 0.5 + Math.random() * 0.5;

        // 保存状态
        currentPositions.push({ x: positions[i3], y: positions[i3 + 1], z: positions[i3 + 2] });
        targetPositions.push({ x: positions[i3], y: positions[i3 + 1], z: positions[i3 + 2] });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    // 增强型着色器
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uCondensed: { value: 0 }
        },
        vertexShader: `
            attribute float size;
            attribute float alpha;
            varying float vAlpha;
            varying float vDist; // 用于片元着色器的深度感
            uniform float uTime;
            uniform float uCondensed;
            
            void main() {
                // 呼吸效果
                float pulse = sin(uTime * 3.0 + position.x + position.y) * 0.2 + 1.0;
                
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vDist = -mvPosition.z; // 距离相机的距离
                
                // 距离衰减：离得近的大，远的非常小 (增强 3D 感)
                float sizeAttenuation = 300.0 / vDist; 
                gl_PointSize = size * pulse * sizeAttenuation;
                
                // 透明度随距离微调，远的稍微淡一点
                vAlpha = alpha * smoothstep(10.0, 2.0, vDist);
                
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            varying float vDist;
            uniform float uCondensed;
            
            void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                if (dist > 0.5) discard;
                
                // 极其柔和的辉光
                // 核心
                float core = exp(-dist * dist * 16.0);
                // 光晕
                float glow = exp(-dist * dist * 4.0) * 0.5;
                
                float intensity = core + glow;
                
                // 颜色处理：稍微带一点点冷暖变化增加体积感
                // 这里保持纯白主调，但可以通过 brightness 模拟
                vec3 color = vec3(1.0, 1.0, 1.0);
                
                // 越中心越亮
                color += vec3(0.2, 0.3, 0.5) * glow * uCondensed; // 凝聚时加一点点蓝晕增加魔法感
                
                float finalAlpha = intensity * vAlpha * (0.8 + 0.2 * uCondensed);
                
                gl_FragColor = vec4(color, finalAlpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false // 不需要深度测试，因为是发光粒子
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// ============================================================
// MediaPipe 手势识别
// ============================================================
async function initMediaPipe() {
    const video = document.getElementById('video');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 }
        });
        video.srcObject = stream;
        await video.play();
    } catch (err) {
        console.error('摄像头错误:', err);
        return;
    }

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onHandResults);

    const cam = new Camera(video, {
        onFrame: async () => await hands.send({ image: video }),
        width: 1280,
        height: 720
    });
    cam.start();
}

function onHandResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        handDetected = true;

        const palm = landmarks[9]; // 中指根部

        // 坐标映射
        handPosition.x = (1 - palm.x) * 2 - 1;
        handPosition.y = -(palm.y * 2 - 1);
        handPosition.z = -palm.z;

        // 计算手掌大小，用于光球缩放
        const wrist = landmarks[0];
        const indexMCP = landmarks[5];
        const pinkyMCP = landmarks[17];
        // 使用手掌宽度
        const palmWidth = Math.sqrt(
            Math.pow(indexMCP.x - pinkyMCP.x, 2) +
            Math.pow(indexMCP.y - pinkyMCP.y, 2)
        ) * 6.0; // 放大系数

        palmSize = Math.max(0.6, Math.min(2.0, palmWidth));

        isPalmUp = detectPalmUp(landmarks);
        updateTargets();
    } else {
        handDetected = false;
        isPalmUp = false;
        updateTargets();
    }
}

function detectPalmUp(landmarks) {
    const wrist = landmarks[0];
    const middleMCP = landmarks[9];

    // 简单判定：手腕在手指下方（屏幕坐标系 y 向下是正，所以 wrist.y > middle.y 意味着手腕在视觉下方）
    // 注意：MediaPipe y坐标是归一化的，顶部为0，底部为1。所以 wrist.y > middleMCP.y 表示手腕在下面。
    const isUpright = wrist.y > middleMCP.y;

    // 简单的张开判定
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    let openFingers = 0;
    tips.forEach((tip, i) => {
        if (landmarks[tip].y < landmarks[pips[i]].y) openFingers++;
    });

    return isUpright && openFingers >= 3;
}

function updateTargets() {
    // 光球中心
    const orbCenter = {
        x: handPosition.x * 2.5, // 稍微扩大X范围
        y: handPosition.y * 2.5 + CONFIG.ORB_OFFSET_Y,
        z: handPosition.z
    };

    // 光球半径，基于手掌大小
    const orbRadius = palmSize * 0.7; // 调整系数

    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
        const data = particleData[i];

        if (handDetected && isPalmUp) {
            // == 凝聚状态 ==

            // 基础球体位置
            const r = orbRadius * data.rRatio;

            // 增加动态旋转效果：每个粒子不仅在自己的位置，还绕着轴心转动
            // 利用 time 偏移 theta
            const rotationOffset = time * data.orbitSpeed * CONFIG.ROTATION_SPEED;

            // 将球面坐标转换为笛卡尔坐标，加上旋转
            // 这里做一个简单的绕 Y 轴旋转模拟 "能量流动"
            const effectiveTheta = data.theta + rotationOffset;

            const x = r * Math.sin(data.phi) * Math.cos(effectiveTheta);
            const y = r * Math.sin(data.phi) * Math.sin(effectiveTheta);
            const z = r * Math.cos(data.phi);

            // 加上 3D 旋转扰动 (让粒子不只是在一个完美的球面上转)
            const noiseX = Math.sin(time * 2 + i) * CONFIG.TURBULENCE * orbRadius;
            const noiseY = Math.cos(time * 1.5 + i) * CONFIG.TURBULENCE * orbRadius;
            const noiseZ = Math.sin(time * 2.5 + i) * CONFIG.TURBULENCE * orbRadius;

            targetPositions[i].x = orbCenter.x + x + noiseX;
            targetPositions[i].y = orbCenter.y + y + noiseY; // 扁球体
            targetPositions[i].z = orbCenter.z + z + noiseZ;

        } else {
            // == 散开状态 ==
            // 缓慢漂浮，像灰尘一样
            if (Math.random() < 0.005) {
                // 偶尔重置目标位置
                const angle = Math.random() * Math.PI * 2;
                const dist = 2.0 + Math.random() * CONFIG.SCATTER_RADIUS;

                targetPositions[i].x = Math.cos(angle) * dist;
                targetPositions[i].y = (Math.random() - 0.5) * 3.0; // 垂直散布更广
                targetPositions[i].z = Math.sin(angle) * dist * 0.5;
            }
            // 稍微加一点持续的流动
            targetPositions[i].y += Math.sin(time + i) * 0.002;
        }
    }
}

// ============================================================
// 渲染循环
// ============================================================
let time = 0;

function animate() {
    requestAnimationFrame(animate);
    time += 0.016;

    // 更新 Uniforms
    particles.material.uniforms.uTime.value = time;

    const targetCondensed = (handDetected && isPalmUp) ? 1.0 : 0.0;
    // 缓慢过渡 condensed 值
    particles.material.uniforms.uCondensed.value += (targetCondensed - particles.material.uniforms.uCondensed.value) * 0.05;

    // 强制每帧更新 Target (因为 updateTargets 里有基于 time 的旋转)
    updateTargets();

    const positions = geometry.attributes.position.array;

    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const curr = currentPositions[i];
        const target = targetPositions[i];

        // 物理缓动
        // 凝聚时快一点，散开时慢一点(飘渺感)
        const speed = (handDetected && isPalmUp) ? 0.08 : 0.02;

        curr.x += (target.x - curr.x) * speed;
        curr.y += (target.y - curr.y) * speed;
        curr.z += (target.z - curr.z) * speed;

        positions[i3] = curr.x;
        positions[i3 + 1] = curr.y;
        positions[i3 + 2] = curr.z;
    }

    geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

// ============================================================
// 启动
// ============================================================
window.addEventListener('load', init);
