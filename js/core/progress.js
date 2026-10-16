// Meta-progression shared by every game: XP and player level, 1-3 stars per
// game, achievements, and a journal of every science fact the player has met.

import { load, save } from './storage.js';
import { currentDifficulty } from './difficulty.js';
import { isYoung } from './age.js';

const XP_PER_LEVEL = 250;

export const ACHIEVEMENTS = [
    { id: 'first-win', name: 'First Experiment', desc: 'Win any game.', test: (g, r) => r.won },
    { id: 'chem-discoverer', name: 'Discoverer', desc: 'Discover 5 molecules first in one Alchemy game.', test: (g, r) => g === 'chemistry' && (r.metrics?.discoveries ?? 0) >= 5 },
    { id: 'chem-hard', name: 'Nobel Material', desc: 'Beat the Alchemy CPU on Hard.', test: (g, r) => g === 'chemistry' && r.won && currentDifficulty() === 'hard' },
    { id: 'eco-keystone', name: 'Keystone Keeper', desc: 'Finish Ecosystem with a wolf still alive.', test: (g, r) => g === 'ecosystem' && r.won && r.metrics?.wolf },
    { id: 'eco-diverse', name: 'Biodiversity Hotspot', desc: 'Finish Ecosystem with 75%+ biodiversity.', test: (g, r) => g === 'ecosystem' && r.won && (r.metrics?.diversity ?? 0) >= 75 },
    { id: 'imm-memory', name: 'Total Recall', desc: 'Build immune memory against all 5 pathogens.', test: (g, r) => g === 'immune' && (r.metrics?.memory ?? 0) >= 5 },
    { id: 'imm-flawless', name: 'Not a Scratch', desc: 'Clear Immune Defense at 100% organ health.', test: (g, r) => g === 'immune' && r.won && r.metrics?.health === 100 },
    { id: 'qtm-win', name: 'Wavefunction Wrangler', desc: 'Beat the Quantum chess CPU.', test: (g, r) => g === 'quantum' && r.won && r.metrics?.vsCpu },
    { id: 'qtm-hard', name: 'Spooky Action', desc: 'Beat the Quantum chess CPU on Hard.', test: (g, r) => g === 'quantum' && r.won && r.metrics?.vsCpu && currentDifficulty() === 'hard' },
    { id: 'scholar', name: 'Scholar', desc: 'Collect 40 facts in your journal.', test: () => journalSize() >= 40 },
];

const blank = () => ({ xp: 0, stars: {}, unlocked: [], journal: {} });
let data = { ...blank(), ...load('progress', {}) };
const persist = () => save('progress', data);

export const levelOf = (xp = data.xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const levelProgress = (xp = data.xp) => (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
export const totalXp = () => data.xp;
export const starsFor = (game) => data.stars[game] ?? 0;
export const isUnlocked = (id) => data.unlocked.includes(id);
export const journalSize = (game) =>
    game ? (data.journal[game]?.length ?? 0) : Object.values(data.journal).reduce((t, list) => t + list.length, 0);
export const journal = (game) => data.journal[game] ?? [];

export function collectFact(game, text) {
    const list = (data.journal[game] ??= []);
    if (list.includes(text)) return false;
    list.push(text);
    persist();
    return true;
}

// Stars: young players earn 1-3 for how well they did (and always 1 for
// finishing). Everyone else gets 1 for a win, 2 on Normal, 3 on Hard.
function starsForResult(result) {
    if (isYoung()) return Math.max(1, Math.min(3, result.kidStars ?? (result.won ? 3 : 1)));
    if (!result.won) return 0;
    return { easy: 1, normal: 2, hard: 3 }[currentDifficulty()] ?? 1;
}

// Called once per finished game. Returns what changed, for the results screen.
export function recordResult(game, result) {
    const levelBefore = levelOf();
    const xpGained = Math.round((result.won ? 60 : isYoung() ? 40 : 20) + Math.max(0, result.score ?? 0) / 4);
    data.xp += xpGained;

    const stars = starsForResult(result);
    data.stars[game] = Math.max(data.stars[game] ?? 0, stars);

    const newAchievements = ACHIEVEMENTS.filter((a) => !data.unlocked.includes(a.id) && a.test(game, result));
    data.unlocked.push(...newAchievements.map((a) => a.id));
    persist();

    return { xpGained, stars, levelBefore, levelAfter: levelOf(), newAchievements };
}
