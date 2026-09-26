// Cel-shaded material + inverted-hull outlines.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MOBILE } from './tier.js';

export const PALETTE = {
  cream: '#FFF3D6', coral: '#FF7A6B', mint: '#7FE0C3', sky: '#7CC7FF', lavender: '#C9A7FF',
  butter: '#FFD86B', navy: '#2B2E4A', wood: '#E0A96D', red: '#FF4B5C', white: '#FFFFFF',
};
export const MONSTER_COLORS = [PALETTE.coral, PALETTE.mint, PALETTE.sky, PALETTE.lavender];

let gradient;
export function gradientMap() {
  if (gradient) return gradient;
  // 3 bands: deep shadow, mid, lit. Values tuned so the shadow band stays colorful.
  const data = new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.colorSpace = THREE.NoColorSpace;
  gradient.needsUpdate = true;
  return gradient;
}

const rimColor = new THREE.Color('#fff4e0');
export function toonMaterial(opts = {}) {
  const m = new THREE.MeshToonMaterial({
    color: opts.color ?? PALETTE.cream,
    gradientMap: gradientMap(),
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  });
  m.userData.rim = opts.rim ?? 0.55;
  m.userData.spec = opts.spec ?? 0.35;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: m.userData.rim };
    shader.uniforms.uSpec = { value: m.userData.spec };
    shader.uniforms.uRimColor = { value: rimColor };
    shader.uniforms.uWarm = { value: new THREE.Color('#ffb59a') };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uRim; uniform float uSpec; uniform vec3 uRimColor; uniform vec3 uWarm;`)
      // warm up the shadow band a little (anime-style warm shadow tint)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        {
          vec3 V = normalize(vViewPosition);
          vec3 N = normalize(normal);
          float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
          // key light from the first directional light for the rim mask
          #if NUM_DIR_LIGHTS > 0
            vec3 L = normalize(directionalLights[0].direction);
            float ndl = clamp(dot(N, L), 0.0, 1.0);
            float rimMask = smoothstep(0.55, 0.9, fres) * smoothstep(0.1, 0.5, ndl);
            reflectedLight.directDiffuse += uRimColor * rimMask * uRim;
            // anime specular dot: hard-edged, small
            vec3 H = normalize(L + V);
            float ndh = clamp(dot(N, H), 0.0, 1.0);
            float sp = smoothstep(0.93, 0.96, ndh);
            reflectedLight.directSpecular += vec3(1.0) * sp * uSpec * ndl;
            // warm shadow tint where the toon step is dark
            float shade = 1.0 - smoothstep(0.0, 0.35, ndl);
            reflectedLight.indirectDiffuse *= mix(vec3(1.0), uWarm, shade * 0.35);
          #endif
        }`);
  };
  return m;
}

export const OUTLINE_COLOR = new THREE.Color(PALETTE.navy);
export function outlineMaterial(thickness = 0.014) {
  const m = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide, toneMapped: false });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uThick = { value: thickness };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uThick;')
      .replace('#include <project_vertex>', `
        // push along the vertex normal in object space after morph/skin (line stays ~constant in world units)
        transformed += normalize(normal) * uThick;
        #include <project_vertex>`);
    m.userData.shader = shader;
  };
  return m;
}

/** Adds an inverted-hull outline child to mesh (shares geometry, so morph targets follow). */
// mobile: only the big silhouettes cast shadows (shadow pass = one extra draw per caster)
const SHADOW_MOBILE = new Set(['CabBody', 'Playfield', 'Sign', 'Trim', 'Legs', 'Body', 'Wood', 'WoodDark', 'Rubber', 'Metal']);
const NO_OUTLINE_MOBILE = new Set(['Highlight', 'Pupil', 'Cheek', 'CabHi', 'CabPupil', 'CabCheek', 'Bulb', 'Star', 'ButtonRing', 'Tongue', 'Slit', 'Cup']);
export function addOutline(mesh, thickness = 0.014) {
  if (!mesh.isMesh || mesh.userData.isOutline) return null;
  if (MOBILE) {
    if (NO_OUTLINE_MOBILE.has(mesh.material?.name)) return null;
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
    if (mesh.geometry.boundingSphere.radius < 0.02) return null;
  }
  const o = new THREE.Mesh(mesh.geometry, outlineMaterial(thickness));
  o.userData.isOutline = true;
  o.renderOrder = -1;
  o.morphTargetInfluences = mesh.morphTargetInfluences;
  o.morphTargetDictionary = mesh.morphTargetDictionary;
  o.frustumCulled = false;
  o.castShadow = false; o.receiveShadow = false;
  mesh.add(o);
  return o;
}

/**
 * Mobile: merge every non-outline mesh of `root` by material name into one mesh per material (world-space
 * within root). Morph targets are merged too (zero deltas are added to meshes without morphs so a group
 * stays consistent); merged meshes get morphTargetDictionary from the first morphed source.
 * Returns a new Group with the same name; the original root is left untouched.
 */
