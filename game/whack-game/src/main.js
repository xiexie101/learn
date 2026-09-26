import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadAssets } from './assets.js';
import { toonMaterial, addOutline, PALETTE } from './toon.js';
import { Monsters } from './monsters.js';
import { Hammer } from './hammer.js';
import { AimMarker } from './aim.js';
import { Director } from './director.js';
import { Particles } from './particles.js';
import { UI } from './ui.js';
import * as sfx from './audio.js';
import { MOBILE } from './tier.js';

const params = new URLSearchParams(location.search);
const AUTOPLAY = params.has('autoplay');
const CAPTURE = params.has('capture');
if (CAPTURE) document.body.classList.add('capture');
if (params.has('dev')) document.body.classList.add('dev');
const GAME_LEN = 45;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = MOBILE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.info.autoReset = false;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.1, 50);
const camBase = new THREE.Vector3(0, 1.5, 2.45);
const camTarget = new THREE.Vector3(0, 0.52, 0.0);
// Frame the cabinet for any aspect: landscape keeps the desktop shot; narrow screens widen the fov, steepen the
// view and pull back until the cabinet width (1.26 m + margin) fits.
function layoutCamera() {
  const aspect = innerWidth / innerHeight;
  const k = THREE.MathUtils.clamp((1.05 - aspect) / 0.6, 0, 1); // 0 = landscape, 1 = phone portrait
  const fov = THREE.MathUtils.lerp(36, 50, k);
  const elev = THREE.MathUtils.lerp(0.38, 0.55, k);          // camera elevation angle (rad)
  camTarget.set(0, THREE.MathUtils.lerp(0.52, 0.62, k), 0);
  const halfW = 0.67;
  const dFit = halfW / (Math.tan(fov / 2 * Math.PI / 180) * aspect);
  const d = Math.max(2.64, dFit);
  camBase.set(0, camTarget.y + Math.sin(elev) * d, Math.cos(elev) * d);
  camera.fov = fov; camera.aspect = aspect; camera.updateProjectionMatrix();
  camera.position.copy(camBase); camera.lookAt(camTarget);
}
layoutCamera();

