// GAME 4: Quantum Leap Chess. Two-player hotseat with superposed electrons.

import { $, showToast, logTo, clearLog, pick } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { teach, resetFacts } from '../core/facts.js';
import { QUANTUM_FACTS as F } from '../data/quantum-data.js';

const SIZE = 8;
const NAMES = { W: 'CYAN', B: 'ROSE' };
const TYPE_NAMES = { A: 'Atom', P: 'Photon', E: 'Electron' };
const COLOR_CLASS = { W: 'text-cyan-300', B: 'text-rose-400' };

// [row, col, type] for the cyan side. Rose is mirrored top-to-bottom.
const SETUP = [
    [7, 0, 'P'], [7, 3, 'E'], [7, 4, 'A'], [7, 5, 'E'], [7, 7, 'P'],
    [6, 3, 'E'], [6, 4, 'E'],
];

const rc = (sq) => [Math.floor(sq / SIZE), sq % SIZE];
const toSq = (r, c) => r * SIZE + c;
const onBoard = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const dist = (a, b) => {
    const [r1, c1] = rc(a);
    const [r2, c2] = rc(b);
    return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
};
const label = (sq) => {
    const [r, c] = rc(sq);
    return `${'ABCDEFGH'[c]}${SIZE - r}`;
};
const enemy = (color) => (color === 'W' ? 'B' : 'W');

let state;

export function init() {
    let id = 1;
    const pieces = [];
    for (const [r, c, type] of SETUP) {
        pieces.push({ id: id++, type, color: 'W', squares: [toSq(r, c)] });
        pieces.push({ id: id++, type, color: 'B', squares: [toSq(SIZE - 1 - r, c)] });
    }
    state = {
        pieces,
        turn: 'W',
        selected: null,   // piece id
        pendingFirst: null, // first superposition square for an electron
        over: false,
    };
    clearLog('quantum-log', 'Board ready. Cyan moves first.');
    resetFacts('quantum', F.intro);
    render();
}

function occupant(sq) {
    return state.pieces.find((p) => p.squares.includes(sq)) || null;
}

function legalTargets(piece) {
    const from = piece.squares[0];
    const [r, c] = rc(from);
    const out = [];
    const tryAdd = (sq) => {
        const occ = occupant(sq);
        if (!occ) { out.push(sq); return true; }
        if (occ.color !== piece.color) out.push(sq);
        return false;
    };

    if (piece.type === 'A') {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            if ((dr || dc) && onBoard(r + dr, c + dc)) tryAdd(toSq(r + dr, c + dc));
        }
    } else if (piece.type === 'P') {
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            let nr = r + dr, nc = c + dc;
            while (onBoard(nr, nc) && tryAdd(toSq(nr, nc))) { nr += dr; nc += dc; }
        }
    } else if (piece.type === 'E') {
        for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
            if ((dr || dc) && onBoard(r + dr, c + dc)) tryAdd(toSq(r + dr, c + dc));
        }
    }
    return out;
}

// Superposed electron picks one of its squares for real.
function collapse(piece, reason) {
    if (piece.squares.length < 2) return piece.squares[0];
    const real = pick(piece.squares);
    piece.squares = [real];
    playSound('quantum');
    logTo('quantum-log', `${NAMES[piece.color]} electron collapsed to ${label(real)} (${reason}).`);
    teach('quantum', reason === 'observed' ? F.observed : reason === 'attacked' ? F.attacked : F.measured);
    if (reason === 'observed') teach('quantum', F.observationNote);
    return real;
}

// Any superposed electron with a rival piece next to it gets observed.
function observeAll() {
    for (const e of state.pieces) {
        if (e.squares.length < 2) continue;
        const watched = state.pieces.some((o) => o.color !== e.color
            && o.squares.some((os) => e.squares.some((es) => dist(os, es) === 1)));
        if (watched) collapse(e, 'observed');
    }
}

function capture(piece) {
    state.pieces = state.pieces.filter((p) => p !== piece);
    playSound('hit');
    logTo('quantum-log', `${NAMES[piece.color]} ${TYPE_NAMES[piece.type]} captured!`);
    if (piece.type === 'A') {
        state.over = true;
        const winner = NAMES[enemy(piece.color)];
        playSound('win');
        showToast(`${winner} WINS!`);
        logTo('quantum-log', `${winner} captured the rival Atom. Game over.`);
    }
}

