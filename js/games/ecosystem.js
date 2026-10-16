// GAME 2: Ecosystem Builder. Energy flows up a 3-level food web, losing ~90%
// at each step. Keep every level fed for 10 seasons.

import { $, showToast, logTo as rawLog, clearLog, setMeter, pick } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { teach, resetFacts } from '../core/facts.js';
import { byDifficulty } from '../core/difficulty.js';
import { isYoung, byAge, say } from '../core/age.js';
import { SPECIES, DRAW_WEIGHTS, EVENTS, ECO_FACTS, ECO_KID, SEASON_NAMES, AGE_TUNING, ECO_CONFIG as CFG } from '../data/species.js';

const FULL_POOL = Object.entries(DRAW_WEIGHTS).flatMap(([name, n]) => Array(n).fill(name));
let DRAW_POOL = FULL_POOL;
let T = {}; // age tuning for the current game
const ecoFact = (key) => say(ECO_FACTS[key], ECO_KID[key]);
const TIERS = ['producer', 'herbivore', 'predator'];
const TIER_STYLE = {
    producer: 'border-emerald-700 text-emerald-300',
    herbivore: 'border-amber-700 text-amber-300',
    predator: 'border-rose-700 text-rose-300',
};

// Species names are stored in capitals; show them in title case in the log.
const logTo = (id, msg) => rawLog(id, msg.replace(/\b[A-Z]{2,}(?: [A-Z]{2,})*\b/g, (m) => cap(m)));

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
    T = byAge(AGE_TUNING);
    document.getElementById('screen-ecosystem').classList.toggle('kid-mode', isYoung());
    DRAW_POOL = T.noKudzu ? FULL_POOL.filter((n) => !SPECIES[n].invasive) : FULL_POOL;
    state = {
        season: 1,
        seasons: T.seasons ?? CFG.seasons,
        stability: T.startStability ?? CFG.startStability,
        plays: CFG.playsPerSeason,
        board: structuredClone(CFG.startBoard),
        hand: [...(T.startHand ?? CFG.startHand)],
        drought: false,
        lastEvent: 'NONE',
        over: false,
    };
    clearLog('eco-log', 'Season 1. Plants and grazers, but no predators yet.');
    resetFacts('ecosystem', ecoFact('intro'));
    render();
}

const cap = (name) => name.split(' ').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ');

