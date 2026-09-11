/**
 * Noggin Knock (敲打！机器黄鼹鼠) - Game Engine
 * Super Mario Party Jamboree Authentic Recreation
 */

(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Virtual Resolution (16:9 widescreen stage)
    const V_WIDTH = 960;
    const V_HEIGHT = 540;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    // Preload authentic reference background
    const bgImage = new Image();
    bgImage.src = 'assets/stage_bg_real.jpg';
    let bgImageLoaded = false;
    bgImage.onload = () => { bgImageLoaded = true; };

    // Game States
    const STATE_PRACTICE = 'PRACTICE';
    const STATE_COUNTDOWN = 'COUNTDOWN';
    const STATE_PLAYING = 'PLAYING';
    const STATE_GAMEOVER = 'GAMEOVER';

    let gameState = STATE_PRACTICE;

    // Timing & Scoring
    let gameTimer = 30.0;
    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let countdownVal = 3;
    let countdownTimer = 0;
    let highScore = parseInt(localStorage.getItem('noggin_knock_highscore') || '0', 10);

    // Venting Mode (发泄模式 · 自定义命名鼹鼠)
    const DEFAULT_VENT_TARGETS = ['周一', '甲方', 'BUG'];
    let ventTargets = [];
    let remainingVentTargets = [];
    let smashedVentTargets = [];
    let hitstopTimer = 0;
    let bigSmashedBanners = [];

    function loadVentTargets() {
        try {
            const raw = localStorage.getItem('noggin_knock_vent_targets');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    ventTargets = parsed.map(s => String(s).trim()).filter(Boolean).slice(0, 5);
                    updateVentBadge();
                    return;
                }
            }
        } catch (e) {}
        ventTargets = [...DEFAULT_VENT_TARGETS];
        updateVentBadge();
    }

    function saveVentTargets(targets) {
        ventTargets = targets.map(s => String(s).trim()).filter(Boolean).slice(0, 5);
        try {
            localStorage.setItem('noggin_knock_vent_targets', JSON.stringify(ventTargets));
        } catch (e) {}
        updateVentBadge();
    }

    function updateVentBadge() {
        const badgeEl = document.getElementById('ventTargetCount');
        if (badgeEl) badgeEl.textContent = ventTargets.length;
    }

    // Game Mode: 5-Hole Simplified (Lower 5 Holes, Horizontal Only) vs 8-Hole Standard (Full Stage)
    const MODE_5HOLES = '5HOLES';
    const MODE_8HOLES = '8HOLES';
    let currentMode = localStorage.getItem('noggin_knock_mode') || MODE_5HOLES;

    function setGameMode(mode) {
        currentMode = mode;
        try {
            localStorage.setItem('noggin_knock_mode', mode);
        } catch (e) {}

        if (currentMode === MODE_5HOLES) {
            HOLES.forEach(h => {
                if (h.tier === 'upper') {
                    h.state = 'EMPTY';
                    h.occupant = null;
                    h.progress = 0;
                }
            });
            mario.y = 370;
            mario.facingY = 1;
        }

        updateModeUI();
        updateHUD();
    }

    function toggleGameMode() {
        setGameMode(currentMode === MODE_5HOLES ? MODE_8HOLES : MODE_5HOLES);
        addFloatingText(currentMode === MODE_5HOLES ? '🕹️ 单排5洞模式 (纯横移)' : '🎮 全域8洞模式 (全舞台)', mario.x, mario.y - 50, '#2ecc71', 26);
    }

    function updateModeUI() {
        const btnMode = document.getElementById('btnGameMode');
        const badge = document.getElementById('modeBadge');
        if (btnMode) {
            btnMode.innerHTML = (currentMode === MODE_5HOLES)
                ? '🕹️ 单排5洞'
                : '🎮 全域8洞';
            btnMode.title = (currentMode === MODE_5HOLES)
                ? '当前：单排5洞极简 (仅左右横移)，点击切换全域8洞'
                : '当前：全域8洞标准 (自由纵深)，点击切换单排5洞';
        }
        if (badge) {
            badge.textContent = (currentMode === MODE_5HOLES) ? '单排5洞' : '全域8洞';
            if (currentMode === MODE_5HOLES) {
                badge.classList.remove('mode-8holes');
            } else {
                badge.classList.add('mode-8holes');
            }
        }
    }

    // Camera & Screen Shake
    let shakeDuration = 0;
    let shakeIntensity = 0;

    // Stage Holes Definition (8 Holes perfectly calibrated to Switch video layout)
    const HOLES = [
        // Front Lower Row (5 holes)
        { id: 0, x: 235, y: 422, radiusX: 38, radiusY: 20, state: 'EMPTY', occupant: null, timer: 0, progress: 0, tier: 'lower' },
        { id: 1, x: 358, y: 422, radiusX: 38, radiusY: 20, state: 'EMPTY', occupant: null, timer: 0, progress: 0, tier: 'lower' },
        { id: 2, x: 480, y: 422, radiusX: 38, radiusY: 20, state: 'EMPTY', occupant: null, timer: 0, progress: 0, tier: 'lower' },
        { id: 3, x: 602, y: 422, radiusX: 38, radiusY: 20, state: 'EMPTY', occupant: null, timer: 0, progress: 0, tier: 'lower' },
        { id: 4, x: 725, y: 422, radiusX: 38, radiusY: 20, state: 'EMPTY', occupant: null, timer: 0, progress: 0, tier: 'lower' },

        // Back Raised Row (3 holes: Left, Center MEGA, Right)
        { id: 5, x: 338, y: 280, radiusX: 36, radiusY: 19, state: 'EMPTY', occupant: null, timer: 0, progress: 0, tier: 'upper' },
        { id: 6, x: 480, y: 246, radiusX: 62, radiusY: 32, state: 'EMPTY', occupant: null, timer: 0, progress: 0, tier: 'upper', isMega: true },
        { id: 7, x: 622, y: 280, radiusX: 36, radiusY: 19, state: 'EMPTY', occupant: null, timer: 0, progress: 0, tier: 'upper' }
    ];

    // Spawn Scheduler
    let spawnTimer = 0.45;

    // Tap Target Reticle FX
    let tapReticles = [];

    // Mario Player Object
    const mario = {
        x: 480,
        y: 355,
        vx: 0,
        vy: 0,
        speed: 350,
        facing: 1, // 1: right, -1: left
        facingX: 1, // 1: right, -1: left, 0: center
        facingY: 1, // 1: forward (towards front holes), -1: backward (towards upper holes)
        isMoving: false,
        isSwinging: false,
        swingTimer: 0,
        swingDuration: 0.22,
        isStunned: false,
        stunTimer: 0,
        walkFrame: 0,
        walkAnimTimer: 0,
        targetX: null,
        targetY: null,
        targetHoleId: null
    };

    // Particles & Floating FX
    let particles = [];
    let floatingTexts = [];

    // Ambient Lighting & Stage Props
    let stageLightAngle = 0;
    let moleStatueBeat = 0;
    let archBulbs = [];
    for (let i = 0; i < 20; i++) {
        archBulbs.push({
            angle: Math.PI + (i / 19) * Math.PI,
            color: (i % 2 === 0) ? '#ffd700' : '#ff4444'
        });
    }

    // Input States
    const keys = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false
    };

    // Virtual Joystick
    const joystick = {
        active: false,
        touchId: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        dx: 0,
        dy: 0,
        radius: 45
    };

    // Virtual Viewport Management
    let viewWidth = V_WIDTH;   // 960
    let viewHeight = V_HEIGHT; // 540
    let viewX = 0;
    let viewY = 0;
    let isMobilePortrait = false;

    // Resize and DPI Management
    function resizeCanvas() {
        const container = document.getElementById('canvasContainer');
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const rect = container.getBoundingClientRect();

        // Check if device/container is in mobile portrait mode
        isMobilePortrait = (rect.height > rect.width * 1.06 && rect.width < 768);

        let w = rect.width;
        let h = rect.height;

        if (isMobilePortrait) {
            // 手机竖屏自适应：100% 充满容器高宽，彻底消灭上下黑边！
            w = rect.width;
            h = rect.height;

            // 聚焦核心擂台（宽 680，中心 480），将视口宽度收敛到 680
            // 相比 960 宽，整体放大 960 / 680 ≈ 1.41 倍！
            viewWidth = 680;
            viewHeight = viewWidth * (h / w);
            viewX = 480 - (viewWidth / 2); // 140

            // 纵向对齐：让下排洞（y=422）和警戒线（y=480）居于屏幕约 64% 视线黄金区
            viewY = 480 - (viewHeight * 0.64);

            scale = (w / viewWidth) * dpr;
        } else {
            // 桌面端 / 宽屏标准 16:9
            viewWidth = V_WIDTH;
            viewHeight = V_HEIGHT;
            viewX = 0;
            viewY = 0;

            const aspect = V_WIDTH / V_HEIGHT;
            if (w / h > aspect) {
                w = h * aspect;
            } else {
                h = w / aspect;
            }
            scale = (w / V_WIDTH) * dpr;
        }

        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        offsetX = 0;
        offsetY = 0;
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 150));

    // Screen Shake Trigger
    function triggerShake(intensity = 6, duration = 0.25) {
        shakeIntensity = intensity;
        shakeDuration = duration;
        if (navigator.vibrate) {
            navigator.vibrate(Math.min(Math.floor(duration * 1000), 200));
        }
    }

    // Spawn Particles
    function createCoinParticles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
            const spd = 160 + Math.random() * 200;
            particles.push({
                type: 'coin',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                gravity: 600,
                scale: 1,
                rot: Math.random() * Math.PI,
                vrot: 10 + Math.random() * 10,
                life: 0.65,
                maxLife: 0.65
            });
        }
    }

    function createDustParticles(x, y, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 40 + Math.random() * 80;
            particles.push({
                type: 'dust',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd * 0.4 - 20,
                gravity: 40,
                size: 6 + Math.random() * 8,
                life: 0.35,
                maxLife: 0.35
            });
        }
    }

    function createExplosionParticles(x, y) {
        // Fire & Smoke
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 80 + Math.random() * 260;
            const isSmoke = Math.random() > 0.4;
            particles.push({
                type: isSmoke ? 'smoke' : 'fire',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd * 0.7 - 60,
                gravity: isSmoke ? -30 : 150,
                size: isSmoke ? (18 + Math.random() * 22) : (14 + Math.random() * 18),
                life: isSmoke ? 0.85 : 0.45,
                maxLife: isSmoke ? 0.85 : 0.45
            });
        }
        // Sparkles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 180 + Math.random() * 280;
            particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                gravity: 400,
                size: 4 + Math.random() * 5,
                life: 0.45,
                maxLife: 0.45
            });
        }
    }

    function addFloatingText(text, x, y, color = '#ffd700', size = 28) {
        floatingTexts.push({
            text: text,
            x: x,
            y: y,
            vy: -85,
            color: color,
            size: size,
            life: 0.85,
            maxLife: 0.85
        });
    }

    function createImpactWave(x, y) {
        particles.push({
            type: 'wave',
            x: x,
            y: y,
            radius: 14,
            maxRadius: 46,
            life: 0.28,
            maxLife: 0.28
        });
    }

    function addBigSmashedBanner(name) {
        bigSmashedBanners.push({
            name: name,
            timer: 1.5,
            maxTimer: 1.5
        });
    }

    // Input Listeners
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'KeyW'].includes(e.code)) keys.up = true;
        if (['ArrowDown', 'KeyS'].includes(e.code)) keys.down = true;
        if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = true;
        if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = true;
        if (['Space', 'KeyJ', 'KeyK', 'Enter'].includes(e.code)) {
            if (!keys.action) {
                marioSwingHammer();
            }
            keys.action = true;
            e.preventDefault();
        }
        if (e.code === 'Minus' || e.code === 'NumpadSubtract' || e.code === 'Equal' || e.code === 'NumpadAdd') {
            startGameMatch();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'KeyW'].includes(e.code)) keys.up = false;
        if (['ArrowDown', 'KeyS'].includes(e.code)) keys.down = false;
        if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = false;
        if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = false;
        if (['Space', 'KeyJ', 'KeyK', 'Enter'].includes(e.code)) keys.action = false;
    });

    // Touch & Mouse Handling for Tap-to-Whack
    function getVirtualPos(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const curScale = (rect.width / viewWidth);
        const x = viewX + (clientX - rect.left) / curScale;
        const y = viewY + (clientY - rect.top) / curScale;
        return { x, y };
    }

    canvas.addEventListener('pointerdown', (e) => {
        if (gameState === STATE_GAMEOVER) {
            startGameMatch();
            return;
        }

        const pos = getVirtualPos(e.clientX, e.clientY);
        handleTapTarget(pos.x, pos.y);
        // Spawn tap reticle
        tapReticles.push({
            x: pos.x,
            y: pos.y,
            radius: 12,
            maxRadius: 36,
            life: 0.35,
            maxLife: 0.35
        });
    });

    function handleTapTarget(vx, vy) {
        if (mario.isStunned) return;

        let tappedHole = null;
        let minDist = 999;
        const candidateHoles = (currentMode === MODE_5HOLES)
            ? HOLES.filter(h => h.tier === 'lower')
            : HOLES;

        candidateHoles.forEach(hole => {
            const d = Math.hypot(hole.x - vx, hole.y - vy);
            if (d < (hole.radiusX * 1.6) && d < minDist) {
                minDist = d;
                tappedHole = hole;
            }
        });

        if (currentMode === MODE_5HOLES) {
            // 单排5洞模式：Y 坐标固定为 370，仅左右移动定位与敲打
            if (tappedHole) {
                mario.targetX = tappedHole.x;
                mario.targetY = 370;
                mario.targetHoleId = tappedHole.id;
            } else {
                mario.targetX = Math.max(235, Math.min(725, vx));
                mario.targetY = 370;
                mario.targetHoleId = null;
            }
        } else {
            if (tappedHole) {
                mario.targetX = tappedHole.x;
                mario.targetY = (tappedHole.tier === 'lower') ? 395 : 305;
                mario.targetHoleId = tappedHole.id;
            } else {
                mario.targetX = Math.max(235, Math.min(725, vx));
                mario.targetY = Math.max(290, Math.min(410, vy));
                mario.targetHoleId = null;
            }
        }
    }

    // On-Screen Virtual Controls
    const joystickBase = document.getElementById('joystickBase');
    const joystickStick = document.getElementById('joystickStick');
    const btnHammer = document.getElementById('btnHammer');
    const btnStart = document.getElementById('btnStart');
    const btnStartTop = document.getElementById('btnStartTop');
    const btnMute = document.getElementById('btnMute');
    const btnSwitchFrame = document.getElementById('btnSwitchFrame');

    if (btnHammer) {
        btnHammer.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            marioSwingHammer();
            if (navigator.vibrate) navigator.vibrate(25);
        });
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            startGameMatch();
        });
    }

    if (btnStartTop) {
        btnStartTop.addEventListener('click', () => {
            startGameMatch();
        });
    }

    if (btnMute) {
        btnMute.addEventListener('click', () => {
            const enabled = window.soundEngine.toggleMute();
            btnMute.textContent = enabled ? '🔊' : '🔇';
        });
    }

    function updateSwitchFrameBtn() {
        if (!btnSwitchFrame) return;
        const isBezel = document.body.classList.contains('bezel-mode');
        btnSwitchFrame.innerHTML = isBezel ? '🖥️ 纯净全屏' : '🎮 掌机外观';
        btnSwitchFrame.title = isBezel ? '切换到纯净全屏模式' : '开启 Switch 掌机外观';
    }

    if (btnSwitchFrame) {
        btnSwitchFrame.addEventListener('click', () => {
            const body = document.body;
            body.classList.toggle('bezel-mode');
            updateSwitchFrameBtn();
            resizeCanvas();
        });
        updateSwitchFrameBtn();
    }

    // Touch Joystick
    if (joystickBase) {
        joystickBase.addEventListener('pointerdown', (e) => {
            joystick.active = true;
            joystick.touchId = e.pointerId;
            const rect = joystickBase.getBoundingClientRect();
            joystick.startX = rect.left + rect.width / 2;
            joystick.startY = rect.top + rect.height / 2;
            updateJoystick(e.clientX, e.clientY);
            joystickBase.setPointerCapture(e.pointerId);
        });

        joystickBase.addEventListener('pointermove', (e) => {
            if (joystick.active && e.pointerId === joystick.touchId) {
                updateJoystick(e.clientX, e.clientY);
            }
        });

        const stopJoystick = (e) => {
            if (joystick.active && e.pointerId === joystick.touchId) {
                joystick.active = false;
                joystick.dx = 0;
                joystick.dy = 0;
                if (joystickStick) {
                    joystickStick.style.transform = `translate(0px, 0px)`;
                }
            }
        };

        joystickBase.addEventListener('pointerup', stopJoystick);
        joystickBase.addEventListener('pointercancel', stopJoystick);
    }

    function updateJoystick(clientX, clientY) {
        const dx = clientX - joystick.startX;
        const dy = clientY - joystick.startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 42;

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;

        joystick.dx = clampedX / maxDist;
        joystick.dy = clampedY / maxDist;

        if (joystickStick) {
            joystickStick.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        }

        mario.targetX = null;
        mario.targetY = null;
    }

    // Mario Hammer Strike Logic
    function marioSwingHammer() {
        if (mario.isStunned || mario.isSwinging) return;

        mario.isSwinging = true;
        mario.swingTimer = mario.swingDuration;
        mario.targetX = null;
        mario.targetY = null;

        window.soundEngine.playSwing();

        setTimeout(() => {
            performHitDetection();
        }, 75);
    }

    function performHitDetection() {
        // Forward/backward strike (前后击打，向前击打)
        const facingDir = (mario.facingX !== 0 ? mario.facingX : mario.facing);
        let impactX = mario.x + facingDir * 24;
        let impactY = mario.y + (mario.facingY >= 0 ? 40 : -36);

        // Smart proximity assist: if there is an active or rising hole in front of Mario, target it
        let bestHole = null;
        let bestDist = 999;
        const candidateHoles = (currentMode === MODE_5HOLES)
            ? HOLES.filter(h => h.tier === 'lower')
            : HOLES;

        candidateHoles.forEach(hole => {
            if ((hole.state === 'ACTIVE' || hole.state === 'RISING') && hole.occupant) {
                const dx = hole.x - mario.x;
                const dy = hole.y - mario.y;
                const isForward = (currentMode === MODE_5HOLES) || (mario.facingY >= 0 && dy >= -15) || (mario.facingY < 0 && dy <= 15);
                const d = Math.hypot(dx, dy * 1.35);
                if (isForward && d < 110 && d < bestDist) {
                    bestDist = d;
                    bestHole = hole;
                }
            }
        });

        if (bestHole) {
            impactX = bestHole.x;
            impactY = bestHole.y;
            mario.facingY = (currentMode === MODE_5HOLES) ? 1 : ((bestHole.y >= mario.y) ? 1 : -1);
            if (Math.abs(bestHole.x - mario.x) > 15) {
                mario.facingX = (bestHole.x > mario.x) ? 1 : -1;
                mario.facing = mario.facingX;
            }
        }

        triggerShake(4.5, 0.16);
        createDustParticles(impactX, impactY, 12);
        createImpactWave(impactX, impactY);

        let hitSomething = false;

        candidateHoles.forEach(hole => {
            const dx = impactX - hole.x;
            const dy = impactY - hole.y;
            const dist = Math.hypot(dx, dy * 1.4);

            const hitRadius = hole.radiusX + 42;

            if (dist < hitRadius && hole.occupant && (hole.state === 'ACTIVE' || hole.state === 'RISING')) {
                hitSomething = true;
                handleEntityHit(hole);
            }
        });

        if (!hitSomething) {
            if (gameState === STATE_PLAYING && combo > 0) {
                combo = 0;
                updateHUD();
            }
        }
    }

    function handleEntityHit(hole) {
        const entity = hole.occupant;

        if (entity.type === 'BOBOMB') {
            // HIT BOB-OMB!
            hole.state = 'EXPLODING';
            window.soundEngine.playExplosion();
            triggerShake(14, 0.45);
            createExplosionParticles(hole.x, hole.y - 15);

            mario.isStunned = true;
            mario.stunTimer = 1.6;
            mario.vx = -mario.facing * 150;

            combo = 0;
            if (gameState === STATE_PLAYING) {
                gameTimer = Math.max(0, gameTimer - 3.0);
                addFloatingText('-3s ⏱️', mario.x, mario.y - 60, '#ff3b30', 32);
            } else {
                addFloatingText('💥 BOOM!', mario.x, mario.y - 60, '#ff3b30', 30);
            }

            hole.occupant = null;
            hole.state = 'EMPTY';
            hole.timer = 0;
            updateHUD();

        } else if (entity.type === 'MOLE' || entity.type === 'MEGA_MOLE') {
            // HIT MOLE!
            hole.state = 'HIT';
            hole.timer = 0.32;

            combo++;
            if (combo > maxCombo) maxCombo = combo;

            let pts = 1;
            const isVentTarget = Boolean(entity.ventName);

            if (isVentTarget) {
                // Hit custom venting target!
                // 1. Hitstop (0.08s freeze)
                hitstopTimer = 0.085;
                // 2. Extra strong shake
                triggerShake(13, 0.38);
                // 3. Audio & Coins
                window.soundEngine.playHitMega();
                createCoinParticles(hole.x, hole.y - 30, 12);
                pts = 5;
                score += pts;
                // 4. Remove from remaining targets (won't appear again this round), add to smashed
                const ventIdx = remainingVentTargets.indexOf(entity.ventName);
                if (ventIdx !== -1) {
                    remainingVentTargets.splice(ventIdx, 1);
                }
                if (!smashedVentTargets.includes(entity.ventName)) {
                    smashedVentTargets.push(entity.ventName);
                }
                // 5. Big Smashed Banner & floating text
                addBigSmashedBanner(entity.ventName);
                addFloatingText(`💥 敲扁【${entity.ventName}】! +5🪙`, hole.x, hole.y - 65, '#ff2d55', 30);
            } else if (entity.type === 'MEGA_MOLE') {
                pts = 3;
                window.soundEngine.playHitMega();
                triggerShake(8, 0.22);
                createCoinParticles(hole.x, hole.y - 30, 8);
                addFloatingText('+3 🪙', hole.x, hole.y - 50, '#ffe600', 34);
                score += pts;
            } else {
                window.soundEngine.playHitMole();
                triggerShake(4, 0.15);
                createCoinParticles(hole.x, hole.y - 25, 4);
                addFloatingText('+1 🪙', hole.x, hole.y - 45, '#ffd700', 28);
                score += pts;
            }

            if (combo === 3) addFloatingText('GREAT! ✨', mario.x, mario.y - 50, '#5ac8fa', 26);
            if (combo === 5) addFloatingText('SUPERB! 🌟', mario.x, mario.y - 50, '#ff9500', 30);
            if (combo >= 8 && combo % 4 === 0) addFloatingText('UNSTOPPABLE! 🔥', mario.x, mario.y - 50, '#ff2d55', 32);

            updateHUD();
        }
    }

    // Spawn Mechanics
    function updateHoles(dt) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            spawnTimer = 0.45 + Math.random() * 0.4;
            spawnRandomMole();
        }

        HOLES.forEach(hole => {
            if (hole.state === 'EMPTY') return;

            if (hole.state === 'RISING') {
                hole.progress += dt * 4.8;
                if (hole.progress >= 1) {
                    hole.progress = 1;
                    hole.state = 'ACTIVE';
                }
            } else if (hole.state === 'ACTIVE') {
                hole.timer -= dt;
                if (hole.timer <= 0) {
                    hole.state = 'DESCENDING';
                }
            } else if (hole.state === 'DESCENDING') {
                hole.progress -= dt * 4.8;
                if (hole.progress <= 0) {
                    hole.progress = 0;
                    hole.state = 'EMPTY';
                    hole.occupant = null;
                }
            } else if (hole.state === 'HIT') {
                hole.timer -= dt;
                if (hole.timer <= 0) {
                    hole.state = 'EMPTY';
                    hole.occupant = null;
                    hole.progress = 0;
                }
            }
        });
    }

    function spawnRandomMole() {
        const candidateHoles = (currentMode === MODE_5HOLES)
            ? HOLES.filter(h => h.tier === 'lower')
            : HOLES;
        const emptyHoles = candidateHoles.filter(h => h.state === 'EMPTY');
        if (emptyHoles.length === 0) return;

        const hole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];

        let type = 'MOLE';
        if (hole.isMega) {
            type = Math.random() < 0.7 ? 'MEGA_MOLE' : (Math.random() < 0.4 ? 'BOBOMB' : 'MOLE');
        } else {
            type = Math.random() < 0.22 ? 'BOBOMB' : 'MOLE';
        }

        let ventName = null;
        if (type === 'MOLE' || type === 'MEGA_MOLE') {
            const activeVentNames = candidateHoles.map(h => h.occupant && h.occupant.ventName).filter(Boolean);
            const availableTargets = remainingVentTargets.filter(t => !activeVentNames.includes(t));
            if (availableTargets.length > 0) {
                if (Math.random() < 0.85 || availableTargets.length >= emptyHoles.length) {
                    ventName = availableTargets[Math.floor(Math.random() * availableTargets.length)];
                }
            }
        }

        hole.occupant = {
            type: type,
            lookTimer: 0,
            lookDir: (Math.random() - 0.5) * 2,
            ventName: ventName
        };

        hole.state = 'RISING';
        hole.progress = 0;
        hole.timer = (type === 'MEGA_MOLE') ? 1.5 : (0.9 + Math.random() * 0.5);

        window.soundEngine.playPopUp();
    }

    // Start Match
    function startGameMatch() {
        window.soundEngine.init();
        gameState = STATE_COUNTDOWN;
        countdownVal = 3;
        countdownTimer = 1.0;
        score = 0;
        combo = 0;
        maxCombo = 0;
        gameTimer = 30.0;

        loadVentTargets();
        remainingVentTargets = [...ventTargets];
        smashedVentTargets = [];
        bigSmashedBanners = [];
        hitstopTimer = 0;

        HOLES.forEach(h => {
            h.state = 'EMPTY';
            h.occupant = null;
            h.progress = 0;
        });

        particles = [];
        floatingTexts = [];
        mario.x = 480;
        if (currentMode === MODE_5HOLES) {
            mario.y = 370;
            mario.facingY = 1;
        } else {
            mario.y = 355;
        }
        mario.targetX = null;
        mario.targetY = null;
        mario.isStunned = false;

        window.soundEngine.playCountDown(false);
        updateHUD();
    }

    // Main Loop
    let lastTime = performance.now();

    function gameLoop(currentTime) {
        const dt = Math.min((currentTime - lastTime) / 1000, 0.08);
        lastTime = currentTime;

        update(dt);
        render();

        requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        // Hitstop Freeze Frame (0.08s) for punchy impact feel
        if (hitstopTimer > 0) {
            hitstopTimer -= dt;
            if (shakeDuration > 0) {
                shakeDuration -= dt;
                if (shakeDuration <= 0) shakeIntensity = 0;
            }
            return;
        }

        if (shakeDuration > 0) {
            shakeDuration -= dt;
            if (shakeDuration <= 0) shakeIntensity = 0;
        }

        stageLightAngle += dt * 0.8;
        moleStatueBeat += dt * 4.0;

        if (gameState === STATE_COUNTDOWN) {
            countdownTimer -= dt;
            if (countdownTimer <= 0) {
                countdownVal--;
                if (countdownVal > 0) {
                    countdownTimer = 1.0;
                    window.soundEngine.playCountDown(false);
                } else if (countdownVal === 0) {
                    countdownTimer = 0.8;
                    window.soundEngine.playCountDown(true);
                } else {
                    gameState = STATE_PLAYING;
                    window.soundEngine.startBGM();
                }
            }
        } else if (gameState === STATE_PLAYING) {
            gameTimer -= dt;
            if (gameTimer <= 0) {
                gameTimer = 0;
                finishGame();
            }
            updateHUD();
        }

        updateHoles(dt);
        updateMario(dt);

        // Update Tap Reticles
        for (let i = tapReticles.length - 1; i >= 0; i--) {
            const tr = tapReticles[i];
            tr.life -= dt;
            if (tr.life <= 0) {
                tapReticles.splice(i, 1);
            }
        }

        // Update Big Smashed Banners
        for (let i = bigSmashedBanners.length - 1; i >= 0; i--) {
            const b = bigSmashedBanners[i];
            b.timer -= dt;
            if (b.timer <= 0) {
                bigSmashedBanners.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.gravity || 0) * dt;
            if (p.rot !== undefined) p.rot += (p.vrot || 0) * dt;
        }

        // Update Floating Texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
                floatingTexts.splice(i, 1);
                continue;
            }
            ft.y += ft.vy * dt;
        }
    }

    function finishGame() {
        gameState = STATE_GAMEOVER;
        window.soundEngine.stopBGM();
        window.soundEngine.playWhistle();

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('noggin_knock_highscore', highScore.toString());
        }

        const modal = document.getElementById('gameOverModal');
        const finalScoreEl = document.getElementById('modalFinalScore');
        const finalMaxComboEl = document.getElementById('modalMaxCombo');
        const modalRankEl = document.getElementById('modalRank');

        if (finalScoreEl) finalScoreEl.textContent = score;
        if (finalMaxComboEl) finalMaxComboEl.textContent = maxCombo;

        let rank = 'C';
        if (score >= 40) rank = 'S+ ⭐⭐⭐';
        else if (score >= 30) rank = 'S ⭐⭐';
        else if (score >= 20) rank = 'A ⭐';
        else if (score >= 12) rank = 'B';
        if (modalRankEl) modalRankEl.textContent = rank;

        renderVentReport();

        if (modal) modal.style.display = 'flex';
    }

    function renderVentReport() {
        const summaryEl = document.getElementById('ventReportSummary');
        const smashedEl = document.getElementById('ventTagsSmashed');
        const escapedEl = document.getElementById('ventTagsEscaped');
        const reportEl = document.getElementById('modalVentReport');

        if (!reportEl) return;

        if (ventTargets.length === 0) {
            if (summaryEl) summaryEl.innerHTML = '<div class="vent-empty-tip">💡 提示：点击右上角 🎯 发泄目标，自定义想敲扁的名字吧！</div>';
            if (smashedEl) smashedEl.innerHTML = '<span style="color:#aaa;font-size:12px;">（未设定）</span>';
            if (escapedEl) escapedEl.innerHTML = '<span style="color:#aaa;font-size:12px;">（未设定）</span>';
            return;
        }

        const escapedList = remainingVentTargets;
        const smashedCount = smashedVentTargets.length;
        const totalCount = ventTargets.length;

        if (smashedCount === totalCount && totalCount > 0) {
            if (summaryEl) summaryEl.innerHTML = '<div class="vent-all-clear">🎉 太解气了！所有设定发泄目标已被全部敲扁除名！</div>';
        } else {
            if (summaryEl) summaryEl.textContent = `已狠狠敲扁 ${smashedCount} / ${totalCount} 个目标！`;
        }

        if (smashedEl) {
            smashedEl.innerHTML = smashedVentTargets.length > 0
                ? smashedVentTargets.map(n => `<span class="vent-tag smashed">🔨 ${n} <b style="color:#2e7d32">✔</b></span>`).join('')
                : '<span style="color:#aaa;font-size:12px;">（本轮无）</span>';
        }

        if (escapedEl) {
            escapedEl.innerHTML = escapedList.length > 0
                ? escapedList.map(n => `<span class="vent-tag escaped">🏃 ${n}</span>`).join('')
                : '<span style="color:#2e7d32;font-size:12px;font-weight:700;">（全灭无逃脱！）</span>';
        }
    }

    function updateMario(dt) {
        if (mario.isStunned) {
            mario.stunTimer -= dt;
            mario.vx *= 0.9;
            mario.x += mario.vx * dt;
            if (mario.stunTimer <= 0) {
                mario.isStunned = false;
            }
            return;
        }

        if (mario.isSwinging) {
            mario.swingTimer -= dt;
            if (mario.swingTimer <= 0) {
                mario.isSwinging = false;
            }
            return;
        }

        let mx = 0;
        let my = 0;

        if (keys.left) mx -= 1;
        if (keys.right) mx += 1;
        if (keys.up && currentMode !== MODE_5HOLES) my -= 1;
        if (keys.down && currentMode !== MODE_5HOLES) my += 1;

        if (joystick.active) {
            mx = joystick.dx;
            my = (currentMode === MODE_5HOLES) ? 0 : joystick.dy;
        }

        if (mario.targetX !== null && mario.targetY !== null && !joystick.active && mx === 0 && my === 0) {
            if (currentMode === MODE_5HOLES) mario.targetY = 370;
            const dx = mario.targetX - mario.x;
            const dy = (currentMode === MODE_5HOLES) ? 0 : (mario.targetY - mario.y);
            const dist = (currentMode === MODE_5HOLES) ? Math.abs(dx) : Math.hypot(dx, dy);

            if (dist > 14) {
                mx = (currentMode === MODE_5HOLES) ? Math.sign(dx) : (dx / dist);
                my = (currentMode === MODE_5HOLES) ? 0 : (dy / dist);
                if (dx > 6) { mario.facing = 1; mario.facingX = 1; }
                else if (dx < -6) { mario.facing = -1; mario.facingX = -1; }
                if (currentMode !== MODE_5HOLES) {
                    if (dy > 6) mario.facingY = 1;
                    else if (dy < -6) mario.facingY = -1;
                } else {
                    mario.facingY = 1;
                }
            } else {
                mario.targetX = null;
                mario.targetY = null;
                if (mario.targetHoleId !== null) {
                    marioSwingHammer();
                    mario.targetHoleId = null;
                }
            }
        }

        if (currentMode === MODE_5HOLES) {
            my = 0;
        }

        const len = Math.hypot(mx, my);
        if (len > 0.05) {
            const normX = mx / Math.max(1, len);
            const normY = (currentMode === MODE_5HOLES) ? 0 : (my / Math.max(1, len));

            mario.vx = normX * mario.speed;
            mario.vy = (currentMode === MODE_5HOLES) ? 0 : (normY * mario.speed * 0.75);
            mario.isMoving = true;

            if (normX > 0.1) {
                mario.facing = 1;
                mario.facingX = 1;
            } else if (normX < -0.1) {
                mario.facing = -1;
                mario.facingX = -1;
            }

            if (currentMode === MODE_5HOLES) {
                mario.facingY = 1;
            } else {
                if (normY > 0.15) {
                    mario.facingY = 1;
                } else if (normY < -0.15) {
                    mario.facingY = -1;
                }
            }

            mario.walkAnimTimer += dt * 14;
            mario.walkFrame = Math.floor(mario.walkAnimTimer) % 4;

            if (Math.random() < 0.18) {
                createDustParticles(mario.x, mario.y + 15, 1);
            }
        } else {
            mario.vx = 0;
            mario.vy = 0;
            mario.isMoving = false;
        }

        mario.x += mario.vx * dt;
        if (currentMode === MODE_5HOLES) {
            mario.y = 370;
            mario.vy = 0;
            mario.facingY = 1;
        } else {
            mario.y += mario.vy * dt;
            mario.y = Math.max(285, Math.min(415, mario.y));
        }

        mario.x = Math.max(230, Math.min(730, mario.x));
    }

    function updateHUD() {
        const timerEl = document.getElementById('hudTimer');
        const scoreEl = document.getElementById('hudScore');
        const comboEl = document.getElementById('hudCombo');
        const statusEl = document.getElementById('hudStatus');

        if (timerEl) {
            if (gameState === STATE_PRACTICE) {
                timerEl.innerHTML = `• 30 <span style="font-size:0.7em;opacity:0.8">(练习)</span>`;
            } else {
                timerEl.textContent = `• ${Math.ceil(gameTimer)}`;
                if (gameTimer <= 10) timerEl.classList.add('low-time');
                else timerEl.classList.remove('low-time');
            }
        }

        if (scoreEl) {
            scoreEl.textContent = `🪙 ${score.toString().padStart(2, '0')}`;
        }

        if (comboEl) {
            if (combo > 1) {
                comboEl.textContent = `x${combo} COMBO!`;
                comboEl.style.opacity = '1';
            } else {
                comboEl.style.opacity = '0';
            }
        }

        if (statusEl) {
            if (gameState === STATE_PRACTICE) {
                statusEl.textContent = (currentMode === MODE_5HOLES)
                    ? '单排5洞模式 · 左右横移敲打'
                    : '全域8洞模式 · 自由纵深敲打';
            } else if (gameState === STATE_PLAYING) {
                statusEl.textContent = '';
            }
        }

        const btnStartTop = document.getElementById('btnStartTop');
        if (btnStartTop) {
            if (gameState === STATE_PLAYING) {
                btnStartTop.textContent = `⏱️ ${Math.ceil(gameTimer)}s`;
            } else if (gameState === STATE_COUNTDOWN) {
                btnStartTop.textContent = `倒计时...`;
            } else {
                btnStartTop.textContent = `▶ 开始`;
            }
        }
    }

    // ----------------------------------------------------
    // RENDERING ENGINE
    // ----------------------------------------------------
    function render() {
        ctx.save();

        // Clear canvas
        ctx.fillStyle = '#0b0610';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.scale(scale, scale);
        ctx.translate(-viewX, -viewY);

        if (shakeIntensity > 0) {
            const sx = (Math.random() - 0.5) * shakeIntensity * 2;
            const sy = (Math.random() - 0.5) * shakeIntensity * 2;
            ctx.translate(sx, sy);
        }

        // 1. Draw Real Stage Background
        drawBackground();

        // 2. Draw 2.5D Mechanical Stage Elements
        drawStage();

        // 3. Draw Moles & Bob-ombs inside holes
        drawHoleOccupants();

        // 4. Draw Mario
        drawMario();

        // 5. Draw Foreground Stage Rims
        drawStageForeground();

        // 6. Draw Tap Reticles
        drawTapReticles();

        // 7. Draw Particles & Floating Text
        drawParticles();
        drawFloatingTexts();

        // 8. Draw Overlays
        drawOverlays();
        drawBigSmashedBanners();

        ctx.restore();
    }

    function drawBackground() {
        // Extended backdrop filling for vertically stretched mobile screens
        const grad = ctx.createRadialGradient(480, 200, 100, 480, 200, 650);
        grad.addColorStop(0, '#2e1c3b');
        grad.addColorStop(0.6, '#180d22');
        grad.addColorStop(1, '#0b0610');
        ctx.fillStyle = grad;
        ctx.fillRect(viewX - 200, viewY - 200, viewWidth + 400, viewHeight + 400);

        if (bgImageLoaded) {
            ctx.drawImage(bgImage, 0, 0, V_WIDTH, 275);
        } else {
            drawGiantMoleStatue(480, 115);
        }

        // Carnival bulbs
        ctx.save();
        archBulbs.forEach((bulb, idx) => {
            const bx = 480 + Math.cos(bulb.angle) * 440;
            const by = 260 + Math.sin(bulb.angle) * 440;
            const blink = Math.sin(stageLightAngle * 5 + idx) > 0;

            ctx.fillStyle = blink ? bulb.color : 'rgba(100, 60, 20, 0.4)';
            ctx.shadowColor = blink ? bulb.color : 'transparent';
            ctx.shadowBlur = blink ? 14 : 0;
            ctx.beginPath();
            ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // Dynamic Spotlights
        drawSpotlights();
    }

    function drawGiantMoleStatue(cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);

        const bob = Math.sin(moleStatueBeat) * 4;
        ctx.translate(0, bob);

        ctx.fillStyle = '#b8751e';
        ctx.beginPath();
        ctx.ellipse(0, 0, 120, 95, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#5a3407';
        ctx.stroke();

        ctx.fillStyle = '#e8a94d';
        ctx.beginPath();
        ctx.ellipse(0, 10, 95, 70, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-22, 28, 20, 26);
        ctx.fillRect(2, 28, 20, 26);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.strokeRect(-22, 28, 20, 26);
        ctx.strokeRect(2, 28, 20, 26);

        ctx.fillStyle = '#fce4c8';
        ctx.beginPath();
        ctx.ellipse(-30, 20, 34, 26, -0.1, 0, Math.PI * 2);
        ctx.ellipse(30, 20, 34, 26, 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(0, 10, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawSpotlights() {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const sw1 = Math.sin(stageLightAngle * 0.7) * 80;
        const sw2 = Math.cos(stageLightAngle * 0.65) * 80;

        const gradL = ctx.createLinearGradient(180, 20, 360 + sw1, 460);
        gradL.addColorStop(0, 'rgba(255, 235, 160, 0.38)');
        gradL.addColorStop(1, 'rgba(255, 200, 100, 0.01)');
        ctx.fillStyle = gradL;
        ctx.beginPath();
        ctx.moveTo(170, 20);
        ctx.lineTo(190, 20);
        ctx.lineTo(440 + sw1, 470);
        ctx.lineTo(280 + sw1, 470);
        ctx.closePath();
        ctx.fill();

        const gradR = ctx.createLinearGradient(780, 20, 600 + sw2, 460);
        gradR.addColorStop(0, 'rgba(255, 235, 160, 0.38)');
        gradR.addColorStop(1, 'rgba(255, 200, 100, 0.01)');
        ctx.fillStyle = gradR;
        ctx.beginPath();
        ctx.moveTo(770, 20);
        ctx.lineTo(790, 20);
        ctx.lineTo(680 + sw2, 470);
        ctx.lineTo(520 + sw2, 470);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function drawStage() {
        ctx.save();

        const stageLeft = isMobilePortrait ? (viewX - 40) : 140;
        const stageWidth = isMobilePortrait ? (viewWidth + 80) : 680;
        const upperStepLeft = isMobilePortrait ? (viewX - 40) : 180;
        const upperStepWidth = isMobilePortrait ? (viewWidth + 80) : 600;

        // Upper Raised Step
        ctx.fillStyle = '#d49b0e';
        ctx.beginPath();
        ctx.moveTo(upperStepLeft, 255);
        ctx.lineTo(upperStepLeft + upperStepWidth, 255);
        ctx.lineTo(upperStepLeft + upperStepWidth, 290);
        ctx.lineTo(upperStepLeft, 290);
        ctx.closePath();
        ctx.fill();

        // Upper Tier Top Face
        ctx.fillStyle = '#e8b11a';
        ctx.fillRect(upperStepLeft, 210, upperStepWidth, 48);

        // Lower Main Arena Floor (舞台主擂台)
        ctx.fillStyle = '#e2aa1c';
        ctx.fillRect(stageLeft, 290, stageWidth, 155);

        // Three Green Checkered Mats
        const mats = [
            { x: 220, w: 140 },
            { x: 410, w: 140 },
            { x: 600, w: 140 }
        ];

        mats.forEach(mat => {
            ctx.fillStyle = '#4fa84f';
            ctx.fillRect(mat.x, 295, mat.w, 140);

            ctx.strokeStyle = '#3d8c3d';
            ctx.lineWidth = 2;
            for (let y = 305; y < 435; y += 20) {
                ctx.beginPath();
                ctx.moveTo(mat.x, y);
                ctx.lineTo(mat.x + mat.w, y);
                ctx.stroke();
            }
        });

        // Yellow Platform Front Lip with Hazard Stripes
        const frontY = 445;
        const frontHeight = 35;

        // Platform drop shadow & lower pedestal extension for vertical mobile screens
        ctx.fillStyle = '#10121a';
        ctx.fillRect(viewX - 200, frontY + frontHeight + 14, viewWidth + 400, 1500);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(stageLeft - 10, frontY + frontHeight, stageWidth + 20, 16);

        // Front Face
        ctx.fillStyle = '#ca9310';
        ctx.fillRect(stageLeft, frontY, stageWidth, frontHeight);

        // Hazard Stripes
        ctx.save();
        ctx.beginPath();
        ctx.rect(stageLeft, frontY, stageWidth, frontHeight);
        ctx.clip();

        ctx.fillStyle = '#1c1c1c';
        const stripeW = 28;
        for (let sx = stageLeft - 60; sx < stageLeft + stageWidth + 60; sx += stripeW * 2) {
            ctx.beginPath();
            ctx.moveTo(sx, frontY);
            ctx.lineTo(sx + stripeW, frontY);
            ctx.lineTo(sx + stripeW - frontHeight * 0.8, frontY + frontHeight);
            ctx.lineTo(sx - frontHeight * 0.8, frontY + frontHeight);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Corner Metal Brackets with Silver Rivets
        if (!isMobilePortrait) {
            drawMetalBracket(140, frontY - 8);
            drawMetalBracket(790, frontY - 8);
        } else {
            drawMetalBracket(stageLeft, frontY - 8);
            drawMetalBracket(stageLeft + stageWidth - 30, frontY - 8);
        }

        // Draw Hole Cavities
        HOLES.forEach(hole => {
            drawHoleInterior(hole);
        });

        ctx.restore();
    }

    function drawMetalBracket(x, y) {
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(x, y, 30, 46);
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 30, 46);

        [8, 22, 36].forEach(by => {
            ctx.fillStyle = '#eee';
            ctx.beginPath();
            ctx.arc(x + 15, y + by, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawHoleInterior(hole) {
        ctx.save();
        ctx.translate(hole.x, hole.y);

        ctx.fillStyle = '#5c3818';
        ctx.beginPath();
        ctx.ellipse(0, 4, hole.radiusX + 8, hole.radiusY + 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#784b22';
        ctx.beginPath();
        ctx.ellipse(0, 0, hole.radiusX + 6, hole.radiusY + 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140c06';
        ctx.beginPath();
        ctx.ellipse(0, 0, hole.radiusX, hole.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        if (hole.isMega) {
            ctx.fillStyle = '#ffd700';
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                const sx = Math.cos(a) * (hole.radiusX + 4);
                const sy = Math.sin(a) * (hole.radiusY + 2);
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    function drawHoleOccupants() {
        HOLES.forEach(hole => {
            if (hole.state === 'EMPTY' || !hole.occupant) return;

            ctx.save();
            ctx.beginPath();
            ctx.rect(hole.x - hole.radiusX - 50, hole.y - 180, (hole.radiusX + 50) * 2, 180 + hole.radiusY);
            ctx.clip();

            const entity = hole.occupant;
            const riseHeight = (hole.isMega ? 75 : 55) * hole.progress;

            ctx.translate(hole.x, hole.y + 4 - riseHeight);

            if (entity.type === 'MOLE') {
                drawMechaMole(hole.state === 'HIT');
            } else if (entity.type === 'MEGA_MOLE') {
                drawMegaMole(hole.state === 'HIT');
            } else if (entity.type === 'BOBOMB') {
                drawBobomb(hole.timer);
            }

            if (entity.ventName) {
                drawVentNameTag(entity.ventName, hole.state === 'HIT', hole.isMega);
            }

            ctx.restore();
        });
    }

    function drawVentNameTag(name, isHit, isMega) {
        ctx.save();
        const tagY = isMega ? -64 : -46;
        ctx.translate(0, tagY);

        const displayText = isHit ? `💥 ${name} (已扁)` : `🎯 ${name}`;
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const textWidth = ctx.measureText(displayText).width;
        const padX = 10;
        const tagW = Math.max(54, textWidth + padX * 2);
        const tagH = 22;

        // Outer glow
        ctx.shadowColor = isHit ? 'rgba(255, 69, 84, 0.8)' : 'rgba(255, 204, 0, 0.85)';
        ctx.shadowBlur = 8;

        // Bubble background
        ctx.fillStyle = isHit ? '#ffebee' : '#fff9d6';
        ctx.strokeStyle = isHit ? '#e52521' : '#f59e0b';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(-tagW / 2, -tagH / 2, tagW, tagH, 11);
        ctx.fill();
        ctx.stroke();

        // Downward pointer arrow pointing to mole head
        ctx.beginPath();
        ctx.moveTo(-4, tagH / 2 - 1);
        ctx.lineTo(0, tagH / 2 + 5);
        ctx.lineTo(4, tagH / 2 - 1);
        ctx.fillStyle = isHit ? '#e52521' : '#f59e0b';
        ctx.fill();

        // Reset shadow for crisp text
        ctx.shadowBlur = 0;
        ctx.fillStyle = isHit ? '#c62828' : '#6b3d00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, 0, 0);

        if (isHit) {
            // Strike-through line
            ctx.strokeStyle = '#e52521';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-tagW / 2 + 4, 0);
            ctx.lineTo(tagW / 2 - 4, 0);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawMechaMole(isHit) {
        ctx.save();

        if (isHit) {
            ctx.scale(1.2, 0.45);
        }

        // Body with metallic gradient
        const grad = ctx.createLinearGradient(-26, -24, 26, 24);
        grad.addColorStop(0, '#d98b2c');
        grad.addColorStop(0.5, '#b8751e');
        grad.addColorStop(1, '#824e0e');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4a2b05';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Muzzle
        ctx.fillStyle = '#fce4c8';
        ctx.beginPath();
        ctx.ellipse(0, 6, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Buck Teeth
        ctx.fillStyle = '#fff';
        ctx.fillRect(-7, 10, 6, 8);
        ctx.fillRect(1, 10, 6, 8);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-7, 10, 6, 8);
        ctx.strokeRect(1, 10, 6, 8);

        // Nose
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(0, 3, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        if (isHit) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(-9, -6, 5, 0, Math.PI * 1.5);
            ctx.arc(9, -6, 5, 0, Math.PI * 1.5);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(-9, -6, 4, 0, Math.PI * 2);
            ctx.arc(9, -6, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-10, -7, 1.5, 0, Math.PI * 2);
            ctx.arc(8, -7, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Two Cute Mechanical Paws on the Hole Rim
        ctx.fillStyle = '#fce4c8';
        ctx.strokeStyle = '#b8751e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-18, 16, 7, 5, -0.2, 0, Math.PI * 2);
        ctx.ellipse(18, 16, 7, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rivets on forehead
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.arc(-16, -12, 2.5, 0, Math.PI * 2);
        ctx.arc(16, -12, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawMegaMole(isHit) {
        ctx.save();
        ctx.scale(1.55, 1.55);
        if (isHit) ctx.scale(1.15, 0.45);

        // Shiny Golden Metallic Body
        const grad = ctx.createLinearGradient(-30, -26, 30, 26);
        grad.addColorStop(0, '#ffd700');
        grad.addColorStop(0.5, '#e5a50a');
        grad.addColorStop(1, '#b37700');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5a3d00';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Shiny gold goggles with flashing LED
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-18, -20, 36, 8);
        const blinkLED = Math.sin(performance.now() * 0.01) > 0;
        ctx.fillStyle = blinkLED ? '#ff3b30' : '#881100';
        ctx.beginPath();
        ctx.arc(0, -16, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Muzzle
        ctx.fillStyle = '#ffe0ba';
        ctx.beginPath();
        ctx.ellipse(0, 6, 22, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Big Gold Buck Teeth
        ctx.fillStyle = '#fff';
        ctx.fillRect(-8, 11, 7, 10);
        ctx.fillRect(1, 11, 7, 10);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, 11, 7, 10);
        ctx.strokeRect(1, 11, 7, 10);

        // Nose
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(0, 4, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-10, -5, 5, 0, Math.PI * 2);
        ctx.arc(10, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-11, -7, 2, 0, Math.PI * 2);
        ctx.arc(9, -7, 2, 0, Math.PI * 2);
        ctx.fill();

        // Big Claws
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(-22, 18, 9, 6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(22, 18, 9, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawBobomb(timer) {
        ctx.save();

        const fuseBlink = Math.floor(timer * 12) % 2 === 0;

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 18, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Yellow feet
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(-10, 16, 7, 4, -0.2, 0, Math.PI * 2);
        ctx.ellipse(10, 16, 7, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Spherical Black Body
        const bombGrad = ctx.createRadialGradient(-7, -8, 2, 0, 0, 24);
        bombGrad.addColorStop(0, '#555555');
        bombGrad.addColorStop(0.3, '#222226');
        bombGrad.addColorStop(1, '#050508');
        ctx.fillStyle = fuseBlink ? '#ff2222' : bombGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Specular highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-7, -8, 5, 0, Math.PI * 2);
        ctx.fill();

        // White Oval Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-6, 2, 4, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(6, 2, 4, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-6, 2, 2.2, 0, Math.PI * 2);
        ctx.arc(6, 2, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Fuse stem & rope
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(-3, -27, 6, 6);

        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -27);
        ctx.quadraticCurveTo(8, -36, 4, -42);
        ctx.stroke();

        // Sizzling Fuse Spark
        const sparkSize = 5 + Math.random() * 5;
        ctx.fillStyle = fuseBlink ? '#ffff00' : '#ff4500';
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(4, -42, sparkSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    function drawStageForeground() {
        HOLES.forEach(hole => {
            if (hole.tier === 'lower') {
                ctx.save();
                ctx.translate(hole.x, hole.y);
                ctx.fillStyle = '#784b22';
                ctx.beginPath();
                ctx.ellipse(0, 4, hole.radiusX + 4, hole.radiusY, 0, 0, Math.PI);
                ctx.fill();
                ctx.restore();
            }
        });
    }

    function drawTapReticles() {
        tapReticles.forEach(tr => {
            ctx.save();
            ctx.translate(tr.x, tr.y);

            const progress = 1 - (tr.life / tr.maxLife);
            const curR = tr.radius + (tr.maxRadius - tr.radius) * progress;
            const alpha = 1 - progress;

            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, curR, 0, Math.PI * 2);
            ctx.stroke();

            // Inner crosshair
            ctx.strokeStyle = `rgba(255, 69, 84, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
            ctx.moveTo(0, -8); ctx.lineTo(0, 8);
            ctx.stroke();

            ctx.restore();
        });
    }

    // Mario Character Rendering
    function drawMario() {
        ctx.save();
        ctx.translate(mario.x, mario.y);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 24, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.scale(mario.facing, 1);

        if (mario.isStunned) {
            const angle = performance.now() * 0.008;
            ctx.fillStyle = '#ffd700';
            for (let i = 0; i < 3; i++) {
                const sa = angle + (i * Math.PI * 2 / 3);
                const sx = Math.cos(sa) * 25;
                const sy = -65 + Math.sin(sa) * 10;
                ctx.beginPath();
                ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const bounce = mario.isMoving ? Math.abs(Math.sin(mario.walkAnimTimer)) * 6 : 0;
        const swingProgress = mario.isSwinging ? (1 - (mario.swingTimer / mario.swingDuration)) : 0;

        let leanX = 0;
        let leanY = -bounce;
        if (mario.isSwinging) {
            if (swingProgress < 0.22) {
                // Lean slightly back to wind up hammer
                leanX = -2;
                leanY -= 3;
            } else if (swingProgress < 0.65) {
                // Powerful forward lunge downward!
                leanX = 8;
                leanY += 4;
            } else {
                leanX = 4;
                leanY += 2;
            }
        }
        ctx.translate(leanX, leanY);

        // Shoes
        ctx.fillStyle = '#5c3317';
        if (mario.isMoving) {
            const legOffset = Math.sin(mario.walkAnimTimer) * 10;
            ctx.beginPath();
            ctx.ellipse(-10 - legOffset, 14, 9, 6, 0, 0, Math.PI * 2);
            ctx.ellipse(10 + legOffset, 14, 9, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(-10, 14, 9, 6, 0, 0, Math.PI * 2);
            ctx.ellipse(10, 14, 9, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Blue Overalls
        ctx.fillStyle = mario.isStunned ? '#333' : '#0055d4';
        ctx.beginPath();
        ctx.roundRect(-16, -12, 32, 24, 6);
        ctx.fill();

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-8, -6, 2.5, 0, Math.PI * 2);
        ctx.arc(8, -6, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Red Shirt
        ctx.fillStyle = mario.isStunned ? '#222' : '#e52521';
        ctx.beginPath();
        ctx.roundRect(-14, -26, 28, 16, 4);
        ctx.fill();

        // Head
        ctx.fillStyle = mario.isStunned ? '#555' : '#fcd0a1';
        ctx.beginPath();
        ctx.ellipse(0, -38, 16, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mustache
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(4, -34, 10, 5, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = mario.isStunned ? '#444' : '#fcd0a1';
        ctx.beginPath();
        ctx.ellipse(7, -38, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c4956c';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Eyes
        if (mario.isStunned) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -42); ctx.lineTo(6, -38);
            ctx.moveTo(6, -42); ctx.lineTo(0, -38);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#0055d4';
            ctx.beginPath();
            ctx.ellipse(3, -42, 2.5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cap
        ctx.fillStyle = mario.isStunned ? '#222' : '#e52521';
        ctx.beginPath();
        ctx.ellipse(0, -48, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(8, -44, 14, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Emblem
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -50, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e52521';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', 0, -50);

        // Hammer
        drawMarioHammer();

        ctx.restore();
    }

    function drawMarioHammer() {
        ctx.save();

        if (mario.isSwinging) {
            const progress = 1 - (mario.swingTimer / mario.swingDuration);

            let posX = 0;
            let posY = 0;
            let angle = 0;
            let scaleP = 1.0;

            if (progress < 0.22) {
                // Phase 1: High Windup overhead (raised high above head)
                const p = progress / 0.22;
                posX = 4 - p * 6;
                posY = -40 - p * 24;
                angle = -0.35 - p * 0.2;
                scaleP = 1.0;
            } else if (progress < 0.58) {
                // Phase 2: Forward Downward Slam with perspective acceleration
                const p = (progress - 0.22) / 0.36;
                const slamP = Math.pow(p, 1.8);
                posX = -2 + slamP * 24; // moving forward
                posY = -64 + slamP * 76; // slamming down to +12
                angle = -0.55 + slamP * 2.0; // rotating forward-down into ground (~1.45 rad)
                scaleP = 1.0 + Math.sin(p * Math.PI) * 0.32; // perspective forward pop!

                // Forward vertical slam blur swoosh
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
                ctx.lineWidth = 14 * scaleP;
                ctx.beginPath();
                ctx.ellipse(8, -15, 30 * scaleP, 42 * scaleP, 0.3, -Math.PI * 0.4, Math.PI * 0.35);
                ctx.stroke();
                ctx.restore();

            } else if (progress < 0.82) {
                // Phase 3: Impact ground hold
                posX = 22;
                posY = 12;
                angle = 1.45;
                scaleP = 1.28;
            } else {
                // Phase 4: Recover back to ready
                const p = (progress - 0.82) / 0.18;
                posX = 22 * (1 - p) + 8 * p;
                posY = 12 * (1 - p) + (-24) * p;
                angle = 1.45 * (1 - p) + (-0.12) * p;
                scaleP = 1.28 * (1 - p) + 1.0 * p;
            }

            ctx.translate(posX, posY);
            ctx.scale(scaleP, scaleP);
            ctx.rotate(angle);

            // Mallet Handle (Wooden Shaft)
            ctx.fillStyle = '#d2b48c';
            ctx.fillRect(-4, -48, 8, 58);
            ctx.strokeStyle = '#a07446';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-4, -48, 8, 58);

            // Mallet Heavy Head
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.roundRect(-24, -72, 48, 28, 6);
            ctx.fill();
            ctx.strokeStyle = '#4a2508';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Gold accent band
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-24, -60, 48, 5);

            // End Rivet / Cap
            ctx.fillStyle = '#f5f5f5';
            ctx.beginPath();
            ctx.arc(0, -58, 4, 0, Math.PI * 2);
            ctx.fill();

            // Gloved Hands holding shaft firmly
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-2, -4, 6.5, 0, Math.PI * 2);
            ctx.arc(2, -16, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1.5;
            ctx.stroke();

        } else {
            // Idle Stance: Held upright ready in front of chest
            ctx.translate(8, -24);
            ctx.rotate(-0.12);

            // Handle
            ctx.fillStyle = '#d2b48c';
            ctx.fillRect(-4, -46, 8, 48);
            ctx.strokeStyle = '#a07446';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-4, -46, 8, 48);

            // Head
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.roundRect(-24, -70, 48, 28, 6);
            ctx.fill();
            ctx.strokeStyle = '#4a2508';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Gold band
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-24, -58, 48, 5);

            // White Gloved Hands gripping handle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-1, 2, 6.5, 0, Math.PI * 2);
            ctx.arc(3, -12, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawParticles() {
        particles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);

            const alpha = Math.max(0, p.life / p.maxLife);

            if (p.type === 'coin') {
                ctx.rotate(p.rot);
                ctx.scale(Math.cos(p.rot), 1);
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.ellipse(0, 0, 11, 14, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#fff8dc';
                ctx.fillRect(-2, -6, 4, 12);

            } else if (p.type === 'wave') {
                const waveP = 1 - (p.life / p.maxLife);
                const r = p.radius + (p.maxRadius - p.radius) * waveP;
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
                ctx.lineWidth = 3.5 * (1 - waveP);
                ctx.beginPath();
                ctx.ellipse(0, 0, r, r * 0.52, 0, 0, Math.PI * 2);
                ctx.stroke();

            } else if (p.type === 'dust') {
                ctx.fillStyle = `rgba(255, 245, 210, ${alpha * 0.65})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * (1 + (1 - alpha)), 0, Math.PI * 2);
                ctx.fill();

            } else if (p.type === 'fire') {
                ctx.fillStyle = `rgba(255, ${Math.floor(100 + alpha * 155)}, 0, ${alpha})`;
                ctx.shadowColor = '#ff4500';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * (1 - alpha * 0.5), 0, Math.PI * 2);
                ctx.fill();

            } else if (p.type === 'smoke') {
                ctx.fillStyle = `rgba(40, 40, 45, ${alpha * 0.75})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * (1.2 - alpha * 0.2), 0, Math.PI * 2);
                ctx.fill();

            } else if (p.type === 'spark') {
                ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }

            ctx.restore();
        });
    }

    function drawFloatingTexts() {
        floatingTexts.forEach(ft => {
            ctx.save();
            ctx.translate(ft.x, ft.y);

            const alpha = Math.max(0, ft.life / ft.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 5;
            ctx.font = `900 ${ft.size}px 'Arial Black', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.strokeText(ft.text, 0, 0);
            ctx.fillText(ft.text, 0, 0);

            ctx.restore();
        });
    }

    function drawOverlays() {
        if (gameState === STATE_COUNTDOWN) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            const txt = (countdownVal > 0) ? countdownVal.toString() : 'START!';
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#d63031';
            ctx.lineWidth = 10;
            ctx.font = `900 96px 'Arial Black', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const scalePop = 1 + (countdownTimer * 0.35);
            ctx.translate(V_WIDTH / 2, V_HEIGHT / 2);
            ctx.scale(scalePop, scalePop);

            ctx.strokeText(txt, 0, 0);
            ctx.fillText(txt, 0, 0);
            ctx.restore();
        }
    }

    function drawBigSmashedBanners() {
        if (bigSmashedBanners.length === 0) return;

        bigSmashedBanners.forEach(b => {
            const progress = 1 - (b.timer / b.maxTimer);
            ctx.save();
            ctx.translate(V_WIDTH / 2, 95);

            let bannerScale = 1;
            let alpha = 1;
            if (progress < 0.18) {
                bannerScale = 0.5 + (progress / 0.18) * 0.6; // pop in bounce
            } else if (progress > 0.75) {
                alpha = Math.max(0, 1 - (progress - 0.75) / 0.25); // fade out float up
                ctx.translate(0, -((progress - 0.75) / 0.25) * 20);
            }
            ctx.scale(bannerScale, bannerScale);
            ctx.globalAlpha = alpha;

            const text = `💥【${b.name}】已被狠狠敲扁！`;
            ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const tw = ctx.measureText(text).width;
            const bw = tw + 44;
            const bh = 42;

            // Glow & shadow
            ctx.shadowColor = 'rgba(255, 45, 85, 0.8)';
            ctx.shadowBlur = 18;

            // Ribbon Background
            const grad = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
            grad.addColorStop(0, '#e52521');
            grad.addColorStop(0.5, '#ff4554');
            grad.addColorStop(1, '#e52521');
            ctx.fillStyle = grad;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 21);
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 0, 0);

            // Sub text: +5 COINS CRITICAL VENT
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#ffe600';
            ctx.fillText('CRITICAL VENT! +5🪙', 0, bh / 2 + 13);

            ctx.restore();
        });
    }

    // Modal Close / Play Again
    const btnPlayAgain = document.getElementById('btnPlayAgain');
    if (btnPlayAgain) {
        btnPlayAgain.addEventListener('click', () => {
            const modal = document.getElementById('gameOverModal');
            if (modal) modal.style.display = 'none';
            startGameMatch();
        });
    }

    const btnBackPractice = document.getElementById('btnBackPractice');
    if (btnBackPractice) {
        btnBackPractice.addEventListener('click', () => {
            const modal = document.getElementById('gameOverModal');
            if (modal) modal.style.display = 'none';
            gameState = STATE_PRACTICE;
            updateHUD();
        });
    }

    // Setup Venting Target Setup UI
    function setupVentingUI() {
        loadVentTargets();
        remainingVentTargets = [...ventTargets];

        const ventModal = document.getElementById('ventModal');
        const btnVentSettings = document.getElementById('btnVentSettings');
        const btnFooterVent = document.getElementById('btnFooterVent');
        const btnCloseVentModal = document.getElementById('btnCloseVentModal');
        const btnClearAllVent = document.getElementById('btnClearAllVent');
        const btnSaveVent = document.getElementById('btnSaveVent');
        const btnSaveAndStartVent = document.getElementById('btnSaveAndStartVent');

        function openModal() {
            // Fill inputs with current ventTargets
            for (let i = 0; i < 5; i++) {
                const inp = document.getElementById(`ventInput${i}`);
                if (inp) inp.value = ventTargets[i] || '';
            }
            if (ventModal) ventModal.style.display = 'flex';
        }

        function closeModal() {
            if (ventModal) ventModal.style.display = 'none';
        }

        function getInputs() {
            const res = [];
            for (let i = 0; i < 5; i++) {
                const inp = document.getElementById(`ventInput${i}`);
                if (inp && inp.value.trim()) {
                    res.push(inp.value.trim().slice(0, 6));
                }
            }
            return res;
        }

        if (btnVentSettings) btnVentSettings.addEventListener('click', openModal);
        if (btnFooterVent) btnFooterVent.addEventListener('click', openModal);
        if (btnCloseVentModal) btnCloseVentModal.addEventListener('click', closeModal);

        if (ventModal) {
            ventModal.addEventListener('click', (e) => {
                if (e.target === ventModal) closeModal();
            });
        }

        // Chip quick fill
        document.querySelectorAll('.chip-item').forEach(chip => {
            chip.addEventListener('click', () => {
                const name = chip.getAttribute('data-name');
                if (!name) return;
                // Find first empty input or overwrite first
                let targetInput = null;
                for (let i = 0; i < 5; i++) {
                    const inp = document.getElementById(`ventInput${i}`);
                    if (inp && !inp.value.trim()) {
                        targetInput = inp;
                        break;
                    }
                }
                if (!targetInput) {
                    targetInput = document.getElementById('ventInput0');
                }
                if (targetInput) {
                    targetInput.value = name;
                    targetInput.focus();
                }
            });
        });

        // Individual clear buttons
        document.querySelectorAll('.btn-clear-input').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                if (targetId) {
                    const inp = document.getElementById(targetId);
                    if (inp) {
                        inp.value = '';
                        inp.focus();
                    }
                }
            });
        });

        if (btnClearAllVent) {
            btnClearAllVent.addEventListener('click', () => {
                for (let i = 0; i < 5; i++) {
                    const inp = document.getElementById(`ventInput${i}`);
                    if (inp) inp.value = '';
                }
            });
        }

        if (btnSaveVent) {
            btnSaveVent.addEventListener('click', () => {
                const targets = getInputs();
                saveVentTargets(targets);
                remainingVentTargets = [...ventTargets];
                closeModal();
                addFloatingText('🎯 目标已保存！', mario.x, mario.y - 50, '#ffd700', 26);
            });
        }

        if (btnSaveAndStartVent) {
            btnSaveAndStartVent.addEventListener('click', () => {
                const targets = getInputs();
                saveVentTargets(targets);
                closeModal();
                startGameMatch();
            });
        }
    }

    // Init Engine
    const btnGameMode = document.getElementById('btnGameMode');
    if (btnGameMode) {
        btnGameMode.addEventListener('click', () => {
            toggleGameMode();
        });
    }

    setupVentingUI();
    setGameMode(currentMode);
    resizeCanvas();
    updateHUD();
    requestAnimationFrame(gameLoop);

    // Export test & control hooks
    window.__nogginKnock = {
        finishGame: finishGame,
        simulateSmash: (name) => {
            if (!smashedVentTargets.includes(name)) smashedVentTargets.push(name);
            const idx = remainingVentTargets.indexOf(name);
            if (idx !== -1) remainingVentTargets.splice(idx, 1);
        },
        setGameMode: setGameMode,
        toggleGameMode: toggleGameMode,
        getGameMode: () => currentMode,
        getHoles: () => HOLES,
        getMario: () => mario,
        spawnRandomMole: spawnRandomMole
    };

})();
