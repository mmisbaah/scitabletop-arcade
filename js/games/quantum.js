// GAME 4: Quantum Leap Chess. UI layer: board rendering, clicks, undo, and
// handing turns to the CPU. The rules live in quantum-engine.js.

import { $, showToast, logTo, clearLog } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { teach, resetFacts } from '../core/facts.js';
import { byDifficulty } from '../core/difficulty.js';
import { settings, saveSettings } from '../core/storage.js';
import { QUANTUM_FACTS as F } from '../data/quantum-data.js';
import {
    SIZE, rc, enemy, startPosition, clonePosition, occupant, legalTargets, applyMove, chooseMove,
} from './quantum-engine.js';

const NAMES = { W: 'CYAN', B: 'ROSE' };
const TYPE_NAMES = { A: 'Atom', P: 'Photon', E: 'Electron' };
const COLOR_CLASS = { W: 'text-cyan-300', B: 'text-rose-400' };
const CPU_COLOR = 'B';
const CPU_DELAY = 450;

const label = (sq) => {
    const [r, c] = rc(sq);
    return `${'ABCDEFGH'[c]}${SIZE - r}`;
};

let state;
let cpuTimer = null;
let onGameOver = () => {};
export function setGameOverHandler(fn) { onGameOver = fn; }

const vsCpu = () => settings.quantumMode === 'cpu';
const cpuToMove = () => vsCpu() && state.pos.turn === CPU_COLOR && !state.over;

export function init() {
    clearTimeout(cpuTimer);
    state = {
        pos: startPosition(),
        selected: null,     // piece id
        pendingFirst: null, // first superposition square for an electron
        history: [],        // positions before each move, for UNDO
        moves: 0,
        over: false,
    };
    clearLog('quantum-log', `Board ready. Cyan moves first${vsCpu() ? '; the CPU plays Rose' : ''}.`);
    resetFacts('quantum', F.intro);
    render();
}

const pieceById = (id) => state.pos.pieces.find((p) => p.id === id);

// Turns engine events into log lines, sounds and Lab Notes.
function narrate(events) {
    for (const e of events) {
        const who = e.piece ? `${NAMES[e.piece.color]} ${TYPE_NAMES[e.piece.type]}` : '';
        if (e.kind === 'collapse') {
            playSound('quantum');
            logTo('quantum-log', `${NAMES[e.piece.color]} electron collapsed to ${label(e.piece.squares[0])} (${e.reason}).`);
            teach('quantum', F[e.reason]);
            if (e.reason === 'observed') teach('quantum', F.observationNote);
        } else if (e.kind === 'miss') {
            logTo('quantum-log', `The electron was never at ${label(e.sq)}!`);
        } else if (e.kind === 'capture') {
            playSound('hit');
            logTo('quantum-log', `${who} captured!`);
        } else if (e.kind === 'move') {
            const where = e.squares.map(label).join(' + ');
            logTo('quantum-log', `${who} -> ${where}${e.squares.length > 1 ? ' (superposition)' : ''}`);
            if (e.squares.length > 1) teach('quantum', F.superposition);
            else if (e.piece.type === 'P') teach('quantum', F.photon);
            else if (e.piece.type === 'A' && !e.captured) teach('quantum', F.atom);
        } else if (e.kind === 'absorb') {
            playSound('synth');
            logTo('quantum-log', `${NAMES[e.atom.color]} Atom absorbed a photon at ${label(e.sq)} and is now excited.`);
            teach('quantum', F.absorbed);
        } else if (e.kind === 'emit') {
            playSound('synth');
            logTo('quantum-log', `${NAMES[e.atom.color]} Atom re-emitted its photon at ${label(e.sq)}.`);
            teach('quantum', F.emitted);
        }
    }
}

function play(move) {
    state.history.push(clonePosition(state.pos));
    const events = applyMove(state.pos, move);
    state.moves += 1;
    state.selected = null;
    state.pendingFirst = null;
    narrate(events);
    if (state.pos.winner) return finish();
    render();
    if (cpuToMove()) cpuTimer = setTimeout(cpuMove, CPU_DELAY);
}

function cpuMove() {
    if (!cpuToMove()) return;
    const level = byDifficulty({ easy: 0, normal: 1, hard: 2 });
    let move = chooseMove(state.pos, level);
    if (!move) return;
    // Picking up a superposed electron measures it first, then the CPU re-plans.
    const piece = pieceById(move.id);
    if (piece.squares.length > 1) {
        piece.squares = [piece.squares[Math.random() < 0.5 ? 0 : 1]];
        narrate([{ kind: 'collapse', piece, reason: 'measured' }]);
        move = chooseMove(state.pos, level);
    }
    play(move);
}

function finish() {
    state.over = true;
    const winner = state.pos.winner;
    playSound(!vsCpu() || winner === 'W' ? 'win' : 'lose');
    logTo('quantum-log', `${NAMES[winner]} captured the rival Atom. Game over.`);
    render();
    const humanWon = winner === 'W';
    const survivors = state.pos.pieces.filter((p) => p.color === winner).length;
    onGameOver({
        won: vsCpu() ? humanWon : true,
        title: vsCpu() ? (humanWon ? 'YOU OUT-QUANTUMED THE CPU!' : 'THE CPU WINS') : `${NAMES[winner]} WINS!`,
        // Only wins against the CPU count for the high score; faster wins score more.
        score: vsCpu() && humanWon ? Math.max(50, 300 - state.moves * 5 + survivors * 10) : null,
        stats: [
            ['WINNER', NAMES[winner]],
            ['MODE', vsCpu() ? `VS CPU (${settings.difficulty.toUpperCase()})` : '2 PLAYER'],
            ['TOTAL MOVES', state.moves],
            ['PIECES LEFT', survivors],
        ],
    });
}

