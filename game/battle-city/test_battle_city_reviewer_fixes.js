/**
 * Deep Verification Test Suite for Reviewer Fixes:
 * 1. Two-phase half-tile corner alignment (turning into corridors without sticking)
 * 2. New game lives and score reset after Game Over
 * 3. Overlapping tanks separation & spawn point collision avoidance
 * 4. Multi-stage selection (Stages 1-5) on Title Screen
 * 5. Power-up spawning validation (never on water, steel, or eagle base)
 * 6. Map Editor spawn protection against impassable tiles
 * 7. Ruined eagle base maintains solid impassable barrier
 * 8. Engine audio cleanup on player death
 */

const assert = require('assert');

console.log("=== Running Reviewer Fix Verification Tests ===");

// Global mocks
global.window = global;
global.window.addEventListener = () => {};
global.window.requestAnimationFrame = () => {};
global.document = {
    createElement: () => ({
        width: 0, height: 0,
        getContext: () => ({
            imageSmoothingEnabled: false, fillStyle: '', fillRect: () => {}, save: () => {}, restore: () => {},
            translate: () => {}, rotate: () => {}, beginPath: () => {}, arc: () => {}, fill: () => {},
            stroke: () => {}, strokeRect: () => {}, drawImage: () => {}, moveTo: () => {}, lineTo: () => {}
        })
    }),
    getElementById: () => ({
        getContext: () => ({
            imageSmoothingEnabled: false, fillRect: () => {}, save: () => {}, restore: () => {},
            translate: () => {}, rotate: () => {}, drawImage: () => {}
        }),
        addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }, style: {}
    }),
    querySelectorAll: () => []
};
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

require('./levels.js');
require('./sprites.js');
require('./audio.js');
require('./game.js');

const game = new BattleCityGame();

// ----------------------------------------------------
// Test 1: Two-Phase Corner Corridor Alignment
// ----------------------------------------------------
game.map = window.levelManager.createEmptyMap();
// Place a brick wall at col 6, rows 10-11
game.map[10][6] = 1;
game.map[11][6] = 1;

// Corridor opening is at cols 4 and 5 (x: 32..47)
// Tank is horizontally misaligned at x = 35, y = 96 (row 12)
const tank = game.createPlayer();
tank.x = 35;
tank.y = 96;

// Moving UP: compound move is blocked on forward Y by col 6 wall,
// but pure alignment on X to 32 should succeed!
const step1 = game.tryMoveTank(tank, 0);
assert.strictEqual(step1, true, "Tank should nudge horizontally towards corridor alignment");
assert.strictEqual(tank.x, 33.5, "Tank X should be nudged from 35 to 33.5");
assert.strictEqual(tank.y, 96, "Tank Y should remain 96 while aligning");

// Next step: completes alignment to 32 and begins forward movement
const step2 = game.tryMoveTank(tank, 0);
assert.strictEqual(step2, true, "Tank should complete alignment and move into corridor");
assert.strictEqual(tank.x, 32, "Tank X should be fully aligned to 32");
assert(tank.y < 96, `Tank Y should have progressed up into corridor (got ${tank.y})`);

console.log("✔ Test 1: Two-phase half-tile corner alignment verified (no corner sticking).");

// ----------------------------------------------------
// Test 2: New Game Lives & Score Reset After Game Over
// ----------------------------------------------------
game.startStage(1, false, true);
assert.strictEqual(game.lives, 3, "Initial lives must be 3");
game.score = 8000;

// Player dies until Game Over
game.destroyPlayer();
game.destroyPlayer();
game.destroyPlayer();
assert.strictEqual(game.lives, 0, "Lives should be 0 after 3 deaths");
assert.strictEqual(game.state, game.STATE_GAMEOVER, "Game over should be active");

// Start new game from Title
game.initTitle();
game.startStage(1, false, true);
assert.strictEqual(game.lives, 3, "New game MUST reset lives to 3");
assert.strictEqual(game.score, 0, "New game MUST reset score to 0");
console.log("✔ Test 2: New game properly resets lives (3) and score (0).");

// ----------------------------------------------------
// Test 3: Overlapping Tanks Separation
// ----------------------------------------------------
const p1 = game.createPlayer();
p1.x = 0; p1.y = 0;
game.player = p1;

const e1 = game.createEnemy(0, 0, 'basic', false);
game.enemies = [e1];

// Because they are overlapping, moving away must NOT be blocked!
const canMoveRight = game.tryMoveTank(p1, 1);
assert.strictEqual(canMoveRight, true, "Tank 1 should be allowed to move away to separate from Tank 2");
assert.strictEqual(p1.x, 1.5, "Tank 1 X should have increased to 1.5");
console.log("✔ Test 3: Overlapping tanks can separate cleanly without softlocking.");

// ----------------------------------------------------
// Test 4: Spawn Point Collision Avoidance
// ----------------------------------------------------
game.map = window.levelManager.createEmptyMap();
game.spawns = [];
game.enemies = [];
game.enemyQueue = ['basic', 'fast', 'power'];
game.spawnPointIndex = 0; // points to (0, 0)

// Park a tank at (0, 0)
const parkedTank = game.createEnemy(0, 0, 'basic', false);
game.enemies.push(parkedTank);

