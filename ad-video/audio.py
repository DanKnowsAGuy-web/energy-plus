"""Synthesizes the 60s music bed + sound design for the ad (120 BPM, cues locked to index.html).

    python3 audio.py ad-audio-raw.wav

Everything is generated from scratch with numpy/scipy, so there is nothing to license.
The voiceover is not included: record it separately and lay it on top (see README).
"""
import sys
import wave
import numpy as np
from scipy import signal

SR = 48000
DUR = 60.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)

dry = np.zeros((2, N))
send = np.zeros((2, N))  # reverb send
duck = np.ones(N)        # sidechain gain for the musical bed
bed = np.zeros((2, N))   # bass/pads/plucks, ducked by the kick


def T(sec):
    return np.arange(int(sec * SR)) / SR


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def place(buf, sig, t0, gain=1.0, pan=0.0, rev=0.0):
    i = int(round(t0 * SR))
    if i >= N or i < 0:
        return
    s = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    buf[0, i:i + len(s)] += s * l
    buf[1, i:i + len(s)] += s * r
    if rev:
        send[0, i:i + len(s)] += s * l * rev
        send[1, i:i + len(s)] += s * r * rev


def in_any(t, spans):
    return any(a <= t < b for a, b in spans)


# ---------- instruments ----------
def kick():
    t = T(0.5)
    f = 46 + 120 * np.exp(-t / 0.04)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.3)
    s += hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / 0.004) * 0.25
    return np.tanh(1.6 * s) * 0.9


def clap():
    t = T(0.4)
    n = bp(rng.standard_normal(len(t)), 900, 3200)
    env = np.zeros(len(t))
    for d in (0, 0.009, 0.019):
        k = t >= d
        env[k] += np.exp(-(t[k] - d) / 0.007)
    env += 0.5 * np.exp(-t / 0.11)
    return n * env * 0.55


def hat(open_=False):
    t = T(0.25 if open_ else 0.08)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t / (0.09 if open_ else 0.018)) * 0.32


def saw(freq, t, detune=0.0):
    ph = (freq * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))


def bass_note(freq, dur):
    t = T(dur)
    s = 0.6 * saw(freq, t) + 0.8 * np.sin(2 * np.pi * freq * t)
    s = lp(s, 380)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.35) * np.minimum(1, (dur - t) / 0.02)
    return np.tanh(1.4 * s * env) * 0.55


def pad(freqs, dur, cutoff=1400):
    t = T(dur)
    s = sum(saw(f, t, d) for f in freqs for d in (-0.004, 0.0, 0.005))
    s = lp(s, cutoff) / (len(freqs) * 3)
    env = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.3)
    return s * env * 0.5


def pluck(freq, dur=0.22):
    t = T(dur)
    s = 0.6 * np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * 2 * freq * t) + 0.15 * saw(freq, t)
    return lp(s, 4200) * np.exp(-t / 0.09) * 0.22


def stab(freqs, dur=1.2):
    t = T(dur)
    s = sum(saw(f, t, d) for f in freqs for d in (-0.006, 0.006))
    s = lp(s, 2600) / (len(freqs) * 2)
    return s * np.exp(-t / 0.35) * 0.7


def impact(big=1.0):
    t = T(2.0)
    f = 34 + 40 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.55 * big))
    body = lp(rng.standard_normal(len(t)), 500) * np.exp(-t / 0.18) * 0.8
    crack = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.03) * 0.35
    return np.tanh(1.3 * (sub + body + crack)) * 0.85 * big


def whoosh(dur=0.45, rise=True):
    t = T(dur)
    n = rng.standard_normal(len(t))
    lo, mid, hi = bp(n, 150, 600), bp(n, 600, 2500), bp(n, 2500, 9000)
    u = t / dur
    w = (u if rise else 1 - u)
    s = lo * np.clip(1 - 2 * w, 0, 1) + mid * (1 - np.abs(2 * w - 1)) + hi * np.clip(2 * w - 1, 0, 1)
    env = np.sin(np.pi * u) ** 1.5
    return s * env * 0.9


