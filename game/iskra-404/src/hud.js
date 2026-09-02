import { TAU, clamp } from './util.js';
import { WEAPONS, MAX_DASH, DASH_CD } from './entities.js';
import { drawPlateMark, drawLockup, ink, CYAN } from './brand.js';
import { clock } from './board.js';
import { playerId, playerName } from './net.js';
import { bar, gauge, tickScale, starMark, ring, dashRing, registerMark, bracket, rule, magazine } from './micro.js';

const INK = '#161513';
const M = '#EC0A63';
const C = '#12A3DA';
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

const PAPER = '#EFECE3';

// HUD sits on a clean slip of paper so it never fights the hatch underneath
function card(g, x, y, w, h) {
  g.save();
  g.globalAlpha = 0.9;
  g.fillStyle = PAPER;
  g.fillRect(x, y, w, h);
  g.restore();
}

// The frame the instrument hangs in: brackets at the corners, register mark
// bottom-right, in the drawing's own hairline weight.
export function drawFurniture(g, W, H) {
  const m = 16;
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.strokeStyle = ink(0.36);
  g.lineWidth = 1;
  bracket(g, m, m, 1, 1, 11);
  bracket(g, W - m, m, -1, 1, 11);
  bracket(g, m, H - m, 1, -1, 11);
  bracket(g, W - m, H - m, -1, -1, 11);
  g.restore();
}

// ---------------------------------------------------------------------------
// One shape: the bar. Every quantity on screen — rounds, dashes, progress, the
// chain — is the same square-ended bar at one of two heights, so the eye learns
// it once, and it matches a world built entirely from rectangles and hairlines.
// Three type sizes only: 22 code, 10 label, 8 micro. Ink carries structure and
// quantity; magenta means "now"; the only other colour is the chip identifying
// the weapon you're holding, which is the same rule the world already uses.
// ---------------------------------------------------------------------------
const T_CODE = 22, T_LABEL = 10, T_MICRO = 8;
// Tracking belongs to the size, not the family: large type reads too loose as
// it grows, small type too tight. Canvas letterSpacing is recent, so guard it.
const CAN_TRACK = typeof CanvasRenderingContext2D !== 'undefined'
  && 'letterSpacing' in CanvasRenderingContext2D.prototype;
function track(g, em) { if (CAN_TRACK) g.letterSpacing = `${em}em`; }
const BAR = 7, BAR_TALL = 13;
const PAD = 14;

// ---------------------------------------------------------------------------
// The chain. It is the only thing on the page that arrives, so it gets to be
// loud: a slab that unrolls out from under the status card, takes a hit on
// every kill, and turns solid magenta once the run is worth protecting.
// ---------------------------------------------------------------------------
const CHAIN_H = 44, CHAIN_HOT = 5;

function drawChain(g, game, x, y, w) {
  const open = game.ui.chainOpen;
  if (open < 0.004) return;
  const n = game.combo;
  const punch = game.ui.chainPunch;
  const hot = n >= CHAIN_HOT;

  g.save();
  // it unrolls downward, and the punch shoves the whole slab a little left
  g.beginPath();
  g.rect(x - 4, y, w + 8, CHAIN_H * Math.min(1.05, open) + 2);
  g.clip();
  g.translate(-punch * 3, -(1 - Math.min(1, open)) * 7);
  g.globalAlpha = Math.min(1, open * 1.3);

  // ground: paper while it is building, solid magenta once it is worth losing
  if (hot) {
    g.fillStyle = M; g.fillRect(x, y, w, CHAIN_H);
  } else {
    g.globalAlpha *= 0.9;
    g.fillStyle = PAPER; g.fillRect(x, y, w, CHAIN_H);
    g.globalAlpha = Math.min(1, open * 1.3);
    g.strokeStyle = M; g.lineWidth = 1;
    g.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, CHAIN_H - 1);
  }
  const fg = hot ? PAPER : M;

  // the count, thrown a size larger on the frame the kill lands
  g.fillStyle = fg;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  const size = Math.round(T_CODE * (1 + punch * 0.22));
  track(g, -0.04);
  g.font = `600 ${size}px ${MONO}`;
  g.fillText(`\u00d7${n}`, x + 12, y + 28 + (size - T_CODE) * 0.5);
  track(g, 0.16);
  g.font = `600 ${T_MICRO}px ${MONO}`;
  const nw = g.measureText(`\u00d7${n}`).width;
  g.fillText('CHAIN', x + 12 + Math.max(46, nw + 12), y + 26);

  // and the clock you are racing, on the slab's own bottom edge
  gauge(g, x + 12, y + CHAIN_H - 14, w - 24, BAR,
        clamp(game.ui.chain, 0, 1), hot ? 'rgba(239,236,227,.34)' : ink(0.22), fg);

  // every kill also strikes a tick off the top edge, so the block reads as
  // being hit rather than merely counting
  g.fillStyle = fg;
  const ticks = Math.min(n, 12);
  for (let i = 0; i < ticks; i++) g.fillRect(x + w - 8 - i * 6, y + 6, 2, 7);

  track(g, 0);
  g.restore();
}

