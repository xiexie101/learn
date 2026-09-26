// Loads cabinet/monster/hammer GLBs when present, otherwise builds placeholders with the same contract.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toonify, toonMaterial, addOutline, mergeByMaterial, PALETTE } from './toon.js';
import { MOBILE } from './tier.js';

const ASSETS = './assets/';

export const DEFAULT_LAYOUT = (() => {
  const tilt = 12, holes = [], sx = 0.34, sz = 0.27, topY = 0.55;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x = (c - 1) * sx, z = (r - 1) * sz;
    holes.push({ x, y: topY - z * Math.tan(tilt * Math.PI / 180), z });
  }
  return { holes, holeRadius: 0.11, cabinetTilt: tilt, monsterHeight: 0.30, hammerLength: 0.45 };
})();

async function exists(url) {
  try { const r = await fetch(url, { method: 'HEAD', cache: 'no-store' }); return r.ok; } catch { return false; }
}

const loader = new GLTFLoader();
function loadGLB(url) {
  return new Promise((res, rej) => loader.load(url, (g) => res(g.scene), undefined, rej));
}

function fixMorphNames(root) {
  // Ensure morphTargetDictionary exists even if the exporter only wrote names into geometry.userData
  root.traverse((n) => {
    if (n.isMesh && n.geometry.morphAttributes.position && !n.morphTargetDictionary) {
      n.updateMorphTargets();
    }
  });
}

// ---------- placeholders ----------
function roundedBox(w, h, d, r = 0.04, seg = 3) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y); shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: seg, curveSegments: 8 });
  g.translate(0, 0, -d / 2);
  return g;
}

function placeholderCabinet(layout) {
  const root = new THREE.Group(); root.name = 'Cabinet';
  const tilt = layout.cabinetTilt * Math.PI / 180;
  // body
  const body = new THREE.Mesh(roundedBox(1.25, 0.5, 0.95, 0.06), toonMaterial({ color: PALETTE.sky }));
  body.material.name = 'Wood';
  body.position.set(0, 0.25, 0); body.rotation.x = Math.PI / 2; // extrude along y
  root.add(body); addOutline(body, 0.02);
  // playfield: tilted slab with holes (shape with holes)
  const w = 1.2, d = 0.86;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -d / 2); shape.lineTo(w / 2, -d / 2); shape.lineTo(w / 2, d / 2); shape.lineTo(-w / 2, d / 2); shape.closePath();
  for (const h of layout.holes) {
    const p = new THREE.Path();
    // local coords on the tilted plane: x, and distance along plane = z / cos(tilt)
    p.absarc(h.x, -h.z / Math.cos(tilt), layout.holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(p);
  }
  const slabG = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 24 });
  const slab = new THREE.Mesh(slabG, toonMaterial({ color: PALETTE.cream }));
  slab.material.name = 'Wood';
  slab.rotation.x = -Math.PI / 2 - tilt; // face up, tilted toward +Z
  slab.position.set(0, 0.55 - 0.06, 0);
  root.add(slab); addOutline(slab, 0.012);
  // dark cups + rims
  const cupMat = toonMaterial({ color: '#1d1f33', rim: 0 }); cupMat.name = 'Cup';
  const rimMat = toonMaterial({ color: PALETTE.coral }); rimMat.name = 'Rubber';
  const planeN = new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), planeN);
  for (const h of layout.holes) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(layout.holeRadius, layout.holeRadius * 0.9, 0.3, 24, 1, true), cupMat);
    cup.position.set(h.x, h.y - 0.15, h.z); cup.quaternion.copy(q); root.add(cup);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(layout.holeRadius + 0.012, 0.018, 12, 32), rimMat);
    rim.position.set(h.x, h.y + 0.005, h.z); rim.quaternion.copy(q); rim.rotateX(Math.PI / 2); root.add(rim); addOutline(rim, 0.008);
  }
  // marquee sign
  const sign = new THREE.Mesh(roundedBox(0.9, 0.16, 0.06, 0.03), toonMaterial({ color: PALETTE.butter }));
  sign.material.name = 'Sign'; sign.position.set(0, 0.2, 0.5); root.add(sign); addOutline(sign, 0.012);
  // little feet
  const footMat = toonMaterial({ color: PALETTE.navy, rim: 0.2 }); footMat.name = 'Metal';
  for (const [x, z] of [[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.35], [0.5, 0.35]]) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.06, 16), footMat); f.position.set(x, 0.03, z); root.add(f);
  }
  return root;
}