def click(freq=2600):
    t = T(0.05)
    return (np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.008) + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t / 0.002) * 0.4) * 0.35


def ding(base=1318.5):
    t = T(0.6)
    return (np.sin(2 * np.pi * base * t) + 0.45 * np.sin(2 * np.pi * base * 1.5 * t) + 0.2 * np.sin(2 * np.pi * base * 2 * t)) * np.exp(-t / 0.18) * 0.16


def riser(dur):
    t = T(dur)
    u = t / dur
    n = rng.standard_normal(len(t))
    s = hp(n, 1500) * u ** 2 * 0.25 + np.sin(2 * np.pi * np.cumsum(220 + 900 * u ** 2) / SR) * u ** 3 * 0.12
    return s


def sparkle(dur, density=60, seed=3):
    r = np.random.default_rng(seed)
    out = np.zeros(int(dur * SR))
    for _ in range(int(density * dur)):
        f = r.uniform(2400, 6200)
        t0 = r.uniform(0, dur - 0.1)
        tt = T(0.09)
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.025) * r.uniform(0.03, 0.08)
        i = int(t0 * SR)
        out[i:i + len(s)] += s
    return out


def scratch(dur):
    t = T(dur)
    n = bp(rng.standard_normal(len(t)), 2200, 6000)
    am = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 4.2 * t + 2 * np.sin(2 * np.pi * 0.9 * t)))
    return n * am * np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.1) * 0.12


def reverse_cymbal(dur):
    t = T(dur)
    return hp(rng.standard_normal(len(t)), 4000) * (t / dur) ** 3 * 0.35


# ---------- arrangement ----------
A1, C2, F1, G1 = 55.0, 65.41, 43.65, 49.0
# Am - F - C - G, one chord per bar (2s)
PROG = [
    (A1, [220.0, 261.63, 329.63, 493.88]),
    (F1, [174.61, 220.0, 261.63, 329.63]),
    (C2, [196.0, 261.63, 329.63, 392.0]),
    (G1, [196.0, 246.94, 293.66, 392.0]),
]

DRUMS = [(0.0, 13.5), (18.0, 28.5), (30.0, 55.0)]
CLAPS = [(2.0, 13.5), (18.0, 28.5), (30.0, 55.0)]
HATS = [(0.0, 13.5), (15.5, 28.5), (30.0, 57.5)]
BASS = [(0.0, 13.5), (18.0, 28.5), (30.0, 55.0)]
PADS = [(0.0, 13.5), (15.0, 58.0)]
PLUCK = [(18.0, 28.5), (30.0, 55.0)]

K, CL, HC, HO = kick(), clap(), hat(), hat(True)
kick_times = []

nbeats = int(DUR / BEAT)
for b in range(nbeats):
    t = b * BEAT
    if in_any(t, DRUMS) or (55.0 <= t < 57.5 and b % 2 == 0):
        place(dry, K, t, 1.0)
        kick_times.append(t)
    if in_any(t, CLAPS) and b % 2 == 1:
        place(dry, CL, t, 0.9, 0.05, rev=0.25)
    if in_any(t + 0.25, HATS):
        quiet = 0.45 if 15.5 <= t < 18 else 1.0
        place(dry, HO if b % 4 == 3 else HC, t + 0.25, 0.8 * quiet, 0.25)
    # 16th hats for lift in the plan and resolution acts
    if 30.0 <= t < 55.0 or 28.5 <= t < 30.0:
        place(dry, HC, t + 0.125, 0.35, -0.3)
        place(dry, HC, t + 0.375, 0.35, -0.3)

# fills and the scene-1 kick into silence
for t in (12.75, 13.0, 13.25):
    place(dry, CL, t, 0.6, -0.1, rev=0.3)

# sidechain envelope from the kick
for kt in kick_times:
    i = int(kt * SR)
    tt = T(0.45)
    seg = 1 - 0.55 * np.exp(-tt / 0.11)
    j = min(N, i + len(tt))
    duck[i:j] = np.minimum(duck[i:j], seg[: j - i])

