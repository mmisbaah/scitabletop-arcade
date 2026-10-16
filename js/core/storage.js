// Small wrapper around localStorage. Private windows and blocked storage
// throw, so every read and write is guarded and falls back to defaults.

const PREFIX = 'scitabletop:';

export function load(key, fallback) {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function save(key, value) {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
        // Storage unavailable; the game still works, it just won't remember.
    }
}

const DEFAULT_SETTINGS = { audio: true, theme: 'system', difficulty: 'normal', age: null, quantumMode: 'cpu', seenRules: {} };

export const settings = { ...DEFAULT_SETTINGS, ...load('settings', {}) };

export function saveSettings() {
    save('settings', settings);
}

// Best result per game. Higher is better.
export function getBest(game) {
    return load('best', {})[game] ?? null;
}

export function recordScore(game, score) {
    const best = load('best', {});
    const isRecord = best[game] === undefined || score > best[game];
    if (isRecord) {
        best[game] = score;
        save('best', best);
    }
    return isRecord;
}