function placeholderMonster(layout) {
  const root = new THREE.Group(); root.name = 'Monster';
  const H = layout.monsterHeight;
  // body: squashed sphere with morph targets
  const g = new THREE.SphereGeometry(0.13, 32, 24);
  g.translate(0, H * 0.5, 0);
  const pos = g.attributes.position; const n = pos.count;
  const mk = (fn) => { const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const [X, Y, Z] = fn(x, y, z); a[i * 3] = X; a[i * 3 + 1] = Y; a[i * 3 + 2] = Z; } return new THREE.Float32BufferAttribute(a, 3); };
  g.morphAttributes.position = [
    mk((x, y, z) => [x * 1.08, y * 1.05, z * 1.08]),                   // surprised: puff up
    mk((x, y, z) => [x * 1.25, (y - H * 0.5) * 0.55 + H * 0.5 * 0.7, z * 1.25]), // hit: flatten
    mk((x, y, z) => [x * 1.02, y * 0.97, z * 1.02]),                   // happy: slight relax
  ];
  const body = new THREE.Mesh(g, toonMaterial({ color: PALETTE.coral }));
  body.material.name = 'Body'; body.name = 'Body';
  body.morphTargetDictionary = { surprised: 0, hit: 1, happy: 2 }; body.morphTargetInfluences = [0, 0, 0];
  root.add(body); addOutline(body, 0.012);
  // ears
  const earMat = body.material;
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), earMat); e.position.set(s * 0.09, H * 0.5 + 0.11, 0); e.scale.set(0.8, 1.2, 0.6); root.add(e); addOutline(e, 0.01); }
  // eyes (white + pupil) with morphs: surprised = bigger, happy = closed
  const eyeMat = toonMaterial({ color: '#ffffff', rim: 0 }); eyeMat.name = 'EyeWhite';
  const pupilMat = toonMaterial({ color: PALETTE.navy, rim: 0, spec: 1.2 }); pupilMat.name = 'Eye';
  const mouthMat = toonMaterial({ color: '#5a2a3a', rim: 0 }); mouthMat.name = 'Mouth';
  const cheekMat = toonMaterial({ color: '#ff9aa8', rim: 0 }); cheekMat.name = 'Cheek';
  for (const s of [-1, 1]) {
    const eg = new THREE.SphereGeometry(0.028, 16, 12);
    const ep = eg.attributes.position, en = ep.count;
    const mkE = (sx, sy) => { const a = new Float32Array(en * 3); for (let i = 0; i < en; i++) { a[i * 3] = ep.getX(i) * sx; a[i * 3 + 1] = ep.getY(i) * sy; a[i * 3 + 2] = ep.getZ(i) * sx; } return new THREE.Float32BufferAttribute(a, 3); };
    eg.morphAttributes.position = [mkE(1.35, 1.35), mkE(1.0, 0.15), mkE(1.1, 0.12)];
    const eye = new THREE.Mesh(eg, eyeMat); eye.morphTargetDictionary = { surprised: 0, hit: 1, happy: 2 }; eye.morphTargetInfluences = [0, 0, 0];
    eye.position.set(s * 0.05, H * 0.5 + 0.03, 0.11); root.add(eye); addOutline(eye, 0.006);
    const pg = new THREE.SphereGeometry(0.014, 12, 10);
    const pp = pg.attributes.position, pn = pp.count;
    const mkP = (sx, sy) => { const a = new Float32Array(pn * 3); for (let i = 0; i < pn; i++) { a[i * 3] = pp.getX(i) * sx; a[i * 3 + 1] = pp.getY(i) * sy; a[i * 3 + 2] = pp.getZ(i) * sx; } return new THREE.Float32BufferAttribute(a, 3); };
    pg.morphAttributes.position = [mkP(1.5, 1.5), mkP(0.01, 0.01), mkP(0.01, 0.01)];
    const pupil = new THREE.Mesh(pg, pupilMat); pupil.morphTargetDictionary = { surprised: 0, hit: 1, happy: 2 }; pupil.morphTargetInfluences = [0, 0, 0];
    pupil.position.set(s * 0.05, H * 0.5 + 0.03, 0.135); root.add(pupil);
    // X eyes for hit, hidden by default
    const xg = new THREE.Group(); xg.name = 'XEye';
    for (const a of [Math.PI / 4, -Math.PI / 4]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.01), pupilMat); bar.rotation.z = a; xg.add(bar); }
    xg.position.set(s * 0.05, H * 0.5 + 0.03, 0.13); xg.visible = false; root.add(xg);
    const ch = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), cheekMat); ch.scale.set(1, 0.7, 0.4); ch.position.set(s * 0.085, H * 0.5 - 0.005, 0.1); root.add(ch);
  }
  // mouth: small smile (torus arc) + tongue for hit
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.007, 8, 16, Math.PI), mouthMat);
  mouth.rotation.z = Math.PI; mouth.position.set(0, H * 0.5 - 0.02, 0.125); mouth.name = 'Mouth'; root.add(mouth);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), cheekMat); tongue.scale.set(1, 1.3, 0.6); tongue.position.set(0, H * 0.5 - 0.04, 0.125); tongue.name = 'Tongue'; tongue.visible = false; root.add(tongue);
  return root;
}

