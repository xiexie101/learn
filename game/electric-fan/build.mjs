import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.agents/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../.agents/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 680;
const HEIGHT = 520;

// World definitions
const BASE_PLAN = { x: -44, y: -44, w: 88, d: 88, r: 20 };
const BASE_H = 9;
const FOOT_H = 4;
const BASE_TOP = BASE_H;

// Center of the stand
const MAST = [0, 0];
const LOWER_MAST_TOP = 70;
const COLLAR_TOP = 82;
const UPPER_MAST_TOP = 118;
const PIVOT_Z = 132;
const HEAD_Z = 142; // Motor axis center

// Projection setup: azimuth 42, elevation 30
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

// Transform local [x, y, z] on head to world 3D given yaw angle (around Z at [0, 0, PIVOT_Z])
function tr(x, y, z, yaw) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return [x * cos - y * sin, x * sin + y * cos, z];
}

// Generate 3D circle in local Y-Z plane at local x0, transformed by yaw
function circleLocal(x0, y0, z0, radius, steps, yaw) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push(tr(x0, y0 + radius * Math.cos(a), z0 + radius * Math.sin(a), yaw));
  }
  return pts;
}

// Base plate and controls
function base() {
  const out = [];
  // Halo drop shadow
  out.push(`<path class="iso-halo" d="${k.haloOf(BASE_PLAN, -FOOT_H, BASE_H, P)}"/>`);

  // 4 Rubber feet
  const footCorners = [
    [-30, -30],
    [30, -30],
    [-30, 30],
    [30, 30],
  ];
  for (const [fx, fy] of footCorners) {
    out.push(S(k.cylinder(fx, fy, 6, -FOOT_H, FOOT_H, P, 24, 0.6), { tone: "lo" }));
  }

  // Main base cast plate
  out.push(S(k.slabOf(BASE_PLAN, 0, BASE_H, P, 8, 1.4), { tone: "mid" }));

  // Inset contour groove
  out.push(L(k.planOutline(k.insetPlan(BASE_PLAN, 4.5), BASE_TOP, P), { tone: "faint" }));

  // 4 Base assembly screw dots with rings
  const screws = [
    [-32, -32],
    [32, -32],
    [-32, 32],
    [32, 32],
  ];
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, BASE_TOP, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, BASE_TOP])), { size: 0.45, tone: "mid" }));

  // Speed switch control box (Right/Front side of base)
  const SW_BOX = { x: 4, y: -24, w: 32, d: 48, r: 4 };
  out.push(S(k.slabOf(SW_BOX, BASE_TOP, 1.2, P, 4, 0.4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(SW_BOX, 2), BASE_TOP + 1.2, P), { tone: "faint" }));

  // 4 Speed push buttons: 0 (Off), 1 (Low), 2 (Med), 3 (High)
  const btnLabels = ["0", "1", "2", "3"];
  btnLabels.forEach((label, idx) => {
    const by = -18 + idx * 12;
    const bx = 20;
    const plan = { x: bx - 7, y: by - 4, w: 14, d: 8, r: 1.5 };
    out.push(
      `<g class="iso-btn" data-btn="${idx}" style="cursor:pointer">` +
      S(k.slabOf(plan, BASE_TOP + 1.2, 3, P, 3, 0.4), { tone: idx === 2 ? "hi" : "mid" }) +
      k.faceTextSvg(k.topMatrix([bx, by + 1.5], BASE_TOP + 4.2, P, "x"), label, { size: 2.8, tone: "lo", anchor: "middle" }) +
      `</g>`
    );
  });

  // Power status LED indicator on base
  const ledCenter = [20, 24];
  out.push(L(k.ring(ledCenter[0], ledCenter[1], 2, BASE_TOP + 1.2, P, 16), { tone: "faint" }));
  out.push(`<circle class="iso-led" data-led="" cx="${k.iso([...ledCenter, BASE_TOP + 1.2], P)[0]}" cy="${k.iso([...ledCenter, BASE_TOP + 1.2], P)[1]}" r="1.4" fill="var(--anatomy-green)" stroke="var(--anatomy-mid)" stroke-width="0.3"/>`);

  // Specification metal plate on left side of base
  const SPEC = { x: -36, y: -22, w: 26, d: 44, r: 2 };
  out.push(S(k.slabOf(SPEC, BASE_TOP, 0.8, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(SPEC.y + 4, SPEC.y + SPEC.d - 4, 4, 4, SPEC.x + 1.2, BASE_TOP + 0.8, [1.5, 3], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  // Text on spec plate
  out.push(k.faceTextSvg(k.topMatrix([-23, -12], BASE_TOP + 0.8, P, "y"), "AC 220V 50Hz", { size: 2.2, tone: "lo", anchor: "middle" }));
  out.push(k.faceTextSvg(k.topMatrix([-23, -2], BASE_TOP + 0.8, P, "y"), "400mm 55W", { size: 2.2, tone: "lo", anchor: "middle" }));
  out.push(k.faceTextSvg(k.topMatrix([-23, 8], BASE_TOP + 0.8, P, "y"), "3-SPEED FAN", { size: 2.0, tone: "mid", anchor: "middle" }));
  // Spec plate rivets
  out.push(D([[SPEC.x + 2, SPEC.y + 2, BASE_TOP + 0.8], [SPEC.x + SPEC.w - 2, SPEC.y + 2, BASE_TOP + 0.8], [SPEC.x + 2, SPEC.y + SPEC.d - 2, BASE_TOP + 0.8], [SPEC.x + SPEC.w - 2, SPEC.y + SPEC.d - 2, BASE_TOP + 0.8]].map(pt => at(pt)), { size: 0.35, tone: "lo" }));

  // Power cord exiting rear of base
  const cordRoot = [-44, 0, 4];
  const cordVia = [
    [-52, -2, 2],
    [-60, -10, -3],
    [-68, -25, -FOOT_H],
    [-74, -45, -FOOT_H],
  ];
  out.push(S(k.cylinder(cordRoot[0], cordRoot[1], 3.2, cordRoot[2] - 2, 4, P, 16), { tone: "lo" }));
  out.push(k.wireSvg(at(cordRoot), at(cordVia[cordVia.length - 1]), { via: cordVia.slice(0, -1).map(p => at(p)), tone: "lo", size: 1.1, ends: "to" }));

  return out.join("");
}

// Upright Column and Telescoping Mast
function column() {
  const out = [];

  // Mast base reinforcement collar
  out.push(S(k.cylinder(MAST[0], MAST[1], 10, BASE_TOP, 7, P, 28, 0.8), { tone: "mid" }));
  out.push(L(k.ring(MAST[0], MAST[1], 8, BASE_TOP + 7, P, 24), { tone: "faint" }));

  // Main lower mast cylinder
  out.push(S(k.cylinder(MAST[0], MAST[1], 6.5, BASE_TOP + 7, LOWER_MAST_TOP - (BASE_TOP + 7), P, 24), { tone: "mid", crease: "none" }));
  // Vertical ruler ticks along the column
  for (let z = BASE_TOP + 16; z <= LOWER_MAST_TOP - 8; z += 6) {
    const isMajor = Math.round((z - (BASE_TOP + 16)) / 6) % 3 === 0;
    const len = isMajor ? 3.2 : 1.6;
    const p1 = [MAST[0] + 6.5 * Math.cos(Math.PI * 0.25), MAST[1] + 6.5 * Math.sin(Math.PI * 0.25), z];
    const p2 = [MAST[0] + (6.5 - len) * Math.cos(Math.PI * 0.25), MAST[1] + (6.5 - len) * Math.sin(Math.PI * 0.25), z];
    out.push(L(k.segment(p1, p2, P), { tone: isMajor ? "mid" : "lo" }));
  }

  // Telescoping height adjustment collar
  out.push(S(k.cylinder(MAST[0], MAST[1], 8.5, LOWER_MAST_TOP, COLLAR_TOP - LOWER_MAST_TOP, P, 28, 0.6), { tone: "mid" }));
  // Knurled thumb knob on the collar
  const knobPos = [MAST[0] - 8.5, MAST[1]];
  out.push(S(k.cylinder(knobPos[0] - 3.5, knobPos[1], 4, LOWER_MAST_TOP + 2, 6, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(knobPos[0] - 3.5, knobPos[1], 4, LOWER_MAST_TOP + 2, LOWER_MAST_TOP + 8, 20, P), { tone: "lo" }));

  // Upper chrome telescoping tube
  out.push(S(k.cylinder(MAST[0], MAST[1], 5, COLLAR_TOP, UPPER_MAST_TOP - COLLAR_TOP, P, 24), { tone: "hi", crease: "none" }));

  // Neck U-fork hinge bracket
  const FORK = { x: -6, y: -7, w: 12, d: 14, r: 2 };
  out.push(S(k.slabOf(FORK, UPPER_MAST_TOP, 14, P, 4, 0.6), { tone: "mid" }));
  // Tilt pivot pin & wing bolt
  const tiltX = FORK.x + FORK.w + 1;
  out.push(S(k.cylinder(tiltX, 0, 4.2, PIVOT_Z - 3, 6, P, 18), { tone: "lo" }));
  out.push(L(k.knurl(tiltX, 0, 4.2, PIVOT_Z - 3, PIVOT_Z + 3, 16, P), { tone: "faint" }));

  // Flexible power cable conduit from column up into motor
  const conduitFrom = [MAST[0] - 5, MAST[1], UPPER_MAST_TOP];
  const conduitVia = [
    [MAST[0] - 10, MAST[1] - 4, UPPER_MAST_TOP + 8],
    [MAST[0] - 14, MAST[1] - 6, HEAD_Z - 4],
  ];
  const conduitTo = [-18, 0, HEAD_Z - 6];
  out.push(k.wireSvg(at(conduitFrom), at(conduitTo), { via: conduitVia.map(p => at(p)), tone: "lo", size: 0.9, ends: "none" }));

  return out.join("");
}

// Build fan head template elements that will be dynamically updated
function headTemplate() {
  const out = [];

  // Rear oscillating reduction gearbox
  out.push(`<path class="iso-fill" data-head="gearbox-fill" fill="var(--anatomy-paper)"/>`);
  out.push(`<path class="iso-line" data-head="gearbox-edge" data-tone="mid"/>`);

  // Oscillating clutch pull/push knob
  out.push(`<g class="iso-clutch" data-head="clutch" style="cursor:pointer">`);
  out.push(`<path class="iso-fill" data-head="clutch-fill" fill="var(--anatomy-face)"/>`);
  out.push(`<path class="iso-line" data-head="clutch-edge" data-tone="hi"/>`);
  out.push(`</g>`);

  // Four-bar connecting linkage from gearbox to neck
  out.push(`<path class="iso-line" data-head="linkage" data-tone="mid" style="stroke-width:1.5"/>`);

  // Motor cylindrical body hull and rings
  out.push(`<polygon class="iso-fill" data-head="motor-hull" fill="var(--anatomy-paper)"/>`);
  out.push(`<path class="iso-line" data-head="motor-rings" data-tone="faint"/>`);
  out.push(`<path class="iso-line" data-head="motor-louvers" data-tone="lo"/>`);

  // Front motor end bell, bearing & shaft
  out.push(`<polygon class="iso-fill" data-head="motor-front-fill" fill="var(--anatomy-paper)"/>`);
  out.push(`<path class="iso-line" data-head="motor-front" data-tone="mid"/>`);
  out.push(`<path class="iso-line" data-head="shaft" data-tone="lit"/>`);

  // Rear protective wire cage (outer rim + concentric rings + spokes)
  out.push(`<path class="iso-line" data-head="rear-cage" data-tone="lo"/>`);
  out.push(`<path class="iso-line" data-head="rear-spokes" data-tone="faint"/>`);

  // Rotating impeller (3 aerodynamic blades)
  out.push(`<g data-part="rotor">`);
  for (let b = 0; b < 3; b++) {
    out.push(`<path class="iso-fill" data-blade="${b}" fill="var(--anatomy-face)"/>`);
    out.push(`<path class="iso-line" data-blade-edge="${b}" data-tone="lit" style="stroke-width:1"/>`);
  }
  out.push(`<path class="iso-line" data-head="spinner" data-tone="lit"/>`);
  out.push(`</g>`);

  // Front protective wire cage
  out.push(`<path class="iso-line" data-head="front-cage" data-tone="lo"/>`);
  out.push(`<path class="iso-line" data-head="front-spokes" data-tone="faint"/>`);

  // Front brand medallion badge
  out.push(`<path class="iso-fill" data-head="medallion-fill" fill="var(--anatomy-paper)"/>`);
  out.push(`<path class="iso-line" data-head="medallion-edge" data-tone="hi"/>`);

  // Airflow streamlines
  out.push(`<g data-part="airflow" class="iso-airflow">`);
  for (let s = 0; s < 5; s++) {
    out.push(`<path class="iso-line iso-streamline" data-stream="${s}" data-flow="" data-tone="blue" style="stroke-width:1.2;opacity:0.85"/>`);
  }
  out.push(`</g>`);

  return out.join("");
}

// Assemble entire SVG figure
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "An isometric anatomy illustration of an electric table fan with live 3D horizontal oscillation and aerodynamic rotating blades.",
  body: [
    base(),
    column(),
    `<g data-part="head">${headTemplate()}</g>`,
  ],
});

// Interactive live browser script with true 3D yaw oscillation
const liveScript = `
const P = ${JSON.stringify(P)};
const PIVOT_Z = ${PIVOT_Z};
const HEAD_Z = ${HEAD_Z};
const cageX = 22, cageR = 52;

const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const led = svg.querySelector("[data-led]");
const airflowGroup = svg.querySelector('[data-part="airflow"]');
const clutch = svg.querySelector(".iso-clutch");
const buttons = [...svg.querySelectorAll(".iso-btn")];

// Element references in fan head
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

const SPEEDS = [
  { rpm: 0, wind: 0, power: 0, name: "Off" },
  { rpm: 800, wind: 2.8, power: 28, name: "1 (Low / 微风)" },
  { rpm: 1100, wind: 4.2, power: 42, name: "2 (Medium / 清凉)" },
  { rpm: 1450, wind: 5.8, power: 58, name: "3 (High / 强劲)" },
];

let currentSpeed = 2;
let targetRpm = SPEEDS[currentSpeed].rpm;
let actualRpm = targetRpm;
let bladeAngle = 0;
let oscillating = true;
let oscAngle = 0;
let oscTimer = 0;
let lastTime = 0;
let frameId = 0;
let visible = true;

// 3D coordinate transform with yaw
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

// Full 3D procedural rendering of fan head at any yaw and blade angle
function renderHead(yaw, bAngle) {
  // 1. Gearbox
  const gbZ0 = HEAD_Z - 12;
  const gbZ1 = HEAD_Z + 12;
  const gbCornersTop = [
    tr(-44, -11, gbZ1, yaw),
    tr(-24, -11, gbZ1, yaw),
    tr(-24, 11, gbZ1, yaw),
    tr(-44, 11, gbZ1, yaw),
  ];
  const gbCornersBot = [
    tr(-44, -11, gbZ0, yaw),
    tr(-24, -11, gbZ0, yaw),
    tr(-24, 11, gbZ0, yaw),
    tr(-44, 11, gbZ0, yaw),
  ];
  const gbTopScreen = toScreen(gbCornersTop);
  const gbBotScreen = toScreen(gbCornersBot);
  
  // Gearbox outline and face paths
  const gbFillD = pathOf([...gbTopScreen, gbBotScreen[1], gbBotScreen[2], gbBotScreen[3]], true);
  const gbEdgeD = pathOf(gbTopScreen, true) + 
                  pathOf([gbTopScreen[0], gbBotScreen[0]]) +
                  pathOf([gbTopScreen[1], gbBotScreen[1]]) +
                  pathOf([gbTopScreen[2], gbBotScreen[2]]) +
                  pathOf([gbTopScreen[3], gbBotScreen[3]]) +
                  pathOf(gbBotScreen, true);
  if (elGearboxFill) elGearboxFill.setAttribute("d", gbFillD);
  if (elGearboxEdge) elGearboxEdge.setAttribute("d", gbEdgeD);

  // 2. Clutch Knob (toggles up 4 units when disengaged)
  const clutchLift = oscillating ? 0 : 4;
  const clutchTop = HEAD_Z + 12 + 6 + clutchLift;
  const clutchPts = toScreen(circlePts(-34, 0, clutchTop, 3.5, 16, yaw));
  const clutchStem = toScreen([tr(-34, 0, HEAD_Z + 12, yaw), tr(-34, 0, clutchTop, yaw)]);
  if (elClutchFill) elClutchFill.setAttribute("d", pathOf(clutchPts, true));
  if (elClutchEdge) elClutchEdge.setAttribute("d", pathOf(clutchPts, true) + pathOf(clutchStem));

  // 3. Linkage connecting rod (Bottom crank pin to fixed column neck)
  const crankPin = tr(-34, 0, HEAD_Z - 14, yaw);
  const neckPivot = [0, 0, PIVOT_Z + 1];
  if (elLinkage) elLinkage.setAttribute("d", pathOf(toScreen([crankPin, neckPivot])));

  // 4. Motor Cylindrical Body
  const motorX0 = -24;
  const motorX1 = 8;
  const motorR = 15;
  const backRing = circlePts(motorX0, 0, HEAD_Z, motorR, 24, yaw);
  const frontRing = circlePts(motorX1, 0, HEAD_Z, motorR, 24, yaw);
  const backScr = toScreen(backRing);
  const frontScr = toScreen(frontRing);
  const hullScr = [...frontScr, ...[...backScr].reverse()];
  if (elMotorHull) elMotorHull.setAttribute("points", hullScr.map(p => Math.round(p[0]*10)/10 + "," + Math.round(p[1]*10)/10).join(" "));

  let ringsD = "";
  for (let x = motorX0; x <= motorX1; x += 6) {
    ringsD += pathOf(toScreen(circlePts(x, 0, HEAD_Z, motorR, 24, yaw)), true);
  }
  if (elMotorRings) elMotorRings.setAttribute("d", ringsD);

  let louversD = "";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p1 = tr(motorX0 + 3, motorR * Math.cos(a), HEAD_Z + motorR * Math.sin(a), yaw);
    const p2 = tr(motorX1 - 3, motorR * Math.cos(a), HEAD_Z + motorR * Math.sin(a), yaw);
    louversD += pathOf(toScreen([p1, p2]));
  }
  if (elMotorLouvers) elMotorLouvers.setAttribute("d", louversD);

  // 5. Front Bell, Bearing & Shaft
  const bellScr = toScreen(circlePts(12, 0, HEAD_Z, 10, 20, yaw));
  const bushingScr = toScreen(circlePts(16, 0, HEAD_Z, 5.5, 16, yaw));
  if (elMotorFrontFill) elMotorFrontFill.setAttribute("points", bellScr.map(p => Math.round(p[0]*10)/10 + "," + Math.round(p[1]*10)/10).join(" "));
  if (elMotorFront) elMotorFront.setAttribute("d", pathOf(bellScr, true) + pathOf(bushingScr, true));
  const shaftP1 = tr(16, 0, HEAD_Z, yaw);
  const shaftP2 = tr(28, 0, HEAD_Z, yaw);
  if (elShaft) elShaft.setAttribute("d", pathOf(toScreen([shaftP1, shaftP2])));

  // 6. Rear Wire Guard
  const rearRimScr = toScreen(circlePts(cageX - 2, 0, HEAD_Z, cageR, 36, yaw));
  const rearHoop1Scr = toScreen(circlePts(cageX - 4, 0, HEAD_Z, 34, 24, yaw));
  const rearHoop2Scr = toScreen(circlePts(cageX - 6, 0, HEAD_Z, 18, 18, yaw));
  if (elRearCage) elRearCage.setAttribute("d", pathOf(rearRimScr, true) + pathOf(rearHoop1Scr, true) + pathOf(rearHoop2Scr, true));

  let rearSpokesD = "";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const pIn = tr(cageX - 6, 12 * Math.cos(a), HEAD_Z + 12 * Math.sin(a), yaw);
    const pOut = tr(cageX - 2, cageR * Math.cos(a), HEAD_Z + cageR * Math.sin(a), yaw);
    rearSpokesD += pathOf(toScreen([pIn, pOut]));
  }
  if (elRearSpokes) elRearSpokes.setAttribute("d", rearSpokesD);

  // 7. Rotating Blades
  for (let b = 0; b < 3; b++) {
    const baseA = bAngle + b * (Math.PI * 2 / 3);
    const bladeCurve = [];
    const steps = 10;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const r = 8.5 + t * (cageR - 10);
      const sweep = Math.sin(t * Math.PI * 0.7) * 0.28;
      const a = baseA + sweep;
      const pitch = (1 - t) * 3;
      bladeCurve.push(tr(cageX + pitch, r * Math.cos(a), HEAD_Z + r * Math.sin(a), yaw));
    }
    for (let s = steps; s >= 0; s--) {
      const t = s / steps;
      const r = 8.5 + t * (cageR - 10);
      const width = Math.sin(t * Math.PI) * 11;
      const sweep = Math.sin(t * Math.PI * 0.7) * 0.28 + width / r;
      const a = baseA + sweep;
      const pitch = -(1 - t) * 3;
      bladeCurve.push(tr(cageX + pitch, r * Math.cos(a), HEAD_Z + r * Math.sin(a), yaw));
    }
    const bD = pathOf(toScreen(bladeCurve), true);
    if (elBlades[b]) elBlades[b].setAttribute("d", bD);
    if (elBladeEdges[b]) elBladeEdges[b].setAttribute("d", bD);
  }

  // Spinner Bullet Nut
  const spTip = tr(cageX + 12, 0, HEAD_Z, yaw);
  const spRing = circlePts(cageX + 4, 0, HEAD_Z, 5, 16, yaw);
  let spD = pathOf(toScreen(spRing), true);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const pt = tr(cageX + 4, 5 * Math.cos(a), HEAD_Z + 5 * Math.sin(a), yaw);
    spD += pathOf(toScreen([pt, spTip]));
  }
  if (elSpinner) elSpinner.setAttribute("d", spD);

  // 8. Front Wire Guard
  const frontRimScr = toScreen(circlePts(cageX + 5, 0, HEAD_Z, cageR, 36, yaw));
  const frontRing1Scr = toScreen(circlePts(cageX + 6, 0, HEAD_Z, 42, 28, yaw));
  const frontRing2Scr = toScreen(circlePts(cageX + 7, 0, HEAD_Z, 28, 22, yaw));
  const frontRing3Scr = toScreen(circlePts(cageX + 8, 0, HEAD_Z, 16, 16, yaw));
  if (elFrontCage) elFrontCage.setAttribute("d", pathOf(frontRimScr, true) + pathOf(frontRing1Scr, true) + pathOf(frontRing2Scr, true) + pathOf(frontRing3Scr, true));

  let frontSpokesD = "";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const pIn = tr(cageX + 8, 11 * Math.cos(a), HEAD_Z + 11 * Math.sin(a), yaw);
    const pOut = tr(cageX + 5, cageR * Math.cos(a), HEAD_Z + cageR * Math.sin(a), yaw);
    frontSpokesD += pathOf(toScreen([pIn, pOut]));
  }
  if (elFrontSpokes) elFrontSpokes.setAttribute("d", frontSpokesD);

  // 9. Front Center Medallion
  const medScr = toScreen(circlePts(cageX + 8.5, 0, HEAD_Z, 11, 20, yaw));
  const medInnerScr = toScreen(circlePts(cageX + 8.5, 0, HEAD_Z, 8, 16, yaw));
  if (elMedallionFill) elMedallionFill.setAttribute("d", pathOf(medScr, true));
  if (elMedallionEdge) elMedallionEdge.setAttribute("d", pathOf(medScr, true) + pathOf(medInnerScr, true));

  // 10. Dynamic Airflow Streamlines (Blow forward in direction of yaw)
  const streamOffsets = [
    [0, 0, 0],
    [0, 22, 16],
    [0, -22, 16],
    [0, 20, -18],
    [0, -20, -18],
  ];
  streamOffsets.forEach(([dx, dy, dz], idx) => {
    const pStart = tr(cageX + 12 + dx, dy, HEAD_Z + dz, yaw);
    const pEnd = tr(cageX + 85 + dx, dy * 1.35, HEAD_Z + dz * 1.35, yaw);
    const pMid1 = tr(cageX + 35 + dx, dy * 1.1, HEAD_Z + dz * 1.1 + Math.sin(idx) * 3, yaw);
    const pMid2 = tr(cageX + 60 + dx, dy * 1.25, HEAD_Z + dz * 1.25 - Math.cos(idx) * 3, yaw);
    const stD = pathOf(toScreen([pStart, pMid1, pMid2, pEnd]));
    if (elStreams[idx]) elStreams[idx].setAttribute("d", stD);
  });
}

function setSpeed(idx) {
  currentSpeed = idx;
  targetRpm = SPEEDS[idx].rpm;
  buttons.forEach((btn, i) => {
    btn.style.opacity = (i === idx) ? "1.0" : "0.65";
    btn.style.transform = (i === idx) ? "translateY(1px)" : "none";
  });
  if (led) {
    led.setAttribute("fill", idx > 0 ? "var(--anatomy-green)" : "var(--anatomy-lo)");
  }
  if (airflowGroup) {
    airflowGroup.style.display = idx > 0 ? "block" : "none";
    airflowGroup.style.opacity = String(0.3 + (idx / 3) * 0.7);
  }
}

function toggleOscillation() {
  oscillating = !oscillating;
  renderHead(oscAngle, bladeAngle);
}

function updateReadout() {
  const spd = SPEEDS[currentSpeed];
  const deg = (oscAngle * 180 / Math.PI).toFixed(1);
  const oscStatus = oscillating ? ("Oscillating (" + (deg >= 0 ? "+" : "") + deg + "°)") : ("Fixed (at " + deg + "°)");
  const text = "Speed " + currentSpeed + " · " + Math.round(actualRpm) + " RPM · " + (spd.wind * (actualRpm / (spd.rpm || 1))).toFixed(1) + " m/s · " + spd.power + "W · " + oscStatus;
  readout.textContent = text;
}

function tick(now) {
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
  lastTime = now;

  // Smooth RPM spin-up / spin-down physics
  actualRpm += (targetRpm - actualRpm) * (1 - Math.exp(-dt / 0.8));
  if (Math.abs(targetRpm - actualRpm) < 0.5) actualRpm = targetRpm;

  // Blade rotation
  bladeAngle += actualRpm * dt * (Math.PI * 2 / 60);

  // Oscillation kinematics: 32° amplitude harmonic yaw sweep
  if (oscillating && actualRpm > 10) {
    oscTimer += dt * (actualRpm / 1100) * 0.95;
    oscAngle = Math.sin(oscTimer) * (32 * Math.PI / 180);
  }

  // Update complete 3D head geometry and airflow
  renderHead(oscAngle, bladeAngle);
  updateReadout();

  if (visible) {
    frameId = requestAnimationFrame(tick);
  }
}

// Interactive event bindings
buttons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const idx = Number(btn.dataset.btn);
    setSpeed(idx);
  });
});

if (clutch) {
  clutch.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleOscillation();
  });
}

// Drag / steering when mouse moves over stage
let dragging = false;
stage.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".iso-btn") || e.target.closest(".iso-clutch")) return;
  dragging = true;
});
window.addEventListener("pointerup", () => { dragging = false; });
stage.addEventListener("pointermove", (e) => {
  if (dragging && !oscillating) {
    const rect = stage.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    oscAngle = nx * (60 * Math.PI / 180);
    renderHead(oscAngle, bladeAngle);
    updateReadout();
  }
});

stage.addEventListener("keydown", (e) => {
  if (["0", "1", "2", "3"].includes(e.key)) {
    setSpeed(Number(e.key));
  } else if (e.key === "o" || e.key === "O" || e.key === " ") {
    toggleOscillation();
  } else if (e.key === "ArrowLeft") {
    oscillating = false;
    oscAngle = Math.max(-0.6, oscAngle - 0.08);
    renderHead(oscAngle, bladeAngle);
    updateReadout();
  } else if (e.key === "ArrowRight") {
    oscillating = false;
    oscAngle = Math.min(0.6, oscAngle + 0.08);
    renderHead(oscAngle, bladeAngle);
    updateReadout();
  }
});

new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible && !frameId) {
    lastTime = 0;
    frameId = requestAnimationFrame(tick);
  } else if (!visible && frameId) {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
}, { rootMargin: "100px" }).observe(stage);

setSpeed(currentSpeed);
renderHead(0, 0);
updateReadout();
frameId = requestAnimationFrame(tick);
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Electric Fan Anatomy & Oscillation",
  hint: "0–3: SPEED · CLUTCH / O: OSCILLATE · DRAG: AIM",
  readout: "Speed 2 · 1100 RPM · 4.2 m/s · 42W · Oscillating (+0.0°)",
  keys: [
    { mark: "lit", label: "Aerodynamic blades: skew pitch angle converts rotary torque into continuous axial momentum" },
    { mark: "raised", label: "Worm reduction & crank linkage: 1:90 gear ratio powers ±32° horizontal yaw oscillation" },
    { mark: "blue", label: "Directional airflow cone: sweeps dynamically across the room following head oscillation" },
  ],
  caption:
    "An isometric mechanism study of an oscillating electric fan. The motor converts AC electric energy into electromagnetic rotational torque. Skewed airfoil blades generate axial thrust and forward airflow. A worm reduction gearbox and four-bar eccentric crank linkage drive the head in a ±32° horizontal yaw sweep, steering the airflow cone across the room.",
  body: `<div class="iso-stage" tabindex="0" role="region" aria-label="Electric Fan Interactive Figure">${svg}</div>`,
});

const outHtml = k.pageHtml({
  title: "Electric Fan Anatomy & Airflow Mechanics",
  theme,
  body,
  script: kitScript() + liveScript,
  width: 780,
});

const fileName = theme === "light" ? "index-light.html" : "index.html";
writeFileSync(join(HERE, fileName), outHtml);
console.log("wrote", fileName);