function render() {
    setMeter('eco-div-bar', 'eco-div-val', diversity());
    setMeter('eco-stab-bar', 'eco-stab-val', state.stability);
    const stab = $('eco-stab-bar').parentElement;
    stab.className = `meter ${state.stability > 50 ? 'good' : state.stability > 25 ? 'warn' : 'bad'}`;
    $('eco-season').textContent = `${Math.min(state.season, state.seasons)} / ${state.seasons}`;
    $('eco-plays').textContent = state.plays;

    const hasWolf = state.board.predator.includes('WOLF');
    $('eco-keystone').textContent = hasWolf ? '🐺 Wolf (+15% plants)' : 'Missing';
    $('eco-keystone').className = hasWolf ? 'good' : 'bad';
    const kz = kudzuCount();
    $('eco-invasive').textContent = kz ? `🌿 Kudzu ×${kz}` : 'None';
    $('eco-invasive').className = kz ? 'bad' : '';
    $('eco-event').textContent = state.lastEvent === 'NONE' ? 'Calm season' : cap(state.lastEvent);

    const e = energyReport();
    renderScene(e);
    const fed = (food, need) => (need === 0 ? '' : food >= need ? 'ok' : 'short');
    if (isYoung()) {
        const mood = (food, need) => (need === 0 ? '<span>Nobody here yet</span>' : food >= need ? '<span class="ok">😀 Everyone is fed</span>' : '<span class="short">😟 Some are hungry!</span>');
        $('eco-energy-producer').innerHTML = '<span class="ok">☀️ Making food from sunshine</span>';
        $('eco-energy-herbivore').innerHTML = mood(e.herbFood, e.herbNeed);
        $('eco-energy-predator').innerHTML = mood(e.predFood, e.predNeed);
    } else {
    $('eco-energy-producer').innerHTML = `<span class="ok">${Math.round(e.plantEnergy)}</span> energy made`;
    $('eco-energy-herbivore').innerHTML = `Food <span class="${fed(e.herbFood, e.herbNeed)}">${Math.round(e.herbFood)}</span> of ${e.herbNeed} needed`;
    $('eco-energy-predator').innerHTML = `Food <span class="${fed(e.predFood, e.predNeed)}">${e.predFood.toFixed(1)}</span> of ${e.predNeed} needed`;
    }

    for (const tier of TIERS) {
        $(`eco-tier-${tier}`).innerHTML = state.board[tier].map((name, i) => {
            const sp = SPECIES[name];
            const stat = isKudzu(name) ? 'inedible' : sp.tier === 'producer' ? `+${sp.energy}` : `needs ${sp.need}`;
            return `
            <button class="organism ${isKudzu(name) ? 'invasive' : ''}" data-action="ecosystem:remove" data-tier="${tier}" data-arg="${i}"
                title="${sp.diet ? `Eats ${sp.diet.map(cap).join(', ')}. ` : ''}Tap to remove (1 play)">
                <span class="emoji" aria-hidden="true">${sp.icon}</span><span class="name">${cap(name)}</span><span class="val">${stat}</span>
            </button>`;
        }).join('') || '<span class="empty">Empty</span>';
    }

    $('eco-hand').innerHTML = state.hand.map((name, i) => {
        const sp = SPECIES[name];
        const kz = isKudzu(name);
        const detail = kz ? 'Invasive seed. Burn it now or it spreads at season end.'
            : sp.tier === 'producer' ? `Producer · makes ${sp.energy}${sp.fertilizes ? ' · fertilises' : ''}${sp.fireproof ? ' · fireproof' : ''}`
            : sp.diet ? `Predator · needs ${sp.need} · eats ${sp.diet.map(cap).join(', ')}`
            : `Herbivore · needs ${sp.need}${sp.breed ? ' · breeds fast' : ''}`;
        return `
        <button class="species-card ${kz ? 'invasive' : ''}" data-action="ecosystem:play" data-arg="${i}">
            <span class="emoji" aria-hidden="true">${sp.icon}</span>
            <b>${kz ? 'Burn Kudzu' : cap(name)}</b>
            <small>${detail}</small>
        </button>`;
    }).join('') || '<span class="empty">No reserve species. One arrives each season.</span>';
}

// A picture of the habitat: sky and ground change with the season, plants sit
// on the ground, grazers wander, hunters prowl and birds circle overhead.
const FLYERS = new Set(['OWL', 'HAWK']);

function renderScene(e) {
    const scene = $('eco-scene');
    const season = SEASON_NAMES[(state.season - 1) % 4];
    scene.className = `scene season-${season.toLowerCase()}`;
    const herbHungry = e.herbNeed > 0 && e.herbFood < e.herbNeed;
    const predHungry = e.predNeed > 0 && e.predFood < e.predNeed;
    const place = (name, i, n, row, hungry) => {
        const left = n === 1 ? 50 : 8 + (i * 84) / Math.max(1, n - 1);
        const delay = ((i * 0.37) % 1.6).toFixed(2);
        return `<span class="critter ${row} ${SPECIES[name].invasive ? 'vine' : ''}" style="left:${left}%;animation-delay:-${delay}s" title="${cap(name)}">
            ${SPECIES[name].icon}${hungry ? '<i class="mood">😟</i>' : ''}</span>`;
    };
    const plants = state.board.producer;
    const grazers = state.board.herbivore;
    const birds = state.board.predator.filter((n) => FLYERS.has(n));
    const hunters = state.board.predator.filter((n) => !FLYERS.has(n));
    scene.innerHTML = `
        <div class="sky-body">${season === 'Winter' ? '❄️' : season === 'Autumn' ? '🍂' : '☀️'}</div>
        <div class="season-tag">${season} · season ${Math.min(state.season, state.seasons)} of ${state.seasons}</div>
        ${birds.map((n, i) => place(n, i, birds.length, 'sky', predHungry)).join('')}
        <div class="ground"></div>
        ${hunters.map((n, i) => place(n, i, hunters.length, 'prowl', predHungry)).join('')}
        ${grazers.map((n, i) => place(n, i, grazers.length, 'graze', herbHungry)).join('')}
        ${plants.map((n, i) => place(n, i, plants.length, 'plant', false)).join('')}
        ${state.drought ? '<div class="weather">🔥 Drought</div>' : ''}`;
}

