// Pure rules and CPU player for Quantum Leap Chess. No DOM in here.
//
// A position is { pieces, turn }. Each piece is
//   { id, type: 'A' | 'P' | 'E', color: 'W' | 'B', squares: [sq] or [sqA, sqB], excited? }
// where two squares means an electron in superposition.

export const SIZE = 8;
export const VALUES = { A: 100, P: 5, E: 3 };

export const rc = (sq) => [Math.floor(sq / SIZE), sq % SIZE];
export const toSq = (r, c) => r * SIZE + c;
const onBoard = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
export const dist = (a, b) => {
    const [r1, c1] = rc(a);
    const [r2, c2] = rc(b);
    return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
};
export const enemy = (color) => (color === 'W' ? 'B' : 'W');

// [row, col, type] for the cyan side. Rose is mirrored top-to-bottom.
const SETUP = [
    [7, 0, 'P'], [7, 3, 'E'], [7, 4, 'A'], [7, 5, 'E'], [7, 7, 'P'],
    [6, 3, 'E'], [6, 4, 'E'],
];

export function startPosition() {
    let id = 1;
    const pieces = [];
    for (const [r, c, type] of SETUP) {
        pieces.push({ id: id++, type, color: 'W', squares: [toSq(r, c)] });
        pieces.push({ id: id++, type, color: 'B', squares: [toSq(SIZE - 1 - r, c)] });
    }
    return { pieces, turn: 'W', nextId: id };
}

export const clonePosition = (pos) => structuredClone(pos);

export function occupant(pos, sq) {
    return pos.pieces.find((p) => p.squares.includes(sq)) || null;
}

// Squares a classical piece may move to. Includes captures and photon absorption.
export function legalTargets(pos, piece) {
    const from = piece.squares[0];
    const [r, c] = rc(from);
    const out = [];
    const tryAdd = (sq) => {
        const occ = occupant(pos, sq);
        if (!occ) { out.push(sq); return true; }
        if (occ.color !== piece.color) out.push(sq);
        // A photon can be absorbed by a friendly, unexcited atom.
        else if (piece.type === 'P' && occ.type === 'A' && !occ.excited) out.push(sq);
        return false;
    };
    const ring = (radius) => {
        for (let dr = -radius; dr <= radius; dr++) for (let dc = -radius; dc <= radius; dc++) {
            if ((dr || dc) && onBoard(r + dr, c + dc)) tryAdd(toSq(r + dr, c + dc));
        }
    };

    if (piece.type === 'A') ring(piece.excited ? 2 : 1);
    else if (piece.type === 'E') ring(2);
    else if (piece.type === 'P') {
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            let nr = r + dr, nc = c + dc;
            while (onBoard(nr, nc) && tryAdd(toSq(nr, nc))) { nr += dr; nc += dc; }
        }
    }
    return out;
}

// Every move for the side to play. Superposed pieces are treated as sitting on
// their first square (selecting one collapses it in real play anyway).
export function allMoves(pos, { superpositions = 0 } = {}) {
    const moves = [];
    for (const piece of pos.pieces.filter((p) => p.color === pos.turn)) {
        const from = piece.squares[0];
        const view = piece.squares.length > 1 ? { ...piece, squares: [from] } : piece;
        const targets = legalTargets(pos, view);
        for (const to of targets) moves.push({ id: piece.id, to: [to] });
        if (piece.type === 'E' && superpositions > 0) {
            const empty = targets.filter((sq) => !occupant(pos, sq));
            for (let k = 0; k < superpositions && empty.length > 1; k++) {
                const a = empty[Math.floor(Math.random() * empty.length)];
                const b = empty[Math.floor(Math.random() * empty.length)];
                if (a !== b) moves.push({ id: piece.id, to: [a, b] });
            }
        }
    }
    return moves;
}

