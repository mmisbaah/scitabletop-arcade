// GAME 4: Quantum Leap Chess. UI layer: board rendering, clicks, undo, and
// handing turns to the CPU. The rules live in quantum-engine.js.

import { $, showToast, logTo, clearLog, icon, refreshIcons } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { teach, resetFacts } from '../core/facts.js';
import { byDifficulty } from '../core/difficulty.js';
import { settings, saveSettings } from '../core/storage.js';
import { QUANTUM_FACTS as F } from '../data/quantum-data.js';
import {
    SIZE, rc, enemy, startPosition, clonePosition, occupant, legalTargets, applyMove, chooseMove,
} from './quantum-engine.js';

const NAMES = { W: 'Cyan', B: 'Rose' };
const TYPE_NAMES = { A: 'Atom', P: 'Photon', E: 'Electron' };
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
            logTo('quantum-log', `${who} → ${where}${e.squares.length > 1 ? ' (superposition)' : ''}`);
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
        title: vsCpu() ? (humanWon ? 'You outplayed the CPU' : 'The CPU wins this one') : `${NAMES[winner][0]}${NAMES[winner].slice(1).toLowerCase()} wins`,
        // Only wins against the CPU count for the high score; faster wins score more.
        score: vsCpu() && humanWon ? Math.max(50, 300 - state.moves * 5 + survivors * 10) : null,
        stats: [
            ['Winner', NAMES[winner][0] + NAMES[winner].slice(1).toLowerCase()],
            ['Mode', vsCpu() ? 'Vs CPU' : '2 players'],
            ['Total moves', state.moves],
            ['Pieces left', survivors],
        ],
        metrics: { vsCpu: vsCpu() },
    });
}

function message() {
    if (state.over) return 'Game over. Restart, or undo to try a different line.';
    if (cpuToMove()) return 'Rose (CPU) is thinking…';
    const who = `${NAMES[state.pos.turn][0]}${NAMES[state.pos.turn].slice(1).toLowerCase()}`;
    if (state.pendingFirst !== null) return `${who}: pick a second empty square for superposition, or the same square again`;
    if (state.selected !== null) return `${who}: pick a destination`;
    return `${who} to move: select a piece`;
}

function render() {
    const winner = state.pos.winner;
    const dotColor = (winner ?? state.pos.turn) === 'W' ? 'var(--p1)' : 'var(--p2)';
    $('quantum-msg').innerHTML = `<span class="who" style="background:${dotColor}"></span><span></span>`;
    $('quantum-msg').lastChild.textContent = message();
    $('quantum-mode-btn').innerHTML = `${icon(vsCpu() ? 'atom' : 'gamepad-2')}${vsCpu() ? 'Vs CPU' : '2 players'}`;
    $('quantum-mode-btn').title = 'Switch between playing the CPU and a friend on this device';
    $('quantum-undo-btn').setAttribute('aria-disabled', state.history.length ? 'false' : 'true');
    refreshIcons($('quantum-mode-btn'));

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
        tile.setAttribute('aria-label', `${label(sq)}${piece ? `, ${NAMES[piece.color].toLowerCase()} ${TYPE_NAMES[piece.type]}` : ''}`);
        const classes = ['sq', (r + c) % 2 ? 'dark' : 'light'];
        if (sel && sel.squares.includes(sq)) classes.push('selected');
        if (state.pendingFirst === sq) classes.push('pending');
        if (targets.includes(sq)) classes.push('target', piece && piece.color !== sel.color ? 'capture' : '');
        tile.className = classes.filter(Boolean).join(' ');
        let html = c === 0 || r === SIZE - 1 ? `<span class="coord">${label(sq)}</span>` : '';
        if (piece) {
            const ghost = piece.squares.length > 1;
            html += `<span class="piece ${piece.color} ${ghost ? 'ghost' : ''}">${piece.type}${piece.excited ? '<span class="excited"></span>' : ''}</span>`;
        }
        tile.innerHTML = html;
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
        showToast('Nothing to undo yet');
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
        showToast(vsCpu() ? 'Now playing the CPU' : 'Now 2 players on one device');
        return init();
    }
    if (state.over) {
        showToast('Game over. Restart or undo.');
        return;
    }
    if (action === 'click') click(Number(arg));
}
