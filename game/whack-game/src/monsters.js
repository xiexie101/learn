// Monster slots: state machine, morph-target expressions, squash & stretch.
import * as THREE from 'three';
import { cloneModel } from './assets.js';
import { toonMaterial, addOutline, findMaterial, MONSTER_COLORS, PALETTE } from './toon.js';

const easeOutBack = (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeInBack = (t) => { const c1 = 1.7, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; };
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = THREE.MathUtils.lerp;

export const TYPES = { normal: { points: 10 }, golden: { points: 30 }, bomb: { points: -25 } };

export class Monster {
  constructor(proto, hole, layout, tilt) {
    this.layout = layout;
    this.anchor = new THREE.Group();
    this.anchor.position.set(hole.x, hole.y, hole.z);
    this.anchor.rotation.x = tilt; // rise along the tilted playfield normal
    this.lift = new THREE.Group(); this.anchor.add(this.lift);
    this.model = cloneModel(proto); this.lift.add(this.model);
    this.H = layout.monsterHeight;
    this.UP = -this.H * 0.3; // 'up' pose: 30% of the body stays inside the cup
    this.body = findMaterial(this.model, 'Body');
    this.morphMeshes = []; this.model.traverse((n) => { if (n.isMesh && n.morphTargetDictionary && !n.userData.isOutline) this.morphMeshes.push(n); });
    this.xeyes = []; this.tongue = null;
    this.model.traverse((n) => { if (/xeye/i.test(n.name)) this.xeyes.push(n); if (/tongue/i.test(n.name)) this.tongue = n; });
    // bomb fuse (only shown for bombs)
    this.fuse = new THREE.Group();
    const fm = toonMaterial({ color: '#8a6d4b' }); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), fm); f.position.y = this.H + 0.02; f.rotation.z = 0.3; this.fuse.add(f);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), toonMaterial({ color: PALETTE.red, emissive: PALETTE.red, emissiveIntensity: 1.6 })); spark.position.set(-0.01, this.H + 0.055, 0); this.fuse.add(spark); this.spark = spark;
    this.fuse.visible = false; this.lift.add(this.fuse);
    this.state = 'hidden'; this.t = 0; this.upTime = 1.2; this.type = 'normal';
    this.morph = { surprised: 0, hit: 0, happy: 0 }; this.morphTarget = { surprised: 0, hit: 0, happy: 0 };
    this.blinkT = 1 + Math.random() * 2; this.bobPhase = Math.random() * 6;
    this.scaleV = new THREE.Vector3(1, 1, 1);
    this.setLift(-this.H - 0.12);
    this.model.visible = false;
  }
  setLift(y) { this.lift.position.y = y; }
  get headWorld() { return this.lift.localToWorld(new THREE.Vector3(0, this.H * 0.55, 0)); }
  get topWorld() { return this.anchor.localToWorld(new THREE.Vector3(0, 0, 0)); }

  spawn(type = 'normal', upTime = 1.2) {
    this.type = type; this.upTime = upTime; this.state = 'rising'; this.t = 0; this.model.visible = true;
    const color = type === 'golden' ? PALETTE.butter : type === 'bomb' ? PALETTE.navy : MONSTER_COLORS[Math.floor(Math.random() * MONSTER_COLORS.length)];
    if (this.body) { this.body.color.set(color); this.body.emissive.set(type === 'golden' ? '#5a4200' : '#000000'); }
    this.fuse.visible = type === 'bomb';
    this.setMorphTargets({ surprised: 0.0, hit: 0, happy: 0 });
    this.setXEyes(false);
  }
  setMorphTargets(m) { Object.assign(this.morphTarget, m); }
  setXEyes(on) { for (const x of this.xeyes) x.visible = on; if (this.tongue) this.tongue.visible = on; }
  applyMorphs() {
    for (const mesh of this.morphMeshes) {
      const d = mesh.morphTargetDictionary, inf = mesh.morphTargetInfluences;
      for (const k in this.morph) if (d[k] !== undefined) inf[d[k]] = this.morph[k];
    }
  }
  hit() {
    if (this.state !== 'up' && this.state !== 'rising' && this.state !== 'sinking') return false;
    this.state = 'hit'; this.t = 0;
    this.setMorphTargets({ hit: 1, surprised: 0, happy: 0 }); this.morph.hit = 1; this.setXEyes(true);
    return true;
  }
  /** hammer hovering near → surprised face */
  scare(on) { if (this.state === 'up') this.morphTarget.surprised = on ? 1 : 0; }

  update(dt, hammerHead) {
    if (this.state === 'hidden') return null;
    this.t += dt;
    let ev = null;
    const H = this.H;
    let sx = 1, sy = 1, y = 0;
    if (this.state === 'rising') {
      const k = Math.min(1, this.t / 0.18);
      y = lerp(-H - 0.12, this.UP, easeOutBack(k));
      sy = 1 + 0.35 * Math.sin(k * Math.PI); sx = 1 / Math.sqrt(sy);
      if (k >= 1) { this.state = 'up'; this.t = 0; ev = 'up'; }
    } else if (this.state === 'up') {
      const b = Math.sin(this.t * 6 + this.bobPhase);
      y = this.UP + 0.008 * b; sy = 1 + 0.03 * b; sx = 1 - 0.015 * b;
      // blink / happy
      this.blinkT -= dt;
      if (this.blinkT < 0) { this.blinkT = 1.2 + Math.random() * 2.2; this.blinkAnim = 0.22; }
      if (this.blinkAnim > 0) { this.blinkAnim -= dt; this.morphTarget.happy = this.blinkAnim > 0.06 ? 1 : 0; } else this.morphTarget.happy = 0;
      // scared by hammer hovering
      if (hammerHead) { const d = hammerHead.distanceTo(this.headWorld); this.morphTarget.surprised = d < 0.22 ? 1 : 0; }
      if (this.t > this.upTime) { this.state = 'sinking'; this.t = 0; }
    } else if (this.state === 'sinking') {
      const k = Math.min(1, this.t / 0.25);
      y = lerp(this.UP, -H - 0.12, easeInBack(k));
      sy = 1 - 0.15 * Math.sin(k * Math.PI); sx = 1 / Math.sqrt(sy);
      if (k >= 1) { this.state = 'hidden'; this.model.visible = false; this.fuse.visible = false; ev = 'escaped'; }
    } else if (this.state === 'hit') {
      // flatten, then drop
      if (this.t < 0.12) { const k = this.t / 0.12; sy = lerp(1, 0.4, easeOut(k)); sx = lerp(1, 1.4, easeOut(k)); y = this.UP - 0.02 * k; }
      else if (this.t < 0.42) { const k = (this.t - 0.12) / 0.3; sy = lerp(0.4, 0.6, k); sx = lerp(1.4, 1.1, k); y = lerp(this.UP - 0.02, -H - 0.12, k * k); }
      else { this.state = 'hidden'; this.model.visible = false; this.fuse.visible = false; this.setXEyes(false); this.morph.hit = 0; this.morphTarget.hit = 0; }
    }
    this.setLift(y);
    this.model.scale.set(sx, sy, sx);
    // morph smoothing
    for (const k in this.morph) {
      const rate = k === 'hit' ? 30 : 14;
      this.morph[k] += (this.morphTarget[k] - this.morph[k]) * Math.min(1, dt * rate);
    }
    this.applyMorphs();
    if (this.fuse.visible) { const s = 1 + 0.35 * Math.sin(this.t * 25); this.spark.scale.setScalar(s); }
    return ev;
  }
}

export class Monsters {
  constructor(proto, layout, scene) {
    this.layout = layout;
    const tilt = -(layout.cabinetTilt || 0) * Math.PI / 180;
    this.list = layout.holes.map((h) => new Monster(proto, h, layout, tilt));
    this.group = new THREE.Group();
    for (const m of this.list) this.group.add(m.anchor);
    scene.add(this.group);
  }
  get active() { return this.list.filter((m) => m.state !== 'hidden'); }
  get hittable() { return this.list.filter((m) => m.state === 'up' || m.state === 'rising'); }
  freeSlots() { return this.list.filter((m) => m.state === 'hidden'); }
  reset() { for (const m of this.list) { m.state = 'hidden'; m.model.visible = false; m.fuse.visible = false; m.setXEyes(false); m.morph.hit = m.morphTarget.hit = 0; } }
  update(dt, hammerHead) {
    const events = [];
    for (const m of this.list) { const e = m.update(dt, hammerHead); if (e) events.push({ m, e }); }
    return events;
  }
}