export function mergeByMaterial(root) {
  root.updateMatrixWorld(true);
  const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const meshes = []; root.traverse((n) => { if (n.isMesh && !n.userData.isOutline) meshes.push(n); });
  const groups = new Map();
  for (const m of meshes) {
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    const key = mat?.name || m.uuid;
    const g = m.geometry.index ? m.geometry.clone() : m.geometry.clone();
    for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal') g.deleteAttribute(a);
    if (!g.attributes.normal) g.computeVertexNormals();
    for (const a of Object.keys(g.morphAttributes)) if (a !== 'position') delete g.morphAttributes[a];
    const M = new THREE.Matrix4().multiplyMatrices(rootInv, m.matrixWorld);
    g.applyMatrix4(M);
    if (g.morphAttributes.position) {
      const m3 = new THREE.Matrix3().setFromMatrix4(M), v = new THREE.Vector3();
      for (const attr of g.morphAttributes.position) {
        if (g.morphTargetsRelative) { for (let i = 0; i < attr.count; i++) { v.fromBufferAttribute(attr, i).applyMatrix3(m3); attr.setXYZ(i, v.x, v.y, v.z); } }
        else { for (let i = 0; i < attr.count; i++) { v.fromBufferAttribute(attr, i).applyMatrix4(M); attr.setXYZ(i, v.x, v.y, v.z); } }
      }
    }
    if (!groups.has(key)) groups.set(key, { mat, geos: [], dict: null, name: key });
    const grp = groups.get(key); grp.geos.push(g);
    if (!grp.dict && m.morphTargetDictionary) grp.dict = { ...m.morphTargetDictionary };
  }
  const out = new THREE.Group(); out.name = root.name;
  for (const grp of groups.values()) {
    const geos = grp.geos;
    const nMorph = Math.max(0, ...geos.map((g) => g.morphAttributes.position?.length || 0));
    const relative = geos.find((g) => g.morphAttributes.position)?.morphTargetsRelative ?? true;
    const allIndexed = geos.every((g) => g.index);
    const prepared = geos.map((g0) => {
      const g = allIndexed || !g0.index ? g0 : g0.toNonIndexed();
      if (nMorph) {
        g.morphTargetsRelative = relative;
        if (!g.morphAttributes.position) g.morphAttributes.position = [];
        const n = g.attributes.position.count;
        while (g.morphAttributes.position.length < nMorph) {
          // no deltas → zeros (relative) or a copy of the base positions (absolute)
          const a = relative ? new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3) : g.attributes.position.clone();
          g.morphAttributes.position.push(a);
        }
      }
      return g;
    });
    const merged = prepared.length === 1 ? prepared[0] : mergeGeometries(prepared, false);
    if (!merged) { console.warn('merge failed for', grp.name); continue; }
    merged.morphTargetsRelative = relative;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, grp.mat);
    mesh.name = grp.name;
    if (nMorph) { mesh.morphTargetDictionary = grp.dict || {}; mesh.morphTargetInfluences = new Array(nMorph).fill(0); }
    out.add(mesh);
  }
  return out;
}

/** Replace every material in a loaded subtree with toon versions (keeps base color) and add outlines. */
export function toonify(root, { thickness = 0.014, outline = true } = {}) {
  const meshes = [];
  root.traverse((n) => { if (n.isMesh && !n.userData.isOutline) meshes.push(n); });
  for (const mesh of meshes) {
    const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const name = src?.name || '';
    const color = name === 'Cup' ? new THREE.Color('#1b1d30') : src?.color ? src.color.clone() : new THREE.Color(PALETTE.cream);
    const dark = name === 'Cup' || name === 'Eye' || name === 'Mouth';
    const m = toonMaterial({ color, rim: dark ? 0.15 : 0.55, spec: name === 'Eye' ? 0.9 : name === 'Metal' ? 0.7 : 0.35, side: name === 'Cup' ? THREE.DoubleSide : THREE.FrontSide });
    m.name = name;
    if (src?.map) { m.map = src.map; }
    if (src?.emissive && src.emissive.getHex() !== 0) { m.emissive.copy(src.emissive); m.emissiveIntensity = src.emissiveIntensity ?? 1; }
    if (src?.transparent) { m.transparent = true; m.opacity = src.opacity; }
    mesh.material = m;
    mesh.castShadow = MOBILE ? SHADOW_MOBILE.has(name) : true; mesh.receiveShadow = true;
    if (outline && name !== 'Cup') addOutline(mesh, name === 'Eye' || name === 'Mouth' || name === 'Cheek' ? thickness * 0.5 : thickness);
  }
  return root;
}

/** Find the material named `name` in a subtree (excluding outlines). */
export function findMaterial(root, name) {
  let found = null;
  root.traverse((n) => { if (!found && n.isMesh && !n.userData.isOutline && n.material?.name === name) found = n.material; });
  return found;
}