// sky: gradient sphere
const sky = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: { top: { value: new THREE.Color('#8fd0ff') }, mid: { value: new THREE.Color('#d7ecff') }, bot: { value: new THREE.Color('#ffe6c9') } },
  vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 top, mid, bot; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.7, h)) : mix(mid, bot, smoothstep(0.0, -0.35, h)); gl_FragColor = vec4(c, 1.0); }`,
}));
sky.material.toneMapped = false; scene.add(sky);

// ground: soft cream disc with a big contact blob
const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 64), toonMaterial({ color: '#fff4e2', rim: 0 }));
scene.fog = new THREE.Fog('#e6eefc', 6, 16);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const blobTex = (() => { const s = 256, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d'); const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, 'rgba(60,50,90,0.45)'); r.addColorStop(0.6, 'rgba(60,50,90,0.18)'); r.addColorStop(1, 'rgba(60,50,90,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); return new THREE.CanvasTexture(c); })();
const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.7), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.003; scene.add(blob);

// clouds
const clouds = new THREE.Group(); scene.add(clouds);
function cloud(x, y, z, s) {
  const g = new THREE.Group(); const m = toonMaterial({ color: '#ffffff', rim: 0.3 });
  const puffs = [[0, 0, 0.5], [-0.55, -0.1, 0.36], [0.55, -0.08, 0.4], [0.15, 0.25, 0.34], [-0.25, 0.22, 0.3]];
  if (MOBILE) { const geos = puffs.map(([dx, dy, r]) => new THREE.SphereGeometry(r, 14, 10).translate(dx, dy, 0)); const b = new THREE.Mesh(mergeGeometries(geos), m); g.add(b); addOutline(b, 0.035); }
  else for (const [dx, dy, r] of puffs) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m); b.position.set(dx, dy, 0); g.add(b); addOutline(b, 0.035); }
  g.position.set(x, y, z); g.scale.setScalar(s); g.userData.x0 = x; g.userData.sp = 0.02 + Math.random() * 0.03; clouds.add(g);
}
cloud(-3.6, 0.85, -6, 0.7); cloud(3.4, 0.95, -7, 0.85); cloud(0.6, 1.1, -9, 0.8); cloud(-1.8, 0.7, -5, 0.4); cloud(4.6, 0.6, -5.5, 0.45); cloud(-6, 1.2, -9, 0.9);
// floating sparkle stars in the sky
const starGeo = new THREE.SphereGeometry(0.06, 8, 6); const starMat = toonMaterial({ color: PALETTE.butter, emissive: '#7a5a00', emissiveIntensity: 1.5, rim: 0 });
for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(starGeo, starMat); s.position.set((Math.random() - .5) * 10, 0.7 + Math.random() * 1.4, -3.5 - Math.random() * 4); s.userData.ph = Math.random() * 6; clouds.add(s); }

// lights
scene.add(new THREE.HemisphereLight('#dff0ff', '#ffd9b3', 0.55));
const key = new THREE.DirectionalLight('#fff3e0', 2.2); key.position.set(-1.6, 3.2, 2.2); key.castShadow = true;
key.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048); key.shadow.camera.left = key.shadow.camera.bottom = -1.4; key.shadow.camera.right = key.shadow.camera.top = 1.4; key.shadow.camera.near = 1; key.shadow.camera.far = 8; key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
scene.add(key);
const fill = new THREE.DirectionalLight('#cfe5ff', 0.5); fill.position.set(2, 1.5, 1); scene.add(fill);

// post
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = MOBILE ? null : new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.6, 0.92); if (bloom) composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() { layoutCamera(); renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2)); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); }
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 60)); visualViewport?.addEventListener('resize', resize);

// ---------- game ----------
const ui = new UI();
const particles = new Particles(scene);
let assets, monsters, hammer, aim, director;
const game = { running: false, score: 0, combo: 0, timeLeft: GAME_LEN, spawnT: 0, shake: 0, lastTick: 0, t: 0 };
const pointer = { x: 0, y: 0.2, nx: 0, ny: 0.2 };

async function init() {
  assets = await loadAssets();
  console.log('assets', assets.real);
  scene.add(assets.cabinet);
  monsters = new Monsters(assets.monster, assets.layout, scene);
  hammer = new Hammer(assets.hammer, assets.layout, camera);
  scene.add(hammer.object);
  aim = new AimMarker(assets.layout); scene.add(aim.object);
  ui.setLoading(false);
  ui.onPlay = startGame;
  ui.onRecord = record;
  if (AUTOPLAY) { startGame(); } else ui.showStart();
}

function startGame() {
  sfx.unlock();
  ui.hideScreens();
  monsters.reset();
  Object.assign(game, { running: true, score: 0, combo: 0, timeLeft: GAME_LEN, spawnT: 0.4, t: 0 });
  ui.setScore(0); ui.setCombo(0); ui.setTimer(1);
}
function endGame() {
  game.running = false; ui.setCombo(0);
  for (const m of monsters.list) if (m.state === 'up' || m.state === 'rising') { m.state = 'sinking'; m.t = 0; }
  sfx.jingle(true);
  if (CAPTURE) game.endAt = game.t + 0.7; else setTimeout(() => ui.showEnd(game.score), 700);
}

function difficulty() { const k = Math.min(1, game.score / 600) * 0.6 + Math.min(1, (GAME_LEN - game.timeLeft) / GAME_LEN) * 0.4; return k; }
function spawnLogic(dt) {
  game.spawnT -= dt;
  if (game.spawnT > 0) return;
  const d = difficulty();
  const free = monsters.freeSlots(); if (!free.length) { game.spawnT = 0.2; return; }
  const burst = Math.random() < 0.18 + d * 0.3 ? 2 + (Math.random() < d ? 1 : 0) : 1;
  for (let i = 0; i < burst && free.length; i++) {
    const m = free.splice(Math.floor(Math.random() * free.length), 1)[0];
    const r = Math.random();
    const type = r < 0.08 ? 'golden' : r < 0.08 + 0.06 + d * 0.1 ? 'bomb' : 'normal';
    m.spawn(type, THREE.MathUtils.lerp(1.5, 0.75, d) * (type === 'golden' ? 0.75 : 1));
    sfx.pop();
  }
  game.spawnT = THREE.MathUtils.lerp(1.0, 0.45, d) * (0.7 + Math.random() * 0.6);
}

function whackAt(headPos) {
  let best = null, bd = Infinity;
  const R = assets.layout.holeRadius * 1.6;
  // hit test against the hole centers (stable), and accept monsters that started sinking a moment ago
  const cands = monsters.list.filter((m) => m.state === 'up' || m.state === 'rising' || (m.state === 'sinking' && m.t < 0.12));
  for (const m of cands) {
    const hp = m.topWorld; const dx = hp.x - headPos.x, dz = hp.z - headPos.z; const d = Math.hypot(dx, dz);
    if (d < R && d < bd) { best = m; bd = d; }
  }
  const top = new THREE.Vector3(headPos.x, headPos.y, headPos.z);
  if (best) {
    const p = best.headWorld.clone();
    best.hit();
    if (best.type === 'bomb') {
      game.score = Math.max(0, game.score + (-25)); game.combo = 0; game.shake = 1.4;
      particles.burst(p, { count: 26, colors: [PALETTE.red, '#333', PALETTE.butter], speed: 2.4, up: 2 }); particles.text('BOOM', p); particles.ring(best.topWorld, { size: 0.9, color: 0xff6666 }); particles.puff(best.topWorld, { count: 8, size: 0.16 });
      sfx.boom(); sfx.wah();
      if (navigator.vibrate) try { navigator.vibrate([80, 40, 120]); } catch {}
    } else {
      game.combo += 1;
      const mult = Math.min(8, 1 + Math.floor(game.combo / 3));
      const pts = (best.type === 'golden' ? 30 : 10) * mult;
      game.score += pts;
      game.shake = 0.35 + Math.min(0.6, game.combo * 0.06);
      const colors = best.type === 'golden' ? [PALETTE.butter, '#fff', '#ffb347'] : [PALETTE.butter, '#ffffff', best.body ? '#' + best.body.color.getHexString() : PALETTE.coral];
      particles.burst(p, { count: best.type === 'golden' ? 24 : 14, colors });
      particles.flash(p); particles.ring(best.topWorld, { size: 0.55 });
      particles.puff(best.topWorld, { count: 5, size: 0.09 });
      particles.text(best.type === 'golden' ? '+3x' : ['BONK', 'POW', 'WHAM', 'OUCH'][Math.floor(Math.random() * 4)], p);
      sfx.bonk(game.combo);
      if (navigator.vibrate) try { navigator.vibrate(best.type === 'golden' ? [30, 20, 30] : 25); } catch {}
    }
    ui.setScore(game.score); ui.setCombo(game.combo >= 2 ? Math.min(8, 1 + Math.floor(game.combo / 3)) : 0);
  } else {
    // miss
    game.combo = 0; ui.setCombo(0);
    const y = assets.layout.holes[4].y - (top.z) * Math.tan((assets.layout.cabinetTilt || 0) * Math.PI / 180);
    particles.puff(new THREE.Vector3(top.x, y + 0.01, top.z), { count: 4, size: 0.07 });
    particles.ring(new THREE.Vector3(top.x, y + 0.005, top.z), { size: 0.22 });
    hammer.whiff(); sfx.whiff(); game.shake = Math.max(game.shake, 0.12);
    if (navigator.vibrate) try { navigator.vibrate(15); } catch {}
  }
}


// Number keys follow the numeric keypad: 7 8 9 is the back row, 1 2 3 the front row.
let numpadCache = null;
function numpadHoles() {
  if (numpadCache) return numpadCache;
  const rows = [...assets.layout.holes].sort((a, b) => b.z - a.z); // front (large z) first
  const out = [];
  for (let r = 0; r < 3; r++) out.push(...rows.slice(r * 3, r * 3 + 3).sort((a, b) => a.x - b.x));
  numpadCache = out;
  return out;
}

function swing() { if (hammer.trySwing()) sfx.whoosh(); }

// input
renderer.domElement.addEventListener('pointermove', (e) => { pointer.nx = (e.clientX / innerWidth) * 2 - 1; pointer.ny = -(e.clientY / innerHeight) * 2 + 1; });
renderer.domElement.addEventListener('pointerdown', (e) => {
  sfx.unlock();
  pointer.nx = (e.clientX / innerWidth) * 2 - 1; pointer.ny = -(e.clientY / innerHeight) * 2 + 1;
  if (!game.running) return;
  if (e.pointerType === 'touch') { hammer.setPointer(pointer.nx, pointer.ny); hammer.manualT = 0; hammer.update(0); hammer.pos.copy(hammer.aim); hammer.vel.set(0, 0, 0); }
  swing();
});
addEventListener('keydown', (e) => {
  if (!game.running) {
    if (e.key === ' ' || e.key === 'Enter') { startGame(); }
    return;
  }
  const n = parseInt(e.key); if (n >= 1 && n <= 9) { const h = numpadHoles()[n - 1]; hammer.moveTo(h.x, h.z, 0.6); swing(); }
  if (e.key === 'h') document.body.classList.toggle('cinema');
});

// record
let recorder = null;
function record() {
  if (recorder) return;
  const canvas = renderer.domElement; const stream = canvas.captureStream(60);
  const types = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  const chunks = []; recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 24e6 });
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  recorder.onstop = () => { const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'; const blob = new Blob(chunks, { type: mimeType || 'video/webm' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `whack.${ext}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 10000); recorder = null; ui.setRecording(false); };
  recorder.start(500); ui.setRecording(true);
  setTimeout(() => recorder && recorder.stop(), 20000);
}

