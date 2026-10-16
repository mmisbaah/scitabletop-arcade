// GAME 3: Immune Defense. Pathogens march through 3 zones; spend AP to stop them.
// Beating a pathogen with adaptive cells (T-cells, B-cells) builds memory that
// makes the next encounter easier, the same way vaccines work.

import { $, showToast, logTo, clearLog, setMeter, shake, floatPoints } from '../core/ui.js';
import { playSound } from '../core/audio.js';
import { teach, resetFacts } from '../core/facts.js';
import { byDifficulty } from '../core/difficulty.js';
import { isYoung, byAge, say } from '../core/age.js';
import { germSVG } from '../core/art.js';
import { flip, sprite, burst, shakeScreen, flash } from '../core/anim.js';
import { currentLevel } from '../core/progress.js';

let LEVEL = 1;
// Extra waves for higher levels: everything at once.
const BONUS_WAVE = ['STREP', 'SALMONELLA', 'INFLUENZA', 'E. COLI', 'RHINOVIRUS'];
import { PATHOGENS, WAVES as ALL_WAVES, ABILITIES, BREACH_FACT, MEMORY_FACTS, IMMUNE_KID, AGE_TUNING, IMMUNE_CONFIG as CFG } from '../data/pathogens.js';

let T = {};
let WAVES = ALL_WAVES;

let state;
let nextId = 1;
let onGameOver = () => {};
export function setGameOverHandler(fn) { onGameOver = fn; }

const ADAPTIVE = new Set(['tcell', 'bcell']);
const apPerTurn = () => T.ap ?? byDifficulty(CFG.apPerTurn);

function spawn(name) {
    const base = PATHOGENS[name];
    const remembered = state.memory.has(name);
    return { id: nextId++, name, kind: base.kind, hp: remembered ? Math.max(1, base.hp - 1) : base.hp, remembered };
}