function placeholderHammer(layout) {
  const root = new THREE.Group(); root.name = 'Hammer';
  const L = layout.hammerLength;
  const wood = toonMaterial({ color: PALETTE.wood }); wood.name = 'Wood';
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, L * 0.78, 16), wood);
  handle.position.y = L * 0.39; root.add(handle); addOutline(handle, 0.01);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 16), toonMaterial({ color: PALETTE.navy })); grip.position.y = 0.03; root.add(grip);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.22, 24), toonMaterial({ color: PALETTE.coral }));
  head.material.name = 'Rubber'; head.rotation.z = Math.PI / 2; head.position.y = L * 0.85; root.add(head); addOutline(head, 0.014);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 24), toonMaterial({ color: PALETTE.butter })); band.rotation.z = Math.PI / 2; band.position.y = L * 0.85; root.add(band); addOutline(band, 0.012);
  return root;
}

// ---------- public ----------
export async function loadAssets(onProgress = () => {}) {
  const [hasLayout, hasCab, hasMon, hasHam] = await Promise.all(['layout.json', 'cabinet.glb', 'monster.glb', 'hammer.glb'].map((f) => exists(ASSETS + f)));
  let layout = DEFAULT_LAYOUT;
  if (hasLayout) { try { layout = { ...DEFAULT_LAYOUT, ...(await (await fetch(ASSETS + 'layout.json', { cache: 'no-store' })).json()) }; } catch (e) { console.warn('layout.json unreadable', e); } }
  onProgress('layout');
  const out = { layout, real: { cabinet: hasCab, monster: hasMon, hammer: hasHam } };
  const tryLoad = async (flag, file, fallback, thickness) => {
    if (flag) {
      try { let s = await loadGLB(ASSETS + file); fixMorphNames(s); if (MOBILE) s = mergeByMaterial(s); toonify(s, { thickness }); return s; }
      catch (e) { console.warn('failed to load', file, e); }
    }
    return fallback(layout);
  };
  out.cabinet = await tryLoad(hasCab, 'cabinet.glb', placeholderCabinet, 0.009); onProgress('cabinet');
  out.monster = await tryLoad(hasMon, 'monster.glb', placeholderMonster, 0.0075); onProgress('monster');
  out.hammer = await tryLoad(hasHam, 'hammer.glb', placeholderHammer, 0.006); onProgress('hammer');
  return out;
}

/** Deep-clone a toonified prototype; gives every non-outline mesh its own material clone so colors/morphs are independent. */
export function cloneModel(proto) {
  const c = proto.clone(true);
  const pairs = [];
  c.traverse((n) => {
    if (n.isMesh) {
      if (n.morphTargetInfluences) n.morphTargetInfluences = n.morphTargetInfluences.slice();
      if (!n.userData.isOutline) { n.material = n.material.clone(); n.material.name = n.material.name; }
    }
  });
  // outline clones must share the influences array of their parent mesh
  c.traverse((n) => { if (n.isMesh && n.userData.isOutline && n.parent?.isMesh) { n.morphTargetInfluences = n.parent.morphTargetInfluences; n.morphTargetDictionary = n.parent.morphTargetDictionary; } });
  return c;
}
