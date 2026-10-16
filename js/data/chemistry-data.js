// Molecules the players can build, and the weighted atom deck they draw from.

export const RECIPES = [
    { name: 'HYDROGEN GAS',   formula: 'H2',   atoms: { H: 2 },              pts: 10 },
    { name: 'OXYGEN GAS',     formula: 'O2',   atoms: { O: 2 },              pts: 15 },
    { name: 'NITROGEN GAS',   formula: 'N2',   atoms: { N: 2 },              pts: 20 },
    { name: 'HYDROGEN CHLORIDE', formula: 'HCl', atoms: { H: 1, Cl: 1 },     pts: 25 },
    { name: 'WATER',          formula: 'H2O',  atoms: { H: 2, O: 1 },        pts: 30 },
    { name: 'TABLE SALT',     formula: 'NaCl', atoms: { Na: 1, Cl: 1 },      pts: 35 },
    { name: 'CARBON DIOXIDE', formula: 'CO2',  atoms: { C: 1, O: 2 },        pts: 40 },
    { name: 'SODIUM HYDROXIDE', formula: 'NaOH', atoms: { Na: 1, O: 1, H: 1 }, pts: 40 },
    { name: 'AMMONIA',        formula: 'NH3',  atoms: { N: 1, H: 3 },        pts: 45 },
    { name: 'METHANE',        formula: 'CH4',  atoms: { C: 1, H: 4 },        pts: 50 },
];

// Hydrogen shows up most, like in the real universe.
export const ATOM_WEIGHTS = { H: 6, O: 4, C: 2, N: 2, Na: 2, Cl: 2 };

export const ATOM_COLORS = {
    H:  'border-sky-400 text-sky-200',
    O:  'border-rose-400 text-rose-200',
    C:  'border-slate-300 text-slate-100',
    N:  'border-indigo-400 text-indigo-200',
    Na: 'border-amber-400 text-amber-200',
    Cl: 'border-lime-400 text-lime-200',
};

export const WIN_SCORE = 150;
export const HAND_LIMIT = 12;
export const START_HAND = 7;
