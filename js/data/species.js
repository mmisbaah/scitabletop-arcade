// Species cards for Ecosystem Builder. `tier` decides which column they live in.

export const SPECIES = {
    'MEADOW GRASS': { tier: 'producer', icon: '"' },
    'BERRIES':      { tier: 'producer', icon: '*' },
    'CLOVER':       { tier: 'producer', icon: '%' },
    'OAK SAPLING':  { tier: 'producer', icon: '^' },
    'FIELD MOUSE':  { tier: 'herbivore', icon: 'm' },
    'RABBIT':       { tier: 'herbivore', icon: 'r' },
    'DEER':         { tier: 'herbivore', icon: 'd' },
    'GRASSHOPPER':  { tier: 'herbivore', icon: 'g' },
    'RED FOX':      { tier: 'predator', icon: 'F' },
    'OWL':          { tier: 'predator', icon: 'O' },
    'HAWK':         { tier: 'predator', icon: 'H' },
    'WOLF':         { tier: 'predator', icon: 'W', keystone: true },
    'KUDZU':        { tier: 'producer', icon: '#', invasive: true },
};

// Draw weights for the reserve hand. Kudzu sneaks in now and then.
export const DRAW_WEIGHTS = {
    'MEADOW GRASS': 3, 'BERRIES': 3, 'CLOVER': 3, 'OAK SAPLING': 2,
    'FIELD MOUSE': 2, 'RABBIT': 2, 'DEER': 1, 'GRASSHOPPER': 2,
    'RED FOX': 1, 'OWL': 1, 'HAWK': 1, 'WOLF': 1,
    'KUDZU': 2,
};

export const ECO_CONFIG = {
    seasons: 10,
    playsPerSeason: 2,
    handLimit: 5,
    startStability: 60,
    startBoard: {
        producer: ['MEADOW GRASS', 'BERRIES', 'CLOVER', 'OAK SAPLING'],
        herbivore: ['FIELD MOUSE', 'RABBIT'],
        predator: [],
    },
    startHand: ['RED FOX', 'DEER', 'WOLF', 'KUDZU'],
    wildInvasionChance: 0.12,
    kudzuSpreadChance: 0.5,
    kudzuMax: 4,
};
