// Results screen: stars, score, personal best, XP and level, new achievements,
// stats and the facts the player met this round.

import { $, refreshIcons, icon } from './ui.js';
import { learnedFacts } from './facts.js';
import { getBest, recordScore } from './storage.js';
import { currentDifficulty } from './difficulty.js';
import { AGES, isYoung } from './age.js';
import { confetti } from './confetti.js';
import { mascotSVG } from './art.js';
import { speak, canSpeak } from './speech.js';
import { recordResult, levelOf, levelProgress, totalXp } from './progress.js';
import { CARTRIDGES } from '../data/rules.js';

const XP_PER_LEVEL = 250;
let replayGame = null;

function setList(el, items, make) {
    el.innerHTML = '';
    for (const item of items) el.appendChild(make(item));
}

export function showEnd(game, result) {
    replayGame = game;
    const { won, title, score, stats } = result;
    const counts = typeof score === 'number';
    const isRecord = counts && won && recordScore(game, score);
    const best = getBest(game);
    const progress = recordResult(game, result);

    const card = $('end-card');
    card.className = `modal-card ${CARTRIDGES.find((c) => c.key === game)?.theme ?? ''}`;
    card.style.setProperty('--game-soft', 'color-mix(in srgb, var(--game) 13%, var(--surface))');
    card.style.setProperty('--game-line', 'color-mix(in srgb, var(--game) 35%, var(--line))');

    const cheer = won || (isYoung() && progress.stars >= 2);
    $('end-mascot').innerHTML = mascotSVG(84, cheer ? 'wow' : isYoung() ? 'happy' : 'sad');
    if (cheer) confetti();
    const badge = $('end-badge');
    badge.textContent = isRecord ? 'New high score' : won ? 'Victory' : isYoung() ? 'Good try!' : 'Game over';
    badge.className = `chip ${won ? 'good' : 'bad'}`;
    $('end-title').textContent = title;
    $('end-stars').innerHTML = [1, 2, 3].map((n) => icon('star', `icon${n <= progress.stars ? ' on' : ''}`)).join('');
    $('end-stars').setAttribute('aria-label', `${progress.stars} of 3 stars`);

    $('end-score').textContent = counts ? score : '–';
    $('end-best').textContent = best ?? '–';
    $('end-xp').textContent = `+${progress.xpGained}`;

    const lvl = levelOf();
    $('end-level').textContent = progress.levelAfter > progress.levelBefore ? `Level up! You reached level ${lvl}` : `Level ${lvl}`;
    $('end-level-next').textContent = `${XP_PER_LEVEL - (totalXp() % XP_PER_LEVEL)} XP to level ${lvl + 1}`;
    $('end-level-bar').style.width = `${Math.round(levelProgress() * 100)}%`;

    setList($('end-unlocks'), progress.newAchievements, (a) => {
        const div = document.createElement('div');
        div.className = 'unlock';
        div.innerHTML = `<span class="badge">${icon('award')}</span><div><b></b><br><small class="muted"></small></div>`;
        div.querySelector('b').textContent = `Achievement unlocked: ${a.name}`;
        div.querySelector('small').textContent = a.desc;
        return div;
    });

    $('end-stats').innerHTML = '';
    const level = isYoung() ? AGES.young.label : currentDifficulty()[0].toUpperCase() + currentDifficulty().slice(1);
    for (const [k, v] of [...stats, [isYoung() ? 'Age group' : 'Difficulty', level]]) {
        const dt = document.createElement('dt');
        dt.textContent = k[0] + k.slice(1).toLowerCase();
        const dd = document.createElement('dd');
        dd.textContent = v;
        $('end-stats').append(dt, dd);
    }

    const facts = learnedFacts(game);
    setList($('end-learned'), facts.length ? facts : ['Play a little longer and the lab notes will start filling up.'], (fact) => {
        const li = document.createElement('li');
        li.textContent = fact;
        return li;
    });

    $('end-read').hidden = !(isYoung() && canSpeak());
    $('end-read').onclick = () => speak(`${title}. You got ${progress.stars} stars!`);
    $('end-modal').hidden = false;
    if (isYoung()) speak(`${title}. You got ${progress.stars} star${progress.stars > 1 ? 's' : ''}!`);
    refreshIcons($('end-modal'));
    $('end-replay').focus({ preventScroll: true });
    card.scrollTop = 0;
}

export function hideEnd() {
    $('end-modal').hidden = true;
}

export const lastGame = () => replayGame;
