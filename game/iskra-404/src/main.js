import { createRenderer } from './render.js?v=184152';
import { REC } from './dev.js?v=184152';
import { online, fetchBoard, submitRun, playerName, setPlayerName } from './net.js?v=184152';
import { createGame } from './game.js?v=184152';
import { drawHud, drawTitle, drawWin, drawFurniture, drawLegend } from './hud.js?v=184152';
import { createTouch } from './touch.js?v=184152';
import { initAudio, setMuted, isMuted } from './audio.js?v=184152';

// Bumped on every edit and printed in the corner. If the number on screen is
// not the number the server reports, you are looking at a cached page.
export const BUILD_ID = '184152';
console.log('[overprint] build', BUILD_ID);
if (window.buildTitle) window.buildTitle('BUILD ' + BUILD_ID);

const canvas = document.getElementById('c');
const renderer = createRenderer(canvas);
const game = createGame(renderer);
const touch = createTouch(canvas, game, renderer);
game.touch = touch;
game.showTitle();

const inp = game.input;
inp.mx = window.innerWidth / 2;
inp.my = window.innerHeight / 2;

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

addEventListener('keydown', (e) => {
  initAudio();
  if (KEYMAP[e.code]) { inp[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.code === 'Space') {
    if (game.state === 'title' || game.state === 'won') { game.begin(); }
    else { inp.dash = true; }
    e.preventDefault();
  }
  if (e.code === 'KeyQ') inp.throwIt = true;
  if (e.code === 'Backspace' && game.state === 'play') { e.preventDefault(); game.restartFloor(); }
  if (e.code === 'KeyM') { setMuted(!isMuted()); }
  if (e.code === 'Enter' && (game.state === 'title' || game.state === 'won')) {
    e.preventDefault();
    game.begin();
  }
});

addEventListener('keyup', (e) => {
  if (KEYMAP[e.code]) inp[KEYMAP[e.code]] = false;
});

addEventListener('mousemove', (e) => { inp.mx = e.clientX; inp.my = e.clientY; });

canvas.addEventListener('mousedown', (e) => {
  initAudio();
  if (hitTab(e.clientX, e.clientY)) return;
  if (game.state === 'title' || game.state === 'won') {
    e.preventDefault();
    game.begin();
    return;
  }
  if (e.button === 0) inp.fire = true;
  if (e.button === 2) inp.throwIt = true;
});
addEventListener('mouseup', (e) => { if (e.button === 0) inp.fire = false; });

canvas.addEventListener('pointerdown', (e) => {
  initAudio();
  if (hitTab(e.clientX, e.clientY)) { e.preventDefault(); return; }
  if (game.state === 'title' || game.state === 'won') {
    e.preventDefault();
    game.begin();
  }
}, { passive: false });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// keep the player from sprinting off when the tab loses focus
addEventListener('blur', () => {
  inp.up = inp.down = inp.left = inp.right = false;
  inp.fire = false;
});

// The way out of a 404 has to be obvious. On the menu it sits directly under
// the call to play; once you are playing it steps aside into the corner.
const homeLink = document.getElementById('home');
let homeKey = '';
function placeHome() {
  const W = renderer.W, H = renderer.H;
  const onTitle = game.state === 'title';
  const onWin = game.state === 'won';
  const onMenu = onTitle || onWin;
  const k = Math.max(0.58, Math.min(1, Math.min(W / 900, H / 760)));
  const key = `${game.state}|${W}|${H}`;
  if (key === homeKey) return;
  homeKey = key;
  const st = homeLink.style;
  if (onMenu) {
    st.left = '50%';
    st.right = 'auto';
    st.transform = 'translateX(-50%)';
    // on the win screen it IS the call to action — you just restored the page,
    // so it takes the slot the play prompt has on the title
    st.top = onWin ? `${Math.round(H / 2 + 150)}px` : `${Math.round(H / 2 + 330 * k)}px`;
    st.bottom = 'auto';
    st.fontSize = onWin ? '14px' : `${(11.5 * k).toFixed(1)}px`;
    st.color = onWin ? '#EC0A63' : 'rgba(22,21,19,0.82)';
    st.borderBottomColor = onWin ? '#EC0A63' : 'rgba(22,21,19,0.5)';
  } else {
    // top right during play: the left column carries the readouts and the
    // bottom right is where a thumb sits on a phone
    st.left = 'auto';
    st.transform = 'none';
    st.right = '26px';
    st.top = 'calc(24px + env(safe-area-inset-top))';
    st.bottom = 'auto';
    st.fontSize = '9px';
    st.color = 'rgba(22,21,19,0.4)';
    st.borderBottomColor = 'rgba(22,21,19,0.2)';
  }
}

// ---------------------------------------------------------------------------
// The board. Two jobs: keep today's standings on the title screen fresh, and
// let a finished run claim a place on it. Both fail soft — this is a 404 page
// before it is a leaderboard, so nothing here can stop anyone playing.
// ---------------------------------------------------------------------------
const claimForm = document.getElementById('claim');
const claimName = document.getElementById('claimname');
const claimGo = document.getElementById('claimgo');
const canLink = document.getElementById('can');
let standingsAt = 0;

async function loadStandings(force) {
  if (!online) { game.standings = { offline: true }; return; }
  const now = performance.now();
  if (!force && now - standingsAt < 20000) return;
  standingsAt = now;
  const res = await fetchBoard(game.board.id, 8);
  game.standings = res && res.rows ? res : { offline: true };
}

function placeClaim() {
  const show = game.state === 'won' && online && !game.claimed;
  game.claimOpen = show;
  claimForm.hidden = !show;
  if (show) claimForm.style.top = `${Math.round(renderer.H / 2 + 84)}px`;

  // The can only appears to people who finished. It is the one place in the
  // game where the studio sells anything, and it is earned rather than shown.
  canLink.hidden = game.state !== 'won';
  if (!canLink.hidden) canLink.style.top = `${Math.round(renderer.H / 2 + 296)}px`;
}

async function sendRun(name) {
  claimGo.disabled = true;
  claimGo.textContent = 'SENDING';
  const run = game.runResult || { time: game.runT, score: game.score };
  const res = await submitRun(game.board.id, {
    time: run.time, score: run.score,
    kills: game.kills, floor: game.floor, seed: game.seed,
  }, name);
  claimGo.disabled = false;
  claimGo.textContent = 'PUT IT ON THE BOARD';
  if (!res || res.error) {
    game.claimError = (res && res.error) || 'THE BOARD IS NOT ANSWERING';
    return;
  }
  game.standings = res;
  if (res.placed === false) {
    // the name already holds a better time, so the line stays where it is —
    // leave the form open, because picking another name is the way forward
    game.claimError = `${name} ALREADY HAS A FASTER TIME`;
    return;
  }
  setPlayerName(name);
  game.claimError = null;
  game.claimed = true;
  game.claimRank = res.rank || null;
  placeClaim();
}

claimForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = claimName.value.trim();
  if (name.length < 2) { game.claimError = 'TWO CHARACTERS, MINIMUM'; return; }
  sendRun(name);
});
// the canvas restarts the run on any click, so keep the form's own clicks in it
claimForm.addEventListener('pointerdown', (e) => e.stopPropagation());
claimForm.addEventListener('mousedown', (e) => e.stopPropagation());

