// Lab notes: shows a science fact in a game's note card, remembers every fact
// seen this round for the results screen, and adds new ones to the journal.

import { $ } from './ui.js';
import { collectFact } from './progress.js';

const learned = {};

export function teach(game, text, { collect = true } = {}) {
    const box = $(`${game}-fact`);
    const isNew = collect && collectFact(game, text);
    if (box) {
        box.textContent = text;
        const note = $(`${game}-note`);
        note.classList.toggle('is-new', isNew);
        note.classList.remove('flash');
        void note.offsetWidth;
        note.classList.add('flash');
    }
    (learned[game] ??= new Set()).add(text);
}

export function resetFacts(game, intro) {
    learned[game] = new Set();
    const box = $(`${game}-fact`);
    if (box) box.textContent = intro;
    $(`${game}-note`)?.classList.remove('is-new');
}

export function learnedFacts(game) {
    return [...(learned[game] ?? [])];
}
