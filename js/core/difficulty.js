// Picks a value for the current difficulty from { easy, normal, hard }.

import { settings } from './storage.js';

export const DIFFICULTIES = ['easy', 'normal', 'hard'];

export function byDifficulty(values) {
    return values[settings.difficulty] ?? values.normal;
}
