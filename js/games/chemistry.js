// GAME 1: Elemental Alchemy. Player vs a CPU chemist, competing for the same
// face-up atom market and racing to discover each molecule first.

import { $, showToast, logTo, clearLog, shake, pick, setMeter, floatPoints } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { teach, resetFacts } from '../core/facts.js';
import { byDifficulty } from '../core/difficulty.js';
import { isYoung, byAge, say } from '../core/age.js';
import { moleculeSVG } from '../core/art.js';
import { confetti } from '../core/confetti.js';
import { flyFrom, sprite, burst } from '../core/anim.js';
import { currentLevel } from '../core/progress.js';

let LEVEL = 1;

// Effects that need the freshly rendered DOM run right after the next render.
const fx = [];
const afterRender = (fn) => fx.push(fn);
const runFx = () => { while (fx.length) fx.shift()(); };
const tileRect = (id, i) => $(id)?.querySelectorAll('.atom')[i]?.getBoundingClientRect();
const lastTiles = (id, n = 1) => [...($(id)?.querySelectorAll('.atom') ?? [])].slice(-n);
import {
    RECIPES as ALL_RECIPES, VALENCE, ATOM_FACTS, ATOM_WEIGHTS, ATOMIC_NUMBER,
    WIN_SCORE as FULL_WIN, HAND_LIMIT, START_HAND, MARKET_SIZE, DISCOVERY_BONUS, DISCOVERY_FACT,
    KID_RECIPES, KID_ATOMS, KID_ORDER, KID_ROUNDS,
} from '../data/chemistry-data.js';

// Ages 8-11 play with the 7 simpler molecules and race to 100.
let RECIPES = ALL_RECIPES;
let WIN_SCORE = FULL_WIN;

const ATOM_POOL = Object.entries(ATOM_WEIGHTS).flatMap(([atom, n]) => Array(n).fill(atom));
const drawAtom = () => pick(ATOM_POOL);
const drawMany = (n) => Array.from({ length: n }, drawAtom);

let state;
let onGameOver = () => {};
export function setGameOverHandler(fn) { onGameOver = fn; }

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

// How many atoms short a pool is of a recipe (0 = buildable).
const missing = (counts, recipe) =>
    Object.entries(recipe.atoms).reduce((t, [k, n]) => t + Math.max(0, n - (counts[k] || 0)), 0);

const canBuild = (counts, recipe) => missing(counts, recipe) === 0;

const formatCounts = (counts) => Object.entries(counts).map(([k, n]) => `${k}${n > 1 ? n : ''}`).join(' ');

// Explains why a bench didn't make a molecule, using the closest recipe.
function explainMiss(counts) {
    const diff = (r) => {
        const keys = new Set([...Object.keys(r.atoms), ...Object.keys(counts)]);
        return [...keys].reduce((t, k) => t + Math.abs((r.atoms[k] || 0) - (counts[k] || 0)), 0);
    };
    const closest = [...RECIPES].sort((a, b) => diff(a) - diff(b))[0];
    const bonds = Object.keys(closest.atoms).map((k) => `${k} makes ${VALENCE[k]}`).join(', ');
    return `Close to ${closest.formula}, which needs ${formatCounts(closest.atoms)}. You have ${formatCounts(counts) || 'nothing'}. Bonds have to balance: ${bonds}.`;
}

function removeAtoms(list, atoms) {
    const out = [...list];
    for (const [k, n] of Object.entries(atoms)) {
        for (let i = 0; i < n; i++) out.splice(out.indexOf(k), 1);
    }
    return out;
}

// Points for a recipe, including the first-discovery bonus.
const valueOf = (r) => r.pts + (state.discovered[r.formula] ? 0 : DISCOVERY_BONUS);

// The molecule a hand should chase: most points per atom still missing.
function bestTarget(hand) {
    const counts = countAtoms(hand);
    return RECIPES
        .map((r) => {
            const miss = missing(counts, r);
            return { r, miss, value: valueOf(r), worth: valueOf(r) / (miss + 1) };
        })
        .sort((a, b) => b.worth - a.worth)[0];
}

