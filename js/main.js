// App shell: navigation, settings (theme, sound, difficulty), the hub with
// progression, the results screen, and click delegation to each game.

import { $, showToast, refreshIcons, icon } from './core/ui.js';
import { playSound, setAudio } from './core/audio.js';
import { settings, saveSettings, getBest } from './core/storage.js';
import { showEnd, hideEnd, lastGame, recordQuietly, pendingNextLevel } from './core/endscreen.js';
import { ACHIEVEMENTS, isUnlocked, levelOf, levelProgress, totalXp, starsFor, journalSize, currentLevel, unlockedLevel, setCurrentLevel } from './core/progress.js';
import { CARTRIDGES, RULES, KID_CARTRIDGES, KID_RULES } from './data/rules.js';
import { AGES, ageGroup, isYoung, setAge } from './core/age.js';
import { mascotSVG } from './core/art.js';
import { speak, canSpeak } from './core/speech.js';
import { reduced } from './core/anim.js';
import { PLACES, renderWorld, walkTo, walkerAt, placeWalker } from './world/world.js';
import * as chemistry from './games/chemistry.js';
import * as ecosystem from './games/ecosystem.js';
import * as immune from './games/immune.js';
import * as quantum from './games/quantum.js';

const GAMES = { chemistry, ecosystem, immune, quantum };

function startGame(key) {
    GAMES[key].init();
    const chip = document.getElementById(`${key}-level`);
    if (chip) chip.textContent = `Level ${currentLevel(key)}`;
}
const TAB_COLORS = { chemistry: 'var(--chem)', ecosystem: 'var(--eco)', immune: 'var(--imm)', quantum: 'var(--qtm)' };
const started = new Set();
let current = 'hub';

for (const [key, game] of Object.entries(GAMES)) {
    game.setGameOverHandler((result) => {
        // Let the final move land before the results cover the board.
        setTimeout(() => {
            if (current === key) showEnd(key, result);
            else recordQuietly(key, result);
            renderLevel();
        }, 700);
    });
}

// ---------- navigation ----------

function renderTabs() {
    const items = [{ key: 'hub', label: 'Map', short: 'Map', icon: 'map' },
        ...CARTRIDGES.map((c) => ({ key: c.key, label: c.tab, short: c.tab, icon: c.icon }))];
    const html = (compact) => items.map((t) => `
        <button class="tab" data-action="app:go" data-arg="${t.key}" ${t.key === current ? 'aria-current="page"' : ''}
            style="--tab-color:${TAB_COLORS[t.key] ?? 'var(--ink-2)'}">
            ${compact ? icon(t.icon) : t.key === 'hub' ? '' : '<span class="dot"></span>'}${compact ? t.short : t.label}
        </button>`).join('');
    $('top-tabs').innerHTML = html(false);
    $('bottom-tabs').innerHTML = html(true);
    refreshIcons($('bottom-tabs'));
}

function go(key, { push = true } = {}) {
    const target = GAMES[key] ? key : 'hub';
    current = target;
    hideEnd();
    document.querySelectorAll('.screen').forEach((el) => { el.hidden = el.id !== `screen-${target}`; });
    renderTabs();
    if (GAMES[target]) placeWalker(target);
    if (target === 'hub') renderHub();
    if (GAMES[target] && !started.has(target)) {
        startGame(target);
        started.add(target);
    }
    if (push) history.replaceState(null, '', target === 'hub' ? location.pathname : `#${target}`);
    window.scrollTo({ top: 0 });

    // First visit to a game opens its rules as a quick tutorial.
    if (GAMES[target] && !settings.seenRules[target] && settings.age) {
        settings.seenRules[target] = true;
        saveSettings();
        showRules(target, true);
    }
}

// ---------- hub ----------

