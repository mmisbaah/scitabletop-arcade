// GAME 3: Immune Defense. Pathogens march through 3 zones; spend AP to stop them.
// Beating a pathogen with adaptive cells (T-cells, B-cells) builds memory that
// makes the next encounter easier, the same way vaccines work.

import { $, showToast, logTo, clearLog, setMeter, shake } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { teach, resetFacts } from '../core/facts.js';
import { byDifficulty } from '../core/difficulty.js';
import { PATHOGENS, WAVES, ABILITIES, BREACH_FACT, MEMORY_FACTS, IMMUNE_CONFIG as CFG } from '../data/pathogens.js';

let state;
let nextId = 1;
let onGameOver = () => {};
export function setGameOverHandler(fn) { onGameOver = fn; }

const ADAPTIVE = new Set(['tcell', 'bcell']);
const apPerTurn = () => byDifficulty(CFG.apPerTurn);

function spawn(name) {
    const base = PATHOGENS[name];
    const remembered = state.memory.has(name);
    return { id: nextId++, name, kind: base.kind, hp: remembered ? Math.max(1, base.hp - 1) : base.hp, remembered };
}

export function init() {
    state = {
        ap: apPerTurn(),
        health: 100,
        wave: 1,
        zones: [[], [], []],
        memory: new Set(),
        kills: 0,
        armed: null, // ability waiting for a target
        over: false,
    };
    state.zones[0] = WAVES[0].map(spawn);
    clearLog('immune-log', 'Wave 1 has entered the bloodstream.');
    resetFacts('immune', 'Viruses (purple) and bacteria (red) are very different enemies. Your body uses different cells for each.');
    render();
}

function findPathogen(id) {
    for (let z = 0; z < 3; z++) {
        const i = state.zones[z].findIndex((p) => p.id === id);
        if (i >= 0) return { z, i, p: state.zones[z][i] };
    }
    return null;
}

const GLYPHS = { macrophage: '🫧', tcell: '🎯', bcell: '🧬' };
const nice = (name) => (name === 'E. COLI' ? 'E. coli' : name[0] + name.slice(1).toLowerCase());

function render() {
    $('immune-ap').innerHTML = Array.from({ length: apPerTurn() }, (_, i) => `<i class="${i < state.ap ? 'on' : ''}"></i>`).join('');
    $('immune-ap').setAttribute('aria-label', `${state.ap} action points left`);
    setMeter('immune-health-bar', 'immune-health-val', state.health);
    $('immune-health-meter').className = `meter ${state.health > 50 ? 'good' : state.health > 25 ? 'warn' : 'bad'}`;
    $('immune-wave').textContent = `${Math.min(state.wave, WAVES.length)} / ${WAVES.length}`;
    $('immune-memory').innerHTML = state.memory.size
        ? `<div class="memory-list">${[...state.memory].map((n) => `<span class="chip game">✓ ${nice(n)}</span>`).join('')}</div>`
        : '<p class="muted" style="font-size:.88rem">Nothing yet. Finish a pathogen with a T-cell or B-cell to remember it.</p>';

    $('immune-abilities').innerHTML = Object.entries(ABILITIES).map(([key, a]) => `
        <button class="ability ${state.armed === key ? 'is-armed' : ''}" data-action="immune:arm" data-arg="${key}"
            ${state.ap < a.cost ? 'aria-disabled="true"' : ''}>
            <span class="glyph" aria-hidden="true">${GLYPHS[key]}</span>
            <span><b>${a.label}</b><small>${a.hint}</small></span>
            <span class="cost">${a.cost} AP</span>
        </button>
    `).join('');

    const armed = state.armed && ABILITIES[state.armed];
    for (let z = 0; z < 3; z++) {
        const lane = $(`immune-zone-${z}`);
        lane.classList.toggle('targetable', armed?.target === 'zone' && state.zones[z].length > 0);
        lane.innerHTML = state.zones[z].map((p) => {
            const targetable = armed && (armed.target === 'pathogen' || (armed.target === 'virus' && p.kind === 'virus'));
            return `
            <button class="pathogen ${p.kind} ${targetable ? 'targetable' : ''}" data-action="immune:target" data-arg="${p.id}"
                aria-label="${nice(p.name)}, ${p.kind}, ${p.hp} HP${p.remembered ? ', remembered' : ''}">
                <span class="kind">${p.kind}</span>
                <b>${nice(p.name)}${p.remembered ? ' <span class="chip game" title="Remembered: weaker, and macrophages do +1">✓</span>' : ''}</b>
                <span class="hp">${'<i></i>'.repeat(p.hp)}</span>
            </button>`;
        }).join('') || '<span class="empty">Clear</span>';
    }
}

function remember(p, source) {
    if (!ADAPTIVE.has(source)) {
        if (!state.memory.has(p.name)) teach('immune', MEMORY_FACTS.innate);
        return;
    }
    if (state.memory.has(p.name)) return;
    state.memory.add(p.name);
    logTo('immune-log', `Memory cells now recognise ${p.name}.`);
    showToast(`Memory cells now recognise ${nice(p.name)}`);
    teach('immune', state.memory.size === 1 ? MEMORY_FACTS.learned : MEMORY_FACTS.vaccine);
}

