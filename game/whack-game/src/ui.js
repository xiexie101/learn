// HTML overlay: score, combo, timer, screens, record button.
const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.score = $('score'); this.best = $('best'); this.combo = $('combo'); this.timer = $('timer'); this.timerBar = this.timer.querySelector('i');
    this.start = $('start'); this.end = $('end'); this.final = $('final'); this.finalBest = $('finalBest');
    this.rec = $('rec');
    this.onPlay = null; this.onRecord = null;
    $('play').addEventListener('click', () => this.onPlay?.());
    $('again').addEventListener('click', () => this.onPlay?.());
    this.rec.addEventListener('click', (e) => { e.stopPropagation(); this.onRecord?.(); });
    this.bestValue = +(localStorage.getItem('whack.best') || 0);
    this.best.textContent = this.bestValue;
    this.lastScore = 0;
  }
  setLoading(on) { $('loading').classList.toggle('hide', !on); }
  showStart() { this.start.classList.remove('hide'); this.end.classList.add('hide'); }
  hideScreens() { this.start.classList.add('hide'); this.end.classList.add('hide'); }
  showEnd(score) {
    if (score > this.bestValue) { this.bestValue = score; localStorage.setItem('whack.best', String(score)); }
    this.final.textContent = score; this.finalBest.textContent = `best ${this.bestValue}`; this.best.textContent = this.bestValue;
    this.end.classList.remove('hide');
  }
  setScore(v) {
    if (v !== this.lastScore) { this.score.textContent = v; this.score.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.34,1.56,.64,1)' }); this.lastScore = v; }
  }
  setCombo(c) {
    if (c >= 2) {
      this.combo.textContent = `x${c}`; this.combo.classList.add('show');
      this.combo.classList.remove('wob'); void this.combo.offsetWidth; this.combo.classList.add('wob');
      const hue = Math.min(60, (c - 2) * 8); this.combo.style.color = `hsl(${45 + hue}, 100%, ${72 - hue * 0.3}%)`;
    } else this.combo.classList.remove('show');
  }
  setTimer(frac) { this.timerBar.style.transform = `scaleX(${Math.max(0, frac)})`; this.timer.classList.toggle('low', frac < 0.25); }
  setRecording(on) { this.rec.classList.toggle('on', on); this.rec.textContent = on ? '● recording' : '● rec 20s'; }
}
