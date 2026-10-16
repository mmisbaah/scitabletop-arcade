// GAME 3: Immune Defense. Pathogens march through 3 zones; spend AP to stop them.

import { $, showToast, logTo, clearLog, setMeter, shake } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { PATHOGENS, WAVES, ABILITIES, IMMUNE_CONFIG as CFG } from '../data/pathogens.js';

let state;
let nextId = 1;

const spawn = (name) => ({ id: nextId++, name, ...PATHOGENS[name] });

export function init() {
    state = {
        ap: CFG.apPerTurn,
        health: 100,
        wave: 1,
        zones: [WAVES[0].map(spawn), [], []],
        armed: null, // ability waiting for a target
        over: false,
    };
    clearLog('immune-log', 'Wave 1 has entered the bloodstream.');
    render();
}

function findPathogen(id) {
    for (let z = 0; z < 3; z++) {
        const i = state.zones[z].findIndex((p) => p.id === id);
        if (i >= 0) return { z, i, p: state.zones[z][i] };
    }
    return null;
}

function render() {
    $('immune-ap').textContent = `${state.ap} AP`;
    setMeter('immune-health-bar', 'immune-health-val', state.health);
    const tone = state.health > 50 ? 'emerald' : state.health > 25 ? 'amber' : 'rose';
    $('immune-health-bar').className = `h-full ${{ emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[tone]}`;
    $('immune-health-val').className = { emerald: 'text-emerald-400', amber: 'text-amber-400', rose: 'text-rose-400' }[tone];
    $('immune-wave').textContent = `WAVE ${Math.min(state.wave, WAVES.length)} / ${WAVES.length}`;

    $('immune-abilities').innerHTML = Object.entries(ABILITIES).map(([key, a]) => `
        <button data-action="immune:arm" data-arg="${key}"
            class="arcade-btn ${a.color} text-white w-full flex justify-between items-center gap-2 text-[10px] ${state.armed === key ? 'armed' : ''}"
            ${state.ap < a.cost ? 'aria-disabled="true"' : ''}>
            <span class="text-left">${a.label}<br><span class="text-slate-300 text-[8px]">${a.hint}</span></span>
            <span class="text-yellow-300">${a.cost} AP</span>
        </button>
    `).join('');

    const armed = state.armed && ABILITIES[state.armed];
    for (let z = 0; z < 3; z++) {
        const zoneEl = $(`immune-zone-${z}`);
        zoneEl.classList.toggle('targetable', armed?.target === 'zone' && state.zones[z].length > 0);
        zoneEl.innerHTML = state.zones[z].map((p) => {
            const targetable = armed && (armed.target === 'pathogen' || (armed.target === 'virus' && p.kind === 'virus'));
            const style = p.kind === 'virus' ? 'bg-fuchsia-950 border-fuchsia-500 text-fuchsia-200' : 'bg-rose-950 border-rose-600 text-rose-200';
            return `
            <button data-action="immune:target" data-arg="${p.id}"
                class="px-2 py-1 border-2 ${style} font-pixel text-[10px] whitespace-nowrap ${targetable ? 'outline outline-2 outline-yellow-400 cursor-crosshair' : ''}">
                ${p.name}<br><span class="text-[8px] text-slate-300">${p.kind.toUpperCase()} ${'#'.repeat(p.hp)}</span>
            </button>`;
        }).join('') || `<span class="font-pixel text-[9px] text-slate-600">CLEAR</span>`;
    }
}

function damage(z, p, amount) {
    p.hp -= amount;
    if (p.hp <= 0) {
        state.zones[z] = state.zones[z].filter((x) => x.id !== p.id);
        logTo('immune-log', `${p.name} destroyed.`);
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

function checkVictory() {
    const empty = state.zones.every((z) => z.length === 0);
    if (state.wave >= WAVES.length && empty) {
        state.over = true;
        playSound('win');
        showToast('INFECTION CLEARED! YOU WIN');
        logTo('immune-log', `All ${WAVES.length} waves defeated with ${state.health}% organ health.`);
    }
}

const actions = {
    reset: init,

    arm(key) {
        const a = ABILITIES[key];
        if (state.ap < a.cost) {
            playSound('error');
            showToast('NOT ENOUGH AP');
            return;
        }
        state.armed = state.armed === key ? null : key;
        playSound('card');
        render();
    },

    target(id, el) {
        const hit = findPathogen(id);
        if (!hit) return;
        // Clicking a pathogen with B-Cell armed targets its zone.
        if (state.armed === 'bcell') return actions.zone(hit.z);
        if (!state.armed) {
            showToast('PICK AN ABILITY FIRST');
            return;
        }
        const { z, p } = hit;
        if (state.armed === 'tcell') {
            if (p.kind !== 'virus') {
                playSound('error');
                shake(el);
                showToast('T-CELLS ONLY TARGET VIRUSES');
                return;
            }
            spend('tcell');
            damage(z, p, p.hp);
        } else if (state.armed === 'macrophage') {
            spend('macrophage');
            damage(z, p, p.kind === 'bacteria' ? 2 : 1);
        }
        checkVictory();
        render();
    },

    zone(z) {
        if (state.armed !== 'bcell' || state.zones[z].length === 0) return;
        spend('bcell');
        logTo('immune-log', `Antibodies flood zone ${z + 1}.`);
        for (const p of [...state.zones[z]]) damage(z, p, 1);
        checkVictory();
        render();
    },

    end() {
        state.armed = null;

        // Organ core breaches.
        const breach = state.zones[2].reduce((sum, p) => sum + p.hp * CFG.breachDamagePerHp, 0);
        if (breach) {
            state.health = Math.max(0, state.health - breach);
            playSound('lose');
            shake($('immune-zone-2'));
            logTo('immune-log', `BREACH! Organ takes ${breach} damage.`);
            showToast(`ORGAN BREACH! -${breach}%`);
        } else {
            playSound('synth');
        }

        if (state.health <= 0) {
            state.over = true;
            render();
            showToast('ORGAN FAILURE! GAME OVER');
            logTo('immune-log', 'The organ has failed.');
            return;
        }

        state.zones = [[], state.zones[0], state.zones[1]];
        if (state.wave < WAVES.length) {
            state.wave += 1;
            state.zones[0] = WAVES[state.wave - 1].map(spawn);
            logTo('immune-log', `Wave ${state.wave} arrives: ${WAVES[state.wave - 1].join(', ')}.`);
        }
        state.ap = CFG.apPerTurn;
        checkVictory();
        render();
    },
};

export function handle(action, arg, el) {
    if (state.over && action !== 'reset') {
        showToast('GAME OVER! PRESS RESET');
        return;
    }
    const fn = actions[action];
    if (!fn) return;
    const parsed = action === 'arm' ? arg : Number(arg);
    fn(parsed, el);
}

// Clicking empty space in a zone while B-Cell is armed targets that zone.
export function handleZoneClick(z) {
    if (state && !state.over && state.armed === 'bcell') actions.zone(z);
}
