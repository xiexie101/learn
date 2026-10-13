import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import subprocess
import os
import sys
import time

# --- CONFIGURATION ---
WIDTH = 1920
HEIGHT = 1080
FPS = 60
DURATION = 15.0
TOTAL_FRAMES = int(FPS * DURATION) # 900 frames

OUTPUT_VIDEO = "webapp/motion-showreel/motion_designer_showreel_15s.mp4"
AUDIO_FILE = "webapp/motion-showreel/audio.wav"

# --- FONTS ---
FONT_TITLE = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_ZH = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

font_massive = load_font(FONT_TITLE, 140)
font_huge = load_font(FONT_TITLE, 96)
font_big = load_font(FONT_TITLE, 56)
font_med = load_font(FONT_TITLE, 34)
font_sm = load_font(FONT_MONO, 20)
font_micro = load_font(FONT_MONO, 15)

font_zh_huge = load_font(FONT_ZH, 56)
font_zh_title = load_font(FONT_ZH, 40)
font_zh_med = load_font(FONT_ZH, 28)
font_zh_sm = load_font(FONT_ZH, 20)

# --- COLOR PALETTE (RGB) ---
COLOR_BG = (10, 12, 18)
COLOR_CYAN = (0, 240, 255)
COLOR_ACID = (204, 255, 0)
COLOR_MAGENTA = (255, 0, 85)
COLOR_WHITE = (255, 255, 255)
COLOR_MUTED = (120, 135, 160)
COLOR_DARK_GRID = (28, 36, 52)

# --- MATH & EASING HELPERS ---
def ease_out_expo(t):
    return 1.0 if t >= 1.0 else 1.0 - math.pow(2.0, -10.0 * t)

def ease_out_elastic(t):
    if t <= 0: return 0.0
    if t >= 1: return 1.0
    p = 0.3
    return math.pow(2, -10 * t) * math.sin((t - p / 4) * (2 * math.pi) / p) + 1.0

def ease_in_out_cubic(t):
    return 4 * t * t * t if t < 0.5 else 1 - math.pow(-2 * t + 2, 3) / 2

# Pre-generate 3D icosahedron vertices & edges
PHI = (1.0 + math.sqrt(5.0)) / 2.0
RAW_ICOSA_VERTS = [
    [-1,  PHI, 0], [ 1,  PHI, 0], [-1, -PHI, 0], [ 1, -PHI, 0],
    [ 0, -1,  PHI], [ 0,  1,  PHI], [ 0, -1, -PHI], [ 0,  1, -PHI],
    [ PHI, 0, -1], [ PHI, 0,  1], [-PHI, 0, -1], [-PHI, 0,  1]
]
ICOSA_SCALE = 240.0 / math.sqrt(1.0 + PHI * PHI)
ICOSA_VERTS = [[v[0] * ICOSA_SCALE, v[1] * ICOSA_SCALE, v[2] * ICOSA_SCALE] for v in RAW_ICOSA_VERTS]

ICOSA_EDGES = []
for i in range(len(ICOSA_VERTS)):
    for j in range(i + 1, len(ICOSA_VERTS)):
        d_sq = sum((ICOSA_VERTS[i][k] - ICOSA_VERTS[j][k])**2 for k in range(3))
        if abs(d_sq - (4 * (240.0**2) / (1 + PHI**2))) < 600:
            ICOSA_EDGES.append((i, j))

# Pre-generate floating particles
np.random.seed(42)
NUM_PARTICLES = 120
PARTICLES = [
    {
        "x": np.random.uniform(100, WIDTH - 100),
        "y": np.random.uniform(100, HEIGHT - 100),
        "z": np.random.uniform(0.2, 1.0),
        "speed": np.random.uniform(20, 80),
        "size": np.random.uniform(1.5, 3.5),
        "color": COLOR_CYAN if np.random.rand() > 0.4 else COLOR_ACID
    }
    for _ in range(NUM_PARTICLES)
]

