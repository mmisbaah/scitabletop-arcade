// GAME 2: Ecosystem Builder. Energy flows up a 3-level food web, losing ~90%
// at each step. Keep every level fed for 10 seasons.

import { $, showToast, logTo, clearLog, setMeter, pick } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { teach, resetFacts } from '../core/facts.js';
import { byDifficulty } from '../core/difficulty.js';
import { SPECIES, DRAW_WEIGHTS, EVENTS, ECO_FACTS, ECO_CONFIG as CFG } from '../data/species.js';

const DRAW_POOL = Object.entries(DRAW_WEIGHTS).flatMap(([name, n]) => Array(n).fill(name));
const TIERS = ['producer', 'herbivore', 'predator'];
const TIER_STYLE = {
    producer: 'border-emerald-700 text-emerald-300',
    herbivore: 'border-amber-700 text-amber-300',
    predator: 'border-rose-700 text-rose-300',
};

let state;
let onGameOver = () => {};
export function setGameOverHandler(fn) { onGameOver = fn; }

const isKudzu = (name) => SPECIES[name].invasive;
const natives = (tier) => state.board[tier].filter((n) => !isKudzu(n));
const kudzuCount = () => state.board.producer.filter(isKudzu).length;
const sum = (list, key) => list.reduce((t, n) => t + (SPECIES[n][key] || 0), 0);

function removeRandom(tier, filter = () => true) {
    const idxs = state.board[tier].map((n, i) => (filter(n) ? i : -1)).filter((i) => i >= 0);
    if (!idxs.length) return null;
    return state.board[tier].splice(pick(idxs), 1)[0];
}

function diversity() {
    const distinct = new Set(TIERS.flatMap((t) => natives(t)));
    return Math.min(100, distinct.size * 12.5);
}

// Where the energy goes this season, following the 10% rule.
function energyReport() {
    const plants = natives('producer');
    const clovers = plants.filter((n) => SPECIES[n].fertilizes).length;
    const cloverEnergy = sum(plants.filter((n) => SPECIES[n].fertilizes), 'energy');
    let plantEnergy = cloverEnergy + (sum(plants, 'energy') - cloverEnergy) * (1 + 0.1 * clovers);
    if (state.board.predator.includes('WOLF')) plantEnergy *= 1 + CFG.wolfBoost;
    if (state.drought) plantEnergy *= 0.6;

    const herbivores = state.board.herbivore;
    const herbFood = plantEnergy * CFG.transfer;
    const herbNeed = sum(herbivores, 'need');
    const herbEaten = Math.min(herbFood, herbNeed);

    // Predators can only eat herbivores that are on someone's menu.
    const menu = new Set(state.board.predator.flatMap((n) => SPECIES[n].diet));
    const edibleNeed = sum(herbivores.filter((n) => menu.has(n)), 'need');
    const predFood = herbNeed ? herbEaten * (edibleNeed / herbNeed) * CFG.transfer : 0;
    const predNeed = sum(state.board.predator, 'need');

    return { plantEnergy, herbFood, herbNeed, predFood, predNeed };
}

export function init() {
    state = {
        season: 1,
        stability: CFG.startStability,
        plays: CFG.playsPerSeason,
        board: structuredClone(CFG.startBoard),
        hand: [...CFG.startHand],
        drought: false,
        lastEvent: 'NONE',
        over: false,
    };
    clearLog('eco-log', 'Season 1. Plants and grazers, but no predators yet.');
    resetFacts('ecosystem', ECO_FACTS.intro);
    render();
}