function cardArt(kind) {
    if (kind === 'molecule') {
        // Water: the H-O-H angle really is 104.5 degrees.
        return `<div class="art-molecule" aria-hidden="true">
            <i class="bond" style="left:75px;top:41px;width:50px;transform:rotate(142.25deg)"></i>
            <i class="bond" style="left:75px;top:41px;width:50px;transform:rotate(37.75deg)"></i>
            <i class="atom-ball" style="left:49px;top:19px;width:52px;height:52px;background:var(--el-O)"></i>
            <i class="atom-ball" style="left:19px;top:57px;width:34px;height:34px;background:var(--el-H);border:1px solid var(--line)"></i>
            <i class="atom-ball" style="left:97px;top:57px;width:34px;height:34px;background:var(--el-H);border:1px solid var(--line)"></i>
            <span class="mono" style="position:absolute;left:58px;top:84px;font-size:.7rem;color:var(--ink-2)">104.5°</span>
        </div>`;
    }
    if (kind === 'pyramid') {
        return `<div class="art-pyramid" aria-hidden="true">
            <span>predators · 1%</span><div style="width:max(8px,1%)"></div>
            <span>herbivores · 10%</span><div style="width:10%"></div>
            <span>plants · 100%</span><div style="width:100%"></div>
        </div>`;
    }
    if (kind === 'antibody') {
        return `<div class="art-antibody" aria-hidden="true">
            <i style="left:53px;top:48px;height:56px"></i>
            <i style="left:34px;top:6px;height:52px;transform:rotate(-35deg)"></i>
            <i style="left:72px;top:6px;height:52px;transform:rotate(35deg)"></i>
        </div>`;
    }
    const cells = Array.from({ length: 25 }, (_, i) => {
        if (i === 7) return '<span><b></b></span>';
        if (i === 11 || i === 13) return '<span><b class="ghost"></b></span>';
        return '<span></span>';
    }).join('');
    return `<div class="art-board" aria-hidden="true">${cells}</div>`;
}

const GAME_COLORS = { chemistry: 'var(--chem)', ecosystem: 'var(--eco)', immune: 'var(--imm)', quantum: 'var(--qtm)' };

function placeInfo(key) {
    const c = CARTRIDGES.find((x) => x.key === key);
    const kid = isYoung() ? KID_CARTRIDGES[key] : null;
    return {
        place: PLACES[key].name, color: GAME_COLORS[key], stars: starsFor(key),
        title: kid?.title ?? c.title, blurb: kid?.blurb ?? c.blurb, subject: c.subject, mode: c.mode, theme: c.theme, art: c.art,
    };
}