export function drawHud(g, game, W, H) {
  const p = game.player;
  drawFurniture(g, W, H);

  // ---- status: what the page says, and how close it is to being fixed -----
  const SX = 22, SY = 22, SW = 208;
  card(g, SX - PAD * 0.7, SY - 10, SW + PAD, 94);

  g.save();
  g.globalCompositeOperation = 'multiply';
  g.lineWidth = 1;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';

  g.fillStyle = INK;
  track(g, -0.03);
  g.font = `600 ${T_CODE}px ${MONO}`;
  g.fillText(String(Math.round(game.ui.code)), SX, SY + 18);
  track(g, 0);

  const label = game.statusLabel || 'NOT FOUND';
  track(g, 0.09);
  g.font = `600 ${T_MICRO}px ${MONO}`;
  const lw = g.measureText(label).width + 18;
  g.strokeStyle = M;
  bar(g, SX + SW - lw, SY + 4, lw, BAR_TALL);
  g.fillStyle = M;
  g.textAlign = 'center';
  g.fillText(label, SX + SW - lw / 2, SY + 13);

  gauge(g, SX, SY + 28, SW, BAR, game.ui.gauge, ink(0.3), INK);

  g.textAlign = 'left';
  track(g, 0.07);
  g.font = `400 ${T_MICRO}px ${MONO}`;
  g.fillStyle = ink(0.5);
  g.fillText(
    `FLOOR ${String(game.floor).padStart(2, '0')}   ${String(game.enemiesLeft).padStart(2, '0')} LEFT`,
    SX, SY + 48);

  // The clock gets the code's own size — it is the number a board is decided
  // on, so it reads at a glance and the hundredths keep moving. The 404 still
  // leads by sitting on top in full ink; the clock takes a step back in weight
  // rather than in size, so the card keeps its three sizes.
  g.fillStyle = ink(0.82);
  track(g, -0.03);
  g.font = `600 ${T_CODE}px ${MONO}`;
  g.fillText(clock(game.runT), SX, SY + 72);
  track(g, 0);

  g.textAlign = 'right';
  g.font = `400 ${T_MICRO}px ${MONO}`;
  g.fillStyle = ink(0.38);
  track(g, 0.07);
  g.fillText(String(game.score).padStart(6, '0'), SX + SW, SY + 72);
  track(g, 0);

  track(g, 0);
  g.textAlign = 'left';
  g.restore();

  drawChain(g, game, SX - PAD * 0.7, SY - 10 + 94 + 7, SW + PAD);

  // ---- weapon ------------------------------------------------------------
  // Two rows of text over one full-width band. The band always holds the same
  // thing — the device the rounds sit in, drawn from behind and centred in it
  // — so the panel keeps its shape while the device inside it changes.
  const w = WEAPONS[p.weapon];
  const WX = 22, WY = H - 92, WW = 208;
  card(g, WX - PAD * 0.7, WY - 12, WW + PAD, 78);

  g.save();
  g.globalCompositeOperation = 'multiply';
  g.lineWidth = 1;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';

  // row one: what you are holding, and how much of it is left
  if (w.tint) { g.fillStyle = w.tint; bar(g, WX, WY - 5, 14, BAR, true); }
  g.fillStyle = INK;
  g.font = `600 ${T_LABEL}px ${MONO}`;
  g.fillText(w.name, WX + (w.tint ? 20 : 0), WY + 3);

  if (w.feed && w.feed !== 'none') {
    g.fillStyle = ink(0.5);
    track(g, 0.07);
    g.font = `400 ${T_MICRO}px ${MONO}`;
    g.textAlign = 'right';
    g.fillText(`${p.ammo} / ${w.ammo}`, WX + WW, WY + 3);
    g.textAlign = 'left';
    track(g, 0);
  }

  // row two: the dash meter, labelled at the left and read from the right
  g.fillStyle = ink(0.42);
  track(g, 0.09);
  g.font = `400 ${T_MICRO}px ${MONO}`;
  g.fillText('DASH', WX, WY + 19);
  track(g, 0);
  const dw = 30;
  for (let i = 0; i < MAX_DASH; i++) {
    const bx = WX + WW - (MAX_DASH - i) * (dw + 5) + 5;
    if (i < p.dashCharges) {
      g.fillStyle = game.dashFlash > 0 ? M : INK;
      bar(g, bx, WY + 13, dw, BAR, true);
    } else if (i === p.dashCharges) {
      gauge(g, bx, WY + 13, dw, BAR, clamp(1 - p.dashCd / DASH_CD, 0, 1), ink(0.26), ink(0.55));
    } else {
      g.strokeStyle = ink(0.26);
      bar(g, bx, WY + 13, dw, BAR);
    }
  }

  // the band
  const BY = WY + 27, BH = 30;
  if (w.feed && w.feed !== 'none') {
    magazine(g, WX, BY, WW, BH, w.feed, p.ammo, w.ammo, INK, ink(0.32));
  } else {
    g.strokeStyle = ink(0.28);
    bar(g, WX, BY + BH / 2 - BAR / 2, WW, BAR);
    g.fillStyle = ink(0.45);
    track(g, 0.09);
    g.font = `400 ${T_MICRO}px ${MONO}`;
    g.textAlign = 'center';
    g.fillText(w.lethal ? 'EDGED' : 'BARE', WX + WW / 2, BY + BH / 2 + 3);
    track(g, 0);
    g.textAlign = 'left';
  }
  g.restore();

  // ---- banner -------------------------------------------------------------
  if (game.bannerT > 0 && game.banner) {
    const a = clamp(game.bannerT, 0, 1);
    g.save();
    g.font = `600 ${T_CODE}px ${MONO}`;
    g.textAlign = 'center';
    const bw = g.measureText(game.banner).width + 56;
    g.globalAlpha = a * 0.93;
    g.fillStyle = PAPER;
    g.fillRect(W / 2 - bw / 2, H / 2 - 116, bw, 38);
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = a;
    g.lineWidth = 1;
    g.strokeStyle = ink(0.35);
    bracket(g, W / 2 - bw / 2 + 5, H / 2 - 111, 1, 1, 7);
    bracket(g, W / 2 + bw / 2 - 5, H / 2 - 111, -1, 1, 7);
    bracket(g, W / 2 - bw / 2 + 5, H / 2 - 83, 1, -1, 7);
    bracket(g, W / 2 + bw / 2 - 5, H / 2 - 83, -1, -1, 7);
    g.fillStyle = INK;
    g.fillText(game.banner, W / 2, H / 2 - 90);
    g.restore();
  }

  if (game.flash > 0) {
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = game.flash * 0.5;
    g.fillStyle = M;
    g.fillRect(0, 0, W, H);
    g.restore();
  }
}