// ---------- loop ----------
const clock = new THREE.Clock();
let autoT = 0;
function frame() {
  requestAnimationFrame(frame);
  tick(Math.min(0.05, clock.getDelta()));
}
function tick(dt) {
  game.t += dt;
  if (!assets) return;
  if (director) director.update(dt);
  if (game.endAt && game.t >= game.endAt) { game.endAt = 0; ui.showEnd(game.score); }
  // autoplay: whack the first up monster every second
  if (AUTOPLAY && game.auto !== false && game.running) {
    autoT += dt;
    if (autoT > 0.9) { autoT = 0; const up = monsters.hittable.filter((m) => m.type !== 'bomb'); if (up.length) { const m = up[0]; const p = m.headWorld; hammer.moveTo(p.x, p.z, 1.0); swing(); } }
  }
  // camera parallax + shake + idle sway
  pointer.x += (pointer.nx - pointer.x) * Math.min(1, dt * 4); pointer.y += (pointer.ny - pointer.y) * Math.min(1, dt * 4);
  const sway = new THREE.Vector3(Math.sin(game.t * 0.6) * 0.015, Math.sin(game.t * 0.8) * 0.01, 0);
  const shake = game.shake > 0 ? new THREE.Vector3((Math.random() - .5), (Math.random() - .5), (Math.random() - .5) * 0.3).multiplyScalar(0.035 * game.shake) : new THREE.Vector3();
  game.shake = Math.max(0, game.shake - dt * 4);
  camera.position.set(camBase.x + pointer.x * 0.12 + sway.x + shake.x, camBase.y + pointer.y * 0.06 + sway.y + shake.y, camBase.z + shake.z);
  camera.lookAt(camTarget.x + shake.x * 0.5, camTarget.y + shake.y * 0.5, camTarget.z);

  hammer.setPointer(pointer.nx, pointer.ny);
  hammer.update(dt);
  aim.update(dt, hammer.impactPoint, hammer.progress, hammer.swingT >= 0);
  if (game.running) {
    game.timeLeft -= dt; ui.setTimer(game.timeLeft / GAME_LEN);
    if (game.timeLeft < 5 && Math.floor(game.timeLeft) !== game.lastTick) { game.lastTick = Math.floor(game.timeLeft); sfx.tick(); }
    if (game.timeLeft <= 0) endGame();
    spawnLogic(dt);
  }
  if (!game.running && !recorder) { game.attractT = (game.attractT || 0) - dt; if (game.attractT < 0) { game.attractT = 1.6 + Math.random(); const f = monsters.freeSlots(); if (f.length) f[Math.floor(Math.random() * f.length)].spawn(Math.random() < 0.15 ? 'golden' : 'normal', 1.3); } }
  const events = monsters.update(dt, hammer.headWorld);
  for (const { m, e } of events) if (e === 'escaped' && game.running && m.type !== 'bomb') { game.combo = 0; ui.setCombo(0); }
  if (hammer.hitFrame && game.running) whackAt(hammer.impactPoint);
  // ambient motion
  for (const c of clouds.children) { if (c.userData.sp) { c.position.x = c.userData.x0 + Math.sin(game.t * c.userData.sp * 5) * 0.4; } else { c.position.y += Math.sin(game.t * 1.3 + c.userData.ph) * 0.0006; const s = 0.8 + 0.4 * Math.sin(game.t * 2 + c.userData.ph); c.scale.setScalar(s); } }
  particles.update(dt, camera);
  renderer.info.reset();
  if (MOBILE) renderer.render(scene, camera); else composer.render();
  if (params.has('stats') && (game.t | 0) !== frame.lastS) { frame.lastS = game.t | 0; console.log('calls', renderer.info.render.calls, 'tris', renderer.info.render.triangles); }
}
init().catch((e) => { console.error(e); document.getElementById('loading').textContent = 'error: ' + e.message; });
if (!CAPTURE) frame();
function debugHit(type) { const up = monsters.hittable.filter((m) => type ? m.type === type : m.type !== 'bomb'); if (!up.length) return false; const m = up[0]; const p = m.topWorld; hammer.moveTo(p.x, p.z, 2); hammer.swingT = hammer.swingDur; hammer.update(0.0001); whackAt(hammer.impactPoint); return true; }
let offCtx = null, captureT0 = 0;
function startCapture(seconds = 60) {
  offCtx = new OfflineAudioContext(2, 48000 * (seconds + 5), 48000);
  captureT0 = game.t;
  sfx.setContext(offCtx, () => Math.max(0, game.t - captureT0) + 0.05);
  startGame();
  // don't start on an empty board
  for (let i = 0; i < 2; i++) { const f = monsters.freeSlots(); if (f.length) f[Math.floor(Math.random() * f.length)].spawn('normal', 1.6); }
  director = new Director({ game, monsters, hammer, swing, layout: assets.layout, spawn: (t, up) => { const f = monsters.freeSlots(); if (f.length) { f[Math.floor(Math.random() * f.length)].spawn(t, up); sfx.pop(); } } });
  game.auto = false;
}
async function renderAudio(seconds) {
  const buf = await offCtx.startRendering();
  const n = Math.min(buf.length, Math.ceil(seconds * buf.sampleRate)), ch = buf.numberOfChannels, sr = buf.sampleRate;
  const out = new ArrayBuffer(44 + n * ch * 2), v = new DataView(out);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * ch * 2, true);
  const chans = []; for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
  let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, chans[c][i])); v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true); o += 2; }
  const bytes = new Uint8Array(out); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function debugSpawn(type = 'normal') { const f = monsters.freeSlots(); if (!f.length) return; f[Math.floor(Math.random() * f.length)].spawn(type, 5); }
window.__whack = { tick, startCapture, camera, camBase, camTarget, whackAt, get calls() { return renderer.info.render.calls; }, get tris() { return renderer.info.render.triangles; }, MOBILE, renderAudio, game, particles, scene, get monsters() { return monsters; }, get hammer() { return hammer; }, swing, startGame, debugHit, debugSpawn };
