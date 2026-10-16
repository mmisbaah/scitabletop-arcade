// Pathogens and immune cell abilities for Immune Defense.

export const PATHOGENS = {
    RHINOVIRUS: { kind: 'virus', hp: 1,
        fact: 'Rhinovirus causes most common colds. Viruses are not alive on their own: they hijack your cells to copy themselves, so antibiotics do nothing to them.' },
    INFLUENZA: { kind: 'virus', hp: 2,
        fact: 'Influenza changes its surface proteins a little every year (antigenic drift). That is why the flu vaccine is updated every season.' },
    'E. COLI': { kind: 'bacteria', hp: 2,
        fact: 'Most E. coli strains live harmlessly in your gut. A few make toxins. Bacteria are whole living cells, which is why antibiotics can kill them.' },
    STREP: { kind: 'bacteria', hp: 3,
        fact: 'Streptococcus causes strep throat. Left untreated it can trigger rheumatic fever, which is why doctors swab sore throats.' },
    SALMONELLA: { kind: 'bacteria', hp: 3,
        fact: 'Salmonella spreads through undercooked food, and it can survive inside macrophages, the very cells sent to eat it.' },
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
    macrophage: { label: 'MACROPHAGE', cost: 1, hint: '1 DMG, 2 VS BACTERIA', target: 'pathogen', color: 'bg-rose-900 hover:bg-rose-800',
        fact: 'Macrophages belong to the innate immune system: fast, generic, and they swallow anything that looks foreign (phagocytosis). Bacteria are big enough to eat whole.' },
    tcell: { label: 'T-CELL', cost: 2, hint: 'DESTROY A VIRUS', target: 'virus', color: 'bg-emerald-900 hover:bg-emerald-800',
        fact: 'Killer T-cells inspect your own cells for signs of viral infection and destroy the infected ones, so the virus has nowhere to copy itself.' },
    bcell: { label: 'B-CELL', cost: 2, hint: '1 DMG TO A WHOLE ZONE', target: 'zone', color: 'bg-indigo-900 hover:bg-indigo-800',
        fact: 'B-cells pour out antibodies: Y-shaped proteins that lock onto one specific pathogen and tag it for destruction. An activated B-cell (a plasma cell) can release about 2,000 a second.' },
};

export const BREACH_FACT = 'When pathogens get past the first defences you get inflammation: swelling, heat and fever. Many germs reproduce more slowly at higher temperatures.';

export const MEMORY_FACTS = {
    learned: 'Immune memory: after T-cells or B-cells beat a pathogen, some stay behind as memory cells. Next time that pathogen shows up, they react in hours instead of days.',
    tagged: 'Opsonisation: antibodies coat a pathogen your body remembers, which makes it far easier for macrophages to grab and swallow.',
    innate: 'Macrophages are innate immunity: they fight anything, but they do not learn. Only the adaptive system (T-cells and B-cells) builds memory.',
    fission: 'Binary fission: a bacterium copies its DNA and splits in two. In good conditions E. coli can do it every 20 minutes.',
    replicate: 'Viral replication: a virus injects its genes into one of your cells, which then builds hundreds of new viruses and bursts.',
    vaccine: 'This is how vaccines work: they show your immune system a harmless piece of a pathogen so memory cells are ready before the real thing arrives.',
};

export const IMMUNE_CONFIG = {
    apPerTurn: { easy: 4, normal: 3, hard: 3 },
    breachDamagePerHp: { easy: 8, normal: 10, hard: 15 },
    // Chance per turn that a pathogen already inside the body copies itself.
    growthChance: { easy: 0.2, normal: 0.35, hard: 0.6 },
    zoneCap: 6,
};
