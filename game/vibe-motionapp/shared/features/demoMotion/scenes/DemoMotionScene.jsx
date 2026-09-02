import React, { useEffect } from "react";
import { interpolate } from "remotion";

const hue = (baseHue, offset) => (baseHue + offset + 360) % 360;

export const DemoMotionScene = ({ 
  text = "RollingText", 
  accentHue = 210, 
  darkMode = false, 
  speed = 1,
  linesCount = 4,
  fontSize = 18,
  frame = 0, 
  layout, 
  onAutoLayoutReady 
}) => {
  useEffect(() => {
    onAutoLayoutReady?.();
  }, [onAutoLayoutReady]);

  // Use props instead of Remotion hooks so it works in both Remotion and Web preview
  const fps = 30; // Project default
  const width = layout?.videoWidth ?? 1080;
  const isDarkCard = Boolean(darkMode);

  // Use text prop
  const resolvedText = text || "RollingText";
  const chars = resolvedText.split("");
  // Create lines array dynamically based on linesCount prop
  const lines = Array.from({ length: Math.max(1, linesCount) }, (_, i) => i);
  
  // 3D setup
  const depth = -width / 8;
  const transformOrigin = `50% 50% ${depth}px`;
  
  // Timings from GSAP (in frames), scaled by the speed parameter
  const animTimeFrames = Math.max(1, (0.9 * fps) / speed);
  const charStaggerFrames = (0.08 * fps) / Math.max(0.1, speed);
  const lineStaggerFrames = (0.45 * fps) / Math.max(0.1, speed);
  
  // Calculate total timeline duration matching GSAP repeat loop
  const tlDurationFrames = Math.round(
    lineStaggerFrames * (lines.length - 1) + 
    charStaggerFrames * (chars.length - 1) + 
    animTimeFrames
  );
  
  // Current frame wrapped within the timeline loop duration
  const currentTlFrame = frame % Math.max(1, tlDurationFrames);

  // Generate color based on accentHue
  const textColor = isDarkCard ? `hsl(${hue(accentHue, 2)} 94% 86%)` : `hsl(${hue(accentHue, -14)} 82% 28%)`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "transparent", // background transparent
        perspective: "700px",
        transformStyle: "preserve-3d"
      }}
    >
      <div 
        style={{ 
          position: "relative", 
          width: "100%", 
          height: `${fontSize * 1.5}vw`, 
          transformStyle: "preserve-3d" 
        }}
      >
        {lines.map((lineIndex) => {
          return (
            <h1
              key={lineIndex}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                lineHeight: 1,
                margin: 0,
                letterSpacing: "-0.6vw",
                fontSize: `${fontSize}vw`,
                whiteSpace: "nowrap",
                textAlign: "center",
                display: "flex",
                transformStyle: "preserve-3d",
                color: textColor,
                fontFamily: "sans-serif",
                textShadow: isDarkCard
                  ? `0 10px 32px rgba(15, 23, 42, 0.45)`
                  : `0 8px 24px rgba(148, 163, 184, 0.22)`,
              }}
            >
              {chars.map((char, charIndex) => {
                const startTime = lineIndex * lineStaggerFrames + charIndex * charStaggerFrames;
                const localFrame = currentTlFrame - startTime;
                
                let rotationX = -90; // Default state before animation
                if (localFrame > 0 && localFrame < animTimeFrames) {
                  // Animating
                  rotationX = interpolate(localFrame, [0, animTimeFrames], [-90, 90]);
                } else if (localFrame >= animTimeFrames) {
                  // Completed state for this loop cycle
                  rotationX = 90;
                }
                
                return (
                  <div
                    key={charIndex}
                    style={{
                      transform: `rotateX(${rotationX}deg)`,
                      transformOrigin,
                      backfaceVisibility: "hidden",
                      transformStyle: "preserve-3d"
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </div>
                );
              })}
            </h1>
          );
        })}
      </div>
    </div>
  );
};