function message() {
    if (state.over) return 'GAME OVER! PRESS RESET OR UNDO';
    if (cpuToMove()) return 'ROSE (CPU) IS THINKING...';
    const who = `${NAMES[state.pos.turn]} TURN`;
    if (state.pendingFirst !== null) return `${who}: PICK A 2ND SQUARE FOR SUPERPOSITION, OR THE SAME SQUARE AGAIN`;
    if (state.selected !== null) return `${who}: PICK A DESTINATION`;
    return `${who}: SELECT A PIECE`;
}

function render() {
    const msg = $('quantum-msg');
    msg.textContent = message();
    msg.className = `font-pixel text-xs mb-3 text-center min-h-[2.5em] ${state.pos.turn === 'W' ? 'text-cyan-300 neon-text-cyan' : 'text-rose-300 neon-text-pink'}`;
    $('quantum-mode-btn').textContent = vsCpu() ? 'MODE: VS CPU' : 'MODE: 2 PLAYER';
    $('quantum-undo-btn').setAttribute('aria-disabled', state.history.length ? 'false' : 'true');

    const sel = state.selected !== null ? pieceById(state.selected) : null;
    let targets = sel ? legalTargets(state.pos, sel) : [];
    if (state.pendingFirst !== null) {
        targets = targets.filter((sq) => !occupant(state.pos, sq)).concat(state.pendingFirst);
    }

    const grid = $('quantum-grid');
    grid.innerHTML = '';
    for (let sq = 0; sq < SIZE * SIZE; sq++) {
        const [r, c] = rc(sq);
        const tile = document.createElement('button');
        tile.dataset.action = 'quantum:click';
        tile.dataset.arg = sq;
        const piece = occupant(state.pos, sq);
        tile.setAttribute('aria-label', `${label(sq)}${piece ? `, ${NAMES[piece.color]} ${TYPE_NAMES[piece.type]}` : ''}`);
        const classes = ['q-tile', (r + c) % 2 ? 'dark' : 'light'];
        if (sel && sel.squares.includes(sq)) classes.push('selected');
        if (state.pendingFirst === sq) classes.push('pending');
        if (targets.includes(sq)) classes.push('target', piece && piece.color !== sel.color ? 'capture' : '');
        tile.className = classes.filter(Boolean).join(' ');
        if (piece) {
            const ghost = piece.squares.length > 1;
            const glyph = ghost ? piece.type.toLowerCase() : piece.type;
            tile.innerHTML = `<span class="${COLOR_CLASS[piece.color]} ${ghost ? 'superposition-pulse' : ''}">${glyph}${piece.excited ? '<sup class="text-yellow-300">*</sup>' : ''}</span>`;
        }
        grid.appendChild(tile);
    }
}

function click(sq) {
    if (cpuToMove()) return;
    const sel = state.selected !== null ? pieceById(state.selected) : null;
    const occ = occupant(state.pos, sq);

    // Second half of an electron superposition move.
    if (state.pendingFirst !== null) {
        const first = state.pendingFirst;
        const ok = sq === first || (!occ && legalTargets(state.pos, sel).includes(sq));
        if (!ok) {
            state.pendingFirst = null;
            state.selected = null;
            playSound('error');
            return render();
        }
        playSound('quantum');
        return play({ id: sel.id, to: sq === first ? [first] : [first, sq] });
    }

    // Select (or reselect) one of your own pieces, unless a photon is being absorbed.
    const absorbing = sel && sel.type === 'P' && occ && occ.id !== sel.id && legalTargets(state.pos, sel).includes(sq);
    if (occ && occ.color === state.pos.turn && !absorbing) {
        if (occ.squares.length > 1) {
            occ.squares = [occ.squares[Math.random() < 0.5 ? 0 : 1]];
            narrate([{ kind: 'collapse', piece: occ, reason: 'measured' }]);
        }
        state.selected = state.selected === occ.id ? null : occ.id;
        playSound('card');
        return render();
    }

    if (!sel) return;
    if (!legalTargets(state.pos, sel).includes(sq)) {
        playSound('error');
        return;
    }
    if (sel.type === 'E' && !occ) {
        state.pendingFirst = sq;
        playSound('quantum');
        return render();
    }
    play({ id: sel.id, to: [sq] });
}

function undo() {
    clearTimeout(cpuTimer);
    if (!state.history.length) {
        playSound('error');
        showToast('NOTHING TO UNDO');
        return;
    }
    // Against the CPU, step back to the last position where it was your turn.
    do {
        state.pos = state.history.pop();
        state.moves -= 1;
    } while (vsCpu() && state.pos.turn === CPU_COLOR && state.history.length);
    state.selected = null;
    state.pendingFirst = null;
    state.over = false;
    playSound('card');
    logTo('quantum-log', 'Move taken back.');
    render();
    if (cpuToMove()) cpuTimer = setTimeout(cpuMove, CPU_DELAY);
}

export function handle(action, arg) {
    if (action === 'reset') return init();
    if (action === 'undo') return undo();
    if (action === 'mode') {
        settings.quantumMode = vsCpu() ? 'pvp' : 'cpu';
        saveSettings();
        showToast(vsCpu() ? 'MODE: VS CPU' : 'MODE: 2 PLAYER');
        return init();
    }
    if (state.over) {
        showToast('GAME OVER! PRESS RESET OR UNDO');
        return;
    }
    if (action === 'click') click(Number(arg));
}