// ---------------------------------------------------------------------------
// The board itself: rank, name, time. It is the same card, the same three type
// sizes and the same magenta-means-you rule as the rest of the instrument, and
// it draws whatever state it is in — loading, empty, offline — rather than
// disappearing, so the screen does not jump around when the fetch lands.
// ---------------------------------------------------------------------------
function drawStandings(g, game, cx, y, w, k) {
  const st = game.standings;
  const x = cx - w / 2;
  const fs = Math.max(8, Math.round(9 * k));

  // A caption naming the board you are looking at, which is the board for the
  // mode chosen above. The choosing happens up there; this only reports.
  g.textAlign = 'left';
  g.fillStyle = ink(0.5);
  g.font = `600 ${fs}px ${MONO}`;
  track(g, 0.16);
  g.fillText(game.board.id === 'daily' ? 'DAILY BOARD' : 'ALL-TIME BOARD', x, y);
  g.textAlign = 'right';
  g.fillText('TIME', x + w, y);
  track(g, 0);
  g.strokeStyle = ink(0.22);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x, Math.round(y + 5) + 0.5); g.lineTo(x + w, Math.round(y + 5) + 0.5);
  g.stroke();

  const note = (text) => {
    g.textAlign = 'center';
    g.fillStyle = ink(0.34);
    g.font = `400 ${fs}px ${MONO}`;
    track(g, 0.1);
    g.fillText(text, cx, y + 24);
    track(g, 0);
    g.textAlign = 'left';
  };
  if (!st) return note('LOADING');
  if (st.offline) return note('NO BOARD HERE');
  if (!st.rows || !st.rows.length) {
    return note(game.board.id === 'daily' ? 'NOBODY HAS FIXED IT TODAY' : 'NOBODY HAS FIXED IT YET');
  }

  // A row is yours if this browser set it, or if it carries the name you play
  // under — the line belongs to the name, so a time you set on another machine
  // is still yours to recognise.
  const me = playerId();
  const myName = playerName();
  const isMine = (r) => r.player === me || (!!myName && r.name === myName.toUpperCase());
  const row = Math.round(15 * k);
  const shown = st.rows.slice(0, 5);
  const pb = game.best;
  // your own best only exists once you have finished a run, and it only needs
  // printing when it is not already on screen
  if (pb && !shown.some(isMine)) {
    g.fillStyle = ink(0.4);
    g.font = `400 ${fs}px ${MONO}`;
    g.textAlign = 'left';
    g.fillText('YOUR BEST', x, y + 20 + 5 * row + 4);
    g.textAlign = 'right';
    g.fillText(clock(pb.time), x + w, y + 20 + 5 * row + 4);
  }
  shown.forEach((r, i) => {
    const ry = y + 20 + i * row;
    const mine = isMine(r);
    g.fillStyle = mine ? M : ink(0.62);
    g.font = `${mine ? 600 : 400} ${fs}px ${MONO}`;
    g.textAlign = 'left';
    g.fillText(String(r.rank).padStart(2, '0'), x, ry);
    g.fillText(r.name, x + 22 * k, ry);
    g.textAlign = 'right';
    g.fillText(clock(r.time), x + w, ry);
  });
  g.textAlign = 'left';
}

