import { TAU, clamp, lerp } from './util.js';
import { TILE, T_FLOOR, T_WALL, T_FURNITURE, T_WINDOW, T_DOOR } from './level.js';
import { drawStar, starPath, ink, CYAN, MAG, YELLOW } from './brand.js';
import { ENEMY_DEF, WEAPONS, S_DOWN, S_DEAD, S_CHASE, S_SEARCH, armourArc } from './entities.js';

// Framing is responsive: the short edge of the screen always shows about the
// same slice of world, so a phone in portrait is not looking through a keyhole.
export let ZOOM = 1.6;
export const PAPER = '#EFECE3';
export const INK = '#161513';
const C = '#12A3DA', M = '#EC0A63', Y = '#F7CF16';
// three plates at 120° — overlapped they multiply to black, split apart they
// fringe exactly like a misregistered press sheet.
const PLATES = [
  [C, 1, 0],
  [M, -0.5, 0.866],
  [Y, -0.5, -0.866],
];

function hatchPattern(ctx, spacing, lw, color) {
  const s = 12;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.strokeStyle = color;
  g.lineWidth = lw;
  for (let i = -s; i < s * 2; i += spacing) {
    g.beginPath(); g.moveTo(i, -1); g.lineTo(i + s + 1, s + 1); g.stroke();
  }
  return ctx.createPattern(c, 'repeat');
}

