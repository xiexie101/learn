// Core Game Engine, Physics, Level Generator, and Bullet Hell System for INKFALL

class InkfallGame {
    constructor() {
        this.container = document.getElementById('game-canvas-container');
        this.score = 0;
        this.vitals = 100;
        this.maxVitals = 100;
        this.focusEnergy = 100;
        this.maxFocus = 100;
        this.isFocusActive = false;
        this.surgeEnergy = 25; // 0 - 100
        this.isSurgeActive = false;
        this.surgeTimer = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.isVictory = false;

        this.ascentMeters = 1;
        this.maxAscent = 300;
        this.currentZone = '01 / 纸基底层'; // '01 / 纸基底层' | '02 / 狭窄竖井' | '03 / 浮空天桥' | '圣堂巅峰'

        // Controls Input State
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.touchMove = { x: 0, y: 0 };
        this.isTouchActive = false;
        this.autoFire = true;

        // Three.js Setup
        this.initThree();

        // Subsystems
        this.splatters = new SplatterEngine(this.scene);
        this.player = new BallpointStickman(this.scene, true, '#162a56');
        this.player.setPosition(0, 0.6);

        this.boss = null;
        this.bossSpawned = false;

        // Entities
        this.platforms = [];
        this.enemies = [];
        this.bullets = [];
        this.levelAnnotations = [];

        // Screen Shake
        this.screenShake = 0;

        // Build Level
        this.generateAscentTower();

        // Setup Event Listeners
        this.initControls();
        this.bindUi();

        // Start Banner
        this.showBanner('无尽攀登', '命中敌人为超载充能，空中冲刺反弹子弹。');

        // Time tracking
        this.lastTime = performance.now();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    // Initialize Three.js Scene, Camera, and Renderer
    initThree() {
        const width = this.container.clientWidth || 540;
        const height = this.container.clientHeight || 960;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf6f4ed); // Warm notebook paper color

        // Orthographic Camera for crisp, flat 2D blueprint perspective
        const aspect = width / height;
        const frustumSize = 24;
        this.camera = new THREE.OrthographicCamera(
            (-frustumSize * aspect) / 2,
            (frustumSize * aspect) / 2,
            frustumSize / 2,
            -frustumSize / 2,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 50);
        this.camera.lookAt(0, 5, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // 2D Canvas Overlay for Shockwaves, Text, and Blueprint Callouts
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.className = 'overlay-canvas';
        this.overlayCanvas.width = width;
        this.overlayCanvas.height = height;
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.container.appendChild(this.overlayCanvas);

        // Procedural Notebook Paper Grid Background
        this.createNotebookBackground();

        // Resize handler
        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (!width || !height) return;

        const aspect = width / height;
        const frustumSize = 24;
        this.camera.left = (-frustumSize * aspect) / 2;
        this.camera.right = (frustumSize * aspect) / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.overlayCanvas.width = width;
        this.overlayCanvas.height = height;
    }

    // Procedural Lined Notebook Paper Texture
    createNotebookBackground() {
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = 1024;
        bgCanvas.height = 2048;
        const ctx = bgCanvas.getContext('2d');

        // Paper base tone
        ctx.fillStyle = '#f8f6f0';
        ctx.fillRect(0, 0, 1024, 2048);

        // Light Blue Ruled Horizontal Lines
        ctx.strokeStyle = 'rgba(186, 210, 235, 0.45)';
        ctx.lineWidth = 1.5;
        const lineSpacing = 36;
        for (let y = 0; y < 2048; y += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1024, y);
            ctx.stroke();
        }

        // Faint Vertical Grid Lines
        ctx.strokeStyle = 'rgba(215, 225, 238, 0.28)';
        ctx.lineWidth = 1.0;
        const colSpacing = 36;
        for (let x = 0; x < 1024; x += colSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 2048);
            ctx.stroke();
        }

        // Red Margin Line (Left side)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(90, 0);
        ctx.lineTo(90, 2048);
        ctx.stroke();

        // Architectural Compass and Protractor Sketches
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(512, 1024, 380, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(512, 1024, 480, 0, Math.PI * 2);
        ctx.stroke();

        const bgTexture = new THREE.CanvasTexture(bgCanvas);
        bgTexture.wrapS = THREE.RepeatWrapping;
        bgTexture.wrapT = THREE.RepeatWrapping;
        bgTexture.repeat.set(1, 4);

        const bgGeo = new THREE.PlaneGeometry(50, 200);
        const bgMat = new THREE.MeshBasicMaterial({ map: bgTexture, depthWrite: false });
        this.bgMesh = new THREE.Mesh(bgGeo, bgMat);
        this.bgMesh.position.set(0, 100, -1.0);
        this.scene.add(this.bgMesh);
    }

