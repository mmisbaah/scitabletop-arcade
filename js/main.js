// App shell: screen routing, global toggles, and click delegation to each game.

import { $, showToast, refreshIcons } from './core/ui.js';
import { playSound, toggleAudio } from './core/audio.js';
import { CARTRIDGES, RULES } from './data/rules.js';
import * as chemistry from './games/chemistry.js';
import * as ecosystem from './games/ecosystem.js';
import * as immune from './games/immune.js';
import * as quantum from './games/quantum.js';

const GAMES = { chemistry, ecosystem, immune, quantum };
const started = new Set();

function renderHub() {
    $('hub-cards').innerHTML = CARTRIDGES.map((g) => `
        <div class="pixel-card p-5 flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between mb-3 border-b-2 ${g.style.rule} pb-2">
                    <span class="font-pixel text-xs ${g.style.code} flex items-center gap-1">
                        <i data-lucide="${g.icon}" class="w-4 h-4"></i> ${g.code}
                    </span>
                    <span class="font-pixel text-[10px] ${g.style.tag} px-2 py-0.5 border">${g.tag}</span>
                </div>
                <h3 class="font-pixel text-lg ${g.style.title} mb-2">${g.title}</h3>
                <p class="font-arcade text-lg text-slate-300 mb-4">${g.blurb}</p>
            </div>
            <button data-action="app:go" data-arg="${g.key}" class="arcade-btn ${g.style.btn} text-black w-full">
                PLAY CARTRIDGE &gt;
            </button>
        </div>
    `).join('');
}

function go(key, { push = true } = {}) {
    const target = GAMES[key] ? key : 'hub';
    document.querySelectorAll('.screen').forEach((el) => el.classList.add('hidden'));
    $(`screen-${target}`).classList.remove('hidden');
    if (GAMES[target] && !started.has(target)) {
        GAMES[target].init();
        started.add(target);
    }
    if (push) history.replaceState(null, '', target === 'hub' ? location.pathname : `#${target}`);
    window.scrollTo({ top: 0 });
}

function showRules(key) {
    const data = RULES[key];
    if (!data) return;
    $('modal-title').textContent = data.title;
    $('modal-content').innerHTML = '';
    for (const line of data.lines) {
        const li = document.createElement('li');
        li.textContent = `> ${line}`;
        $('modal-content').appendChild(li);
    }
    $('rules-modal').classList.remove('hidden');
}

const closeRules = () => $('rules-modal').classList.add('hidden');

const APP_ACTIONS = {
    go: (arg) => { playSound('card'); go(arg); },
    rules: showRules,
    'close-rules': closeRules,
    audio: () => {
        const on = toggleAudio();
        $('audio-toggle').innerHTML = `<i data-lucide="${on ? 'volume-2' : 'volume-x'}" class="w-4 h-4"></i>`;
        refreshIcons();
        showToast(on ? '8-BIT AUDIO ON' : 'AUDIO MUTED');
    },
    crt: () => {
        const off = $('crt-layer').classList.toggle('off');
        showToast(off ? 'CRT FILTER OFF' : 'CRT FILTER ON');
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
    if (el.getAttribute('aria-disabled') === 'true' && !el.dataset.action.startsWith('immune:arm')) return;
    const [scope, action] = el.dataset.action.split(':');
    const arg = el.dataset.arg;
    if (scope === 'app') APP_ACTIONS[action]?.(arg);
    else GAMES[scope]?.handle(action, arg, el);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRules();
});

window.addEventListener('hashchange', () => go(location.hash.slice(1), { push: false }));

renderHub();
refreshIcons();
go(location.hash.slice(1), { push: false });
