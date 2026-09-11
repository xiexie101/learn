/**
 * NES Battle City Sprite & Pixel Art Engine
 * Faithful 8-bit procedural graphics engine rendering to offscreen canvas caches.
 * Zero external image dependencies - 100% crisp pixelated NES rendering.
 */

class SpriteEngine {
    constructor() {
        this.cache = {};
        this.palette = {
            black: '#000000',
            greyDark: '#636363',
            greyMid: '#949494',
            greyLight: '#d8d8d8',
            white: '#ffffff',

            brickRed: '#b84418',
            brickDark: '#5c1e00',
            brickLight: '#d88b20',

            steelLight: '#e4e4e4',
            steelMid: '#a0a0a0',
            steelDark: '#585858',

            waterDeep: '#0058f8',
            waterWave: '#3cbcfc',
            waterCrest: '#ffffff',

            treeDark: '#005800',
            treeGreen: '#00a800',
            treeLight: '#58d858',

            iceBase: '#d8f8f8',
            iceLight: '#ffffff',
            iceShadow: '#84dcdc',

            playerYellow: '#f8b800',
            playerGreen: '#007800',
            playerWhite: '#ffffff',

            enemyGrey: '#d8d8d8',
            enemyDarkGrey: '#505050',

            bonusRed: '#f83800',
            bonusWhite: '#ffffff',

            armorGreen: '#00a800',
            armorDarkGreen: '#005800',
            armorYellow: '#f8b800',
            armorLightGreen: '#88f888',

            eagleGold: '#f8b800',
            eagleRed: '#d82800',
            eagleRubble: '#7c7c7c'
        };

        this.initCaches();
    }

    createCanvas(width, height) {
        const c = document.createElement('canvas');
        c.width = width;
        c.height = height;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { canvas: c, ctx: ctx };
    }

    initCaches() {
        // Pre-render terrain tiles
        this.renderTerrainSprites();
        // Pre-render eagle (alive and destroyed)
        this.renderEagleSprites();
        // Pre-render powerup icons
        this.renderPowerupSprites();
        // Pre-render explosion frames
        this.renderExplosionSprites();
        // Pre-render spawn shimmer
        this.renderSpawnSprites();
        // Pre-render HUD icons
        this.renderHudIcons();
    }