    // Generate Notebook Tower Platforms & Obstacles
    generateAscentTower() {
        // Ground Floor
        this.addPlatform(0, 0, 26, 0.8, false);

        // Left and Right Boundary Spikes / Walls
        this.addWallSpikes(-11.5, 0, 300, -1);
        this.addWallSpikes(11.5, 0, 300, 1);

        // Zone 1: The Roots (0m to 100m, Y: 0 to 60)
        let curY = 3.5;
        this.addAnnotation('开启攀登', 0, 2.5);
        this.addAnnotation('命中敌人为超载充能，空中冲刺反弹子弹。', 0, 5.0);

        const rootsPlatforms = [
            { x: -3.5, y: 4.5, w: 5.5 },
            { x: 3.5, y: 7.5, w: 6.0, enemy: 'gunner' },
            { x: -4.0, y: 11.0, w: 5.0 },
            { x: 0.0, y: 14.5, w: 6.5, enemy: 'sentinel' },
            { x: 4.5, y: 18.0, w: 5.5 },
            { x: -3.0, y: 22.0, w: 6.0, enemy: 'gunner' },
            { x: 3.0, y: 26.0, w: 6.0 },
            { x: 0.0, y: 30.0, w: 7.0, enemy: 'sentinel' },
            { x: -4.5, y: 34.0, w: 5.5 },
            { x: 4.0, y: 38.0, w: 6.0, enemy: 'gunner' },
            { x: 0.0, y: 42.0, w: 6.5 },
            { x: -3.5, y: 46.0, w: 5.5, enemy: 'sentinel' },
            { x: 3.5, y: 50.0, w: 5.5 },
            { x: 0.0, y: 55.0, w: 8.0, label: '休整平台 • 落地保存' }
        ];

        for (const p of rootsPlatforms) {
            this.addPlatform(p.x, p.y, p.w, 0.6);
            if (p.label) this.addAnnotation(p.label, p.x, p.y + 0.8);
            if (p.enemy === 'gunner') {
                this.enemies.push(new RedStickmanEnemy(this.scene, p.x, p.y + 0.6, p));
            } else if (p.enemy === 'sentinel') {
                this.enemies.push(new GlyphSentinel(this.scene, p.x, p.y + 2.5));
            }
        }

        // Zone 2: The Verticals (100m to 200m, Y: 60 to 120) - Vertical Shafts & Wall-Jumping
        this.addAnnotation('蹬墙跳跃', -7.5, 68.0);
        this.addAnnotation('纵身一跃。', 0, 85.0);

        const verticalPlatforms = [
            { x: -6.0, y: 62.0, w: 4.5 },
            { x: 6.0, y: 67.0, w: 4.5, enemy: 'gunner' },
            { x: -6.0, y: 72.0, w: 4.5 },
            { x: 6.0, y: 77.0, w: 4.5, enemy: 'sentinel' },
            { x: 0.0, y: 82.0, w: 5.5 },
            { x: -5.0, y: 88.0, w: 4.5, enemy: 'gunner' },
            { x: 5.0, y: 94.0, w: 4.5 },
            { x: 0.0, y: 100.0, w: 6.0, enemy: 'sentinel' },
            { x: -4.5, y: 106.0, w: 5.0 },
            { x: 4.5, y: 112.0, w: 5.0, enemy: 'gunner' },
            { x: 0.0, y: 118.0, w: 8.0, label: '接近巅峰' }
        ];

        for (const p of verticalPlatforms) {
            this.addPlatform(p.x, p.y, p.w, 0.6);
            if (p.label) this.addAnnotation(p.label, p.x, p.y + 0.8);
            if (p.enemy === 'gunner') {
                this.enemies.push(new RedStickmanEnemy(this.scene, p.x, p.y + 0.6, p));
            } else if (p.enemy === 'sentinel') {
                this.enemies.push(new GlyphSentinel(this.scene, p.x, p.y + 2.5));
            }
        }

        // Zone 3: The Skybridges (200m to 300m, Y: 120 to 180)
        const skyPlatforms = [
            { x: -3.5, y: 125.0, w: 4.5, enemy: 'gunner' },
            { x: 3.5, y: 130.0, w: 4.5, enemy: 'sentinel' },
            { x: -4.0, y: 136.0, w: 5.0 },
            { x: 4.0, y: 142.0, w: 5.0, enemy: 'gunner' },
            { x: 0.0, y: 148.0, w: 6.5, enemy: 'sentinel' },
            { x: -3.5, y: 154.0, w: 4.5 },
            { x: 3.5, y: 160.0, w: 4.5, enemy: 'gunner' },
            { x: 0.0, y: 166.0, w: 7.0 },
            { x: 0.0, y: 174.0, w: 10.0, label: '步入圣堂' }
        ];

        for (const p of skyPlatforms) {
            this.addPlatform(p.x, p.y, p.w, 0.6);
            if (p.label) this.addAnnotation(p.label, p.x, p.y + 0.8);
            if (p.enemy === 'gunner') {
                this.enemies.push(new RedStickmanEnemy(this.scene, p.x, p.y + 0.6, p));
            } else if (p.enemy === 'sentinel') {
                this.enemies.push(new GlyphSentinel(this.scene, p.x, p.y + 2.5));
            }
        }

        // Cathedral Boss Arena (Y: 180 to 220)
        // Arena Floor
        this.bossArenaFloor = this.addPlatform(0, 180.0, 24, 1.0, true);
        // Boss floating platforms for aerial combat
        this.addPlatform(-6.0, 185.5, 4.8, 0.6);
        this.addPlatform(6.0, 185.5, 4.8, 0.6);
        this.addPlatform(0.0, 189.5, 5.5, 0.6);
    }

