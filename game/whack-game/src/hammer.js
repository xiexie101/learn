// 3D hammer that follows the pointer and swings on click.
// Model space: handle along +Y (origin = handle bottom, head center at +Lh), head cylinder axis along X.
// Impact pose: the striking face points into the playfield (head axis ≈ -normal), the handle is nearly parallel
// to the surface (tilted `lift` rad up toward the hand). The hand (pivot) is up/right/front of the aim point and
// the whole hammer rotates around the hand on an axis perpendicular to the handle+strike plane.
import * as THREE from 'three';

const easeInQuart = (t) => t * t * t * t;
const easeOutBack = (t) => { const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

export class Hammer {
  constructor(model, layout, camera) {
    this.model = model; this.layout = layout; this.camera = camera;
    this.pivot = new THREE.Group();
    this.swing = new THREE.Group();
    this.swing.add(model);
    this.pivot.add(this.swing);
    this.Lh = layout.hammerLength * 0.85; // handle bottom → head center
    this.headR = 0.068;                    // head cylinder radius (striking face offset from the surface)
    const n = layout.holeNormal ? new THREE.Vector3(...layout.holeNormal).normalize() : new THREE.Vector3(0, 1, 0);
    this.n = n;
    // hand side: right, a bit up, toward the camera (projected onto the playfield plane)
    const s = new THREE.Vector3(0.62, 0.0, 0.78);
    const sPerp = s.clone().addScaledVector(n, -s.dot(n)).normalize();
    const lift = 0.42; // handle angle above the surface at impact (~24°)
    // H: handle direction (hand → head) at impact, A: head axis (striking face) at impact
    this.H = sPerp.clone().multiplyScalar(Math.cos(lift)).addScaledVector(n, Math.sin(lift)).negate();
    this.A = n.clone().multiplyScalar(Math.cos(lift)).addScaledVector(sPerp, -Math.sin(lift)).negate();
    // qAlign: model Y → H, model X → A
    const Z = new THREE.Vector3().crossVectors(this.A, this.H).normalize();
    this.qAlign = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(this.A, this.H, Z));
    // swing axis: perpendicular to handle+strike plane; sign chosen so restAngle raises the head
    this.axis = Z.clone();
    const test = this.H.clone().applyAxisAngle(this.axis, 1);
    if (test.dot(n) < this.H.dot(n)) this.axis.negate();
    this.restAngle = 0.85; this.impactAngle = 0;
    this.qTmp = new THREE.Quaternion();
    this.aim = new THREE.Vector3(0, layout.holes[4].y, 0.2); // point on the playfield
    this.pos = this.aim.clone(); this.vel = new THREE.Vector3();
    this.swingT = -1; this.swingDur = 0.19; this.hitFrame = false; this.hitDone = false;
    this.wobble = 0; this.headWorld = new THREE.Vector3(); this.impactPoint = new THREE.Vector3();
    this.ray = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -layout.holes[4].y);
    this.ndc = new THREE.Vector2(0, 0.2);
    this.headLocal = new THREE.Vector3(0, this.Lh, 0);
    this.tmpV = new THREE.Vector3();
    this.manualT = 0; // seconds during which the pointer is ignored (autoplay / keys)
    this.progress = 0;
  }
  get object() { return this.pivot; }

  setPointer(nx, ny) { this.ndc.set(nx, ny); }
  moveTo(x, z, hold = 0.8) { this.aim.set(x, this.aim.y, z); this.pos.copy(this.aim); this.vel.set(0, 0, 0); this.manualT = hold; }

  /** returns true when a new swing started */
  trySwing() {
    if (this.swingT >= 0 && this.swingT < this.swingDur + 0.06) return false;
    this.swingT = 0; this.hitFrame = false; this.hitDone = false; return true;
  }
  whiff() { this.wobble = 1; }

  update(dt) {
    const p = this.tmpV;
    if (this.manualT > 0) this.manualT -= dt;
    else { this.ray.setFromCamera(this.ndc, this.camera); if (this.ray.ray.intersectPlane(this.plane, p)) this.aim.set(THREE.MathUtils.clamp(p.x, -0.7, 0.7), -this.plane.constant, THREE.MathUtils.clamp(p.z, -0.5, 0.6)); }
    // springy follow of the aim point
    const k = this.k ?? 260, dmp = this.dmp ?? 24;
    const acc = this.aim.clone().sub(this.pos).multiplyScalar(k).addScaledVector(this.vel, -dmp);
    this.vel.addScaledVector(acc, dt); this.pos.addScaledVector(this.vel, dt);
    // playfield height under the aim point (tilted)
    const tilt = (this.layout.cabinetTilt || 0) * Math.PI / 180;
    const surfY = this.layout.holes[4].y - (this.pos.z - this.layout.holes[4].z) * Math.tan(tilt);
    // hand position: head center at impact = surface point + n*headR; hand = head - H*Lh
    this.pivot.position.set(this.pos.x, surfY, this.pos.z).addScaledVector(this.n, this.headR).addScaledVector(this.H, -this.Lh);
    // swing angle
    let ang = this.restAngle, prog = 0;
    this.hitFrame = false;
    if (this.swingT >= 0) {
      this.swingT += dt;
      const t = this.swingT;
      if (t < this.swingDur) {
        const k = t / this.swingDur;
        prog = k < 0.22 ? 0 : easeInQuart((k - 0.22) / 0.78);
        const windup = k < 0.22 ? 0.3 * Math.sin((k / 0.22) * Math.PI) : 0;
        ang = this.restAngle + windup + (this.impactAngle - this.restAngle) * prog;
      } else if (t < this.swingDur + 0.06) {
        if (!this.hitDone) { this.hitFrame = true; this.hitDone = true; }
        ang = this.impactAngle; prog = 1;
      } else if (t < this.swingDur + 0.06 + 0.34) {
        const k = (t - this.swingDur - 0.06) / 0.34;
        prog = 1 - easeOutBack(k);
        ang = this.restAngle + (this.impactAngle - this.restAngle) * prog;
      } else { this.swingT = -1; ang = this.restAngle; }
    }
    this.progress = prog;
    if (this.wobble > 0) this.wobble = Math.max(0, this.wobble - dt * 3);
    const wob = Math.sin(this.wobble * 18) * this.wobble * 0.15;
    const lean = THREE.MathUtils.clamp(this.vel.x * 0.12, -0.35, 0.35) * (1 - prog);
    this.qTmp.setFromAxisAngle(this.axis, ang + wob);
    this.swing.quaternion.copy(this.qTmp).multiply(this.qAlign);
    // small lateral lean while moving (around the handle axis) + wobble on a whiff
    this.model.rotation.set(0, lean * 0.5 + wob * 0.4, 0);
    // squash on impact
    const sq = this.swingT >= this.swingDur && this.swingT < this.swingDur + 0.12 ? 1 - 0.2 * Math.sin(((this.swingT - this.swingDur) / 0.12) * Math.PI) : 1;
    this.model.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    this.pivot.updateMatrixWorld(true);
    this.headWorld.copy(this.headLocal).applyMatrix4(this.model.matrixWorld);
    this.impactPoint.set(this.pos.x, surfY, this.pos.z);
  }
}