// The card under the map: where you are and what you can play there.
function renderLocCard(key) {
    const card = $('loc-card');
    if (!PLACES[key]?.name) {
        card.className = 'loc-card';
        card.innerHTML = `<div class="loc-empty">${icon('map-pin')}<div><b>You're at base camp.</b><span class="muted"> Tap a place on the island to walk there.</span></div></div>`;
        refreshIcons(card);
        return;
    }
    const i = placeInfo(key);
    const best = getBest(key);
    card.className = `loc-card ${i.theme}`;
    card.innerHTML = `
        <div class="loc-art game-art">${cardArt(i.art)}</div>
        <div class="loc-info">
            <div class="eyebrow" style="color:var(--game)">${PLACES[key].icon} ${i.place} · ${i.subject}</div>
            <h3>${i.title}</h3>
            <p class="muted">${i.blurb}</p>
            <div class="game-meta">
                ${starRow(i.stars)}
                <span class="chip">${best === null ? 'Not played yet' : `Best ${best}`}</span>
                <span class="chip game">${journalSize(key)} facts found</span>
                <button class="chip level-pick" data-action="app:level" data-arg="${key}" title="Change level">Level ${currentLevel(key)} / ${unlockedLevel(key)} ▸</button>
            </div>
        </div>
        <div class="loc-actions">
            <button class="btn btn-primary" data-action="app:enter" data-arg="${key}">${icon('play')}Enter ${i.place.split(' ')[1] ?? ''}</button>
            <button class="btn" data-action="app:rules" data-arg="${key}">${icon('circle-help')}How to play</button>
        </div>`;
    refreshIcons(card);
    if (!reduced()) card.animate([{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'ease-out' });
}

// Circle wipe in the location's colour, then switch screens underneath it.
function enterWithWipe(key, from) {
    const wipe = $('wipe');
    if (reduced()) { go(key); return; }
    const r = from?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 2;
    wipe.style.background = GAME_COLORS[key];
    wipe.hidden = false;
    playSound('quantum');
    wipe.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(150vmax at ${x}px ${y}px)` }], { duration: 480, easing: 'ease-in', fill: 'forwards' })
        .onfinish = () => {
            go(key);
            wipe.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' }).onfinish = () => { wipe.hidden = true; wipe.getAnimations().forEach((a) => a.cancel()); };
        };
}

const starRow = (n) => `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map((i) => icon('star', `icon${i <= n ? ' on' : ''}`)).join('')}</span>`;

function renderHub() {
    const unlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a.id)).length;
    const stars = CARTRIDGES.reduce((t, c) => t + starsFor(c.key), 0);
    $('hub-profile').innerHTML = `
        <div class="profile-top">
            <span class="level-ring profile-level" style="--p:${Math.round(levelProgress() * 100)}">${levelOf()}</span>
            <div><div class="eyebrow">Your lab level</div><b style="font-size:1.15rem">Level ${levelOf()} scientist</b>
            <div class="muted num" style="font-size:.85rem">${totalXp()} XP total</div></div>
        </div>
        <div class="profile-stats">
            <div><span class="eyebrow">Stars</span><b class="num">${stars}/12</b></div>
            <div><span class="eyebrow">Badges</span><b class="num">${unlocked}/${ACHIEVEMENTS.length}</b></div>
            <div><span class="eyebrow">Facts</span><b class="num">${journalSize()}</b></div>
        </div>`;

    renderWorld($('world-wrap'), {
        info: placeInfo,
        avatar: AGES[ageGroup()].emoji,
    });
    renderLocCard(walkerAt());
    $('hub-ach-count').textContent = `${unlocked} of ${ACHIEVEMENTS.length}`;
    $('hub-achievements').innerHTML = ACHIEVEMENTS.map((a) => `
        <div class="achievement ${isUnlocked(a.id) ? 'on' : ''}">
            <span class="badge">${icon(isUnlocked(a.id) ? 'award' : 'lock')}</span>
            <div><b>${a.name}</b><small>${a.desc}</small></div>
        </div>`).join('');
    refreshIcons($('screen-hub'));
}

// ---------- rules ----------

function showRules(key, firstTime = false) {
    const data = RULES[key];
    if (!data) return;
    const cart = CARTRIDGES.find((c) => c.key === key);
    $('rules-card').className = `modal-card ${cart?.theme ?? ''}`;
    $('modal-eyebrow').textContent = firstTime ? 'New game · how to play' : 'How to play';
    $('modal-title').textContent = (isYoung() ? KID_CARTRIDGES[key]?.title : null) ?? cart?.title ?? data.title;
    $('modal-content').innerHTML = '';
    const lines = isYoung() ? KID_RULES[key] : data.lines;
    if (isYoung()) speak(lines.join(' '));
    for (const line of lines) {
        const li = document.createElement('li');
        li.textContent = line;
        $('modal-content').appendChild(li);
    }
    $('rules-modal').hidden = false;
}

const closeRules = () => { $('rules-modal').hidden = true; };

// ---------- age groups ----------

const ORIGINAL_HEADS = {};

function applyAge() {
    const group = ageGroup();
    document.body.classList.remove('age-young', 'age-middle', 'age-teen');
    document.body.classList.add(`age-${group}`);
    const a = AGES[group];
    $('age-btn').innerHTML = `${a.emoji} <span class="age-label">${a.label}</span>`;
    $('difficulty-select').hidden = isYoung();

    // Explorers see friendlier game names on each screen.
    for (const c of CARTRIDGES) {
        const head = document.querySelector(`#screen-${c.key} .game-head`);
        const eyebrow = head.querySelector('.eyebrow');
        ORIGINAL_HEADS[c.key] ??= { h2: head.querySelector('h2').textContent, p: head.querySelector('p').textContent, eyebrow: eyebrow.innerHTML };
        const kid = isYoung() ? KID_CARTRIDGES[c.key] : null;
        eyebrow.innerHTML = kid ? ORIGINAL_HEADS[c.key].eyebrow.split(' · ')[0] : ORIGINAL_HEADS[c.key].eyebrow;
        head.querySelector('h2').textContent = kid?.title ?? ORIGINAL_HEADS[c.key].h2;
        head.querySelector('p').textContent = kid?.blurb ?? ORIGINAL_HEADS[c.key].p;
    }
    $('hero-title').innerHTML = isYoung() ? 'Play with <em>science!</em>' : 'Learn science by <em>outplaying</em> it.';
    $('hero-text').textContent = isYoung()
        ? 'Build molecules, feed a forest, bust germs and hop around a quantum board. Tap the speaker to hear things read out loud.'
        : 'Balance molecules, keep a food web alive, hold off an infection and outwit a quantum opponent. Every move comes with the real science behind it.';
    refreshIcons();
}

function showAgePicker() {
    $('age-mascot').innerHTML = mascotSVG(84, 'wow');
    $('age-options').innerHTML = Object.entries(AGES).map(([key, a]) => `
        <button class="age-card ${settings.age === key ? 'is-current' : ''}" data-action="app:pick-age" data-arg="${key}">
            <span class="emoji" aria-hidden="true">${a.emoji}</span>
            <b>${a.name}</b>
            <span class="chip">${a.label}</span>
            <small>${a.blurb}</small>
        </button>`).join('');
    $('age-modal').hidden = false;
}