function spendPlay() {
    if (state.plays <= 0) {
        playSound('error');
        showToast('No plays left this season. Tap Next season.');
        return false;
    }
    state.plays -= 1;
    return true;
}

function rollEvent(notes) {
    state.drought = false;
    state.lastEvent = 'NONE';
    if (Math.random() >= (T.events ?? byDifficulty({ easy: 0.15, normal: 0.25, hard: 0.35 }) * (T.eventScale ?? 1))) return 0;

    const kind = pick(Object.keys(EVENTS));
    state.lastEvent = EVENTS[kind].name;
    teach('ecosystem', EVENTS[kind].fact);
    showToast(`Event: ${cap(EVENTS[kind].name)}`);

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
            teach('ecosystem', ecoFact('noPrey'));
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
            teach('ecosystem', ecoFact('starve'));
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
            teach('ecosystem', ecoFact('overgraze'));
        }
    } else {
        const ratio = e.predFood / e.predNeed;
        if (ratio < 1) {
            delta -= 10;
            notes.push(`Predators got ${e.predFood.toFixed(1)} of ${e.predNeed} food. ${removeRandom('predator')} starved.`);
            teach('ecosystem', ecoFact('starve'));
        } else {
            delta += ratio <= 4 ? 3 : -2;
        }
    }

    if (diversity() >= CFG.diverseThreshold) {
        delta += 2;
        teach('ecosystem', ecoFact('diversity'));
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
    logTo('eco-log', won ? `All ${state.seasons} seasons survived. Score ${score}.` : 'Stability hit 0. The food web collapsed.');
    onGameOver({
        won,
        title: won ? (isYoung() ? 'Your forest is happy!' : 'Your habitat thrived') : (isYoung() ? 'The forest needs more help' : 'The ecosystem collapsed'),
        kidStars: state.stability > 60 ? 3 : state.stability > 30 ? 2 : 1,
        score,
        stats: [
            ['Seasons', `${state.season} / ${state.seasons}`],
            ['Stability', `${state.stability}%`],
            ['Biodiversity', `${diversity()}%`],
        ],
        metrics: { wolf: state.board.predator.includes('WOLF'), diversity: diversity() },
    });
}

const actions = {
    reset: init,

    play(i) {
        const name = state.hand[i];
        if (!spendPlay()) return;
        state.hand.splice(i, 1);
        playSound('card');
        teach('ecosystem', say(SPECIES[name].fact, SPECIES[name].kid));
        if (isKudzu(name)) {
            logTo('eco-log', 'You burned an invasive Kudzu seed.');
            showToast('Kudzu seed burned');
        } else {
            state.board[SPECIES[name].tier].push(name);
            logTo('eco-log', `Introduced ${name}.`);
            showToast(`${cap(name)} released`);
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
        if (Math.random() < (T.invasion ?? byDifficulty({ easy: 0.06, normal: 0.12, hard: 0.2 }))) {
            state.board.producer.push('KUDZU');
            logTo('eco-log', 'Wild Kudzu invaded from a neighbouring field!');
            teach('ecosystem', say(SPECIES.KUDZU.fact, SPECIES.KUDZU.kid));
        }

        const { delta, notes } = simulateSeason();
        state.stability = Math.max(0, Math.min(100, state.stability + delta));
        notes.forEach((n) => logTo('eco-log', n));
        logTo('eco-log', `Season ${state.season} ends. Stability ${delta >= 0 ? '+' : ''}${delta}.`);
        state.drought = false;

        if (state.stability <= 0 || state.season >= state.seasons) {
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
        showToast('Game over. Press Restart to play again.');
        return;
    }
    const fn = actions[action];
    if (fn) fn(arg === undefined ? undefined : Number(arg), el);
}