# bass: 8th-note drive with octave pops
for bar in range(30):
    t0 = bar * 2.0
    root, chord = PROG[bar % 4]
    for e in range(16):
        t = t0 + e * 0.125
        if e % 2:  # 8ths only
            continue
        if not in_any(t, BASS):
            continue
        f = root * (2 if e in (6, 14) else 1)
        place(bed, bass_note(f, 0.22), t, 0.9)
    if 55.0 <= t0 < 58.0:
        place(bed, bass_note(root, 1.9), t0, 0.7)

# pads
for bar in range(30):
    t0 = bar * 2.0
    root, chord = PROG[bar % 4]
    if not in_any(t0, PADS) and not in_any(t0 + 1.0, PADS):
        continue
    cutoff = 900 if t0 < 15 else 1300 if t0 < 45 else 2000
    place(bed, pad(chord, 2.05, cutoff), t0, 0.55, rev=0.35)

# pluck arpeggio
for bar in range(30):
    t0 = bar * 2.0
    root, chord = PROG[bar % 4]
    for s16 in range(16):
        t = t0 + s16 * 0.125
        if not in_any(t, PLUCK):
            continue
        if s16 % 2 and t < 45:
            continue
        note = chord[[0, 2, 1, 3, 2, 1, 3, 2][s16 % 8]] * 2
        place(bed, pluck(note), t, 0.8 if t >= 45 else 0.6, pan=0.35 if s16 % 2 else -0.35, rev=0.3)

# ---------- sound design ----------
AM_STAB = [220.0, 261.63, 329.63, 440.0, 493.88]
place(dry, impact(1.0), 0.0, 1.0, rev=0.3)                     # hard open
for i, t in enumerate((0.0, 0.4, 0.8)):
    place(dry, click(1800 + i * 300), t, 0.9)                  # $ ticks up
place(dry, whoosh(0.7, True), 1.95, 0.7, -0.3)                 # bill folds into the building
place(dry, impact(0.45), 2.75, 0.6)                            # building lands
for t in (2.5, 3.0, 3.5):
    place(dry, click(1400), t, 1.0)                            # word slams
    place(dry, impact(0.25), t, 0.5)
place(dry, sparkle(0.25, 120, 9) * 2, 4.4, 0.8)                # glitch
for i in range(8):                                             # vendor cards fly in
    place(dry, whoosh(0.28, i % 2 == 0), 5.95 + i * 0.25, 0.45, pan=(-0.6 if i % 2 else 0.6))
for t in (8.0, 9.0):
    place(dry, impact(0.35), t, 0.6)
    place(dry, click(1200), t, 1.0)
place(dry, impact(1.2), 11.98, 1.0, rev=0.4)                   # ALL THE RISK stamp
place(dry, lp(rng.standard_normal(int(0.25 * SR)), 1800) * np.exp(-T(0.25) / 0.05) * 0.6, 11.98, 1.0)
place(dry, riser(1.45) * 0.6, 13.5, 0.8)                       # tension in the dropout
place(dry, whoosh(0.5, False), 14.95, 0.8)                     # suck into the point
place(dry, kick(), 15.42, 1.1, rev=0.5)                        # the single clean beat
place(dry, stab(AM_STAB, 2.5), 15.42, 0.9, rev=0.6)
place(dry, sparkle(1.3, 50, 4), 15.6, 1.0)                     # letters assemble
place(dry, whoosh(0.5, True), 17.75, 1.0, pan=-0.6)            # whip pan
place(dry, impact(0.4), 18.05, 0.6)
place(dry, impact(0.5), 19.0, 0.7)                             # 49% lands
for i in range(26):                                            # counter ticks, decelerating
    u = (i / 26)
    t = 19.0 + 2.6 * (1 - (1 - u) ** (1 / 3))
    place(dry, click(3000 + 20 * i), t, 0.35, 0.2)
