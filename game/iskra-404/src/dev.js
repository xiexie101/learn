const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const num = (k, dflt) => {
  const v = parseFloat(q.get(k));
  return Number.isFinite(v) ? v : dflt;
};

// Default to standard production mode (1x normal speed, start from Floor 1)
// Can still be enabled via query params like ?rec=1 or ?speed=0.33 or ?floor=12
const recRequested = q.get('rec') === '1';

export const REC = {
  on: recRequested,
  speed: num('speed', 1),
  floor: Math.max(0, Math.round(num('floor', 0))),
  shot: Math.max(0, Math.round(num('shot', 0))),
  clock: Math.max(0, num('clock', 0)),
  stretch: 1,
  statusBanner: q.get('banner') !== '0',
};

if (REC.on && REC.shot) REC.stretch = 1 / REC.speed;

if (REC.on) {
  console.log(`[overprint] recording rig: ${REC.speed.toFixed(2)}x time`
    + (REC.floor ? `, floor ${REC.floor} difficulty` : '')
    + (REC.statusBanner ? '' : ', no status banners')
    + (REC.shot ? `, SHOT MODE: ${REC.shot} kills left, audio pre-stretched ${REC.stretch.toFixed(1)}x` : ''));
}
