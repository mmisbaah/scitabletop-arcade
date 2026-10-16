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
