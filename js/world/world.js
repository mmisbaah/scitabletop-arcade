// Science Island: the world map. An illustrated SVG island with four places
// to visit. The player's character walks the paths between them.

import { reduced } from '../core/anim.js';

// The island has two layouts: a wide one (1000 x 600) for computers and a tall
// one (600 x 800) for phones, so the whole map fits on screen either way.
// Pins and the walker are placed in percent of the viewBox, so they line up at any size.
// The place art is drawn once, at the wide positions, and shifted for the tall map.
export const PLACES = {
    camp: {},
    chemistry: { name: 'Volcano Lab', icon: '🌋' },
    ecosystem: { name: 'Whispering Forest', icon: '🌲' },
    immune: { name: 'Heart Castle', icon: '🏰' },
    quantum: { name: 'Star Observatory', icon: '🔭' },
};

const ISLAND_WIDE = 'M120,300 C110,170 230,80 380,92 C470,98 520,62 620,72 C780,82 905,150 908,282 C912,402 862,522 700,542 C580,556 520,522 420,537 C260,556 128,470 120,300 Z';
const ISLAND_TALL = 'M300,70 C460,60 570,150 565,300 C560,430 580,580 510,700 C450,790 190,790 100,705 C30,630 35,470 45,350 C55,200 140,80 300,70 Z';

const LAYOUTS = {
    wide: {
        w: 1000, h: 600, island: ISLAND_WIDE,
        at: { camp: [510, 330], chemistry: [290, 232], ecosystem: [735, 222], immune: [292, 432], quantum: [728, 428] },
        paths: {
            chemistry: 'M510,330 Q400,262 290,232', ecosystem: 'M510,330 Q630,250 735,222',
            immune: 'M510,330 Q400,412 292,432', quantum: 'M510,330 Q620,412 728,428',
        },
    },
    tall: {
        w: 600, h: 800, island: ISLAND_TALL,
        at: { camp: [300, 440], chemistry: [230, 250], ecosystem: [405, 330], immune: [170, 600], quantum: [420, 640] },
        paths: {
            chemistry: 'M300,440 Q240,370 230,250', ecosystem: 'M300,440 Q380,400 405,330',
            immune: 'M300,440 Q200,500 170,600', quantum: 'M300,440 Q400,520 420,640',
        },
    },
};

const phoneQuery = window.matchMedia?.('(max-width: 760px)');
let layout = LAYOUTS.wide;
const pos = (key) => layout.at[key];
const pct = (x, y) => `left:${(x / layout.w) * 100}%;top:${(y / layout.h) * 100}%`;

// Shift a place's art from its wide position to where it sits on this layout.
function placed(key, art) {
    const [x, y] = layout.at[key];
    const [x0, y0] = LAYOUTS.wide.at[key];
    return `<g transform="translate(${x - x0} ${y - y0})"><g class="place-art">${art}</g></g>`;
}

const trees = [[680, 175, 1], [712, 150, 1.2], [748, 168, 1.1], [782, 150, 1.25], [812, 178, 1], [700, 205, 0.9], [790, 205, 0.95], [835, 210, 0.8]]
    .map(([x, y, s], i) => `
        <g class="tree" style="animation-delay:-${(i * 0.7).toFixed(1)}s;transform-origin:${x}px ${y + 34 * s}px">
            <rect x="${x - 3 * s}" y="${y + 14 * s}" width="${6 * s}" height="${20 * s}" rx="2" fill="var(--trunk)"/>
            <circle cx="${x}" cy="${y}" r="${20 * s}" fill="var(--leaf)"/>
            <circle cx="${x - 9 * s}" cy="${y + 8 * s}" r="${13 * s}" fill="var(--leaf-dark)"/>
            <circle cx="${x + 9 * s}" cy="${y - 6 * s}" r="${10 * s}" fill="var(--leaf-light)"/>
        </g>`).join('');

const stars = Array.from({ length: 16 }, (_, i) => {
    const x = 640 + ((i * 53) % 230), y = 330 + ((i * 37) % 60);
    return `<circle class="twinkle" cx="${x}" cy="${y}" r="${1.4 + (i % 3) * 0.6}" fill="#fff6c8" style="animation-delay:-${(i * 0.31).toFixed(2)}s"/>`;
}).join('');

const waves = ({ w, h }) => Array.from({ length: 14 }, (_, i) => {
    const x = (i * 137) % w, y = 30 + ((i * 89) % (h - 60));
    return `<path class="wave" d="M${x},${y} q10,-7 20,0 q10,7 20,0" style="animation-delay:-${(i * 0.45).toFixed(2)}s"/>`;
}).join('');