function pickAge(age) {
    const changed = settings.age !== age;
    setAge(age);
    $('age-modal').hidden = true;
    applyAge();
    playSound('win');
    if (changed) {
        // Every game restarts with the new age group's rules.
        started.clear();
        if (GAMES[current]) {
            startGame(current);
            started.add(current);
        }
    }
    if (current === 'hub') renderHub();
    showToast(`${AGES[age].name} mode: ${AGES[age].label}`);
    if (age === 'young') speak('Hi! Let us play with science!');
}

// ---------- settings ----------

const THEMES = ['system', 'light', 'dark'];

function effectiveDark() {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function renderLevel() {
    $('bar-level-ring').textContent = levelOf();
    $('bar-level-ring').style.setProperty('--p', Math.round(levelProgress() * 100));
    $('bar-level-label').textContent = `Level ${levelOf()}`;
}

function applySettings() {
    setAudio(settings.audio);
    $('audio-toggle').innerHTML = icon(settings.audio ? 'volume-2' : 'volume-x');
    $('audio-toggle').setAttribute('aria-label', settings.audio ? 'Mute sound' : 'Turn sound on');

    if (settings.theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', settings.theme);
    $('theme-toggle').innerHTML = icon(effectiveDark() ? 'moon' : 'sun');
    $('theme-toggle').title = `Theme: ${settings.theme}`;

    $('difficulty-select').value = settings.difficulty;
    renderLevel();
    refreshIcons();
}

const APP_ACTIONS = {
    visit: async (key) => {
        playSound('card');
        if (walkerAt() === key) return renderLocCard(key);
        $('loc-card').classList.add('is-walking');
        await walkTo(key);
        playSound('synth');
        renderLocCard(key);
    },
    enter: (key) => enterWithWipe(key, document.querySelector(`.loc-pin[data-arg="${key}"]`)),
    age: showAgePicker,
    'pick-age': pickAge,
    read: (game) => {
        if (!speak($(`${game}-fact`)?.textContent)) showToast('Read-aloud isn\'t available in this browser');
    },
    go: (arg) => { playSound('card'); go(arg); },
    rules: (arg) => showRules(arg),
    'close-rules': closeRules,
    replay: () => {
        hideEnd();
        const game = lastGame();
        if (GAMES[game]) startGame(game);
    },
    'next-level': () => {
        const game = lastGame();
        const n = pendingNextLevel();
        hideEnd();
        if (!GAMES[game] || !n) return;
        setCurrentLevel(game, n);
        playSound('win');
        startGame(game);
        showToast(`Level ${n}: here we go!`);
        if (isYoung()) speak(`Level ${n}!`);
    },
    level: (key) => {
        // Cycle through unlocked levels from the map card.
        const n = currentLevel(key) >= unlockedLevel(key) ? 1 : currentLevel(key) + 1;
        setCurrentLevel(key, n);
        started.delete(key);
        renderLocCard(key);
    },
    audio: () => {
        settings.audio = !settings.audio;
        saveSettings();
        applySettings();
        showToast(settings.audio ? 'Sound on' : 'Sound off');
    },
    theme: () => {
        settings.theme = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length];
        saveSettings();
        applySettings();
        showToast(`Theme: ${settings.theme === 'system' ? 'match device' : settings.theme}`);
    },
};

$('difficulty-select').addEventListener('change', (e) => {
    settings.difficulty = e.target.value;
    saveSettings();
    playSound('card');
    if (current === 'hub') renderHub();
    showToast(`${settings.difficulty[0].toUpperCase()}${settings.difficulty.slice(1)} starts with your next game`);
});

document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) {
        // B-Cell can target an empty patch of a lane.
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
        if (settings.age) $('age-modal').hidden = true;
        closeRules();
        hideEnd();
    }
});

window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', applySettings);
window.addEventListener('hashchange', () => go(location.hash.slice(1), { push: false }));

document.body.classList.toggle('can-speak', canSpeak());
document.querySelectorAll('.mascot-slot').forEach((el) => { el.innerHTML = mascotSVG(56); });
$('hero-mascot').innerHTML = mascotSVG(96, 'happy');
applyAge();
applySettings();
go(location.hash.slice(1), { push: false });
if (!settings.age) showAgePicker();
