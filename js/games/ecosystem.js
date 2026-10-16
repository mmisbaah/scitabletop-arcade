// GAME 2: Ecosystem Builder. Keep producers, herbivores and predators in ratio.

import { $, showToast, logTo, clearLog, setMeter, pick } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { SPECIES, DRAW_WEIGHTS, ECO_CONFIG as CFG } from '../data/species.js';

const DRAW_POOL = Object.entries(DRAW_WEIGHTS).flatMap(([name, n]) => Array(n).fill(name));
const TIERS = ['producer', 'herbivore', 'predator'];
const TIER_STYLE = {
    producer: 'border-emerald-700 text-emerald-300',
    herbivore: 'border-amber-700 text-amber-300',
    predator: 'border-rose-700 text-rose-300',
};

let state;

const isKudzu = (name) => SPECIES[name].invasive;
const natives = (tier) => state.board[tier].filter((n) => !isKudzu(n));
const kudzuCount = () => state.board.producer.filter(isKudzu).length;

function removeRandom(tier, filter = () => true) {
    const idxs = state.board[tier].map((n, i) => (filter(n) ? i : -1)).filter((i) => i >= 0);
    if (!idxs.length) return null;
    return state.board[tier].splice(pick(idxs), 1)[0];
}

function diversity() {
    const distinct = new Set(TIERS.flatMap((t) => natives(t)));
    return Math.min(100, distinct.size * 12.5);
}

export function init() {
    state = {
        season: 1,
        stability: CFG.startStability,
        plays: CFG.playsPerSeason,
        board: structuredClone(CFG.startBoard),
        hand: [...CFG.startHand],
        over: false,
    };
    clearLog('eco-log', 'Season 1. Your meadow has plants and grazers, but no predators yet.');
    render();
}

function render() {
    setMeter('eco-div-bar', 'eco-div-val', diversity());
    setMeter('eco-stab-bar', 'eco-stab-val', state.stability);
    $('eco-season').textContent = `${Math.min(state.season, CFG.seasons)} / ${CFG.seasons}`;
    $('eco-plays').textContent = state.plays;

    const hasWolf = state.board.predator.includes('WOLF');
    $('eco-keystone').textContent = hasWolf ? 'WOLF' : 'MISSING';
    $('eco-keystone').className = hasWolf ? 'text-emerald-400' : 'text-rose-400';
    const kz = kudzuCount();
    $('eco-invasive').textContent = kz ? `KUDZU x${kz}` : 'NONE';
    $('eco-invasive').className = kz ? 'text-rose-400' : 'text-slate-500';

    for (const tier of TIERS) {
        $(`eco-tier-${tier}`).innerHTML = state.board[tier].map((name, i) => {
            const style = isKudzu(name) ? 'border-lime-400 text-lime-300 bg-lime-950' : `${TIER_STYLE[tier]} bg-slate-900`;
            return `
            <button data-action="ecosystem:remove" data-tier="${tier}" data-arg="${i}"
                class="w-full text-left px-2 py-1 border-2 ${style} font-pixel text-[10px] hover:border-yellow-400 flex justify-between">
                <span>${name}</span><span>${SPECIES[name].icon}</span>
            </button>`;
        }).join('') || `<span class="font-pixel text-[9px] text-slate-600">EMPTY</span>`;
    }

    $('eco-hand').innerHTML = state.hand.map((name, i) => {
        const kz = isKudzu(name);
        return `
        <button data-action="ecosystem:play" data-arg="${i}"
            class="arcade-btn ${kz ? 'bg-lime-900 text-lime-200' : 'bg-slate-950 text-yellow-300'} hover:bg-slate-800 text-[10px]"
            title="${kz ? 'Burn this invasive seed (1 play) or it invades at season end' : `Deploy as ${SPECIES[name].tier}`}">
            ${kz ? 'BURN KUDZU' : `+ ${name}`}
        </button>`;
    }).join('') || `<span class="font-pixel text-[10px] text-slate-500">NO RESERVES</span>`;
}

function spendPlay() {
    if (state.plays <= 0) {
        playSound('error');
        showToast('NO PLAYS LEFT! NEXT SEASON');
        return false;
    }
    state.plays -= 1;
    return true;
}

