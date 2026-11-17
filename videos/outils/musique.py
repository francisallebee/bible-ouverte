"""Musique de fond originale, synthétisée de zéro (aucun échantillon, aucun droit tiers).

Nappe douce + arpège façon piano feutré + basse, en ré majeur, avec réverbération.
Usage : python musique.py <durée_s> <sortie.wav> [graine] [progression]
  progression : 'calme' (I–vi–IV–V) ou 'lumineux' (I–V–vi–IV)
Déterministe : même graine, même musique.
"""
import sys, wave
import numpy as np

SR = 44100
duree = float(sys.argv[1])
sortie = sys.argv[2]
graine = int(sys.argv[3]) if len(sys.argv) > 3 else 7
style = sys.argv[4] if len(sys.argv) > 4 else "calme"
rng = np.random.default_rng(graine)

BPM = 72
temps = 60 / BPM
mesure = temps * 4 * 2  # un accord = deux mesures

def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)

# accords en notes MIDI (ré majeur)
ACCORDS = {
    "I": [50, 57, 62, 66, 69],     # D
    "vi": [47, 54, 59, 62, 66],    # Bm
    "IV": [43, 55, 59, 62, 67],    # G
    "V": [45, 52, 57, 61, 64],     # A
    "iii": [42, 54, 57, 61, 66],   # F#m
}
PROG = {"calme": ["I", "vi", "IV", "V"], "lumineux": ["I", "V", "vi", "IV"]}[style]

n = int(duree * SR) + SR * 4
t = np.arange(n) / SR
mix = np.zeros((n, 2))

def enveloppe(longueur, attaque, relache):
    e = np.ones(longueur)
    a = min(int(attaque * SR), longueur)
    r = min(int(relache * SR), longueur - a)
    e[:a] = np.linspace(0, 1, a) ** 2
    if r > 0:
        e[-r:] = np.linspace(1, 0, r) ** 2
    return e

def ajouter(signal, debut_s, gain, pan=0.0):
    d = max(0, int(debut_s * SR))
    f = min(n, d + len(signal))
    if d >= n:
        return
    s = signal[: f - d] * gain
    mix[d:f, 0] += s * np.sqrt((1 - pan) / 2)
    mix[d:f, 1] += s * np.sqrt((1 + pan) / 2)

nb_accords = int(np.ceil(duree / mesure)) + 1
for i in range(nb_accords):
    nom = PROG[i % len(PROG)]
    notes = ACCORDS[nom]
    debut = i * mesure
    long_ = int((mesure + 2.5) * SR)
    tt = np.arange(long_) / SR
    env = enveloppe(long_, 1.8, 2.8)
    # nappe : sinus légèrement désaccordés + octave douce, vibrato lent
    for j, m in enumerate(notes[1:]):
        f0 = hz(m + 12 if j >= 2 else m)
        nappe = np.zeros(long_)
        for detune in (-0.12, 0.0, 0.11):
            ph = 2 * np.pi * f0 * (2 ** (detune / 12)) * tt + 0.15 * np.sin(2 * np.pi * 0.21 * tt + j)
            nappe += np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
        ajouter(nappe * env / 3, debut, 0.045, pan=(j - 1.5) * 0.35)
    # basse
    fb = hz(notes[0] - 12 if notes[0] > 45 else notes[0])
    basse = (np.sin(2 * np.pi * fb * tt) + 0.25 * np.sin(4 * np.pi * fb * tt)) * enveloppe(long_, 0.6, 2.2)
    ajouter(basse, debut, 0.10)
    # arpège « piano feutré » : une note par temps, motif qui varie
    motif = [1, 2, 3, 4, 3, 2, 3, 1] if i % 2 == 0 else [2, 3, 4, 3, 1, 4, 2, 3]
    for k, idx in enumerate(motif):
        if rng.random() < 0.18:
            continue  # silences : respiration
        m = notes[idx] + 12
        f0 = hz(m)
        ln = int(3.2 * SR)
        tp = np.arange(ln) / SR
        corps = sum(
            (0.55 ** h) * np.sin(2 * np.pi * f0 * (h + 1) * tp * (1 + 0.0004 * h * h)) * np.exp(-tp * (1.6 + 1.1 * h))
            for h in range(6)
        )
        corps *= np.minimum(1, tp / 0.008)  # attaque douce
        vel = 0.75 + 0.25 * rng.random()
        ajouter(corps, debut + k * temps + 0.012 * rng.standard_normal(), 0.075 * vel, pan=rng.uniform(-0.4, 0.4))

# réverbération : réponse impulsionnelle synthétique (bruit à décroissance exponentielle)
ir_len = int(3.4 * SR)
ti = np.arange(ir_len) / SR
ir = rng.standard_normal((ir_len, 2)) * np.exp(-ti / 0.9)[:, None]
ir[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
# adoucir les aigus de la réverbe (filtre passe-bas d'ordre 1)
for c in range(2):
    y = np.zeros(ir_len); a = 0.25
    for idx in range(ir_len):
        y[idx] = a * ir[idx, c] + (1 - a) * (y[idx - 1] if idx else 0)
    ir[:, c] = y
ir /= np.sqrt((ir ** 2).sum(axis=0))
L = n + ir_len - 1
taille = 1 << (L - 1).bit_length()
humide = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], taille) * np.fft.rfft(ir[:, c], taille), taille)[:n] for c in range(2)], axis=1)
final = 0.62 * mix + 0.55 * humide

# longueur exacte + fondus d'entrée et de sortie
final = final[: int(duree * SR)]
fin = enveloppe(len(final), 2.0, 3.0)
final *= fin[:, None]
final /= np.max(np.abs(final)) / 0.89

pcm = (final * 32767).astype("<i2")
with wave.open(sortie, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"{sortie} : {duree:.1f} s, style {style}, graine {graine}")