export function init() {
    document.getElementById('screen-chemistry').classList.toggle('kid-mode', isYoung());
    $('chem-you-label').textContent = isYoung() ? 'Molecules made' : 'You';
    if (isYoung()) return initKid();
    RECIPES = byAge({ middle: ALL_RECIPES.slice(0, 7), teen: ALL_RECIPES });
    LEVEL = currentLevel('chemistry');
    // Each level raises the target score by 25.
    WIN_SCORE = Math.min(300, byAge({ middle: 100, teen: FULL_WIN }) + 25 * (LEVEL - 1));
    $('chem-goal').textContent = `Goal ${WIN_SCORE}`;
    state = {
        p1: 0,
        cpu: 0,
        turn: 1,
        hand: drawMany(START_HAND),
        cpuHand: drawMany(START_HAND),
        market: drawMany(MARKET_SIZE),
        bench: [],
        discovered: {}, // formula -> 'YOU' | 'CPU'
        made: { YOU: 0, CPU: 0 },
        trading: false, // TRADE armed: next hand click swaps that card
        picks: 0,       // market atoms taken so far this turn (2 ends the turn)
        over: false,
    };
    clearLog('chem-log', 'Lab open. Build a molecule, take from the market, or draw.');
    resetFacts('chemistry', 'The dots on each atom show its valence: how many bonds it makes. A molecule works when every bond is used. The small number is the atomic number, the count of protons.');
    render();
}

// Periodic-table style tile: atomic number, symbol, one dot per bond it makes.
function atomCard(a, action, i, extra = '') {
    return `
        <button class="atom ${extra}" style="--el:var(--el-${a})" data-action="chemistry:${action}" data-arg="${i}"
            data-atom="${a}" aria-label="${a}, makes ${VALENCE[a]} bond${VALENCE[a] > 1 ? 's' : ''}">
            <span class="atom-z">${ATOMIC_NUMBER[a]}</span>
            <span class="atom-sym">${a}</span>
            <span class="atom-bonds">${'<i></i>'.repeat(VALENCE[a])}</span>
        </button>`;
}

function render() {
    $('chem-p1').textContent = state.p1;
    $('chem-cpu').textContent = state.cpu;
    setMeter('chem-p1-bar', null, (state.p1 / WIN_SCORE) * 100);
    setMeter('chem-cpu-bar', null, (state.cpu / WIN_SCORE) * 100);
    $('chem-turn').textContent = state.turn;
    $('chem-trade-btn').classList.toggle('is-armed', state.trading);
    $('chem-hand-count').textContent = `${state.hand.length + state.bench.length}/${HAND_LIMIT}`;
    $('chem-cpu-hand').textContent = `CPU holds ${state.cpuHand.length} atoms`;

    const pool = countAtoms([...state.hand, ...state.bench]);
    $('chem-recipes').innerHTML = RECIPES.map((r) => {
        const ready = canBuild(pool, r);
        const by = state.discovered[r.formula];
        const sub = by
            ? `<span class="recipe-sub">Discovered by ${by === 'YOU' ? 'you' : 'the CPU'}</span>`
            : `<span class="recipe-sub" style="color:var(--game)">+${DISCOVERY_BONUS} if you make it first</span>`;
        return `
        <div class="recipe ${ready ? 'is-ready' : ''}">
            <span class="recipe-art">${moleculeSVG(r.formula, { size: 54, labels: false })}</span>
            <span class="recipe-name">${r.name[0]}${r.name.slice(1).toLowerCase()} <span class="recipe-formula">${r.formula}</span></span>
            <span class="recipe-pts num">+${r.pts}</span>
            ${sub}
        </div>`;
    }).join('');

    $('chem-bench-slots').innerHTML = state.bench.length === 0
        ? `<span class="bench-hint">Drop atoms here to build a molecule</span>`
        : state.bench.map((a, i) => atomCard(a, 'unbench', i, 'on-bench')).join('');

    $('chem-market').innerHTML = state.market.map((a, i) => atomCard(a, 'take', i)).join('');

    $('chem-hand').innerHTML = state.hand
        .map((a, i) => atomCard(a, 'bench', i, state.trading ? 'is-trade' : ''))
        .join('') || `<span class="empty">No atoms left. Draw or take from the market.</span>`;
    runFx();
}