    // ==========================================
    // Terrain Tiles (8x8 pixels)
    // ==========================================
    renderTerrainSprites() {
        const p = this.palette;

        // 1. Brick (8x8)
        const brick = this.createCanvas(8, 8);
        const bCtx = brick.ctx;
        bCtx.fillStyle = p.brickRed;
        bCtx.fillRect(0, 0, 8, 8);

        // Brick mortar lines
        bCtx.fillStyle = p.black;
        bCtx.fillRect(0, 3, 8, 1);
        bCtx.fillRect(0, 7, 8, 1);
        bCtx.fillRect(4, 0, 1, 3);
        bCtx.fillRect(0, 4, 1, 3);

        // Highlights & shadows
        bCtx.fillStyle = p.brickLight;
        bCtx.fillRect(0, 0, 4, 1);
        bCtx.fillRect(5, 0, 3, 1);
        bCtx.fillRect(1, 4, 7, 1);

        bCtx.fillStyle = p.brickDark;
        bCtx.fillRect(0, 2, 4, 1);
        bCtx.fillRect(5, 2, 3, 1);
        bCtx.fillRect(1, 6, 7, 1);

        this.cache['terrain_1'] = brick.canvas;

        // 2. Steel (8x8)
        const steel = this.createCanvas(8, 8);
        const sCtx = steel.ctx;
        sCtx.fillStyle = p.steelMid;
        sCtx.fillRect(0, 0, 8, 8);

        // Two 4x4 beveled steel panels
        const drawPanel = (x, y) => {
            sCtx.fillStyle = p.steelLight;
            sCtx.fillRect(x, y, 4, 1);
            sCtx.fillRect(x, y, 1, 4);
            sCtx.fillStyle = p.white;
            sCtx.fillRect(x, y, 1, 1);

            sCtx.fillStyle = p.steelDark;
            sCtx.fillRect(x + 3, y, 1, 4);
            sCtx.fillRect(x, y + 3, 4, 1);

            // Center rivet
            sCtx.fillStyle = p.black;
            sCtx.fillRect(x + 1, y + 1, 2, 2);
            sCtx.fillStyle = p.steelLight;
            sCtx.fillRect(x + 1, y + 1, 1, 1);
        };
        drawPanel(0, 0);
        drawPanel(4, 0);
        drawPanel(0, 4);
        drawPanel(4, 4);
        this.cache['terrain_2'] = steel.canvas;

        // 3. Water (8x8, 2 animated frames)
        for (let frame = 0; frame < 2; frame++) {
            const water = this.createCanvas(8, 8);
            const wCtx = water.ctx;
            wCtx.fillStyle = p.waterDeep;
            wCtx.fillRect(0, 0, 8, 8);

            wCtx.fillStyle = p.waterWave;
            const offset = frame * 2;
            wCtx.fillRect((offset) % 8, 1, 4, 1);
            wCtx.fillRect((offset + 4) % 8, 5, 4, 1);

            wCtx.fillStyle = p.waterCrest;
            wCtx.fillRect((offset + 1) % 8, 2, 2, 1);
            wCtx.fillRect((offset + 5) % 8, 6, 2, 1);

            this.cache[`terrain_3_${frame}`] = water.canvas;
        }

        // 4. Trees / Foliage (8x8)
        const tree = this.createCanvas(8, 8);
        const tCtx = tree.ctx;
        tCtx.fillStyle = p.treeGreen;
        tCtx.fillRect(0, 0, 8, 8);

        tCtx.fillStyle = p.treeDark;
        tCtx.fillRect(0, 0, 2, 2);
        tCtx.fillRect(6, 0, 2, 2);
        tCtx.fillRect(2, 4, 2, 2);
        tCtx.fillRect(0, 6, 2, 2);
        tCtx.fillRect(6, 6, 2, 2);

        tCtx.fillStyle = p.treeLight;
        tCtx.fillRect(2, 1, 2, 2);
        tCtx.fillRect(4, 2, 2, 2);
        tCtx.fillRect(1, 5, 2, 2);
        tCtx.fillRect(5, 5, 2, 2);

        this.cache['terrain_4'] = tree.canvas;

        // 5. Ice (8x8)
        const ice = this.createCanvas(8, 8);
        const iCtx = ice.ctx;
        iCtx.fillStyle = p.iceBase;
        iCtx.fillRect(0, 0, 8, 8);

        iCtx.fillStyle = p.iceLight;
        iCtx.fillRect(0, 0, 4, 1);
        iCtx.fillRect(0, 1, 2, 1);
        iCtx.fillRect(4, 4, 4, 1);
        iCtx.fillRect(4, 5, 2, 1);

        iCtx.fillStyle = p.iceShadow;
        iCtx.fillRect(2, 3, 2, 1);
        iCtx.fillRect(6, 7, 2, 1);

        this.cache['terrain_5'] = ice.canvas;
    }