# --- FRAME RENDERING ---
def render_frame(frame_idx):
    t = frame_idx / FPS
    
    # 1. Base image & gradient/vignette
    img = Image.new("RGB", (WIDTH, HEIGHT), COLOR_BG)
    draw = ImageDraw.Draw(img)
    
    # Background Grid Dots
    dot_gap = 120
    for gx in range(60, WIDTH - 60, dot_gap):
        for gy in range(60, HEIGHT - 60, dot_gap):
            draw.point((gx, gy), fill=COLOR_DARK_GRID)

    # Floating background particles with parallax drift
    for p in PARTICLES:
        px = (p["x"] + t * p["speed"] * p["z"]) % (WIDTH - 160) + 80
        py = (p["y"] + math.sin(t * 1.5 + p["x"]) * 20 * p["z"]) % (HEIGHT - 160) + 80
        pr = p["size"] * p["z"]
        draw.ellipse([(px - pr, py - pr), (px + pr, py + pr)], fill=p["color"])

    # 2. Universal HUD Framing & Timecode
    draw.rectangle([(40, 40), (WIDTH - 40, HEIGHT - 40)], outline=(35, 45, 65), width=1)
    bracket_len = 28
    for bx, by in [(40, 40), (WIDTH - 40, 40), (40, HEIGHT - 40), (WIDTH - 40, HEIGHT - 40)]:
        dx = bracket_len if bx == 40 else -bracket_len
        dy = bracket_len if by == 40 else -bracket_len
        draw.line([(bx, by), (bx + dx, by)], fill=COLOR_CYAN, width=2)
        draw.line([(bx, by), (bx, by + dy)], fill=COLOR_CYAN, width=2)

    # Metadata & Timecode HUD
    tc_sec = int(t)
    tc_frame = frame_idx % FPS
    tc_str = f"TC // 00:{tc_sec:02d}:{tc_frame:02d}:00"
    draw.text((60, 56), tc_str, font=font_sm, fill=COLOR_ACID)
    draw.text((WIDTH - 420, 56), "ANTIGRAVITY MOTION SHOWREEL '26", font=font_sm, fill=COLOR_MUTED)
    draw.text((60, HEIGHT - 76), f"FPS: 60.0 LOCKED  |  FRAME: {frame_idx:04d} / {TOTAL_FRAMES:04d}", font=font_sm, fill=COLOR_MUTED)
    draw.text((WIDTH - 360, HEIGHT - 76), "AUTHOR: SHERWIN XIE", font=font_sm, fill=COLOR_CYAN)

    # Dynamic Progress Bar along bottom
    prog_w = int((WIDTH - 80) * (t / DURATION))
    draw.line([(40, HEIGHT - 40), (40 + prog_w, HEIGHT - 40)], fill=COLOR_ACID, width=3)

    # 3. ACT-SPECIFIC MOTION GRAPHICS CHOREOGRAPHY
    chromatic_shift = 0

    if t < 3.0:
        # === ACT I: KINETIC AWAKENING [0.0s - 3.0s] ===
        if t < 0.5:
            # 0.0s - 0.5s: Booting crosshair & focus reticle
            p_boot = t / 0.5
            cx, cy = WIDTH // 2, HEIGHT // 2
            ring_r = int(200 * (1.0 - ease_out_expo(p_boot))) + 60
            draw.ellipse([(cx - ring_r, cy - ring_r), (cx + ring_r, cy + ring_r)], outline=COLOR_CYAN, width=2)
            draw.line([(cx - ring_r - 40, cy), (cx + ring_r + 40, cy)], fill=COLOR_ACID, width=1)
            draw.line([(cx, cy - ring_r - 40), (cx, cy + ring_r + 40)], fill=COLOR_ACID, width=1)
            draw.text((cx - 140, cy + 90), "SYS.INIT: CALIBRATING OPTICS...", font=font_sm, fill=COLOR_MUTED)
        else:
            # 0.5s - 3.0s: Big explosive typography & kinetic punch
            t_act = t - 0.5
            punch = ease_out_elastic(min(1.0, t_act / 0.8))
            
            # Chromatic aberration transient
            if t_act < 0.35:
                chromatic_shift = int(18 * math.exp(-t_act * 12))

            # Main Kinetic Title
            scale_y_offset = int((1.0 - punch) * 80)
            tx = WIDTH // 2 - 580
            ty = HEIGHT // 2 - 130 + scale_y_offset

            # Background kinetic strobe accent block
            if t_act < 0.2:
                draw.rectangle([(tx - 40, ty - 20), (tx + 1200, ty + 240)], fill=(30, 40, 60))

            draw.text((tx, ty), "KINETIC MANIFESTO", font=font_huge, fill=COLOR_WHITE)
            draw.text((tx + 4, ty + 120), "DEFYING CREATIVE GRAVITY  //  动效重力论", font=font_zh_title, fill=COLOR_CYAN)
            draw.text((tx + 4, ty + 195), "CREATIVE TECHNOLOGIST & MOTION DIRECTOR", font=font_med, fill=COLOR_ACID)

            # Rotating Kinetic Orbital Crosshair
            cx, cy = WIDTH // 2 + 500, HEIGHT // 2
            rot = t * 3.5
            for r_circ in [90, 140, 200]:
                draw.ellipse([(cx - r_circ, cy - r_circ), (cx + r_circ, cy + r_circ)], outline=COLOR_DARK_GRID, width=1)
            # Dashed arc simulation
            for a_deg in range(0, 360, 45):
                rad = math.radians(a_deg + rot * 50)
                px1 = cx + int(140 * math.cos(rad))
                py1 = cy + int(140 * math.sin(rad))
                px2 = cx + int(155 * math.cos(rad))
                py2 = cy + int(155 * math.sin(rad))
                draw.line([(px1, py1), (px2, py2)], fill=COLOR_CYAN, width=2)
            
            draw.ellipse([(cx - 15, cy - 15), (cx + 15, cy + 15)], fill=COLOR_ACID)

    elif t < 6.5:
        # === ACT II: 3D TOPOLOGY & PROCEDURAL KINETICS [3.0s - 6.5s] ===
        t_act = t - 3.0
        draw.text((100, 110), "01 // 3D TOPOLOGY & KINETIC MATH", font=font_big, fill=COLOR_ACID)
        draw.text((100, 190), "空间拓扑与参数化几何动效矩阵", font=font_zh_title, fill=COLOR_WHITE)
        
        # Explosion pulse at t=4.0s (1.0s into Act II)
        expl_factor = 1.0
        if 1.0 <= t_act < 2.2:
            dt_expl = t_act - 1.0
            expl_factor = 1.0 + 0.45 * math.sin(dt_expl * math.pi) * math.exp(-dt_expl * 1.8)
        if 0.95 <= t_act < 1.15:
            chromatic_shift = 12

        # 3D Icosahedron Projection
        cx, cy = WIDTH // 2 + 320, HEIGHT // 2 + 30
        ax = t_act * 1.8
        ay = t_act * 2.5
        az = t_act * 0.9

        proj_pts = []
        for v in ICOSA_VERTS:
            x, y, z = v[0] * expl_factor, v[1] * expl_factor, v[2] * expl_factor
            # 3D Euler Rotations
            y1 = y * math.cos(ax) - z * math.sin(ax)
            z1 = y * math.sin(ax) + z * math.cos(ax)
            x2 = x * math.cos(ay) + z1 * math.sin(ay)
            z2 = -x * math.sin(ay) + z1 * math.cos(ay)
            x3 = x2 * math.cos(az) - y1 * math.sin(az)
            y3 = x2 * math.sin(az) + y1 * math.cos(az)
            # Perspective Projection
            dist = 680.0
            scale = dist / (dist + z2)
            px = int(cx + x3 * scale)
            py = int(cy + y3 * scale)
            proj_pts.append((px, py, z2))

        # Render 3D Edges with Depth Shading
        for i, j in ICOSA_EDGES:
            pt1 = proj_pts[i]
            pt2 = proj_pts[j]
            avg_z = (pt1[2] + pt2[2]) / 2.0
            # Depth illumination factor
            depth_ratio = (avg_z + 240.0) / 480.0
            depth_ratio = max(0.15, min(1.0, depth_ratio))
            col_wire = (
                int(COLOR_CYAN[0] * depth_ratio),
                int(COLOR_CYAN[1] * depth_ratio),
                int(COLOR_CYAN[2] * depth_ratio)
            )
            line_w = 3 if depth_ratio > 0.65 else 2
            draw.line([(pt1[0], pt1[1]), (pt2[0], pt2[1])], fill=col_wire, width=line_w)

        # Draw Glowing Vertices
        for pt in proj_pts:
            dot_r = 6 if pt[2] > 0 else 4
            draw.ellipse([(pt[0] - dot_r, pt[1] - dot_r), (pt[0] + dot_r, pt[1] + dot_r)], fill=COLOR_ACID)

        # Surrounding Orbital Rings
        for o_r in [320, 420]:
            draw.ellipse([(cx - o_r, cy - o_r // 3), (cx + o_r, cy + o_r // 3)], outline=(40, 60, 85), width=1)
        # Orbiting node on ellipse
        orb_ang = t * 3.0
        ob_x = cx + int(320 * math.cos(orb_ang))
        ob_y = cy + int((320 // 3) * math.sin(orb_ang))
        draw.ellipse([(ob_x - 7, ob_y - 7), (ob_x + 7, ob_y + 7)], fill=COLOR_MAGENTA)

        # Left Column: Procedural Math Spec
        metrics = [
            ("• ALGORITHM", "PARAMETERIZED ICOSAHEDRON MESH"),
            ("• TOPOLOGY", "RIEMANNIAN METRIC TENSOR DYNAMICS"),
            ("• ELASTICITY", "SPRING DAMPING (k=240, c=14, m=1)"),
            ("• EXPLODED VIEW", f"EXPANSION RATIO: {expl_factor:.2f}X"),
            ("• PERFORMANCE", "60 FPS LOSSLESS REALTIME")
        ]
        my = 290
        for m_lbl, m_val in metrics:
            draw.text((100, my), m_lbl, font=font_sm, fill=COLOR_CYAN)
            draw.text((340, my), m_val, font=font_sm, fill=COLOR_WHITE)
            my += 52

        # Flowing Sine Wave Ribbon at bottom
        wave_pts = []
        for wx in range(100, WIDTH - 100, 12):
            wy = HEIGHT - 180 + int(24 * math.sin(wx * 0.015 + t * 5.0) + 12 * math.cos(wx * 0.03 - t * 3.0))
            wave_pts.append((wx, wy))
        for wi in range(len(wave_pts) - 1):
            draw.line([wave_pts[wi], wave_pts[wi + 1]], fill=COLOR_ACID, width=2)

    elif t < 10.0:
        # === ACT III: SPATIAL UI & HIGH-TECH HUD [6.5s - 10.0s] ===
        t_act = t - 6.5
        draw.text((100, 110), "02 // SPATIAL UI & HIGH-TECH HUD", font=font_big, fill=COLOR_CYAN)
        draw.text((100, 190), "未来界面微交互与空间态势感知系统", font=font_zh_title, fill=COLOR_WHITE)

        # Radar Scanner Component
        rcx, rcy = WIDTH // 2 + 350, HEIGHT // 2 + 40
        for radius in [90, 180, 270, 360]:
            draw.ellipse([(rcx - radius, rcy - radius), (rcx + radius, rcy + radius)], outline=(35, 55, 80), width=1)
        # 360 degree fine tick marks
        for deg in range(0, 360, 15):
            rad = math.radians(deg)
            is_cardinal = (deg % 90 == 0)
            t_len = 16 if is_cardinal else 8
            x1 = rcx + int(360 * math.cos(rad))
            y1 = rcy + int(360 * math.sin(rad))
            x2 = rcx + int((360 - t_len) * math.cos(rad))
            y2 = rcy + int((360 - t_len) * math.sin(rad))
            col_t = COLOR_CYAN if is_cardinal else (60, 85, 120)
            draw.line([(x1, y1), (x2, y2)], fill=col_t, width=2 if is_cardinal else 1)

        # Sweeping Radar Beam
        sw_angle = (t_act * 4.2) % (2.0 * math.pi)
        sw_x = rcx + int(360 * math.cos(sw_angle))
        sw_y = rcy + int(360 * math.sin(sw_angle))
        draw.line([(rcx, rcy), (sw_x, sw_y)], fill=COLOR_CYAN, width=3)
        # Radar Ping Targets
        for pt_idx, (tgt_ang, tgt_r) in enumerate([(1.2, 210), (3.4, 150), (5.1, 290)]):
            tgt_x = rcx + int(tgt_r * math.cos(tgt_ang))
            tgt_y = rcy + int(tgt_r * math.sin(tgt_ang))
            diff_ang = (sw_angle - tgt_ang) % (2 * math.pi)
            if diff_ang < 1.0: # recently swept
                glow_r = int(12 * (1.0 - diff_ang)) + 4
                draw.ellipse([(tgt_x - glow_r, tgt_y - glow_r), (tgt_x + glow_r, tgt_y + glow_r)], outline=COLOR_ACID, width=2)
                draw.point((tgt_x, tgt_y), fill=COLOR_WHITE)

        # Glassmorphic Interactive Cards on the Left
        card_w = 460
        # Card 1: System Performance
        c1x, c1y, c1h = 100, 290, 200
        draw.rectangle([(c1x, c1y), (c1x + card_w, c1y + c1h)], fill=(16, 22, 34), outline=COLOR_CYAN, width=2)
        draw.rectangle([(c1x, c1y), (c1x + card_w, c1y + 44)], fill=(24, 32, 50))
        draw.text((c1x + 20, c1y + 12), "SYSTEM PERFORMANCE // METRICS", font=font_sm, fill=COLOR_CYAN)
        draw.text((c1x + 20, c1y + 60), "FRAME RENDER BUDGET: 16.6ms / 60 FPS", font=font_sm, fill=COLOR_WHITE)
        draw.text((c1x + 20, c1y + 90), "INPUT-TO-MOTION JITTER: ZERO", font=font_sm, fill=COLOR_ACID)
        # Audio-reactive Equalizer Bar Chart
        for bi in range(9):
            bh = max(8, int(25 + 45 * abs(math.sin(t * 8.0 + bi * 0.7))))
            y_bot = c1y + c1h - 20
            y_top = y_bot - bh
            bx_start = c1x + 20 + bi * 48
            draw.rectangle([(bx_start, y_top), (bx_start + 36, y_bot)], fill=COLOR_CYAN)

        # Card 2: Spatial Motion Engine
        c2x, c2y, c2h = 100, 520, 200
        draw.rectangle([(c2x, c2y), (c2x + card_w, c2y + c2h)], fill=(16, 22, 34), outline=COLOR_MAGENTA, width=2)
        draw.rectangle([(c2x, c2y), (c2x + card_w, c2y + 44)], fill=(32, 20, 36))
        draw.text((c2x + 20, c2y + 12), "SPATIAL ENGINE // MICRO-INTERACTIONS", font=font_sm, fill=COLOR_MAGENTA)
        draw.text((c2x + 20, c2y + 60), "ACCELERATION PROFILE: CUBIC BEZIER", font=font_sm, fill=COLOR_WHITE)
        draw.text((c2x + 20, c2y + 90), "GPU MEMORY PIPELINE: DIRECT PIPE", font=font_sm, fill=COLOR_ACID)
        # Horizontal progress meters
        draw.rectangle([(c2x + 20, c2y + 140), (c2x + card_w - 20, c2y + 155)], fill=(30, 35, 50))
        draw.rectangle([(c2x + 20, c2y + 140), (c2x + 20 + int((card_w - 40) * 0.94), c2y + 155)], fill=COLOR_MAGENTA)
        draw.text((c2x + 20, c2y + 165), "INTERACTION FIDELITY: 99.4%", font=font_micro, fill=COLOR_MUTED)

    elif t < 13.0:
        # === ACT IV: KINETIC TYPOGRAPHY & CLIMAX [10.0s - 13.0s] ===
        t_act = t - 10.0
        
        # 4 Staccato Beat Hits:
        # 10.0s - 10.4s: SPEED
        # 10.4s - 10.8s: IMPACT (Inverted Strobe!)
        # 10.8s - 11.2s: PRECISION
        # 11.2s - 11.6s: ELEGANCE
        # 11.6s - 13.0s: 3D Cylindrical Word Wheel
        if t_act < 1.6:
            stabs = [
                ("SPEED.", COLOR_ACID, "速度与节奏极致掌控"),
                ("IMPACT.", COLOR_WHITE, "爆发力与视觉强震荡"),
                ("PRECISION.", COLOR_CYAN, "像素级几何严密对齐"),
                ("ELEGANCE.", COLOR_MAGENTA, "高级感流体美学张力")
            ]
            stab_idx = min(3, int(t_act / 0.4))
            word, col, desc = stabs[stab_idx]
            dt_stab = t_act - stab_idx * 0.4

            # Invert Strobe Flash on "IMPACT." (10.4s - 10.55s)
            is_strobe = (stab_idx == 1 and dt_stab < 0.15)
            if is_strobe:
                draw.rectangle([(0, 0), (WIDTH, HEIGHT)], fill=(245, 248, 255))
                col = (10, 12, 18)
                chromatic_shift = 20
            elif dt_stab < 0.15:
                chromatic_shift = 16

            # Giant kinetic typography punch
            scale_y = int((1.0 - ease_out_expo(min(1.0, dt_stab * 5.0))) * 60)
            tx = WIDTH // 2 - 500
            ty = HEIGHT // 2 - 130 + scale_y
            draw.text((tx, ty), word, font=font_massive, fill=col)
            draw.text((tx + 10, ty + 160), desc, font=font_zh_huge, fill=COLOR_ACID if not is_strobe else (50, 60, 80))

            # Background kinetic motion speed lines
            for sl in range(-10, 25):
                sx = int(sl * 140 + (t * 800) % 140)
                line_col = (50, 30, 45) if not is_strobe else (200, 210, 225)
                draw.line([(sx, 0), (sx - 350, HEIGHT)], fill=line_col, width=2)

        else:
            # 11.6s - 13.0s: 3D Cylindrical Kinetic Word Wheel accelerating into Finale
            t_wheel = t_act - 1.6
            draw.text((100, 110), "03 // KINETIC CYLINDER // HYPER-FLOW", font=font_big, fill=COLOR_ACID)
            
            wheel_words = ["KINETIC", "SYSTEMS", "PRECISION", "3D TOPOLOGY", "DYNAMICS", "ELEGANCE", "MATH", "FLOW"]
            wheel_radius = 480.0
            wheel_cx = WIDTH // 2
            wheel_cy = HEIGHT // 2 + 30
            wheel_rot = t_wheel * 5.5

            for wi, ww in enumerate(wheel_words):
                ang = wheel_rot + (wi * 2.0 * math.pi / len(wheel_words))
                wx_3d = wheel_radius * math.cos(ang)
                wz_3d = wheel_radius * math.sin(ang) # -radius to radius
                
                # Only render front-facing or depth-fade
                dist = 700.0
                scale = dist / (dist + wz_3d)
                scr_x = int(wheel_cx + wx_3d * scale)
                scr_y = int(wheel_cy + (wi - 3.5) * 45 * scale)

                # Opacity / brightness based on depth
                depth_bright = max(0.2, (wz_3d + wheel_radius) / (2.0 * wheel_radius))
                col_word = (
                    int(255 * depth_bright),
                    int(255 * depth_bright),
                    int(255 * depth_bright)
                ) if wz_3d > -100 else (int(80 * depth_bright), int(100 * depth_bright), int(140 * depth_bright))
                
                # Choose font size by depth
                cur_font = font_med if wz_3d > 100 else font_sm
                draw.text((scr_x - 100, scr_y), ww, font=cur_font, fill=col_word)

    else:
        # === ACT V: GRAND FINALE & RESUME LOCKUP [13.0s - 15.0s] ===
        t_act = t - 13.0
        
        # Opening impact at 13.0s
        if t_act < 0.3:
            chromatic_shift = int(18 * math.exp(-t_act * 10))

        # Fade out to black at the very end (14.4s - 15.0s)
        fade_mult = 1.0
        if t_act > 1.4:
            fade_mult = max(0.0, 1.0 - (t_act - 1.4) / 0.6)

        # Header Title
        draw.text((WIDTH // 2 - 420, 150), "2026 OFFICIAL MOTION SHOWREEL // PROGRAM SPEC", font=font_sm, fill=COLOR_ACID)
        
        # Centerpiece Name & Titles
        draw.text((WIDTH // 2 - 420, 200), "SHERWIN XIE", font=font_huge, fill=COLOR_WHITE)
        draw.text((WIDTH // 2 - 416, 325), "SENIOR MOTION DESIGNER & CREATIVE TECHNOLOGIST", font=font_med, fill=COLOR_CYAN)
        draw.text((WIDTH // 2 - 416, 380), "资深动态图形设计师 · 创意技术专家", font=font_zh_title, fill=COLOR_WHITE)

        # 4 Showcase Skill Cards (Resume Programme)
        skills = [
            ("01. KINETIC SYSTEMS", "动态文字排印 / 空间动效系统"),
            ("02. 3D TOPOLOGY", "参数化拓扑 / 三维程序化动效"),
            ("03. HIGH-TECH HUD", "未来界面 / 毫秒级空间交互"),
            ("04. AUDIO-VISUAL SYNC", "好莱坞级声效微秒精准对位")
        ]
        card_w, card_h = 390, 145
        start_x = (WIDTH - (4 * card_w + 3 * 20)) // 2
        for i, (sk_title, sk_desc) in enumerate(skills):
            bx = start_x + i * (card_w + 20)
            by = 490
            draw.rectangle([(bx, by), (bx + card_w, by + card_h)], fill=(16, 22, 34), outline=(45, 65, 95), width=1)
            draw.line([(bx, by), (bx + 48, by)], fill=COLOR_ACID, width=3)
            draw.text((bx + 20, by + 24), sk_title, font=font_sm, fill=COLOR_WHITE)
            draw.text((bx + 20, by + 72), sk_desc, font=font_zh_sm, fill=(160, 180, 215))

        # Bottom Call-To-Action & Status Bar
        stat_y = 710
        draw.rectangle([(WIDTH // 2 - 460, stat_y), (WIDTH // 2 + 460, stat_y + 70)], fill=(18, 26, 42), outline=COLOR_CYAN, width=1)
        # Glowing status dot
        draw.ellipse([(WIDTH // 2 - 430, stat_y + 26), (WIDTH // 2 - 414, stat_y + 42)], fill=COLOR_ACID)
        draw.text((WIDTH // 2 - 395, stat_y + 24), "STATUS: AVAILABLE FOR TOP-TIER IMPACT  |  LET'S BUILD THE UNSEEN", font=font_sm, fill=COLOR_CYAN)

        # Contact / Philosophy Sub-line
        draw.text((WIDTH // 2 - 320, stat_y + 95), "MAKING CODE MOVE WITH SOUL · DESIGNED FOR BROADCAST", font=font_micro, fill=COLOR_MUTED)

        # If fading, apply global fade multiplier
        if fade_mult < 1.0:
            fade_arr = (np.array(img, dtype=np.float32) * fade_mult).astype(np.uint8)
            img = Image.fromarray(fade_arr)

    # 4. CHROMATIC ABERRATION & FILM GRAIN POST-PROCESSING
    frame_np = np.array(img)
    if chromatic_shift > 0:
        cs = chromatic_shift
        # Shift Red right, Blue left
        r = np.roll(frame_np[:, :, 0], cs, axis=1)
        g = frame_np[:, :, 1]
        b = np.roll(frame_np[:, :, 2], -cs, axis=1)
        frame_np = np.stack([r, g, b], axis=2)

    # Convert RGB to BGR for OpenCV / rawvideo ffmpeg pipe
    frame_bgr = frame_np[:, :, ::-1]
    return frame_bgr

def render_and_encode():
    t_start = time.time()
    print(f"🎬 Starting Render: 1920x1080 @ {FPS} FPS, {DURATION}s ({TOTAL_FRAMES} frames)...")
    
    # Ensure audio exists
    if not os.path.exists(AUDIO_FILE):
        print("Generating audio track first...")
        from synth_audio import generate_motion_soundtrack
        generate_motion_soundtrack()

    # Launch ffmpeg process with piped rawvideo input and audio mix
    ffmpeg_cmd = [
        'ffmpeg', '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-pix_fmt', 'bgr24',
        '-s', f"{WIDTH}x{HEIGHT}",
        '-r', str(FPS),
        '-i', '-', # Stdin pipe for video frames
        '-i', AUDIO_FILE, # Audio input
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '17', # Broadcast visual quality
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '320k',
        '-shortest',
        OUTPUT_VIDEO
    ]

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

    for i in range(TOTAL_FRAMES):
        frame_bgr = render_frame(i)
        proc.stdin.write(frame_bgr.tobytes())
        
        if i % 60 == 0 or i == TOTAL_FRAMES - 1:
            progress = (i + 1) / TOTAL_FRAMES * 100
            elapsed = time.time() - t_start
            fps_speed = (i + 1) / max(0.001, elapsed)
            sys.stdout.write(f"\rRendering frame {i+1}/{TOTAL_FRAMES} ({progress:.1f}%) | Speed: {fps_speed:.1f} fps")
            sys.stdout.flush()

    proc.stdin.close()
    proc.wait()
    print(f"\n✅ Video render completed in {time.time() - t_start:.2f} seconds!")
    print(f"📦 Output saved to: {OUTPUT_VIDEO}")

if __name__ == "__main__":
    render_and_encode()
