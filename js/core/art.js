// Drawn artwork: ball-and-stick molecule models, cartoon germs and the
// mascot. Everything is inline SVG so it ships with the page.

// Atom layouts in bond-length units. `ionic` pairs are drawn as a dotted
// attraction with + and - charges instead of a shared bond.
const MODELS = {
    H2: { atoms: [['H', 0, 0], ['H', 1, 0]], bonds: [[0, 1, 1]] },
    O2: { atoms: [['O', 0, 0], ['O', 1.25, 0]], bonds: [[0, 1, 2]] },
    N2: { atoms: [['N', 0, 0], ['N', 1.25, 0]], bonds: [[0, 1, 3]] },
    HCl: { atoms: [['H', 0, 0], ['Cl', 1.3, 0]], bonds: [[0, 1, 1]] },
    H2O: { atoms: [['O', 0, 0], ['H', -0.85, 0.62], ['H', 0.85, 0.62]], bonds: [[0, 1, 1], [0, 2, 1]] },
    NaCl: { atoms: [['Na', 0, 0, '+'], ['Cl', 1.5, 0, '−']], bonds: [], ionic: [[0, 1]] },
    CO2: { atoms: [['O', -1.25, 0], ['C', 0, 0], ['O', 1.25, 0]], bonds: [[0, 1, 2], [1, 2, 2]] },
    NaOH: { atoms: [['Na', -1.5, 0, '+'], ['O', 0, 0, '−'], ['H', 0.9, 0.5]], bonds: [[1, 2, 1]], ionic: [[0, 1]] },
    NH3: { atoms: [['N', 0, 0], ['H', -0.95, 0.55], ['H', 0.95, 0.55], ['H', 0, 1.1]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
    CH4: { atoms: [['C', 0, 0], ['H', -0.9, -0.65], ['H', 0.9, -0.65], ['H', -0.9, 0.65], ['H', 0.9, 0.65]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
};

const RADIUS = { H: 0.3, C: 0.42, N: 0.42, O: 0.42, Na: 0.52, Cl: 0.5 };
const DARK_TEXT = new Set(['H', 'Cl']);

export function moleculeSVG(formula, { size = 120, labels = true, ghost = false } = {}) {
    const m = MODELS[formula];
    if (!m) return '';
    const U = 40; // pixels per bond length
    const xs = m.atoms.map(([el, x]) => [x - RADIUS[el], x + RADIUS[el]]).flat();
    const ys = m.atoms.map(([el, , y]) => [y - RADIUS[el], y + RADIUS[el]]).flat();
    const pad = 0.25;
    const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
    const w = (Math.max(...xs) + pad - minX) * U, h = (Math.max(...ys) + pad - minY) * U;
    const px = (x) => (x - minX) * U, py = (y) => (y - minY) * U;

    let svg = '';
    for (const [a, b, order] of m.bonds) {
        const [, x1, y1] = m.atoms[a], [, x2, y2] = m.atoms[b];
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
        const nx = (-dy / len) * 6, ny = (dx / len) * 6;
        for (let k = 0; k < order; k++) {
            const off = (k - (order - 1) / 2);
            svg += `<line x1="${px(x1) + nx * off}" y1="${py(y1) + ny * off}" x2="${px(x2) + nx * off}" y2="${py(y2) + ny * off}" stroke="var(--ink-3)" stroke-width="4" stroke-linecap="round"/>`;
        }
    }
    for (const [a, b] of m.ionic ?? []) {
        const [, x1, y1] = m.atoms[a], [, x2, y2] = m.atoms[b];
        svg += `<line x1="${px(x1)}" y1="${py(y1)}" x2="${px(x2)}" y2="${py(y2)}" stroke="var(--ink-3)" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round"/>`;
    }
    for (const [el, x, y, charge] of m.atoms) {
        const r = RADIUS[el] * U;
        const fill = ghost ? 'transparent' : `var(--el-${el})`;
        const stroke = ghost ? 'var(--ink-3)' : 'rgb(0 0 0 / 22%)';
        svg += `<circle cx="${px(x)}" cy="${py(y)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${ghost ? 2 : 1.5}" ${ghost ? 'stroke-dasharray="4 4"' : ''}/>`;
        if (!ghost) svg += `<circle cx="${px(x) - r * 0.35}" cy="${py(y) - r * 0.35}" r="${r * 0.28}" fill="rgb(255 255 255 / 35%)"/>`;
        if (labels) {
            const color = ghost ? 'var(--ink-3)' : DARK_TEXT.has(el) ? '#1b2030' : '#ffffff';
            svg += `<text x="${px(x)}" y="${py(y) + r * 0.32}" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="${Math.max(11, r * 0.85)}" fill="${color}">${el}</text>`;
        }
        if (charge && !ghost) {
            svg += `<text x="${px(x) + r * 0.85}" y="${py(y) - r * 0.6}" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="16" fill="var(--ink)">${charge}</text>`;
        }
    }
    const scale = Math.min(2.2, size / Math.max(w, h));
    return `<svg class="molecule" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" role="img" aria-label="Model of ${formula}">${svg}</svg>`;
}

// Cartoon germs with faces. Viruses are spiky balls, bacteria are capsules with tails.
function face(cx, cy, s) {
    return `<circle cx="${cx - 6 * s}" cy="${cy - 2 * s}" r="${3.4 * s}" fill="#fff"/><circle cx="${cx + 6 * s}" cy="${cy - 2 * s}" r="${3.4 * s}" fill="#fff"/>
        <circle cx="${cx - 5.4 * s}" cy="${cy - 1.4 * s}" r="${1.7 * s}" fill="#1b2030"/><circle cx="${cx + 6.6 * s}" cy="${cy - 1.4 * s}" r="${1.7 * s}" fill="#1b2030"/>
        <path d="M${cx - 9 * s} ${cy - 7 * s} l${6 * s} ${2 * s} M${cx + 9 * s} ${cy - 7 * s} l${-6 * s} ${2 * s}" stroke="#1b2030" stroke-width="${1.6 * s}" stroke-linecap="round"/>
        <path d="M${cx - 5 * s} ${cy + 6 * s} q${5 * s} ${-4 * s} ${10 * s} 0" stroke="#1b2030" stroke-width="${1.6 * s}" fill="none" stroke-linecap="round"/>`;
}

export function germSVG(kind, size = 44) {
    if (kind === 'virus') {
        const spikes = Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const x1 = 30 + Math.cos(a) * 17, y1 = 30 + Math.sin(a) * 17;
            const x2 = 30 + Math.cos(a) * 26, y2 = 30 + Math.sin(a) * 26;
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#7a4fd6" stroke-width="3" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="3.2" fill="#a77cff"/>`;
        }).join('');
        return `<svg class="germ" viewBox="0 0 60 60" width="${size}" height="${size}" aria-hidden="true">${spikes}<circle cx="30" cy="30" r="18" fill="#9b6cf5"/>${face(30, 30, 1)}</svg>`;
    }
    return `<svg class="germ" viewBox="0 0 70 60" width="${size * 1.15}" height="${size}" aria-hidden="true">
        <path d="M58 30 q8 -6 10 2 q-4 6 -10 0" stroke="#3aa65a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <rect x="8" y="14" width="52" height="32" rx="16" fill="#4cc271"/>
        <circle cx="20" cy="22" r="3" fill="#7fe09d"/><circle cx="48" cy="38" r="2.5" fill="#7fe09d"/>
        ${face(32, 30, 1)}</svg>`;
}

// Pip, the lab mascot: a round flask with a face. Uses the current game colour.
export function mascotSVG(size = 56, mood = 'happy') {
    const mouth = mood === 'sad'
        ? '<path d="M25 47 q7 -5 14 0" stroke="#1b2030" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
        : mood === 'wow'
            ? '<ellipse cx="32" cy="46" rx="4" ry="5" fill="#1b2030"/>'
            : '<path d="M24 44 q8 7 16 0" stroke="#1b2030" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    return `<svg class="mascot" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
        <circle class="bubble b1" cx="38" cy="8" r="2.5" fill="var(--game)" opacity=".6"/>
        <circle class="bubble b2" cx="28" cy="4" r="1.8" fill="var(--game)" opacity=".5"/>
        <path d="M25 10h14v12l13 22a9 9 0 0 1-8 14H20a9 9 0 0 1-8-14l13-22z" fill="var(--surface)" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M17 40h30l5 8a6 6 0 0 1-5 7H17a6 6 0 0 1-5-7z" fill="var(--game)" opacity=".85"/>
        <rect x="23" y="7" width="18" height="5" rx="2.5" fill="var(--ink)"/>
        <g class="eyes"><circle cx="26" cy="35" r="3.2" fill="#1b2030"/><circle cx="38" cy="35" r="3.2" fill="#1b2030"/>
        <circle cx="27" cy="34" r="1" fill="#fff"/><circle cx="39" cy="34" r="1" fill="#fff"/></g>
        ${mouth}
        <circle cx="21" cy="41" r="2.6" fill="#ff8fa3" opacity=".7"/><circle cx="43" cy="41" r="2.6" fill="#ff8fa3" opacity=".7"/>
    </svg>`;
}
