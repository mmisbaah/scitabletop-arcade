// Animation toolkit shared by every game. Uses the Web Animations API so
// nothing fights with CSS, and skips everything for reduced-motion users.

export const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

let layer = null;
function fxLayer() {
    if (!layer || !layer.isConnected) {
        layer = document.createElement('div');
        layer.className = 'fx-layer';
        document.body.appendChild(layer);
    }
    return layer;
}

const EASE = 'cubic-bezier(.2,.8,.2,1)';

// A detached copy of an element pinned where it is on screen, so it can keep
// animating after the real element is re-rendered or removed.
export function ghost(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const g = el.cloneNode(true);
    g.removeAttribute('id');
    g.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    g.classList.add('fx-ghost');
    Object.assign(g.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: '0' });
    fxLayer().appendChild(g);
    return g;
}

// Animates `el` from `from` (a DOMRect) to wherever it is now, with a small arc.
export function flyFrom(from, el, { duration = 420, arc = -36 } = {}) {
    if (!el || !from || reduced()) return;
    const to = el.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const s = to.width ? from.width / to.width : 1;
    el.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${s})` },
        { transform: `translate(${dx / 2}px, ${dy / 2 + arc}px) scale(${(s + 1.15) / 2})`, offset: 0.55 },
        { transform: 'none' },
    ], { duration, easing: EASE });
}

// FLIP: re-render `container` with `render()`, then slide every keyed child
// from its old spot to its new one. New children pop in; removed ones fade out.
// `fallback(key)` names an old key a brand-new child should grow out of.
export function flip(container, render, { selector = '[data-key]', enter = true, exit = true, fallback, exitDelay = 0, duration = 380 } = {}) {
    if (!container) { render(); return; }
    const gameColor = getComputedStyle(container).getPropertyValue('--game');
    const before = new Map();
    const olds = new Map();
    container.querySelectorAll(selector).forEach((el) => {
        before.set(el.dataset.key, el.getBoundingClientRect());
        olds.set(el.dataset.key, el);
    });
    const exiting = [];
    if (exit && !reduced()) olds.forEach((el, key) => exiting.push([key, el]));
    const ghosts = new Map(exiting.map(([key, el]) => [key, { el, rect: before.get(key) }]));

    render();
    if (reduced()) return;

    const seen = new Set();
    container.querySelectorAll(selector).forEach((el) => {
        const key = el.dataset.key;
        seen.add(key);
        const old = before.get(key) ?? (fallback ? before.get(fallback(key)) : null);
        if (old) {
            const now = el.getBoundingClientRect();
            const dx = old.left - now.left, dy = old.top - now.top;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration, easing: EASE });
            }
        } else if (enter) {
            el.animate([{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.7 }, { transform: 'none' }], { duration: 360, easing: EASE });
        }
    });

    ghosts.forEach(({ el }, key) => {
        if (seen.has(key)) return;
        // The old element is detached now; rebuild it in the fx layer at its old rect.
        const r = before.get(key);
        const g = el.cloneNode(true);
        g.classList.add('fx-ghost');
        g.style.setProperty('--game', gameColor);
        Object.assign(g.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: '0' });
        fxLayer().appendChild(g);
        g.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(1.15) rotate(-6deg)', opacity: 1, offset: 0.4 }, { transform: 'scale(0) rotate(20deg)', opacity: 0 }],
            { duration: 420, delay: exitDelay, easing: 'ease-in', fill: 'both' }).onfinish = () => g.remove();
    });
}

// A sprite (any HTML) that flies between two rects, then resolves.
export function sprite(html, from, to, { duration = 420, arc = -60, size = 34 } = {}) {
    return new Promise((resolve) => {
        if (reduced() || !from || !to) { resolve(); return; }
        const s = document.createElement('div');
        s.className = 'fx-sprite';
        s.innerHTML = html;
        s.style.fontSize = `${size}px`;
        const x0 = from.left + from.width / 2, y0 = from.top + from.height / 2;
        const x1 = to.left + to.width / 2, y1 = to.top + to.height / 2;
        Object.assign(s.style, { left: `${x0}px`, top: `${y0}px` });
        fxLayer().appendChild(s);
        const dx = x1 - x0, dy = y1 - y0;
        s.animate([
            { transform: 'translate(-50%, -50%) scale(.6)' },
            { transform: `translate(calc(-50% + ${dx / 2}px), calc(-50% + ${dy / 2 + arc}px)) scale(1.15)`, offset: 0.5 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)` },
        ], { duration, easing: EASE, fill: 'forwards' }).onfinish = () => { s.remove(); resolve(); };
    });
}

// Particles bursting out of a point (or the centre of a rect).
export function burst(at, { count = 14, colors = ['#f5b301', '#ff6b80', '#2fd0a3', '#7090ff'], emoji = null, spread = 70, size = 8 } = {}) {
    if (reduced() || !at) return;
    const x = at.x ?? at.left + at.width / 2;
    const y = at.y ?? at.top + at.height / 2;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'fx-particle';
        if (emoji) {
            p.textContent = Array.isArray(emoji) ? emoji[i % emoji.length] : emoji;
            p.style.fontSize = `${size * 2}px`;
        } else {
            Object.assign(p.style, { width: `${size}px`, height: `${size}px`, background: colors[i % colors.length] });
        }
        Object.assign(p.style, { left: `${x}px`, top: `${y}px` });
        fxLayer().appendChild(p);
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const d = spread * (0.5 + Math.random() * 0.7);
        p.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 20}px)) scale(.4)`, opacity: 0 },
        ], { duration: 620 + Math.random() * 300, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'forwards' }).onfinish = () => p.remove();
    }
}

// A ring that ripples out from a point: used for quantum collapse.
export function ripple(rect, color = 'var(--qtm)') {
    if (reduced() || !rect) return;
    const r = document.createElement('div');
    r.className = 'fx-ripple';
    Object.assign(r.style, { left: `${rect.left + rect.width / 2}px`, top: `${rect.top + rect.height / 2}px`, borderColor: color });
    fxLayer().appendChild(r);
    r.animate([{ transform: 'translate(-50%, -50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(2.6)', opacity: 0 }],
        { duration: 650, easing: 'ease-out', fill: 'forwards' }).onfinish = () => r.remove();
}

export function shakeScreen(el = document.querySelector('main')) {
    if (reduced() || !el) return;
    el.animate([{ transform: 'none' }, { transform: 'translate(-8px, 3px)' }, { transform: 'translate(7px, -4px)' }, { transform: 'translate(-5px, 2px)' }, { transform: 'none' }],
        { duration: 380, easing: 'ease-out' });
}

export function flash(color = 'rgb(230 40 60 / 28%)') {
    if (reduced()) return;
    const f = document.createElement('div');
    f.className = 'fx-flash';
    f.style.background = color;
    fxLayer().appendChild(f);
    f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' }).onfinish = () => f.remove();
}