// Applies a move. `rng` decides collapses; pass a fixed function to explore one
// outcome. Returns a list of events so the UI can narrate what happened.
export function applyMove(pos, move, rng = Math.random) {
    const events = [];
    const mover = pos.pieces.find((p) => p.id === move.id);
    if (mover.squares.length > 1) {
        mover.squares = [mover.squares[rng() < 0.5 ? 0 : 1]];
        events.push({ kind: 'collapse', piece: mover, reason: 'measured' });
    }
    const from = mover.squares[0];
    const target = move.to[0];
    const victim = occupant(pos, target);

    if (victim && victim.color === mover.color) {
        // Photon absorbed by its own atom.
        pos.pieces = pos.pieces.filter((p) => p !== mover);
        victim.excited = true;
        events.push({ kind: 'absorb', piece: mover, atom: victim, sq: target });
    } else {
        let captured = false;
        if (victim) {
            let hit = true;
            if (victim.squares.length > 1) {
                const real = victim.squares[rng() < 0.5 ? 0 : 1];
                victim.squares = [real];
                events.push({ kind: 'collapse', piece: victim, reason: 'attacked', sq: real });
                hit = real === target;
                if (!hit) events.push({ kind: 'miss', sq: target });
            }
            if (hit) {
                pos.pieces = pos.pieces.filter((p) => p !== victim);
                captured = true;
                events.push({ kind: 'capture', piece: victim });
                if (victim.type === 'A') pos.winner = mover.color;
            }
        }
        mover.squares = [...move.to];
        events.push({ kind: 'move', piece: mover, squares: mover.squares, captured });

        // An excited atom drops back down and re-emits its photon.
        if (mover.type === 'A' && mover.excited) {
            mover.excited = false;
            pos.pieces.push({ id: pos.nextId++, type: 'P', color: mover.color, squares: [from] });
            events.push({ kind: 'emit', atom: mover, sq: from });
        }
    }

    if (!pos.winner) {
        // Any superposed electron with a rival piece next to it gets observed.
        for (const e of pos.pieces) {
            if (e.squares.length < 2) continue;
            const watched = pos.pieces.some((o) => o.color !== e.color
                && o.squares.some((os) => e.squares.some((es) => dist(os, es) === 1)));
            if (watched) {
                e.squares = [e.squares[rng() < 0.5 ? 0 : 1]];
                events.push({ kind: 'collapse', piece: e, reason: 'observed' });
            }
        }
    }
    pos.turn = enemy(pos.turn);
    return events;
}

// ---------------------------------------------------------------------------
// CPU player

// Material plus a penalty for pieces the opponent can take next move.
function evaluate(pos, me) {
    if (pos.winner) return pos.winner === me ? 10000 : -10000;
    let score = 0;
    for (const p of pos.pieces) score += (p.color === me ? 1 : -1) * VALUES[p.type] * (p.squares.length > 1 ? 0.9 : 1);

    // Pieces hanging to whoever moves next.
    const mover = pos.turn;
    const attacked = new Set();
    for (const p of pos.pieces.filter((x) => x.color === mover)) {
        const view = p.squares.length > 1 ? { ...p, squares: [p.squares[0]] } : p;
        for (const sq of legalTargets(pos, view)) attacked.add(sq);
    }
    for (const p of pos.pieces.filter((x) => x.color !== mover)) {
        const hits = p.squares.filter((sq) => attacked.has(sq)).length;
        if (!hits) continue;
        const risk = VALUES[p.type] * (hits / p.squares.length) * 0.8;
        score += p.color === me ? -risk : risk;
    }
    // Slight preference for an active, forward position.
    score += 0.02 * allMoves({ ...pos, turn: me }).length;
    return score;
}

// Expected value of a move, averaging both outcomes of any collapse it causes.
function expectedAfter(pos, move, me, reply) {
    let total = 0;
    for (const coin of [0.25, 0.75]) {
        const next = clonePosition(pos);
        applyMove(next, move, () => coin);
        total += 0.5 * (reply ? worstReply(next, me) : evaluate(next, me));
    }
    return total;
}

function worstReply(pos, me) {
    if (pos.winner) return evaluate(pos, me);
    let worst = Infinity;
    for (const m of allMoves(pos)) {
        const next = clonePosition(pos);
        applyMove(next, m, () => 0.5);
        worst = Math.min(worst, evaluate(next, me));
        if (worst <= -10000) break;
    }
    return worst === Infinity ? evaluate(pos, me) : worst;
}

// level 0: mostly random, 1: one move ahead, 2: also considers your best reply.
export function chooseMove(pos, level) {
    const me = pos.turn;
    const moves = allMoves(pos, { superpositions: level === 0 ? 0 : 3 });
    if (!moves.length) return null;
    if (level === 0 && Math.random() < 0.5) return moves[Math.floor(Math.random() * moves.length)];

    let best = null;
    let bestScore = -Infinity;
    for (const m of moves) {
        const s = expectedAfter(pos, m, me, level >= 2) + Math.random() * 0.01;
        if (s > bestScore) { bestScore = s; best = m; }
    }
    return best;
}
