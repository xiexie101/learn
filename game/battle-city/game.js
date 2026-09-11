/**
 * NES Battle City - Main Game Engine
 * Features:
 * - Half-tile corridor alignment & snapping
 * - Dual-layer rendering (trees drawn over tanks and bullets)
 * - Ice inertia sliding
 * - Accurate half-brick & steel destruction
 * - 4 distinct enemy types & red flashing bonus tanks
 * - 7 classic power-ups (Helmet, Clock, Shovel, Star, Grenade, Tank, Gun)
 * - Authentic stage curtain & victory tally screen
 * - Built-in Construction Map Editor
 * - Desktop keyboard & mobile virtual touch controls
 */

class BattleCityGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Logical game dimensions (NES standard: 256 x 224)
        this.WIDTH = 256;
        this.HEIGHT = 224;
        this.PLAY_OFFSET_X = 16;
        this.PLAY_OFFSET_Y = 8;
        this.PLAY_SIZE = 208; // 26 * 8

        // Game States
        this.STATE_TITLE = 0;
        this.STATE_STAGE_START = 1;
        this.STATE_PLAYING = 2;
        this.STATE_TALLY = 3;
        this.STATE_GAMEOVER = 4;
        this.STATE_CONSTRUCTION = 5;

        this.state = this.STATE_TITLE;
        this.menuSelection = 0; // 0: 1 PLAYER, 1: CONSTRUCTION

        // Game progression & score
        this.stage = 1;
        this.selectedStage = 1;
        this.score = 0;
        this.highScore = 20000;
        this.lives = 3;
        this.isCustomStage = false;

        // Active game objects
        this.map = null;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];
        this.powerups = [];
        this.floatingScores = [];
        this.spawns = [];

        // Timers & counters
        this.tick = 0;
        this.waterAnimTimer = 0;
        this.waterFrame = 0;
        this.stageStartTimer = 0;
        this.curtainPos = 0; // 0 (open) to 112 (closed)
        this.curtainTarget = 0;
        this.gameOverY = 224; // slides up to 100

        // Enemy wave management
        this.enemyQueue = [];
        this.bonusIndices = [];
        this.enemiesSpawned = 0;
        this.enemySpawnTimer = 0;
        this.spawnPointIndex = 0;
        this.maxConcurrentEnemies = 4;

        // Powerup active effects
        this.clockFreezeTimer = 0;
        this.shovelTimer = 0;
        this.shovelFlashing = false;
        this.baseDestroyed = false;

        // Tally screen stats
        this.tallyStats = {
            basic: 0,
            fast: 0,
            power: 0,
            armor: 0,
            total: 0
        };
        this.tallyStep = 0;
        this.tallyCounter = 0;
        this.tallyTimer = 0;

        // Map Editor State
        this.editorBrush = 1; // 1: Brick, 2: Steel, 3: Water, 4: Tree, 5: Ice, 0: Eraser
        this.editorMap = null;
        this.isEditorPainting = false;

        // Input state
        this.keys = {};
        this.touchControls = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false
        };
        this.isPaused = false;

        // Bind events and start loop
        this.initStorage();
        this.bindEvents();
        this.initTitle();

        // Game loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initStorage() {
        try {
            const savedHigh = localStorage.getItem('battle_city_hi_score');
            if (savedHigh) this.highScore = parseInt(savedHigh, 10) || 20000;
        } catch (e) {}
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            try {
                localStorage.setItem('battle_city_hi_score', this.highScore.toString());
            } catch (e) {}
        }
    }

    initTitle() {
        this.state = this.STATE_TITLE;
        this.curtainPos = 0;
        window.soundEngine.stopEngine();
    }

    // ==========================================
    // Stage Initialization
    // ==========================================
    startStage(stageNum, isCustom = false, isNewGame = false) {
        if (isNewGame) {
            this.lives = 3;
            this.score = 0;
        }
        this.stage = stageNum;
        this.isCustomStage = isCustom;
        this.state = this.STATE_STAGE_START;
        this.stageStartTimer = 150; // ~2.5 seconds
        this.curtainPos = 112; // closed
        this.curtainTarget = 112;

        let stageData;
        if (isCustom) {
            const customMap = window.levelManager.loadCustomMap() || window.levelManager.generateStage1().map;
            stageData = {
                map: customMap.map(r => [...r]),
                enemies: ['basic', 'basic', 'fast', 'basic', 'fast', 'fast', 'power', 'power', 'basic', 'fast', 'armor', 'power', 'power', 'fast', 'armor', 'armor', 'armor', 'power', 'fast', 'armor'],
                bonusIndices: [3, 10, 16],
                stageNumber: stageNum
            };
        } else {
            stageData = window.levelManager.getStage(stageNum);
        }

        this.map = stageData.map;
        this.enemyQueue = [...stageData.enemies];
        this.bonusIndices = [...stageData.bonusIndices];
        this.enemiesSpawned = 0;
        this.enemySpawnTimer = 30;
        this.spawnPointIndex = 0;

        // Reset entities
        this.bullets = [];
        this.explosions = [];
        this.powerups = [];
        this.floatingScores = [];
        this.spawns = [];
        this.baseDestroyed = false;
        this.clockFreezeTimer = 0;
        this.shovelTimer = 0;
        this.gameOverY = 224;

        // Reset tally
        this.tallyStats = { basic: 0, fast: 0, power: 0, armor: 0, total: 0 };

        // Spawn Player
        this.player = this.createPlayer();

        // Play authentic Battle City intro theme!
        window.soundEngine.playIntroMusic();
    }

    createPlayer() {
        return {
            x: 64, // 8th sub-tile (64px)
            y: 192, // 24th sub-tile (192px)
            width: 16,
            height: 16,
            dir: 0, // UP
            speed: 1.5,
            tier: 0, // 0 to 3
            frame: 0,
            animTimer: 0,
            isMoving: false,
            isSliding: false,
            slideDir: 0,
            slideTimer: 0,
            shieldTimer: 180, // ~3 seconds of invulnerability
            shootCooldown: 0,
            activeBullets: 0,
            isDead: false,
            respawnTimer: 0
        };
    }

    // ==========================================
    // Entity Creators & Spawning
    // ==========================================
    spawnEnemy() {
        if (this.enemyQueue.length === 0) return;
        if (this.enemies.length + this.spawns.length >= this.maxConcurrentEnemies) return;

        // 3 spawn locations along top: Left (0, 0), Center (96, 0), Right (192, 0)
        const spawnXLocations = [0, 96, 192];
        let chosenX = null;
        for (let i = 0; i < 3; i++) {
            const candidateX = spawnXLocations[(this.spawnPointIndex + i) % 3];
            const isOccupiedBySpawn = this.spawns.some(s => Math.abs(s.x - candidateX) < 16 && s.y === 0);
            const isOccupiedByTank = this.checkTankCollision(null, candidateX, 0);
            if (!isOccupiedBySpawn && !isOccupiedByTank) {
                chosenX = candidateX;
                this.spawnPointIndex = (this.spawnPointIndex + i + 1) % 3;
                break;
            }
        }
        if (chosenX === null) return; // All spawn points currently obstructed

        const type = this.enemyQueue.shift();
        const isBonus = this.bonusIndices.includes(this.enemiesSpawned);
        this.enemiesSpawned++;

        // Add shimmering spawn star
        this.spawns.push({
            x: chosenX,
            y: 0,
            timer: 60, // 1 second shimmer
            type: type,
            isBonus: isBonus
        });
    }

    createEnemy(x, y, type, isBonus) {
        let speed = 1.0;
        let bulletSpeed = 2.5;
        let hits = 1;
        let score = 100;

        if (type === 'fast') {
            speed = 1.8;
            bulletSpeed = 3.0;
            score = 200;
        } else if (type === 'power') {
            speed = 1.2;
            bulletSpeed = 4.5;
            score = 300;
        } else if (type === 'armor') {
            speed = 1.0;
            bulletSpeed = 2.5;
            hits = 4;
            score = 400;
        }

        return {
            x: x,
            y: y,
            width: 16,
            height: 16,
            type: type,
            dir: 2, // start facing DOWN towards base
            speed: speed,
            bulletSpeed: bulletSpeed,
            hitsLeft: hits,
            scoreValue: score,
            isBonus: isBonus,
            frame: 0,
            animTimer: 0,
            moveTimer: 0,
            shootTimer: Math.floor(Math.random() * 60) + 30,
            turnTimer: Math.floor(Math.random() * 120) + 60
        };
    }

    createBullet(owner, x, y, dir, speed, canBreakSteel = false) {
        let bx = x;
        let by = y;
        if (dir === 0) { // UP
            bx = x + 6;
            by = y - 4;
        } else if (dir === 1) { // RIGHT
            bx = x + 16;
            by = y + 6;
        } else if (dir === 2) { // DOWN
            bx = x + 6;
            by = y + 16;
        } else if (dir === 3) { // LEFT
            bx = x - 4;
            by = y + 6;
        }

        return {
            owner: owner, // 'player' or 'enemy'
            x: bx,
            y: by,
            dir: dir,
            speed: speed,
            canBreakSteel: canBreakSteel,
            isDead: false
        };
    }

    createExplosion(x, y, isBig = false) {
        this.explosions.push({
            x: x,
            y: y,
            frame: 0,
            timer: 0,
            maxFrame: isBig ? 5 : 3,
            isBig: isBig
        });
        window.soundEngine.playExplosion(isBig);
    }

    spawnPowerup() {
        const types = ['helmet', 'clock', 'shovel', 'star', 'grenade', 'tank', 'gun'];
        const chosen = types[Math.floor(Math.random() * types.length)];

        // Find a random valid open spot on the 26x26 map (avoid edges, water, steel, eagle base)
        let rx = 32;
        let ry = 32;
        let attempts = 0;
        do {
            const col = 2 + Math.floor(Math.random() * 22);
            const row = 2 + Math.floor(Math.random() * 20);
            rx = col * 8;
            ry = row * 8;
            attempts++;
            if (!this.map) break;
            const tile = this.map[row][col];
            // Must not be steel (2), water (3), or eagle base (6)
            if (tile !== 2 && tile !== 3 && tile !== 6) break;
        } while (attempts < 50);

        this.powerups.push({
            x: rx,
            y: ry,
            type: chosen,
            timer: 900 // 15 seconds visibility
        });
        window.soundEngine.playPowerupSpawn();
    }

    addFloatingScore(text, x, y) {
        this.floatingScores.push({
            text: text,
            x: x,
            y: y,
            timer: 45 // 0.75 seconds
        });
    }

    // ==========================================
    // Half-Tile Snapping & Physics
    // ==========================================
    /**
     * Classic NES half-tile corridor alignment.
     * When turning perpendicular, nudges the tank into the 8-pixel corridor
     * so it never gets stuck on wall corners!
     */
    tryMoveTank(tank, requestedDir) {
        const speed = tank.speed;
        let newDir = requestedDir;

        // 1. Grid alignment assist on direction change
        if (newDir !== tank.dir) {
            tank.dir = newDir;
        }

        let targetX = tank.x;
        let targetY = tank.y;
        let alignX = tank.x;
        let alignY = tank.y;

        if (tank.dir === 0 || tank.dir === 2) { // Moving UP or DOWN
            // Align X to nearest 8-pixel sub-tile
            const modX = tank.x % 8;
            if (modX !== 0) {
                if (modX <= 3) {
                    alignX -= Math.min(speed, modX);
                } else {
                    alignX += Math.min(speed, 8 - modX);
                }
            }
            targetX = alignX;
            targetY += (tank.dir === 0 ? -speed : speed);
        } else { // Moving LEFT or RIGHT
            // Align Y to nearest 8-pixel sub-tile
            const modY = tank.y % 8;
            if (modY !== 0) {
                if (modY <= 3) {
                    alignY -= Math.min(speed, modY);
                } else {
                    alignY += Math.min(speed, 8 - modY);
                }
            }
            targetY = alignY;
            targetX += (tank.dir === 3 ? -speed : speed);
        }

        // 2. Playfield boundary check (0 to 192)
        targetX = Math.max(0, Math.min(192, targetX));
        targetY = Math.max(0, Math.min(192, targetY));

        // 3. Collision check against terrain & tanks
        if (!this.checkTerrainCollision(targetX, targetY) && !this.checkTankCollision(tank, targetX, targetY)) {
            tank.x = targetX;
            tank.y = targetY;
            tank.isMoving = true;

            // Tread animation
            tank.animTimer++;
            if (tank.animTimer >= 6) {
                tank.animTimer = 0;
                tank.frame = 1 - tank.frame;
            }

            // Check ice sliding
            if (this.isTankOnIce(tank.x, tank.y)) {
                tank.isSliding = true;
                tank.slideDir = tank.dir;
                tank.slideTimer = 16;
            } else {
                tank.isSliding = false;
            }
            return true;
        }

        // 4. Two-phase alignment: if forward move is blocked (e.g. corner caught while misaligned),
        // check if pure alignment nudge is clear so the tank can align and glide into the corridor!
        if (tank.dir === 0 || tank.dir === 2) {
            if (alignX !== tank.x && !this.checkTerrainCollision(alignX, tank.y) && !this.checkTankCollision(tank, alignX, tank.y)) {
                tank.x = alignX;
                tank.isMoving = true;
                tank.animTimer++;
                if (tank.animTimer >= 6) {
                    tank.animTimer = 0;
                    tank.frame = 1 - tank.frame;
                }
                return true;
            }
        } else {
            if (alignY !== tank.y && !this.checkTerrainCollision(tank.x, alignY) && !this.checkTankCollision(tank, tank.x, alignY)) {
                tank.y = alignY;
                tank.isMoving = true;
                tank.animTimer++;
                if (tank.animTimer >= 6) {
                    tank.animTimer = 0;
                    tank.frame = 1 - tank.frame;
                }
                return true;
            }
        }

        tank.isMoving = false;
        return false;
    }

    checkTerrainCollision(x, y) {
        if (!this.map) return false;
        const leftCol = Math.floor(x / 8);
        const rightCol = Math.floor((x + 15) / 8);
        const topRow = Math.floor(y / 8);
        const bottomRow = Math.floor((y + 15) / 8);

        for (let r = topRow; r <= bottomRow; r++) {
            for (let c = leftCol; c <= rightCol; c++) {
                if (r < 0 || r >= 26 || c < 0 || c >= 26) return true;
                const tile = this.map[r][c];
                // Impassable tiles: 1 (Brick), 2 (Steel), 3 (Water), 6 (Eagle Base)
                if (tile === 1 || tile === 2 || tile === 3 || tile === 6) {
                    return true;
                }
            }
        }
        return false;
    }

    checkTankCollision(selfTank, targetX, targetY) {
        const selfBox = { x: targetX, y: targetY, w: 16, h: 16 };
        const curBox = selfTank ? { x: selfTank.x, y: selfTank.y, w: 16, h: 16 } : null;

        // If tanks already overlap, allow movement that increases distance to resolve stuck states
        const isSeparating = (other) => {
            if (!curBox || !this.boxesOverlap(curBox, { x: other.x, y: other.y, w: 16, h: 16 })) return false;
            const curDistSq = (selfTank.x - other.x) ** 2 + (selfTank.y - other.y) ** 2;
            const newDistSq = (targetX - other.x) ** 2 + (targetY - other.y) ** 2;
            return newDistSq > curDistSq;
        };

        // Check against player
        if (this.player && !this.player.isDead && selfTank !== this.player) {
            if (this.boxesOverlap(selfBox, { x: this.player.x, y: this.player.y, w: 16, h: 16 })) {
                if (!isSeparating(this.player)) return true;
            }
        }

        // Check against enemies
        for (const enemy of this.enemies) {
            if (enemy !== selfTank) {
                if (this.boxesOverlap(selfBox, { x: enemy.x, y: enemy.y, w: 16, h: 16 })) {
                    if (!isSeparating(enemy)) return true;
                }
            }
        }
        return false;
    }

    boxesOverlap(b1, b2) {
        return b1.x < b2.x + b2.w &&
               b1.x + b1.w > b2.x &&
               b1.y < b2.y + b2.h &&
               b1.y + b1.h > b2.y;
    }

    isTankOnIce(x, y) {
        if (!this.map) return false;
        const midX = Math.floor((x + 8) / 8);
        const midY = Math.floor((y + 8) / 8);
        if (midY >= 0 && midY < 26 && midX >= 0 && midX < 26) {
            return this.map[midY][midX] === 5;
        }
        return false;
    }

    // ==========================================
    // Bullet Update & Half-Brick Destruction
    // ==========================================
    updateBullets() {
        // Pre-check for already overlapping bullets
        for (let i = 0; i < this.bullets.length; i++) {
            const b1 = this.bullets[i];
            if (b1.isDead) continue;
            for (let j = i + 1; j < this.bullets.length; j++) {
                const b2 = this.bullets[j];
                if (b2.isDead) continue;
                if (b1.owner !== b2.owner) {
                    if (this.boxesOverlap({ x: b1.x, y: b1.y, w: 4, h: 4 }, { x: b2.x, y: b2.y, w: 4, h: 4 })) {
                        b1.isDead = true;
                        b2.isDead = true;
                        this.createExplosion((b1.x + b2.x) / 2, (b1.y + b2.y) / 2, false);
                        window.soundEngine.playBulletClash();
                    }
                }
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (b.isDead) {
                if (b.owner === 'player' && this.player) {
                    this.player.activeBullets = Math.max(0, this.player.activeBullets - 1);
                }
                this.bullets.splice(i, 1);
                continue;
            }

            // Move bullet with micro-stepping (<= 2px per step) for continuous collision
            const steps = Math.max(1, Math.ceil(b.speed / 2));
            const stepDist = b.speed / steps;

            for (let s = 0; s < steps; s++) {
                const prevX = b.x;
                const prevY = b.y;

                if (b.dir === 0) b.y -= stepDist;
                else if (b.dir === 1) b.x += stepDist;
                else if (b.dir === 2) b.y += stepDist;
                else if (b.dir === 3) b.x -= stepDist;

                // 1. Screen boundaries
                if (b.x < 0 || b.x > 204 || b.y < 0 || b.y > 204) {
                    b.isDead = true;
                    this.createExplosion(b.x, b.y, false);
                    window.soundEngine.playSteelHit();
                    break;
                }

                // 2. Bullet vs Bullet Collision (Continuous Swept Bounding Box)
                const bSwept = {
                    x: Math.min(prevX, b.x),
                    y: Math.min(prevY, b.y),
                    w: Math.abs(b.x - prevX) + 4,
                    h: Math.abs(b.y - prevY) + 4
                };

                for (let j = 0; j < this.bullets.length; j++) {
                    const other = this.bullets[j];
                    if (other !== b && !other.isDead && b.owner !== other.owner) {
                        const otherBox = { x: other.x, y: other.y, w: 4, h: 4 };
                        if (this.boxesOverlap(bSwept, otherBox)) {
                            b.isDead = true;
                            other.isDead = true;
                            this.createExplosion((b.x + other.x) / 2, (b.y + other.y) / 2, false);
                            window.soundEngine.playBulletClash();
                            break;
                        }
                    }
                }
                if (b.isDead) break;

                // 3. Bullet vs Terrain (Half-Brick Destruction)
                if (this.handleBulletTerrainCollision(b)) {
                    b.isDead = true;
                    break;
                }

                // 4. Bullet vs Tanks
                if (this.handleBulletTankCollision(b)) {
                    b.isDead = true;
                    break;
                }
            }

            if (b.isDead) {
                if (b.owner === 'player' && this.player) {
                    this.player.activeBullets = Math.max(0, this.player.activeBullets - 1);
                }
                this.bullets.splice(i, 1);
            }
        }
    }

    handleBulletTerrainCollision(b) {
        if (!this.map) return false;
        const bBox = { x: b.x, y: b.y, w: 4, h: 4 };

        const leftCol = Math.floor(b.x / 8);
        const rightCol = Math.floor((b.x + 3) / 8);
        const topRow = Math.floor(b.y / 8);
        const bottomRow = Math.floor((b.y + 3) / 8);

        let collided = false;
        let destroyedBricks = 0;

        for (let r = topRow; r <= bottomRow; r++) {
            for (let c = leftCol; c <= rightCol; c++) {
                if (r < 0 || r >= 26 || c < 0 || c >= 26) continue;
                const tile = this.map[r][c];

                if (tile === 1) { // Brick Wall
                    this.map[r][c] = 0; // destroyed
                    destroyedBricks++;
                    collided = true;
                } else if (tile === 2) { // Steel Wall
                    if (b.canBreakSteel) {
                        this.map[r][c] = 0;
                        collided = true;
                    } else {
                        collided = true;
                        window.soundEngine.playSteelHit();
                    }
                } else if (tile === 6) { // Eagle Base Hit!
                    this.destroyEagleBase();
                    collided = true;
                }
            }
        }

        if (collided) {
            if (destroyedBricks > 0) {
                window.soundEngine.playBrickHit();
            }
            this.createExplosion(b.x, b.y, false);
            return true;
        }
        return false;
    }

    handleBulletTankCollision(b) {
        const bBox = { x: b.x, y: b.y, w: 4, h: 4 };

        // Player bullet hitting enemies
        if (b.owner === 'player') {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (this.boxesOverlap(bBox, { x: enemy.x, y: enemy.y, w: 16, h: 16 })) {
                    enemy.hitsLeft--;

                    if (enemy.hitsLeft <= 0) {
                        // Enemy Destroyed
                        this.createExplosion(enemy.x, enemy.y, true);
                        this.score += enemy.scoreValue;
                        this.saveHighScore();
                        this.addFloatingScore(`${enemy.scoreValue}`, enemy.x, enemy.y);

                        // Record kill tally
                        this.tallyStats[enemy.type]++;
                        this.tallyStats.total++;

                        // Spawn powerup if bonus tank
                        if (enemy.isBonus) {
                            this.spawnPowerup();
                        }

                        this.enemies.splice(i, 1);
                    } else {
                        // Armor tank took damage
                        this.createExplosion(b.x, b.y, false);
                        window.soundEngine.playBrickHit();
                    }
                    return true;
                }
            }
        }

        // Enemy bullet hitting player
        if (b.owner === 'enemy') {
            if (this.player && !this.player.isDead) {
                if (this.boxesOverlap(bBox, { x: this.player.x, y: this.player.y, w: 16, h: 16 })) {
                    if (this.player.shieldTimer > 0) {
                        // Deflected by shield
                        this.createExplosion(b.x, b.y, false);
                        window.soundEngine.playSteelHit();
                    } else {
                        // Player destroyed!
                        this.destroyPlayer();
                    }
                    return true;
                }
            }
        }

        return false;
    }

    destroyPlayer() {
        this.createExplosion(this.player.x, this.player.y, true);
        this.player.isDead = true;
        this.player.tier = 0; // reset upgrades
        this.lives--;
        window.soundEngine.stopEngine();

        if (this.lives > 0) {
            this.player.respawnTimer = 90; // 1.5 seconds
        } else {
            this.triggerGameOver();
        }
    }

    destroyEagleBase() {
        if (this.baseDestroyed) return;
        this.baseDestroyed = true;
        this.createExplosion(96, 192, true);
        this.triggerGameOver();
    }

    triggerGameOver() {
        this.state = this.STATE_GAMEOVER;
        this.gameOverY = 224;
        window.soundEngine.stopEngine();
        window.soundEngine.playGameOver();
    }

    // ==========================================
    // Power-up Application
    // ==========================================
    updatePowerups() {
        if (!this.player || this.player.isDead) return;
        const pBox = { x: this.player.x, y: this.player.y, w: 16, h: 16 };

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.timer--;

            if (p.timer <= 0) {
                this.powerups.splice(i, 1);
                continue;
            }

            if (this.boxesOverlap(pBox, { x: p.x, y: p.y, w: 16, h: 16 })) {
                this.applyPowerup(p.type);
                this.score += 500;
                this.saveHighScore();
                this.addFloatingScore('500', p.x, p.y);
                window.soundEngine.playPowerupPickup();
                this.powerups.splice(i, 1);
            }
        }
    }

    applyPowerup(type) {
        switch (type) {
            case 'helmet':
                this.player.shieldTimer = 600; // 10 seconds
                break;
            case 'clock':
                this.clockFreezeTimer = 600; // 10 seconds
                break;
            case 'shovel':
                this.activateShovel();
                break;
            case 'star':
                this.player.tier = Math.min(3, this.player.tier + 1);
                break;
            case 'grenade':
                // Destroy all currently active enemies
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const e = this.enemies[i];
                    this.createExplosion(e.x, e.y, true);
                    this.score += e.scoreValue;
                    this.tallyStats[e.type]++;
                    this.tallyStats.total++;
                    if (e.isBonus) this.spawnPowerup();
                }
                this.enemies = [];
                this.saveHighScore();
                break;
            case 'tank':
                this.lives++;
                window.soundEngine.playLifeUp();
                break;
            case 'gun':
                this.player.tier = 3; // instant max upgrade
                break;
        }
    }

    activateShovel() {
        this.shovelTimer = 1200; // 20 seconds
        this.shovelFlashing = false;
        this.setFortressTiles(2); // Steel
    }

    updateShovel() {
        if (this.shovelTimer <= 0) return;
        this.shovelTimer--;

        if (this.shovelTimer > 240) {
            // Solid steel
            this.setFortressTiles(2);
        } else if (this.shovelTimer > 0) {
            // Flash between steel and brick every 16 frames
            const isSteel = Math.floor(this.shovelTimer / 16) % 2 === 0;
            this.setFortressTiles(isSteel ? 2 : 1);
        } else {
            // Revert to fresh brick
            this.setFortressTiles(1);
        }
    }

    setFortressTiles(tileType) {
        if (!this.map || this.baseDestroyed) return;
        const fortressCoords = [
            [23, 11], [23, 12], [23, 13], [23, 14],
            [24, 11], [24, 14],
            [25, 11], [25, 14]
        ];
        fortressCoords.forEach(([r, c]) => {
            this.map[r][c] = tileType;
        });
    }

    // ==========================================
    // Enemy AI & Movement
    // ==========================================
    updateEnemies() {
        if (this.clockFreezeTimer > 0) {
            this.clockFreezeTimer--;
            return; // Frozen by clock powerup
        }

        for (const enemy of this.enemies) {
            enemy.moveTimer++;
            enemy.turnTimer--;
            enemy.shootTimer--;

            // Periodic direction change or if blocked
            let moved = false;
            if (enemy.turnTimer <= 0) {
                this.chooseEnemyDirection(enemy);
                enemy.turnTimer = Math.floor(Math.random() * 100) + 40;
            }

            moved = this.tryMoveTank(enemy, enemy.dir);
            if (!moved) {
                this.chooseEnemyDirection(enemy);
            }

            // Shooting logic
            if (enemy.shootTimer <= 0) {
                enemy.shootTimer = Math.floor(Math.random() * 80) + 40;
                this.enemyShoot(enemy);
            }
        }
    }

    chooseEnemyDirection(enemy) {
        const rand = Math.random();
        if (rand < 0.40) {
            // 40% bias to move DOWN towards base
            enemy.dir = 2;
        } else if (rand < 0.65) {
            // 25% bias to turn towards player
            if (this.player && !this.player.isDead) {
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    enemy.dir = dx > 0 ? 1 : 3;
                } else {
                    enemy.dir = dy > 0 ? 2 : 0;
                }
            } else {
                enemy.dir = Math.floor(Math.random() * 4);
            }
        } else {
            // Random turn
            enemy.dir = Math.floor(Math.random() * 4);
        }
    }

    enemyShoot(enemy) {
        this.bullets.push(this.createBullet('enemy', enemy.x, enemy.y, enemy.dir, enemy.bulletSpeed));
        window.soundEngine.playShoot();
    }

    // ==========================================
    // Player Controls & Update
    // ==========================================
    updatePlayer() {
        if (!this.player) return;

        // Respawn handling
        if (this.player.isDead) {
            if (this.player.respawnTimer > 0) {
                this.player.respawnTimer--;
                if (this.player.respawnTimer <= 0) {
                    this.player = this.createPlayer();
                }
            }
            return;
        }

        if (this.player.shieldTimer > 0) {
            this.player.shieldTimer--;
        }

        if (this.player.shootCooldown > 0) {
            this.player.shootCooldown--;
        }

        // Determine requested movement
        let requestedDir = -1;
        if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.up) requestedDir = 0;
        else if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right) requestedDir = 1;
        else if (this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchControls.down) requestedDir = 2;
        else if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left) requestedDir = 3;

        let isMoving = false;
        if (requestedDir !== -1) {
            isMoving = this.tryMoveTank(this.player, requestedDir);
        } else if (this.player.isSliding && this.player.slideTimer > 0) {
            // Inertia slide on ice
            this.player.slideTimer--;
            isMoving = this.tryMoveTank(this.player, this.player.slideDir);
            if (!isMoving) this.player.isSliding = false;
        } else {
            this.player.isMoving = false;
        }

        // Engine sound modulation
        window.soundEngine.updateEngine(isMoving);

        // Firing shell
        const isFirePressed = this.keys['Space'] || this.keys['KeyJ'] || this.keys['KeyK'] || this.touchControls.fire;
        if (isFirePressed && this.player.shootCooldown <= 0) {
            const maxBullets = this.player.tier >= 2 ? 2 : 1;
            if (this.player.activeBullets < maxBullets) {
                const bulletSpeed = this.player.tier >= 1 ? 4.5 : 3.0;
                const canBreakSteel = this.player.tier === 3;

                this.bullets.push(this.createBullet('player', this.player.x, this.player.y, this.player.dir, bulletSpeed, canBreakSteel));
                this.player.activeBullets++;
                this.player.shootCooldown = 15;
                window.soundEngine.playShoot();
            }
        }
    }

    // ==========================================
    // Main Game Loop & State Updates
    // ==========================================
    update() {
        this.tick++;

        // Water wave animation
        this.waterAnimTimer++;
        if (this.waterAnimTimer >= 20) {
            this.waterAnimTimer = 0;
            this.waterFrame = (this.waterFrame + 1) % 2;
        }

        if (this.state === this.STATE_STAGE_START) {
            this.stageStartTimer--;
            // Open curtain smoothly
            if (this.stageStartTimer < 30) {
                this.curtainPos = Math.max(0, this.curtainPos - 4);
            }
            if (this.stageStartTimer <= 0) {
                this.state = this.STATE_PLAYING;
                this.curtainPos = 0;
            }
            return;
        }

        if (this.state === this.STATE_PLAYING) {
            this.updatePlayer();
            this.updateEnemies();
            this.updateBullets();
            this.updatePowerups();
            this.updateShovel();

            // Spawn pending enemies with responsive cadence
            this.enemySpawnTimer--;
            if (this.enemySpawnTimer <= 0) {
                const currentCount = this.enemies.length + this.spawns.length;
                if (currentCount < this.maxConcurrentEnemies && this.enemyQueue.length > 0) {
                    this.spawnEnemy();
                    // If still under concurrent limit, spawn next quickly (35 frames); otherwise 75 frames
                    this.enemySpawnTimer = (this.enemies.length + this.spawns.length < this.maxConcurrentEnemies) ? 35 : 75;
                } else {
                    this.enemySpawnTimer = 30;
                }
            }

            // Update spawn shimmers
            for (let i = this.spawns.length - 1; i >= 0; i--) {
                const sp = this.spawns[i];
                sp.timer--;
                if (sp.timer <= 0) {
                    // Check if tank is still parked on spawn point
                    if (this.checkTankCollision(null, sp.x, sp.y)) {
                        sp.timer = 15; // delay until zone is clear
                        continue;
                    }
                    this.enemies.push(this.createEnemy(sp.x, sp.y, sp.type, sp.isBonus));
                    this.spawns.splice(i, 1);
                }
            }

            // Update explosions
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                const exp = this.explosions[i];
                exp.timer++;
                if (exp.timer >= 4) {
                    exp.timer = 0;
                    exp.frame++;
                    if (exp.frame >= exp.maxFrame) {
                        this.explosions.splice(i, 1);
                    }
                }
            }

            // Update floating scores
            for (let i = this.floatingScores.length - 1; i >= 0; i--) {
                const fs = this.floatingScores[i];
                fs.y -= 0.3;
                fs.timer--;
                if (fs.timer <= 0) {
                    this.floatingScores.splice(i, 1);
                }
            }

            // Check Stage Complete (all 20 enemies killed)
            if (this.enemyQueue.length === 0 && this.spawns.length === 0 && this.enemies.length === 0) {
                this.startTallyScreen();
            }
            return;
        }

        if (this.state === this.STATE_TALLY) {
            this.updateTallyScreen();
            return;
        }

        if (this.state === this.STATE_GAMEOVER) {
            if (this.gameOverY > 100) {
                this.gameOverY -= 2;
            }
            return;
        }
    }

    startTallyScreen() {
        this.state = this.STATE_TALLY;
        this.tallyStep = 0;
        this.tallyCounter = 0;
        this.tallyTimer = 0;
        window.soundEngine.stopEngine();
    }

    updateTallyScreen() {
        this.tallyTimer++;
        if (this.tallyTimer % 8 === 0) {
            const types = ['basic', 'fast', 'power', 'armor'];
            if (this.tallyStep < 4) {
                const currentType = types[this.tallyStep];
                const target = this.tallyStats[currentType];
                if (this.tallyCounter < target) {
                    this.tallyCounter++;
                    window.soundEngine.playTallyTick();
                } else {
                    this.tallyStep++;
                    this.tallyCounter = 0;
                }
            } else if (this.tallyStep === 4) {
                // Tally finished
                window.soundEngine.playTallyEnd();
                this.tallyStep = 5;
                this.tallyTimer = 0;
            } else if (this.tallyStep === 5 && this.tallyTimer > 120) {
                // Advance to next stage!
                this.startStage(this.stage + 1, this.isCustomStage);
            }
        }
    }

    // ==========================================
    // Rendering Pipeline (Dual-Layer Foliage)
    // ==========================================
    render() {
        const ctx = this.ctx;
        const sp = window.spriteEngine;

        // Clear canvas (NES grey frame)
        ctx.fillStyle = sp.palette.greyDark;
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        if (this.state === this.STATE_TITLE) {
            this.renderTitleScreen();
            return;
        }

        if (this.state === this.STATE_CONSTRUCTION) {
            this.renderConstructionScreen();
            return;
        }

        if (this.state === this.STATE_TALLY) {
            this.renderTallyScreen();
            return;
        }

        // Playfield black background
        ctx.fillStyle = sp.palette.black;
        ctx.fillRect(this.PLAY_OFFSET_X, this.PLAY_OFFSET_Y, this.PLAY_SIZE, this.PLAY_SIZE);

        ctx.save();
        ctx.translate(this.PLAY_OFFSET_X, this.PLAY_OFFSET_Y);

        // ----------------------------------------------------
        // LAYER 1: Ground, Ice, Water, Brick, Steel, Eagle Base
        // ----------------------------------------------------
        if (this.map) {
            for (let r = 0; r < 26; r++) {
                for (let c = 0; c < 26; c++) {
                    const tile = this.map[r][c];
                    // Skip Trees (Layer 2) and Eagle Base (drawn separately)
                    if (tile !== 0 && tile !== 4 && tile !== 6) {
                        sp.drawTerrainTile(ctx, c * 8, r * 8, tile, this.waterFrame);
                    }
                }
            }

            // Draw Eagle Base (16x16 at 96, 192)
            sp.drawEagle(ctx, 96, 192, this.baseDestroyed);
        }

        // ----------------------------------------------------
        // LAYER 2: Entities (Powerups, Tanks, Bullets, Explosions)
        // ----------------------------------------------------

        // Powerups (flashing)
        if (Math.floor(this.tick / 6) % 2 === 0) {
            for (const p of this.powerups) {
                sp.drawPowerup(ctx, p.x, p.y, p.type);
            }
        }

        // Spawn shimmer stars
        for (const s of this.spawns) {
            const frame = Math.floor((60 - s.timer) / 15) % 4;
            sp.drawSpawnShimmer(ctx, s.x, s.y, frame);
        }

        // Enemies
        for (const enemy of this.enemies) {
            const isFlashingRed = enemy.isBonus && (Math.floor(this.tick / 4) % 2 === 0);
            sp.drawTank(ctx, enemy.x, enemy.y, enemy.type, 0, enemy.dir, enemy.frame, isFlashingRed, enemy.hitsLeft);
        }

        // Player Tank
        if (this.player && !this.player.isDead) {
            sp.drawTank(ctx, this.player.x, this.player.y, 'player', this.player.tier, this.player.dir, this.player.frame, false, 1);
            // Invulnerability shield
            if (this.player.shieldTimer > 0) {
                sp.drawShield(ctx, this.player.x, this.player.y, this.tick);
            }
        }

        // Bullets
        for (const b of this.bullets) {
            sp.drawBullet(ctx, b.x, b.y);
        }

        // Explosions
        for (const exp of this.explosions) {
            sp.drawExplosion(ctx, exp.x, exp.y, exp.frame, exp.isBig);
        }

        // Floating score popups
        for (const fs of this.floatingScores) {
            sp.drawText(ctx, fs.text, fs.x, fs.y, sp.palette.white, 1);
        }

        // ----------------------------------------------------
        // LAYER 3: OVERLAY - Trees / Foliage (Drawn OVER Tanks & Bullets!)
        // ----------------------------------------------------
        if (this.map) {
            for (let r = 0; r < 26; r++) {
                for (let c = 0; c < 26; c++) {
                    if (this.map[r][c] === 4) { // Trees
                        sp.drawTerrainTile(ctx, c * 8, r * 8, 4);
                    }
                }
            }
        }

        ctx.restore();

        // ----------------------------------------------------
        // LAYER 4: Authentic HUD (Right Sidebar, 32px wide)
        // ----------------------------------------------------
        this.renderHUD();

        // ----------------------------------------------------
        // LAYER 5: Stage Curtains & Game Over
        // ----------------------------------------------------
        if (this.state === this.STATE_STAGE_START) {
            this.renderStageCurtain();
        } else if (this.state === this.STATE_GAMEOVER) {
            this.renderGameOver();
        }

        // Pause overlay
        if (this.isPaused) {
            sp.drawText(ctx, 'PAUSE', 108, 108, sp.palette.bonusRed, 2);
        }
    }

    renderHUD() {
        const ctx = this.ctx;
        const sp = window.spriteEngine;
        const hudX = 228;

        // 1. Remaining Enemies (2 columns of 10)
        const totalEnemiesLeft = this.enemyQueue.length + this.spawns.length + this.enemies.length;
        for (let i = 0; i < 20; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = hudX + col * 10;
            const y = 14 + row * 9;

            if (i < totalEnemiesLeft) {
                ctx.drawImage(sp.cache['hud_enemy'], x, y);
            }
        }

        // 2. Player 1 Lives
        const p1Y = 120;
        sp.drawText(ctx, 'IP', hudX, p1Y, sp.palette.black, 1);
        ctx.drawImage(sp.cache['hud_player'], hudX, p1Y + 10);
        sp.drawText(ctx, `${this.lives}`, hudX + 12, p1Y + 10, sp.palette.black, 1);

        // 3. Stage Number & Flag
        const flagY = 160;
        ctx.drawImage(sp.cache['hud_flag'], hudX - 2, flagY);
        sp.drawText(ctx, `${this.stage}`, hudX + 12, flagY + 8, sp.palette.black, 1);

        // 4. Score at bottom
        sp.drawText(ctx, 'SC', hudX, 190, sp.palette.black, 1);
        sp.drawText(ctx, `${this.score}`, hudX - 4, 202, sp.palette.black, 1);
    }

    renderStageCurtain() {
        const ctx = this.ctx;
        const sp = window.spriteEngine;

        // Grey curtains sliding
        ctx.fillStyle = sp.palette.greyDark;
        ctx.fillRect(0, 0, this.WIDTH, this.curtainPos);
        ctx.fillRect(0, this.HEIGHT - this.curtainPos, this.WIDTH, this.curtainPos);

        if (this.curtainPos >= 100) {
            ctx.fillStyle = sp.palette.black;
            ctx.fillRect(70, 96, 116, 32);
            sp.drawText(ctx, `STAGE  ${this.stage}`, 84, 108, sp.palette.white, 1);
        }
    }

    renderGameOver() {
        const ctx = this.ctx;
        const sp = window.spriteEngine;
        sp.drawText(ctx, 'GAME', 96, this.gameOverY, sp.palette.bonusRed, 2);
        sp.drawText(ctx, 'OVER', 96, this.gameOverY + 20, sp.palette.bonusRed, 2);
    }

    renderTallyScreen() {
        const ctx = this.ctx;
        const sp = window.spriteEngine;

        ctx.fillStyle = sp.palette.black;
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        sp.drawText(ctx, 'HI-SCORE', 32, 20, sp.palette.bonusRed, 1);
        sp.drawText(ctx, `${this.highScore}`, 140, 20, sp.palette.white, 1);

        sp.drawText(ctx, `STAGE  ${this.stage}`, 96, 40, sp.palette.white, 1);
        sp.drawText(ctx, 'I-PLAYER', 32, 60, sp.palette.bonusRed, 1);
        sp.drawText(ctx, `${this.score}`, 140, 60, sp.palette.white, 1);

        const types = [
            { key: 'basic', pts: 100, name: 'basic' },
            { key: 'fast', pts: 200, name: 'fast' },
            { key: 'power', pts: 300, name: 'power' },
            { key: 'armor', pts: 400, name: 'armor' }
        ];

        types.forEach((t, idx) => {
            const y = 84 + idx * 24;
            const kills = (this.tallyStep > idx) ? this.tallyStats[t.key] : (this.tallyStep === idx ? this.tallyCounter : 0);
            const pts = kills * t.pts;

            sp.drawText(ctx, `${pts}`, 40, y + 4, sp.palette.white, 1);
            sp.drawText(ctx, 'PTS', 80, y + 4, sp.palette.white, 1);
            sp.drawTank(ctx, 114, y, t.name, 0, 0, 0, false, 1);
            sp.drawText(ctx, '<', 138, y + 4, sp.palette.white, 1);
            sp.drawText(ctx, `${kills}`, 154, y + 4, sp.palette.white, 1);
        });

        // Horizontal dividing line
        ctx.fillStyle = sp.palette.white;
        ctx.fillRect(96, 184, 80, 2);

        sp.drawText(ctx, 'TOTAL', 40, 194, sp.palette.white, 1);
        const totalShown = (this.tallyStep >= 4) ? this.tallyStats.total : 0;
        sp.drawText(ctx, `${totalShown}`, 154, 194, sp.palette.white, 1);
    }

    renderTitleScreen() {
        const ctx = this.ctx;
        const sp = window.spriteEngine;

        ctx.fillStyle = sp.palette.black;
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // High Score
        sp.drawText(ctx, 'I- 00  HI- 20000', 48, 16, sp.palette.white, 1);

        // Retro Logo: BATTLE CITY
        sp.drawText(ctx, 'BATTLE', 64, 48, sp.palette.bonusRed, 3);
        sp.drawText(ctx, 'CITY', 92, 76, sp.palette.playerYellow, 3);

        // Decorative eagle
        sp.drawEagle(ctx, 120, 108);

        // Menu Options
        const optY = 140;
        sp.drawText(ctx, '1 PLAYER', 96, optY, sp.palette.white, 1);
        if (this.menuSelection === 0) {
            sp.drawText(ctx, `< STAGE ${this.selectedStage} >`, 80, optY + 11, sp.palette.playerYellow, 1);
        }
        sp.drawText(ctx, 'CONSTRUCTION', 96, optY + 24, sp.palette.white, 1);

        // Selection Tank Cursor
        const cursorY = optY - 4 + (this.menuSelection === 0 ? 0 : 24);
        sp.drawTank(ctx, 72, cursorY, 'player', 0, 1, 0, false, 1);

        // Footer copyright
        sp.drawText(ctx, 'c 1985 2026 NAMCO LTD.', 36, 196, sp.palette.white, 1);
        sp.drawText(ctx, 'ALL RIGHTS RESERVED', 48, 208, sp.palette.white, 1);
    }

    // ==========================================
    // Construction (Map Editor) Mode
    // ==========================================
    enterConstruction() {
        this.state = this.STATE_CONSTRUCTION;
        this.editorBrush = 1; // Brick
        this.editorMap = window.levelManager.loadCustomMap() || window.levelManager.generateStage1().map;
        document.getElementById('editorControls').style.display = 'flex';
    }

    exitConstruction() {
        this.state = this.STATE_TITLE;
        document.getElementById('editorControls').style.display = 'none';
    }

    playCustomMap() {
        window.levelManager.saveCustomMap(this.editorMap);
        this.exitConstruction();
        this.startStage(1, true);
    }

    renderConstructionScreen() {
        const ctx = this.ctx;
        const sp = window.spriteEngine;

        ctx.fillStyle = sp.palette.greyDark;
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Playfield background
        ctx.fillStyle = sp.palette.black;
        ctx.fillRect(this.PLAY_OFFSET_X, this.PLAY_OFFSET_Y, this.PLAY_SIZE, this.PLAY_SIZE);

        ctx.save();
        ctx.translate(this.PLAY_OFFSET_X, this.PLAY_OFFSET_Y);

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 26; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 8, 0);
            ctx.lineTo(i * 8, 208);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * 8);
            ctx.lineTo(208, i * 8);
            ctx.stroke();
        }

        // Render editor map tiles
        for (let r = 0; r < 26; r++) {
            for (let c = 0; c < 26; c++) {
                const tile = this.editorMap[r][c];
                if (tile !== 0 && tile !== 6) {
                    sp.drawTerrainTile(ctx, c * 8, r * 8, tile, 0);
                }
            }
        }

        // Base Eagle
        sp.drawEagle(ctx, 96, 192, false);

        // Spawn guides (dotted boxes)
        ctx.strokeStyle = sp.palette.bonusRed;
        ctx.strokeRect(0, 0, 16, 16);
        ctx.strokeRect(96, 0, 16, 16);
        ctx.strokeRect(192, 0, 16, 16);
        // Player spawn guide
        ctx.strokeStyle = sp.palette.playerYellow;
        ctx.strokeRect(64, 192, 16, 16);

        ctx.restore();

        // Sidebar editor HUD
        const hudX = 228;
        sp.drawText(ctx, 'MAP', hudX, 16, sp.palette.black, 1);
        sp.drawText(ctx, 'EDIT', hudX, 26, sp.palette.black, 1);

        // Current brush preview
        sp.drawText(ctx, 'TILE', hudX, 50, sp.palette.black, 1);
        if (this.editorBrush === 0) {
            ctx.fillStyle = sp.palette.black;
            ctx.fillRect(hudX + 4, 62, 8, 8);
        } else {
            sp.drawTerrainTile(ctx, hudX + 4, 62, this.editorBrush);
        }
    }

    setEditorTileAt(screenX, screenY) {
        const playX = screenX - this.PLAY_OFFSET_X;
        const playY = screenY - this.PLAY_OFFSET_Y;

        const col = Math.floor(playX / 8);
        const row = Math.floor(playY / 8);

        if (col >= 0 && col < 26 && row >= 0 && row < 26) {
            // Protect Eagle Base (rows 24-25, cols 12-13)
            if ((row === 24 || row === 25) && (col === 12 || col === 13)) {
                return;
            }
            // Protect Player Spawn (rows 24-25, cols 8-9) from impassable steel/water
            if ((row === 24 || row === 25) && (col === 8 || col === 9)) {
                if (this.editorBrush === 2 || this.editorBrush === 3) return;
            }
            // Protect Enemy Spawns (rows 0-1 at cols 0-1, 12-13, 24-25) from impassable steel/water
            if (row <= 1 && (col <= 1 || (col >= 12 && col <= 13) || col >= 24)) {
                if (this.editorBrush === 2 || this.editorBrush === 3) return;
            }
            this.editorMap[row][col] = this.editorBrush;
        }
    }

    // ==========================================
    // Game Loop Runner
    // ==========================================
    gameLoop(timestamp) {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (!this.isPaused) {
            this.update();
        }
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    // ==========================================
    // Event Listeners & Input Handling
    // ==========================================
    bindEvents() {
        // Global interaction audio unlock
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('click', () => window.soundEngine.resume());
            window.addEventListener('touchstart', () => window.soundEngine.resume(), { passive: true });
        }

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            window.soundEngine.resume();
            this.keys[e.code] = true;

            if (this.state === this.STATE_TITLE) {
                if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                    this.menuSelection = 0;
                    window.soundEngine.playShoot();
                } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                    this.menuSelection = 1;
                    window.soundEngine.playShoot();
                } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                    if (this.menuSelection === 0) {
                        this.selectedStage = this.selectedStage > 1 ? this.selectedStage - 1 : 5;
                        window.soundEngine.playBrickHit();
                    }
                } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                    if (this.menuSelection === 0) {
                        this.selectedStage = this.selectedStage < 5 ? this.selectedStage + 1 : 1;
                        window.soundEngine.playBrickHit();
                    }
                } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyK') {
                    if (this.menuSelection === 0) {
                        this.startStage(this.selectedStage, false, true);
                    } else {
                        this.enterConstruction();
                    }
                }
            } else if (this.state === this.STATE_STAGE_START) {
                if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyK') {
                    if (this.stageStartTimer > 25) {
                        this.stageStartTimer = 25;
                    }
                }
            } else if (this.state === this.STATE_GAMEOVER) {
                if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyK') {
                    this.initTitle();
                }
            } else if (this.state === this.STATE_PLAYING) {
                if (e.code === 'KeyP' || e.code === 'Escape') {
                    this.isPaused = !this.isPaused;
                }
                if (e.code === 'KeyM') {
                    this.toggleMute();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse Painting in Map Editor
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state !== this.STATE_CONSTRUCTION) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.WIDTH / rect.width;
            const scaleY = this.HEIGHT / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            this.isEditorPainting = true;
            this.setEditorTileAt(x, y);
        });

        window.addEventListener('mousemove', (e) => {
            if (this.state !== this.STATE_CONSTRUCTION || !this.isEditorPainting) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.WIDTH / rect.width;
            const scaleY = this.HEIGHT / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            this.setEditorTileAt(x, y);
        });

        window.addEventListener('mouseup', () => {
            this.isEditorPainting = false;
        });

        // Touch Painting in Map Editor
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.state !== this.STATE_CONSTRUCTION) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const scaleX = this.WIDTH / rect.width;
            const scaleY = this.HEIGHT / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;

            this.isEditorPainting = true;
            this.setEditorTileAt(x, y);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.state !== this.STATE_CONSTRUCTION || !this.isEditorPainting) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const scaleX = this.WIDTH / rect.width;
            const scaleY = this.HEIGHT / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;

            this.setEditorTileAt(x, y);
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.isEditorPainting = false;
        });

        // Setup Virtual Controls (D-pad & action buttons)
        this.bindTouchButtons();
    }

    bindTouchButtons() {
        const bindBtn = (id, onDown, onUp) => {
            const el = document.getElementById(id);
            if (!el) return;
            const downHandler = (e) => {
                e.preventDefault();
                window.soundEngine.resume();
                onDown();
                el.classList.add('active');
            };
            const upHandler = (e) => {
                e.preventDefault();
                onUp();
                el.classList.remove('active');
            };
            el.addEventListener('touchstart', downHandler, { passive: false });
            el.addEventListener('touchend', upHandler, { passive: false });
            el.addEventListener('touchcancel', upHandler, { passive: false });
            el.addEventListener('mousedown', downHandler);
            el.addEventListener('mouseup', upHandler);
            el.addEventListener('mouseleave', upHandler);
        };

        bindBtn('dpadUp', () => this.touchControls.up = true, () => this.touchControls.up = false);
        bindBtn('dpadRight', () => this.touchControls.right = true, () => this.touchControls.right = false);
        bindBtn('dpadDown', () => this.touchControls.down = true, () => this.touchControls.down = false);
        bindBtn('dpadLeft', () => this.touchControls.left = true, () => this.touchControls.left = false);

        bindBtn('btnFire', () => {
            this.touchControls.fire = true;
            if (this.state === this.STATE_TITLE) {
                if (this.menuSelection === 0) this.startStage(this.selectedStage, false, true);
                else this.enterConstruction();
            } else if (this.state === this.STATE_STAGE_START) {
                if (this.stageStartTimer > 25) this.stageStartTimer = 25;
            } else if (this.state === this.STATE_GAMEOVER) {
                this.initTitle();
            }
        }, () => this.touchControls.fire = false);

        bindBtn('btnSelect', () => {
            if (this.state === this.STATE_TITLE) {
                if (this.menuSelection === 0) {
                    this.selectedStage = this.selectedStage < 5 ? this.selectedStage + 1 : 1;
                } else {
                    this.menuSelection = 0;
                }
                window.soundEngine.playShoot();
            }
        }, () => {});

        bindBtn('btnStart', () => {
            if (this.state === this.STATE_TITLE) {
                if (this.menuSelection === 0) this.startStage(this.selectedStage, false, true);
                else this.enterConstruction();
            } else if (this.state === this.STATE_STAGE_START) {
                if (this.stageStartTimer > 25) this.stageStartTimer = 25;
            } else if (this.state === this.STATE_GAMEOVER) {
                this.initTitle();
            } else if (this.state === this.STATE_PLAYING) {
                this.isPaused = !this.isPaused;
            }
        }, () => {});
    }

    toggleMute() {
        const isMuted = window.soundEngine.toggleMute();
        const btn = document.getElementById('muteBtn');
        if (btn) {
            btn.innerText = isMuted ? '🔇' : '🔊';
        }
    }
}

// Global game instance
window.BattleCityGame = BattleCityGame;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattleCityGame;
}

if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('DOMContentLoaded', () => {
        window.battleCity = new BattleCityGame();
    });
}