    // ==========================================
    // Eagle / Base (16x16 pixels)
    // ==========================================
    renderEagleSprites() {
        const p = this.palette;

        // Alive Eagle (16x16)
        const eagle = this.createCanvas(16, 16);
        const ctx = eagle.ctx;

        ctx.fillStyle = p.black;
        ctx.fillRect(0, 0, 16, 16);

        // Golden wings & body
        ctx.fillStyle = p.eagleGold;
        // Wings left & right
        ctx.fillRect(2, 3, 3, 7);
        ctx.fillRect(1, 5, 2, 5);
        ctx.fillRect(11, 3, 3, 7);
        ctx.fillRect(13, 5, 2, 5);

        // Body center
        ctx.fillRect(5, 4, 6, 8);
        // Head & crest
        ctx.fillRect(6, 2, 4, 3);
        ctx.fillRect(7, 1, 2, 2);
        // Pedestal
        ctx.fillRect(4, 12, 8, 3);
        ctx.fillRect(3, 14, 10, 2);

        // Details (white feathers & highlights)
        ctx.fillStyle = p.white;
        ctx.fillRect(7, 2, 2, 1);
        ctx.fillRect(3, 4, 2, 1);
        ctx.fillRect(11, 4, 2, 1);
        ctx.fillRect(5, 7, 2, 1);
        ctx.fillRect(9, 7, 2, 1);

        // Red crest / ribbon
        ctx.fillStyle = p.eagleRed;
        ctx.fillRect(7, 4, 2, 4);
        ctx.fillRect(6, 6, 4, 2);

        this.cache['eagle_alive'] = eagle.canvas;

        // Destroyed Eagle / Rubble (16x16)
        const ruined = this.createCanvas(16, 16);
        const rCtx = ruined.ctx;
        rCtx.fillStyle = p.black;
        rCtx.fillRect(0, 0, 16, 16);

        // Broken base stones
        rCtx.fillStyle = p.eagleRubble;
        rCtx.fillRect(2, 11, 12, 4);
        rCtx.fillRect(4, 8, 8, 3);
        rCtx.fillRect(1, 14, 14, 2);

        // White surrender flag / skull icon
        rCtx.fillStyle = p.white;
        rCtx.fillRect(5, 3, 6, 4);
        rCtx.fillRect(6, 2, 4, 6);
        // Flag pole
        rCtx.fillStyle = p.greyLight;
        rCtx.fillRect(4, 2, 1, 10);

        // Black eyes in broken skull flag
        rCtx.fillStyle = p.black;
        rCtx.fillRect(6, 4, 1, 2);
        rCtx.fillRect(9, 4, 1, 2);
        rCtx.fillRect(7, 6, 2, 1);

        this.cache['eagle_ruined'] = ruined.canvas;
    }