// ---------------------------------------------------------------------------
// Which floor you are about to fight. This is a choice about the RUN — the
// board below follows from it — so it is stated as two chips above the call to
// play with a line saying what the chosen one means, not as tabs on a table
// where it would read as changing the view.
// ---------------------------------------------------------------------------
const MODES = [
  { id: 'daily', label: 'DAILY', blurb: 'THE SAME FLOOR FOR EVERYONE. NEW ONE TOMORROW.' },
  { id: 'classic', label: 'SEED 404', blurb: 'THE FLOOR THAT NEVER CHANGES. THE PERMANENT RECORD.' },
];

function drawModes(g, game, cx, y, k) {
  const fs = Math.max(8, Math.round(9 * k));
  const h = Math.round(17 * k);
  const pad = Math.round(11 * k);
  g.font = `600 ${fs}px ${MONO}`;
  track(g, 0.14);

  const widths = MODES.map((m) => Math.round(g.measureText(m.label).width) + pad * 2);
  const gap = Math.round(8 * k);
  let x = cx - (widths.reduce((a, b) => a + b, 0) + gap) / 2;

  const hits = [];
  MODES.forEach((m, i) => {
    const on = game.board.id === m.id;
    const w = widths[i];
    g.textAlign = 'center';
    if (on) {
      // the chosen chip prints white out of solid ink, and paper does not
      // survive a multiply — this is the one mark on the title that stops
      // multiplying to draw itself
      g.save();
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = INK;
      bar(g, x, y, w, h, true);
      g.fillStyle = PAPER;
      g.fillText(m.label, x + w / 2, y + h - Math.round(5.5 * k));
      g.restore();
    } else {
      g.strokeStyle = ink(0.3);
      bar(g, x, y, w, h);
      g.fillStyle = ink(0.42);
      g.fillText(m.label, x + w / 2, y + h - Math.round(5.5 * k));
    }
    hits.push({ id: m.id, x, y, w, h });
    x += w + gap;
  });
  game.ui.tabs = hits;

  const picked = MODES.find((m) => m.id === game.board.id) || MODES[0];
  g.textAlign = 'center';
  g.fillStyle = ink(0.45);
  g.font = `400 ${fs}px ${MONO}`;
  track(g, 0.09);
  g.fillText(picked.blurb, cx, y + h + Math.round(15 * k));
  track(g, 0);
}