function score(who, recipe) {
    const first = !state.discovered[recipe.formula];
    const pts = recipe.pts + (first ? DISCOVERY_BONUS : 0);
    if (first) state.discovered[recipe.formula] = who;
    state.made[who] += 1;
    if (who === 'YOU') state.p1 += pts;
    else state.cpu += pts;
    if (first) teach('chemistry', DISCOVERY_FACT);
    teach('chemistry', recipe.fact);
    if (who === 'YOU') showBuilt(recipe.formula);
    return { pts, first };
}

function checkWinner() {
    if (state.p1 < WIN_SCORE && state.cpu < WIN_SCORE) return false;
    state.over = true;
    const won = state.p1 >= WIN_SCORE;
    playSound(won ? 'win' : 'lose');
    logTo('chem-log', won ? `You reached ${state.p1} points. Victory!` : `CPU reached ${state.cpu} points.`);
    onGameOver({
        won,
        title: won ? 'Master alchemist!' : 'The CPU chemist wins',
        score: won ? state.p1 + (state.p1 - state.cpu) : 0,
        stats: [
            ['Your points', state.p1],
            ['CPU points', state.cpu],
            ['Molecules made', state.made.YOU],
            ['Discoveries', Object.values(state.discovered).filter((w) => w === 'YOU').length],
            ['Turns', state.turn],
        ],
        metrics: { discoveries: Object.values(state.discovered).filter((w) => w === 'YOU').length },
    });
    return true;
}

// Big picture of the molecule you just built, shown on the bench for a moment.
function showBuilt(formula) {
    const pop = $('chem-built');
    pop.innerHTML = `${moleculeSVG(formula, { size: 200, animate: true })}<b>${KID_RECIPES[formula]?.emoji ?? ''} ${isYoung() ? KID_RECIPES[formula].name : formula}</b>`;
    pop.hidden = false;
    pop.classList.remove('pop-in');
    void pop.offsetWidth;
    pop.classList.add('pop-in');
    setTimeout(() => burst(pop.getBoundingClientRect(), { count: 18, spread: 120, colors: ['var(--game)', '#f5b301', '#7090ff'] }), 650);
    clearTimeout(showBuilt.t);
    showBuilt.t = setTimeout(() => { pop.hidden = true; }, isYoung() ? 2600 : 1600);
}

function takeFromMarket(hand, i, mine = false) {
    const atom = state.market[i];
    if (!mine) {
        const from = tileRect('chem-market', i);
        const to = $('chem-cpu')?.getBoundingClientRect();
        afterRender(() => setTimeout(() => sprite(`<span class="atom-chip" style="--el:var(--el-${atom})">${atom}</span>`, from, to, { duration: 650 }), 350));
    }
    hand.push(atom);
    state.market[i] = drawAtom();
    return atom;
}

function cpuTurn() {
    cpuAct();
    // Hard CPU runs a better-funded lab: one bonus atom every turn.
    if (byDifficulty({ easy: false, normal: false, hard: true })) state.cpuHand.push(drawAtom());
    while (state.cpuHand.length > HAND_LIMIT) state.cpuHand.splice(Math.floor(Math.random() * state.cpuHand.length), 1);
}

// CPU strategy depends on difficulty.
function cpuAct() {
    // The CPU gets one step smarter every two levels.
    const level = Math.min(2, byDifficulty({ easy: 0, normal: 1, hard: 2 }) + Math.floor((LEVEL - 1) / 2));
    const counts = countAtoms(state.cpuHand);
    const buildable = RECIPES.filter((r) => canBuild(counts, r)).sort((a, b) => valueOf(b) - valueOf(a));

    if (buildable.length && (level > 0 || Math.random() < 0.6)) {
        const r = buildable[0];
        state.cpuHand = removeAtoms(state.cpuHand, r.atoms);
        const { pts, first } = score('CPU', r);
        afterRender(() => setTimeout(() => burst($('chem-cpu')?.getBoundingClientRect(), { count: 12, spread: 50 }), 300));
        logTo('chem-log', `CPU synthesized ${r.formula} (+${pts}${first ? ', first discovery' : ''}).`);
        return;
    }

    if (level > 0) {
        // Take up to 2 market atoms that bring the CPU closer to a good molecule.
        const took = [];
        for (let k = 0; k < 2 && state.cpuHand.length < HAND_LIMIT; k++) {
            const now = bestTarget(state.cpuHand);
            const best = state.market
                .map((a, i) => ({ i, a, t: bestTarget([...state.cpuHand, a]) }))
                .sort((x, y) => y.t.worth - x.t.worth)[0];
            if (best.t.worth <= now.worth) break;
            took.push(takeFromMarket(state.cpuHand, best.i));
        }
        // Hard CPU fills the rest of its turn by denying you an atom you need.
        if (level === 2 && took.length < 2 && state.cpuHand.length < HAND_LIMIT) {
            const mine = [...state.hand, ...state.bench];
            const yours = bestTarget(mine);
            const yourCounts = countAtoms(mine);
            const needed = Object.keys(yours.r.atoms).filter((k) => (yourCounts[k] || 0) < yours.r.atoms[k]);
            const i = state.market.findIndex((a) => needed.includes(a));
            if (i >= 0) {
                const a = takeFromMarket(state.cpuHand, i);
                took.push(a);
                logTo('chem-log', `CPU snatched the ${a} you needed for ${yours.r.formula}!`);
            }
        }
        if (took.length) {
            if (took.length < 2) state.cpuHand.push(drawAtom());
            logTo('chem-log', `CPU took ${took.join(' + ')} from the market${took.length < 2 ? ' and drew 1' : ''}.`);
            return;
        }
    }

    state.cpuHand.push(...drawMany(2));
    logTo('chem-log', 'CPU drew 2 atoms.');
}