function grainTile() {
  const s = 180;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 190;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 26;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let levelCanvas = null, stainCanvas = null, stainCtx = null;
  let hatchDense = null, hatchMed = null;
  const grain = grainTile();
  let grainPat = null;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const minDim = Math.min(W, H);
    ZOOM = minDim / clamp(minDim * 0.62, 400, 570);
    grainPat = ctx.createPattern(grain, 'repeat');
  }
  resize();
  window.addEventListener('resize', resize);

  // -- the sheet ------------------------------------------------------------
  // Only the stains are baked. Geometry is drawn live: a baked level canvas is
  // one pixel per world unit and then gets scaled up by zoom x dpr, which is
  // what made every texture look soft.
  const STAIN_SS = 2;   // stains are supersampled so ink keeps its edge

  function bakeLevel(level) {
    levelCanvas = null;
    stainCanvas = document.createElement('canvas');
    stainCanvas.width = level.w * STAIN_SS;
    stainCanvas.height = level.h * STAIN_SS;
    stainCtx = stainCanvas.getContext('2d');
    stainCtx.setTransform(STAIN_SS, 0, 0, STAIN_SS, 0, 0);
    landed.length = 0;
  }

  function clearStains() {
    if (stainCtx) {
      stainCtx.save();
      stainCtx.setTransform(1, 0, 0, 1, 0, 0);
      stainCtx.clearRect(0, 0, stainCanvas.width, stainCanvas.height);
      stainCtx.restore();
    }
    landed.length = 0;
  }

  // glass on the floor, permanent, like the blood
  function shards(x, y, dx, dy) {
    if (!stainCtx) return;
    const g = stainCtx;
    g.fillStyle = INK;
    for (let i = 0; i < 16; i++) {
      const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.9;
      const d = 6 + Math.random() * 46;
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      const r = 1 + Math.random() * 2.6;
      g.globalAlpha = 0.25 + Math.random() * 0.4;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(a + 1.9) * r, py + Math.sin(a + 1.9) * r);
      g.lineTo(px + Math.cos(a - 1.2) * r * 1.7, py + Math.sin(a - 1.2) * r * 1.7);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;
  }

  // Spent brass stays a vector, drawn live. Stamping it into the stain sheet
  // meant it got scaled up with everything else and read as a smudge.
  const landed = [];
  const MAX_LANDED = 160;
  function casing(x, y, ang) {
    landed.push({ x, y, ang });
    if (landed.length > MAX_LANDED) landed.shift();
  }

    // an ink blob with a ragged edge — the shape a drop makes, not a circle
  function blob(g, cx, cy, r, jag) {
    const n = 10 + Math.floor(Math.random() * 6);
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const rr = r * (1 - jag + Math.random() * jag * 2);
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  }

  // magenta ink soaking into the sheet: ragged core, directional cast-off with
  // tails, and a fine mist. direction comes from whatever did the killing.
  function splat(x, y, power, dx = 0, dy = 0, tint = M) {
    if (!stainCtx) return;
    const g = stainCtx;
    g.fillStyle = tint;
    g.strokeStyle = tint;

    let ux = dx, uy = dy;
    const l = Math.hypot(ux, uy);
    if (l < 0.01) { const a = Math.random() * TAU; ux = Math.cos(a); uy = Math.sin(a); }
    else { ux /= l; uy /= l; }
    const px = -uy, py = ux;

    // core pool
    g.globalAlpha = 0.82;
    blob(g, x, y, 4 + power * 6, 0.42);
    g.globalAlpha = 0.55;
    for (let i = 0; i < 3; i++) {
      const off = (Math.random() - 0.5) * power * 14;
      blob(g, x + px * off + ux * Math.random() * 8, y + py * off + uy * Math.random() * 8,
        (2.5 + Math.random() * 4) * (0.6 + power * 0.5), 0.5);
    }

    // cast-off: droplets thrown along the direction of the hit, each with a tail
    const n = 7 + Math.floor(power * 11);
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      const spread = (Math.random() - 0.5) * 0.85;
      const d = 12 + t * power * 78;
      const cx = x + (ux + px * spread) * d;
      const cy = y + (uy + py * spread) * d;
      const r = (2.6 - t * 1.7) * (0.5 + power * 0.6) * (0.6 + Math.random() * 0.8);
      if (r < 0.35) continue;
      g.globalAlpha = 0.5 + (1 - t) * 0.3;
      blob(g, cx, cy, r, 0.55);
      if (r > 1.1) {
        g.lineWidth = r * 0.7;
        g.globalAlpha = 0.32;
        g.beginPath();
        g.moveTo(cx - ux * r * 2.6, cy - uy * r * 2.6);
        g.lineTo(cx, cy);
        g.stroke();
      }
    }

    // fine mist
    g.globalAlpha = 0.4;
    for (let i = 0; i < 16 + power * 14; i++) {
      const a = Math.atan2(uy, ux) + (Math.random() - 0.5) * 2.0;
      const d = 8 + Math.random() * power * 92;
      const r = 0.4 + Math.random() * 0.9;
      g.beginPath();
      g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r, 0, TAU);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  // -- plate drawing ---------------------------------------------------------
  // draw() is called three times, once per process colour, offset by `split`.
  function plates(split, draw) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (const [col, ox, oy] of PLATES) {
      ctx.save();
      ctx.translate(ox * split, oy * split);
      ctx.fillStyle = col;
      ctx.strokeStyle = col;
      draw(ctx);
      ctx.restore();
    }
    ctx.restore();
  }

  function shapePlayer(g, p, aim) {
    g.lineWidth = 2;
    g.beginPath();
    g.arc(p.x, p.y, 15, 0, TAU);
    g.stroke();
    g.beginPath();
    g.arc(p.x, p.y, 9.5, 0, TAU);
    g.fill();
    // nib pointing at the aim
    g.save();
    g.translate(p.x, p.y);
    g.rotate(aim);
    g.beginPath();
    g.moveTo(6, -5.5); g.lineTo(20, 0); g.lineTo(6, 5.5);
    g.closePath();
    g.fill();
    g.restore();
  }

  // the weapon in their hands, drawn at the hand, pointing forward
  function weaponSilhouette(g, kind) {
    switch (kind) {
      case 'bat':      g.fillRect(0, -1.6, 19, 3.2); g.fillRect(15, -3, 6, 6); break;
      case 'knife':    g.fillRect(-4, -1.6, 6, 3.2); g.beginPath(); g.moveTo(2, -2.6); g.lineTo(16, 0); g.lineTo(2, 2.6); g.closePath(); g.fill(); break;
      case 'pistol':   g.fillRect(0, -1.6, 11, 3.2); g.fillRect(1, 1, 3.4, 5); break;
      case 'revolver': g.fillRect(0, -1.7, 15, 3.4); g.fillRect(1, 1, 3.4, 5); g.beginPath(); g.arc(5, 0, 2.7, 0, TAU); g.fill(); break;
      case 'smg':      g.fillRect(0, -1.8, 15, 3.6); g.fillRect(3, 1.2, 4, 7); g.fillRect(-4, -2.4, 5, 4.8); break;
      case 'shotgun':  g.fillRect(0, -2.1, 23, 4.2); g.fillRect(-4, -3, 6, 6); break;
      default: break;
    }
  }

  // the body itself, in the shape vocabulary of its type. every state reuses it,
  // so the difference between standing, down and dead is ink weight, not anatomy.
  // the cursor: two triangles meeting at the tip, notched at the back.
  // symmetric, chunky, and pointing exactly where it's going.
  const CURSOR = [[15, 0], [-8, -8], [-4, 0], [-8, 8]];

  function cursorPath(g, scale = 1) {
    g.beginPath();
    for (let i = 0; i < CURSOR.length; i++) {
      const [x, y] = CURSOR[i];
      if (i) g.lineTo(x * scale, y * scale); else g.moveTo(x * scale, y * scale);
    }
    g.closePath();
  }

  // People are squares — the weapon in their hand says what they can do. Dogs
  // are cursors, which is the one thing on this page that was always an arrow.
  function bodyShape(g, e) {
    if (e.type === 'gunner') {
      g.fillRect(-8.5, -8.5, 17, 17);
    } else if (e.type === 'shield') {
      g.fillRect(-13, -13, 26, 26);
    } else if (e.type === 'hound') {
      cursorPath(g, 1);
      g.fill();
    } else {
      g.fillRect(-9.5, -9.5, 19, 19);
    }
  }

  function shapeEnemy(g, e) {
    const def = ENEMY_DEF[e.type];
    g.save();
    g.translate(e.x, e.y);

    // DEAD: the same silhouette, tipped over and printed light. the blood does
    // the rest of the talking.
    if (e.state === S_DEAD) {
      g.globalAlpha = 0.58;
      g.rotate(e.deadAngle || e.angle);
      bodyShape(g, e);
      g.restore();
      return;
    }

    // DOWNED: printed faint, like an under-inked pull. see drawSleepers()
    // for the Zzz that counts them back up.
    if (e.state === S_DOWN) {
      g.globalAlpha = 0.46;
      g.rotate(e.angle);
      bodyShape(g, e);
      g.restore();
      return;
    }

    g.rotate(e.angle);

    bodyShape(g, e);
    if (e.type === 'hound' && e.windup > 0) {
      // coiled: a drawn bow behind the tip, the tell before it launches
      g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, 18, -0.95, 0.95); g.stroke();
    }

    // armour: concentric layers of thin plates. count the rings for depth and
    // the arcs for width; a column with nothing left is a hole straight through.
    if (e.armour > 0 && e.shieldSeg) {
      const arc = armourArc(e);
      const span = (arc * 2) / e.segs;
      g.lineWidth = e.blockFlash > 0 ? 3.4 : 2.6;
      for (let L = 0; L < e.layers; L++) {
        const rad = def.r + 6.5 + L * 4.6;
        for (let i = 0; i < e.segs; i++) {
          if (!(e.shieldSeg & (1 << (L * e.segs + i)))) continue;
          g.beginPath();
          g.arc(0, 0, rad, -arc + i * span + 0.055, -arc + (i + 1) * span - 0.055);
          g.stroke();
        }
      }
    }

    g.restore();
  }

  // weapons print in their own ink, in hands and on the floor alike
  function drawWeapon(g, x, y, angle, kind, alpha = 1) {
    const w = WEAPONS[kind];
    if (!w || !w.tint) return;
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = alpha;
    g.fillStyle = w.tint;
    g.strokeStyle = w.tint;
    g.translate(x, y);
    g.rotate(angle);
    weaponSilhouette(g, kind);
    g.restore();
  }

  function drawHeldWeapons(game) {
    for (const e of game.pools.enemies) {
      if (!e.alive || e.state === S_DEAD || e.state === S_DOWN) continue;
      if (!e.weapon || e.weapon === 'fists') continue;
      const def = ENEMY_DEF[e.type];
      // the hand sits clear of the silhouette, or the ink prints black-on-black
      const off = e.type === 'shield' ? 11 : 7;
      const hx = e.x + Math.cos(e.angle) * (def.r + 1) - Math.sin(e.angle) * off;
      const hy = e.y + Math.sin(e.angle) * (def.r + 1) + Math.cos(e.angle) * off;
      drawWeapon(ctx, hx, hy, e.angle, e.weapon);
    }
    const p = game.player;
    if (p.alive && p.weapon !== 'fists') {
      const hx = p.x + Math.cos(p.aim) * 11 - Math.sin(p.aim) * 7;
      const hy = p.y + Math.sin(p.aim) * 11 + Math.cos(p.aim) * 7;
      drawWeapon(ctx, hx, hy, p.aim, p.weapon);
    }
  }

  // Zzz over anyone who is down. letters accumulate as they come round, so three
  // of them means they are about to be back on their feet.
  function drawSleepers(game) {
    const t = game.time;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    for (const e of game.pools.enemies) {
      if (!e.alive || e.state !== S_DOWN) continue;
      const k = clamp(1 - e.downTimer / 1.7, 0, 1);
      const n = Math.min(3, 1 + Math.floor(k * 3));
      const bob = Math.sin(t * 2.2 + e.x * 0.02) * 1.6;
      for (let i = 0; i < n; i++) {
        const size = 9 + i * 3.5;
        const grown = i === n - 1 ? clamp((k * 3) % 1, 0, 1) : 1;
        ctx.globalAlpha = i < n - 1 ? 0.72 : 0.3 + 0.42 * grown;
        ctx.font = `600 ${size}px "IBM Plex Mono", ui-monospace, monospace`;
        ctx.save();
        ctx.translate(e.x + 9 + i * 8.5, e.y - 16 - i * 9 + bob);
        ctx.rotate(-0.18 - i * 0.06);
        ctx.fillText('Z', 0, 0);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Continuous 45-degree hatch in WORLD space, clipped to a region. Because the
  // lines are one unbroken family across the whole map rather than a repeating
  // bitmap tile, there is no seam to misalign and nothing to blur when the view
  // scales. Line weights are divided by ZOOM so they stay a constant on screen.
  // One family of hairlines at an arbitrary angle, clipped to a region. The
  // lines are continuous in world space, so there is no tile and no seam.
  function plateLines(path, angDeg, step, color, x0, y0, x1, y1, lw = 1) {
    const a = (angDeg * Math.PI) / 180;
    const dx = Math.cos(a), dy = Math.sin(a);
    const nx = -dy, ny = dx;
    const cs = [
      x0 * nx + y0 * ny, x1 * nx + y0 * ny,
      x0 * nx + y1 * ny, x1 * nx + y1 * ny,
    ];
    const cMin = Math.min(...cs), cMax = Math.max(...cs);
    const L = Math.hypot(x1 - x0, y1 - y0) * 1.2;
    ctx.save();
    ctx.clip(path);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw / ZOOM;
    ctx.beginPath();
    for (let c = Math.floor(cMin / step) * step; c <= cMax; c += step) {
      const px = nx * c, py = ny * c;
      ctx.moveTo(px - dx * L, py - dy * L);
      ctx.lineTo(px + dx * L, py + dy * L);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawLevelLive(game, cam) {
    const lv = game.level;
    const halfW = W / (2 * ZOOM), halfH = H / (2 * ZOOM);
    const x0 = cam.x - halfW - TILE, y0 = cam.y - halfH - TILE;
    const x1 = cam.x + halfW + TILE, y1 = cam.y + halfH + TILE;
    const gx0 = Math.floor(x0 / TILE), gy0 = Math.floor(y0 / TILE);
    const gx1 = Math.ceil(x1 / TILE), gy1 = Math.ceil(y1 / TILE);

    const raw = (gx, gy) =>
      gx < 0 || gy < 0 || gx >= lv.gw || gy >= lv.gh ? T_WALL : lv.tiles[gy * lv.gw + gx];
    // doors and glass are openings as far as the drawn plan is concerned
    const open = (gx, gy) => {
      const t = raw(gx, gy);
      return t === T_FLOOR || t === T_DOOR || t === T_WINDOW;
    };

    const wall = new Path2D(), furn = new Path2D();
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const t = raw(gx, gy);
        if (t === T_WALL) wall.rect(gx * TILE, gy * TILE, TILE, TILE);
        else if (t === T_FURNITURE) furn.rect(gx * TILE, gy * TILE, TILE, TILE);
      }
    }

    // Solid is a flat grey plate, ruled by a few hairlines at the real process
    // screen angles — cyan 15, magenta 75, yellow 0. Spaced far apart so nothing
    // strobes when the view moves: the grey carries the mass, not the lines.
    // Two different things, drawn as two different things.
    //
    // A wall is filled GROUND: flat grey, ruled by a cyan/magenta grid locked to
    // the tile lattice with a yellow register cross at every intersection. The
    // grid is aligned rather than set at arbitrary angles, so it reads as drawn
    // rather than scattered, and it meets wall edges cleanly.
    ctx.fillStyle = ink(0.24);
    ctx.fill(wall);

    const GRID = TILE * 5;
    ctx.save();
    ctx.clip(wall);
    ctx.lineWidth = 1 / ZOOM;
    ctx.strokeStyle = CYAN;
    ctx.beginPath();
    for (let gxp = Math.floor(x0 / GRID) * GRID; gxp <= x1; gxp += GRID) {
      ctx.moveTo(gxp, y0); ctx.lineTo(gxp, y1);
    }
    ctx.stroke();
    ctx.strokeStyle = MAG;
    ctx.beginPath();
    for (let gyp = Math.floor(y0 / GRID) * GRID; gyp <= y1; gyp += GRID) {
      ctx.moveTo(x0, gyp); ctx.lineTo(x1, gyp);
    }
    ctx.stroke();
    ctx.strokeStyle = YELLOW;
    ctx.lineWidth = 1.4 / ZOOM;
    ctx.beginPath();
    const arm = 7;
    for (let gxp = Math.floor(x0 / GRID) * GRID; gxp <= x1; gxp += GRID) {
      for (let gyp = Math.floor(y0 / GRID) * GRID; gyp <= y1; gyp += GRID) {
        ctx.moveTo(gxp - arm, gyp); ctx.lineTo(gxp + arm, gyp);
        ctx.moveTo(gxp, gyp - arm); ctx.lineTo(gxp, gyp + arm);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Furniture is an OBJECT on the floor: lighter, and drawn the way a plan
    // draws a table — a solid outline with a hairline inset, no field at all.
    ctx.fillStyle = ink(0.085);
    ctx.fill(furn);

    // crisp rules wherever solid meets open floor
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4 / ZOOM;
    ctx.beginPath();
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const t = raw(gx, gy);
        if (t === T_FLOOR || t === T_DOOR || t === T_WINDOW) continue;
        const x = gx * TILE, y = gy * TILE;
        if (open(gx, gy - 1)) { ctx.moveTo(x, y); ctx.lineTo(x + TILE, y); }
        if (open(gx, gy + 1)) { ctx.moveTo(x, y + TILE); ctx.lineTo(x + TILE, y + TILE); }
        if (open(gx - 1, gy)) { ctx.moveTo(x, y); ctx.lineTo(x, y + TILE); }
        if (open(gx + 1, gy)) { ctx.moveTo(x + TILE, y); ctx.lineTo(x + TILE, y + TILE); }
        if (t === T_FURNITURE) {
          if (raw(gx, gy - 1) !== T_FURNITURE) { ctx.moveTo(x, y); ctx.lineTo(x + TILE, y); }
          if (raw(gx, gy + 1) !== T_FURNITURE) { ctx.moveTo(x, y + TILE); ctx.lineTo(x + TILE, y + TILE); }
          if (raw(gx - 1, gy) !== T_FURNITURE) { ctx.moveTo(x, y); ctx.lineTo(x, y + TILE); }
          if (raw(gx + 1, gy) !== T_FURNITURE) { ctx.moveTo(x + TILE, y); ctx.lineTo(x + TILE, y + TILE); }
        }
      }
    }
    ctx.stroke();

    // furniture inset: the second line that makes it read as a drawn object
    ctx.strokeStyle = ink(0.3);
    ctx.lineWidth = 1 / ZOOM;
    ctx.beginPath();
    const IN = 4;
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        if (raw(gx, gy) !== T_FURNITURE) continue;
        const x = gx * TILE, y = gy * TILE;
        if (raw(gx, gy - 1) !== T_FURNITURE) { ctx.moveTo(x, y + IN); ctx.lineTo(x + TILE, y + IN); }
        if (raw(gx, gy + 1) !== T_FURNITURE) { ctx.moveTo(x, y + TILE - IN); ctx.lineTo(x + TILE, y + TILE - IN); }
        if (raw(gx - 1, gy) !== T_FURNITURE) { ctx.moveTo(x + IN, y); ctx.lineTo(x + IN, y + TILE); }
        if (raw(gx + 1, gy) !== T_FURNITURE) { ctx.moveTo(x + TILE - IN, y); ctx.lineTo(x + TILE - IN, y + TILE); }
      }
    }
    ctx.stroke();
    ctx.restore();

    // drafting detail, only for rooms in frame
    ctx.save();
    for (const r of lv.rooms) {
      const rx = r.x * TILE, ry = r.y * TILE, rw = r.w * TILE, rh = r.h * TILE;
      if (rx > x1 || ry > y1 || rx + rw < x0 || ry + rh < y0) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
      ctx.strokeStyle = ink(0.055);
      ctx.lineWidth = 1 / ZOOM;
      ctx.beginPath();
      for (let gx = r.x; gx <= r.x + r.w; gx += 2) { ctx.moveTo(gx * TILE, ry); ctx.lineTo(gx * TILE, ry + rh); }
      for (let gy = r.y; gy <= r.y + r.h; gy += 2) { ctx.moveTo(rx, gy * TILE); ctx.lineTo(rx + rw, gy * TILE); }
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = ink(0.13);
      ctx.lineWidth = 1 / ZOOM;
      ctx.strokeRect(rx + 5, ry + 5, rw - 10, rh - 10);

      ctx.strokeStyle = ink(0.3);
      ctx.beginPath();
      const T2 = 9;
      [[rx, ry, 1, 1], [rx + rw, ry, -1, 1], [rx, ry + rh, 1, -1], [rx + rw, ry + rh, -1, -1]]
        .forEach(([cx2, cy2, sx, sy]) => {
          ctx.moveTo(cx2 + sx * 3, cy2 + sy * 3); ctx.lineTo(cx2 + sx * T2, cy2 + sy * 3);
          ctx.moveTo(cx2 + sx * 3, cy2 + sy * 3); ctx.lineTo(cx2 + sx * 3, cy2 + sy * T2);
        });
      ctx.stroke();

      const mx = (r.x + r.w / 2) * TILE, my = (r.y + r.h / 2) * TILE;
      ctx.strokeStyle = ink(0.22);
      ctx.beginPath();
      ctx.moveTo(mx - 10, my); ctx.lineTo(mx - 3.5, my);
      ctx.moveTo(mx + 3.5, my); ctx.lineTo(mx + 10, my);
      ctx.moveTo(mx, my - 10); ctx.lineTo(mx, my - 3.5);
      ctx.moveTo(mx, my + 3.5); ctx.lineTo(mx, my + 10);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  // -- main draw -------------------------------------------------------------
  function draw(game) {
    const cam = game.camera;
    const split = game.plateSplit;

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);

    // Snap the world origin to a whole device pixel. Panning at fractional
    // offsets makes fine hatching crawl and shimmer; landing on the pixel grid
    // means the pattern is drawn identically every frame and simply steps.
    ctx.save();
    let ox = W / 2 - cam.x * ZOOM;
    let oy = H / 2 - cam.y * ZOOM;
    ox = Math.round(ox * dpr) / dpr;
    oy = Math.round(oy * dpr) / dpr;
    ctx.translate(ox, oy);
    ctx.scale(ZOOM, ZOOM);

    drawLevelLive(game, cam);

    if (stainCanvas) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.85;
      ctx.drawImage(stainCanvas, 0, 0, stainCanvas.width / STAIN_SS, stainCanvas.height / STAIN_SS);
      ctx.restore();
    }

    // exit stamp
    const ex = game.level.exit;
    const open = game.enemiesLeft === 0;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = open ? M : ink(0.28);
    ctx.lineWidth = open ? 3 : 1.6;
    const pulse = open ? 1 + Math.sin(game.time * 4) * 0.09 : 1;
    ctx.save();
    ctx.translate(ex.x, ex.y);
    ctx.scale(pulse, pulse);
    ctx.strokeRect(-19, -19, 38, 38);
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.moveTo(0, -26); ctx.lineTo(0, 26);
    ctx.stroke();
    ctx.restore();
    if (open) {
      ctx.fillStyle = M;
      ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', ex.x, ex.y + 36);
    }
    ctx.restore();

    // Sight lines are for enemies who haven't found you yet — that's the read
    // that matters. Once they're hunting, a full fan just floods the sheet, so
    // a chaser gets a compact magenta arc instead.
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (const e of game.pools.enemies) {
      if (!e.alive || e.state === S_DOWN || e.state === S_DEAD) continue;
      const def = ENEMY_DEF[e.type];

      if (e.state === S_CHASE) {
        ctx.strokeStyle = M;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        const mr = e.armour > 0 ? def.r + 10 + (e.layers || 1) * 4.6 : def.r + 11;
        ctx.arc(e.x, e.y, mr, e.angle - def.cone * 0.8, e.angle + def.cone * 0.8);
        ctx.stroke();
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(e.angle) * (mr + 2), e.y + Math.sin(e.angle) * (mr + 2));
        ctx.lineTo(e.x + Math.cos(e.angle) * (mr + 21), e.y + Math.sin(e.angle) * (mr + 21));
        ctx.stroke();
        continue;
      }

      const lines = e.state === S_SEARCH ? 6 : 3;
      const reach = def.range * (e.state === S_SEARCH ? 0.6 : 0.4);
      ctx.strokeStyle = C;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= lines; i++) {
        const a = e.angle - def.cone + (i / lines) * def.cone * 2;
        let r = reach;
        for (let st = 12; st < reach; st += 8) {
          if (game.level.sightBlockedAt(e.x + Math.cos(a) * st, e.y + Math.sin(a) * st)) { r = st; break; }
        }
        ctx.moveTo(e.x + Math.cos(a) * 12, e.y + Math.sin(a) * 12);
        ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
      }
      ctx.stroke();
    }
    ctx.restore();

    // noise rings
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (const n of game.noiseRings) {
      ctx.strokeStyle = n.col || C;
      ctx.globalAlpha = clamp(1 - n.t / n.dur, 0, 1) * 0.7;
      ctx.lineWidth = 2 * (1 - n.t / n.dur) + 0.5;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * (n.t / n.dur), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    // A pane reads as a thin door set in the wall line — same language as a door
    // leaf, thinner, and printed light so it reads as something you can see
    // through. The jambs stay solid: the frame is real, the glass is not.
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (const win of game.level.windows) {
      if (win.broken) continue;
      const x = win.gx * TILE, y = win.gy * TILE;
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.8;
      if (win.horiz) {
        ctx.globalAlpha = 0.34;
        ctx.fillRect(x, y + TILE / 2 - 1.5, TILE, 3);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1.4, y + TILE / 2 - 5.5); ctx.lineTo(x + 1.4, y + TILE / 2 + 5.5);
        ctx.moveTo(x + TILE - 1.4, y + TILE / 2 - 5.5); ctx.lineTo(x + TILE - 1.4, y + TILE / 2 + 5.5);
        ctx.stroke();
      } else {
        ctx.globalAlpha = 0.34;
        ctx.fillRect(x + TILE / 2 - 1.5, y, 3, TILE);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x + TILE / 2 - 5.5, y + 1.4); ctx.lineTo(x + TILE / 2 + 5.5, y + 1.4);
        ctx.moveTo(x + TILE / 2 - 5.5, y + TILE - 1.4); ctx.lineTo(x + TILE / 2 + 5.5, y + TILE - 1.4);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // doors swing on the tile edge; a slammed one shows the shock ring
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (const d of game.level.doors) {
      const a = d.open * 1.32;
      const hinge = d.hinge || -1;
      const swing = d.swing || 1;
      ctx.save();
      ctx.translate(d.x, d.y);
      if (!d.horiz) ctx.rotate(Math.PI / 2);
      // pivot on this leaf's own end, so a pair swings apart instead of together,
      // and swing away from whoever pushed it
      ctx.translate((hinge * TILE) / 2, 0);
      ctx.rotate(-hinge * a * swing);
      ctx.fillStyle = INK;
      ctx.fillRect(hinge > 0 ? -TILE : 0, -3, TILE, 6);
      ctx.restore();
      if (d.slam > 0) {
        ctx.strokeStyle = M;
        ctx.globalAlpha = d.slam * 0.8;
        ctx.lineWidth = 3 * d.slam + 0.5;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 58 * (1.2 - d.slam), 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    // bodies stay on the sheet — they are also evidence the AI reacts to
    for (const e of game.pools.enemies) {
      if (e.alive && e.state === S_DEAD) plates(split * 0.4, (g) => shapeEnemy(g, e));
    }

    // spent brass on the floor, still vector
    if (landed.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      for (const c of landed) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.ang);
        // one flat shape. at six pixels across, a rim and an outline are detail
        // nothing else on the board carries, and it reads as noise.
        ctx.fillStyle = ink(0.42);
        ctx.fillRect(-3, -1.1, 6, 2.2);
        ctx.restore();
      }
      ctx.restore();
    }

    for (const k of game.pools.pickups) {
      if (!k.alive) continue;
      const w = WEAPONS[k.kind];
      const half = w && w.tint ? 9 : 0;
      drawWeapon(ctx, k.x - Math.cos(k.angle) * half, k.y - Math.sin(k.angle) * half, k.angle, k.kind);
    }
    // a weapon in flight is still that weapon, in its own ink
    for (const t of game.pools.thrown) {
      if (!t.alive) continue;
      drawWeapon(ctx, t.x - Math.cos(t.spin) * 9, t.y - Math.sin(t.spin) * 9, t.spin, t.kind);
    }

    for (const e of game.pools.enemies) {
      if (!e.alive || e.state === S_DEAD) continue;
      plates(split, (g) => shapeEnemy(g, e));
    }

    drawHeldWeapons(game);
    drawSleepers(game);

    // bullets: tracer + head. long tails during a dilation make them dodgeable
    plates(split * 0.5, (g) => {
      g.lineWidth = 2;
      g.beginPath();
      for (const b of game.pools.bullets) {
        if (!b.alive) continue;
        const l = b.friendly ? 20 : 26;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        g.moveTo(b.x - (b.vx / sp) * l, b.y - (b.vy / sp) * l);
        g.lineTo(b.x, b.y);
      }
      g.stroke();
      for (const b of game.pools.bullets) {
        if (!b.alive) continue;
        g.beginPath(); g.arc(b.x, b.y, 2.6, 0, TAU); g.fill();
      }
    });

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (const e of game.pools.enemies) {
      if (!e.alive || e.blockFlash <= 0) continue;
      const def = ENEMY_DEF[e.type];
      ctx.strokeStyle = C;
      ctx.globalAlpha = clamp(e.blockFlash / 0.25, 0, 1) * 0.9;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 17 + (1 - e.blockFlash / 0.3) * 9, e.angle - (def.shieldArc || 1), e.angle + (def.shieldArc || 1));
      ctx.stroke();
    }
    ctx.restore();

    // particles
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (const p of game.particles) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.col;
      if (p.casing) {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = ink(0.5);
        ctx.fillRect(-3, -1.1, 6, 2.2);
        ctx.restore();
      } else {
        // tumbling flecks rather than axis-aligned pixels
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-p.s / 2, -p.s * 0.34, p.s, p.s * 0.68);
        ctx.restore();
      }
    }
    ctx.restore();

    // muzzle flash: a four-point burst, brightest across the bore
    if (game.flashes.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      for (const f of game.flashes) {
        const k = 1 - clamp(f.t / f.dur, 0, 1);
        const L = (16 + 16 * f.size) * k, Wd = (5 + 4 * f.size) * k;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.a);
        ctx.globalAlpha = 0.55 + 0.45 * k;
        ctx.fillStyle = Y;
        ctx.beginPath();
        ctx.moveTo(L, 0); ctx.lineTo(0, -Wd); ctx.lineTo(-L * 0.34, 0); ctx.lineTo(0, Wd);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -Wd * 1.9); ctx.lineTo(L * 0.3, 0); ctx.lineTo(0, Wd * 1.9); ctx.lineTo(-L * 0.22, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // melee arc
    if (game.player.swing > 0) {
      const p = game.player;
      const w = WEAPONS[p.weapon];
      const t = 1 - game.player.swing / 0.16;
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = M;
      ctx.lineWidth = 3.5 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (w.reach || 36) * (0.5 + t * 0.6), p.aim - 1.1 + t * 1.4, p.aim + 0.5 + t * 1.4);
      ctx.stroke();
      ctx.restore();
    }

    if (game.player.alive || game.state === 'dying') plates(split, (g) => shapePlayer(g, game.player, game.player.aim));

    // dash trail
    if (game.player.trail.length > 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = C;
      ctx.lineWidth = 6;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(game.player.trail[0].x, game.player.trail[0].y);
      for (const t of game.player.trail) ctx.lineTo(t.x, t.y);
      ctx.stroke();
      ctx.restore();
    }

    // Once the floor is clear, point the way out. It rides just outside the
    // player and fades off as the exit comes into frame, so it never nags.
    if (game.enemiesLeft === 0 && game.player.alive && game.state === 'play') {
      const p = game.player;
      const dx = game.level.exit.x - p.x, dy = game.level.exit.y - p.y;
      const dist = Math.hypot(dx, dy);
      const halfW = W / (2 * ZOOM), halfH = H / (2 * ZOOM);
      const onScreen = Math.abs(game.level.exit.x - cam.x) < halfW - 60 &&
                       Math.abs(game.level.exit.y - cam.y) < halfH - 60;
      const fade = clamp((dist - 90) / 120, 0, 1) * (onScreen ? 0.35 : 1);
      if (fade > 0.02 && dist > 40) {
        const a = Math.atan2(dy, dx);
        const r = 54 + Math.sin(game.time * 4) * 3;
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = fade;
        ctx.translate(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
        ctx.rotate(a);
        ctx.fillStyle = M;
        // a chevron, in the same needle language as the star
        ctx.beginPath();
        ctx.moveTo(13, 0); ctx.lineTo(-5, -8); ctx.lineTo(-1, 0); ctx.lineTo(-5, 8);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = fade * 0.55;
        ctx.beginPath();
        ctx.moveTo(-8, -6); ctx.lineTo(2, 0); ctx.lineTo(-8, 6);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = M;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = fade * 0.8;
        ctx.fillStyle = M;
        ctx.font = '600 9px "IBM Plex Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`EXIT ${Math.round(dist / TILE)}`, p.x + Math.cos(a) * (r + 46), p.y + Math.sin(a) * (r + 46) + 3);
        ctx.restore();
      }
    }

    ctx.restore();

    // grain over everything
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = grainPat;
    ctx.translate(-((cam.x * ZOOM) % 180), -((cam.y * ZOOM) % 180));
    ctx.fillRect(0, 0, W + 180, H + 180);
    ctx.restore();

  }

  return { ctx, resize, bakeLevel, clearStains, splat, shards, casing, draw, plates, get W() { return W; }, get H() { return H; } };
}
