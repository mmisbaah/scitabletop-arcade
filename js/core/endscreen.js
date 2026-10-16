// Results screen, kept to about one phone screen: headline and stars, a
// compact score strip, level progress, any unlocks, stats as chips, and the
// facts folded away. The buttons stay pinned at the bottom, led by Next level.

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
let nextLevel = null;

export function showEnd(game, result) {
    replayGame = game;
    const { won, title, score, stats } = result;
    const counts = typeof score === 'number';
    const isRecord = counts && won && recordScore(game, score);
    const best = getBest(game);
    const progress = recordResult(game, result);
    nextLevel = progress.nextLevel;

    const card = $('end-card');
    card.className = `modal-card end-card ${CARTRIDGES.find((c) => c.key === game)?.theme ?? ''}`;
    card.style.setProperty('--game-soft', 'color-mix(in srgb, var(--game) 13%, var(--surface))');
    card.style.setProperty('--game-line', 'color-mix(in srgb, var(--game) 35%, var(--line))');

    const cheer = won || (isYoung() && progress.stars >= 2);
    $('end-mascot').innerHTML = mascotSVG(64, cheer ? 'wow' : isYoung() ? 'happy' : 'sad');
    if (cheer) confetti();

    const badge = $('end-badge');
    badge.textContent = `Level ${progress.level} · ${isRecord ? 'New high score' : progress.passed ? 'Passed' : won ? 'Victory' : isYoung() ? 'Good try!' : 'Not passed'}`;
    badge.className = `chip ${progress.passed || won ? 'good' : 'bad'}`;
    $('end-title').textContent = title;
    $('end-stars').innerHTML = [1, 2, 3].map((n) => icon('star', `icon${n <= progress.stars ? ' on' : ''}`)).join('');
    $('end-stars').setAttribute('aria-label', `${progress.stars} of 3 stars`);

    $('end-score').textContent = counts ? score : '–';
    $('end-best').textContent = best ?? '–';
    $('end-xp').textContent = `+${progress.xpGained}`;

    const lvl = levelOf();
    $('end-level').textContent = progress.levelAfter > progress.levelBefore ? `Player level ${lvl}! Level up!` : `Player level ${lvl}`;
    $('end-level-next').textContent = `${XP_PER_LEVEL - (totalXp() % XP_PER_LEVEL)} XP to go`;
    $('end-level-bar').style.width = `${Math.round(levelProgress() * 100)}%`;

    const lu = $('end-level-up');
    lu.hidden = !progress.unlocked;
    if (progress.unlocked) lu.innerHTML = `${icon('lock')}<span><b>Level ${progress.unlocked} unlocked!</b> It's a little harder. Ready?</span>`;

    $('end-unlocks').innerHTML = progress.newAchievements.map((a) =>
        `<div class="unlock"><span class="badge">${icon('award')}</span><span><b>${a.name}</b> <small class="muted">${a.desc}</small></span></div>`).join('');

    const level = isYoung() ? AGES.young.label.replace('Ages ', '') : currentDifficulty()[0].toUpperCase() + currentDifficulty().slice(1);
    $('end-stats').innerHTML = '';
    for (const [k, v] of [...stats, [isYoung() ? 'Age group' : 'Difficulty', level]]) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = `${k}: ${v}`;
        $('end-stats').appendChild(chip);
    }

    const facts = learnedFacts(game);
    $('end-learned-title').textContent = facts.length ? `What you learned (${facts.length} fact${facts.length > 1 ? 's' : ''})` : 'What you learned';
    $('end-learned').innerHTML = '';
    for (const fact of facts.length ? facts : ['Play a little longer and the lab notes will start filling up.']) {
        const li = document.createElement('li');
        li.textContent = fact;
        $('end-learned').appendChild(li);
    }
    $('end-learned-box').open = false;

    // Buttons: Next level leads when there is one; otherwise Try again does.
    $('end-next').hidden = !nextLevel;
    $('end-next-label').textContent = nextLevel ? `Level ${nextLevel}` : 'Next level';
    $('end-replay-label').textContent = progress.passed ? 'Replay' : 'Try again';
    $('end-replay').className = `btn ${nextLevel ? '' : 'btn-primary'}`;

    $('end-read').hidden = !(isYoung() && canSpeak());
    const spoken = `${title}. You got ${progress.stars} star${progress.stars === 1 ? '' : 's'}!${progress.unlocked ? ` Level ${progress.unlocked} is unlocked!` : ''}`;
    $('end-read').onclick = () => speak(spoken);
    $('end-modal').hidden = false;
    if (isYoung()) speak(spoken);
    refreshIcons($('end-modal'));
    (nextLevel ? $('end-next') : $('end-replay')).focus({ preventScroll: true });
    card.scrollTop = 0;
}

export function hideEnd() {
    $('end-modal').hidden = true;
}

export const lastGame = () => replayGame;
export const pendingNextLevel = () => nextLevel;

// When the player has already left the game, still count the result.
export function recordQuietly(game, result) {
    if (typeof result.score === 'number' && result.won) recordScore(game, result.score);
    recordResult(game, result);
}
