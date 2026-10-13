import numpy as np
import wave
import struct
import math
import subprocess
import os

def generate_motion_soundtrack(output_wav="webapp/motion-showreel/audio.wav", output_mp3="webapp/motion-showreel/audio.mp3"):
    sample_rate = 44100
    duration = 15.0
    total_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)
    
    # Left and Right stereo channels
    left = np.zeros(total_samples, dtype=np.float32)
    right = np.zeros(total_samples, dtype=np.float32)
    
    # Helper: add sound with stereo pan (-1.0 to 1.0)
    def add_sound(start_time, sig, pan=0.0):
        start_idx = int(start_time * sample_rate)
        end_idx = min(start_idx + len(sig), total_samples)
        valid_len = end_idx - start_idx
        if valid_len <= 0:
            return
        
        # Constant power pan
        pan_angle = (pan + 1.0) * (math.pi / 4.0)
        gain_l = math.cos(pan_angle)
        gain_r = math.sin(pan_angle)
        
        left[start_idx:end_idx] += sig[:valid_len] * gain_l
        right[start_idx:end_idx] += sig[:valid_len] * gain_r

    # 1. Sub-bass 808 Hit / Boom
    def synth_808_hit(dur=1.2, start_freq=180.0, end_freq=35.0, punch=True):
        n = int(sample_rate * dur)
        ts = np.linspace(0, dur, n, endpoint=False)
        # Pitch envelope: rapid drop then sustain low
        freq_env = end_freq + (start_freq - end_freq) * np.exp(-ts * 18.0)
        phase = np.cumsum(2.0 * np.pi * freq_env / sample_rate)
        # Sine wave with gentle saturation
        sine = np.sin(phase)
        # Soft saturation / warmth
        sat = np.tanh(sine * 1.8)
        # Amplitude envelope
        amp = np.exp(-ts * 3.2)
        if punch:
            # Transient click at start
            click = np.random.uniform(-0.5, 0.5, n) * np.exp(-ts * 120.0)
            return (sat * amp * 0.75 + click * 0.25).astype(np.float32)
        return (sat * amp * 0.8).astype(np.float32)

    # 2. Digital Glitch / Click / Shutter
    def synth_click(dur=0.04, freq=3200.0):
        n = int(sample_rate * dur)
        ts = np.linspace(0, dur, n, endpoint=False)
        wave = np.sin(2.0 * np.pi * freq * ts) * np.random.uniform(0.7, 1.0, n)
        env = np.exp(-ts * 150.0)
        return (wave * env * 0.4).astype(np.float32)

    # 3. Futuristic Whoosh / Stereo Riser
    def synth_riser(dur=2.0, start_f=60.0, end_f=1800.0):
        n = int(sample_rate * dur)
        ts = np.linspace(0, dur, n, endpoint=False)
        freq_env = start_f * np.power(end_f / start_f, ts / dur)
        phase = np.cumsum(2.0 * np.pi * freq_env / sample_rate)
        carrier = np.sin(phase) * (0.5 + 0.5 * np.sin(2.0 * np.pi * 8.0 * ts))
        noise = np.random.uniform(-0.3, 0.3, n)
        env = np.power(ts / dur, 1.8)
        return ((carrier * 0.6 + noise * 0.4) * env * 0.5).astype(np.float32)

    # 4. Hi-Tech Laser Sweep / Chirp
    def synth_chirp(dur=0.15, f0=2400.0, f1=300.0):
        n = int(sample_rate * dur)
        ts = np.linspace(0, dur, n, endpoint=False)
        f_env = f0 * (f1 / f0) ** (ts / dur)
        phase = np.cumsum(2.0 * np.pi * f_env / sample_rate)
        sig = np.sin(phase) * np.exp(-ts * 18.0)
        return (sig * 0.45).astype(np.float32)

    # 5. Snare / Clack
    def synth_snare(dur=0.25):
        n = int(sample_rate * dur)
        ts = np.linspace(0, dur, n, endpoint=False)
        noise = np.random.uniform(-0.8, 0.8, n) * np.exp(-ts * 25.0)
        tone = np.sin(2.0 * np.pi * 220.0 * ts) * np.exp(-ts * 35.0)
        return ((noise * 0.7 + tone * 0.3) * 0.6).astype(np.float32)

    # 6. Crystalline Chime / Pluck
    def synth_crystal_pluck(freq=880.0, dur=0.8):
        n = int(sample_rate * dur)
        ts = np.linspace(0, dur, n, endpoint=False)
        sig = (np.sin(2 * np.pi * freq * ts) * 0.6 +
               np.sin(2 * np.pi * freq * 2.0 * ts) * 0.25 +
               np.sin(2 * np.pi * freq * 3.01 * ts) * 0.15)
        env = np.exp(-ts * 6.0)
        return (sig * env * 0.35).astype(np.float32)

    # --- COMPOSITION CHOREOGRAPHY (15.0s timeline) ---
    
    # 0.0s: Initial shockwave & camera boot
    add_sound(0.0, synth_808_hit(dur=1.8, start_freq=220, end_freq=38), pan=0.0)
    add_sound(0.02, synth_click(dur=0.08, freq=4500), pan=-0.3)
    add_sound(0.08, synth_click(dur=0.06, freq=3200), pan=0.3)

    # 0.5s: First Typography explosion "KINETIC MANIFESTO"
    add_sound(0.5, synth_808_hit(dur=1.5, start_freq=190, end_freq=45), pan=0.0)
    add_sound(0.5, synth_chirp(dur=0.2, f0=3200, f1=400), pan=0.2)
    
    # 1.0s - 2.8s: Acceleration riser leading to Act II
    add_sound(1.2, synth_riser(dur=1.8, start_f=70, end_f=1600), pan=0.0)
    for tick_t in [1.5, 1.8, 2.1, 2.4, 2.6, 2.8, 2.9]:
        pan_val = -0.6 if tick_t < 2.0 else (0.6 if tick_t < 2.5 else 0.0)
        add_sound(tick_t, synth_click(dur=0.03, freq=2800 + (tick_t * 600)), pan=pan_val)
    
    # 3.0s: ACT II DROP (3D Topology & Geometric Kinetics)
    add_sound(3.0, synth_808_hit(dur=2.0, start_freq=240, end_freq=36), pan=0.0)
    add_sound(3.0, synth_snare(dur=0.35), pan=0.0)
    add_sound(3.0, synth_chirp(dur=0.25, f0=4000, f1=600), pan=-0.4)

    # Rhythmic Pulse (120 BPM = 0.5s per beat) through 3.0s - 6.5s
    # Beats at 3.5, 4.0, 4.5, 5.0, 5.5, 6.0
    for beat in [3.5, 4.0, 4.5, 5.0, 5.5, 6.0]:
        # Kick on 4.0, 5.0, 6.0; Snare on 3.5, 4.5, 5.5
        if beat in [4.0, 5.0, 6.0]:
            add_sound(beat, synth_808_hit(dur=0.7, start_freq=140, end_freq=42, punch=False), pan=0.0)
        else:
            add_sound(beat, synth_snare(dur=0.2), pan=0.1)
        # Crystal arpeggios
        notes = [523.25, 659.25, 783.99, 1046.50, 1318.51] # C E G C E
        note_idx = int((beat - 3.0) * 2) % len(notes)
        add_sound(beat + 0.125, synth_crystal_pluck(freq=notes[note_idx], dur=0.4), pan=-0.5 + (note_idx * 0.25))

    # 6.2s - 6.5s: Data glitch sweep into Act III
    add_sound(6.2, synth_riser(dur=0.3, start_f=300, end_f=2200), pan=0.4)
    add_sound(6.35, synth_click(dur=0.05, freq=5000), pan=-0.4)

    # 6.5s: ACT III DROP (Cyber HUD & High-Tech Interaction)
    add_sound(6.5, synth_808_hit(dur=1.8, start_freq=200, end_freq=38), pan=0.0)
    add_sound(6.5, synth_chirp(dur=0.3, f0=4500, f1=300), pan=0.3)

    # Act III Futuristic Interaction Chirps & Data streams (6.5s - 10.0s)
    for t_hud in [7.0, 7.5, 8.0, 8.5, 9.0, 9.5]:
        add_sound(t_hud, synth_808_hit(dur=0.5, start_freq=130, end_freq=48, punch=False), pan=0.0)
        add_sound(t_hud + 0.25, synth_click(dur=0.04, freq=3800), pan=0.5 if t_hud % 1.0 == 0 else -0.5)
        # Radar scan chirps
        add_sound(t_hud, synth_chirp(dur=0.12, f0=1800, f1=900), pan=-0.2)
    
    # 9.5s - 10.0s: Escalation build-up into CLIMAX
    add_sound(9.5, synth_riser(dur=0.5, start_f=120, end_f=3200), pan=0.0)
    for st in [9.6, 9.7, 9.8, 9.88, 9.94]:
        add_sound(st, synth_click(dur=0.02, freq=4400), pan=0.0)

    # 10.0s - 11.5s: ACT IV CLIMAX 4-STAB COMBO:
    # 10.0s: "SPEED"
    add_sound(10.0, synth_808_hit(dur=0.8, start_freq=260, end_freq=40), pan=-0.3)
    add_sound(10.0, synth_snare(dur=0.3), pan=-0.3)
    # 10.4s: "IMPACT"
    add_sound(10.4, synth_808_hit(dur=0.8, start_freq=280, end_freq=42), pan=0.3)
    add_sound(10.4, synth_snare(dur=0.3), pan=0.3)
    # 10.8s: "PRECISION"
    add_sound(10.8, synth_808_hit(dur=0.8, start_freq=300, end_freq=44), pan=-0.4)
    add_sound(10.8, synth_chirp(dur=0.15, f0=3800, f1=800), pan=-0.4)
    # 11.2s: "ELEGANCE"
    add_sound(11.2, synth_808_hit(dur=1.2, start_freq=320, end_freq=38), pan=0.4)
    add_sound(11.2, synth_crystal_pluck(freq=1567.98, dur=0.8), pan=0.4)

    # 11.6s - 12.8s: Rapid cylindrical carousel acceleration
    for t_car in [11.6, 11.9, 12.2, 12.4, 12.6, 12.8]:
        add_sound(t_car, synth_click(dur=0.03, freq=2200 + (t_car * 400)), pan=0.5 if t_car < 12.2 else -0.5)
    add_sound(12.0, synth_riser(dur=1.0, start_f=100, end_f=3800), pan=0.0)

    # 13.0s: THE GRAND FINALE IMPACT (Resume / Portfolio Lockup)
    add_sound(13.0, synth_808_hit(dur=2.0, start_freq=300, end_freq=32), pan=0.0)
    add_sound(13.0, synth_snare(dur=0.5), pan=0.0)
    add_sound(13.0, synth_chirp(dur=0.4, f0=5000, f1=300), pan=0.0)
    # Crystalline chord tail at 13.0s (C Major triad high register: C6, E6, G6)
    add_sound(13.05, synth_crystal_pluck(freq=1046.50, dur=1.8), pan=-0.4)
    add_sound(13.10, synth_crystal_pluck(freq=1318.51, dur=1.8), pan=0.0)
    add_sound(13.15, synth_crystal_pluck(freq=1567.98, dur=1.8), pan=0.4)

    # 14.2s: Precision lock tick
    add_sound(14.2, synth_click(dur=0.08, freq=3600), pan=0.0)

    # Master Limiter & Normalization
    max_val = max(np.max(np.abs(left)), np.max(np.abs(right)))
    if max_val > 0.001:
        target_peak = 0.92
        left = (left / max_val) * target_peak
        right = (right / max_val) * target_peak
    
    # Smooth master fade out at the very end (14.6s - 15.0s)
    fade_start = int(14.6 * sample_rate)
    fade_len = total_samples - fade_start
    if fade_len > 0:
        fade_curve = np.linspace(1.0, 0.0, fade_len)
        left[fade_start:] *= fade_curve
        right[fade_start:] *= fade_curve

    # Convert to 16-bit PCM interleaved
    pcm_left = (left * 32767).astype(np.int16)
    pcm_right = (right * 32767).astype(np.int16)
    interleaved = np.empty((total_samples, 2), dtype=np.int16)
    interleaved[:, 0] = pcm_left
    interleaved[:, 1] = pcm_right

    os.makedirs(os.path.dirname(output_wav), exist_ok=True)
    with wave.open(output_wav, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(interleaved.tobytes())
    
    print(f"Generated WAV audio: {output_wav}")
    
    # Convert to MP3 using ffmpeg for web compatibility
    subprocess.run([
        'ffmpeg', '-y', '-i', output_wav,
        '-codec:a', 'libmp3lame', '-qscale:a', '2',
        output_mp3
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Generated MP3 audio: {output_mp3}")

if __name__ == "__main__":
    generate_motion_soundtrack()
