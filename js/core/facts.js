// "Lab notes": shows a science fact in a game's fact strip and remembers
// every fact the player saw, so the end screen can list what they learned.

import { $ } from './ui.js';

const learned = {};

export function teach(game, text) {
    const box = $(`${game}-fact`);
    if (box) {
        box.textContent = text;
        box.parentElement.classList.remove('fact-flash');
        void box.offsetWidth;
        box.parentElement.classList.add('fact-flash');
    }
    (learned[game] ??= new Set()).add(text);
}

export function resetFacts(game, intro) {
    learned[game] = new Set();
    const box = $(`${game}-fact`);
    if (box) box.textContent = intro;
}

export function learnedFacts(game) {
    return [...(learned[game] ?? [])];
}