export function drawTitle(g, game, W, H) {
  // A 404 first, a game second. Nothing here but the error, one line of why,
  // and the way in — the controls wait until you've said you want to play.
  const k = clamp(Math.min(W / 900, H / 760), 0.58, 1);
  const touch = game.touch && game.touch.enabled;
  const cx = W / 2, cy = H / 2;
  const t = performance.now() / 1000;
  const cw = Math.min(560 * k, W - 28);
  const ch = 580 * k;

  g.save();
  g.globalAlpha = 0.94;
  g.fillStyle = PAPER;
  g.fillRect(cx - cw / 2, cy - 200 * k, cw, ch);
  g.restore();

  g.save();
  g.globalCompositeOperation = 'multiply';
  g.textAlign = 'center';

  const markW = 88 * k;
  drawPlateMark(g, cx - markW / 2, cy - 166 * k, markW);

  const split = (3 + Math.sin(t * 0.9) * 2.6) * k;
  g.font = `600 ${Math.min(132 * k, W * 0.17)}px ${MONO}`;
  [[C, 1, 0], [M, -0.5, 0.866], ['#F7CF16', -0.5, -0.866]].forEach(([col, ox, oy]) => {
    g.fillStyle = col;
    g.fillText('404', cx + ox * split, cy + 30 * k + oy * split);
  });

  g.fillStyle = INK;
  g.font = `600 ${13 * k}px ${MONO}`;
  g.fillText('PAGE NOT FOUND', cx, cy + 62 * k);
  g.fillStyle = ink(0.55);
  g.font = `400 ${11.5 * k}px ${MONO}`;
  g.fillText('404 THINGS ARE IN THE WAY. CLEAR THEM.', cx, cy + 84 * k);

  drawModes(g, game, cx, cy + 108 * k, k);

  g.fillStyle = M;
  g.font = `600 ${15 * k}px ${MONO}`;
  g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 4);
  g.fillText(touch ? 'TAP TO PLAY' : 'CLICK TO PLAY', cx, cy + 168 * k);
  g.globalAlpha = 1;

  drawStandings(g, game, cx, cy + 206 * k, Math.min(320 * k, cw - 40 * k), k);
  g.restore();
}

// A single line of controls, shown only at the start of a run and only until
// you have actually moved and swung at something.
export function drawLegend(g, game, W, H) {
  if (!game.tutorialT || game.tutorialT <= 0) return;
  const a = clamp(game.tutorialT / 1.2, 0, 1);
  const touch = game.touch && game.touch.enabled;
  const line = touch
    ? 'LEFT THUMB MOVE   ·   RIGHT THUMB TURNS, PUSH IT OUT TO FIRE'
    : 'WASD MOVE   ·   MOUSE AIM   ·   CLICK ATTACK   ·   SPACE DASH KILLS   ·   Q THROW';
  g.save();
  g.textAlign = 'center';
  g.font = `400 11px ${MONO}`;
  const w = g.measureText(line).width + 40;
  g.globalAlpha = 0.92 * a;
  g.fillStyle = PAPER;
  g.fillRect(W / 2 - w / 2, H - 88, w, 26);
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = a;
  g.fillStyle = ink(0.7);
  g.fillText(line, W / 2, H - 70);
  g.restore();
}