function finishMove(mover, squares) {
    mover.squares = squares;
    const where = squares.map(label).join(' + ');
    logTo('quantum-log', `${NAMES[mover.color]} ${TYPE_NAMES[mover.type]} -> ${where}${squares.length > 1 ? ' (superposition)' : ''}`);
    if (squares.length > 1) teach('quantum', F.superposition);
    else if (mover.type === 'P') teach('quantum', F.photon);
    else if (mover.type === 'A') teach('quantum', F.atom);
    if (state.over) return;
    observeAll();
    state.selected = null;
    state.pendingFirst = null;
    state.turn = enemy(state.turn);
}

function attack(mover, target) {
    const victim = occupant(target);
    if (victim && victim.squares.length > 1) {
        const real = collapse(victim, 'attacked');
        if (real !== target) {
            logTo('quantum-log', `The electron was never at ${label(target)}!`);
            return;
        }
    }
    if (victim) capture(victim);
}

function message() {
    if (state.over) return 'GAME OVER! PRESS RESET';
    const who = `${NAMES[state.turn]} TURN`;
    if (state.pendingFirst !== null) return `${who}: PICK A 2ND SQUARE FOR SUPERPOSITION, OR THE SAME SQUARE AGAIN`;
    if (state.selected !== null) return `${who}: PICK A DESTINATION`;
    return `${who}: SELECT A PIECE`;
}

function render() {
    const msg = $('quantum-msg');
    msg.textContent = message();
    msg.className = `font-pixel text-xs mb-3 text-center min-h-[2.5em] ${state.turn === 'W' ? 'text-cyan-300 neon-text-cyan' : 'text-rose-300 neon-text-pink'}`;

    const sel = state.pieces.find((p) => p.id === state.selected);
    let targets = sel ? legalTargets(sel) : [];
    if (state.pendingFirst !== null) {
        targets = targets.filter((sq) => !occupant(sq)).concat(state.pendingFirst);
    }

    const grid = $('quantum-grid');
    grid.innerHTML = '';
    for (let sq = 0; sq < SIZE * SIZE; sq++) {
        const [r, c] = rc(sq);
        const tile = document.createElement('button');
        tile.dataset.action = 'quantum:click';
        tile.dataset.arg = sq;
        tile.title = label(sq);
        const piece = occupant(sq);
        const classes = ['q-tile', (r + c) % 2 ? 'dark' : 'light'];
        if (sel && sel.squares.includes(sq)) classes.push('selected');
        if (state.pendingFirst === sq) classes.push('pending');
        if (targets.includes(sq)) classes.push('target', piece && piece.color !== sel.color ? 'capture' : '');
        tile.className = classes.filter(Boolean).join(' ');
        if (piece) {
            const ghost = piece.squares.length > 1;
            tile.innerHTML = `<span class="${COLOR_CLASS[piece.color]} ${ghost ? 'superposition-pulse' : ''}">${ghost ? piece.type.toLowerCase() : piece.type}</span>`;
        }
        grid.appendChild(tile);
    }
}

function click(sq) {
    const sel = state.pieces.find((p) => p.id === state.selected);
    const occ = occupant(sq);

    // Second half of an electron superposition move.
    if (state.pendingFirst !== null) {
        const first = state.pendingFirst;
        const ok = sq === first || (!occ && legalTargets(sel).includes(sq));
        if (!ok) {
            state.pendingFirst = null;
            state.selected = null;
            playSound('error');
            return render();
        }
        playSound('quantum');
        finishMove(sel, sq === first ? [first] : [first, sq]);
        return render();
    }

    // Select (or reselect) one of your own pieces.
    if (occ && occ.color === state.turn) {
        if (occ.squares.length > 1) collapse(occ, 'measured by its owner');
        state.selected = state.selected === occ.id ? null : occ.id;
        playSound('card');
        return render();
    }

    if (!sel) return;
    if (!legalTargets(sel).includes(sq)) {
        playSound('error');
        return;
    }

    if (sel.type === 'E' && !occ) {
        state.pendingFirst = sq;
        playSound('quantum');
        return render();
    }

    attack(sel, sq);
    finishMove(sel, [sq]);
    render();
}

export function handle(action, arg) {
    if (action === 'reset') return init();
    if (state.over) {
        showToast('GAME OVER! PRESS RESET');
        return;
    }
    if (action === 'click') click(Number(arg));
}