    // ==========================================
    // Power-up Sprites (16x16 pixels)
    // ==========================================
    renderPowerupSprites() {
        const p = this.palette;

        const makePowerup = (drawFn) => {
            const c = this.createCanvas(16, 16);
            drawFn(c.ctx);
            return c.canvas;
        };

        // 1. Helmet (Shield)
        this.cache['powerup_helmet'] = makePowerup((ctx) => {
            ctx.fillStyle = p.white;
            ctx.fillRect(4, 2, 8, 2);
            ctx.fillRect(3, 4, 10, 4);
            ctx.fillRect(3, 8, 10, 5);

            ctx.fillStyle = p.playerYellow;
            ctx.fillRect(5, 3, 6, 2);
            ctx.fillRect(4, 5, 8, 3);
            ctx.fillRect(7, 1, 2, 2); // crest

            ctx.fillStyle = p.black;
            ctx.fillRect(5, 8, 6, 2); // visor
            ctx.fillStyle = p.white;
            ctx.fillRect(4, 12, 8, 2);
        });

        // 2. Clock (Timer)
        this.cache['powerup_clock'] = makePowerup((ctx) => {
            ctx.fillStyle = p.white;
            ctx.fillRect(4, 2, 8, 12);
            ctx.fillRect(2, 4, 12, 8);
            ctx.fillRect(3, 3, 10, 10);

            ctx.fillStyle = p.playerYellow;
            ctx.fillRect(5, 1, 6, 1); // top bell
            ctx.fillRect(3, 14, 3, 1); // feet
            ctx.fillRect(10, 14, 3, 1);

            ctx.fillStyle = p.bonusRed;
            ctx.fillRect(4, 4, 8, 8);

            ctx.fillStyle = p.white;
            ctx.fillRect(5, 5, 6, 6);

            // Clock hands
            ctx.fillStyle = p.black;
            ctx.fillRect(7, 6, 2, 3);
            ctx.fillRect(7, 8, 3, 2);
        });

        // 3. Shovel
        this.cache['powerup_shovel'] = makePowerup((ctx) => {
            ctx.fillStyle = p.white;
            ctx.fillRect(4, 2, 8, 6);
            ctx.fillRect(5, 1, 6, 8);

            // Spade metal blade
            ctx.fillStyle = p.steelMid;
            ctx.fillRect(5, 2, 6, 5);
            ctx.fillStyle = p.white;
            ctx.fillRect(6, 2, 4, 2);

            // Shaft
            ctx.fillStyle = p.playerYellow;
            ctx.fillRect(7, 7, 2, 6);
            // Handle
            ctx.fillStyle = p.bonusRed;
            ctx.fillRect(6, 13, 4, 2);
            ctx.fillRect(6, 14, 4, 1);
        });

        // 4. Star
        this.cache['powerup_star'] = makePowerup((ctx) => {
            ctx.fillStyle = p.playerYellow;
            ctx.fillRect(7, 1, 2, 14);
            ctx.fillRect(1, 7, 14, 2);
            ctx.fillRect(3, 3, 10, 10);
            ctx.fillRect(5, 2, 6, 12);
            ctx.fillRect(2, 5, 12, 6);

            ctx.fillStyle = p.white;
            ctx.fillRect(6, 4, 4, 4);
            ctx.fillRect(7, 3, 2, 2);
        });

        // 5. Grenade (Bomb)
        this.cache['powerup_grenade'] = makePowerup((ctx) => {
            ctx.fillStyle = p.treeGreen;
            ctx.fillRect(4, 4, 8, 10);
            ctx.fillRect(3, 6, 10, 6);

            // Pin & neck
            ctx.fillStyle = p.white;
            ctx.fillRect(7, 1, 2, 3);
            ctx.fillRect(5, 1, 2, 2);

            // Texture ridges
            ctx.fillStyle = p.black;
            ctx.fillRect(4, 7, 8, 1);
            ctx.fillRect(4, 10, 8, 1);
            ctx.fillRect(7, 4, 2, 10);

            ctx.fillStyle = p.treeLight;
            ctx.fillRect(5, 5, 2, 2);
            ctx.fillRect(5, 8, 2, 2);
        });

        // 6. Tank (1-UP extra life)
        this.cache['powerup_tank'] = makePowerup((ctx) => {
            ctx.fillStyle = p.playerYellow;
            ctx.fillRect(3, 4, 10, 8);
            ctx.fillRect(2, 3, 3, 10); // left tread
            ctx.fillRect(11, 3, 3, 10); // right tread
            ctx.fillRect(7, 1, 2, 5); // barrel

            ctx.fillStyle = p.white;
            ctx.fillRect(6, 5, 4, 4); // turret
            ctx.fillRect(7, 2, 2, 2);

            ctx.fillStyle = p.black;
            ctx.fillRect(3, 5, 1, 2);
            ctx.fillRect(3, 9, 1, 2);
            ctx.fillRect(12, 5, 1, 2);
            ctx.fillRect(12, 9, 1, 2);
        });

        // 7. Gun (Pistol)
        this.cache['powerup_gun'] = makePowerup((ctx) => {
            ctx.fillStyle = p.steelLight;
            ctx.fillRect(3, 3, 10, 3); // barrel
            ctx.fillRect(3, 5, 3, 1);

            ctx.fillStyle = p.playerYellow;
            ctx.fillRect(9, 5, 4, 7); // grip
            ctx.fillRect(10, 11, 3, 2);

            ctx.fillStyle = p.white;
            ctx.fillRect(4, 3, 6, 1);

            ctx.fillStyle = p.bonusRed;
            ctx.fillRect(7, 6, 2, 2); // trigger guard
        });
    }

