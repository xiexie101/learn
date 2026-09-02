const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
};

const toInt = (value, fallback, min, max) =>
  Math.round(clamp(toNumber(value, fallback), min, max));

const toText = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const resolved = value.trim();
  return resolved.length > 0 ? resolved : fallback;
};

const toBoolean = (value, fallback) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on", "dark"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off", "light"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
};

export const DEFAULT_TEMPLATE_LAYOUT_PARAMS = Object.freeze({
  videoWidth: 1080,
  videoHeight: 1080,
});

export const DEFAULT_DEMO_MOTION_ANIMATION_PARAMS = Object.freeze({
  text: "RollingText",
  darkMode: false,
  durationSeconds: 3,
  speed: 1,
  accentHue: 210,
  linesCount: 4,
  fontSize: 18,
});

export const DEFAULT_DEMO_MOTION_PLUGIN_PARAMS = Object.freeze({
  ...DEFAULT_TEMPLATE_LAYOUT_PARAMS,
  ...DEFAULT_DEMO_MOTION_ANIMATION_PARAMS,
});

export const DEFAULT_DEMO_MOTION_PROPS = DEFAULT_DEMO_MOTION_PLUGIN_PARAMS;

export const DEMO_MOTION_PARAM_FIELDS = Object.freeze([
  {
    key: "text",
    label: "text",
    control: "text",
    section: "primary",
  },
  {
    key: "darkMode",
    label: "darkMode",
    control: "switch",
    section: "primary",
  },
  {
    key: "videoWidth",
    label: "videoWidth",
    control: "select",
    section: "layout",
    options: [480, 540, 720, 1080, 1280],
  },
  {
    key: "videoHeight",
    label: "videoHeight",
    control: "select",
    section: "layout",
    options: [480, 540, 720, 1080, 1280],
  },
  {
    key: "durationSeconds",
    label: "durationSeconds",
    control: "number",
    section: "animation",
    min: 1,
    max: 30,
    step: 0.5,
  },
  {
    key: "speed",
    label: "speed",
    control: "range",
    section: "animation",
    min: 0.1,
    max: 3,
    step: 0.1,
  },
  {
    key: "accentHue",
    label: "accentHue",
    control: "number",
    section: "animation",
    min: 0,
    max: 360,
    step: 1,
  },
  {
    key: "linesCount",
    label: "linesCount",
    control: "number",
    section: "animation",
    min: 1,
    max: 10,
    step: 1,
  },
  {
    key: "fontSize",
    label: "fontSize (vw)",
    control: "number",
    section: "animation",
    min: 5,
    max: 40,
    step: 1,
  },
]);

export const normalizeDemoMotionParamValue = ({ key, rawValue, currentValue } = {}) => {
  switch (key) {
    case "text":
      return toText(rawValue, DEFAULT_DEMO_MOTION_PLUGIN_PARAMS.text);
    case "darkMode":
      return toBoolean(rawValue, DEFAULT_DEMO_MOTION_PLUGIN_PARAMS.darkMode);
    case "videoWidth":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PLUGIN_PARAMS.videoWidth, 480, 1280);
    case "videoHeight":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PLUGIN_PARAMS.videoHeight, 480, 1280);
    case "durationSeconds":
      return clamp(
        toNumber(rawValue, DEFAULT_DEMO_MOTION_PLUGIN_PARAMS.durationSeconds),
        1,
        30
      );
    case "speed":
      return clamp(toNumber(rawValue, DEFAULT_DEMO_MOTION_PLUGIN_PARAMS.speed), 0.1, 3);
    case "accentHue":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PLUGIN_PARAMS.accentHue, 0, 360);
    case "linesCount":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PLUGIN_PARAMS.linesCount, 1, 10);
    case "fontSize":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PLUGIN_PARAMS.fontSize, 5, 40);
    default:
      return currentValue ?? rawValue;
  }
};
