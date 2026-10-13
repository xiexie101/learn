import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import cv2
import os

# Font configurations
FONT_PATH_TITLE = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_PATH_ZH = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_PATH_MONO = "/System/Library/Fonts/SFNSMono.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

font_huge = get_font(FONT_PATH_TITLE, 110)
font_big = get_font(FONT_PATH_TITLE, 64)
font_med = get_font(FONT_PATH_TITLE, 36)
font_sm = get_font(FONT_PATH_MONO, 22)
font_zh_title = get_font(FONT_PATH_ZH, 44)
font_zh_sm = get_font(FONT_PATH_ZH, 24)

# Color constants (BGR for OpenCV, RGB for PIL)
BG_DARK = (12, 10, 8) # RGB
CYAN_RGB = (0, 240, 255)
ACID_RGB = (204, 255, 0)
PINK_RGB = (255, 0, 85)
WHITE_RGB = (255, 255, 255)
GRAY_RGB = (100, 110, 130)

def draw_hud_grid(draw, w, h, t):
    # Technical HUD framing
    draw.rectangle([(40, 40), (w - 40, h - 40)], outline=(40, 48, 65), width=1)
    
    # Corner brackets
    bracket_len = 30
    # Top-Left
    draw.line([(40, 40), (40 + bracket_len, 40)], fill=CYAN_RGB, width=2)
    draw.line([(40, 40), (40, 40 + bracket_len)], fill=CYAN_RGB, width=2)
    # Top-Right
    draw.line([(w - 40, 40), (w - 40 - bracket_len, 40)], fill=CYAN_RGB, width=2)
    draw.line([(w - 40, 40), (w - 40, 40 + bracket_len)], fill=CYAN_RGB, width=2)
    # Bottom-Left
    draw.line([(40, h - 40), (40 + bracket_len, h - 40)], fill=CYAN_RGB, width=2)
    draw.line([(40, h - 40), (40, h - 40 - bracket_len)], fill=CYAN_RGB, width=2)
    # Bottom-Right
    draw.line([(w - 40, h - 40), (w - 40 - bracket_len, h - 40)], fill=CYAN_RGB, width=2)
    draw.line([(w - 40, h - 40), (w - 40, h - 40 - bracket_len)], fill=CYAN_RGB, width=2)
    
    # Timecode & Metadata
    frame_no = int(t * 60)
    tc_sec = int(t)
    tc_frame = frame_no % 60
    tc_str = f"TC // 00:{tc_sec:02d}:{tc_frame:02d}:00"
    draw.text((60, 56), tc_str, font=font_sm, fill=ACID_RGB)
    draw.text((w - 380, 56), "ANTIGRAVITY MOTION REEL '26", font=font_sm, fill=(160, 175, 200))
    draw.text((60, h - 74), "FPS: 60.0  |  RES: 1920x1080  |  LOSSLESS", font=font_sm, fill=(120, 135, 160))
    draw.text((w - 360, h - 74), "AUTHOR: SHERWIN XIE", font=font_sm, fill=CYAN_RGB)

