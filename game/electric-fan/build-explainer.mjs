import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.agents/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../.agents/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 680;
const HEIGHT = 520;

const BASE_PLAN = { x: -44, y: -44, w: 88, d: 88, r: 20 };
const BASE_H = 9;
const FOOT_H = 4;
const BASE_TOP = BASE_H;

const MAST = [0, 0];
const LOWER_MAST_TOP = 70;
const COLLAR_TOP = 82;
const UPPER_MAST_TOP = 118;
const PIVOT_Z = 132;
const HEAD_Z = 142;

const P = k.fitProjection(
  [
    ...k.boxCorners(BASE_PLAN, -FOOT_H, BASE_TOP),
    [-60, -60, -FOOT_H],
    [70, 70, 0],
    [-45, -20, HEAD_Z + 55],
    [85, 20, HEAD_Z + 55],
    [95, 0, HEAD_Z],
    [0, 0, UPPER_MAST_TOP],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 42, elevation: 30 }
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

function base() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(BASE_PLAN, -FOOT_H, BASE_H, P)}"/>`);
  const footCorners = [[-30, -30], [30, -30], [-30, 30], [30, 30]];
  for (const [fx, fy] of footCorners) {
    out.push(S(k.cylinder(fx, fy, 6, -FOOT_H, FOOT_H, P, 24, 0.6), { tone: "lo" }));
  }
  out.push(S(k.slabOf(BASE_PLAN, 0, BASE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BASE_PLAN, 4.5), BASE_TOP, P), { tone: "faint" }));

  const screws = [[-32, -32], [32, -32], [-32, 32], [32, 32]];
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, BASE_TOP, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, BASE_TOP])), { size: 0.45, tone: "mid" }));

  const SW_BOX = { x: 4, y: -24, w: 32, d: 48, r: 4 };
  out.push(S(k.slabOf(SW_BOX, BASE_TOP, 1.2, P, 4, 0.4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(SW_BOX, 2), BASE_TOP + 1.2, P), { tone: "faint" }));

  const btnLabels = ["0", "1", "2", "3"];
  btnLabels.forEach((label, idx) => {
    const by = -18 + idx * 12;
    const bx = 20;
    const plan = { x: bx - 7, y: by - 4, w: 14, d: 8, r: 1.5 };
    out.push(
      `<g class="iso-btn" data-btn="${idx}" style="cursor:pointer">` +
      S(k.slabOf(plan, BASE_TOP + 1.2, 3, P, 3, 0.4), { tone: idx === 0 ? "hi" : "mid" }) +
      k.faceTextSvg(k.topMatrix([bx, by + 1.5], BASE_TOP + 4.2, P, "x"), label, { size: 2.8, tone: "lo", anchor: "middle" }) +
      `</g>`
    );
  });

  const ledCenter = [20, 24];
  out.push(L(k.ring(ledCenter[0], ledCenter[1], 2, BASE_TOP + 1.2, P, 16), { tone: "faint" }));
  out.push(`<circle class="iso-led" data-led="" cx="${k.iso([...ledCenter, BASE_TOP + 1.2], P)[0]}" cy="${k.iso([...ledCenter, BASE_TOP + 1.2], P)[1]}" r="1.4" fill="var(--anatomy-lo)" stroke="var(--anatomy-mid)" stroke-width="0.3"/>`);

  const SPEC = { x: -36, y: -22, w: 26, d: 44, r: 2 };
  out.push(S(k.slabOf(SPEC, BASE_TOP, 0.8, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(SPEC.y + 4, SPEC.y + SPEC.d - 4, 4, 4, SPEC.x + 1.2, BASE_TOP + 0.8, [1.5, 3], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([-23, -12], BASE_TOP + 0.8, P, "y"), "AC 220V 50Hz", { size: 2.2, tone: "lo", anchor: "middle" }));
  out.push(k.faceTextSvg(k.topMatrix([-23, -2], BASE_TOP + 0.8, P, "y"), "400mm 55W", { size: 2.2, tone: "lo", anchor: "middle" }));
  out.push(k.faceTextSvg(k.topMatrix([-23, 8], BASE_TOP + 0.8, P, "y"), "3-SPEED FAN", { size: 2.0, tone: "mid", anchor: "middle" }));
  out.push(D([[SPEC.x + 2, SPEC.y + 2, BASE_TOP + 0.8], [SPEC.x + SPEC.w - 2, SPEC.y + 2, BASE_TOP + 0.8], [SPEC.x + 2, SPEC.y + SPEC.d - 2, BASE_TOP + 0.8], [SPEC.x + SPEC.w - 2, SPEC.y + SPEC.d - 2, BASE_TOP + 0.8]].map(pt => at(pt)), { size: 0.35, tone: "lo" }));

  const cordRoot = [-44, 0, 4];
  const cordVia = [[-52, -2, 2], [-60, -10, -3], [-68, -25, -FOOT_H], [-74, -45, -FOOT_H]];
  out.push(S(k.cylinder(cordRoot[0], cordRoot[1], 3.2, cordRoot[2] - 2, 4, P, 16), { tone: "lo" }));
  out.push(k.wireSvg(at(cordRoot), at(cordVia[cordVia.length - 1]), { via: cordVia.slice(0, -1).map(p => at(p)), tone: "lo", size: 1.1, ends: "to" }));

  return out.join("");
}

function column() {
  const out = [];
  out.push(S(k.cylinder(MAST[0], MAST[1], 10, BASE_TOP, 7, P, 28, 0.8), { tone: "mid" }));
  out.push(L(k.ring(MAST[0], MAST[1], 8, BASE_TOP + 7, P, 24), { tone: "faint" }));
  out.push(S(k.cylinder(MAST[0], MAST[1], 6.5, BASE_TOP + 7, LOWER_MAST_TOP - (BASE_TOP + 7), P, 24), { tone: "mid", crease: "none" }));

  for (let z = BASE_TOP + 16; z <= LOWER_MAST_TOP - 8; z += 6) {
    const isMajor = Math.round((z - (BASE_TOP + 16)) / 6) % 3 === 0;
    const len = isMajor ? 3.2 : 1.6;
    const p1 = [MAST[0] + 6.5 * Math.cos(Math.PI * 0.25), MAST[1] + 6.5 * Math.sin(Math.PI * 0.25), z];
    const p2 = [MAST[0] + (6.5 - len) * Math.cos(Math.PI * 0.25), MAST[1] + (6.5 - len) * Math.sin(Math.PI * 0.25), z];
    out.push(L(k.segment(p1, p2, P), { tone: isMajor ? "mid" : "lo" }));
  }

  out.push(S(k.cylinder(MAST[0], MAST[1], 8.5, LOWER_MAST_TOP, COLLAR_TOP - LOWER_MAST_TOP, P, 28, 0.6), { tone: "mid" }));
  const knobPos = [MAST[0] - 8.5, MAST[1]];
  out.push(S(k.cylinder(knobPos[0] - 3.5, knobPos[1], 4, LOWER_MAST_TOP + 2, 6, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(knobPos[0] - 3.5, knobPos[1], 4, LOWER_MAST_TOP + 2, LOWER_MAST_TOP + 8, 20, P), { tone: "lo" }));
  out.push(S(k.cylinder(MAST[0], MAST[1], 5, COLLAR_TOP, UPPER_MAST_TOP - COLLAR_TOP, P, 24), { tone: "hi", crease: "none" }));

  const FORK = { x: -6, y: -7, w: 12, d: 14, r: 2 };
  out.push(S(k.slabOf(FORK, UPPER_MAST_TOP, 14, P, 4, 0.6), { tone: "mid" }));
  const tiltX = FORK.x + FORK.w + 1;
  out.push(S(k.cylinder(tiltX, 0, 4.2, PIVOT_Z - 3, 6, P, 18), { tone: "lo" }));
  out.push(L(k.knurl(tiltX, 0, 4.2, PIVOT_Z - 3, PIVOT_Z + 3, 16, P), { tone: "faint" }));

  const conduitFrom = [MAST[0] - 5, MAST[1], UPPER_MAST_TOP];
  const conduitVia = [[MAST[0] - 10, MAST[1] - 4, UPPER_MAST_TOP + 8], [MAST[0] - 14, MAST[1] - 6, HEAD_Z - 4]];
  const conduitTo = [-18, 0, HEAD_Z - 6];
  out.push(k.wireSvg(at(conduitFrom), at(conduitTo), { via: conduitVia.map(p => at(p)), tone: "lo", size: 0.9, ends: "none" }));

  return out.join("");
}

function headTemplate() {
  const out = [];
  out.push(`<g data-part="head-container">`);
  out.push(`<path class="iso-fill" data-head="gearbox-fill" fill="var(--anatomy-paper)"/>`);
  out.push(`<path class="iso-line" data-head="gearbox-edge" data-tone="mid"/>`);
  out.push(`<g class="iso-clutch" data-head="clutch" style="cursor:pointer"><path class="iso-fill" data-head="clutch-fill" fill="var(--anatomy-face)"/><path class="iso-line" data-head="clutch-edge" data-tone="hi"/></g>`);
  out.push(`<path class="iso-line" data-head="linkage" data-tone="mid" style="stroke-width:1.5"/>`);
  out.push(`<polygon class="iso-fill" data-head="motor-hull" fill="var(--anatomy-paper)"/>`);
  out.push(`<path class="iso-line" data-head="motor-rings" data-tone="faint"/>`);
  out.push(`<path class="iso-line" data-head="motor-louvers" data-tone="lo"/>`);
  out.push(`<polygon class="iso-fill" data-head="motor-front-fill" fill="var(--anatomy-paper)"/>`);
  out.push(`<path class="iso-line" data-head="motor-front" data-tone="mid"/>`);
  out.push(`<path class="iso-line" data-head="shaft" data-tone="lit"/>`);
  out.push(`<path class="iso-line" data-head="rear-cage" data-tone="lo"/>`);
  out.push(`<path class="iso-line" data-head="rear-spokes" data-tone="faint"/>`);
  out.push(`<g data-part="rotor">`);
  for (let b = 0; b < 3; b++) {
    out.push(`<path class="iso-fill" data-blade="${b}" fill="var(--anatomy-face)"/>`);
    out.push(`<path class="iso-line" data-blade-edge="${b}" data-tone="lit" style="stroke-width:1"/>`);
  }
  out.push(`<path class="iso-line" data-head="spinner" data-tone="lit"/>`);
  out.push(`</g>`);
  out.push(`<path class="iso-line" data-head="front-cage" data-tone="lo"/>`);
  out.push(`<path class="iso-line" data-head="front-spokes" data-tone="faint"/>`);
  out.push(`<path class="iso-fill" data-head="medallion-fill" fill="var(--anatomy-paper)"/>`);
  out.push(`<path class="iso-line" data-head="medallion-edge" data-tone="hi"/>`);
  out.push(`<g data-part="airflow" class="iso-airflow">`);
  for (let s = 0; s < 5; s++) {
    out.push(`<path class="iso-line iso-streamline" data-stream="${s}" data-flow="" data-tone="blue" style="stroke-width:1.4;opacity:0.9"/>`);
  }
  out.push(`</g>`);
  out.push(`</g>`);
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Electric Fan Explainer 3D Model",
  body: [base(), column(), headTemplate()],
});

// The video explainer HTML code
const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>《原来如此！解剖一台电风扇》科普视频互动演播</title>
  <style>
    ${k.ISO_CSS}
    :root {
      --bg: #09090b;
      --card-bg: #121215;
      --border: #27272a;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .video-container {
      width: 100%;
      max-width: 980px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .video-header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255,255,255,0.02);
    }
    .video-title {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      font-size: 11px;
      background: var(--accent);
      color: #000;
      padding: 2px 8px;
      border-radius: 20px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .stage-wrapper {
      position: relative;
      background: radial-gradient(circle at 50% 45%, #181822 0%, #0d0d12 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px 0;
      min-height: 480px;
    }
    .stage-wrapper svg {
      max-width: 760px;
      width: 100%;
      height: auto;
      transform: scale(1.15) translateY(-8px);
      filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6));
    }
    .camera-focus-ring {
      position: absolute;
      border: 2px dashed var(--accent);
      border-radius: 8px;
      pointer-events: none;
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 0 25px var(--accent-glow);
    }
    .chapter-hud {
      position: absolute;
      top: 16px;
      left: 20px;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      color: var(--accent);
      background: rgba(0,0,0,0.6);
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.3);
      backdrop-filter: blur(4px);
    }
    .subtitle-bar {
      position: absolute;
      bottom: 24px;
      left: 5%;
      right: 5%;
      text-align: center;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      padding: 12px 24px;
      border-radius: 30px;
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 15px;
      line-height: 1.5;
      font-weight: 500;
      color: #fff;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .subtitle-bar em {
      color: var(--accent);
      font-style: normal;
      font-weight: 700;
    }
    .controls-panel {
      padding: 16px 24px 20px;
      background: #0d0d10;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .timeline-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .time-display {
      font-family: ui-monospace, monospace;
      font-size: 13px;
      color: var(--text-muted);
      width: 80px;
    }
    .timeline-slider {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      outline: none;
      background: #27272a;
      accent-color: var(--accent);
      cursor: pointer;
    }
    .btn-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .main-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .play-btn {
      background: var(--accent);
      color: #000;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.1s, background 0.2s;
    }
    .play-btn:hover { background: #7dd3fc; }
    .play-btn:active { transform: scale(0.97); }
    .chapter-chips {
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }
    .chip {
      background: #18181b;
      border: 1px solid #27272a;
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .chip:hover { border-color: var(--accent); color: #fff; }
    .chip.active {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--accent);
      color: var(--accent);
      font-weight: 600;
    }
    .tts-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
      cursor: pointer;
    }
  </style>
</head>
<body class="iso">
  <div class="video-container">
    <div class="video-header">
      <div class="video-title">
        <span class="badge">科普演播</span>
        <span>《原来如此！解剖一台电风扇》</span>
      </div>
      <label class="tts-toggle">
        <input type="checkbox" id="ttsCheckbox" checked>
        <span>开启真人语音旁白 (TTS)</span>
      </label>
    </div>

    <div class="stage-wrapper">
      <div class="chapter-hud" id="chapterHud">ACT 1 · 悬念引出</div>
      <div class="camera-focus-ring" id="focusRing"></div>
      <div class="iso-stage">${svg}</div>
      <div class="subtitle-bar" id="subtitleBar">
        点击下方【播放】按钮，开启沉浸式电风扇三维原理科普讲解
      </div>
    </div>

    <div class="controls-panel">
      <div class="timeline-row">
        <span class="time-display" id="timeDisplay">00:00 / 02:15</span>
        <input type="range" class="timeline-slider" id="timelineSlider" min="0" max="135" value="0" step="0.1">
      </div>
      <div class="btn-row">
        <div class="main-controls">
          <button class="play-btn" id="playBtn">▶ 播放</button>
        </div>
        <div class="chapter-chips">
          <button class="chip active" data-time="0">1. 悬念引出</button>
          <button class="chip" data-time="18">2. 旋转磁场</button>
          <button class="chip" data-time="42">3. 翼型推力</button>
          <button class="chip" data-time="68">4. 蜗轮摇头</button>
          <button class="chip" data-time="100">5. 潜热真理</button>
        </div>
      </div>
    </div>
  </div>

  <script type="module">
    ${kitScript().replace(/<\/(script)/gi, "<\\/$1")}

    const P = ${JSON.stringify(P)};
    const PIVOT_Z = ${PIVOT_Z};
    const HEAD_Z = ${HEAD_Z};
    const cageX = 22, cageR = 52;

    const svg = document.querySelector(".stage-wrapper svg");
    const playBtn = document.getElementById("playBtn");
    const slider = document.getElementById("timelineSlider");
    const timeDisplay = document.getElementById("timeDisplay");
    const subtitleBar = document.getElementById("subtitleBar");
    const chapterHud = document.getElementById("chapterHud");
    const chips = [...document.querySelectorAll(".chip")];
    const ttsCheckbox = document.getElementById("ttsCheckbox");
    const focusRing = document.getElementById("focusRing");

    const elGearboxFill = svg.querySelector('[data-head="gearbox-fill"]');
    const elGearboxEdge = svg.querySelector('[data-head="gearbox-edge"]');
    const elClutchFill = svg.querySelector('[data-head="clutch-fill"]');
    const elClutchEdge = svg.querySelector('[data-head="clutch-edge"]');
    const elLinkage = svg.querySelector('[data-head="linkage"]');
    const elMotorHull = svg.querySelector('[data-head="motor-hull"]');
    const elMotorRings = svg.querySelector('[data-head="motor-rings"]');
    const elMotorLouvers = svg.querySelector('[data-head="motor-louvers"]');
    const elMotorFrontFill = svg.querySelector('[data-head="motor-front-fill"]');
    const elMotorFront = svg.querySelector('[data-head="motor-front"]');
    const elShaft = svg.querySelector('[data-head="shaft"]');
    const elRearCage = svg.querySelector('[data-head="rear-cage"]');
    const elRearSpokes = svg.querySelector('[data-head="rear-spokes"]');
    const elSpinner = svg.querySelector('[data-head="spinner"]');
    const elFrontCage = svg.querySelector('[data-head="front-cage"]');
    const elFrontSpokes = svg.querySelector('[data-head="front-spokes"]');
    const elMedallionFill = svg.querySelector('[data-head="medallion-fill"]');
    const elMedallionEdge = svg.querySelector('[data-head="medallion-edge"]');
    const elBlades = [0, 1, 2].map(b => svg.querySelector('[data-blade="' + b + '"]'));
    const elBladeEdges = [0, 1, 2].map(b => svg.querySelector('[data-blade-edge="' + b + '"]'));
    const elStreams = [0, 1, 2, 3, 4].map(s => svg.querySelector('[data-stream="' + s + '"]'));
    const airflowGroup = svg.querySelector('[data-part="airflow"]');
    const led = svg.querySelector('[data-led]');

    function tr(x, y, z, yaw) {
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      return [x * cos - y * sin, x * sin + y * cos, z];
    }
    function circlePts(x0, y0, z0, radius, steps, yaw) {
      const pts = [];
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        pts.push(tr(x0, y0 + radius * Math.cos(a), z0 + radius * Math.sin(a), yaw));
      }
      return pts;
    }
    function toScreen(pts) {
      return pts.map(pt => iso(pt, P));
    }

    function renderHead(yaw, bAngle, isOsc) {
      const gbZ0 = HEAD_Z - 12, gbZ1 = HEAD_Z + 12;
      const gbTopScreen = toScreen([tr(-44,-11,gbZ1,yaw), tr(-24,-11,gbZ1,yaw), tr(-24,11,gbZ1,yaw), tr(-44,11,gbZ1,yaw)]);
      const gbBotScreen = toScreen([tr(-44,-11,gbZ0,yaw), tr(-24,-11,gbZ0,yaw), tr(-24,11,gbZ0,yaw), tr(-44,11,gbZ0,yaw)]);
      if (elGearboxFill) elGearboxFill.setAttribute("d", pathOf([...gbTopScreen, gbBotScreen[1], gbBotScreen[2], gbBotScreen[3]], true));
      if (elGearboxEdge) elGearboxEdge.setAttribute("d", pathOf(gbTopScreen, true) + pathOf([gbTopScreen[0], gbBotScreen[0]]) + pathOf([gbTopScreen[1], gbBotScreen[1]]) + pathOf([gbTopScreen[2], gbBotScreen[2]]) + pathOf([gbTopScreen[3], gbBotScreen[3]]) + pathOf(gbBotScreen, true));

      const clutchTop = HEAD_Z + 12 + 6 + (isOsc ? 0 : 4);
      const clutchPts = toScreen(circlePts(-34, 0, clutchTop, 3.5, 16, yaw));
      const clutchStem = toScreen([tr(-34, 0, HEAD_Z + 12, yaw), tr(-34, 0, clutchTop, yaw)]);
      if (elClutchFill) elClutchFill.setAttribute("d", pathOf(clutchPts, true));
      if (elClutchEdge) elClutchEdge.setAttribute("d", pathOf(clutchPts, true) + pathOf(clutchStem));

      if (elLinkage) elLinkage.setAttribute("d", pathOf(toScreen([tr(-34, 0, HEAD_Z - 14, yaw), [0, 0, PIVOT_Z + 1]])));

      const motorX0 = -24, motorX1 = 8, motorR = 15;
      const backScr = toScreen(circlePts(motorX0, 0, HEAD_Z, motorR, 24, yaw));
      const frontScr = toScreen(circlePts(motorX1, 0, HEAD_Z, motorR, 24, yaw));
      if (elMotorHull) elMotorHull.setAttribute("points", [...frontScr, ...[...backScr].reverse()].map(p => Math.round(p[0]*10)/10 + "," + Math.round(p[1]*10)/10).join(" "));

      let ringsD = "";
      for (let x = motorX0; x <= motorX1; x += 6) ringsD += pathOf(toScreen(circlePts(x, 0, HEAD_Z, motorR, 24, yaw)), true);
      if (elMotorRings) elMotorRings.setAttribute("d", ringsD);

      let louversD = "";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        louversD += pathOf(toScreen([tr(motorX0 + 3, motorR * Math.cos(a), HEAD_Z + motorR * Math.sin(a), yaw), tr(motorX1 - 3, motorR * Math.cos(a), HEAD_Z + motorR * Math.sin(a), yaw)]));
      }
      if (elMotorLouvers) elMotorLouvers.setAttribute("d", louversD);

      const bellScr = toScreen(circlePts(12, 0, HEAD_Z, 10, 20, yaw));
      if (elMotorFrontFill) elMotorFrontFill.setAttribute("points", bellScr.map(p => Math.round(p[0]*10)/10 + "," + Math.round(p[1]*10)/10).join(" "));
      if (elMotorFront) elMotorFront.setAttribute("d", pathOf(bellScr, true) + pathOf(toScreen(circlePts(16, 0, HEAD_Z, 5.5, 16, yaw)), true));
      if (elShaft) elShaft.setAttribute("d", pathOf(toScreen([tr(16, 0, HEAD_Z, yaw), tr(28, 0, HEAD_Z, yaw)])));

      const rearRimScr = toScreen(circlePts(cageX - 2, 0, HEAD_Z, cageR, 36, yaw));
      if (elRearCage) elRearCage.setAttribute("d", pathOf(rearRimScr, true) + pathOf(toScreen(circlePts(cageX - 4, 0, HEAD_Z, 34, 24, yaw)), true) + pathOf(toScreen(circlePts(cageX - 6, 0, HEAD_Z, 18, 18, yaw)), true));

      let rearSpokesD = "";
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        rearSpokesD += pathOf(toScreen([tr(cageX - 6, 12 * Math.cos(a), HEAD_Z + 12 * Math.sin(a), yaw), tr(cageX - 2, cageR * Math.cos(a), HEAD_Z + cageR * Math.sin(a), yaw)]));
      }
      if (elRearSpokes) elRearSpokes.setAttribute("d", rearSpokesD);

      for (let b = 0; b < 3; b++) {
        const baseA = bAngle + b * (Math.PI * 2 / 3);
        const bladeCurve = [];
        for (let s = 0; s <= 10; s++) {
          const t = s / 10, r = 8.5 + t * (cageR - 10), sweep = Math.sin(t * Math.PI * 0.7) * 0.28, a = baseA + sweep, pitch = (1 - t) * 3;
          bladeCurve.push(tr(cageX + pitch, r * Math.cos(a), HEAD_Z + r * Math.sin(a), yaw));
        }
        for (let s = 10; s >= 0; s--) {
          const t = s / 10, r = 8.5 + t * (cageR - 10), width = Math.sin(t * Math.PI) * 11, sweep = Math.sin(t * Math.PI * 0.7) * 0.28 + width / r, a = baseA + sweep, pitch = -(1 - t) * 3;
          bladeCurve.push(tr(cageX + pitch, r * Math.cos(a), HEAD_Z + r * Math.sin(a), yaw));
        }
        const bD = pathOf(toScreen(bladeCurve), true);
        if (elBlades[b]) elBlades[b].setAttribute("d", bD);
        if (elBladeEdges[b]) elBladeEdges[b].setAttribute("d", bD);
      }

      const spTip = tr(cageX + 12, 0, HEAD_Z, yaw);
      let spD = pathOf(toScreen(circlePts(cageX + 4, 0, HEAD_Z, 5, 16, yaw)), true);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        spD += pathOf(toScreen([tr(cageX + 4, 5 * Math.cos(a), HEAD_Z + 5 * Math.sin(a), yaw), spTip]));
      }
      if (elSpinner) elSpinner.setAttribute("d", spD);

      const frontRimScr = toScreen(circlePts(cageX + 5, 0, HEAD_Z, cageR, 36, yaw));
      if (elFrontCage) elFrontCage.setAttribute("d", pathOf(frontRimScr, true) + pathOf(toScreen(circlePts(cageX + 6, 0, HEAD_Z, 42, 28, yaw)), true) + pathOf(toScreen(circlePts(cageX + 7, 0, HEAD_Z, 28, 22, yaw)), true) + pathOf(toScreen(circlePts(cageX + 8, 0, HEAD_Z, 16, 16, yaw)), true));

      let frontSpokesD = "";
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        frontSpokesD += pathOf(toScreen([tr(cageX + 8, 11 * Math.cos(a), HEAD_Z + 11 * Math.sin(a), yaw), tr(cageX + 5, cageR * Math.cos(a), HEAD_Z + cageR * Math.sin(a), yaw)]));
      }
      if (elFrontSpokes) elFrontSpokes.setAttribute("d", frontSpokesD);

      const medScr = toScreen(circlePts(cageX + 8.5, 0, HEAD_Z, 11, 20, yaw));
      if (elMedallionFill) elMedallionFill.setAttribute("d", pathOf(medScr, true));
      if (elMedallionEdge) elMedallionEdge.setAttribute("d", pathOf(medScr, true) + pathOf(toScreen(circlePts(cageX + 8.5, 0, HEAD_Z, 8, 16, yaw)), true));

      const streamOffsets = [[0, 0, 0], [0, 22, 16], [0, -22, 16], [0, 20, -18], [0, -20, -18]];
      streamOffsets.forEach(([dx, dy, dz], idx) => {
        const pStart = tr(cageX + 12 + dx, dy, HEAD_Z + dz, yaw);
        const pEnd = tr(cageX + 85 + dx, dy * 1.35, HEAD_Z + dz * 1.35, yaw);
        const pMid1 = tr(cageX + 35 + dx, dy * 1.1, HEAD_Z + dz * 1.1 + Math.sin(idx) * 3, yaw);
        const pMid2 = tr(cageX + 60 + dx, dy * 1.25, HEAD_Z + dz * 1.25 - Math.cos(idx) * 3, yaw);
        if (elStreams[idx]) elStreams[idx].setAttribute("d", pathOf(toScreen([pStart, pMid1, pMid2, pEnd])));
      });
    }

    // Video script script entries with exact timestamps and actions
    const TIMELINE = [
      {
        start: 0,
        end: 18,
        hud: "ACT 1 · 凉爽的假象",
        sub: "你有没有想过，大夏天吹的风扇，其实<em>根本不会给空气降温半分</em>，它的电机甚至还在发热！",
        speech: "你有没有想过，大夏天吹的风扇，其实根本不会给空气降温半分，它的电机甚至还在发热！",
        rpm: 0,
        osc: false,
        yaw: 0,
      },
      {
        start: 18,
        end: 42,
        hud: "ACT 2 · 电机与旋转磁场",
        sub: "单相交流电磁场来回脉动，本无法自转。秘密在定子启动电容：将电流<em>移相 90°</em>，强行合成出奔跑的旋转磁场！",
        speech: "单相交流电磁场来回脉动，本无法自转。秘密在定子启动电容：将电流移相90度，强行合成出奔跑的旋转磁场！",
        rpm: 1100,
        osc: false,
        yaw: -0.2,
      },
      {
        start: 42,
        end: 68,
        hud: "ACT 3 · 翼型迎角与动量推力",
        sub: "扇叶绝不是平的！它带有特定弧度与<em>迎角</em>。前方强推空气，后方抽成<em>伯努利负压</em>，源源不断喷射出高速风锥！",
        speech: "扇叶绝不是平的！它带有特定弧度与迎角。前方强推空气，后方抽成伯努利负压，源源不断喷射出高速风锥！",
        rpm: 1450,
        osc: false,
        yaw: 0.15,
      },
      {
        start: 68,
        end: 100,
        hud: "ACT 4 · 蜗轮蜗杆 1:90 减速摇头",
        sub: "1400 转怎么变成 15 次摇头？尾部螺旋蜗杆咬合大蜗轮，实现 <em>1:90 极限减速</em>，底部四连杆曲柄带动整体摆头！",
        speech: "1400转怎么变成15次摇头？尾部螺旋蜗杆咬合大蜗轮，实现一比九十极限减速，底部四连杆曲柄带动整体摆头！",
        rpm: 1100,
        osc: true,
        yaw: null,
      },
      {
        start: 100,
        end: 135,
        hud: "ACT 5 · 汗液相变潜热",
        sub: "风扇吹凉的不是空气，而是吹散皮肤<em>热边界层</em>，并依靠<em>每克汗水蒸发带走 2400 焦耳汽化潜热</em>，把身体热量偷走了！",
        speech: "风扇吹凉的不是空气，而是吹散皮肤热边界层，并依靠每克汗水蒸发带走两千四百焦耳汽化潜热，把身体热量偷走了！",
        rpm: 800,
        osc: true,
        yaw: null,
      }
    ];

    let isPlaying = false;
    let currentTime = 0;
    let lastStamp = 0;
    let bladeAngle = 0;
    let oscTimer = 0;
    let currentSpeechText = "";

    function speak(text) {
      if (!ttsCheckbox.checked || !window.speechSynthesis) return;
      if (currentSpeechText === text) return;
      currentSpeechText = text;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      utter.rate = 1.05;
      window.speechSynthesis.speak(utter);
    }

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    }

    function applyTimeline(t) {
      currentTime = t;
      slider.value = t;
      timeDisplay.textContent = formatTime(t) + " / 02:15";

      const cur = TIMELINE.find(item => t >= item.start && t < item.end) || TIMELINE[TIMELINE.length - 1];
      if (cur) {
        subtitleBar.innerHTML = cur.sub;
        chapterHud.textContent = cur.hud;
        if (isPlaying) speak(cur.speech);

        chips.forEach((chip, i) => {
          const chipTime = Number(chip.dataset.time);
          const nextTime = TIMELINE[i + 1] ? TIMELINE[i + 1].start : 999;
          chip.classList.toggle("active", t >= chipTime && t < nextTime);
        });

        if (led) led.setAttribute("fill", cur.rpm > 0 ? "var(--anatomy-green)" : "var(--anatomy-lo)");
        if (airflowGroup) {
          airflowGroup.style.display = cur.rpm > 0 ? "block" : "none";
          airflowGroup.style.opacity = String(0.3 + (cur.rpm / 1450) * 0.7);
        }
      }
    }

    function togglePlay() {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? "⏸ 暂停" : "▶ 播放";
      if (!isPlaying && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        currentSpeechText = "";
      }
      if (isPlaying) {
        lastStamp = performance.now();
        applyTimeline(currentTime);
      }
    }

    playBtn.addEventListener("click", togglePlay);
    slider.addEventListener("input", (e) => {
      applyTimeline(Number(e.target.value));
    });

    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const targetT = Number(chip.dataset.time);
        applyTimeline(targetT);
        if (!isPlaying) togglePlay();
      });
    });

    function loop(now) {
      const dt = lastStamp ? Math.min((now - lastStamp) / 1000, 0.05) : 0.016;
      lastStamp = now;

      if (isPlaying) {
        currentTime += dt;
        if (currentTime >= 135) {
          currentTime = 0;
          togglePlay();
        }
        applyTimeline(currentTime);
      }

      const cur = TIMELINE.find(item => currentTime >= item.start && currentTime < item.end) || TIMELINE[0];
      const rpm = cur.rpm;
      bladeAngle += rpm * dt * (Math.PI * 2 / 60);

      let yaw = cur.yaw !== null ? cur.yaw : 0;
      if (cur.osc && rpm > 0) {
        oscTimer += dt * (rpm / 1100) * 0.95;
        yaw = Math.sin(oscTimer) * (32 * Math.PI / 180);
      }

      renderHead(yaw, bladeAngle, cur.osc);

      requestAnimationFrame(loop);
    }

    applyTimeline(0);
    requestAnimationFrame(loop);
  </script>
</body>
</html>
`;

writeFileSync(join(HERE, "video-explainer.html"), html);
console.log("wrote video-explainer.html");