    // ==========================================
    // Explosion Sprites
    // ==========================================
    renderExplosionSprites() {
        const p = this.palette;

        // Small explosion (bullet impact, 3 frames)
        for (let frame = 0; frame < 3; frame++) {
            const c = this.createCanvas(16, 16);
            const ctx = c.ctx;
            const r = 2 + frame * 3;

            ctx.fillStyle = frame === 0 ? p.white : (frame === 1 ? p.playerYellow : p.bonusRed);
            ctx.fillRect(8 - r, 8 - r, r * 2, r * 2);

            ctx.fillStyle = p.white;
            ctx.fillRect(8 - Math.floor(r * 0.5), 8 - Math.floor(r * 0.5), r, r);

            this.cache[`exp_small_${frame}`] = c.canvas;
        }

        // Big tank explosion (32x32, 5 frames)
        for (let frame = 0; frame < 5; frame++) {
            const c = this.createCanvas(32, 32);
            const ctx = c.ctx;
            const radius = 4 + frame * 3;

            // Outer cloud
            ctx.fillStyle = frame < 2 ? p.bonusRed : (frame < 4 ? p.brickDark : p.greyDark);
            ctx.beginPath();
            ctx.arc(16, 16, radius + 2, 0, Math.PI * 2);
            ctx.fill();

            // Inner fireball
            ctx.fillStyle = frame < 2 ? p.white : (frame < 3 ? p.playerYellow : p.bonusRed);
            ctx.beginPath();
            ctx.arc(16, 16, radius, 0, Math.PI * 2);
            ctx.fill();

            // Core
            if (frame < 3) {
                ctx.fillStyle = p.white;
                ctx.beginPath();
                ctx.arc(16, 16, radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Debris sparks
            ctx.fillStyle = p.playerYellow;
            const sparkDist = 8 + frame * 4;
            ctx.fillRect(16 + sparkDist, 16, 2, 2);
            ctx.fillRect(16 - sparkDist, 16, 2, 2);
            ctx.fillRect(16, 16 + sparkDist, 2, 2);
            ctx.fillRect(16, 16 - sparkDist, 2, 2);

            this.cache[`exp_big_${frame}`] = c.canvas;
        }
    }

    // ==========================================
    // Spawn Shimmer Star (16x16, 4 frames)
    // ==========================================
    renderSpawnSprites() {
        const p = this.palette;
        const sizes = [2, 6, 12, 16];

        sizes.forEach((sz, idx) => {
            const c = this.createCanvas(16, 16);
            const ctx = c.ctx;
            const half = sz / 2;
            const center = 8;

            ctx.fillStyle = p.white;
            // 4-pointed sparkle
            ctx.fillRect(center - 1, center - half, 2, sz);
            ctx.fillRect(center - half, center - 1, sz, 2);

            ctx.fillStyle = p.iceBase;
            ctx.fillRect(center - Math.floor(half * 0.7), center - Math.floor(half * 0.7), Math.floor(half * 1.4), Math.floor(half * 1.4));

            this.cache[`spawn_${idx}`] = c.canvas;
        });
    }

    // ==========================================
    // HUD Icons
    // ==========================================
    renderHudIcons() {
        const p = this.palette;

        // 1. Enemy mini icon (8x8)
        const enemyMini = this.createCanvas(8, 8);
        const eCtx = enemyMini.ctx;
        eCtx.fillStyle = p.black;
        eCtx.fillRect(1, 1, 6, 6);
        eCtx.fillRect(0, 2, 8, 4);
        eCtx.fillRect(3, 0, 2, 2); // barrel
        this.cache['hud_enemy'] = enemyMini.canvas;

        // 2. Player 1 mini icon (8x8)
        const playerMini = this.createCanvas(8, 8);
        const pCtx = playerMini.ctx;
        pCtx.fillStyle = p.black;
        pCtx.fillRect(1, 1, 6, 6);
        pCtx.fillRect(0, 2, 8, 4);
        pCtx.fillRect(3, 0, 2, 2);
        this.cache['hud_player'] = playerMini.canvas;

        // 3. Flag icon (16x16)
        const flag = this.createCanvas(16, 16);
        const fCtx = flag.ctx;
        fCtx.fillStyle = p.black;
        fCtx.fillRect(4, 2, 2, 13); // pole
        fCtx.fillRect(2, 13, 6, 2); // stand
        fCtx.fillStyle = p.bonusRed;
        fCtx.fillRect(6, 2, 8, 6); // flag cloth
        fCtx.fillStyle = p.white;
        fCtx.fillRect(8, 4, 3, 2); // star/mark on flag
        this.cache['hud_flag'] = flag.canvas;
    }

    // ==========================================
    // Tank Sprite Rendering (16x16)
    // ==========================================
    /**
     * @param {string} type - 'player' | 'basic' | 'fast' | 'power' | 'armor'
     * @param {number} tier - 0 to 3 (player upgrades)
     * @param {number} dir - 0=UP, 1=RIGHT, 2=DOWN, 3=LEFT
     * @param {number} frame - 0 or 1 (tread animation)
     * @param {boolean} isBonus - flashing red bonus tank
     * @param {number} armorHitsLeft - 1 to 4 for armor tank
     */
    drawTank(ctx, x, y, type, tier, dir, frame, isBonus = false, armorHitsLeft = 1) {
        const cacheKey = `tank_${type}_${tier}_${dir}_${frame}_${isBonus}_${armorHitsLeft}`;
        if (!this.cache[cacheKey]) {
            this.cache[cacheKey] = this.generateTankCanvas(type, tier, dir, frame, isBonus, armorHitsLeft);
        }
        ctx.drawImage(this.cache[cacheKey], Math.round(x), Math.round(y));
    }

    generateTankCanvas(type, tier, dir, frame, isBonus, armorHitsLeft) {
        const c = this.createCanvas(16, 16);
        const ctx = c.ctx;
        const p = this.palette;

        // Determine tank colors
        let primaryColor, secondaryColor, highlightColor;

        if (isBonus) {
            primaryColor = p.bonusRed;
            secondaryColor = p.bonusWhite;
            highlightColor = p.playerYellow;
        } else if (type === 'player') {
            if (tier === 3) {
                primaryColor = p.playerYellow;
                secondaryColor = p.white;
                highlightColor = p.bonusRed;
            } else {
                primaryColor = p.playerYellow;
                secondaryColor = p.playerGreen;
                highlightColor = p.white;
            }
        } else if (type === 'armor') {
            // Armor tank damage colors
            if (armorHitsLeft >= 4) {
                primaryColor = p.armorGreen;
                secondaryColor = p.playerYellow;
                highlightColor = p.armorLightGreen;
            } else if (armorHitsLeft === 3) {
                primaryColor = p.armorYellow;
                secondaryColor = p.armorDarkGreen;
                highlightColor = p.white;
            } else if (armorHitsLeft === 2) {
                primaryColor = p.iceShadow;
                secondaryColor = p.greyDark;
                highlightColor = p.white;
            } else {
                primaryColor = p.enemyGrey;
                secondaryColor = p.enemyDarkGrey;
                highlightColor = p.white;
            }
        } else {
            // Basic, Fast, Power enemy tanks
            primaryColor = p.enemyGrey;
            secondaryColor = p.enemyDarkGrey;
            highlightColor = p.white;
        }

        // Draw oriented upward first, then rotate for other directions
        ctx.save();
        ctx.translate(8, 8);
        ctx.rotate((dir * 90 * Math.PI) / 180);
        ctx.translate(-8, -8);

        // 1. Treads (Left: cols 1-3, Right: cols 12-14)
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(1, 1, 3, 14);
        ctx.fillRect(12, 1, 3, 14);

        // Tread notches (animation frame)
        ctx.fillStyle = p.black;
        const notchOffset = frame === 0 ? 0 : 2;
        for (let i = 2 + notchOffset; i < 14; i += 4) {
            ctx.fillRect(1, i, 3, 1);
            ctx.fillRect(12, i, 3, 1);
        }

        // 2. Chassis / Main Body
        ctx.fillStyle = primaryColor;
        ctx.fillRect(4, 3, 8, 11);

        // 3. Turret Dome
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(5, 5, 6, 6);
        ctx.fillStyle = highlightColor;
        ctx.fillRect(6, 6, 4, 4);

        // 4. Cannon Barrel pointing UP
        ctx.fillStyle = primaryColor;
        if (type === 'power') {
            // Long slender high-velocity cannon
            ctx.fillRect(7, 0, 2, 7);
            ctx.fillStyle = highlightColor;
            ctx.fillRect(7, 0, 2, 2);
        } else if (tier >= 2 || type === 'armor') {
            // Heavy reinforced cannon
            ctx.fillRect(6, 0, 4, 6);
            ctx.fillStyle = highlightColor;
            ctx.fillRect(7, 0, 2, 2);
        } else {
            // Standard cannon
            ctx.fillRect(7, 1, 2, 5);
        }

        // Tier / Type specifics
        if (tier === 3) {
            // Heavy star 3 tank front guard
            ctx.fillStyle = p.bonusRed;
            ctx.fillRect(4, 3, 8, 2);
        } else if (type === 'fast') {
            // Sleek wedge nose
            ctx.fillStyle = highlightColor;
            ctx.fillRect(6, 3, 4, 2);
        }

        ctx.restore();
        return c.canvas;
    }

    // ==========================================
    // Drawing Helpers for World Entities
    // ==========================================
    drawTerrainTile(ctx, x, y, type, waterFrame = 0) {
        if (type === 0) return;
        let img = null;
        if (type === 3) {
            img = this.cache[`terrain_3_${waterFrame % 2}`];
        } else {
            img = this.cache[`terrain_${type}`];
        }
        if (img) {
            ctx.drawImage(img, Math.round(x), Math.round(y));
        }
    }

    drawEagle(ctx, x, y, isRuined = false) {
        const key = isRuined ? 'eagle_ruined' : 'eagle_alive';
        const img = this.cache[key];
        if (img) {
            ctx.drawImage(img, Math.round(x), Math.round(y));
        }
    }

    drawPowerup(ctx, x, y, type) {
        const img = this.cache[`powerup_${type}`];
        if (img) {
            ctx.drawImage(img, Math.round(x), Math.round(y));
        }
    }

    drawBullet(ctx, x, y) {
        ctx.fillStyle = this.palette.white;
        ctx.fillRect(Math.round(x), Math.round(y), 4, 4);
        ctx.fillStyle = this.palette.black;
        ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, 2, 2);
    }

    drawExplosion(ctx, x, y, frame, isBig = false) {
        if (isBig) {
            const f = Math.min(4, Math.max(0, frame));
            const img = this.cache[`exp_big_${f}`];
            if (img) ctx.drawImage(img, Math.round(x - 8), Math.round(y - 8));
        } else {
            const f = Math.min(2, Math.max(0, frame));
            const img = this.cache[`exp_small_${f}`];
            if (img) ctx.drawImage(img, Math.round(x), Math.round(y));
        }
    }

    drawSpawnShimmer(ctx, x, y, frame) {
        const f = Math.min(3, Math.max(0, frame));
        const img = this.cache[`spawn_${f}`];
        if (img) ctx.drawImage(img, Math.round(x), Math.round(y));
    }

    drawShield(ctx, x, y, tick) {
        // Animated sparkling invulnerability ring
        const cx = Math.round(x) + 8;
        const cy = Math.round(y) + 8;
        ctx.save();
        ctx.lineWidth = 1.5;

        // Alternating cyan and white dashed ellipse
        ctx.strokeStyle = (Math.floor(tick / 2) % 2 === 0) ? this.palette.waterWave : this.palette.white;
        ctx.beginPath();
        ctx.arc(cx, cy, 9.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = (Math.floor(tick / 2) % 2 === 0) ? this.palette.white : this.palette.playerYellow;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // ==========================================
    // Authentic 8x8 NES Pixel Font
    // ==========================================
    drawText(ctx, text, x, y, color = '#ffffff', scale = 1) {
        const str = String(text).toUpperCase();
        ctx.fillStyle = color;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const charData = FONT_8X8[char] || FONT_8X8[' '];
            const startX = x + i * 8 * scale;

            for (let r = 0; r < 8; r++) {
                const rowBits = charData[r] || 0;
                for (let c = 0; c < 8; c++) {
                    if ((rowBits >> (7 - c)) & 1) {
                        ctx.fillRect(startX + c * scale, y + r * scale, scale, scale);
                    }
                }
            }
        }
    }
}

// 8x8 NES Bitmap Font table
const FONT_8X8 = {
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    '0': [0x3C, 0x66, 0x6E, 0x76, 0x66, 0x66, 0x3C, 0x00],
    '1': [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7E, 0x00],
    '2': [0x3C, 0x66, 0x06, 0x0C, 0x18, 0x30, 0x7E, 0x00],
    '3': [0x3C, 0x66, 0x06, 0x1C, 0x06, 0x66, 0x3C, 0x00],
    '4': [0x0C, 0x1C, 0x34, 0x64, 0x7E, 0x04, 0x04, 0x00],
    '5': [0x7E, 0x60, 0x7C, 0x06, 0x06, 0x66, 0x3C, 0x00],
    '6': [0x1C, 0x30, 0x60, 0x7C, 0x66, 0x66, 0x3C, 0x00],
    '7': [0x7E, 0x06, 0x0C, 0x18, 0x30, 0x30, 0x30, 0x00],
    '8': [0x3C, 0x66, 0x66, 0x3C, 0x66, 0x66, 0x3C, 0x00],
    '9': [0x3C, 0x66, 0x66, 0x3E, 0x06, 0x0C, 0x38, 0x00],
    'A': [0x18, 0x3C, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x00],
    'B': [0x7C, 0x66, 0x66, 0x7C, 0x66, 0x66, 0x7C, 0x00],
    'C': [0x3C, 0x66, 0x60, 0x60, 0x60, 0x66, 0x3C, 0x00],
    'D': [0x78, 0x6C, 0x66, 0x66, 0x66, 0x6C, 0x78, 0x00],
    'E': [0x7E, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x7E, 0x00],
    'F': [0x7E, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x60, 0x00],
    'G': [0x3C, 0x66, 0x60, 0x6E, 0x66, 0x66, 0x3C, 0x00],
    'H': [0x66, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x00],
    'I': [0x3C, 0x18, 0x18, 0x18, 0x18, 0x18, 0x3C, 0x00],
    'J': [0x0E, 0x06, 0x06, 0x06, 0x06, 0x66, 0x3C, 0x00],
    'K': [0x66, 0x6C, 0x78, 0x70, 0x78, 0x6C, 0x66, 0x00],
    'L': [0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x7E, 0x00],
    'M': [0x63, 0x77, 0x7F, 0x6B, 0x63, 0x63, 0x63, 0x00],
    'N': [0x66, 0x76, 0x7E, 0x7E, 0x6E, 0x66, 0x66, 0x00],
    'O': [0x3C, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00],
    'P': [0x7C, 0x66, 0x66, 0x7C, 0x60, 0x60, 0x60, 0x00],
    'Q': [0x3C, 0x66, 0x66, 0x66, 0x6A, 0x6C, 0x36, 0x00],
    'R': [0x7C, 0x66, 0x66, 0x7C, 0x6C, 0x66, 0x66, 0x00],
    'S': [0x3C, 0x66, 0x60, 0x3C, 0x06, 0x66, 0x3C, 0x00],
    'T': [0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00],
    'U': [0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00],
    'V': [0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x00],
    'W': [0x63, 0x63, 0x63, 0x6B, 0x7F, 0x77, 0x63, 0x00],
    'X': [0x66, 0x66, 0x3C, 0x18, 0x3C, 0x66, 0x66, 0x00],
    'Y': [0x66, 0x66, 0x66, 0x3C, 0x18, 0x18, 0x18, 0x00],
    'Z': [0x7E, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x7E, 0x00],
    '-': [0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00],
    ':': [0x00, 0x18, 0x18, 0x00, 0x18, 0x18, 0x00, 0x00],
    '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00],
    '!': [0x18, 0x18, 0x18, 0x18, 0x00, 0x00, 0x18, 0x00],
    'x': [0x00, 0x00, 0x42, 0x24, 0x18, 0x24, 0x42, 0x00],
    '=': [0x00, 0x7E, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00],
    '>': [0x60, 0x30, 0x18, 0x0C, 0x18, 0x30, 0x60, 0x00],
    '<': [0x06, 0x0C, 0x18, 0x30, 0x18, 0x0C, 0x06, 0x00]
};

// Global sprite engine singleton
window.spriteEngine = new SpriteEngine();
