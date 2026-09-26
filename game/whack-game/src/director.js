// Scripted "human" player for capture mode: glides the hammer between holes (spring follow, no teleport),
// swings when it arrives, deliberately hits one bomb, misses once, and pauses now and then.
import * as THREE from 'three';

export class Director {
  constructor({ game, monsters, hammer, swing, spawn, layout }) {
    Object.assign(this, { game, monsters, hammer, swing, spawn, layout });
    this.t = 0; this.target = null; this.cool = 0.6; this.bombDone = false; this.missDone = false;
    this.pause = 0; this.jit = new THREE.Vector3();
    hammer.k = 150; hammer.dmp = 17; // slower, more hand-like spring
    hammer.manualT = 1e9;
    hammer.aim.set(0.05, hammer.aim.y, 0.15); hammer.pos.copy(hammer.aim);
  }
  update(dt) {
    this.t += dt; const h = this.hammer, ms = this.monsters;
    // make sure a bomb shows up around 7-9 s so we can hit it on camera
    if (!this.bombDone && this.t > 7 && !ms.list.some((m) => m.type === 'bomb' && m.state !== 'hidden')) { this.spawn('bomb', 2.4); this.bombDone = 'spawned'; }
    if (this.cool > 0) { this.cool -= dt; }
    if (this.pause > 0) { this.pause -= dt; return; }
    // (re)pick a target
    const alive = (m) => m && (m.state === 'up' || m.state === 'rising') && (m.state === 'rising' || m.upTime - m.t > 0.3);
    if (!alive(this.target)) {
      this.target = null;
      const c = ms.list.filter(alive);
      const bomb = c.find((m) => m.type === 'bomb');
      if (bomb && this.bombDone === 'spawned' && this.t > 7.5) this.target = bomb;
      else {
        const good = c.filter((m) => m.type !== 'bomb');
        if (good.length) {
          good.sort((a, b) => (b.type === 'golden') - (a.type === 'golden') || (b.upTime - b.t) - (a.upTime - a.t));
          this.target = good[0];
        }
      }
      if (this.target) { this.jit.set((Math.random() - .5) * 0.03, 0, (Math.random() - .5) * 0.03); this.arrivedT = 0; }
    }
    if (this.target) {
      const p = this.target.topWorld;
      h.aim.set(p.x + this.jit.x, h.aim.y, p.z + this.jit.z);
      const d = Math.hypot(h.pos.x - h.aim.x, h.pos.z - h.aim.z);
      if (d < 0.05 && this.cool <= 0 && h.swingT < 0) {
        // one deliberate whiff early on: swing a beat too late on purpose by nudging the aim aside
        if (!this.missDone && this.t > 3.5) { this.missDone = true; h.aim.x += 0.22; this.cool = 0.35; return; }
        if (this.target.type === 'bomb') this.bombDone = true;
        this.swing(); this.cool = 0.32 + Math.random() * 0.15;
        if (Math.random() < 0.25) this.pause = 0.25 + Math.random() * 0.3;
      }
    } else {
      // idle: drift toward the middle, slight wander
      const c = this.layout.holes[4];
      h.aim.x += (c.x + Math.sin(this.t * 0.7) * 0.12 - h.aim.x) * dt * 1.5;
      h.aim.z += (c.z + 0.1 + Math.cos(this.t * 0.5) * 0.08 - h.aim.z) * dt * 1.5;
    }
  }
}