function endPlayerTurn() {
    state.picks = 0;
    if (checkWinner()) return render();
    cpuTurn();
    state.turn += 1;
    checkWinner();
    render();
}

function tradeCard(i) {
    const old = state.hand[i];
    const fresh = drawAtom();
    state.hand[i] = fresh;
    afterRender(() => $('chem-hand').querySelectorAll('.atom')[i]?.animate([{ transform: 'rotateY(90deg)' }, { transform: 'none' }], { duration: 420, easing: 'ease-out' }));
    state.trading = false;
    playSound('card');
    logTo('chem-log', `You traded ${old} for ${fresh}.`);
    endPlayerTurn();
}

const roomInHand = () => HAND_LIMIT - state.hand.length - state.bench.length;

function handFull() {
    if (roomInHand() > 0) return false;
    playSound('error');
    showToast('Your hand is full. Build or trade first.');
    return true;
}

const actions = {
    reset: init,

    bench(i) {
        if (state.trading) return tradeCard(i);
        const from = tileRect('chem-hand', i);
        afterRender(() => flyFrom(from, lastTiles('chem-bench-slots')[0]));
        const atom = state.hand.splice(i, 1)[0];
        state.bench.push(atom);
        teach('chemistry', ATOM_FACTS[atom]);
        playSound('card');
        render();
    },

    unbench(i) {
        if (state.kid) return;
        const from = tileRect('chem-bench-slots', i);
        afterRender(() => flyFrom(from, lastTiles('chem-hand')[0]));
        state.hand.push(state.bench.splice(i, 1)[0]);
        playSound('card');
        render();
    },

    clear() {
        state.hand.push(...state.bench);
        state.bench = [];
        render();
    },

    take(i) {
        if (handFull()) return;
        state.trading = false;
        const from = tileRect('chem-market', i);
        afterRender(() => {
            flyFrom(from, lastTiles('chem-hand')[0], { duration: 520, arc: -70 });
            $('chem-market').querySelectorAll('.atom')[i]?.animate([{ transform: 'translateY(-30px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 400, delay: 200, easing: 'ease-out', fill: 'backwards' });
        });
        const atom = takeFromMarket(state.hand, i, true);
        state.picks += 1;
        playSound('card');
        teach('chemistry', ATOM_FACTS[atom]);
        logTo('chem-log', `You took ${atom} from the market.`);
        if (state.picks < 2 && roomInHand() > 0) {
            showToast('Pick one more atom from the market');
            return render();
        }
        endPlayerTurn();
    },

    synthesize() {
        const counts = countAtoms(state.bench);
        const match = RECIPES.find((r) => matchesExactly(counts, r));
        if (!match) {
            playSound('error');
            shake($('chem-bench'));
            showToast('Those atoms don\'t balance. See the lab notes.');
            teach('chemistry', explainMiss(counts));
            return;
        }
        playSound('synth');
        state.bench = [];
        const { pts, first } = score('YOU', match);
        floatPoints(`+${pts}`, $('chem-bench'));
        showToast(`${first ? 'Discovered' : 'Made'} ${match.name.toLowerCase()} (${match.formula})`);
        logTo('chem-log', `You synthesized ${match.formula} (+${pts}${first ? ', first discovery' : ''}).`);
        endPlayerTurn();
    },

    draw() {
        if (handFull()) return;
        state.trading = false;
        const drawn = drawMany(Math.min(2, roomInHand()));
        const deck = document.querySelector('[data-action="chemistry:draw"]')?.getBoundingClientRect();
        afterRender(() => lastTiles('chem-hand', drawn.length).forEach((el, k) => setTimeout(() => flyFrom(deck, el, { duration: 480 }), k * 120)));
        state.hand.push(...drawn);
        playSound('card');
        logTo('chem-log', `You drew ${drawn.join(', ')}.`);
        endPlayerTurn();
    },

    trade() {
        if (state.hand.length === 0) {
            playSound('error');
            showToast('You have no atoms to trade');
            return;
        }
        state.trading = !state.trading;
        playSound('card');
        if (state.trading) showToast('Tap one of your atoms to swap it');
        render();
    },
};

// ---------------------------------------------------------------------------
// Molecule Match: the Explorer (ages 5-7) version. Copy the picture: tap the
// atoms the target molecule needs. Empty circles on the bench show what's left.

function initKid() {
    LEVEL = currentLevel('chemistry');
    // Level 1: the easy six. Level 2: trickier molecules. Level 3+: a random mix, and the empty slots stop telling you which atom goes where.
    const targets = LEVEL === 1 ? KID_ORDER.slice(0, KID_ROUNDS)
        : LEVEL === 2 ? ['N2', 'CH4', 'NH3', 'H2O', 'NaOH', 'CO2']
        : [...KID_ORDER, 'NaOH', 'N2'].sort(() => Math.random() - 0.5).slice(0, KID_ROUNDS);
    state = { kid: true, targets, round: 0, bench: [], hand: [], mistakes: 0, streak: 0, made: 0, over: false };
    clearLog('chem-log', 'Molecule Match started.');
    resetFacts('chemistry', 'Atoms hold hands to make molecules. The dots on each atom show how many hands it has!');
    dealKid();
}

const kidTarget = () => ALL_RECIPES.find((r) => r.formula === state.targets[state.round]);

function dealKid() {
    const target = kidTarget();
    const needed = Object.entries(target.atoms).flatMap(([a, n]) => Array(n).fill(a));
    const decoys = Object.keys(VALENCE).filter((a) => !target.atoms[a]);
    const extras = Array.from({ length: Math.min(4, 1 + LEVEL) }, () => pick(decoys));
    state.hand = [...needed, ...extras].sort(() => Math.random() - 0.5);
    state.bench = [];
    renderKid();
}

function renderKid() {
    const target = kidTarget();
    const info = KID_RECIPES[target.formula];
    $('chem-target').innerHTML = `
        <div class="target-art">${moleculeSVG(target.formula, { size: 150 })}</div>
        <div class="target-text">
            <span class="eyebrow">Molecule ${state.round + 1} of ${state.targets.length}</span>
            <h3>${info.emoji} Make ${info.name.toLowerCase()}</h3>
            <p class="muted">Tap the atoms that match the picture.</p>
            <div class="progress-dots">${state.targets.map((_, i) => `<i class="${i < state.made ? 'done' : i === state.round ? 'now' : ''}"></i>`).join('')}</div>
        </div>`;

    // Bench: filled atoms, then dashed circles for the ones still needed.
    const counts = countAtoms(state.bench);
    const missingAtoms = Object.entries(target.atoms).flatMap(([a, n]) => Array(Math.max(0, n - (counts[a] || 0))).fill(a));
    $('chem-bench-slots').innerHTML = state.bench.map((a, i) => atomCard(a, 'unbench', i, 'on-bench'))
        .concat(missingAtoms.map((a) => (LEVEL >= 3
            ? '<span class="atom-slot" style="--el:var(--ink-3)"><span>?</span></span>'
            : `<span class="atom-slot" style="--el:var(--el-${a})"><span>${a}</span></span>`))).join('');

    $('chem-hand').innerHTML = state.hand.map((a, i) => atomCard(a, 'bench', i)).join('');
    $('chem-p1').textContent = state.made;
    setMeter('chem-p1-bar', null, (state.made / state.targets.length) * 100);
    runFx();
}

function kidPick(i) {
    const target = kidTarget();
    const atom = state.hand[i];
    const have = state.bench.filter((a) => a === atom).length;
    if (!target.atoms[atom] || have >= target.atoms[atom]) {
        state.mistakes += 1;
        state.streak = 0;
        playSound('error');
        shake($('chem-hand').children[i]);
        showToast(target.atoms[atom] ? `You already have enough ${atom}!` : `${KID_RECIPES[target.formula].name} doesn't need ${atom}. Try another!`);
        teach('chemistry', KID_ATOMS[atom]);
        return;
    }
    const from = tileRect('chem-hand', i);
    afterRender(() => flyFrom(from, lastTiles('chem-bench-slots')[0], { duration: 480, arc: -50 }));
    state.hand.splice(i, 1);
    state.bench.push(atom);
    playSound('card');
    teach('chemistry', KID_ATOMS[atom]);

    const done = Object.entries(target.atoms).every(([a, n]) => state.bench.filter((x) => x === a).length === n);
    if (!done) return renderKid();

    state.made += 1;
    state.streak += 1;
    playSound('win');
    confetti(70);
    renderKid();
    showBuilt(target.formula);
    teach('chemistry', say(target.fact, KID_RECIPES[target.formula].kid));
    floatPoints(state.streak >= 3 ? `${state.streak} in a row!` : 'Great!', $('chem-bench'));
    logTo('chem-log', `You made ${KID_RECIPES[target.formula].name}.`);

    setTimeout(() => {
        if (state.over) return;
        if (state.round + 1 >= state.targets.length) return finishKid();
        state.round += 1;
        dealKid();
    }, 1800);
}

function finishKid() {
    state.over = true;
    const stars = state.mistakes <= 1 ? 3 : state.mistakes <= 4 ? 2 : 1;
    onGameOver({
        won: true,
        title: 'You made all the molecules!',
        score: state.made * 10 + Math.max(0, 30 - state.mistakes * 5),
        kidStars: stars,
        stats: [['Molecules made', state.made], ['Oops taps', state.mistakes]],
        metrics: {},
    });
}

export function handle(action, arg) {
    if (state.kid) {
        if (action === 'reset') return init();
        if (state.over) return;
        if (action === 'bench') return kidPick(Number(arg));
        return;
    }
    if (state.over && action !== 'reset') {
        showToast('Game over. Press Restart to play again.');
        return;
    }
    // Half-way through a market turn, only a second market pick (or bench moves) is allowed.
    if (state.picks > 0 && ['synthesize', 'draw', 'trade'].includes(action)) {
        playSound('error');
        showToast('Finish your turn: pick one more atom');
        return;
    }
    const fn = actions[action];
    if (fn) fn(arg === undefined ? undefined : Number(arg));
}

// Drag an atom from your hand onto the bench (tapping works too).
let drag = null;
let suppressClick = false;

document.addEventListener('pointerdown', (e) => {
    const tile = e.target.closest('#chem-hand .atom');
    if (!tile || state?.over || state?.trading) return;
    drag = { tile, x: e.clientX, y: e.clientY, ghost: null };
});

document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.ghost) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
        drag.ghost = drag.tile.cloneNode(true);
        drag.ghost.classList.add('drag-ghost');
        document.body.appendChild(drag.ghost);
        drag.tile.classList.add('dragging');
    }
    drag.ghost.style.left = `${e.clientX}px`;
    drag.ghost.style.top = `${e.clientY}px`;
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('#chem-bench');
    $('chem-bench').classList.toggle('drag-over', Boolean(over));
});

document.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const { tile, ghost } = drag;
    drag = null;
    if (!ghost) return;
    ghost.remove();
    tile.classList.remove('dragging');
    $('chem-bench').classList.remove('drag-over');
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    if (document.elementFromPoint(e.clientX, e.clientY)?.closest('#chem-bench')) {
        handle('bench', tile.dataset.arg);
    }
});

// A drag ends with a click on the tile; swallow it so the atom isn't moved twice.
document.addEventListener('click', (e) => {
    if (suppressClick && e.target.closest('#chem-hand')) e.stopPropagation();
}, true);
