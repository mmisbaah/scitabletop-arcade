// Species cards for Ecosystem Builder.
//
// Producers make `energy` each season. Only about 10% of the energy in one
// level reaches the next, so herbivores share 10% of producer energy and
// predators share 10% of what the herbivores actually ate. `need` is how much
// each animal must get to survive.

export const SPECIES = {
    'MEADOW GRASS': { tier: 'producer', icon: '🌾', energy: 600,
        kid: 'Grass grows back after animals nibble it, like your hair after a haircut.',
        fact: 'Grasses grow from the base, not the tip, so they bounce back after grazing. That is why lawns survive mowing.' },
    'CLOVER': { tier: 'producer', icon: '🍀', energy: 500, fertilizes: 0.1,
        kid: 'Clover makes the soil better, so the plants next to it grow bigger.',
        fact: 'Clover hosts bacteria in its roots that pull nitrogen out of the air and turn it into fertiliser. Every other plant here grows 10% better.' },
    'BERRIES': { tier: 'producer', icon: '🍓', energy: 500,
        kid: 'Animals eat berries and carry the seeds far away. That is how new bushes grow.',
        fact: 'Berry bushes trade fruit for transport: animals eat the berries and drop the seeds far away, with a little fertiliser.' },
    'OAK SAPLING': { tier: 'producer', icon: '🌳', energy: 800, fireproof: true,
        kid: 'Oak trees have thick bark, like a coat, so fire often can\'t hurt them.',
        fact: 'Oaks have thick, corky bark. Many survive grass fires that kill smaller plants around them.' },

    'GRASSHOPPER': { tier: 'herbivore', icon: '🦗', need: 30, breed: 0.3,
        kid: 'Grasshoppers lay lots of eggs, so there can be many of them very fast.',
        fact: 'Grasshoppers lay dozens of eggs at a time. With plenty of food their numbers can explode in a single season.' },
    'FIELD MOUSE': { tier: 'herbivore', icon: '🐭', need: 50, breed: 0.2,
        kid: 'Mice have lots of babies. Owls, hawks and foxes love to eat them.',
        fact: 'A field mouse can have a litter every 3 to 4 weeks. Small, fast-breeding prey keeps many predators fed.' },
    'RABBIT': { tier: 'herbivore', icon: '🐇', need: 80, breed: 0.15,
        kid: 'Rabbits munch grass all day. Their big ears listen for foxes.',
        fact: 'Rabbits eat their own droppings once to digest tough plants twice. It gets more energy out of the same grass.' },
    'DEER': { tier: 'herbivore', icon: '🦌', need: 150, breed: 0,
        kid: 'Deer eat lots of plants. Without wolves, they can eat a whole forest!',
        fact: 'A deer eats a lot of plant energy. Without predators, deer strip young trees bare and whole forests stop regrowing.' },

    'OWL': { tier: 'predator', icon: '🦉', need: 6, diet: ['FIELD MOUSE', 'GRASSHOPPER'],
        kid: 'Owls hunt at night and can turn their heads almost all the way round.',
        fact: 'Owls swallow mice whole and cough up pellets of fur and bone. Scientists pick pellets apart to see what lives in an area.' },
    'HAWK': { tier: 'predator', icon: '🦅', need: 8, diet: ['FIELD MOUSE', 'RABBIT'],
        kid: 'Hawks can see a mouse from very high up in the sky.',
        fact: 'A hawk can spot a mouse from about 30 metres up. Its eyes have up to five times more light sensors per area than ours.' },
    'RED FOX': { tier: 'predator', icon: '🦊', need: 10, diet: ['FIELD MOUSE', 'RABBIT', 'GRASSHOPPER'],
        kid: 'Foxes eat almost anything: mice, rabbits, bugs and even berries.',
        fact: 'Foxes are generalists: they eat mice, rabbits, insects and even fruit. Generalists survive when one food source crashes.' },
    'WOLF': { tier: 'predator', icon: '🐺', need: 15, diet: ['DEER', 'RABBIT'], keystone: true,
        kid: 'Wolves keep deer moving, so trees and plants get a chance to grow.',
        fact: 'Keystone species: when wolves returned to Yellowstone in 1995, elk stopped overgrazing riverbanks and trees grew back. Here, wolves boost plant energy 15%.' },

    'KUDZU': { tier: 'producer', icon: '🌿', energy: 0, invasive: true,
        kid: 'Kudzu is a sneaky vine that grows over other plants. No animal here eats it.',
        fact: 'Kudzu, the "vine that ate the South", can grow 30 cm a day. Nothing native eats it, so it smothers the plants that animals rely on.' },
};