function render() {
    setMeter('eco-div-bar', 'eco-div-val', diversity());
    setMeter('eco-stab-bar', 'eco-stab-val', state.stability);
    $('eco-season').textContent = `${Math.min(state.season, CFG.seasons)} / ${CFG.seasons}`;
    $('eco-plays').textContent = state.plays;

    const hasWolf = state.board.predator.includes('WOLF');
    $('eco-keystone').textContent = hasWolf ? 'WOLF +15%' : 'MISSING';
    $('eco-keystone').className = hasWolf ? 'text-emerald-400' : 'text-rose-400';
    const kz = kudzuCount();
    $('eco-invasive').textContent = kz ? `KUDZU x${kz}` : 'NONE';
    $('eco-invasive').className = kz ? 'text-rose-400' : 'text-slate-500';
    $('eco-event').textContent = state.lastEvent;

    const e = energyReport();
    const fed = (food, need) => (need === 0 ? 'text-slate-500' : food >= need ? 'text-emerald-400' : 'text-rose-400');
    $('eco-energy-producer').innerHTML = `<span class="text-yellow-300">${Math.round(e.plantEnergy)}</span> energy made`;
    $('eco-energy-herbivore').innerHTML = `food <span class="${fed(e.herbFood, e.herbNeed)}">${Math.round(e.herbFood)}</span> / need ${e.herbNeed}`;
    $('eco-energy-predator').innerHTML = `food <span class="${fed(e.predFood, e.predNeed)}">${Math.round(e.predFood)}</span> / need ${e.predNeed}`;

    for (const tier of TIERS) {
        $(`eco-tier-${tier}`).innerHTML = state.board[tier].map((name, i) => {
            const sp = SPECIES[name];
            const style = isKudzu(name) ? 'border-lime-400 text-lime-300 bg-lime-950' : `${TIER_STYLE[tier]} bg-slate-900`;
            const stat = sp.tier === 'producer' ? `+${sp.energy}` : `-${sp.need}`;
            return `
            <button data-action="ecosystem:remove" data-tier="${tier}" data-arg="${i}"
                class="w-full text-left px-2 py-1 border-2 ${style} font-pixel text-[10px] hover:border-yellow-400 flex justify-between items-center gap-1"
                title="${sp.diet ? `Eats: ${sp.diet.join(', ')}` : ''}">
                <span><span class="text-base not-italic">${sp.icon}</span> ${name}</span><span class="text-[8px] text-slate-400">${isKudzu(name) ? 'INEDIBLE' : stat}</span>
            </button>`;
        }).join('') || `<span class="font-pixel text-[9px] text-slate-600">EMPTY</span>`;
    }

    $('eco-hand').innerHTML = state.hand.map((name, i) => {
        const sp = SPECIES[name];
        const kz = isKudzu(name);
        const detail = sp.tier === 'producer' ? `${sp.energy} ENERGY` : sp.diet ? `EATS ${sp.diet.length} PREY` : `NEEDS ${sp.need}`;
        return `
        <button data-action="ecosystem:play" data-arg="${i}"
            class="arcade-btn ${kz ? 'bg-lime-900 text-lime-200' : 'bg-slate-950 text-yellow-300'} hover:bg-slate-800 text-[10px] flex-col items-start"
            title="${kz ? 'Burn this invasive seed (1 play) or it invades at season end' : sp.diet ? `Eats: ${sp.diet.join(', ')}` : `Deploy as ${sp.tier}`}">
            <span>${sp.icon} ${kz ? 'BURN KUDZU' : `+ ${name}`}</span>
            <span class="text-[8px] text-slate-400 normal-case">${kz ? 'OR IT INVADES' : detail}</span>
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

function rollEvent(notes) {
    state.drought = false;
    state.lastEvent = 'NONE';
    if (Math.random() >= byDifficulty({ easy: 0.15, normal: 0.25, hard: 0.35 })) return 0;

    const kind = pick(Object.keys(EVENTS));
    state.lastEvent = EVENTS[kind].name;
    teach('ecosystem', EVENTS[kind].fact);
    showToast(`EVENT: ${EVENTS[kind].name}!`);

    if (kind === 'drought') {
        state.drought = true;
        notes.push('Drought! Plants make 40% less energy this season.');
        return 0;
    }
    if (kind === 'wildfire') {
        const burned = [];
        for (let k = 0; k < 2; k++) {
            const b = removeRandom('producer', (n) => !SPECIES[n].fireproof);
            if (b) burned.push(b);
        }
        notes.push(burned.length ? `Wildfire burned ${burned.join(' and ')}. Oaks survive fire.` : 'Wildfire swept through, but nothing here burns.');
        return -5;
    }
    // Disease hits whatever species is most common.
    const counts = {};
    TIERS.forEach((t) => natives(t).forEach((n) => { counts[n] = (counts[n] || 0) + 1; }));
    const [worst, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
    if (worst && n >= 3) {
        const tier = SPECIES[worst].tier;
        for (let k = 0; k < 2; k++) removeRandom(tier, (x) => x === worst);
        notes.push(`Disease tore through the ${worst} population (${n} of them). Monocultures spread disease.`);
        return -8;
    }
    notes.push('A disease arrived, but no species was common enough for it to spread.');
    return 0;
}

// Runs the food web for one season and returns the stability change.
function simulateSeason() {
    const notes = [];
    let delta = rollEvent(notes);

    // Kudzu smothers natives, then maybe spreads.
    for (let k = 0; k < kudzuCount(); k++) {
        const eaten = removeRandom('producer', (n) => !isKudzu(n));
        if (eaten) notes.push(`Kudzu smothered ${eaten}.`);
    }
    if (kudzuCount() && kudzuCount() < CFG.kudzuMax && Math.random() < CFG.kudzuSpreadChance) {
        state.board.producer.push('KUDZU');
        notes.push('Kudzu spread!');
    }
    delta -= kudzuCount() * 5;

    // Predators with nothing on their menu leave or starve.
    for (const name of [...state.board.predator]) {
        if (!SPECIES[name].diet.some((prey) => state.board.herbivore.includes(prey))) {
            state.board.predator.splice(state.board.predator.indexOf(name), 1);
            notes.push(`${name} found none of its prey (${SPECIES[name].diet.join(', ')}) and starved.`);
            teach('ecosystem', ECO_FACTS.noPrey);
            delta -= 4;
        }
    }

    const e = energyReport();
    const H = state.board.herbivore.length;
    const R = state.board.predator.length;

    // Herbivores vs plants.
    if (H === 0) {
        if (natives('producer').length) { delta -= 5; notes.push('Nothing grazes: plants overgrow and choke each other.'); }
    } else {
        const ratio = e.herbFood / e.herbNeed;
        if (ratio < 1) {
            delta -= 10;
            notes.push(`Herbivores got ${Math.round(e.herbFood)} of ${e.herbNeed} food. ${removeRandom('herbivore')} starved.`);
            teach('ecosystem', ECO_FACTS.starve);
        } else {
            delta += ratio <= 4 ? 3 : -2;
            if (ratio > 4) notes.push('Plenty of plants go uneaten. Room for more grazers.');
            // Well-fed fast breeders multiply.
            if (ratio >= 1.5) {
                for (const name of new Set(state.board.herbivore)) {
                    if (SPECIES[name].breed && state.board.herbivore.length < CFG.herbivoreCap && Math.random() < SPECIES[name].breed) {
                        state.board.herbivore.push(name);
                        notes.push(`Well fed, the ${name} population grew.`);
                    }
                }
            }
        }
    }

    // Predators vs herbivores.
    if (R === 0) {
        if (H >= 3) {
            delta -= 10;
            const grazed = removeRandom('producer', (n) => !isKudzu(n));
            notes.push(`No predators: herbivores overgrazed${grazed ? ` the ${grazed}` : ''}.`);
            teach('ecosystem', ECO_FACTS.overgraze);
        }
    } else {
        const ratio = e.predFood / e.predNeed;
        if (ratio < 1) {
            delta -= 10;
            notes.push(`Predators got ${e.predFood.toFixed(1)} of ${e.predNeed} food. ${removeRandom('predator')} starved.`);
            teach('ecosystem', ECO_FACTS.starve);
        } else {
            delta += ratio <= 4 ? 3 : -2;
        }
    }

    if (diversity() >= CFG.diverseThreshold) {
        delta += 2;
        teach('ecosystem', ECO_FACTS.diversity);
    }

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
    const score = won ? Math.round(state.stability + diversity()) : 0;
    playSound(won ? 'win' : 'lose');
    logTo('eco-log', won ? `All ${CFG.seasons} seasons survived. Score ${score}.` : 'Stability hit 0. The food web collapsed.');
    onGameOver({
        won,
        title: won ? 'HABITAT SURVIVED!' : 'ECOSYSTEM COLLAPSED',
        score,
        stats: [
            ['SEASONS', `${state.season} / ${CFG.seasons}`],
            ['STABILITY', `${state.stability}%`],
            ['BIODIVERSITY', `${diversity()}%`],
        ],
    });
}

const actions = {
    reset: init,

    play(i) {
        const name = state.hand[i];
        if (!spendPlay()) return;
        state.hand.splice(i, 1);
        playSound('card');
        teach('ecosystem', SPECIES[name].fact);
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
        if (Math.random() < byDifficulty({ easy: 0.06, normal: 0.12, hard: 0.2 })) {
            state.board.producer.push('KUDZU');
            logTo('eco-log', 'Wild Kudzu invaded from a neighbouring field!');
            teach('ecosystem', SPECIES.KUDZU.fact);
        }

        const { delta, notes } = simulateSeason();
        state.stability = Math.max(0, Math.min(100, state.stability + delta));
        notes.forEach((n) => logTo('eco-log', n));
        logTo('eco-log', `Season ${state.season} ends. Stability ${delta >= 0 ? '+' : ''}${delta}.`);
        state.drought = false;

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