// Runs the food web for one season and returns the stability change.
function simulateSeason() {
    let delta = 0;
    const notes = [];

    // Kudzu eats producers, then maybe spreads.
    for (let k = 0; k < kudzuCount(); k++) {
        const eaten = removeRandom('producer', (n) => !isKudzu(n));
        if (eaten) notes.push(`Kudzu smothered ${eaten}.`);
    }
    if (kudzuCount() && kudzuCount() < CFG.kudzuMax && Math.random() < CFG.kudzuSpreadChance) {
        state.board.producer.push('KUDZU');
        notes.push('Kudzu spread!');
    }
    delta -= kudzuCount() * 4;

    const P = natives('producer').length;
    const H = state.board.herbivore.length;
    const R = state.board.predator.length;

    // Herbivores vs plants.
    if (H === 0) {
        if (P > 0) { delta -= 5; notes.push('No grazers: plants overgrow.'); }
    } else {
        const ratio = P / H;
        if (ratio < 1.5) {
            delta -= 8;
            const starved = removeRandom('herbivore');
            notes.push(`Not enough plants. ${starved} starved.`);
        } else if (ratio <= 3.5) {
            delta += 8;
        } else {
            delta -= 3;
        }
    }

    // Predators vs herbivores.
    if (R === 0) {
        if (H >= 3) {
            delta -= 8;
            const grazed = removeRandom('producer', (n) => !isKudzu(n));
            notes.push(`No predators: herbivores overgraze${grazed ? ` ${grazed}` : ''}.`);
        }
    } else {
        const ratio = H / R;
        if (ratio < 1.5) {
            delta -= 8;
            const starved = removeRandom('predator');
            notes.push(`Prey is scarce. ${starved} starved.`);
        } else if (ratio <= 3.5) {
            delta += 8;
        } else {
            delta -= 3;
        }
    }

    if (state.board.predator.includes('WOLF')) delta += 4;

    // Healthy plants reseed themselves.
    const plants = natives('producer');
    if (!kudzuCount() && plants.length > 0 && plants.length < 6) {
        const seed = pick(plants);
        state.board.producer.push(seed);
        notes.push(`${seed} reseeded.`);
    }

    return { delta, notes };
}

function finish() {
    state.over = true;
    const won = state.stability > 0;
    playSound(won ? 'win' : 'lose');
    if (won) {
        const score = Math.round(state.stability + diversity());
        showToast(`HABITAT SURVIVED! SCORE ${score}`);
        logTo('eco-log', `All ${CFG.seasons} seasons survived. Final score: ${score} (stability + biodiversity).`);
    } else {
        showToast('ECOSYSTEM COLLAPSED!');
        logTo('eco-log', 'Stability hit 0. The food web collapsed.');
    }
}

const actions = {
    reset: init,

    play(i) {
        const name = state.hand[i];
        if (!spendPlay()) return;
        state.hand.splice(i, 1);
        playSound('card');
        if (isKudzu(name)) {
            logTo('eco-log', 'You burned an invasive Kudzu seed.');
            showToast('KUDZU SEED BURNED');
        } else {
            state.board[SPECIES[name].tier].push(name);
            logTo('eco-log', `Introduced ${name}.`);
            showToast(`INTRODUCED ${name}!`);
        }
        render();
    },

    remove(i, el) {
        const tier = el.dataset.tier;
        const name = state.board[tier][i];
        if (!name || !spendPlay()) return;
        state.board[tier].splice(i, 1);
        playSound('hit');
        logTo('eco-log', isKudzu(name) ? 'You pulled out a Kudzu patch.' : `You relocated ${name}.`);
        render();
    },

    season() {
        playSound('synth');

        // Kudzu seeds left in hand blow into the habitat.
        const seeds = state.hand.filter(isKudzu).length;
        state.hand = state.hand.filter((n) => !isKudzu(n));
        for (let s = 0; s < seeds; s++) state.board.producer.push('KUDZU');
        if (seeds) logTo('eco-log', `${seeds} Kudzu seed(s) blew into the habitat!`);
        if (Math.random() < CFG.wildInvasionChance) {
            state.board.producer.push('KUDZU');
            logTo('eco-log', 'Wild Kudzu invaded from a neighbouring field!');
            showToast('INVASIVE KUDZU OUTBREAK!');
        }

        const { delta, notes } = simulateSeason();
        state.stability = Math.max(0, Math.min(100, state.stability + delta));
        notes.forEach((n) => logTo('eco-log', n));
        logTo('eco-log', `Season ${state.season} ends. Stability ${delta >= 0 ? '+' : ''}${delta}.`);

        if (state.stability <= 0 || state.season >= CFG.seasons) {
            render();
            return finish();
        }

        state.season += 1;
        state.plays = CFG.playsPerSeason;
        if (state.hand.length < CFG.handLimit) state.hand.push(pick(DRAW_POOL));
        render();
    },
};

export function handle(action, arg, el) {
    if (state.over && action !== 'reset') {
        showToast('GAME OVER! PRESS RESET');
        return;
    }
    const fn = actions[action];
    if (fn) fn(arg === undefined ? undefined : Number(arg), el);
}