export function drawWin(g, game, W, H) {
  const cx = W / 2, cy = H / 2;
  const t = performance.now() / 1000;
  const split = 2 + Math.sin(t * 1.1) * 1.6;
  const cw = Math.min(720, W - 60);
  g.save();
  g.globalAlpha = 0.95;
  g.fillStyle = PAPER;
  g.fillRect(cx - cw / 2, cy - 170, cw, 500);
  g.restore();

  g.save();
  g.globalCompositeOperation = 'multiply';
  g.textAlign = 'center';
  g.font = `600 ${Math.min(150, W * 0.17)}px ${MONO}`;
  [['#12A3DA', 1, 0], ['#EC0A63', -0.5, 0.866], ['#F7CF16', -0.5, -0.866]].forEach(([col, ox, oy]) => {
    g.fillStyle = col;
    g.fillText('200', cx + ox * split, cy - 40 + oy * split);
  });
  g.fillStyle = INK;
  g.font = `600 20px ${MONO}`;
  g.fillText('OK', cx, cy - 4);
  g.font = `400 12px ${MONO}`;
  g.fillStyle = 'rgba(22,21,19,0.62)';
  g.fillText('PAGE RESTORED. 204 THINGS REMOVED FROM THE WAY.', cx, cy + 26);
  g.fillStyle = INK;
  g.font = `600 14px ${MONO}`;
  g.fillText(`${clock(game.runT)}   ·   SCORE ${game.score}   ·   BEST CHAIN \u00d7${game.bestCombo}`, cx, cy + 58);
  const pb = game.best;
  if (pb) {
    g.font = `400 11px ${MONO}`;
    g.fillStyle = ink(0.45);
    g.fillText(
      pb.time >= game.runT ? `${game.board.label} BOARD — NEW BEST`
                           : `${game.board.label} BOARD — BEST ${clock(pb.time)}`,
      cx, cy + 78);
  }
  // cy+84..cy+124 is the claim zone. It holds the name form, or what came back
  // from sending it, or nothing at all when there is no board to send to — and
  // it is reserved either way, so the screen never rearranges itself under a
  // cursor that is on its way to a button.
  if (game.claimError) {
    g.fillStyle = M;
    g.font = `600 10px ${MONO}`;
    track(g, 0.12);
    g.fillText(String(game.claimError).toUpperCase(), cx, cy + 134);
    track(g, 0);
  } else if (game.claimOpen) {
    // why it wants a handle rather than a name
    g.fillStyle = ink(0.4);
    g.font = `400 9px ${MONO}`;
    track(g, 0.1);
    g.fillText("THE WEEK'S BEST RUN GOES ON THE CAN", cx, cy + 134);
    track(g, 0);
  } else if (game.claimed) {
    const r = game.claimRank;
    g.fillStyle = INK;
    g.font = `600 13px ${MONO}`;
    track(g, 0.1);
    g.fillText(r === 1 ? 'TOP OF THE BOARD' : r ? `NUMBER ${r} ON THE BOARD` : 'ON THE BOARD',
               cx, cy + 104);
    track(g, 0);
  }

  // The way out. You just restored the page, so the thing to do next is go and
  // look at it; running it again is the quiet option. The link itself is a real
  // anchor, placed by placeHome().
  g.fillStyle = ink(0.38);
  g.font = `400 10px ${MONO}`;
  track(g, 0.1);
  g.fillText('OR CLICK ANYWHERE TO RUN IT AGAIN', cx, cy + 198);
  track(g, 0);
  g.restore();

  // the real lockup — plate mark over wordmark, the way the brand kit draws it
  const lockW = 68;
  g.save();
  g.globalCompositeOperation = 'multiply';
  drawLockup(g, cx - lockW / 2, cy + 216, lockW, ink(0.72));
  g.fillStyle = ink(0.42);
  g.font = `400 9px ${MONO}`;
  g.textAlign = 'center';
  g.fillText('WEBSITES THAT LAUNCH IDEAS', cx, cy + 284);
  g.restore();
}