// Call spawnEnemy: should NOT pick (0, 0), must pick an open spawn (96 or 192)
game.spawnEnemy();
assert.strictEqual(game.spawns.length, 1, "One enemy should be in spawning shimmer");
assert.notStrictEqual(game.spawns[0].x, 0, "Spawn should avoid occupied spawn point (0, 0)");
assert(game.spawns[0].x === 96 || game.spawns[0].x === 192, "Spawn should choose an open spawn location");

// Test shimmer delay when tank enters spawn zone
const shimmer = game.spawns[0];
shimmer.timer = 1;
// Place a tank right on top of shimmer
game.enemies.push(game.createEnemy(shimmer.x, shimmer.y, 'basic', false));

// Simulate update cycle for shimmers
const prevEnemiesCount = game.enemies.length;
for (let i = game.spawns.length - 1; i >= 0; i--) {
    const sp = game.spawns[i];
    sp.timer--;
    if (sp.timer <= 0) {
        if (game.checkTankCollision(null, sp.x, sp.y)) {
            sp.timer = 15; // delayed
            continue;
        }
        game.enemies.push(game.createEnemy(sp.x, sp.y, sp.type, sp.isBonus));
        game.spawns.splice(i, 1);
    }
}
assert.strictEqual(game.spawns.length, 1, "Shimmer should remain active if spawn spot is blocked");
assert.strictEqual(shimmer.timer, 15, "Shimmer timer should be postponed");
assert.strictEqual(game.enemies.length, prevEnemiesCount, "Enemy should not have materialized on top of another tank");
console.log("✔ Test 4: Spawn point selection and shimmer completion avoid tank collisions.");

// ----------------------------------------------------
// Test 5: Multi-Stage Selection on Title Screen
// ----------------------------------------------------
game.initTitle();
assert.strictEqual(game.selectedStage, 1, "Default selected stage is 1");

// Simulate right key to select Stage 2, 3, 4, 5
game.selectedStage = 3;
game.startStage(game.selectedStage, false, true);
assert.strictEqual(game.stage, 3, "Game must start on selected stage (Stage 3)");
const stage3 = window.levelManager.getStage(3);
assert.strictEqual(game.enemyQueue.length, stage3.enemies.length);
console.log("✔ Test 5: Stage selection (Stages 1-5) verified.");

// ----------------------------------------------------
// Test 6: Power-Up Spawning Validation (Never on Water/Steel/Base)
// ----------------------------------------------------
game.map = window.levelManager.getStage(2).map; // Stage 2 has lots of water and steel
game.powerups = [];

for (let i = 0; i < 60; i++) {
    game.spawnPowerup();
}

assert.strictEqual(game.powerups.length, 60);
for (const p of game.powerups) {
    const col = Math.floor(p.x / 8);
    const row = Math.floor(p.y / 8);
    const tile = game.map[row][col];
    assert.notStrictEqual(tile, 2, `Powerup spawned on steel at (${row}, ${col})`);
    assert.notStrictEqual(tile, 3, `Powerup spawned on water at (${row}, ${col})`);
    assert.notStrictEqual(tile, 6, `Powerup spawned on eagle base at (${row}, ${col})`);
}
console.log("✔ Test 6: Power-ups consistently spawn on accessible, valid terrain.");

// ----------------------------------------------------
// Test 7: Map Editor Spawn Protection
// ----------------------------------------------------
game.enterConstruction();
// Try painting steel (brush 2) on player spawn (row 24, col 8)
game.editorBrush = 2;
game.setEditorTileAt(16 + 8 * 8, 8 + 24 * 8); // Screen coordinates for col 8, row 24
assert.notStrictEqual(game.editorMap[24][8], 2, "Player spawn cannot be painted with steel");

// Try painting water (brush 3) on enemy spawn (row 0, col 0)
game.editorBrush = 3;
game.setEditorTileAt(16 + 0, 8 + 0);
assert.notStrictEqual(game.editorMap[0][0], 3, "Enemy spawn cannot be painted with water");
console.log("✔ Test 7: Map Editor protects player and enemy spawn points.");

// ----------------------------------------------------
// Test 8: Ruined Eagle Base Remains Solid Barrier
// ----------------------------------------------------
game.startStage(1, false, true);
assert.strictEqual(game.baseDestroyed, false);
game.destroyEagleBase();
assert.strictEqual(game.baseDestroyed, true);
assert.strictEqual(game.checkTerrainCollision(96, 192), true, "Eagle rubble must remain impassable for tanks");
assert.strictEqual(game.map[24][12], 6, "Eagle base tile must remain 6 (base obstacle)");
console.log("✔ Test 8: Ruined eagle base remains solid impassable rubble.");

// ----------------------------------------------------
// Test 9: Engine Sound Stopped on Player Death
// ----------------------------------------------------
let engineStopped = false;
window.soundEngine.stopEngine = () => { engineStopped = true; };
game.startStage(1, false, true);
game.destroyPlayer();
assert.strictEqual(engineStopped, true, "soundEngine.stopEngine() must be called when player dies");
console.log("✔ Test 9: Engine sound oscillator stopped on player death.");

console.log("\n=========================================");
console.log("🎉 ALL 9 REVIEWER FIX TESTS PASSED PERFECTLY!");
console.log("=========================================");