function damage(z, p, amount, source) {
    p.hp -= amount;
    if (p.hp <= 0) {
        state.zones[z] = state.zones[z].filter((x) => x.id !== p.id);
        state.kills += 1;
        logTo('immune-log', `${p.name} destroyed.`);
        teach('immune', PATHOGENS[p.name].fact);
        remember(p, source);
        return true;
    }
    logTo('immune-log', `${p.name} hit for ${amount}. ${p.hp} HP left.`);
    return false;
}

function spend(key) {
    state.ap -= ABILITIES[key].cost;
    state.armed = null;
    playSound('hit');
}

// Pathogens past the bloodstream multiply: bacteria divide, viruses hijack cells.
function grow() {
    const chance = byDifficulty(CFG.growthChance);
    for (const z of [1, 2]) {
        for (const p of [...state.zones[z]]) {
            if (state.zones[z].length >= CFG.zoneCap || Math.random() >= chance) continue;
            const copy = spawn(p.name);
            copy.hp = Math.min(copy.hp, p.hp);
            state.zones[z].push(copy);
            logTo('immune-log', `${p.name} ${p.kind === 'bacteria' ? 'divided' : 'replicated'} in zone ${z + 1}!`);
            teach('immune', p.kind === 'bacteria' ? MEMORY_FACTS.fission : MEMORY_FACTS.replicate);
        }
    }
}

function endGame(won) {
    state.over = true;
    playSound(won ? 'win' : 'lose');
    logTo('immune-log', won ? `All ${WAVES.length} waves defeated with ${state.health}% organ health.` : 'The organ has failed.');
    onGameOver({
        won,
        title: won ? 'Infection cleared' : 'Organ failure',
        score: won ? state.health * 2 + state.memory.size * 10 : 0,
        stats: [
            ['Organ health', `${state.health}%`],
            ['Waves', `${Math.min(state.wave, WAVES.length)} / ${WAVES.length}`],
            ['Pathogens destroyed', state.kills],
            ['Memory built', `${state.memory.size} / ${Object.keys(PATHOGENS).length}`],
        ],
        metrics: { memory: state.memory.size, health: state.health },
    });
}

function checkVictory() {
    if (state.wave >= WAVES.length && state.zones.every((z) => z.length === 0)) endGame(true);
}

const actions = {
    reset: init,

    arm(key) {
        const a = ABILITIES[key];
        if (state.ap < a.cost) {
            playSound('error');
            showToast('Not enough action points. End your turn to refill.');
            return;
        }
        state.armed = state.armed === key ? null : key;
        if (state.armed) teach('immune', a.fact);
        playSound('card');
        render();
    },

    target(id, el) {
        const hit = findPathogen(id);
        if (!hit) return;
        // Clicking a pathogen with B-Cell armed targets its zone.
        if (state.armed === 'bcell') return actions.zone(hit.z);
        if (!state.armed) {
            showToast('Pick an immune cell first');
            return;
        }
        const { z, p } = hit;
        if (state.armed === 'tcell') {
            if (p.kind !== 'virus') {
                playSound('error');
                shake(el);
                showToast('T-cells only attack viruses');
                return;
            }
            spend('tcell');
            damage(z, p, p.hp, 'tcell');
        } else if (state.armed === 'macrophage') {
            spend('macrophage');
            const tagged = p.remembered ? 1 : 0;
            if (tagged) teach('immune', MEMORY_FACTS.tagged);
            damage(z, p, (p.kind === 'bacteria' ? 2 : 1) + tagged, 'macrophage');
        }
        checkVictory();
        render();
    },

    zone(z) {
        if (state.armed !== 'bcell' || state.zones[z].length === 0) return;
        spend('bcell');
        logTo('immune-log', `Antibodies flood zone ${z + 1}.`);
        for (const p of [...state.zones[z]]) damage(z, p, 1, 'bcell');
        checkVictory();
        render();
    },

    end() {
        state.armed = null;

        // Organ core breaches.
        const breach = state.zones[2].reduce((t, p) => t + p.hp * byDifficulty(CFG.breachDamagePerHp), 0);
        if (breach) {
            state.health = Math.max(0, state.health - breach);
            playSound('lose');
            shake($('immune-zone-2'));
            logTo('immune-log', `BREACH! Organ takes ${breach} damage.`);
            showToast(`Breach! Organ health −${breach}%`);
            teach('immune', BREACH_FACT);
        } else {
            playSound('synth');
        }

        if (state.health <= 0) {
            render();
            return endGame(false);
        }

        state.zones = [[], state.zones[0], state.zones[1]];
        grow();
        if (state.wave < WAVES.length) {
            state.wave += 1;
            state.zones[0] = WAVES[state.wave - 1].map(spawn);
            const known = state.zones[0].filter((p) => p.remembered).length;
            logTo('immune-log', `Wave ${state.wave} arrives: ${WAVES[state.wave - 1].join(', ')}.${known ? ` Memory cells weakened ${known} of them.` : ''}`);
        }
        state.ap = apPerTurn();
        checkVictory();
        render();
    },
};

export function handle(action, arg, el) {
    if (state.over && action !== 'reset') {
        showToast('Game over. Press Restart to play again.');
        return;
    }
    const fn = actions[action];
    if (!fn) return;
    fn(action === 'arm' ? arg : Number(arg), el);
}

// Clicking empty space in a zone while B-Cell is armed targets that zone.
export function handleZoneClick(z) {
    if (state && !state.over && state.armed === 'bcell') actions.zone(z);
}
