/**
 * Automated Test Suite for Battle City Logic & Physics
 */

const assert = require('assert');
const fs = require('fs');

console.log("=== Battle City Verification Tests ===");

// 1. Mock browser globals for Node environment
global.window = global;
global.window.addEventListener = () => {};
global.window.requestAnimationFrame = () => {};
global.document = {
    createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({
            imageSmoothingEnabled: false,
            fillStyle: '',
            fillRect: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            strokeRect: () => {},
            drawImage: () => {},
            moveTo: () => {},
            lineTo: () => {}
        })
    }),
    getElementById: () => ({
        getContext: () => ({
            imageSmoothingEnabled: false,
            fillRect: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            drawImage: () => {}
        }),
        addEventListener: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        style: {}
    }),
    querySelectorAll: () => []
};

global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

// 2. Load and verify Levels
require('./levels.js');
const levelManager = window.levelManager;
assert(levelManager, "LevelManager should be instantiated");

for (let s = 1; s <= 5; s++) {
    const stage = levelManager.getStage(s);
    assert.strictEqual(stage.stageNumber, s, `Stage number should be ${s}`);
    assert.strictEqual(stage.map.length, 26, `Stage ${s} map should have 26 rows`);
    for (let r = 0; r < 26; r++) {
        assert.strictEqual(stage.map[r].length, 26, `Stage ${s} row ${r} should have 26 cols`);
        for (let c = 0; c < 26; c++) {
            const val = stage.map[r][c];
            assert(val >= 0 && val <= 6, `Invalid tile value ${val} at (${r}, ${c}) in Stage ${s}`);
        }
    }
    // Verify Eagle Base
    assert.strictEqual(stage.map[24][12], 6, `Base eagle at (24, 12)`);
    assert.strictEqual(stage.map[24][13], 6, `Base eagle at (24, 13)`);
    assert.strictEqual(stage.map[25][12], 6, `Base eagle at (25, 12)`);
    assert.strictEqual(stage.map[25][13], 6, `Base eagle at (25, 13)`);

    // Verify 20 enemies per stage
    assert.strictEqual(stage.enemies.length, 20, `Stage ${s} must have exactly 20 enemies`);
    assert(stage.bonusIndices.length >= 3, `Stage ${s} must have at least 3 bonus tanks`);
}
console.log("✔ Level Manager & Stage 1-5 maps verified (dimensions, eagle base, 20 enemies).");

// Test custom map storage
const emptyMap = levelManager.createEmptyMap();
assert.strictEqual(emptyMap[24][12], 6, "Empty map should preserve eagle base");
emptyMap[5][5] = 2; // add steel
assert(levelManager.saveCustomMap(emptyMap), "Saving custom map should succeed");
const loadedMap = levelManager.loadCustomMap();
assert.strictEqual(loadedMap[5][5], 2, "Loaded custom map should have tile (5, 5) = 2");
console.log("✔ Custom Map LocalStorage persistence verified.");

// 3. Load and verify Sprites
require('./sprites.js');
const spriteEngine = window.spriteEngine;
assert(spriteEngine, "SpriteEngine should be instantiated");
assert(spriteEngine.palette.playerYellow, "Palette playerYellow should exist");
assert(spriteEngine.palette.bonusRed, "Palette bonusRed should exist");
assert(spriteEngine.palette.brickRed, "Palette brickRed should exist");
assert(spriteEngine.palette.steelLight, "Palette steelLight should exist");
assert(spriteEngine.palette.treeGreen, "Palette treeGreen should exist");
assert(spriteEngine.palette.iceBase, "Palette iceBase should exist");
assert(spriteEngine.palette.eagleGold, "Palette eagleGold should exist");
console.log("✔ Sprite Engine initialized with 8-bit palette and offscreen canvases.");

// 4. Test Game Physics & Collision Logic
// Load Sound Engine first
require('./audio.js');
// Load Game Engine
require('./game.js');

// Create mock instance
const game = new BattleCityGame();
game.startStage(1, false);

// Test Half-Tile Snapping
game.map = levelManager.createEmptyMap();
const tank = game.createPlayer();
tank.x = 34; // mod 8 is 2, within 3
tank.y = 100;
game.tryMoveTank(tank, 0); // try moving UP
// Should have nudged X towards 32
assert(tank.x < 34, `Tank X should have been nudged towards 32 (got ${tank.x})`);

tank.x = 37; // mod 8 is 5, >= 5
game.tryMoveTank(tank, 0); // try moving UP
// Should have nudged X towards 40
assert(tank.x > 37, `Tank X should have been nudged towards 40 (got ${tank.x})`);
console.log("✔ Half-Tile Corridor Grid Snapping algorithm verified.");
game.startStage(1, false);

// Test Terrain Collision
// In empty area (0, 0 is top left empty spawn point)
assert.strictEqual(game.checkTerrainCollision(0, 0), false, "Top left spawn point should be free of obstacles");
// At eagle base (x=96, y=192)
assert.strictEqual(game.checkTerrainCollision(96, 192), true, "Eagle base should be impassable for tanks");
console.log("✔ Terrain collision checks (free space vs obstacle) verified.");

