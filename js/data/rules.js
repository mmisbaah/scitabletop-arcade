// Hub cartridge cards and the rules shown in the modal for each game.

export const CARTRIDGES = [
    {
        key: 'chemistry', tab: 'Alchemy', theme: 'theme-chem', icon: 'flask-conical', art: 'molecule',
        title: 'Elemental Alchemy', subject: 'Chemistry', mode: 'vs CPU',
        blurb: 'Combine atoms in the right ratios to build molecules. Fight the CPU over a shared atom market.',
    },
    {
        key: 'ecosystem', tab: 'Ecosystem', theme: 'theme-eco', icon: 'trees', art: 'pyramid',
        title: 'Ecosystem Builder', subject: 'Ecology', mode: 'Solo',
        blurb: 'Run a habitat for 10 seasons. Feed every level of the food web and keep invasive Kudzu out.',
    },
    {
        key: 'immune', tab: 'Immune', theme: 'theme-imm', icon: 'bug', art: 'antibody',
        title: 'Immune Defense', subject: 'Immunology', mode: 'Solo',
        blurb: 'Command macrophages, T-cells and B-cells against waves of viruses and bacteria.',
    },
    {
        key: 'quantum', tab: 'Quantum', theme: 'theme-qtm', icon: 'atom', art: 'board',
        title: 'Quantum Leap Chess', subject: 'Physics', mode: 'vs CPU or friend',
        blurb: 'Chess where electrons sit on two squares at once and collapse when a rival gets close.',
    },
];

// Shorter names, blurbs and rules for Explorers (ages 5-7).
export const KID_CARTRIDGES = {
    chemistry: { title: 'Molecule Match', blurb: 'Copy the picture! Tap atoms to build water, salt and more.' },
    ecosystem: { title: 'Feed the Forest', blurb: 'Add plants and animals and keep everyone happy and fed.' },
    immune: { title: 'Germ Busters', blurb: 'Tap the germs before they get in. Your helper cells do the rest!' },
    quantum: { title: 'Quantum Hop', blurb: 'A chess game where your pieces can be in two places at once.' },
};

export const KID_RULES = {
    chemistry: [
        'Look at the picture of the molecule at the top.',
        'Tap the atoms that match the picture. The empty circles show what you still need.',
        'Fill every circle to make the molecule. Make 6 molecules to finish!',
    ],
    ecosystem: [
        'Tap an animal or plant card to add it to the forest. You get 2 each season.',
        'Plants feed plant-eaters. Plant-eaters feed hunters. A sad face means someone is hungry.',
        'Press Next season. Keep the forest happy for 6 seasons!',
    ],
    immune: [
        'Germs come in from the left. Tap a germ to send a helper after it.',
        'Each helper uses an energy dot. Press End turn to get your dots back.',
        'Stop the germs before they reach the heart. Get through 3 waves!',
    ],
    quantum: [
        'You are blue. Tap one of your pieces, then tap a dot to move it.',
        'Stuck? Press Hint and the game will show you a good move.',
        'Catch the pink A piece to win!',
    ],
};

export const RULES = {
    chemistry: {
        title: 'ELEMENTAL ALCHEMY RULES',
        lines: [
            'Tap an atom in your hand, or drag it, to put it on the bench. Tap a bench atom to send it back.',
            'Press Synthesize when the bench matches a recipe exactly. The dots on each atom show its valence: H2O works because O makes 2 bonds and each H makes 1.',
            'Your turn is ONE of: synthesize, take 2 atoms of your choice from the shared market, draw 2 random atoms, or trade a card. Then the CPU plays.',
            'The market is shared. The CPU takes from it too. On Hard it grabs the atom you are waiting for and gets a bonus atom each turn.',
            'The first player to make each molecule earns a +10 discovery bonus. Hand limit is 12 atoms. First to 150 points wins.',
        ],
    },
    ecosystem: {
        title: 'ECOSYSTEM BUILDER RULES',
        lines: [
            'You get 2 plays per season: release a species from your reserve, or tap a tile to remove it.',
            'Plants make energy. Herbivores share 10% of it, predators share 10% of what herbivores ate. Each tier header shows food vs need: red means someone starves.',
            'Species differ: clover fertilises other plants, oaks survive fire, small herbivores breed when well fed, and each predator only eats certain prey (hover a tile to see).',
            'The wolf is the keystone: while one lives, plants make 15% more energy. Diversity of 60%+ adds stability each season and makes disease less likely to bite.',
            'Kudzu is inedible and smothers a plant each season. Burn seeds in your hand or they blow in. Random droughts, fires and diseases happen too.',
            'Survive 10 seasons with stability above 0. Score = stability + biodiversity.',
        ],
    },
    immune: {
        title: 'IMMUNE DEFENSE RULES',
        lines: [
            'You get 3 action points per turn (4 on Easy). Pick an immune cell, then tap a pathogen, or a lane for B-cells.',
            'Macrophage (1 AP): 1 damage, 2 against bacteria. T-cell (2 AP): destroys any virus. B-cell (2 AP): 1 damage to every pathogen in one lane.',
            'End turn: pathogens in the Organ Core breach and deal damage equal to their HP x10. Everyone else moves one zone deeper and a new wave arrives.',
            'Pathogens that get into the tissue or core can multiply: bacteria divide and viruses replicate. Stop them early.',
            'Memory: a pathogen type you finish off with a T-cell or B-cell is remembered. Remembered pathogens arrive with 1 less HP, and Macrophages do +1 damage to them. Macrophage kills teach nothing.',
            'Survive 5 waves and clear the tracks to win. Organ health at 0 means game over.',
        ],
    },
    quantum: {
        title: 'QUANTUM LEAP CHESS RULES',
        lines: [
            'You are Cyan and move first. Play the CPU (Rose), or use the mode button to play a friend on one device. Undo takes back your last move.',
            'Tap a piece, then a highlighted square. Atom moves 1 square. Photon slides in a straight line. Electron jumps to any square within 2.',
            'Superposition: move an electron to two different empty squares and it sits on both, or tap the same square twice for a normal move.',
            'A superposed electron collapses to one square (50/50) when a rival piece ends next to it or attacks it. Attack the wrong square and it was never there.',
            'Absorption: slide a photon onto your own Atom. The Atom becomes excited: its next move can reach 2 squares, and it re-emits the photon on the square it leaves.',
            'Science note: in real physics any interaction that reveals where a particle is causes collapse, not just a neighbour. Adjacency is a simplification so the board stays readable.',
            'Capture the rival Atom to win.',
        ],
    },
};