// Draw weights for the reserve hand. Kudzu sneaks in now and then.
export const DRAW_WEIGHTS = {
    'MEADOW GRASS': 3, 'CLOVER': 3, 'BERRIES': 3, 'OAK SAPLING': 2,
    'GRASSHOPPER': 2, 'FIELD MOUSE': 2, 'RABBIT': 2, 'DEER': 1,
    'OWL': 1, 'HAWK': 1, 'RED FOX': 1, 'WOLF': 1,
    'KUDZU': 2,
};

export const EVENTS = {
    drought: { name: 'DROUGHT', fact: 'Drought: plants close their pores to save water, which also stops them taking in CO2. Less photosynthesis means less energy for everyone above.' },
    disease: { name: 'DISEASE', fact: 'Disease spreads fastest through many identical hosts. Farms that plant one crop (monocultures) are hit hardest; mixed habitats slow it down.' },
    wildfire: { name: 'WILDFIRE', fact: 'Wildfire clears old growth and returns nutrients to the soil. Fire-adapted plants like oaks survive and recover first.' },
};

export const ECO_KID = {
    intro: 'Plants make food from sunshine. Animals eat plants, and bigger animals eat them. Keep everyone fed!',
    starve: 'Uh oh! There was not enough food, so an animal went hungry. Add more plants or prey.',
    overgraze: 'With no hunters around, the plant-eaters ate too many plants.',
    diversity: 'Lots of different plants and animals make a strong, healthy home.',
    noPrey: 'This hunter had nothing it likes to eat, so it went away.',
};

export const ECO_FACTS = {
    intro: 'The 10% rule: only about a tenth of the energy at one level of a food web reaches the next. That is why there are far fewer foxes than mice.',
    starve: 'Carrying capacity: an area can only feed so many animals. Past that point, some starve or move away.',
    overgraze: 'Trophic cascade: with no predators, herbivores multiply and eat plants faster than they regrow.',
    diversity: 'Diverse ecosystems are more stable: if one species crashes, predators have other prey to switch to.',
    noPrey: 'Specialists are fragile: a predator whose prey is gone has nothing else to eat.',
};

export const SEASON_NAMES = ['Spring', 'Summer', 'Autumn', 'Winter'];

// Per age group: Explorers get a short, calm game with no invasive plants or disasters.
export const AGE_TUNING = {
    young: { seasons: 6, startStability: 70, events: 0, invasion: 0, noKudzu: true, startHand: ['OWL', 'DEER', 'CLOVER', 'RABBIT'] },
    middle: { seasons: 8, eventScale: 0.7 },
    teen: {},
};

export const ECO_CONFIG = {
    seasons: 10,
    playsPerSeason: 2,
    handLimit: 5,
    startStability: 50,
    startBoard: {
        producer: ['MEADOW GRASS', 'BERRIES', 'CLOVER', 'OAK SAPLING'],
        herbivore: ['FIELD MOUSE', 'RABBIT'],
        predator: [],
    },
    startHand: ['OWL', 'DEER', 'WOLF', 'KUDZU'],
    transfer: 0.1,          // the 10% rule
    wolfBoost: 0.15,        // trophic cascade bonus to producer energy
    herbivoreCap: 8,
    kudzuSpreadChance: 0.5,
    kudzuMax: 4,
    diverseThreshold: 60,   // diversity % that earns the stability bonus
};