// Test Half-Brick Destruction
game.map[10][10] = 1; // brick
game.map[10][11] = 1; // adjacent brick
// Bullet hitting seam between col 10 and 11:
// Col 10 x is 80..87, Col 11 x is 88..95
// Bullet at x=86..89 spans both col 10 and col 11
const seamBullet = {
    x: 86,
    y: 80, // row 10
    canBreakSteel: false,
    speed: 3
};
const collided = game.handleBulletTerrainCollision(seamBullet);
assert.strictEqual(collided, true, "Seam bullet should collide with bricks");
assert.strictEqual(game.map[10][10], 0, "Col 10 brick should be destroyed");
assert.strictEqual(game.map[10][11], 0, "Col 11 brick should be destroyed (half-brick destruction)");
console.log("✔ Half-Brick destruction logic verified.");

// Test Steel Destruction
game.map[5][5] = 2; // steel
const normalBullet = { x: 40, y: 40, canBreakSteel: false };
game.handleBulletTerrainCollision(normalBullet);
assert.strictEqual(game.map[5][5], 2, "Normal bullet cannot destroy steel");

const star3Bullet = { x: 40, y: 40, canBreakSteel: true };
game.handleBulletTerrainCollision(star3Bullet);
assert.strictEqual(game.map[5][5], 0, "Star 3 bullet MUST destroy steel");
console.log("✔ Steel wall resistance & Star 3 steel piercing verified.");

// Test Eagle Base Hit
assert.strictEqual(game.baseDestroyed, false);
const baseBullet = { x: 98, y: 194, canBreakSteel: false }; // hits base
game.handleBulletTerrainCollision(baseBullet);
assert.strictEqual(game.baseDestroyed, true, "Eagle base hit must set baseDestroyed = true");
assert.strictEqual(game.state, game.STATE_GAMEOVER, "Base destruction must trigger Game Over");
console.log("✔ Eagle Base destruction & Game Over trigger verified.");

// Test Armor Tank Hit Points
const armorEnemy = game.createEnemy(50, 50, 'armor', false);
assert.strictEqual(armorEnemy.hitsLeft, 4, "Armor tank must start with 4 hit points");
game.enemies = [armorEnemy];

// Hit 1
const pBullet1 = { owner: 'player', x: 52, y: 52 };
game.handleBulletTankCollision(pBullet1);
assert.strictEqual(armorEnemy.hitsLeft, 3, "Armor tank should have 3 hits left after 1st shot");
assert.strictEqual(game.enemies.length, 1, "Armor tank should still be alive");

// Hit 2 & 3
game.handleBulletTankCollision({ owner: 'player', x: 52, y: 52 });
game.handleBulletTankCollision({ owner: 'player', x: 52, y: 52 });
assert.strictEqual(armorEnemy.hitsLeft, 1, "Armor tank should have 1 hit left after 3rd shot");

// Hit 4
game.handleBulletTankCollision({ owner: 'player', x: 52, y: 52 });
assert.strictEqual(game.enemies.length, 0, "Armor tank should be destroyed after 4th hit");
assert.strictEqual(game.tallyStats.armor, 1, "Armor tank kill count should be incremented in tally stats");
console.log("✔ Armor tank multi-hit damage & tally stats verified.");

// Test Shovel Fortress Transformation
game.startStage(1, false);
assert.strictEqual(game.map[23][11], 1, "Fortress wall should be brick initially");
game.applyPowerup('shovel');
assert.strictEqual(game.map[23][11], 2, "Fortress wall should turn to steel on Shovel powerup");
// Advance shovel timer to expiration
game.shovelTimer = 1;
game.updateShovel();
game.updateShovel();
assert.strictEqual(game.map[23][11], 1, "Fortress wall should revert to brick after Shovel expires");
console.log("✔ Shovel fortress reinforcement and reversion verified.");

// Test Grenade (Bomb)
const e1 = game.createEnemy(10, 10, 'basic', false);
const e2 = game.createEnemy(50, 50, 'fast', false);
game.enemies = [e1, e2];
game.applyPowerup('grenade');
assert.strictEqual(game.enemies.length, 0, "Grenade must clear all active enemies");
assert.strictEqual(game.tallyStats.basic, 1, "Grenade kills must be recorded in tally");
assert.strictEqual(game.tallyStats.fast, 1);
console.log("✔ Grenade power-up clearing active enemies verified.");

// Test Clock (Timer) Freeze
game.applyPowerup('clock');
assert(game.clockFreezeTimer > 0, "Clock must set freeze timer");
const beforeX = 10;
const testEnemy = game.createEnemy(beforeX, 10, 'fast', false);
game.enemies = [testEnemy];
game.updateEnemies();
assert.strictEqual(testEnemy.x, beforeX, "Enemy should not move while clock freeze is active");
console.log("✔ Clock power-up freeze verified.");

// Test Star Upgrade Progression
const p = game.player;
assert.strictEqual(p.tier, 0, "Initial player tier is 0");
game.applyPowerup('star');
assert.strictEqual(p.tier, 1, "Player tier is 1 after 1 star");
game.applyPowerup('star');
assert.strictEqual(p.tier, 2, "Player tier is 2 after 2 stars");
game.applyPowerup('star');
assert.strictEqual(p.tier, 3, "Player tier is 3 after 3 stars");
game.applyPowerup('star');
assert.strictEqual(p.tier, 3, "Player tier capped at 3");
console.log("✔ Tank upgrade progression (Star 0 to 3) verified.");

console.log("\n=========================================");
console.log("🎉 ALL 11 TEST SUITES PASSED FLAWLESSLY!");
console.log("=========================================");
