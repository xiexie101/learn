// Stars, dust puffs, impact rings, ripples and comic text sprites.
import * as THREE from 'three';
import { PALETTE } from './toon.js';

function starTexture() {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.translate(s / 2, s / 2);
  g.beginPath();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 22 : 56, a = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.closePath(); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 9; g.lineJoin = 'round'; g.strokeStyle = PALETTE.navy; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function puffTexture() {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.translate(s / 2, s / 2);
  g.beginPath();
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; g.arc(Math.cos(a) * 26, Math.sin(a) * 26, 26, 0, Math.PI * 2); }
  g.fillStyle = '#fff'; g.fill(); g.lineWidth = 7; g.strokeStyle = PALETTE.navy; g.stroke(); g.fillStyle = '#fff'; g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function ringTexture() {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.translate(s / 2, s / 2); g.beginPath(); g.arc(0, 0, 50, 0, Math.PI * 2); g.lineWidth = 14; g.strokeStyle = '#fff'; g.stroke();
  g.lineWidth = 4; g.strokeStyle = PALETTE.navy; g.beginPath(); g.arc(0, 0, 57, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, 43, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function textTexture(text, color) {
  const w = 512, h = 256, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.font = '700 150px Fredoka, "Arial Rounded MT Bold", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.translate(w / 2, h / 2); g.rotate(-0.12);
  g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = PALETTE.navy; g.strokeText(text, 0, 0);
  g.fillStyle = color; g.fillText(text, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group(); scene.add(this.group);
    this.starTex = starTexture(); this.puffTex = puffTexture(); this.ringTex = ringTexture();
    this.textTex = { BONK: textTexture('BONK!', PALETTE.butter), POW: textTexture('POW!', PALETTE.coral), WHAM: textTexture('WHAM!', PALETTE.mint), OUCH: textTexture('OUCH!', PALETTE.lavender), BOOM: textTexture('BOOM!', PALETTE.red), '+3x': textTexture('x3!', PALETTE.butter) };
    this.stars = []; this.sprites = [];
    // instanced stars
    this.maxStars = 200;
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({ map: this.starTex, transparent: true, depthWrite: false, alphaTest: 0.1, toneMapped: false });
    this.starMesh = new THREE.InstancedMesh(geo, mat, this.maxStars);
    this.starMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.starMesh.frustumCulled = false;
    this.starColors = new Float32Array(this.maxStars * 3);
    this.starMesh.instanceColor = new THREE.InstancedBufferAttribute(this.starColors, 3);
    this.group.add(this.starMesh);
    this.pool = []; for (let i = 0; i < this.maxStars; i++) this.pool.push({ alive: false, i });
    this.dummy = new THREE.Object3D();
    this.camera = null;
    this.hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < this.maxStars; i++) this.starMesh.setMatrixAt(i, this.hidden);
  }

  burst(pos, { count = 14, colors = [PALETTE.butter, '#ffffff', PALETTE.coral], speed = 1.5, size = 0.05, up = 1.2 } = {}) {
    for (let k = 0; k < count; k++) {
      const p = this.pool.find((s) => !s.alive); if (!p) break;
      p.alive = true; p.t = 0; p.life = 0.55 + Math.random() * 0.4;
      p.pos = pos.clone();
      const a = Math.random() * Math.PI * 2, r = speed * (0.4 + Math.random() * 0.8);
      p.vel = new THREE.Vector3(Math.cos(a) * r, up * (0.6 + Math.random()), Math.sin(a) * r * 0.6 + 0.3);
      p.rot = Math.random() * Math.PI * 2; p.spin = (Math.random() - 0.5) * 12; p.size = size * (0.6 + Math.random() * 0.8);
      const c = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
      this.starColors.set([c.r, c.g, c.b], p.i * 3);
    }
    this.starMesh.instanceColor.needsUpdate = true;
  }

  sprite(tex, pos, { size = 0.3, life = 0.6, rise = 0.25, spin = 0, kind = 'pop', color } = {}) {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, color: color ?? 0xffffff });
    const s = new THREE.Sprite(m); s.position.copy(pos); s.scale.setScalar(0.0001);
    s.userData = { t: 0, life, size, rise, spin, kind, aspect: tex.image.width / tex.image.height, y0: pos.y };
    this.group.add(s); this.sprites.push(s); return s;
  }
  text(kind, pos) { const t = this.textTex[kind] || this.textTex.BONK; return this.sprite(t, pos.clone().add(new THREE.Vector3((Math.random() - .5) * .1, 0.22, 0.05)), { size: 0.2, life: 0.75, rise: 0.2, kind: 'text' }); }
  puff(pos, { size = 0.09, count = 5 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random();
      const p = pos.clone().add(new THREE.Vector3(Math.cos(a) * 0.06, 0.02, Math.sin(a) * 0.05 + 0.03));
      const s = this.sprite(this.puffTex, p, { size: size * (0.6 + Math.random() * 0.6), life: 0.45 + Math.random() * 0.2, rise: 0.1, spin: (Math.random() - .5) * 3, kind: 'puff' });
      s.userData.vx = Math.cos(a) * 0.35; s.userData.vz = Math.sin(a) * 0.25;
    }
  }
  ring(pos, { size = 0.4, life = 0.35, color } = {}) { return this.sprite(this.ringTex, pos.clone().add(new THREE.Vector3(0, 0.02, 0.02)), { size, life, rise: 0, kind: 'ring', color }); }
  flash(pos) { return this.sprite(this.starTex, pos.clone().add(new THREE.Vector3(0, 0.06, 0.06)), { size: 0.34, life: 0.18, rise: 0, kind: 'flash', spin: 2 }); }

  update(dt, camera) {
    // stars
    let any = false;
    for (const p of this.pool) {
      if (!p.alive) continue; any = true;
      p.t += dt; if (p.t >= p.life) { p.alive = false; this.starMesh.setMatrixAt(p.i, this.hidden); continue; }
      p.vel.y -= 4.5 * dt; p.vel.multiplyScalar(1 - 1.5 * dt);
      p.pos.addScaledVector(p.vel, dt); p.rot += p.spin * dt;
      const k = p.t / p.life, sc = p.size * (k < 0.15 ? easeOutBack(k / 0.15) : 1 - Math.pow(Math.max(0, (k - 0.6) / 0.4), 2));
      this.dummy.position.copy(p.pos); this.dummy.quaternion.copy(camera.quaternion); this.dummy.rotateZ(p.rot); this.dummy.scale.setScalar(Math.max(sc, 0.0001)); this.dummy.updateMatrix();
      this.starMesh.setMatrixAt(p.i, this.dummy.matrix);
    }
    if (any) this.starMesh.instanceMatrix.needsUpdate = true;
    // sprites
    for (let i = this.sprites.length - 1; i >= 0; i--) {
      const s = this.sprites[i], u = s.userData; u.t += dt;
      const k = u.t / u.life;
      if (k >= 1) { this.group.remove(s); s.material.dispose(); this.sprites.splice(i, 1); continue; }
      let sc = u.size, op = 1;
      if (u.kind === 'text') { sc = u.size * (k < 0.2 ? easeOutBack(k / 0.2) : 1 + 0.08 * Math.sin(k * 20)); op = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; s.position.y = u.y0 + easeOut(k) * u.rise; }
      else if (u.kind === 'puff') { sc = u.size * (0.4 + easeOut(k) * 0.9); op = 1 - k * k; s.position.y = u.y0 + easeOut(k) * u.rise; s.position.x += u.vx * dt * (1 - k); s.position.z += u.vz * dt * (1 - k); }
      else if (u.kind === 'ring') { sc = u.size * (0.2 + easeOut(k) * 1.0); op = 1 - k; }
      else if (u.kind === 'flash') { sc = u.size * (k < 0.4 ? easeOutBack(k / 0.4) : 1); op = 1 - k; }
      s.material.rotation += u.spin * dt;
      s.material.opacity = op; s.scale.set(sc * u.aspect, sc, 1);
    }
  }
}
