// Pathogens and immune cell abilities for Immune Defense.

export const PATHOGENS = {
    RHINOVIRUS:  { kind: 'virus',    hp: 1 },
    INFLUENZA:   { kind: 'virus',    hp: 2 },
    'E. COLI':   { kind: 'bacteria', hp: 2 },
    STREP:       { kind: 'bacteria', hp: 3 },
    SALMONELLA:  { kind: 'bacteria', hp: 3 },
};

// Each wave lists who enters the bloodstream.
export const WAVES = [
    ['RHINOVIRUS', 'E. COLI'],
    ['INFLUENZA', 'RHINOVIRUS', 'E. COLI'],
    ['STREP', 'INFLUENZA', 'RHINOVIRUS'],
    ['SALMONELLA', 'INFLUENZA', 'E. COLI', 'RHINOVIRUS'],
    ['STREP', 'SALMONELLA', 'INFLUENZA', 'INFLUENZA'],
];

export const ABILITIES = {
    macrophage: { label: 'MACROPHAGE', cost: 1, hint: '1 DMG, 2 VS BACTERIA', target: 'pathogen', color: 'bg-rose-900 hover:bg-rose-800' },
    tcell:      { label: 'T-CELL',     cost: 2, hint: 'DESTROY A VIRUS',      target: 'virus',    color: 'bg-emerald-900 hover:bg-emerald-800' },
    bcell:      { label: 'B-CELL',     cost: 2, hint: '1 DMG TO A WHOLE ZONE', target: 'zone',     color: 'bg-indigo-900 hover:bg-indigo-800' },
};

export const IMMUNE_CONFIG = {
    apPerTurn: 3,
    breachDamagePerHp: 10,
};
