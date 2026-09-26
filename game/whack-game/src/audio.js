// WebAudio synth SFX. No files.
let ctx, master, timeFn = null;
/** Use an injected (e.g. Offline) context; timeFn returns the scheduling time in that context's timeline. */
export function setContext(c, tf) { ctx = c; timeFn = tf; master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); }
function ac() {
  if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); }
  if (!timeFn && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
const now = () => (timeFn ? timeFn() : ctx.currentTime);
export function unlock() { ac(); }

function noise(dur) {
  const c = ac(); const b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b; return s;
}
function env(g, t, a, d, peak = 1, sus = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(sus, t + a + d); }

export function bonk(combo = 1) {
  const c = ac(), t = now();
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; const f = 150 + Math.min(combo, 10) * 12;
  o.frequency.setValueAtTime(f * 2.2, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.16);
  env(g, t, 0.004, 0.22, 0.9); o.connect(g).connect(master); o.start(t); o.stop(t + 0.3);
  const n = noise(0.06), ng = c.createGain(), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
  env(ng, t, 0.002, 0.05, 0.35); n.connect(hp).connect(ng).connect(master); n.start(t);
  // little "ding" that rises with combo
  const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'triangle';
  o2.frequency.value = 660 * Math.pow(1.06, Math.min(combo, 12)); env(g2, t + 0.02, 0.005, 0.18, 0.18);
  o2.connect(g2).connect(master); o2.start(t + 0.02); o2.stop(t + 0.3);
}
export function pop() {
  const c = ac(), t = now(); const o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
  env(g, t, 0.005, 0.12, 0.25); o.connect(g).connect(master); o.start(t); o.stop(t + 0.2);
}
export function whoosh() {
  const c = ac(), t = now(); const n = noise(0.18), g = c.createGain(), f = c.createBiquadFilter();
  f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.12);
  env(g, t, 0.03, 0.14, 0.22); n.connect(f).connect(g).connect(master); n.start(t);
}
export function whiff() {
  const c = ac(), t = now(); const n = noise(0.12), g = c.createGain(), f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 500; env(g, t, 0.005, 0.1, 0.35); n.connect(f).connect(g).connect(master); n.start(t);
}
export function wah() {
  const c = ac(), t = now();
  const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(330, t); o.frequency.linearRampToValueAtTime(240, t + 0.25); o.frequency.linearRampToValueAtTime(170, t + 0.6);
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.6);
  env(g, t, 0.01, 0.6, 0.3); o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + 0.7);
}
export function boom() {
  const c = ac(), t = now(); const n = noise(0.5), g = c.createGain(), f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(80, t + 0.45);
  env(g, t, 0.005, 0.45, 0.8); n.connect(f).connect(g).connect(master); n.start(t);
  const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.4); env(og, t, 0.005, 0.4, 0.8); o.connect(og).connect(master); o.start(t); o.stop(t + 0.5);
}
export function jingle(good = true) {
  const c = ac(), t = now();
  const notes = good ? [523, 659, 784, 1047, 784, 1047] : [392, 370, 349, 330];
  notes.forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f;
    const s = t + i * (good ? 0.11 : 0.22); env(g, s, 0.01, good ? 0.25 : 0.4, 0.25); o.connect(g).connect(master); o.start(s); o.stop(s + 0.5);
  });
}
export function tick() {
  const c = ac(), t = now(); const o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = 1200;
  env(g, t, 0.002, 0.04, 0.08); o.connect(g).connect(master); o.start(t); o.stop(t + 0.06);
}
