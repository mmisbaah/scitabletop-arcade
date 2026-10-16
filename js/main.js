// App shell: screen routing, global settings, end screen, and click delegation
// to each game.

import { $, showToast, refreshIcons } from './core/ui.js';
import { playSound, setAudio } from './core/audio.js';
import { settings, saveSettings, getBest } from './core/storage.js';
import { DIFFICULTIES } from './core/difficulty.js';
import { showEnd, hideEnd, lastGame } from './core/endscreen.js';
import { CARTRIDGES, RULES } from './data/rules.js';
import * as chemistry from './games/chemistry.js';
import * as ecosystem from './games/ecosystem.js';
import * as immune from './games/immune.js';
import * as quantum from './games/quantum.js';

const GAMES = { chemistry, ecosystem, immune, quantum };
const started = new Set();

for (const [key, game] of Object.entries(GAMES)) {
    game.setGameOverHandler((result) => {
        // Let the final move render before the results cover the board.
        setTimeout(() => showEnd(key, result), 700);
    });
}

function renderHub() {
    $('hub-cards').innerHTML = CARTRIDGES.map((g) => {
        const best = getBest(g.key);
        return `
        <div class="pixel-card p-5 flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between mb-3 border-b-2 ${g.style.rule} pb-2">
                    <span class="font-pixel text-xs ${g.style.code} flex items-center gap-1">
                        <i data-icon="${g.icon}" class="w-4 h-4"></i> ${g.code}
                    </span>
                    <span class="font-pixel text-[10px] ${g.style.tag} px-2 py-0.5 border">${g.tag}</span>
                </div>
                <h3 class="font-pixel text-lg ${g.style.title} mb-2">${g.title}</h3>
                <p class="font-arcade text-lg text-slate-300 mb-3">${g.blurb}</p>
                <p class="font-pixel text-[10px] text-yellow-300 mb-4 flex items-center gap-1">
                    <i data-icon="trophy" class="w-3 h-3"></i> BEST: ${best ?? 'NOT PLAYED YET'}
                </p>
            </div>
            <button data-action="app:go" data-arg="${g.key}" class="arcade-btn ${g.style.btn} text-black w-full">
                PLAY CARTRIDGE &gt;
            </button>
        </div>`;
    }).join('');
    refreshIcons($('hub-cards'));
}

function go(key, { push = true } = {}) {
    const target = GAMES[key] ? key : 'hub';
    hideEnd();
    document.querySelectorAll('.screen').forEach((el) => el.classList.add('hidden'));
    $(`screen-${target}`).classList.remove('hidden');
    if (target === 'hub') renderHub();
    if (GAMES[target] && !started.has(target)) {
        GAMES[target].init();
        started.add(target);
    }
    if (push) history.replaceState(null, '', target === 'hub' ? location.pathname : `#${target}`);
    window.scrollTo({ top: 0 });

    // First visit to a game opens its rules as a quick tutorial.
    if (GAMES[target] && !settings.seenRules[target]) {
        settings.seenRules[target] = true;
        saveSettings();
        showRules(target, true);
    }
}

function showRules(key, firstTime = false) {
    const data = RULES[key];
    if (!data) return;
    $('modal-title').textContent = firstTime ? `HOW TO PLAY: ${data.title.replace(' RULES', '')}` : data.title;
    $('modal-content').innerHTML = '';
    for (const line of data.lines) {
        const li = document.createElement('li');
        li.textContent = `> ${line}`;
        $('modal-content').appendChild(li);
    }
    $('rules-modal').classList.remove('hidden');
}

const closeRules = () => $('rules-modal').classList.add('hidden');

function applySettings() {
    setAudio(settings.audio);
    $('audio-toggle').innerHTML = `<i data-icon="${settings.audio ? 'volume-2' : 'volume-x'}" class="w-4 h-4"></i>`;
    $('crt-layer').classList.toggle('off', !settings.crt);
    $('difficulty-label').textContent = settings.difficulty.toUpperCase();
    refreshIcons();
}

const APP_ACTIONS = {
    go: (arg) => { playSound('card'); go(arg); },
    rules: (arg) => showRules(arg),
    'close-rules': closeRules,
    replay: () => {
        hideEnd();
        const game = lastGame();
        if (GAMES[game]) GAMES[game].init();
    },
    audio: () => {
        settings.audio = !settings.audio;
        saveSettings();
        applySettings();
        showToast(settings.audio ? '8-BIT AUDIO ON' : 'AUDIO MUTED');
    },
    crt: () => {
        settings.crt = !settings.crt;
        saveSettings();
        applySettings();
        showToast(settings.crt ? 'CRT FILTER ON' : 'CRT FILTER OFF');
    },
    difficulty: () => {
        const next = DIFFICULTIES[(DIFFICULTIES.indexOf(settings.difficulty) + 1) % DIFFICULTIES.length];
        settings.difficulty = next;
        saveSettings();
        applySettings();
        playSound('card');
        showToast(`${next.toUpperCase()} MODE: APPLIES ON RESET`);
    },
};

document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) {
        // B-Cell can target an empty patch of a zone track.
        const zone = e.target.closest('[data-zone]');
        if (zone) immune.handleZoneClick(Number(zone.dataset.zone));
        if (e.target.id === 'rules-modal') closeRules();
        return;
    }
    const [scope, action] = el.dataset.action.split(':');
    const arg = el.dataset.arg;
    if (scope === 'app') APP_ACTIONS[action]?.(arg);
    else GAMES[scope]?.handle(action, arg, el);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeRules();
        hideEnd();
    }
});

window.addEventListener('hashchange', () => go(location.hash.slice(1), { push: false }));

applySettings();
go(location.hash.slice(1), { push: false });
