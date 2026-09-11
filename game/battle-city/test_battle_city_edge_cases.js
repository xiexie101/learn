/**
 * Edge Cases & Boundary Verification Tests for Battle City
 */

const assert = require('assert');

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

require('./levels.js');
require('./sprites.js');
require('./audio.js');
require('./game.js');

console.log("=== Running Edge Cases & Boundary Tests ===");

const game = new BattleCityGame();
game.startStage(1, false);
game.map = window.levelManager.createEmptyMap();

// Edge Case 1: Tank vs Tank Collision
const tank1 = game.createPlayer();
tank1.x = 40;
tank1.y = 40;
game.player = tank1;

const tank2 = game.createEnemy(40, 56, 'basic', false); // directly below tank1
game.enemies = [tank2];

// Try moving tank1 DOWN into tank2
const movedDown = game.tryMoveTank(tank1, 2);
assert.strictEqual(movedDown, false, "Tank1 should be blocked by Tank2 directly below");
assert.strictEqual(tank1.y, 40, "Tank1 Y coordinate must remain unchanged");
console.log("✔ Edge Case 1: Tank vs Tank collision prevents overlap.");

// Edge Case 2: Water Impermeability for Tanks vs Permeability for Bullets
game.map[10][10] = 3; // Water at row 10, col 10 (x: 80..87, y: 80..87)
const waterCollisionForTank = game.checkTerrainCollision(80, 80);
assert.strictEqual(waterCollisionForTank, true, "Water must block tank movement");

const waterBullet = { x: 82, y: 82, speed: 3, dir: 0, isDead: false };
const waterHit = game.handleBulletTerrainCollision(waterBullet);
assert.strictEqual(waterHit, false, "Water must NOT block bullets (bullets fly over)");
assert.strictEqual(game.map[10][10], 3, "Water tile must remain intact");
console.log("✔ Edge Case 2: Water blocks tanks but allows bullets to pass through.");

// Edge Case 3: Trees Permeability for Tanks & Bullets
game.map[5][5] = 4; // Trees at row 5, col 5
const treeCollisionForTank = game.checkTerrainCollision(40, 40);
assert.strictEqual(treeCollisionForTank, false, "Trees must be passable for tanks (stealth movement)");

const treeBullet = { x: 42, y: 42, speed: 3, dir: 0, isDead: false };
const treeHit = game.handleBulletTerrainCollision(treeBullet);
assert.strictEqual(treeHit, false, "Trees must NOT block bullets");
assert.strictEqual(game.map[5][5], 4, "Tree tile must remain intact");
console.log("✔ Edge Case 3: Trees are passable for both tanks and bullets (under foliage).");

// Edge Case 4: Ice Sliding Detection
game.map[8][8] = 5; // Ice at row 8, col 8 (x: 64, y: 64)
assert.strictEqual(game.isTankOnIce(60, 60), true, "Tank over ice must be detected as on ice");
assert.strictEqual(game.isTankOnIce(0, 0), false, "Tank on empty ground is not on ice");
console.log("✔ Edge Case 4: Ice sliding surface detection verified.");

// Edge Case 5: Bullet vs Bullet Annihilation
const playerBullet = { owner: 'player', x: 50, y: 50, dir: 0, speed: 3, isDead: false };
const enemyBullet = { owner: 'enemy', x: 50, y: 51, dir: 2, speed: 3, isDead: false };
game.bullets = [playerBullet, enemyBullet];
game.updateBullets();
assert.strictEqual(playerBullet.isDead, true, "Player bullet should be destroyed on collision with enemy bullet");
assert.strictEqual(enemyBullet.isDead, true, "Enemy bullet should be destroyed on collision with player bullet");
assert.strictEqual(game.bullets.length, 0, "Both collided bullets should be removed from active bullets");
console.log("✔ Edge Case 5: Bullet vs Bullet head-on annihilation verified.");

// Edge Case 6: Map Boundaries
const edgeTank = game.createPlayer();
edgeTank.x = 0;
edgeTank.y = 0;
// Try moving LEFT outside map
game.tryMoveTank(edgeTank, 3);
assert.strictEqual(edgeTank.x, 0, "Tank cannot move left past x = 0");
// Try moving UP outside map
game.tryMoveTank(edgeTank, 0);
assert.strictEqual(edgeTank.y, 0, "Tank cannot move up past y = 0");

edgeTank.x = 192;
edgeTank.y = 192;
// Try moving RIGHT outside map
game.tryMoveTank(edgeTank, 1);
assert.strictEqual(edgeTank.x, 192, "Tank cannot move right past x = 192");
// Try moving DOWN outside map
game.tryMoveTank(edgeTank, 2);
assert.strictEqual(edgeTank.y, 192, "Tank cannot move down past y = 192");
console.log("✔ Edge Case 6: Playfield boundaries [0, 192] strictly respected.");

// Edge Case 7: Bullet Flying Offscreen
const offscreenBullet = { owner: 'player', x: -5, y: 50, speed: 3, dir: 3, isDead: false };
game.bullets = [offscreenBullet];
game.player.activeBullets = 1;
game.updateBullets();
assert.strictEqual(offscreenBullet.isDead, true, "Offscreen bullet should despawn");
assert.strictEqual(game.player.activeBullets, 0, "Player active bullet counter should decrement on despawn");
console.log("✔ Edge Case 7: Offscreen bullet cleanup and counter release verified.");

// Edge Case 8: Player Shield Deflection vs Vulnerability
const playerTank = game.createPlayer();
playerTank.x = 100;
playerTank.y = 100;
playerTank.shieldTimer = 100; // shielded
game.player = playerTank;
const enemyBulletNear = { owner: 'enemy', x: 102, y: 102, speed: 3, dir: 2, isDead: false };
const hitShield = game.handleBulletTankCollision(enemyBulletNear);
assert.strictEqual(hitShield, true, "Bullet hit shielded player");
assert.strictEqual(playerTank.isDead, false, "Shielded player must NOT be destroyed by bullet");

// Now test with shield expired
playerTank.shieldTimer = 0;
const enemyBulletFatal = { owner: 'enemy', x: 102, y: 102, speed: 3, dir: 2, isDead: false };
const hitFatal = game.handleBulletTankCollision(enemyBulletFatal);
assert.strictEqual(hitFatal, true);
assert.strictEqual(playerTank.isDead, true, "Unshielded player MUST be destroyed when hit");
console.log("✔ Edge Case 8: Player shield invulnerability vs unshielded vulnerability verified.");

console.log("\n=========================================");
console.log("🎉 ALL 8 EDGE CASE TESTS PASSED PERFECTLY!");
console.log("=========================================");