function islandSVG() {
    const { w, h, island } = layout;
    return `
    <svg class="world-svg" viewBox="0 0 ${w} ${h}" aria-hidden="true">
        <defs>
            <radialGradient id="sea" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stop-color="var(--sea-light)"/><stop offset="100%" stop-color="var(--sea)"/>
            </radialGradient>
            <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--grass-light)"/><stop offset="100%" stop-color="var(--grass-deep)"/>
            </linearGradient>
            <radialGradient id="glow"><stop offset="0%" stop-color="#ffd76a"/><stop offset="100%" stop-color="#ffd76a" stop-opacity="0"/></radialGradient>
        </defs>

        <rect width="${w}" height="${h}" fill="url(#sea)"/>
        <g class="waves">${waves(layout)}</g>

        <!-- island: shallow water ring, beach, grass -->
        <path d="${island}" fill="var(--shallow)" transform="translate(${w / 2} ${h / 2}) scale(1.06) translate(${-w / 2} ${-h / 2})"/>
        <path d="${island}" fill="url(#grass)" stroke="var(--sand)" stroke-width="16" stroke-linejoin="round"/>

        <!-- paths from camp -->
        ${Object.entries(layout.paths).map(([k, d]) => `<path id="path-${k}" d="${d}" class="trail"/>`).join('')}

        <!-- Volcano Lab -->
        ${placed('chemistry', `
            <polygon points="120,262 205,128 240,128 330,262" fill="var(--rock)"/>
            <polygon points="205,128 240,128 228,150 214,146" fill="#ff7a2f"/>
            <path d="M212,140 q6,30 -6,58 M232,142 q-4,26 10,50" stroke="#ff7a2f" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>
            <circle class="smoke" cx="222" cy="118" r="12"/><circle class="smoke s2" cx="222" cy="118" r="10"/><circle class="smoke s3" cx="222" cy="118" r="14"/>
            <rect x="262" y="198" width="72" height="44" rx="6" fill="var(--wall)"/>
            <polygon points="256,200 298,176 340,200" fill="var(--roof)"/>
            <circle cx="298" cy="218" r="11" fill="var(--chem)" class="glow-window"/>
            <rect x="320" y="170" width="9" height="22" fill="var(--roof)"/>
            <circle class="bubble-up" cx="324" cy="166" r="4" fill="var(--chem)"/>
        `)}

        <!-- Whispering Forest -->
        ${placed('ecosystem', `
            <ellipse cx="840" cy="250" rx="34" ry="13" fill="var(--sea-light)" opacity=".9"/>
            ${trees}
        `)}

        <!-- Heart Castle -->
        ${placed('immune', `
            <rect x="248" y="412" width="92" height="46" fill="var(--wall)"/>
            <rect x="240" y="388" width="22" height="70" fill="var(--wall-dark)"/>
            <rect x="326" y="388" width="22" height="70" fill="var(--wall-dark)"/>
            <polygon points="236,390 251,364 266,390" fill="var(--imm)"/>
            <polygon points="322,390 337,364 352,390" fill="var(--imm)"/>
            <path d="M286,458 v-18 a8,8 0 0 1 16,0 v18 z" fill="var(--roof)"/>
            <path d="M294,428 c-6,-8 -16,-2 -10,6 l10,9 l10,-9 c6,-8 -4,-14 -10,-6z" fill="var(--imm)" class="beat"/>
            <line x1="251" y1="364" x2="251" y2="346" stroke="var(--roof)" stroke-width="2"/>
            <path class="flag" d="M251,346 q8,-3 16,0 q-8,3 -16,8z" fill="var(--imm)"/>
            <line x1="337" y1="364" x2="337" y2="346" stroke="var(--roof)" stroke-width="2"/>
            <path class="flag f2" d="M337,346 q8,-3 16,0 q-8,3 -16,8z" fill="var(--imm)"/>
        `)}

        <!-- Star Observatory -->
        ${placed('quantum', `
            ${stars}
            <rect x="700" y="420" width="62" height="34" rx="4" fill="var(--wall)"/>
            <path d="M696,422 a35,35 0 0 1 70,0 z" fill="var(--dome)"/>
            <g class="scope"><rect x="728" y="384" width="9" height="30" rx="3" fill="var(--qtm)"/></g>
            <rect x="724" y="434" width="14" height="20" rx="3" fill="var(--roof)"/>
        `)}

        <!-- Base camp -->
        ${placed('camp', `
            <polygon points="478,346 500,306 522,346" fill="var(--tent)"/>
            <polygon points="500,306 506,346 494,346" fill="var(--tent-dark)"/>
            <circle cx="540" cy="344" r="16" fill="url(#glow)" class="fire-glow"/>
            <path class="fire" d="M534,346 q6,-18 6,-18 q6,10 6,18 z" fill="#ff8a1f"/>
            <path class="fire f2" d="M537,346 q3,-10 3,-10 q4,6 3,10 z" fill="#ffd34d"/>
        `)}

        <!-- boat -->
        <g class="boat">
            <path d="M0,0 h44 l-8,12 h-28 z" fill="var(--roof)"/>
            <path d="M22,0 v-34 l18,30 z" fill="#ffffff"/>
            <path d="M20,-2 v-26 l-14,24 z" fill="#ffe1e6"/>
        </g>
        <path class="bird" d="M0,0 q6,-6 12,0 q6,-6 12,0"/>
        <path class="bird b2" d="M0,0 q5,-5 10,0 q5,-5 10,0"/>
    </svg>`;
}

