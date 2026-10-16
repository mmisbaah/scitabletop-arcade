// End-of-game results: score, personal best, stats and the facts the player met.

import { $, refreshIcons } from './ui.js';
import { learnedFacts } from './facts.js';
import { settings, getBest, recordScore } from './storage.js';

let replayGame = null;

export function showEnd(game, { won, title, score, stats }) {
    replayGame = game;
    const counts = typeof score === 'number';
    const isRecord = counts && won && recordScore(game, score);
    const best = getBest(game);

    const badge = $('end-badge');
    badge.textContent = isRecord ? 'NEW HIGH SCORE!' : won ? 'VICTORY' : 'GAME OVER';
    badge.className = `inline-block px-3 py-1 font-pixel text-[10px] border-2 border-black ${isRecord ? 'bg-yellow-400 text-black animate-pulse' : won ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'}`;
    $('end-title').textContent = title;
    $('end-score').textContent = counts ? score : '-';
    $('end-best').textContent = best ?? '-';

    $('end-stats').innerHTML = '';
    for (const [k, v] of [...stats, ['DIFFICULTY', settings.difficulty.toUpperCase()]]) {
        const dt = document.createElement('dt');
        dt.className = 'text-slate-400';
        dt.textContent = k;
        const dd = document.createElement('dd');
        dd.className = 'text-right text-cyan-200';
        dd.textContent = v;
        $('end-stats').append(dt, dd);
    }

    const facts = learnedFacts(game);
    $('end-learned').innerHTML = '';
    for (const fact of facts.length ? facts : ['Play a little longer and the Lab Notes will start filling up.']) {
        const li = document.createElement('li');
        li.textContent = `> ${fact}`;
        $('end-learned').appendChild(li);
    }

    $('end-modal').classList.remove('hidden');
    refreshIcons($('end-modal'));
    $('end-replay').focus({ preventScroll: true });
    $('end-modal').firstElementChild.scrollTop = 0;
}

export function hideEnd() {
    $('end-modal').classList.add('hidden');
}

export const lastGame = () => replayGame;
