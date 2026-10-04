"""Synthesize the demo film's music: calm, minimal, royalty-free (generated here, no samples).

    ../.venv/Scripts/python make_music.py     # writes public/music-legible.wav

84 BPM, 16 bars of Am - F - C - G. Pad from bar 0, piano arpeggio from 1.5, bass + soft kick + hats from 3.5,
drums out at 14.5 for the end card.
"""
import pathlib
import wave

import numpy as np

SR = 44100
BPM = 84
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 16
TOTAL = BARS * BAR + 2.5  # tail for the reverb and the fade
OUT = pathlib.Path(__file__).resolve().parent / "public" / "music-legible.wav"

CHORDS = [  # (pad notes, bass root, arpeggio notes) as MIDI
    ([57, 60, 64, 69], 45, [69, 72, 76, 72]),  # Am
    ([53, 57, 60, 65], 41, [65, 69, 72, 69]),  # F
    ([48, 55, 60, 64], 48, [67, 72, 76, 72]),  # C
    ([55, 59, 62, 67], 43, [67, 71, 74, 71]),  # G
]
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
rng = np.random.default_rng(7)
L = np.zeros(int(TOTAL * SR))
R = np.zeros_like(L)


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    j = min(len(L), i + len(sig))
    if j <= i:
        return
    L[i:j] += sig[: j - i] * gain * (1 - pan) / 2 * 2 ** 0.5
    R[i:j] += sig[: j - i] * gain * (1 + pan) / 2 * 2 ** 0.5


def pad(notes, dur):
    t = np.arange(int((dur + 0.8) * SR)) / SR
    env = np.minimum(1, t / 0.6) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.35))
    s = np.zeros_like(t)
    for m in notes:
        f = hz(m)
        for det, a in ((-0.004, 0.5), (0.004, 0.5)):  # slight chorus
            s += a * (np.sin(2 * np.pi * f * (1 + det) * t) + 0.18 * np.sin(4 * np.pi * f * (1 + det) * t))
    return s * env / len(notes)


def pluck(m, dur=1.2):
    t = np.arange(int(dur * SR)) / SR
    f = hz(m)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.32)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.12) + 0.12 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.06)) * env


def bass(m, dur):
    t = np.arange(int(dur * SR)) / SR
    f = hz(m)
    env = np.minimum(1, t / 0.01) * np.exp(-t / 0.9)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * env


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 45 + 75 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)


def hat():
    n = rng.standard_normal(int(0.08 * SR))
    n = np.diff(n, prepend=0)  # crude high-pass
    t = np.arange(len(n)) / SR
    return n * np.exp(-t / 0.018)


for b in range(BARS):
    notes, root, arp = CHORDS[b % 4]
    t0 = b * BAR
    add(pad(notes, BAR), t0, gain=0.22 if b < 15 else 0.18)
    if b >= 1.5:
        for k in range(8):  # eighth-note arpeggio, alternating sides
            if b == 1 and k < 4:
                continue
            add(pluck(arp[k % 4] + (12 if k >= 4 else 0) * 0), t0 + k * BEAT / 2, gain=0.16, pan=(-0.35 if k % 2 else 0.35))
    if 3.5 <= b + 0.5 and b < 15:  # rhythm section from bar 3.5 to 14.5
        start_beat = 2 if b == 3 else 0
        if b != 14 or True:
            for beat in range(start_beat, 4):
                if b == 14 and beat >= 2:
                    break
                bt = t0 + beat * BEAT
                if beat in (0, 2):
                    add(kick(), bt, gain=0.42)
                    add(bass(root, BEAT * 2), bt, gain=0.30)
                add(hat(), bt + BEAT / 2, gain=0.05, pan=0.3)

# a little room: three taps of early reflections, then a longer feedback echo
for buf in (L, R):
    dry = buf.copy()
    for d, g in ((0.093, 0.22), (0.151, 0.16), (0.227, 0.12), (0.43, 0.10)):
        k = int(d * SR)
        buf[k:] += dry[:-k] * g

# gentle fade out over the tail and normalise to -1 dBFS
fade = np.ones_like(L)
n = int(2.5 * SR)
fade[-n:] = np.linspace(1, 0, n) ** 2
L *= fade
R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = L / peak * 0.89, R / peak * 0.89
pcm = (np.stack([L, R], axis=1) * 32767).astype("<i2")
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {OUT.name}: {TOTAL:.1f} s, {BPM} BPM, bar {BAR:.3f} s")
