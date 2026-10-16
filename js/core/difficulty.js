// Picks a value for the current difficulty from { easy, normal, hard }.
// Young players always get Easy.

import { settings } from './storage.js';

export const DIFFICULTIES = ['easy', 'normal', 'hard'];

export const currentDifficulty = () => (settings.age === 'young' ? 'easy' : settings.difficulty);

export function byDifficulty(values) {
    return values[currentDifficulty()] ?? values.normal;
}
