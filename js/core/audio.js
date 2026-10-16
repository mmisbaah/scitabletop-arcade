// Tiny Web Audio chiptune engine. Every sound is a short oscillator sweep.

let enabled = true;
let ctx = null;

const SOUNDS = {
    card:    { wave: 'square',   from: 220, to: 440, dur: 0.10, vol: 0.15, step: true },
    synth:   { wave: 'triangle', from: 300, to: 800, dur: 0.15, vol: 0.20 },
    quantum: { wave: 'sawtooth', from: 100, to: 500, dur: 0.20, vol: 0.12 },
    hit:     { wave: 'square',   from: 600, to: 120, dur: 0.12, vol: 0.15 },
    error:   { wave: 'square',   from: 140, to: 90,  dur: 0.18, vol: 0.15 },
    win:     { wave: 'triangle', from: 400, to: 1200, dur: 0.45, vol: 0.20 },
    lose:    { wave: 'sawtooth', from: 400, to: 60,  dur: 0.60, vol: 0.15 },
};

export function playSound(name) {
    if (!enabled) return;
    const s = SOUNDS[name];
    if (!s) return;
    try {
        ctx ??= new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        osc.type = s.wave;
        osc.frequency.setValueAtTime(s.from, now);
        if (s.step) osc.frequency.setValueAtTime(s.to, now + s.dur / 2);
        else osc.frequency.linearRampToValueAtTime(s.to, now + s.dur);
        gain.gain.setValueAtTime(s.vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + s.dur);
        osc.start(now);
        osc.stop(now + s.dur);
    } catch {
        // Audio is optional; ignore browsers that block it.
    }
}

export function toggleAudio() {
    enabled = !enabled;
    return enabled;
}

export function isAudioEnabled() {
    return enabled;
}