let walker = { at: 'camp', busy: false };

export const isTall = () => layout === LAYOUTS.tall;

export function renderWorld(container, { info, onSelect, avatar }) {
    layout = phoneQuery?.matches ? LAYOUTS.tall : LAYOUTS.wide;
    container.innerHTML = `
        <div class="world ${isTall() ? 'tall' : ''}" id="world" style="aspect-ratio:${layout.w} / ${layout.h}">
            ${islandSVG()}
            <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
            ${['chemistry', 'ecosystem', 'immune', 'quantum'].map((k) => {
                const p = PLACES[k];
                const [x, y] = pos(k);
                const i = info(k);
                return `<button class="loc-pin ${k === walker.at ? 'is-here' : ''}" data-action="app:visit" data-arg="${k}"
                    style="${pct(x, y)};--pin:${i.color}" aria-label="Go to ${i.title}">
                    <span class="pin-icon"><span>${p.icon}</span></span>
                    <span class="pin-label"><b>${i.place}</b><small>${'★'.repeat(i.stars)}${'☆'.repeat(3 - i.stars)}</small></span>
                </button>`;
            }).join('')}
            <div class="walker" id="walker" style="${pct(...pos(walker.at))}">
                <span class="walker-body">${avatar}</span><span class="walker-shadow"></span>
            </div>
        </div>`;
    void onSelect;
}

// Call when the screen crosses the phone/computer width, to redraw the map.
export function onLayoutChange(fn) {
    phoneQuery?.addEventListener?.('change', fn);
}

function pointOn(pathEl, t, reverse) {
    const len = pathEl.getTotalLength();
    return pathEl.getPointAtLength(reverse ? len * (1 - t) : len * t);
}

function walkPath(key, reverse) {
    return new Promise((resolve) => {
        const pathEl = document.getElementById(`path-${key}`);
        const el = document.getElementById('walker');
        if (!pathEl || !el) { resolve(); return; }
        const duration = reduced() ? 0 : pathEl.getTotalLength() * 2.6;
        const start = performance.now();
        el.classList.add('walking');
        let lastX = null;
        const step = (now) => {
            const t = duration ? Math.min(1, (now - start) / duration) : 1;
            const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
            const pt = pointOn(pathEl, e, reverse);
            el.style.left = `${(pt.x / layout.w) * 100}%`;
            el.style.top = `${(pt.y / layout.h) * 100}%`;
            if (lastX !== null && Math.abs(pt.x - lastX) > 0.2) el.classList.toggle('face-left', pt.x < lastX);
            lastX = pt.x;
            if (t < 1) requestAnimationFrame(step);
            else { el.classList.remove('walking'); resolve(); }
        };
        requestAnimationFrame(step);
    });
}

// Walk from wherever the player is to `key` (via camp), then resolve.
export async function walkTo(key) {
    if (walker.busy || walker.at === key) return walker.at === key;
    walker.busy = true;
    if (walker.at !== 'camp') await walkPath(walker.at, true);
    await walkPath(key, false);
    walker.at = key;
    walker.busy = false;
    document.querySelectorAll('.loc-pin').forEach((p) => p.classList.toggle('is-here', p.dataset.arg === key));
    return true;
}

export const walkerAt = () => walker.at;

// Entering a game from a tab still puts the walker at that place on the map.
export function placeWalker(key) {
    if (PLACES[key] && !walker.busy) walker.at = key;
}
