// Boards. A run is only comparable to another run on the same board, so the
// board picks the seed rather than the other way round — the generator stays
// procedural, it just gets told which world to build.
//
// DAILY rolls at midnight UTC: everybody alive today fights the identical
// floors, which is what makes two times worth comparing, and it is a reason to
// come back tomorrow. SEED 404 never changes — it is the permanent record, the
// one board where a time set in March still stands in November. FREE is the
// old behaviour, a fresh world every run, for people who just want to play.
const DAY = 86400000;

export const BOARDS = {
  daily:   { id: 'daily',   label: 'DAILY',    seed: () => 7919 + Math.floor(Date.now() / DAY) },
  classic: { id: 'classic', label: 'SEED 404', seed: () => 404 },
  free:    { id: 'free',    label: 'FREE',     seed: () => (Math.random() * 1e9) | 0 },
};

export function pickBoard(name) {
  return BOARDS[name] || BOARDS.daily;
}

// ?board=classic / ?board=free picks one; a plain visit gets today's
export function currentBoard() {
  const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  return pickBoard(q.get('board'));
}

export function dayStamp() {
  return new Date().toISOString().slice(0, 10);
}

// mm:ss.cc — hundredths, because the point of a run clock is to look fast.
// Monospaced, so nothing shifts as the digits roll.
export function clock(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${String(m).padStart(2, '0')}:${r < 10 ? '0' : ''}${r.toFixed(2)}`;
}

// Personal bests live per board, and the daily one is stamped with its day so
// yesterday's time does not masquerade as today's.
function key(board) { return `overprint.pb.${board.id}`; }

export function loadBest(board) {
  try {
    const raw = JSON.parse(localStorage.getItem(key(board)) || 'null');
    if (!raw) return null;
    if (board.id === 'daily' && raw.day !== dayStamp()) return null;
    return raw;
  } catch { return null; }
}

// A finished run beats a stored one on time; an unfinished run has no time, so
// the two are never compared against each other.
export function saveBest(board, run) {
  const prev = loadBest(board);
  if (prev && prev.time <= run.time) return prev;
  const rec = { time: run.time, score: run.score, day: dayStamp() };
  try { localStorage.setItem(key(board), JSON.stringify(rec)); } catch { /* private mode */ }
  return rec;
}
