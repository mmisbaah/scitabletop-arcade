// GAME 1: Elemental Alchemy. Player vs a greedy CPU chemist.

import { $, showToast, logTo, clearLog, shake } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { RECIPES, ATOM_WEIGHTS, ATOM_COLORS, WIN_SCORE, HAND_LIMIT, START_HAND } from '../data/chemistry-data.js';

const ATOM_POOL = Object.entries(ATOM_WEIGHTS).flatMap(([atom, n]) => Array(n).fill(atom));
const drawAtom = () => ATOM_POOL[Math.floor(Math.random() * ATOM_POOL.length)];
const drawMany = (n) => Array.from({ length: n }, drawAtom);

let state;

function countAtoms(list) {
    const counts = {};
    for (const a of list) counts[a] = (counts[a] || 0) + 1;
    return counts;
}

// Exact match: same atoms, same counts, nothing extra.
function matchesExactly(counts, recipe) {
    const keys = Object.keys(recipe.atoms);
    return keys.length === Object.keys(counts).length && keys.every((k) => counts[k] === recipe.atoms[k]);
}

// Enough atoms in a pool to build the recipe.
function canBuild(counts, recipe) {
    return Object.entries(recipe.atoms).every(([k, n]) => (counts[k] || 0) >= n);
}

function removeAtoms(list, atoms) {
    const out = [...list];
    for (const [k, n] of Object.entries(atoms)) {
        for (let i = 0; i < n; i++) out.splice(out.indexOf(k), 1);
    }
    return out;
}

export function init() {
    state = {
        p1: 0,
        cpu: 0,
        turn: 1,
        hand: drawMany(START_HAND),
        cpuHand: drawMany(START_HAND),
        bench: [],
        trading: false, // TRADE armed: next hand click swaps that card
        over: false,
    };
    clearLog('chem-log', 'Lab open. Build a molecule or draw atoms.');
    render();
}

function render() {
    $('chem-p1').textContent = state.p1;
    $('chem-cpu').textContent = state.cpu;
    $('chem-turn').textContent = state.turn;
    $('chem-trade-btn').classList.toggle('armed', state.trading);
    $('chem-hand-count').textContent = `${state.hand.length}/${HAND_LIMIT}`;

    const pool = countAtoms([...state.hand, ...state.bench]);
    $('chem-recipes').innerHTML = RECIPES.map((r) => {
        const ready = canBuild(pool, r);
        return `
        <div class="p-2 bg-slate-900 border ${ready ? 'border-emerald-500' : 'border-slate-800'} flex justify-between items-center">
            <div>
                <span class="font-pixel text-[10px] ${ready ? 'text-white' : 'text-slate-400'}">${r.name}</span>
                <span class="font-pixel text-[10px] text-emerald-400 ml-1 border border-emerald-800 px-1">${r.formula}</span>
            </div>
            <span class="font-pixel text-xs text-yellow-400">+${r.pts}</span>
        </div>`;
    }).join('');

    $('chem-bench').innerHTML = state.bench.length === 0
        ? `<span class="font-pixel text-[10px] text-slate-500">SELECT ATOMS FROM YOUR HAND</span>`
        : state.bench.map((a, i) => `
            <button data-action="chemistry:unbench" data-arg="${i}"
                class="w-12 h-12 bg-emerald-500 text-black font-pixel text-xs border-2 border-black shadow-[2px_2px_0px_#000]">${a}</button>
        `).join('');

    $('chem-hand').innerHTML = state.hand.map((a, i) => `
        <button data-action="chemistry:bench" data-arg="${i}"
            class="w-11 h-14 bg-slate-950 border-2 ${ATOM_COLORS[a]} font-pixel text-xs hover:border-yellow-400 shadow-[2px_2px_0px_#000]
            ${state.trading ? 'outline outline-2 outline-dashed outline-yellow-400' : ''}">${a}</button>
    `).join('') || `<span class="font-pixel text-[10px] text-slate-500">EMPTY HAND, DRAW!</span>`;
}

function checkWinner() {
    if (state.p1 >= WIN_SCORE || state.cpu >= WIN_SCORE) {
        state.over = true;
        const won = state.p1 >= WIN_SCORE;
        playSound(won ? 'win' : 'lose');
        showToast(won ? 'YOU WIN! MASTER ALCHEMIST' : 'CPU WINS! PRESS RESET');
        logTo('chem-log', won ? `You reached ${state.p1} points. Victory!` : `CPU reached ${state.cpu} points.`);
        return true;
    }
    return false;
}

function cpuTurn() {
    const counts = countAtoms(state.cpuHand);
    const options = RECIPES.filter((r) => canBuild(counts, r)).sort((a, b) => b.pts - a.pts);
    if (options.length) {
        const r = options[0];
        state.cpuHand = removeAtoms(state.cpuHand, r.atoms);
        state.cpu += r.pts;
        logTo('chem-log', `CPU synthesized ${r.formula} (+${r.pts}).`);
    } else {
        state.cpuHand.push(...drawMany(2));
        while (state.cpuHand.length > HAND_LIMIT) state.cpuHand.splice(Math.floor(Math.random() * state.cpuHand.length), 1);
        logTo('chem-log', 'CPU drew 2 atoms.');
    }
}

function endPlayerTurn() {
    if (checkWinner()) return render();
    cpuTurn();
    state.turn += 1;
    checkWinner();
    render();
}

const actions = {
    reset: init,

    bench(i) {
        if (state.trading) return tradeCard(i);
        state.bench.push(state.hand.splice(i, 1)[0]);
        playSound('card');
        render();
    },

    unbench(i) {
        state.hand.push(state.bench.splice(i, 1)[0]);
        playSound('card');
        render();
    },

    clear() {
        state.hand.push(...state.bench);
        state.bench = [];
        render();
    },

    synthesize() {
        const counts = countAtoms(state.bench);
        const match = RECIPES.find((r) => matchesExactly(counts, r));
        if (!match) {
            playSound('error');
            shake($('chem-bench'));
            showToast('INVALID MOLECULE RATIO!');
            return;
        }
        playSound('synth');
        state.p1 += match.pts;
        state.bench = [];
        showToast(`SYNTHESIZED ${match.name}! +${match.pts}`);
        logTo('chem-log', `You synthesized ${match.formula} (+${match.pts}).`);
        endPlayerTurn();
    },

    draw() {
        const room = HAND_LIMIT - state.hand.length - state.bench.length;
        if (room <= 0) {
            playSound('error');
            showToast('HAND FULL! TRADE OR BUILD');
            return;
        }
        const drawn = drawMany(Math.min(2, room));
        state.hand.push(...drawn);
        playSound('card');
        logTo('chem-log', `You drew ${drawn.join(', ')}.`);
        endPlayerTurn();
    },

    trade() {
        if (state.hand.length === 0) {
            playSound('error');
            showToast('NOTHING TO TRADE');
            return;
        }
        state.trading = !state.trading;
        playSound('card');
        if (state.trading) showToast('CLICK A CARD TO TRADE IT');
        render();
    },
};

function tradeCard(i) {
    const old = state.hand[i];
    const fresh = drawAtom();
    state.hand[i] = fresh;
    state.trading = false;
    playSound('card');
    logTo('chem-log', `You traded ${old} for ${fresh}.`);
    endPlayerTurn();
}

export function handle(action, arg) {
    if (state.over && action !== 'reset') {
        showToast('GAME OVER! PRESS RESET');
        return;
    }
    const fn = actions[action];
    if (fn) fn(arg === undefined ? undefined : Number(arg));
}