export function init() {
    T = byAge(AGE_TUNING);
    LEVEL = currentLevel('immune');
    // Explorers get one more wave per level (up to 5); everyone else gets bonus waves on top of 5.
    const base = Math.min(ALL_WAVES.length, (T.waves ?? ALL_WAVES.length) + (T.waves ? LEVEL - 1 : 0));
    const bonus = T.waves ? 0 : Math.min(4, LEVEL - 1);
    WAVES = [...ALL_WAVES.slice(0, base), ...Array(bonus).fill(BONUS_WAVE)];
    document.getElementById('screen-immune').classList.toggle('kid-mode', isYoung());
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
    resetFacts('immune', say('Viruses (purple, spiky) and bacteria (green, bean-shaped) are very different enemies. Your body uses different cells for each.', IMMUNE_KID.intro));
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
            <span><b>${isYoung() ? `${a.kidLabel} (${a.label})` : a.label}</b><small>${a.hint}</small></span>
            <span class="cost">${a.cost} AP</span>
        </button>
    `).join('');

    const armed = state.armed && ABILITIES[state.armed];
    // Germs slide between lanes; beaten ones linger a moment so the helper cell can reach them.
    flip($('immune-tracks'), () => renderLanes(armed), { selector: '.pathogen', exitDelay: 320, duration: 520 });
}

function renderLanes(armed) {
    for (let z = 0; z < 3; z++) {
        const lane = $(`immune-zone-${z}`);
        lane.classList.toggle('targetable', armed?.target === 'zone' && state.zones[z].length > 0);
        lane.innerHTML = state.zones[z].map((p) => {
            const targetable = armed && (armed.target === 'pathogen' || (armed.target === 'virus' && p.kind === 'virus'));
            return `
            <button class="pathogen ${p.kind} ${targetable ? 'targetable' : ''}" data-key="${p.id}" data-action="immune:target" data-arg="${p.id}"
                aria-label="${nice(p.name)}, ${p.kind}, ${p.hp} HP${p.remembered ? ', remembered' : ''}">
                <span class="germ-wrap">${germSVG(p.kind, 40)}</span>
                <span class="kind">${p.kind}</span>
                <b>${nice(p.name)}${p.remembered ? ' <span class="chip game" title="Remembered: weaker, and macrophages do +1">✓</span>' : ''}</b>
                <span class="hp">${'<i></i>'.repeat(p.hp)}</span>
            </button>`;
        }).join('') || '<span class="empty">Clear</span>';
    }
}

function remember(p, source) {
    if (!ADAPTIVE.has(source)) {
        if (!state.memory.has(p.name)) teach('immune', say(MEMORY_FACTS.innate, 'Gobbler cells fight any germ, but they can\'t remember them. Zappers and Taggers can!'));
        return;
    }
    if (state.memory.has(p.name)) return;
    state.memory.add(p.name);
    logTo('immune-log', `Memory cells now recognise ${p.name}.`);
    showToast(isYoung() ? `Your body will remember ${nice(p.name)}!` : `Memory cells now recognise ${nice(p.name)}`);
    teach('immune', say(state.memory.size === 1 ? MEMORY_FACTS.learned : MEMORY_FACTS.vaccine, IMMUNE_KID.learned));
}

function damage(z, p, amount, source) {
    p.hp -= amount;
    if (p.hp <= 0) {
        state.zones[z] = state.zones[z].filter((x) => x.id !== p.id);
        state.kills += 1;
        logTo('immune-log', `${p.name} destroyed.`);
        teach('immune', say(PATHOGENS[p.name].fact, PATHOGENS[p.name].kid));
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
    const chance = Math.min(0.8, (T.growth ?? byDifficulty(CFG.growthChance) * (T.growthScale ?? 1)) + 0.06 * (LEVEL - 1));
    for (const z of [1, 2]) {
        for (const p of [...state.zones[z]]) {
            if (state.zones[z].length >= CFG.zoneCap || Math.random() >= chance) continue;
            const copy = spawn(p.name);
            copy.hp = Math.min(copy.hp, p.hp);
            state.zones[z].push(copy);
            logTo('immune-log', `${p.name} ${p.kind === 'bacteria' ? 'divided' : 'replicated'} in zone ${z + 1}!`);
            teach('immune', say(p.kind === 'bacteria' ? MEMORY_FACTS.fission : MEMORY_FACTS.replicate, IMMUNE_KID.grow));
        }
    }
}

function endGame(won) {
    state.over = true;
    playSound(won ? 'win' : 'lose');
    logTo('immune-log', won ? `All ${WAVES.length} waves defeated with ${state.health}% organ health.` : 'The organ has failed.');
    onGameOver({
        won,
        title: won ? (isYoung() ? 'You busted all the germs!' : 'Infection cleared') : (isYoung() ? 'The germs got in this time' : 'Organ failure'),
        kidStars: state.health >= 70 ? 3 : state.health >= 35 ? 2 : 1,
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
        if (state.armed) teach('immune', say(a.fact, a.kid));
        playSound('card');
        render();
    },

    target(id, el) {
        const hit = findPathogen(id);
        if (!hit) return;
        // Clicking a pathogen with B-Cell armed targets its zone.
        if (state.armed === 'bcell') return actions.zone(hit.z);
        if (!state.armed && T.autoTarget) {
            const pick = hit.p.kind === 'virus' && state.ap >= 2 ? 'tcell' : state.ap >= 1 ? 'macrophage' : null;
            if (!pick) {
                playSound('error');
                showToast('Out of energy! Press End turn.');
                return;
            }
            state.armed = pick;
            teach('immune', say(ABILITIES[pick].fact, ABILITIES[pick].kid));
            floatPoints(pick === 'tcell' ? '⚡ Zap!' : '😋 Gulp!', el);
        }
        if (!state.armed) {
            showToast('Pick an immune cell first');
            return;
        }
        const { z, p } = hit;
        const used = state.armed;
        const origin = document.querySelector(`#immune-abilities [data-arg="${used}"]`)?.getBoundingClientRect();
        const target = el?.getBoundingClientRect();
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
            if (tagged) teach('immune', say(MEMORY_FACTS.tagged, 'Your body remembered this germ, so the Gobbler gets an extra big bite!'));
            damage(z, p, (p.kind === 'bacteria' ? 2 : 1) + tagged, 'macrophage');
        }
        const killed = !findPathogen(id);
        sprite(GLYPHS[used], origin, target, { duration: 340, size: 36 }).then(() => {
            burst(target, killed ? { count: 16, emoji: used === 'tcell' ? ['⚡', '✨'] : ['💥', '✨'], size: 9, spread: 60 } : { count: 8, spread: 36 });
        });
        checkVictory();
        render();
    },

    zone(z) {
        if (state.armed !== 'bcell' || state.zones[z].length === 0) return;
        const origin = document.querySelector('#immune-abilities [data-arg="bcell"]')?.getBoundingClientRect();
        $(`immune-zone-${z}`).querySelectorAll('.pathogen').forEach((g, k) => {
            const r = g.getBoundingClientRect();
            setTimeout(() => sprite('<b class="antibody">Y</b>', origin, r, { duration: 360, size: 30 }).then(() => burst(r, { count: 8, spread: 34 })), k * 70);
        });
        spend('bcell');
        logTo('immune-log', `Antibodies flood zone ${z + 1}.`);
        for (const p of [...state.zones[z]]) damage(z, p, 1, 'bcell');
        checkVictory();
        render();
    },

    end() {
        state.armed = null;

        // Organ core breaches.
        const breach = state.zones[2].reduce((t, p) => t + p.hp * (T.breach ?? byDifficulty(CFG.breachDamagePerHp)), 0);
        if (breach) {
            // Breaching germs dive into the organ.
            const heart = document.querySelector('#immune-zone-2')?.closest('.track')?.querySelector('.track-label')?.getBoundingClientRect();
            $('immune-zone-2').querySelectorAll('.pathogen').forEach((g) => sprite(germSVG(g.classList.contains('virus') ? 'virus' : 'bacteria', 36), g.getBoundingClientRect(), heart, { duration: 420, arc: -20 }));
            setTimeout(() => { flash(); shakeScreen(); burst(heart, { emoji: '💔', count: 6, size: 10, spread: 50 }); }, 380);
            state.zones[2] = [];
            state.health = Math.max(0, state.health - breach);
            playSound('lose');
            shake($('immune-zone-2'));
            logTo('immune-log', `BREACH! Organ takes ${breach} damage.`);
            showToast(`Breach! Organ health −${breach}%`);
            teach('immune', say(BREACH_FACT, IMMUNE_KID.breach));
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