place(dry, whoosh(0.35, True), 21.7, 0.6, -0.5)                # LOWER BILL slides in
place(dry, ding(880.0), 22.0, 0.8, rev=0.3)
place(dry, impact(0.3), 26.0, 0.6)                             # pulse
place(dry, sparkle(1.4, 140, 5), 28.5, 1.4, rev=0.3)           # shatter
place(dry, riser(1.4), 28.6, 0.6)
place(dry, whoosh(0.5, True), 28.55, 0.6, 0.4)
for t in (30.0, 35.15, 40.15):                                 # numerals draw
    place(dry, whoosh(0.7, True), t, 0.4)
place(dry, click(900), 31.15, 1.2)                             # meter clips on
place(dry, impact(0.25), 31.15, 0.5)
for t in (32.0, 32.5, 38.5, 39.0, 41.5, 42.0, 42.5):
    place(dry, click(1300), t, 0.9)
for i in range(4):
    place(dry, whoosh(0.2, True), 35.55 + i * 0.12, 0.3, pan=-0.4 + i * 0.27)
    place(dry, click(2000), 36.5 + i * 0.5, 0.9)
    place(dry, ding(1318.5 * (1.0, 1.122, 1.26, 1.335)[i]), 36.5 + i * 0.5, 0.9, rev=0.3)
for t in (34.68, 39.68):
    place(dry, whoosh(0.45, True), t, 0.7)
place(dry, riser(2.4) * 0.5, 40.9, 0.6)                        # cash flow climbs
place(dry, whoosh(0.5, False), 44.6, 0.8)
place(dry, impact(0.5), 44.98, 0.7, rev=0.3)
place(dry, sparkle(2.2, 160, 6), 45.6, 1.3, rev=0.4)           # waste dissolves
place(dry, stab([440.0, 523.25, 659.25, 880.0], 2.0), 45.6, 0.35, rev=0.6)
place(dry, scratch(1.8), 47.55, 1.0)                           # pen stroke
place(dry, click(1300), 48.0, 0.9)
place(dry, reverse_cymbal(1.0), 49.0, 0.7)
place(dry, impact(1.0), 50.0, 1.0, rev=0.3)                    # LOWER BILL.
place(dry, stab(AM_STAB), 50.0, 0.6, rev=0.4)
place(dry, whoosh(0.3, True), 51.3, 0.7, -0.7)
place(dry, whoosh(0.3, True), 51.3, 0.7, 0.7)
for t in (51.5, 52.0):
    place(dry, impact(0.6), t, 0.8)
place(dry, ding(987.77), 53.0, 0.9, rev=0.3)
place(dry, whoosh(0.35, False), 54.65, 0.6)
for t in (55.0, 55.5):
    place(dry, impact(0.8), t, 0.9, rev=0.3)
place(dry, whoosh(0.5, True), 56.0, 0.4, 0.5)
place(dry, reverse_cymbal(1.5), 56.5, 0.8)
place(dry, riser(1.0) * 0.5, 57.0, 0.6)
place(dry, impact(1.3), 58.0, 1.0, rev=0.5)                    # final hit
place(dry, kick(), 58.0, 1.0)
place(dry, stab(AM_STAB, 2.0), 58.0, 0.9, rev=0.7)

# ---------- mix ----------
mix = dry + bed * duck
ir_t = T(2.2)
ir = np.stack([
    lp(rng.standard_normal(len(ir_t)), 6000) * np.exp(-ir_t / 0.55),
    lp(rng.standard_normal(len(ir_t)), 6000) * np.exp(-ir_t / 0.55),
])
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
wet = np.stack([signal.fftconvolve(send[c] + 0.15 * bed[c] * duck, ir[c])[:N] for c in range(2)])
mix = mix + 0.35 * wet
mix = hp(mix, 28)
# gentle tail fade so the end card holds clean
mix[:, int(59.6 * SR):] *= np.linspace(1, 0, N - int(59.6 * SR))
# set the body of the mix around -16 dBFS RMS, then soft-clip only the peaks
rms = np.sqrt((mix ** 2).mean())
mix *= 10 ** (-16 / 20) / rms
mix = np.tanh(mix)
mix /= np.max(np.abs(mix)) / 0.89

out = sys.argv[1] if len(sys.argv) > 1 else "ad-audio-raw.wav"
pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out)
