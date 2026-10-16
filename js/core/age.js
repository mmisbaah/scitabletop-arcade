// Age groups. The youngest group gets simpler rules, bigger pictures and
// shorter sentences; the oldest gets the full games.

import { settings, saveSettings } from './storage.js';

export const AGES = {
    young: { label: 'Ages 5–7', name: 'Explorer', emoji: '🧒', blurb: 'Big pictures, simple rules, read-aloud help.' },
    middle: { label: 'Ages 8–11', name: 'Investigator', emoji: '🧑‍🎓', blurb: 'The real games, a little gentler.' },
    teen: { label: 'Ages 12+', name: 'Scientist', emoji: '🧑‍🔬', blurb: 'Full rules, tough CPUs, all the science.' },
};

export const ageGroup = () => (AGES[settings.age] ? settings.age : 'middle');
export const isYoung = () => ageGroup() === 'young';
export const byAge = (values) => values[ageGroup()] ?? values.middle;

// Pick the kid-friendly sentence for young players when there is one.
export const say = (fact, kidFact) => (isYoung() && kidFact ? kidFact : fact);

export function setAge(age) {
    settings.age = age;
    saveSettings();
}
