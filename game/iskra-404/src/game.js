import { TAU, clamp, lerp, approach, dist, angDelta, springTo, reseedSim, rnd } from './util.js';
import { REC } from './dev.js';
import { BOARDS, currentBoard, loadBest, saveBest } from './board.js';
import { makeLevel, TILE, hasLineOfSight } from './level.js';
import {
  makePools, spawnFrom, moveCollide, updateEnemy, alertEnemy,
  shieldBlocks, shieldSegmentAt, shieldCount, armourArc, armourLayout,
  outermostPlate, plateBit, columnDepth,
  WEAPONS, ENEMY_DEF, MAX_ENEMIES, MAX_BULLETS, MAX_PICKUPS, MAX_THROWN,
  S_IDLE, S_SEARCH, S_CHASE, S_DOWN, S_DEAD, MAX_DASH, DASH_CD,
} from './entities.js';
import { initAudio, sfx, setTimeScale } from './audio.js';
import { YELLOW } from './brand.js';
import { ZOOM } from './render.js';

const WEAPON_KEYS = ['fists', 'knife', 'bat', 'pistol', 'revolver', 'smg', 'shotgun'];

// Slow motion is punctuation, not a stance. It fires on moments worth watching,
// and a lockout after each one keeps a busy fight from turning into a crawl.
const SLOW = {
  dash:     { dur: 0.17, scale: 0.34 },
  throw:    { dur: 0.34, scale: 0.20 },
  nearMiss: { dur: 0.30, scale: 0.19 },
  slam:     { dur: 0.30, scale: 0.24 },
  execute:  { dur: 0.26, scale: 0.22 },
  lastKill: { dur: 0.95, scale: 0.14, free: true },
};
const PLAYER_SLOW_FLOOR = 0.62; // you keep most of your speed inside a dilation
const SLOW_LOCKOUT = 0.34;      // gap after a dilation before another can start
const TOTAL_TARGET = 404;       // the error code IS the kill counter
const WIN_AT = 200;             // drive it down to 200 OK and the page is fixed

// milestones on the way down. every one of these is a real HTTP status.
const STATUS = {
  403: 'FORBIDDEN', 402: 'PAYMENT REQUIRED', 401: 'UNAUTHORIZED', 400: 'BAD REQUEST',
  418: 'I AM A TEAPOT', 410: 'GONE', 408: 'REQUEST TIMEOUT',
  308: 'PERMANENT REDIRECT', 307: 'TEMPORARY REDIRECT', 304: 'NOT MODIFIED',
  302: 'FOUND', 301: 'MOVED PERMANENTLY', 300: 'MULTIPLE CHOICES',
  226: 'IM USED', 208: 'ALREADY REPORTED', 206: 'PARTIAL CONTENT',
  204: 'NO CONTENT', 202: 'ACCEPTED', 201: 'CREATED', 200: 'OK',
};

// The chip under the code names the last status the counter went past. It has
// to be derived from where the counter IS rather than remembered from when it
// moved, because dying hands kills back and walks the code up again — the label
// used to keep saying FORBIDDEN while the number climbed away from it.
const LADDER = Object.keys(STATUS).map(Number).filter((k) => k <= 404).sort((a, b) => a - b);
function statusFor(remaining) {
  for (const k of LADDER) if (k >= remaining) return STATUS[k];
  return 'NOT FOUND';
}

