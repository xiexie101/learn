// Talking to the board. Everything here fails soft: the game is a 404 page
// first, so a leaderboard that is down, blocked or simply absent must never
// stop anyone playing. Every call resolves to null rather than throwing.
//
// The API lives on the same origin in production. Anywhere else there is no
// API at all unless one is named with ?api=..., which keeps development runs
// out of the real board.
const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const sameOrigin = typeof location !== 'undefined' && /(^|\.)iskra\.graphics$/.test(location.hostname);
export const API = sameOrigin ? '' : (params.get('api') || null);
// In standalone replica mode, we are always online (either remote API or built-in local persistent board)
export const online = true;

// Default initial standings for fresh runs
const DEFAULT_BOARDS = {
  daily: [
    { rank: 1, name: 'CYAN', time: 38.45, score: 3200, player: 'bot1' },
    { rank: 2, name: 'MAGENTA', time: 42.12, score: 2950, player: 'bot2' },
    { rank: 3, name: 'YELLOW', time: 47.80, score: 2700, player: 'bot3' },
    { rank: 4, name: 'KEY_BLACK', time: 54.30, score: 2400, player: 'bot4' },
    { rank: 5, name: 'STENCIL', time: 61.15, score: 2100, player: 'bot5' },
  ],
  classic: [
    { rank: 1, name: 'ISKRA', time: 32.18, score: 4500, player: 'bot_iskra' },
    { rank: 2, name: 'HELVETICA', time: 39.75, score: 3800, player: 'bot_helv' },
    { rank: 3, name: 'KERNING', time: 44.20, score: 3400, player: 'bot_kern' },
    { rank: 4, name: 'RASTER', time: 49.60, score: 3100, player: 'bot_rast' },
    { rank: 5, name: 'BLEED', time: 55.90, score: 2800, player: 'bot_bld' },
  ]
};

function getLocalBoard(board) {
  try {
    const raw = localStorage.getItem(`overprint.board.${board}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_BOARDS[board] || DEFAULT_BOARDS.daily;
}

function saveLocalBoard(board, rows) {
  try {
    localStorage.setItem(`overprint.board.${board}`, JSON.stringify(rows));
  } catch {}
}

// A player id, not an account: it exists so one person holds one row on a
// board instead of filling it, and it never leaves this browser except as an
// opaque string.
export function playerId() {
  try {
    let id = localStorage.getItem('overprint.player');
    if (!id) {
      id = [...crypto.getRandomValues(new Uint8Array(12))]
        .map((b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('overprint.player', id);
    }
    return id;
  } catch { return 'local-player'; }
}

export function playerName() {
  try { return localStorage.getItem('overprint.name') || ''; } catch { return ''; }
}

export function setPlayerName(n) {
  try { localStorage.setItem('overprint.name', n); } catch { /* private mode */ }
}

async function call(path, init) {
  if (!API) return null;
  try {
    const res = await fetch(API + path, { ...init, cache: 'no-store' });
    const body = await res.json();
    return res.ok ? body : { error: body.error || `http ${res.status}` };
  } catch { return null; }
}

export async function fetchBoard(board, limit = 8) {
  if (API) {
    const res = await call(`/api/board?board=${encodeURIComponent(board)}&limit=${limit}`);
    if (res && res.rows) return res;
  }
  const rows = getLocalBoard(board);
  return { rows: rows.slice(0, limit) };
}

export async function submitRun(board, run, name) {
  const player = playerId();
  if (!player) return null;
  if (API) {
    const res = await call('/api/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ board, player, name, ...run }),
    });
    if (res && !res.error) return res;
  }

  // Local Leaderboard insertion logic
  let rows = [...getLocalBoard(board)];
  const existingIndex = rows.findIndex((r) => r.player === player || r.name === name.toUpperCase());
  if (existingIndex !== -1 && rows[existingIndex].time <= run.time) {
    return { placed: false, rows, rank: existingIndex + 1 };
  }
  if (existingIndex !== -1) {
    rows.splice(existingIndex, 1);
  }
  rows.push({
    player,
    name: name.toUpperCase().slice(0, 15),
    time: run.time,
    score: run.score,
    kills: run.kills,
    floor: run.floor,
  });
  rows.sort((a, b) => a.time - b.time);
  rows = rows.map((r, i) => ({ ...r, rank: i + 1 }));
  saveLocalBoard(board, rows);
  const myRank = rows.findIndex((r) => r.player === player) + 1;
  return { placed: true, rows: rows.slice(0, 8), rank: myRank };
}