    // Add Blueprint Platform with Ballpoint Hatching and Triangle Truss Braces
    addPlatform(x, y, w, h, isFloor = false) {
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 256;
        pCanvas.height = 64;
        const pCtx = pCanvas.getContext('2d');

        // Dark Blue Pen Top Line & Border
        pCtx.strokeStyle = '#162a56';
        pCtx.fillStyle = '#faf8f2';
        pCtx.lineWidth = 3.5;
        pCtx.fillRect(0, 0, 256, 32);
        pCtx.strokeRect(0, 0, 256, 32);

        // 45-degree Diagonal Ballpoint Pen Hatching inside platform
        pCtx.beginPath();
        pCtx.lineWidth = 1.5;
        pCtx.strokeStyle = '#2563eb';
        for (let i = -32; i < 256; i += 8) {
            pCtx.moveTo(i, 0);
            pCtx.lineTo(i + 32, 32);
        }
        pCtx.stroke();

        // Triangle Bracing Underneath
        pCtx.beginPath();
        pCtx.strokeStyle = '#94a3b8';
        pCtx.lineWidth = 1.8;
        const trussStep = 32;
        for (let tx = 0; tx < 256; tx += trussStep) {
            pCtx.moveTo(tx, 32);
            pCtx.lineTo(tx + trussStep / 2, 60);
            pCtx.lineTo(tx + trussStep, 32);
        }
        pCtx.stroke();

        const pTex = new THREE.CanvasTexture(pCanvas);
        pTex.wrapS = THREE.RepeatWrapping;
        pTex.repeat.set(w / 4, 1);

        const geo = new THREE.PlaneGeometry(w, h + 0.4);
        const mat = new THREE.MeshBasicMaterial({ map: pTex, transparent: true, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y - (h + 0.4) / 2, 0.0);
        this.scene.add(mesh);

        const platObj = { x, y, w, h, mesh, isFloor, isHazard: false };
        this.platforms.push(platObj);
        return platObj;
    }

    // Add Zigzag Spikes along walls
    addWallSpikes(x, startY, height, side) {
        const spikeCanvas = document.createElement('canvas');
        spikeCanvas.width = 32;
        spikeCanvas.height = 128;
        const sCtx = spikeCanvas.getContext('2d');

        sCtx.strokeStyle = '#94a3b8';
        sCtx.lineWidth = 2.0;
        sCtx.beginPath();
        const numZigs = 8;
        const step = 128 / numZigs;
        for (let z = 0; z < numZigs; z++) {
            const y1 = z * step;
            const y2 = y1 + step / 2;
            const y3 = y1 + step;
            if (side > 0) {
                sCtx.moveTo(32, y1);
                sCtx.lineTo(6, y2);
                sCtx.lineTo(32, y3);
            } else {
                sCtx.moveTo(0, y1);
                sCtx.lineTo(26, y2);
                sCtx.lineTo(0, y3);
            }
        }
        sCtx.stroke();

        const sTex = new THREE.CanvasTexture(spikeCanvas);
        sTex.wrapS = THREE.RepeatWrapping;
        sTex.wrapT = THREE.RepeatWrapping;
        sTex.repeat.set(1, height / 4);

        const geo = new THREE.PlaneGeometry(1.0, height);
        const mat = new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, startY + height / 2, 0.05);
        this.scene.add(mesh);
    }

    // Level Handwritten Blueprint Notes
    addAnnotation(text, x, y) {
        this.levelAnnotations.push({ text, x, y });
    }

    // Controls Setup (Desktop Keyboard + Mouse & Mobile Touch Deck)
    initControls() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (window.InkSound) window.InkSound.init();
            this.keys[e.code] = true;