def render_frame_sample(t, w=1920, h=1080):
    img = Image.new("RGB", (w, h), BG_DARK)
    draw = ImageDraw.Draw(img)
    
    # Background subtle grid dots
    grid_gap = 120
    for gx in range(60, w - 60, grid_gap):
        for gy in range(60, h - 60, grid_gap):
            draw.point((gx, gy), fill=(40, 50, 70))
    
    draw_hud_grid(draw, w, h, t)
    
    # Render depending on Act
    if t < 3.0:
        # Act I: Kinetic awakening
        scale_punch = 1.0 + 0.1 * math.exp(-max(0, t - 0.5) * 5)
        draw.text((w//2 - 580, h//2 - 120), "KINETIC MANIFESTO", font=font_huge, fill=WHITE_RGB)
        draw.text((w//2 - 570, h//2 + 30), "DEFYING CREATIVE GRAVITY  //  动效重力论", font=font_zh_title, fill=CYAN_RGB)
        draw.text((w//2 - 570, h//2 + 100), "SHOWREEL & PORTFOLIO PROGRAMME 2026", font=font_sm, fill=ACID_RGB)
        
        # Crosshair and focus rings
        cx, cy = w//2 + 520, h//2
        draw.ellipse([(cx - 80, cy - 80), (cx + 80, cy + 80)], outline=CYAN_RGB, width=2)
        draw.ellipse([(cx - 120, cy - 120), (cx + 120, cy + 120)], outline=(60, 80, 110), width=1)
        draw.line([(cx - 150, cy), (cx + 150, cy)], fill=ACID_RGB, width=1)
        draw.line([(cx, cy - 150), (cx, cy + 150)], fill=ACID_RGB, width=1)
        
    elif t < 6.5:
        # Act II: 3D Topology & Geometry
        draw.text((100, 120), "01 // 3D TOPOLOGY & KINETIC MATH", font=font_big, fill=ACID_RGB)
        draw.text((100, 200), "空间拓扑与参数化几何动效", font=font_zh_title, fill=WHITE_RGB)
        
        # 3D Wireframe Icosahedron Projection
        cx, cy = w//2 + 250, h//2 + 50
        phi = (1 + math.sqrt(5)) / 2
        verts = [
            [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
            [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
            [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
        ]
        # Normalize and scale
        r = 220
        verts = [ [v[0]*r/math.sqrt(1+phi**2), v[1]*r/math.sqrt(1+phi**2), v[2]*r/math.sqrt(1+phi**2)] for v in verts ]
        
        # Rotate angles
        ax = t * 1.5
        ay = t * 2.2
        az = t * 0.8
        
        # 3D rotation matrix
        proj_pts = []
        for v in verts:
            x, y, z = v
            # Rot X
            y1 = y * math.cos(ax) - z * math.sin(ax)
            z1 = y * math.sin(ax) + z * math.cos(ax)
            # Rot Y
            x2 = x * math.cos(ay) + z1 * math.sin(ay)
            z2 = -x * math.sin(ay) + z1 * math.cos(ay)
            # Rot Z
            x3 = x2 * math.cos(az) - y1 * math.sin(az)
            y3 = x2 * math.sin(az) + y1 * math.cos(az)
            # Perspective
            dist = 600
            scale = dist / (dist + z2)
            px = int(cx + x3 * scale)
            py = int(cy + y3 * scale)
            proj_pts.append((px, py, z2))
            
        # Draw edges
        for i in range(len(verts)):
            for j in range(i + 1, len(verts)):
                d_sq = sum((verts[i][k] - verts[j][k])**2 for k in range(3))
                if abs(d_sq - (4*r*r/(1+phi**2))) < 500:
                    pt1 = proj_pts[i]
                    pt2 = proj_pts[j]
                    alpha_wire = int(140 + 100 * ((pt1[2] + pt2[2]) / (2 * r)))
                    alpha_wire = max(40, min(255, alpha_wire))
                    draw.line([(pt1[0], pt1[1]), (pt2[0], pt2[1])], fill=(0, alpha_wire, alpha_wire), width=2)
                    
        # Draw vertices with glowing dots
        for pt in proj_pts:
            dot_r = 5
            draw.ellipse([(pt[0] - dot_r, pt[1] - dot_r), (pt[0] + dot_r, pt[1] + dot_r)], fill=ACID_RGB)
            
        # Left side data metrics
        draw.text((100, 340), "• CURVATURE DYNAMICS: HYPERBOLIC", font=font_sm, fill=CYAN_RGB)
        draw.text((100, 390), "• EULER CHARACTERISTIC: χ = 2", font=font_sm, fill=(200, 210, 230))
        draw.text((100, 440), "• INTERPOLATION: SPRING(m=1, k=180, c=12)", font=font_sm, fill=(200, 210, 230))
        draw.text((100, 490), "• ROTATIONAL VELOCITY: 60 FPS SYNC", font=font_sm, fill=ACID_RGB)
        
    elif t < 10.0:
        # Act III: Cyber HUD & Interaction
        draw.text((100, 120), "02 // SPATIAL UI & HIGH-TECH HUD", font=font_big, fill=CYAN_RGB)
        draw.text((100, 200), "未来界面交互与微动效矩阵", font=font_zh_title, fill=WHITE_RGB)
        
        # Radar circles
        rcx, rcy = w//2 + 300, h//2 + 50
        for radius in [80, 160, 240, 320]:
            draw.ellipse([(rcx - radius, rcy - radius), (rcx + radius, rcy + radius)], outline=(40, 70, 95), width=1)
        
        # Rotating sweep beam
        angle = (t * 4.0) % (2 * math.pi)
        sw_x = rcx + int(320 * math.cos(angle))
        sw_y = rcy + int(320 * math.sin(angle))
        draw.line([(rcx, rcy), (sw_x, sw_y)], fill=CYAN_RGB, width=3)
        
        # Interactive cards
        card_w, card_h = 420, 220
        c1x, c1y = 100, 320
        draw.rectangle([(c1x, c1y), (c1x + card_w, c1y + card_h)], fill=(18, 24, 38), outline=CYAN_RGB, width=2)
        draw.text((c1x + 24, c1y + 24), "SYSTEM PERFORMANCE", font=font_med, fill=WHITE_RGB)
        draw.text((c1x + 24, c1y + 80), "LATENCY: 0.12 ms  |  JITTER: 0", font=font_sm, fill=ACID_RGB)
        # Bar chart inside card
        for bi in range(8):
            bh = max(10, int(30 + 45 * abs(math.sin(t * 6 + bi * 0.8))))
            y_bot = c1y + card_h - 24
            y_top = y_bot - bh
            draw.rectangle([(c1x + 24 + bi * 45, y_top), (c1x + 54 + bi * 45, y_bot)], fill=CYAN_RGB)
            
        c2x, c2y = 100, 580
        draw.rectangle([(c2x, c2y), (c2x + card_w, c2y + card_h)], fill=(18, 24, 38), outline=PINK_RGB, width=2)
        draw.text((c2x + 24, c2y + 24), "INTERACTION FIDELITY", font=font_med, fill=WHITE_RGB)
        draw.text((c2x + 24, c2y + 80), "FRAME BUDGET: 16.6ms / 60 FPS", font=font_sm, fill=PINK_RGB)
        draw.text((c2x + 24, c2y + 130), "STATUS: 100% HARDWARE ACCEL", font=font_sm, fill=WHITE_RGB)
        
    elif t < 13.0:
        # Act IV: Kinetic Climax
        words = ["SPEED.", "IMPACT.", "PRECISION.", "ELEGANCE."]
        beat_idx = int((t - 10.0) / 0.75) % len(words)
        curr_word = words[beat_idx]
        
        draw.text((100, 120), "03 // KINETIC TYPOGRAPHY & CLIMAX", font=font_big, fill=PINK_RGB)
        
        # Giant kinetic impact word
        draw.text((w//2 - 450, h//2 - 120), curr_word, font=font_huge, fill=WHITE_RGB)
        draw.text((w//2 - 440, h//2 + 50), "MAXIMUM VISUAL VELOCITY // 视觉冲击极速释放", font=font_zh_title, fill=ACID_RGB)
        
        # Kinetic diagonal stripes
        for stripe in range(-5, 15):
            sx = int(stripe * 180 + (t * 500) % 180)
            draw.line([(sx, 0), (sx - 300, h)], fill=(40, 20, 35), width=3)
            
    else:
        # Act V: Grand Finale & Resume Lockup
        draw.text((w//2 - 420, 160), "2026 OFFICIAL MOTION SHOWREEL", font=font_sm, fill=ACID_RGB)
        draw.text((w//2 - 420, 210), "SHERWIN XIE", font=font_huge, fill=WHITE_RGB)
        draw.text((w//2 - 415, 340), "SENIOR MOTION DESIGNER & CREATIVE TECHNOLOGIST", font=font_med, fill=CYAN_RGB)
        draw.text((w//2 - 415, 395), "资深动态图形设计师 · 创意技术专家", font=font_zh_title, fill=(220, 230, 255))
        
        # 4 skill cards
        skills = [
            ("01. KINETIC SYSTEMS", "动态文字排印 / 空间动效设计"),
            ("02. 3D TOPOLOGY", "三维参数化几何 / 拓扑动力学"),
            ("03. HIGH-TECH HUD", "未来界面 / 极致微交互系统"),
            ("04. AUDIO-VISUAL SYNC", "好莱坞级声画微秒精准对位")
        ]
        card_w, card_h = 380, 140
        start_x = (w - (4 * card_w + 3 * 20)) // 2
        for i, (sk_title, sk_desc) in enumerate(skills):
            bx = start_x + i * (card_w + 20)
            by = 520
            draw.rectangle([(bx, by), (bx + card_w, by + card_h)], fill=(16, 20, 32), outline=(50, 70, 100), width=1)
            draw.line([(bx, by), (bx + 40, by)], fill=ACID_RGB, width=3)
            draw.text((bx + 20, by + 24), sk_title, font=font_sm, fill=WHITE_RGB)
            draw.text((bx + 20, by + 70), sk_desc, font=font_zh_sm, fill=(160, 180, 210))
            
        # Bottom status bar
        draw.rectangle([(w//2 - 420, 740), (w//2 + 420, 810)], fill=(20, 28, 44), outline=CYAN_RGB, width=1)
        draw.text((w//2 - 380, 762), "STATUS: AVAILABLE FOR TOP-TIER IMPACT  |  LET'S BUILD THE UNSEEN", font=font_sm, fill=CYAN_RGB)
        
    return img

if __name__ == "__main__":
    os.makedirs("webapp/motion-showreel/previews", exist_ok=True)
    times = [1.2, 4.2, 7.8, 10.6, 13.8]
    for idx, t in enumerate(times):
        img = render_frame_sample(t)
        p = f"webapp/motion-showreel/previews/act_{idx+1}_t{t}s.png"
        img.save(p)
        print(f"Saved preview: {p}")