export function createGame(renderer) {
  const game = {
    renderer,
    state: 'title',
    time: 0,
    floor: 1,
    seed: 0, board: currentBoard(), runT: 0, best: null,
    standings: null, claimed: false, claimError: null, claimRank: null, runResult: null,
    ticks: 0,
    score: 0,
    bestScore: Number(localStorage.getItem('overprint.best') || 0),
    bestFloor: Number(localStorage.getItem('overprint.floor') || 0),
    kills: 0, floorKills: 0,
    combo: 0, comboTimer: 0, bestCombo: 0,
    enemiesLeft: 0,
    remaining: TOTAL_TARGET,
    slowT: 0, slowScale: 1, slowCd: 0, nearMissCd: 0, deathT: 0, lastStatus: TOTAL_TARGET,
    alarmX: 0, alarmY: 0,
    won: false,
    level: null,
    pools: makePools(),
    particles: [],
    flashes: [],
    noiseRings: [],
    targets: [],
    camera: { x: 0, y: 0 },
    shake: 0, hitstop: 0, plateSplit: 0, worldScale: 1, flash: 0,
    banner: null, bannerT: 0, floorStartTime: 0, dashFlash: 0,
    // what the HUD shows, chasing what the game knows. Springs, so a value that
    // changes while the last change is still settling is followed, not snapped.
    ui: { gauge: 0, gaugeV: 0, chain: 0, chainV: 0, code: 404, codeV: 0,
          chainPunch: 0, chainOpen: 0, chainOpenV: 0, tabs: [] },
    reducedMotion: typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches,
    tutorialT: 0, didMove: false, didAttack: false,
    input: {
      up: false, down: false, left: false, right: false,
      fire: false, dash: false,
      throwIt: false, mx: 0, my: 0,
      analog: false, axisX: 0, axisY: 0, hasAim: false, aimAngle: 0,
    },
    player: {
      x: 0, y: 0, vx: 0, vy: 0, aim: 0, alive: true,
      weapon: 'fists', ammo: 0,
      attackCd: 0, swing: 0,
      dashCharges: MAX_DASH, dashCd: 0, dashT: 0, dashX: 0, dashY: 0,
      trail: [],
    },
    // pathfinding
    flow: null, flowT: 0, flowGw: 0, flowGh: 0, flowQueue: null,
  };

  // -------------------------------------------------------------------------
  function particle(x, y, vx, vy, life, size, col, extra) {
    if (game.particles.length > 360) game.particles.shift();
    const p = { x, y, vx, vy, life, max: life, s: size, col, rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 14 };
    if (extra) Object.assign(p, extra);
    game.particles.push(p);
  }

  // brass, thrown out of the side of the gun; it settles onto the sheet
  function ejectCasing(x, y, aim) {
    const side = aim + (Math.PI / 2 + (Math.random() - 0.5) * 1.1) * (Math.random() < 0.5 ? 1 : -1);
    const sp = 120 + Math.random() * 130;
    particle(x, y, Math.cos(side) * sp, Math.sin(side) * sp,
      0.42 + Math.random() * 0.22, 2.6, '#161513', { casing: true });
  }
  function burst(x, y, n, speed, col, size = 2.4, life = 0.5) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = speed * (0.3 + Math.random() * 0.9);
      particle(x, y, Math.cos(a) * s, Math.sin(a) * s, life * (0.5 + Math.random()), size * (0.6 + Math.random()), col);
    }
  }
  function noise(x, y, r, col = '#12A3DA') {
    if (r <= 0) return;
    game.noiseRings.push({ x, y, r, t: 0, dur: 0.5, col });
    game.raiseAlarm(x, y);
    for (const e of game.pools.enemies) {
      if (!e.alive || e.state === S_DOWN || e.state === S_DEAD) continue;
      if (dist(e.x, e.y, x, y) < r) alertEnemy(e, x, y);
    }
  }
  // Dilations are free, but they cannot chain: once one ends there is a short
  // lockout before the next can start, so a busy fight never crawls.
  function triggerSlow(kind) {
    const s = SLOW[kind];
    if (!s) return false;
    if (!s.free && (game.slowT > 0 || game.slowCd > 0)) return false;
    game.slowT = Math.max(game.slowT, s.dur);
    game.slowScale = game.slowT > 0 ? Math.min(game.slowScale, s.scale) : s.scale;
    game.slowCd = s.dur + SLOW_LOCKOUT;
    sfx.focusIn();
    return true;
  }

  function shake(a) { game.shake = Math.min(26, game.shake + a); }
  function hitstop(t) { game.hitstop = Math.max(game.hitstop, t); }

  // A pane is a sightline you can shoot through and, once you break it, a door
  // you made yourself. Everyone can use it afterwards, including them.
  function smashWindow(win, dx = 0, dy = 0) {
    if (!win || !game.level.breakWindow(win)) return false;
    renderer.shards(win.x, win.y, dx, dy);
    burst(win.x, win.y, 14, 240, '#161513', 2.4, 0.5);
    noise(win.x, win.y, 300);
    sfx.glass();
    shake(4);
    game.flowT = 0;      // the map just changed shape
    return true;
  }
  game.smashWindow = smashWindow;

  // whatever they were holding hits the floor with them
  // Shields come apart plate by plate, and the plate that breaks is the one you
  // hit. Open a gap on one side and you can shoot straight through it — unless
  // they turn and put an intact plate back in the way.
  function damageShield(e, amount, hard, fromX, fromY) {
    const segs = e.segs || 1;
    const idx = shieldSegmentAt(e, fromX, fromY);
    e.blockFlash = 0.25;

    if (idx >= 0) {
      // eat down through the column you hit; only spill sideways once it's a hole
      const order = [idx];
      for (let d = 1; d < segs; d++) { order.push(idx - d, idx + d); }
      let cleared = 0;
      for (const i of order) {
        if (cleared >= amount) break;
        if (i < 0 || i >= segs) continue;
        while (cleared < amount) {
          const L = outermostPlate(e, i);
          if (L < 0) break;
          e.shieldSeg &= ~plateBit(e, L, i);
          cleared++;
        }
      }
    }
    e.shieldHp = shieldCount(e.shieldSeg);
    e.stagger = Math.max(e.stagger, hard ? 0.7 : 0.22);
    sfx.block();
    shake(hard ? 7 : 3);
    const arc = armourArc(e);
    const ba = e.angle + (idx >= 0 ? -arc + (idx + 0.5) * ((arc * 2) / segs) : 0);
    burst(e.x + Math.cos(ba) * 22, e.y + Math.sin(ba) * 22, 5, 190, '#161513', 2.2, 0.35);
    if (e.shieldHp <= 0) {
      e.shieldHp = 0;
      e.shieldSeg = 0;
      e.stagger = 0.85;
      hitstop(0.05);
      shake(11);
      sfx.shieldBreak();
      burst(e.x + Math.cos(e.angle) * 22, e.y + Math.sin(e.angle) * 22, 16, 320, '#161513', 3.2, 0.7);
      if (e.armour >= 3) {
        game.banner = e.armour >= 8 ? 'ARMOUR STRIPPED' : 'SHIELD BROKEN';
        game.bannerT = 0.9;
      }
    }
  }
  game.damageShield = damageShield;

  game.dropWeapon = function (e, silent) {
    if (!e.weapon || e.weapon === 'fists') return;
    const k = spawnFrom(game.pools.pickups);
    if (k) {
      k.alive = true;
      k.x = e.x + (rnd() - 0.5) * 18;
      k.y = e.y + (rnd() - 0.5) * 18;
      k.kind = e.weapon; k.ammo = e.ammo; k.angle = rnd() * TAU;
    }
    e.weapon = 'fists'; e.ammo = 0;
    if (!silent) burst(e.x, e.y, 3, 90, '#161513', 2, 0.3);
  };

  game.seekWeapon = function (e) {
    if (ENEMY_DEF[e.type].handless) { e.seeking = 0; return; }
    let best = null, bd = 430 * 430;
    for (const k of game.pools.pickups) {
      if (!k.alive) continue;
      const d = dist(e.x, e.y, k.x, k.y);
      if (d * d < bd) { bd = d * d; best = k; }
    }
    if (!best) { e.seeking = 0; return; }
    e.skx = best.x; e.sky = best.y; e.seeking = 6;
  };

  game.tryTakePickup = function (e) {
    if (ENEMY_DEF[e.type].handless) return true;
    if (e.weapon !== 'fists') return true;
    for (const k of game.pools.pickups) {
      if (!k.alive) continue;
      if (dist(e.x, e.y, k.x, k.y) > 22) continue;
      e.weapon = k.kind; e.ammo = k.ammo || WEAPONS[k.kind].ammo;
      k.alive = false;
      sfx.pickup();
      return true;
    }
    return false;
  };

  // is one of their own standing in the shot?
  game.friendlyInLine = function (e, tx, ty) {
    const dx = tx - e.x, dy = ty - e.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    for (const o of game.pools.enemies) {
      if (o === e || !o.alive || o.state === S_DEAD) continue;
      const px = o.x - e.x, py = o.y - e.y;
      const t = px * ux + py * uy;
      if (t < 20 || t > len) continue;
      const perp = Math.abs(px * -uy + py * ux);
      if (perp < ENEMY_DEF[o.type].r + 5) return true;
    }
    return false;
  };

  // -- pathfinding ----------------------------------------------------------
  // Everything that hunts you routes to this point, not to your live position.
  game.raiseAlarm = function (x, y) {
    const moved = dist(game.alarmX, game.alarmY, x, y) > TILE;
    game.alarmX = x; game.alarmY = y;
    if (moved) game.flowT = 0;
  };

  // 8-way flood from the alarm point. Uniform cost on diagonals keeps the
  // gradient smooth — a 4-way field makes hunters zigzag down staircase paths.
  function computeFlow() {
    const lv = game.level;
    const n = lv.gw * lv.gh;
    if (!game.flow || game.flow.length !== n) {
      game.flow = new Int32Array(n);
      game.flowQueue = new Int32Array(n);
    }
    const flow = game.flow, q = game.flowQueue;
    flow.fill(-1);
    let sx = clamp((game.alarmX / TILE) | 0, 0, lv.gw - 1);
    let sy = clamp((game.alarmY / TILE) | 0, 0, lv.gh - 1);
    if (!lv.walkableTile(sx, sy)) {
      let found = false;
      for (let r = 1; r <= 6 && !found; r++) {
        for (let oy = -r; oy <= r && !found; oy++) {
          for (let ox = -r; ox <= r && !found; ox++) {
            if (Math.abs(ox) !== r && Math.abs(oy) !== r) continue;
            if (lv.walkableTile(sx + ox, sy + oy)) { sx += ox; sy += oy; found = true; }
          }
        }
      }
      if (!found) return;
    }
    let hi = 0, lo = 0;
    const start = sy * lv.gw + sx;
    flow[start] = 0;
    q[hi++] = start;
    while (lo < hi) {
      const cur = q[lo++];
      const cx = cur % lv.gw, cy = (cur / lv.gw) | 0;
      const d = flow[cur] + 1;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          const nx = cx + ox, ny = cy + oy;
          if (!lv.walkableTile(nx, ny)) continue;
          // never squeeze through a diagonal gap between two corners
          if (ox && oy && (!lv.walkableTile(cx + ox, cy) || !lv.walkableTile(cx, cy + oy))) continue;
          const ni = ny * lv.gw + nx;
          if (flow[ni] !== -1) continue;
          flow[ni] = d;
          q[hi++] = ni;
        }
      }
    }
  }

  // smooth descent: a weighted blend of every downhill neighbour, rather than
  // snapping to whichever single tile happens to be lowest
  game.flowStep = function (x, y) {
    const lv = game.level, flow = game.flow;
    if (!flow) return null;
    const gx = clamp((x / TILE) | 0, 0, lv.gw - 1);
    const gy = clamp((y / TILE) | 0, 0, lv.gh - 1);
    const here = flow[gy * lv.gw + gx];
    if (here < 0) return null;
    let ax = 0, ay = 0;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        const nx = gx + ox, ny = gy + oy;
        if (!lv.walkableTile(nx, ny)) continue;
        if (ox && oy && (!lv.walkableTile(gx + ox, gy) || !lv.walkableTile(gx, gy + oy))) continue;
        const v = flow[ny * lv.gw + nx];
        if (v < 0 || v >= here) continue;
        const w = (here - v) / Math.hypot(ox, oy);
        ax += ox * w; ay += oy * w;
      }
    }
    const l = Math.hypot(ax, ay);
    if (l < 1e-4) return null;
    return { x: ax / l, y: ay / l };
  };

  // can a body of this radius walk the straight line between two points?
  game.walkClear = function (ax, ay, bx, by, r) {
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 1) return true;
    const ux = dx / len, uy = dy / len;
    const px = -uy * r, py = ux * r;
    const steps = Math.ceil(len / 10);
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * len;
      const cx = ax + ux * t, cy = ay + uy * t;
      if (game.level.solidAt(cx + px, cy + py)) return false;
      if (game.level.solidAt(cx - px, cy - py)) return false;
    }
    return true;
  };

  // Steering: walk straight at it when the straight line is actually walkable,
  // otherwise ride the flow field around the geometry. This is what stops them
  // pressing themselves into a wall on the far side of a doorway.
  game.pathDir = function (e, tx, ty, r, useField) {
    if (game.walkClear(e.x, e.y, tx, ty, r * 0.85)) {
      const dx = tx - e.x, dy = ty - e.y;
      const l = Math.hypot(dx, dy) || 1;
      return { x: dx / l, y: dy / l, direct: true };
    }
    if (useField) {
      const step = game.flowStep(e.x, e.y);
      if (step) return { x: step.x, y: step.y, direct: false };
    }
    const dx = tx - e.x, dy = ty - e.y;
    const l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l, direct: false };
  };

  game.nearestTarget = function (x, y) {
    let best = null, bd = Infinity;
    for (const t of game.targets) {
      if (!t.alive) continue;
      const d = dist(x, y, t.x, t.y);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  };

  game.shout = function (e, x, y) {
    game.raiseAlarm(x, y);
    game.noiseRings.push({ x: e.x, y: e.y, r: 340, t: 0, dur: 0.55, col: '#EC0A63' });
    for (const o of game.pools.enemies) {
      if (o === e || !o.alive || o.state === S_DOWN || o.state === S_DEAD) continue;
      if (dist(o.x, o.y, e.x, e.y) < 340) alertEnemy(o, x, y, 7);
    }
    sfx.shout();
  };

  // -- floors ---------------------------------------------------------------
  function populate(level) {
    reseedSim(game.seed + game.floor * 104729);
    for (const e of game.pools.enemies) e.alive = false;
    for (const b of game.pools.bullets) b.alive = false;
    for (const k of game.pools.pickups) k.alive = false;
    for (const t of game.pools.thrown) t.alive = false;
    game.particles.length = 0;
    game.flashes.length = 0;
    game.noiseRings.length = 0;
    for (const d of level.doors) { d.open = 0; d.slam = 0; d.swing = 1; }
    level.resetWindows();

    let i = 0;
    for (const s of level.enemySpawns) {
      const e = game.pools.enemies[i++];
      if (!e) break;
      e.alive = true; e.type = s.type; e.x = s.x; e.y = s.y;
      e.weapon = s.weapon || 'fists'; e.ammo = WEAPONS[e.weapon].ammo;
      e.seeking = 0; e.blockFlash = 0; e.stagger = 0;
      e.armour = s.armour || 0;
      if (e.armour) {
        const lay = armourLayout(e.armour);
        e.segs = lay.segs; e.layers = lay.layers;
        // fill inner layers first, so a partial outer layer is the one exposed
        e.shieldSeg = 0;
        let left = e.armour;
        for (let L = 0; L < e.layers && left > 0; L++) {
          for (let i = 0; i < e.segs && left > 0; i++) { e.shieldSeg |= plateBit(e, L, i); left--; }
        }
      } else { e.segs = 0; e.layers = 0; e.shieldSeg = 0; }
      e.shieldHp = e.armour;
      e.vx = e.vy = 0; e.angle = s.angle; e.state = S_IDLE; e.timer = 0;
      e.downTimer = 0; e.fireTimer = 0; e.burst = 0; e.searchT = 0;
      e.ptx = s.x; e.pty = s.y; e.seen = 0; e.chargeT = 0; e.windup = 0;
      e.shoutCd = 0; e.strafe = rnd() < 0.5 ? 1 : -1; e.strafeT = 0;
      e.stuckT = 0; e.lastX = s.x; e.lastY = s.y; e.scanT = rnd() * 0.4; e.reload = 0;
    }
    for (const s of level.pickupSpawns) {
      const k = spawnFrom(game.pools.pickups);
      if (!k) break;
      k.alive = true; k.x = s.x; k.y = s.y; k.kind = s.kind;
      k.ammo = WEAPONS[s.kind].ammo; k.angle = rnd() * TAU;
    }
    const p = game.player;
    p.x = level.spawn.x; p.y = level.spawn.y;
    p.vx = p.vy = 0; p.alive = true; p.weapon = 'fists'; p.ammo = 0;
    p.attackCd = 0; p.swing = 0; p.dashCharges = MAX_DASH; p.dashCd = 0; p.dashT = 0;
    p.trail.length = 0;

    game.floorKills = 0;
    game.combo = 0; game.comboTimer = 0;
    game.enemiesLeft = level.enemySpawns.length;
    game.state = 'play';
    game.alarmX = p.x; game.alarmY = p.y;
    computeFlow();
  }

  // The seed belongs to the RUN, not the floor: every floor is derived from it,
  // so one number decides the whole world and two people on the same board
  // fight the same fight. Only starting a run picks a new one.
  function startFloor(nextFloor) {
    if (nextFloor) game.floor++;
    const diff = game.floor;
    const level = makeLevel(game.seed + game.floor * 7919, diff);
    game.level = level;
    renderer.bakeLevel(level);
    renderer.clearStains();
    populate(level);
    game.camera.x = game.player.x; game.camera.y = game.player.y;
    game.floorStartTime = game.time;
    game.banner = `FLOOR ${String(game.floor).padStart(2, '0')}`;
    game.bannerT = 1.4;
  }

  function restartFloor() {
    renderer.clearStains();
    game.score = Math.max(0, game.score - game.floorKills * 100);
    game.kills -= game.floorKills;
    populate(game.level);
    game.floorStartTime = game.time;
    game.banner = 'REPRINT';
    game.bannerT = 0.9;
  }

  // -- combat ---------------------------------------------------------------
  function registerKill(x, y, power = 1, mult = 1, dx = 0, dy = 0, byEnemy = false) {
    if (!byEnemy) {
      game.combo++;
      game.comboTimer = 3.2;
      game.bestCombo = Math.max(game.bestCombo, game.combo);
      if (game.combo > 1) game.ui.chainPunch = 1;   // the readout takes the hit
    }
    game.kills++;
    game.floorKills++;
    // crossfire still clears the page, it just doesn't pad your chain
    game.score += byEnemy ? 40 : 100 * game.combo * mult;
    game.enemiesLeft = game.pools.enemies.reduce((n, e) => n + (e.alive && e.state !== S_DEAD ? 1 : 0), 0);
    if (!byEnemy && game.player.dashCharges < MAX_DASH) {
      game.player.dashCharges++;
      game.dashFlash = 0.3;   // show the refund, or the meter looks like it lied
    }
    renderer.splat(x, y, power, dx, dy);
    burst(x, y, 14, 260, '#EC0A63', 3, 0.55);
    burst(x, y, 6, 130, '#161513', 2.4, 0.7);
    hitstop(0.055);
    shake(7);
    sfx.kill();
    if (mult > 1) { sfx.execute(); triggerSlow('execute'); }
    if (game.enemiesLeft === 0) {
      game.banner = 'SHEET CLEAR — REACH THE EXIT';
      game.bannerT = 2.2;
      sfx.clear();
      triggerSlow('lastKill');
    }
  }

  function killEnemy(e, power = 1, dx = 0, dy = 0, byEnemy = false) {
    if (!e.alive || e.state === S_DEAD) return false;
    const execution = e.state === S_DOWN;
    e.state = S_DEAD;
    e.vx = e.vy = 0;
    e.deadAngle = e.angle;
    game.dropWeapon(e, true);
    registerKill(e.x, e.y, power, execution ? 2 : 1, dx, dy, byEnemy);
    return true;
  }

  function knockdown(e, dirx, diry) {
    if (!e.alive || e.state === S_DOWN || e.state === S_DEAD) return;
    e.state = S_DOWN;
    e.downTimer = 1.7;
    e.vx = dirx * 320; e.vy = diry * 320;
    e.seeking = 0;
    game.dropWeapon(e, false);
    renderer.splat(e.x, e.y, 0.3, dirx, diry);
    burst(e.x, e.y, 5, 130, '#EC0A63', 2.2, 0.4);
    hitstop(0.035);
    shake(4);
    sfx.knockdown();
  }

  game.killPlayer = function () {
    const p = game.player;
    if (!p.alive || game.state !== 'play') return;
    p.alive = false;
    game.state = 'dying';
    game.deathT = 0.42;
    renderer.splat(p.x, p.y, 1.5);
    burst(p.x, p.y, 26, 320, '#EC0A63', 3.6, 0.8);
    hitstop(0.14);
    shake(20);
    game.flash = 1;
    sfx.die();
  };

  game.onSpotted = function (e) {
    // a sighting is the freshest alarm there is
    game.raiseAlarm(e.lkx, e.lky);
    sfx.alert();
  };

  game.fireEnemyBullet = function (e, tx, ty) {
    const w = WEAPONS[e.weapon] || WEAPONS.pistol;
    const base = Math.atan2(ty - e.y, tx - e.x);
    const n = w.pellets || 1;
    for (let i = 0; i < n; i++) {
      const b = spawnFrom(game.pools.bullets);
      if (!b) break;
      const a = base + (rnd() - 0.5) * (n > 1 ? w.spread * 2 : 0.09);
      b.alive = true;
      b.x = e.x + Math.cos(a) * 16; b.y = e.y + Math.sin(a) * 16;
      b.vx = Math.cos(a) * w.eSpeed; b.vy = Math.sin(a) * w.eSpeed;
      b.life = 2.4; b.friendly = false; b.pierce = 0; b.near = 0;
      b.shieldDmg = w.shieldDmg || 1;
      b.armourPierce = w.armourPierce || 0;
      b.throughDoors = !!w.throughDoors; b.hitDoor = null;
      b.owner = e;
    }
    const emx = e.x + Math.cos(base) * 19, emy = e.y + Math.sin(base) * 19;
    game.flashes.push({ x: emx, y: emy, a: base, t: 0, dur: 0.07, size: 0.85 });
    burst(emx, emy, 4, 140, '#F7CF16', 2, 0.14);
    ejectCasing(e.x, e.y, base);
    noise(e.x, e.y, w.noise);
    const et = clamp(e.ammo / w.ammo, 0, 1);
    if (e.weapon === 'shotgun') sfx.shotgun(et);
    else if (e.weapon === 'smg') sfx.smg(et);
    else if (e.weapon === 'revolver') sfx.revolver(et);
    else sfx.shot(et);
  };

  // one attack routine for every armed thing on the board
  function doAttack(actor, weaponKey) {
    const w = WEAPONS[weaponKey];
    if (w.melee) {
      sfx.swing();
      let hit = false;
      for (const e of game.pools.enemies) {
        if (!e.alive || e.state === S_DEAD) continue;
        const d = dist(actor.x, actor.y, e.x, e.y);
        if (d > w.reach + 10) continue;
        const a = Math.atan2(e.y - actor.y, e.x - actor.x);
        if (Math.abs(angDelta(actor.aim, a)) > 1.0) continue;
        if (shieldBlocks(e, actor.x, actor.y)) {
          damageShield(e, 1, false, actor.x, actor.y);
          continue;
        }
        hit = true;
        if (w.lethal || e.state === S_DOWN) killEnemy(e, 1, Math.cos(a), Math.sin(a));
        else knockdown(e, Math.cos(a), Math.sin(a));
      }
      for (const win of game.level.windows) {
        if (win.broken) continue;
        const d = dist(actor.x, actor.y, win.x, win.y);
        if (d > w.reach + 20) continue;
        const a = Math.atan2(win.y - actor.y, win.x - actor.x);
        if (Math.abs(angDelta(actor.aim, a)) > 1.0) continue;
        smashWindow(win, Math.cos(a), Math.sin(a));
      }
      if (hit) noise(actor.x, actor.y, w.noise);
      return true;
    }
    for (let i = 0; i < w.pellets; i++) {
      const b = spawnFrom(game.pools.bullets);
      if (!b) break;
      const a = actor.aim + (rnd() - 0.5) * w.spread * (w.pellets > 1 ? 2 : 1);
      b.alive = true;
      b.x = actor.x + Math.cos(a) * 16; b.y = actor.y + Math.sin(a) * 16;
      b.vx = Math.cos(a) * w.speed * (0.9 + rnd() * 0.2);
      b.vy = Math.sin(a) * w.speed * (0.9 + rnd() * 0.2);
      b.life = 1.6; b.friendly = true; b.pierce = w.pierce || 0;
      b.shieldDmg = w.shieldDmg || 1;
      b.armourPierce = w.armourPierce || 0;
      b.throughDoors = !!w.throughDoors; b.hitDoor = null;
      b.owner = null; b.near = 0;
    }
    const mx = actor.x + Math.cos(actor.aim) * 19, my = actor.y + Math.sin(actor.aim) * 19;
    game.flashes.push({ x: mx, y: my, a: actor.aim, t: 0, dur: w.pellets > 1 ? 0.1 : 0.07, size: w.pellets > 1 ? 1.5 : 1 });
    burst(mx, my, 5, 200, '#F7CF16', 2.2, 0.16);
    ejectCasing(actor.x, actor.y, actor.aim);
    shake(w.pellets > 1 ? 9 : 3.2);
    noise(actor.x, actor.y, w.noise);
    // how full the magazine still is, so the report can ride up as it empties
    const t = clamp((actor.ammo ?? w.ammo) / w.ammo, 0, 1);
    if (weaponKey === 'shotgun') sfx.shotgun(t);
    else if (weaponKey === 'smg') sfx.smg(t);
    else if (weaponKey === 'revolver') sfx.revolver(t);
    else sfx.shot(t);
    return true;
  }

  function playerAttack() {
    const p = game.player;
    const w = WEAPONS[p.weapon];
    if (p.attackCd > 0) return;
    if (w.melee) {
      p.attackCd = w.rate;
      p.swing = 0.16;
      doAttack(p, p.weapon);
      return;
    }
    if (p.ammo <= 0) { p.attackCd = 0.18; sfx.empty(); return; }
    p.attackCd = w.rate;
    p.ammo--;
    doAttack(p, p.weapon);
    p.vx -= Math.cos(p.aim) * w.kick * 12;
    p.vy -= Math.sin(p.aim) * w.kick * 12;
  }

  function spawnThrown(actor, kind, ammo) {
    const t = spawnFrom(game.pools.thrown);
    if (!t) return;
    t.alive = true;
    t.x = actor.x + Math.cos(actor.aim) * 14; t.y = actor.y + Math.sin(actor.aim) * 14;
    t.vx = Math.cos(actor.aim) * 900; t.vy = Math.sin(actor.aim) * 900;
    t.kind = kind; t.ammo = ammo; t.spin = 0; t.life = 1.6;
    sfx.throwIt();
    shake(2);
    triggerSlow('throw');
  }

  function throwWeapon() {
    const p = game.player;
    if (p.weapon === 'fists') return;
    spawnThrown(p, p.weapon, p.ammo);
    p.weapon = 'fists'; p.ammo = 0;
  }

  // -- doors ----------------------------------------------------------------
  function updateDoors(dt) {
    const doors = game.level.doors;
    for (const d of doors) {
      let near = false, ox = 0, oy = 0;
      const p = game.player;
      if (p.alive && Math.abs(p.x - d.x) < 40 && Math.abs(p.y - d.y) < 40) { near = true; ox = p.x; oy = p.y; }
      if (!near) {
        for (const e of game.pools.enemies) {
          if (!e.alive || e.state === S_DEAD) continue;
          if (Math.abs(e.x - d.x) < 40 && Math.abs(e.y - d.y) < 40) { near = true; ox = e.x; oy = e.y; break; }
        }
      }
      // a door swings away from whoever is pushing it. lock the direction while
      // it is shut so it cannot flip halfway through opening.
      if (near && d.open < 0.2) d.swing = d.horiz ? (oy < d.y ? 1 : -1) : (ox > d.x ? 1 : -1);
      d.open = approach(d.open, near ? 1 : 0, near ? 11 : 2.6, dt);
      if (d.slam > 0) d.slam = Math.max(0, d.slam - dt * 3.5);
    }
  }

  // dashing into a shut door is the loudest, best opener on the floor
  function checkDoorSlam(actor, dirx, diry) {
    for (const d of game.level.doors) {
      if (d.open > 0.55) continue;
      if (dist(actor.x, actor.y, d.x, d.y) > 44) continue;
      const toDoor = Math.atan2(d.y - actor.y, d.x - actor.x);
      const moving = Math.atan2(diry, dirx);
      if (Math.abs(angDelta(moving, toDoor)) > 1.2) continue;
      d.open = 1; d.slam = 1;
      d.swing = d.horiz ? (actor.y < d.y ? 1 : -1) : (actor.x > d.x ? 1 : -1);
      noise(d.x, d.y, 380, '#EC0A63');
      shake(13);
      hitstop(0.05);
      sfx.slam();
      triggerSlow('slam');
      burst(d.x, d.y, 12, 300, '#161513', 3, 0.5);
      for (const e of game.pools.enemies) {
        if (!e.alive || e.state === S_DEAD || e.state === S_DOWN) continue;
        if (dist(e.x, e.y, d.x, d.y) > 58) continue;
        const a = Math.atan2(e.y - d.y, e.x - d.x);
        knockdown(e, Math.cos(a), Math.sin(a));
      }
      return true;
    }
    return false;
  }

  // -- per-frame ------------------------------------------------------------
  function updatePlayer(dt) {
    const p = game.player;
    const inp = game.input;
    if (!p.alive) return;

    if (inp.hasAim) {
      // Thumb aiming can't be precise, so it gets help: the stick picks a
      // direction and the game snaps it onto the nearest thing actually there.
      let best = inp.aimAngle, bd = 0.44;
      for (const e of game.pools.enemies) {
        if (!e.alive || e.state === S_DEAD) continue;
        const d = dist(p.x, p.y, e.x, e.y);
        if (d > 500) continue;
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        const off = Math.abs(angDelta(inp.aimAngle, a));
        if (off < bd && hasLineOfSight(game.level, p.x, p.y, e.x, e.y)) { bd = off; best = a; }
      }
      p.aim = best;
    } else {
      const wx = (inp.mx - renderer.W / 2) / ZOOM + game.camera.x;
      const wy = (inp.my - renderer.H / 2) / ZOOM + game.camera.y;
      p.aim = Math.atan2(wy - p.y, wx - p.x);
    }

    let ix, iy;
    if (inp.analog) {
      ix = inp.axisX; iy = inp.axisY;
    } else {
      ix = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      iy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
      const l = Math.hypot(ix, iy) || 1;
      ix /= l; iy /= l;
    }

    if (p.dashT > 0) {
      p.dashT -= dt;
      const sp = 1000 * (0.4 + p.dashT / 0.14);
      moveCollide(game.level, p, p.dashX * sp * dt, p.dashY * sp * dt, 9);
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 12) p.trail.shift();
      checkDoorSlam(p, p.dashX, p.dashY);
      const pane = game.level.windowAtPoint(p.x + p.dashX * 14, p.y + p.dashY * 14);
      if (pane) smashWindow(pane, p.dashX, p.dashY);
      for (const e of game.pools.enemies) {
        if (!e.alive || e.state === S_DEAD) continue;
        if (dist(p.x, p.y, e.x, e.y) > ENEMY_DEF[e.type].r + 13) continue;
        if (shieldBlocks(e, p.x, p.y)) {
          // ran into the shield. you bounce, but the shield takes it too.
          damageShield(e, 1, true, p.x, p.y);
          p.dashT = 0;
          p.vx = -p.dashX * 300; p.vy = -p.dashY * 300;
          moveCollide(game.level, p, -p.dashX * 16, -p.dashY * 16, 9);
          hitstop(0.06);
          break;
        }
        if (killEnemy(e, 1.2, p.dashX, p.dashY)) p.dashT = Math.min(0.2, p.dashT + 0.055);
      }
      if (p.dashT <= 0) { p.vx = p.dashX * 320; p.vy = p.dashY * 320; }
    } else {
      if (p.trail.length) p.trail.shift();
      if (ix || iy) game.didMove = true;
      p.vx = approach(p.vx, ix * 272, 18, dt);
      p.vy = approach(p.vy, iy * 272, 18, dt);
      moveCollide(game.level, p, p.vx * dt, p.vy * dt, 9);
    }

    if (p.dashCharges < MAX_DASH) {
      p.dashCd -= dt;
      if (p.dashCd <= 0) { p.dashCharges++; p.dashCd = DASH_CD; }
    }
    if (inp.dash && p.dashCharges > 0 && p.dashT <= 0) {
      inp.dash = false;
      const dx = ix || Math.cos(p.aim), dy = iy || Math.sin(p.aim);
      const dl = Math.hypot(dx, dy) || 1;
      p.dashX = dx / dl; p.dashY = dy / dl;
      p.dashT = 0.14;
      p.dashCharges--;
      if (p.dashCd <= 0) p.dashCd = DASH_CD;
      p.trail.length = 0;
      burst(p.x, p.y, 6, 150, '#12A3DA', 2.4, 0.3);
      sfx.dash();
      shake(2);
      triggerSlow('dash');
    }

    p.attackCd -= dt;
    if (p.swing > 0) p.swing -= dt;
    if (inp.fire) { playerAttack(); game.didAttack = true; }
    if (inp.throwIt) { inp.throwIt = false; throwWeapon(); }
    if (p.weapon === 'fists') {
      for (const k of game.pools.pickups) {
        if (!k.alive) continue;
        if (dist(p.x, p.y, k.x, k.y) < 20) {
          p.weapon = k.kind; p.ammo = k.ammo; k.alive = false;
          sfx.pickup();
          break;
        }
      }
    }
  }

  function updateBullets(dt) {
    for (const b of game.pools.bullets) {
      if (!b.alive) continue;
      b.life -= dt;
      if (b.life <= 0) { b.alive = false; continue; }
      const steps = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 7));
      const sx = b.vx * dt / steps, sy = b.vy * dt / steps;
      for (let s = 0; s < steps; s++) {
        b.x += sx; b.y += sy;
        const pane = game.level.windowAtPoint(b.x, b.y);
        if (pane) {
          const sp = Math.hypot(b.vx, b.vy) || 1;
          smashWindow(pane, b.vx / sp, b.vy / sp);
        }
        if (game.level.bulletBlockedAt(b.x, b.y)) {
          // a heavy round goes through a shut door and keeps going
          // going through timber costs nothing — pierce is for bodies
          const door = b.throughDoors ? game.level.doorAtPoint(b.x, b.y) : null;
          if (door) {
            if (b.hitDoor !== door) {
              b.hitDoor = door;
              door.slam = Math.max(door.slam, 0.5);
              renderer.shards(b.x, b.y, b.vx, b.vy);
              burst(b.x, b.y, 9, 190, '#161513', 2.4, 0.4);
              noise(b.x, b.y, 260);
              sfx.splinter();
              shake(3);
            }
          } else {
            b.alive = false;
            burst(b.x, b.y, 5, 130, '#161513', 1.8, 0.26);
            break;
          }
        }
        // a bullet does not care who fired it
        let stop = false;
        for (const e of game.pools.enemies) {
          if (!e.alive || e.state === S_DEAD) continue;
          if (b.owner === e) continue;
          if (dist(b.x, b.y, e.x, e.y) > ENEMY_DEF[e.type].r + 3) continue;
          const fx = b.x - b.vx * 0.02, fy = b.y - b.vy * 0.02;
          if (shieldBlocks(e, fx, fy)) {
            const col = shieldSegmentAt(e, fx, fy);
            const depth = col >= 0 ? columnDepth(e, col) : 0;
            const sp0 = Math.hypot(b.vx, b.vy) || 1;

            // A heavy round beats armour it can get all the way through: one
            // layer deep and it strips the plate and carries on into the body.
            // Thicker than that and it only sheds plates and stops.
            if (b.armourPierce && depth > 0 && depth <= b.armourPierce) {
              for (let L = 0; L < e.layers; L++) e.shieldSeg &= ~plateBit(e, L, col);
              e.shieldHp = shieldCount(e.shieldSeg);
              e.blockFlash = 0.25;
              burst(fx, fy, 8, 220, '#161513', 2.4, 0.35);
              sfx.splinter();
              killEnemy(e, 1.1, b.vx / sp0, b.vy / sp0, !b.friendly);
            } else {
              damageShield(e, b.shieldDmg || 1, false, fx, fy);
            }
            b.alive = false; stop = true;
            break;
          }
          const sp = Math.hypot(b.vx, b.vy) || 1;
          killEnemy(e, 0.9, b.vx / sp, b.vy / sp, !b.friendly);
          if (b.pierce > 0) b.pierce--;
          else { b.alive = false; stop = true; }
          break;
        }
        if (stop) break;

        if (!b.friendly) {
          if (game.player.alive) {
            const dp = dist(b.x, b.y, game.player.x, game.player.y);
            if (dp < 10) { b.alive = false; game.killPlayer(); break; }
            // a round that nearly took your head off is worth slowing down for
            if (dp < 34 && !b.near && game.nearMissCd <= 0) {
              b.near = 1;
              game.nearMissCd = 0.9;
              triggerSlow('nearMiss');
            }
          }
        }
      }
    }
  }

  function updateThrown(dt) {
    for (const t of game.pools.thrown) {
      if (!t.alive) continue;
      t.life -= dt;
      t.spin += dt * 26;
      const lethal = WEAPONS[t.kind].throwLethal;
      for (let s = 0; s < 4; s++) {
        t.x += t.vx * dt / 4; t.y += t.vy * dt / 4;
        const pane = game.level.windowAtPoint(t.x, t.y);
        if (pane) {
          const l2 = Math.hypot(t.vx, t.vy) || 1;
          smashWindow(pane, t.vx / l2, t.vy / l2);
        }
        if (game.level.bulletBlockedAt(t.x, t.y)) { t.vx = 0; t.vy = 0; break; }
        let hit = false;
        for (const e of game.pools.enemies) {
          if (!e.alive || e.state === S_DEAD) continue;
          if (dist(t.x, t.y, e.x, e.y) < ENEMY_DEF[e.type].r + 8) {
            if (shieldBlocks(e, t.x - t.vx * 0.02, t.y - t.vy * 0.02)) {
              // a thrown weapon rocks them hard: two of the four plates, and a
              // long stagger you can walk straight through
              damageShield(e, 2, true, t.x - t.vx * 0.02, t.y - t.vy * 0.02);
              t.vx = 0; t.vy = 0;
              hit = true; break;
            }
            const l = Math.hypot(t.vx, t.vy) || 1;
            if (lethal) killEnemy(e, 1, t.vx / l, t.vy / l);
            else if (e.state !== S_DOWN) knockdown(e, t.vx / l, t.vy / l);
            else continue;
            hit = true;
            break;
          }
        }
        if (hit) { t.vx = 0; t.vy = 0; break; }
      }
      t.vx = approach(t.vx, 0, 4, dt);
      t.vy = approach(t.vy, 0, 4, dt);
      if (t.life <= 0 || Math.hypot(t.vx, t.vy) < 30) {
        t.alive = false;
        const k = spawnFrom(game.pools.pickups);
        if (k) { k.alive = true; k.x = t.x; k.y = t.y; k.kind = t.kind; k.ammo = t.ammo; k.angle = t.spin; }
      }
    }
  }

  function refreshTargets() {
    game.targets.length = 0;
    const p = game.player;
    game.targets.push({ alive: p.alive, x: p.x, y: p.y, vx: p.vx, vy: p.vy });
  }

  // -------------------------------------------------------------------------
  function step(rdt) {
    game.ticks++;
    game.time += rdt;
    if (game.state === 'play' || game.state === 'dying') game.runT += rdt;
    if (game.bannerT > 0) game.bannerT -= rdt;
    if (game.tutorialT > 0) {
      game.tutorialT -= rdt;
      // once they have both moved and hit something, get out of the way
      if (game.didMove && game.didAttack) game.tutorialT = Math.min(game.tutorialT, 1.2);
    }
    if (game.flash > 0) game.flash = Math.max(0, game.flash - rdt * 3.2);
    if (game.dashFlash > 0) game.dashFlash = Math.max(0, game.dashFlash - rdt * 3);

    // HUD readouts settle toward the truth rather than jumping to it
    const ui = game.ui;
    const span0 = TOTAL_TARGET - WIN_AT;
    const gTarget = clamp((TOTAL_TARGET - game.remaining) / span0, 0, 1);
    [ui.gauge, ui.gaugeV] = springTo(ui.gauge, ui.gaugeV, gTarget, rdt, 0.45);
    const cTarget = game.combo > 1 ? clamp(game.comboTimer / 3.2, 0, 1) : 0;
    [ui.chain, ui.chainV] = springTo(ui.chain, ui.chainV, cTarget, rdt, 0.25);
    if (ui.chainPunch > 0) ui.chainPunch = Math.max(0, ui.chainPunch - rdt * 4.2);
    [ui.chainOpen, ui.chainOpenV] =
      springTo(ui.chainOpen, ui.chainOpenV, game.combo > 1 ? 1 : 0, rdt, 0.2, 0.72);
    [ui.code, ui.codeV] = springTo(ui.code, ui.codeV, game.remaining, rdt, 0.4);

    if (game.state === 'dying') {
      game.deathT -= rdt;
      game.worldScale = 0.08;
      if (game.deathT <= 0) restartFloor();
    }

    const p = game.player;
    if (game.nearMissCd > 0) game.nearMissCd -= rdt;
    if (game.slowCd > 0) game.slowCd -= rdt;

    if (game.slowT > 0) {
      game.slowT -= rdt;
      if (game.slowT <= 0) { game.slowT = 0; game.slowScale = 1; sfx.focusOut(); }
    }
    const dilating = game.slowT > 0;

    let ts = dilating ? game.slowScale : 1;
    if (game.state === 'dying') ts = 0.08;
    const frozen = game.hitstop > 0;
    if (frozen) { game.hitstop -= rdt; ts = 0.03; }
    game.worldScale = ts;
    setTimeScale(ts);
    const splitScale = game.reducedMotion ? 0.35 : 1;
    game.plateSplit = approach(game.plateSplit, ((1 - ts) * 6.2 + (frozen ? 4 : 0)) * splitScale, 22, rdt);

    const wdt = Math.min(0.05, rdt * ts);
    // inside a dilation you keep most of your speed — that is the whole payoff
    const pdt = Math.min(0.05, rdt * (dilating && !frozen ? Math.max(ts, PLAYER_SLOW_FLOOR) : ts));

    if (game.state === 'play') {
      updatePlayer(pdt);
      if (game.comboTimer > 0) {
        game.comboTimer -= wdt;
        if (game.comboTimer <= 0) game.combo = 0;
      }
    }

    refreshTargets();

    game.flowT -= wdt;
    if (game.flowT <= 0) { game.flowT = 0.16; computeFlow(); }

    for (const e of game.pools.enemies) if (e.alive) updateEnemy(game, e, wdt);
    updateBullets(wdt);
    updateThrown(wdt);
    updateDoors(wdt);

    for (const n of game.noiseRings) n.t += wdt;
    game.noiseRings = game.noiseRings.filter((n) => n.t < n.dur);

    for (const pt of game.particles) {
      pt.life -= wdt;
      pt.x += pt.vx * wdt; pt.y += pt.vy * wdt;
      pt.vx *= 1 - 4 * wdt; pt.vy *= 1 - 4 * wdt;
      pt.rot += pt.spin * wdt;
      if (pt.casing && pt.life <= 0) renderer.casing(pt.x, pt.y, pt.rot);
    }
    if (game.particles.length) game.particles = game.particles.filter((pt) => pt.life > 0);

    for (const f of game.flashes) f.t += wdt;
    if (game.flashes.length) game.flashes = game.flashes.filter((f) => f.t < f.dur);

    // the counter is the page's status code, walked down one body at a time
    const prev = game.remaining;
    game.remaining = Math.max(0, TOTAL_TARGET - game.kills);
    game.statusLabel = statusFor(game.remaining);
    if (game.remaining < prev) {
      const label = STATUS[game.remaining];
      if (label) {
        if (REC.statusBanner) {
          game.banner = `${game.remaining} ${label}`;
          game.bannerT = 1.8;
        }
        sfx.status();
      }
      if (game.remaining <= WIN_AT && !game.won) {
        game.won = true;
        game.state = 'won';
        game.banner = null;
        triggerSlow('lastKill');
        sfx.clear();
        if (game.score > game.bestScore) {
          game.bestScore = game.score;
          localStorage.setItem('overprint.best', String(game.score));
        }
        localStorage.setItem('overprint.won', '1');
        // the run is over, so it finally has a time worth recording
        game.runResult = { time: game.runT, score: game.score };
        game.best = saveBest(game.board, game.runResult);
        return;
      }
    }

    if (game.state === 'play' && game.enemiesLeft === 0 && p.alive) {
      if (dist(p.x, p.y, game.level.exit.x, game.level.exit.y) < 26) {
        const timeTaken = game.time - game.floorStartTime;
        const bonus = Math.max(0, Math.round(1400 - timeTaken * 45)) + game.floor * 250;
        game.score = Math.max(0, game.score + bonus);
        if (game.score > game.bestScore) {
          game.bestScore = game.score;
          localStorage.setItem('overprint.best', String(game.score));
        }
        if (game.floor > game.bestFloor) {
          game.bestFloor = game.floor;
          localStorage.setItem('overprint.floor', String(game.floor));
        }
        startFloor(true);
      }
    }

    if (game.state === 'title') {
      const a = game.time * 0.11;
      const hw = renderer.W / (2 * ZOOM), hh = renderer.H / (2 * ZOOM);
      const cx = game.level.w / 2, cy = game.level.h / 2;
      game.camera.x = clamp(cx + Math.cos(a) * game.level.w * 0.26, hw, Math.max(hw, game.level.w - hw));
      game.camera.y = clamp(cy + Math.sin(a * 1.3) * game.level.h * 0.24, hh, Math.max(hh, game.level.h - hh));
      game.plateSplit = approach(game.plateSplit, 1.6 + Math.sin(game.time * 0.7) * 1.2, 6, rdt);
      return;
    }

    const halfW = renderer.W / (2 * ZOOM), halfH = renderer.H / (2 * ZOOM);
    // on touch the camera leads the aim stick instead of a cursor
    const lookX = game.input.hasAim
      ? Math.cos(p.aim) * 120
      : clamp((game.input.mx - renderer.W / 2) / ZOOM, -300, 300) * 0.28;
    const lookY = game.input.hasAim
      ? Math.sin(p.aim) * 90
      : clamp((game.input.my - renderer.H / 2) / ZOOM, -220, 220) * 0.28;
    const tx = clamp(p.x + lookX, halfW, Math.max(halfW, game.level.w - halfW));
    const ty = clamp(p.y + lookY, halfH, Math.max(halfH, game.level.h - halfH));
    game.camera.x = lerp(game.camera.x, tx, 1 - Math.exp(-9 * rdt));
    game.camera.y = lerp(game.camera.y, ty, 1 - Math.exp(-9 * rdt));
    if (game.reducedMotion) game.shake *= 0.25;
    if (game.shake > 0.05) {
      game.camera.x += (Math.random() - 0.5) * game.shake;
      game.camera.y += (Math.random() - 0.5) * game.shake;
      game.shake *= Math.exp(-9 * rdt);
    }

  }

  game.step = step;
  game.startFloor = startFloor;
  game.restartFloor = restartFloor;
  // Picking a tab picks the board you are about to play, not just the one you
  // are reading: the backdrop is regenerated from its seed so you can see which
  // world you are choosing.
  game.selectBoard = function (id) {
    const next = BOARDS[id];
    if (!next || next.id === game.board.id) return false;
    game.board = next;
    game.best = loadBest(next);
    game.standings = null;
    game.floor = 1;
    game.seed = next.seed();
    startFloor(false);
    game.state = 'title';
    game.player.alive = false;
    game.player.x = -99999; game.player.y = -99999;
    game.banner = null; game.bannerT = 0;
    return true;
  };

  game.showTitle = function () {
    game.floor = 1;
    game.seed = game.board.seed();
    // read the stored best here too, or it appears out of nowhere the first
    // time something else happens to load it
    game.best = loadBest(game.board);
    startFloor(false);
    game.state = 'title';
    game.player.alive = false;
    game.player.x = -99999; game.player.y = -99999;
    game.banner = null; game.bannerT = 0;
  };
  game.begin = function () {
    initAudio();
    // NOT currentBoard() — that re-reads the query string, and picking a mode
    // on the title does not put anything in the URL. Re-reading it here threw
    // the choice away and started a daily run every time.
    game.seed = game.board.seed();
    game.best = loadBest(game.board);
    game.runT = 0;
    game.floor = 1; game.score = 0; game.kills = 0;
    game.combo = 0; game.bestCombo = 0;
    game.remaining = TOTAL_TARGET; game.won = false; game.statusLabel = 'NOT FOUND';
    game.ui.gauge = 0; game.ui.gaugeV = 0; game.ui.chain = 0; game.ui.chainV = 0;
    game.ui.chainPunch = 0; game.ui.chainOpen = 0; game.ui.chainOpenV = 0;
    game.ui.code = TOTAL_TARGET; game.ui.codeV = 0;
    game.tutorialT = 9; game.didMove = false; game.didAttack = false;
    game.slowT = 0; game.slowScale = 1; game.slowCd = 0;
    startFloor(false);

    // Shot mode: begin the run already most of the way down the counter, so a
    // take opens mid-fight and reaches 200 OK in a few seconds. Everything
    // downstream reads from kills, so setting it is enough.
    if (REC.shot) {
      game.kills = TOTAL_TARGET - WIN_AT - REC.shot;
      game.floorKills = 0;
      game.remaining = TOTAL_TARGET - game.kills;
      game.ui.code = game.remaining; game.ui.codeV = 0;
      game.tutorialT = 0;
      game.runT = REC.clock;
      // the kills that are already banked would have scored, so bank that too
      // or the win screen ends on a score no real run could finish with
      game.score = Math.round(game.kills * 730);
      game.bestCombo = 6;
      game.player.weapon = 'smg';
      game.player.ammo = WEAPONS.smg.ammo;
    }
  };
  game.TOTAL_TARGET = TOTAL_TARGET;
  game.WIN_AT = WIN_AT;
  return game;
}
