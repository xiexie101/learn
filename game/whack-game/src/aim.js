// Aim marker under the hammer: a soft drop shadow plus a crisp ring that tightens as the hammer comes down.
import * as THREE from 'three';
import { PALETTE } from './toon.js';

function shadowTexture() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(43,46,74,0.55)'); grd.addColorStop(0.55, 'rgba(43,46,74,0.35)'); grd.addColorStop(1, 'rgba(43,46,74,0)');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function ringTexture() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.translate(s / 2, s / 2);
  g.lineWidth = 16; g.strokeStyle = PALETTE.navy; g.beginPath(); g.arc(0, 0, 104, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 104, 0, Math.PI * 2); g.stroke();
  // four little ticks
  g.lineWidth = 10; g.strokeStyle = PALETTE.navy; g.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.moveTo(Math.cos(a) * 78, Math.sin(a) * 78); g.lineTo(Math.cos(a) * 60, Math.sin(a) * 60); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class AimMarker {
  constructor(layout) {
    this.object = new THREE.Group();
    this.n = layout.holeNormal ? new THREE.Vector3(...layout.holeNormal).normalize() : new THREE.Vector3(0, 1, 0);
    this.R = layout.holeRadius;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.n);
    const geo = new THREE.PlaneGeometry(1, 1);
    this.shadow = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, toneMapped: false }));
    this.ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, depthWrite: false, depthTest: false, toneMapped: false, opacity: 0.9 }));
    this.shadow.quaternion.copy(q); this.ring.quaternion.copy(q);
    this.shadow.renderOrder = 2; this.ring.renderOrder = 50;
    this.object.add(this.shadow, this.ring);
    this.t = 0;
  }
  /** point = impact point on the playfield, prog = swing progress 0..1 (1 at impact) */
  update(dt, point, prog, swinging) {
    this.t += dt;
    this.object.position.copy(point).addScaledVector(this.n, 0.006);
    const d = this.R * 2.6 * (1 - 0.25 * prog);          // shadow diameter
    this.shadow.scale.set(d, d, 1);
    this.shadow.material.opacity = 0.75 + 0.25 * prog;
    const r = this.R * 2.9 * (1 - 0.35 * prog) + Math.sin(this.t * 5) * 0.006;  // ring diameter, gentle breathing
    this.ring.scale.set(r, r, 1);
    this.ring.rotation.z = this.t * 0.6;
    this.ring.material.opacity = swinging ? 1 : 0.85;
  }
}