            if (e.code === 'KeyF') {
                this.toggleFocus();
            } else if (e.code === 'KeyE' || e.code === 'KeyQ') {
                this.activateSurge();
            } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') {
                this.triggerDash();
            } else if (e.code === 'KeyP') {
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse Aiming & Shooting
        window.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
            this.updateAim();
        });

        window.addEventListener('mousedown', (e) => {
            if (window.InkSound) window.InkSound.init();
            if (e.button === 0) { // Left Click
                this.player.isFiring = true;
            } else if (e.button === 2) { // Right Click: Dash
                e.preventDefault();
                this.triggerDash();
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.player.isFiring = false;
            }
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());

        // Virtual Touch Joystick
        const stickEl = document.getElementById('joystick-knob');
        const dpadEl = document.getElementById('joystick-ring');
        if (dpadEl && stickEl) {
            let isDragging = false;
            const handleTouch = (cx, cy) => {
                const rect = dpadEl.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                let dx = (cx - centerX) / (rect.width / 2);
                let dy = -(cy - centerY) / (rect.height / 2);
                const len = Math.hypot(dx, dy);
                if (len > 1) {
                    dx /= len;
                    dy /= len;
                }
                this.touchMove.x = dx;
                this.touchMove.y = dy;
                this.isTouchActive = true;

                // Move visual knob (CSS Y is downwards)
                stickEl.style.transform = `translate(${dx * 35}px, ${-dy * 35}px)`;
            };

            const resetTouch = () => {
                isDragging = false;
                this.touchMove.x = 0;
                this.touchMove.y = 0;
                this.isTouchActive = false;
                stickEl.style.transform = 'translate(0px, 0px)';
            };

            dpadEl.addEventListener('pointerdown', (e) => {
                if (window.InkSound) window.InkSound.init();
                isDragging = true;
                handleTouch(e.clientX, e.clientY);
                dpadEl.setPointerCapture(e.pointerId);
            });

            dpadEl.addEventListener('pointermove', (e) => {
                if (isDragging) handleTouch(e.clientX, e.clientY);
            });

            dpadEl.addEventListener('pointerup', resetTouch);
            dpadEl.addEventListener('pointercancel', resetTouch);
        }

        // Virtual Touch Buttons
        const bindBtn = (id, onDown, onUp) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (window.InkSound) window.InkSound.init();
                if (onDown) onDown();
            });
            el.addEventListener('pointerup', (e) => {
                e.preventDefault();
                if (onUp) onUp();
            });
        };

        bindBtn('btn-jump', () => this.triggerJump());
        bindBtn('btn-dash', () => this.triggerDash());
        bindBtn('btn-focus', () => this.toggleFocus());
        bindBtn('btn-fire', () => {
            this.autoFire = !this.autoFire;
            this.updateFireBtnUi();
        });

        // Surge Bar Tap
        const surgeBarEl = document.getElementById('surge-container');
        if (surgeBarEl) {
            surgeBarEl.addEventListener('click', () => {
                if (this.surgeEnergy >= 40) this.activateSurge();
            });
        }
    }

    // Bind Header Controls & UI
    bindUi() {
        const soundBtn = document.getElementById('btn-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const isMuted = window.InkSound ? window.InkSound.toggleMute() : false;
                soundBtn.textContent = isMuted ? '🔇' : '🔊';
            });
        }

        const fullscreenBtn = document.getElementById('btn-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }

        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const banner = document.getElementById('center-banner');
        if (this.isPaused) {
            this.showBanner('已暂停', '深呼吸。点击暂停按钮继续游戏。');
        } else {
            this.hideBanner();
        }
    }

    toggleFocus() {
        if (this.focusEnergy < 15 && !this.isFocusActive) return;
        this.isFocusActive = !this.isFocusActive;
        if (window.InkSound) window.InkSound.playFocusToggle(this.isFocusActive);
        const focusBtn = document.getElementById('btn-focus');
        if (focusBtn) {
            focusBtn.classList.toggle('active', this.isFocusActive);
        }
    }

    activateSurge() {
        if (this.surgeEnergy < 30 || this.isSurgeActive) return;
        this.isSurgeActive = true;
        this.surgeTimer = (this.surgeEnergy / 100) * 8.0;
        if (window.InkSound) {
            window.InkSound.playPenClick();
            window.InkSound.playShoot(true);
        }
        this.splatters.spawnPaintExplosion(this.player.x, this.player.y, 35, false);
        this.splatters.addFloatingText('超载爆发！', this.player.x, this.player.y + 1.5, '#2563eb', true);
    }

    triggerJump() {
        const p = this.player;
        if (p.isGrounded) {
            p.vy = 16.0;
            p.isGrounded = false;
            p.canDoubleJump = true;
            if (window.InkSound) window.InkSound.playJump();
        } else if (p.isWallSliding) {
            // Wall Kick Jump
            p.vy = 15.0;
            p.vx = -p.wallSide * 12.0;
            p.facing = -p.wallSide;
            p.isWallSliding = false;
            p.canDoubleJump = true;
            p.canDash = true; // reset dash on wall jump!
            if (window.InkSound) {
                window.InkSound.playJump();
                window.InkSound.playPenScratch(1.4, 0.08);
            }
            this.splatters.addFloatingText('蹬墙跳', p.x, p.y + 0.8, '#162a56');
        } else if (p.canDoubleJump) {
            p.vy = 14.5;
            p.canDoubleJump = false;
            if (window.InkSound) window.InkSound.playJump();
            this.splatters.addFloatingText('二段跳', p.x, p.y + 0.8, '#2563eb');
        }
    }

    triggerDash() {
        const p = this.player;
        if (!p.canDash || p.isDashing) return;

        p.isDashing = true;
        p.dashTimer = p.dashDuration;
        p.canDash = false; // Must land or wall touch to refill!
        p.invulnerableTimer = p.dashDuration + 0.05;

        // Determine Dash Direction
        let dx = 0;
        let dy = 0;
        if (this.isTouchActive && (Math.abs(this.touchMove.x) > 0.1 || Math.abs(this.touchMove.y) > 0.1)) {
            dx = this.touchMove.x;
            dy = this.touchMove.y;
        } else {
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
            if (this.keys['KeyW'] || this.keys['ArrowUp']) dy += 0.8;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) dy -= 0.8;
        }

        if (dx === 0 && dy === 0) {
            dx = p.facing;
        }
        const len = Math.hypot(dx, dy) || 1;
        p.dashDir = { x: dx / len, y: dy / len };
        p.vx = p.dashDir.x * p.dashSpeed;
        p.vy = p.dashDir.y * p.dashSpeed;

        if (window.InkSound) window.InkSound.playDash();
        this.splatters.addDashTrail(p.x, p.y, p.facing, p.aimAngle);

        // Crucial Mechanic: "Dash sends bullets back"
        this.deflectBulletsInPath();
    }

    // Bullet Reflection Check (Dash deflects bullets!)
    deflectBulletsInPath() {
        const p = this.player;
        let deflectedCount = 0;

        for (const b of this.bullets) {
            if (!b.isPlayer && !b.isReflected) {
                const dist = Math.hypot(b.x - p.x, b.y - p.y);
                if (dist < 2.4) {
                    b.isPlayer = true;
                    b.isReflected = true;
                    b.life = 5.0;

                    // Reverse & Target Nearest Enemy / Boss
                    let target = this.getNearestEnemy(p.x, p.y);
                    if (target) {
                        const tAng = Math.atan2(target.y - b.y, target.x - b.x);
                        b.vx = Math.cos(tAng) * 16.0;
                        b.vy = Math.sin(tAng) * 16.0;
                    } else {
                        b.vx = -b.vx * 1.5;
                        b.vy = -b.vy * 1.5;
                    }

                    b.colorHex = '#ff2d75'; // Turns vibrant hot magenta
                    deflectedCount++;
                }
            }
        }

        if (deflectedCount > 0) {
            if (window.InkSound) window.InkSound.playDeflect();
            this.addScore(deflectedCount * 300);
            this.surgeEnergy = Math.min(100, this.surgeEnergy + deflectedCount * 12);
            this.splatters.spawnPaintExplosion(p.x, p.y, 30, false, PAINT_COLORS[0]);
            this.splatters.addFloatingText(`弹反 ×${deflectedCount} +${deflectedCount * 300}`, p.x, p.y + 1.2, '#ff2d75', true);
            this.screenShake = 0.4;
        }
    }

    getNearestEnemy(x, y) {
        if (this.boss && this.boss.isAlive) return this.boss;
        let nearest = null;
        let minDist = Infinity;
        for (const e of this.enemies) {
            if (e.isAlive) {
                const d = Math.hypot(e.x - x, e.y - y);
                if (d < minDist) {
                    minDist = d;
                    nearest = e;
                }
            }
        }
        return nearest;
    }

    updateFireBtnUi() {
        const btn = document.getElementById('btn-fire');
        if (!btn) return;
        const sub = btn.querySelector('.btn-sub');
        if (sub) {
            sub.textContent = this.autoFire ? '自动 • 点击切换' : '手动 • 点击开启';
        }
    }

    // Banner Announcement
    showBanner(title, subtitle) {
        const titleEl = document.getElementById('banner-title');
        const subEl = document.getElementById('banner-sub');
        const banner = document.getElementById('center-banner');
        if (titleEl) titleEl.textContent = title;
        if (subEl) subEl.textContent = subtitle;
        if (banner) {
            banner.classList.remove('hidden');
            banner.style.opacity = '1';
        }
        clearTimeout(this.bannerTimer);
        this.bannerTimer = setTimeout(() => {
            this.hideBanner();
        }, 4000);
    }

    hideBanner() {
        const banner = document.getElementById('center-banner');
        if (banner) {
            banner.style.opacity = '0';
            setTimeout(() => banner.classList.add('hidden'), 500);
        }
    }

    addScore(pts) {
        this.score += pts;
    }

    // Main Game Loop
    animate(currentTime) {
        requestAnimationFrame(this.animate);
        const rawDt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        if (this.isPaused) return;

        // Focus Bullet Time Dilation (0.28x speed for world)
        const timeScale = this.isFocusActive ? 0.28 : 1.0;
        const dt = rawDt * timeScale;

        // Focus Energy Management
        if (this.isFocusActive) {
            this.focusEnergy = Math.max(0, this.focusEnergy - 28 * rawDt);
            if (this.focusEnergy <= 0) this.toggleFocus();
        } else {
            this.focusEnergy = Math.min(100, this.focusEnergy + 12 * rawDt);
        }

        // Surge Management
        if (this.isSurgeActive) {
            this.surgeTimer -= rawDt;
            this.surgeEnergy = Math.max(0, (this.surgeTimer / 8.0) * 100);
            if (this.surgeTimer <= 0) {
                this.isSurgeActive = false;
                this.surgeEnergy = 0;
            }
        }

        // Update Physics & Entities
        this.updatePlayer(rawDt, dt);
        this.updateBullets(dt);
        this.updateEnemies(dt);
        this.updateBoss(dt);
        this.splatters.update(dt, this.platforms, this.camera.position.y);

        // Camera Follow & Screen Shake
        this.updateCamera(rawDt);

        // Check Zone Progression
        this.updateZoneProgression();

        // Render Three.js Scene
        this.renderer.render(this.scene, this.camera);

        // Render 2D Canvas Overlays
        this.renderCanvasOverlay();

        // Update HTML UI
        this.updateUi();
    }

    // Update Player Movement, Collisions & Firing
    updatePlayer(rawDt, dt) {
        const p = this.player;

        this.updateAim();

        // Horizontal Movement Input
        let moveX = 0;
        let moveY = 0;
        if (this.isTouchActive) {
            moveX = this.touchMove.x;
            moveY = this.touchMove.y;
        } else {
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY -= 1;
            if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY += 1;
        }

        // Dashing State
        if (p.isDashing) {
            p.dashTimer -= dt;
            p.state = 'dash';
            this.deflectBulletsInPath(); // Continuous bullet reflection during air dash!
            if (p.dashTimer <= 0) {
                p.isDashing = false;
                p.vx *= 0.4;
            }
        } else {
            // Normal Movement
            const moveSpeed = 10.5;
            if (moveX !== 0) {
                p.vx += (moveX * moveSpeed - p.vx) * 14 * dt;
                p.facing = moveX > 0 ? 1 : -1;
            } else {
                p.vx *= Math.pow(0.001, dt);
            }

            // Gravity
            const gravity = p.isWallSliding ? 8.0 : 34.0;
            p.vy -= gravity * dt;

            // Set animation state
            if (moveY < -0.6 && p.isGrounded) {
                p.state = 'crouch';
            } else if (p.isWallSliding) {
                p.state = 'wallslide';
            } else if (!p.isGrounded) {
                p.state = p.vy > 0 ? 'jump' : 'fall';
            } else if (Math.abs(p.vx) > 0.4) {
                p.state = 'run';
            } else {
                p.state = 'idle';
            }
        }

        // Apply velocities with robust platform top landing check
        const prevY = p.y;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Platform Collisions (aligned to stickman feet at p.y - 0.6)
        p.isGrounded = false;
        p.isWallSliding = false;
        p.wallSide = 0;

        const footY = p.y - 0.6;
        const prevFootY = prevY - 0.6;

        for (const plat of this.platforms) {
            // Check landing on top of platform
            if (p.x >= plat.x - plat.w / 2 - 0.35 && p.x <= plat.x + plat.w / 2 + 0.35) {
                const isGroundFloor = plat.y === 0;
                if ((isGroundFloor && p.y <= 0.6) || (prevFootY >= plat.y - 0.6 && footY <= plat.y + 0.4 && p.vy <= 0)) {
                    p.y = plat.y + 0.6;
                    p.vy = 0;
                    p.isGrounded = true;
                    p.canDoubleJump = true;
                    p.canDash = true; // Dash refilled upon landing!

                    // Floor Hazard Check in Boss Phase 2 & 3
                    if (plat.isHazard && plat.isFloor && !this.isVictory) {
                        this.takeDamage(20);
                        p.vy = 14.0; // Knock player up
                        this.splatters.addFloatingText('地面禁区！', p.x, p.y + 1.2, '#dc2626', true);
                    }
                }
            }
        }

        // Wall collisions (left/right bounds & vertical walls)
        const leftLimit = -11.0;
        const rightLimit = 11.0;
        if (p.x <= leftLimit) {
            p.x = leftLimit;
            p.vx = Math.max(0, p.vx);
            if (!p.isGrounded && p.vy < 0) {
                p.isWallSliding = true;
                p.wallSide = -1;
                p.canDash = true; // Touch wall resets dash!
            }
        } else if (p.x >= rightLimit) {
            p.x = rightLimit;
            p.vx = Math.min(0, p.vx);
            if (!p.isGrounded && p.vy < 0) {
                p.isWallSliding = true;
                p.wallSide = 1;
                p.canDash = true; // Touch wall resets dash!
            }
        }

        // Shooting from Player
        const shouldFire = this.autoFire || p.isFiring || this.keys['Space'];
        if (shouldFire && p.fireCooldown <= 0) {
            this.firePlayerBullet();
            p.fireCooldown = this.isSurgeActive ? 0.06 : 0.15;
        }

        p.setPosition(p.x, p.y);
        p.update(rawDt);
    }

    updateAim() {
        const p = this.player;
        if (!p) return;
        const width = this.container.clientWidth || 1;
        const height = this.container.clientHeight || 1;
        const ndcX = (this.mousePos.x / width) * 2 - 1;
        const ndcY = -(this.mousePos.y / height) * 2 + 1;
        const worldMouse = new THREE.Vector3(ndcX, ndcY, 0).unproject(this.camera);

        if (this.isTouchActive && (Math.abs(this.touchMove.x) > 0.05 || Math.abs(this.touchMove.y) > 0.05)) {
            p.facing = this.touchMove.x >= 0 ? 1 : -1;
            p.aimAngle = Math.atan2(this.touchMove.y, this.touchMove.x);
        } else {
            const dx = worldMouse.x - p.x;
            const dy = worldMouse.y - p.y;
            p.aimAngle = Math.atan2(dy, dx);
            if (dx > 0.3) p.facing = 1;
            else if (dx < -0.3) p.facing = -1;
        }
    }

    firePlayerBullet() {
        this.updateAim();
        const p = this.player;
        if (window.InkSound) window.InkSound.playShoot(this.isSurgeActive);

        const spd = 20.0;
        const gunDist = 0.8;
        const bx = p.x + Math.cos(p.aimAngle) * gunDist;
        const by = p.y + Math.sin(p.aimAngle) * gunDist;

        if (this.isSurgeActive) {
            // Triple spread surge fire
            for (let i = -1; i <= 1; i++) {
                const ang = p.aimAngle + i * 0.12;
                this.bullets.push({
                    x: bx,
                    y: by,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    isPlayer: true,
                    isReflected: true,
                    radius: 0.22,
                    life: 4.0,
                    colorHex: '#00f0ff'
                });
            }
            this.screenShake = 0.15;
        } else {
            // Single crisp ballpoint ink bolt
            this.bullets.push({
                x: bx,
                y: by,
                vx: Math.cos(p.aimAngle) * spd,
                vy: Math.sin(p.aimAngle) * spd,
                isPlayer: true,
                isReflected: false,
                radius: 0.18,
                life: 4.0,
                colorHex: '#162a56'
            });
        }
    }

    // Update Bullets & Collisions
    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;

            // Check hit Player
            if (!b.isPlayer && !this.player.isDashing && this.player.invulnerableTimer <= 0) {
                const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
                if (dist < 0.6) {
                    this.takeDamage(12);
                    this.splatters.spawnPaintExplosion(this.player.x, this.player.y, 20, false);
                    b.life = 0;
                }
            }

            // Check hit Enemies
            if (b.isPlayer) {
                for (const e of this.enemies) {
                    if (e.isAlive) {
                        const dist = Math.hypot(b.x - e.x, b.y - e.y);
                        if (dist < 0.8) {
                            const dmg = b.isReflected ? 2.5 : 1.0;
                            e.takeDamage(dmg, this.splatters);
                            this.addScore(dmg * 50);
                            this.surgeEnergy = Math.min(100, this.surgeEnergy + 6);
                            b.life = 0;
                            break;
                        }
                    }
                }

                // Check hit Boss
                if (this.boss && this.boss.isAlive) {
                    const dist = Math.hypot(b.x - this.boss.x, b.y - this.boss.y);
                    if (dist < 3.2) {
                        const dmg = b.isReflected ? 35 : 12;
                        this.boss.takeDamage(dmg, this.splatters, b.isReflected);
                        this.addScore(dmg * 20);
                        this.surgeEnergy = Math.min(100, this.surgeEnergy + 5);
                        b.life = 0;
                    }
                }
            }

            if (b.life <= 0) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateEnemies(dt) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.isAlive) {
                e.update(dt, this.player, this.bullets);
            } else {
                this.enemies.splice(i, 1);
            }
        }
    }

    updateBoss(dt) {
        if (!this.boss && this.player.y >= 175.0 && !this.bossSpawned) {
            this.spawnBoss();
        }

        if (this.boss) {
            this.boss.update(dt, this.player, this.bullets, this.splatters);

            // Phase 2 floor hazard activation
            if (this.boss.phase >= 2 && !this.phase2Announced && !this.boss.isDefeated) {
                this.phase2Announced = true;
                if (this.bossArenaFloor) this.bossArenaFloor.isHazard = true;
                this.showBanner('光环碎裂·地面禁区', '阶段二 • 地面已成为禁区，请留在空中平台');
            }

            // Phase 3 apocalypse activation
            if (this.boss.phase >= 3 && !this.phase3Announced && !this.boss.isDefeated) {
                this.phase3Announced = true;
                this.showBanner('阶段三·终焉末日', '决战时刻 • 斩断神迹');
                if (window.InkSound) window.InkSound.setBgmPhase('boss3');
            }

            // Boss Defeated Victory Check
            if (this.boss.isDefeated && !this.isVictory && !this.isGameOver) {
                this.isVictory = true;
                if (this.bossArenaFloor) this.bossArenaFloor.isHazard = false;
                // Cleanse all existing enemy bullets into celebratory paint bursts!
                for (let i = this.bullets.length - 1; i >= 0; i--) {
                    const b = this.bullets[i];
                    if (!b.isPlayer) {
                        this.splatters.spawnPaintExplosion(b.x, b.y, 16, false);
                        this.bullets.splice(i, 1);
                    }
                }
                this.showBanner('神只是一幅画，', '而你带来了橡皮擦。');
            }
        }
    }

    spawnBoss() {
        this.bossSpawned = true;
        this.boss = new HollowSaintBoss(this.scene, 186.0);
        this.boss.setPosition(3.0, 186.0);
        if (window.InkSound) {
            window.InkSound.setBgmPhase('boss1');
            window.InkSound.playBossPhase(1);
        }
        this.showBanner('空心圣徒', '以墨封神之造物。撕碎这张纸页吧。');
    }

    takeDamage(amount) {
        if (this.isVictory || this.isGameOver) return;
        this.vitals = Math.max(0, this.vitals - amount);
        this.player.invulnerableTimer = 0.8;
        this.screenShake = 0.5;
        if (window.InkSound) window.InkSound.playHit();
        if (this.vitals <= 0 && !this.isGameOver) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        if (this.isVictory) return;
        this.isGameOver = true;
        this.showBanner('墨水耗尽。', '纸页依然空白。点击屏幕重试。');
        const retryHandler = () => {
            location.reload();
        };
        setTimeout(() => {
            window.addEventListener('click', retryHandler, { once: true });
        }, 600);
    }

    // Camera follow with dampening and screen shake
    updateCamera(dt) {
        let targetY = Math.max(8.0, this.player.y + 2.5);
        if (this.player.y >= 172.0) {
            // Lock camera comfortably to the Cathedral arena
            targetY = 186.0;
        }
        this.camera.position.y += (targetY - this.camera.position.y) * 5.0 * dt;

        // Screen Shake
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * 2.0);
            const shakeX = (Math.random() - 0.5) * this.screenShake * 0.8;
            const shakeY = (Math.random() - 0.5) * this.screenShake * 0.8;
            this.camera.position.x = shakeX;
            this.camera.position.y += shakeY;
        } else {
            this.camera.position.x = 0;
        }
    }

    // Zone & Height Progression Tracking
    updateZoneProgression() {
        // Height: 0m at Y=0, 300m at Y=180
        this.ascentMeters = Math.max(0, Math.min(300, Math.floor((this.player.y / 180.0) * 300)));

        const prevZone = this.currentZone;
        if (this.player.y < 60) {
            this.currentZone = '01 / 纸基底层';
        } else if (this.player.y < 120) {
            this.currentZone = '02 / 狭窄竖井';
        } else if (this.player.y < 175) {
            this.currentZone = '03 / 浮空天桥';
        } else {
            this.currentZone = '圣堂巅峰';
        }

        if (prevZone && prevZone !== this.currentZone) {
            if (this.currentZone === '02 / 狭窄竖井') {
                this.showBanner('狭窄竖井', '利用蹬墙跳持续向上攀登');
            } else if (this.currentZone === '03 / 浮空天桥') {
                this.showBanner('浮空天桥', '小心虚空坠落与高空巡视哨兵');
            } else if (this.currentZone === '圣堂巅峰' && !this.bossSpawned) {
                this.showBanner('圣堂巅峰', '已达顶峰，直面圣堂的守望者');
            }
        }
    }

    // Render 2D Canvas Layer (Bullets, Level Annotations, Overlays)
    renderCanvasOverlay() {
        const ctx = this.overlayCtx;
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;
        ctx.clearRect(0, 0, cw, ch);

        const toScreen = (wx, wy) => {
            const v = new THREE.Vector3(wx, wy, 0).project(this.camera);
            return {
                x: ((v.x + 1) / 2) * cw,
                y: ((-v.y + 1) / 2) * ch
            };
        };

        // 0. Draw Cathedral Architectural Blueprint Sketches when at Summit
        if (this.currentZone === '圣堂巅峰' || this.currentZone === 'SUMMIT / THE CATHEDRAL' || this.player.y >= 175) {
            ctx.save();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
            ctx.lineWidth = 1.4;

            // Giant Rose Window behind the boss arena
            const roseCenter = toScreen(0, 188.0);
            const roseRadius = 140;
            ctx.beginPath();
            ctx.arc(roseCenter.x, roseCenter.y, roseRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(roseCenter.x, roseCenter.y, roseRadius * 0.65, 0, Math.PI * 2);
            ctx.stroke();

            // Rose window radial spokes
            for (let sp = 0; sp < 12; sp++) {
                const ang = (sp / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(roseCenter.x + Math.cos(ang) * (roseRadius * 0.65), roseCenter.y + Math.sin(ang) * (roseRadius * 0.65));
                ctx.lineTo(roseCenter.x + Math.cos(ang) * roseRadius, roseCenter.y + Math.sin(ang) * roseRadius);
                ctx.stroke();
            }

            // Gothic Cathedral Arches
            for (let archX of [-8, -4, 0, 4, 8]) {
                const bLeft = toScreen(archX - 1.8, 180.0);
                const bRight = toScreen(archX + 1.8, 180.0);
                const bApex = toScreen(archX, 196.0);
                ctx.beginPath();
                ctx.moveTo(bLeft.x, bLeft.y);
                ctx.lineTo(bLeft.x, bLeft.y - 120);
                ctx.quadraticCurveTo(bLeft.x, bApex.y, bApex.x, bApex.y);
                ctx.quadraticCurveTo(bRight.x, bApex.y, bRight.x, bRight.y - 120);
                ctx.lineTo(bRight.x, bRight.y);
                ctx.stroke();
            }

            // Phase 2: Dangerous Floor Red Hatching ("The floor is no longer safe")
            if (this.boss && this.boss.phase >= 2) {
                const floorScreen = toScreen(0, 180.0);
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.7)';
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                for (let hx = 0; hx < cw; hx += 12) {
                    ctx.moveTo(hx, floorScreen.y);
                    ctx.lineTo(hx + 18, floorScreen.y + 24);
                    ctx.moveTo(hx + 18, floorScreen.y);
                    ctx.lineTo(hx, floorScreen.y + 24);
                }
                ctx.stroke();
            }

            // Phase 3: Apocalypse Red Speed Lines radiating from top and edges ("Outrun the end")
            if (this.boss && this.boss.phase >= 3) {
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.35)';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                for (let rx = 0; rx < cw; rx += 24) {
                    ctx.moveTo(rx, 0);
                    ctx.lineTo(rx + (Math.random() - 0.5) * 40, 80 + Math.random() * 60);
                }
                ctx.stroke();
            }

            ctx.restore();
        }

        // 1. Draw Level Blueprint Annotations
        for (const ann of this.levelAnnotations) {
            const s = toScreen(ann.x, ann.y);
            if (s.y >= -50 && s.y <= ch + 50) {
                ctx.save();
                ctx.font = 'bold 12px "Courier New", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", monospace';
                ctx.fillStyle = 'rgba(100, 116, 139, 0.75)';
                ctx.textAlign = 'center';
                ctx.fillText(ann.text, s.x, s.y);

                // Small blueprint arrow / anchor
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.moveTo(s.x - 20, s.y + 4);
                ctx.lineTo(s.x + 20, s.y + 4);
                ctx.stroke();
                ctx.restore();
            }
        }

        // 2. Draw Bullets (Glowing Ink Beads & Trails)
        for (const b of this.bullets) {
            const s = toScreen(b.x, b.y);
            ctx.save();

            // Glow Aura
            ctx.fillStyle = b.colorHex;
            ctx.shadowColor = b.colorHex;
            ctx.shadowBlur = b.isReflected ? 8 : 4;

            ctx.beginPath();
            ctx.arc(s.x, s.y, b.radius * 24, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, b.radius * 12, 0, Math.PI * 2);
            ctx.fill();

            // Pencil trajectory trail
            const trailDt = 0.04;
            const prevS = toScreen(b.x - b.vx * trailDt, b.y - b.vy * trailDt);
            ctx.strokeStyle = b.colorHex;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(prevS.x, prevS.y);
            ctx.stroke();

            ctx.restore();
        }

        // 3. Render Splatter Engine Overlays (Shockwaves, Floating Texts)
        this.splatters.renderOverlay(ctx, this.camera);
    }

    // Update HTML HUD Elements
    updateUi() {
        // Vitals
        const vitalsFill = document.getElementById('vitals-bar-fill');
        const vitalsVal = document.getElementById('vitals-val');
        if (vitalsFill) vitalsFill.style.width = `${(this.vitals / this.maxVitals) * 100}%`;
        if (vitalsVal) vitalsVal.textContent = `${Math.ceil(this.vitals)} / 100`;

        // Focus & Dash Status
        const focusFill = document.getElementById('focus-bar-fill');
        if (focusFill) focusFill.style.width = `${(this.focusEnergy / this.maxFocus) * 100}%`;

        const dashStatus = document.getElementById('dash-status');
        if (dashStatus) {
            dashStatus.textContent = this.player.canDash ? '冲刺就绪' : '着陆充能';
            dashStatus.style.color = this.player.canDash ? '#162a56' : '#94a3b8';
        }

        // Ascent Height / Boss Bar
        const ascentLabel = document.getElementById('ascent-label');
        const ascentVal = document.getElementById('ascent-val');
        const bossBarContainer = document.getElementById('boss-bar-container');
        const bossBarFill = document.getElementById('boss-bar-fill');

        if (this.boss && this.boss.isAlive) {
            if (ascentLabel) ascentLabel.textContent = '空心圣徒';
            if (ascentVal) ascentVal.textContent = '';
            if (bossBarContainer) bossBarContainer.classList.remove('hidden');
            if (bossBarFill) bossBarFill.style.width = `${(this.boss.hp / this.boss.maxHp) * 100}%`;
        } else {
            if (ascentLabel) ascentLabel.textContent = '↑ 攀登高度';
            if (ascentVal) ascentVal.textContent = `${this.ascentMeters} / 300m`;
            if (bossBarContainer) bossBarContainer.classList.add('hidden');
        }

        // Zone Tag & State Badge
        const zoneTag = document.getElementById('zone-tag');
        if (zoneTag) zoneTag.textContent = this.currentZone;

        const stateBadge = document.getElementById('state-badge');
        if (stateBadge) {
            if (this.boss && this.boss.isAlive) {
                if (this.boss.phase === 1) stateBadge.textContent = '阶段一·神圣束缚';
                else if (this.boss.phase === 2) stateBadge.textContent = '阶段二·光环碎裂';
                else stateBadge.textContent = '阶段三·终焉末日';
            } else {
                stateBadge.textContent = this.currentZone.replace(/^\d+\s*\/\s*/, '');
            }
        }

        // Score
        const scoreVal = document.getElementById('score-val');
        if (scoreVal) scoreVal.textContent = String(this.score).padStart(6, '0');

        // Surge Gauge & Slider Knob
        const surgeKnob = document.getElementById('surge-knob');
        const surgeFill = document.getElementById('surge-fill');
        const surgeVal = document.getElementById('surge-val');
        if (surgeVal) {
            surgeVal.textContent = this.isSurgeActive 
                ? `超载爆发 ${Math.ceil(this.surgeTimer)}秒` 
                : `超载爆发 ${Math.floor(this.surgeEnergy)}%`;
        }
        if (surgeKnob) {
            surgeKnob.style.left = `${this.surgeEnergy}%`;
        }
        if (surgeFill) {
            surgeFill.style.width = `${this.surgeEnergy}%`;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new InkfallGame();
});
