// Molecules the players can build, and the weighted atom deck they draw from.

export const RECIPES = [
    { name: 'HYDROGEN GAS', formula: 'H2', atoms: { H: 2 }, pts: 10,
      fact: 'H2: each hydrogen has 1 electron to share. Two H atoms share one pair, a single covalent bond. It is the lightest gas there is.' },
    { name: 'OXYGEN GAS', formula: 'O2', atoms: { O: 2 }, pts: 15,
      fact: 'O2: oxygen needs 2 more electrons, so two O atoms share two pairs, a double bond (O=O). About 21% of the air you breathe.' },
    { name: 'NITROGEN GAS', formula: 'N2', atoms: { N: 2 }, pts: 20,
      fact: 'N2: two nitrogens share three pairs, a triple bond and one of the strongest in chemistry. That is why 78% of air is N2 and it barely reacts.' },
    { name: 'HYDROGEN CHLORIDE', formula: 'HCl', atoms: { H: 1, Cl: 1 }, pts: 25,
      fact: 'HCl: H has 1 bond to give and Cl needs exactly 1. Dissolved in water it becomes hydrochloric acid, the acid in your stomach.' },
    { name: 'WATER', formula: 'H2O', atoms: { H: 2, O: 1 }, pts: 30,
      fact: 'H2O: oxygen has 2 open bonds and each H fills one, so water is H2O, never HO or H3O. Its bent shape makes it polar, great at dissolving things.' },
    { name: 'TABLE SALT', formula: 'NaCl', atoms: { Na: 1, Cl: 1 }, pts: 35,
      fact: 'NaCl: nothing is shared here. Na hands its 1 outer electron to Cl, making Na+ and Cl- ions that cling together. That is an ionic bond.' },
    { name: 'CARBON DIOXIDE', formula: 'CO2', atoms: { C: 1, O: 2 }, pts: 40,
      fact: 'CO2: carbon makes 4 bonds. Two double bonds to oxygen use all 4 (O=C=O). Plants pull CO2 out of the air to build sugar.' },
    { name: 'SODIUM HYDROXIDE', formula: 'NaOH', atoms: { Na: 1, O: 1, H: 1 }, pts: 40,
      fact: 'NaOH: O bonds to H, leaving one spare bond. Na gives that spot an electron, making Na+ and OH- ions. NaOH is lye, used to make soap.' },
    { name: 'AMMONIA', formula: 'NH3', atoms: { N: 1, H: 3 }, pts: 45,
      fact: 'NH3: nitrogen makes 3 bonds, one to each H. Ammonia from the Haber process feeds fertiliser for roughly half the food grown on Earth.' },
    { name: 'METHANE', formula: 'CH4', atoms: { C: 1, H: 4 }, pts: 50,
      fact: 'CH4: carbon\'s 4 bonds each grab one H. Methane is natural gas, and over 20 years it traps about 80 times more heat than CO2.' },
];

// How many bonds each atom usually forms. Na and Cl bond by giving or taking one electron.
export const VALENCE = { H: 1, O: 2, C: 4, N: 3, Na: 1, Cl: 1 };

export const ATOM_FACTS = {
    H: 'Hydrogen (valence 1): one electron, one bond. About 9 in every 10 atoms in the universe are hydrogen.',
    O: 'Oxygen (valence 2): it wants 2 more electrons, so it always makes 2 bonds, or one double bond.',
    C: 'Carbon (valence 4): four bonds lets it build chains and rings. Every living thing is built around carbon.',
    N: 'Nitrogen (valence 3): three bonds. It is in every protein and every strand of DNA.',
    Na: 'Sodium (valence 1): a soft metal that gives its single outer electron away very easily. It fizzes violently in water.',
    Cl: 'Chlorine (valence 1): one electron short of a full shell, so it grabs one from whoever is nearby.',
};

// Hydrogen shows up most, like in the real universe.
export const ATOM_WEIGHTS = { H: 6, O: 4, C: 2, N: 2, Na: 2, Cl: 2 };


export const WIN_SCORE = 150;
export const HAND_LIMIT = 12;
export const START_HAND = 7;
export const MARKET_SIZE = 5;
export const DISCOVERY_BONUS = 10;
export const DISCOVERY_FACT = 'First discovery: real chemists race too. Joseph Priestley and Carl Scheele both isolated oxygen in the 1770s, and historians still argue about who got there first.';
export const ATOMIC_NUMBER = { H: 1, C: 6, N: 7, O: 8, Na: 11, Cl: 17 };

// ---------- Explorers (ages 5-7) ----------
// "Hands" stand in for bonds: H has 1 hand, O has 2, N has 3, C has 4.

export const KID_RECIPES = {
    H2: { emoji: '🎈', name: 'Hydrogen gas', kid: 'Two hydrogen atoms hold hands. This gas is so light that balloons filled with it float away!' },
    O2: { emoji: '🫁', name: 'Oxygen', kid: 'Two oxygen atoms hold on with both hands. This is the oxygen you breathe in right now!' },
    N2: { emoji: '🌬️', name: 'Nitrogen', kid: 'Two nitrogen atoms hold on with three hands each. Most of the air around you is nitrogen.' },
    HCl: { emoji: '🧪', name: 'Stomach acid', kid: 'Hydrogen and chlorine join up. Your tummy uses a watery version of this to break down food.' },
    H2O: { emoji: '💧', name: 'Water', kid: 'One oxygen holds hands with two hydrogens. That makes water! More than half of you is water.' },
    NaCl: { emoji: '🧂', name: 'Salt', kid: 'Sodium and chlorine stick together like magnets. That is the salt on your food!' },
    CO2: { emoji: '🌳', name: 'Carbon dioxide', kid: 'One carbon holds two oxygens. You breathe this out, and trees breathe it in.' },
    NaOH: { emoji: '🧼', name: 'Soap maker', kid: 'Sodium, oxygen and hydrogen together make lye. People use it to make soap.' },
    NH3: { emoji: '🌾', name: 'Ammonia', kid: 'One nitrogen holds three hydrogens. Farmers use it to help crops grow. It smells very strong!' },
    CH4: { emoji: '🔥', name: 'Methane', kid: 'One carbon holds four hydrogens. Some stoves burn this gas to cook. Cows burp it too!' },
};

export const KID_ATOMS = {
    H: 'Hydrogen is the smallest atom of all. It has 1 hand to hold.',
    O: 'Oxygen has 2 hands to hold other atoms.',
    C: 'Carbon has 4 hands! It is in every living thing, even you.',
    N: 'Nitrogen has 3 hands to hold.',
    Na: 'Sodium has 1 hand. On its own it fizzes in water!',
    Cl: 'Chlorine has 1 hand. It is in salt and in swimming pools.',
};

// Molecules young players build, easiest first.
export const KID_ORDER = ['H2', 'H2O', 'O2', 'NaCl', 'CO2', 'HCl', 'CH4', 'NH3'];
export const KID_ROUNDS = 6;