// The mode chips are the one thing on the title canvas you can click that is
// not "start". They have to be tested before the start, or the mode could never
// be changed without a query string.
function hitTab(x, y) {
  if (game.state !== 'title') return false;
  for (const t of game.ui.tabs || []) {
    if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
      if (game.selectBoard(t.id)) loadStandings(true);
      return true;
    }
  }
  return false;
}

let wasState = null;
function watchState() {
  if (game.state === wasState) return;
  const entered = game.state;
  wasState = entered;
  if (entered === 'won') {
    game.claimed = false;
    game.claimError = null;
    claimName.value = playerName();
  } else if (entered === 'title') {
    loadStandings(true);
  }
  placeClaim();
}

loadStandings(true);

// The simulation runs on a fixed step, not on the frame. A speedrunner learning
// a floor needs the bodies to be in the same place ten seconds in, not just at
// the spawn — and with a variable step they never are, because the number of
// updates and the length of each one depend on the machine and the moment. One
// step is always the same length, so the same inputs produce the same fight,
// and the same code will replay a submitted run when the board needs verifying.
const FIXED = 1 / 120;
const MAX_STEPS = 6;        // after a stall, drop the backlog rather than spiral
let acc = 0;

let last = performance.now();
function frame(now) {
  const rdt = Math.min(0.05, (now - last) / 1000) * REC.speed;
  last = now;
  touch.apply(rdt);
  acc = Math.min(acc + rdt, FIXED * MAX_STEPS);
  while (acc >= FIXED) { game.step(FIXED); acc -= FIXED; }
  watchState();
  placeHome();
  renderer.draw(game);
  const g = renderer.ctx;
  if (game.state === 'title') { drawFurniture(g, renderer.W, renderer.H); drawTitle(g, game, renderer.W, renderer.H); }
  else if (game.state === 'won') { drawFurniture(g, renderer.W, renderer.H); drawWin(g, game, renderer.W, renderer.H); }
  else { drawHud(g, game, renderer.W, renderer.H); drawLegend(g, game, renderer.W, renderer.H); touch.draw(g); }
  requestAnimationFrame(frame);
}
setInterval(() => {
  if (game.state === 'title') loadStandings(false);
}, 15000);
requestAnimationFrame(frame);

// exposed for tuning / automated smoke tests
window.__game = game;
window.__renderer = renderer;
import('./entities.js').then((m)=>{ window.__W=m.WEAPONS; window.__SB=m.shieldBlocks; window.__SS=m.shieldSegmentAt; window.__AA=m.armourArc; window.__AL=m.armourLayout; window.__CD=m.columnDepth; });
