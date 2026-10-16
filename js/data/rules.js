// Hub cartridge cards and the rules shown in the modal for each game.
// Class names are written out in full so the Tailwind build can find them.

export const CARTRIDGES = [
    {
        key: 'chemistry', code: 'CHEM-01', tag: '1-PLAYER VS CPU', icon: 'flask-conical',
        style: { rule: 'border-emerald-800', code: 'text-emerald-400', tag: 'bg-emerald-950 text-emerald-400 border-emerald-500', title: 'text-emerald-300 neon-text-green', btn: 'bg-emerald-500 hover:bg-emerald-400' },
        title: 'ELEMENTAL ALCHEMY',
        blurb: 'Draw atom cards (H, O, C, N, Na, Cl) and combine them in the right ratios to build molecules. Reach 150 points before the CPU chemist does.',
    },
    {
        key: 'ecosystem', code: 'BIO-02', tag: 'ECO-SIMULATOR', icon: 'trees',
        style: { rule: 'border-amber-800', code: 'text-amber-400', tag: 'bg-amber-950 text-amber-400 border-amber-500', title: 'text-amber-300 neon-text-yellow', btn: 'bg-amber-500 hover:bg-amber-400' },
        title: 'ECOSYSTEM BUILDER',
        blurb: 'Run a habitat for 10 seasons. Producers feed herbivores, herbivores feed predators, and invasive Kudzu wants to eat the lot.',
    },
    {
        key: 'immune', code: 'IMM-03', tag: 'WAVE DEFENSE', icon: 'bug',
        style: { rule: 'border-rose-800', code: 'text-rose-400', tag: 'bg-rose-950 text-rose-400 border-rose-500', title: 'text-rose-300 neon-text-pink', btn: 'bg-rose-500 hover:bg-rose-400' },
        title: 'IMMUNE DEFENSE',
        blurb: 'Spend action points on Macrophages, T-Cells and B-Cells to stop viruses and bacteria before they reach the organ core.',
    },
    {
        key: 'quantum', code: 'PHY-04', tag: '2-PLAYER HOTSEAT', icon: 'atom',
        style: { rule: 'border-cyan-800', code: 'text-cyan-400', tag: 'bg-cyan-950 text-cyan-400 border-cyan-500', title: 'text-cyan-300 neon-text-cyan', btn: 'bg-cyan-500 hover:bg-cyan-400' },
        title: 'QUANTUM LEAP',
        blurb: 'Chess with superposition. Electrons can sit on two squares at once, and only collapse when a rival piece gets close enough to look.',
    },
];

export const RULES = {
    chemistry: {
        title: 'ELEMENTAL ALCHEMY RULES',
        lines: [
            'Click atoms in your hand to move them onto the Lab Bench. Click a bench atom to send it back.',
            'SYNTHESIZE when the bench matches a recipe exactly (H2O needs two H and one O, nothing else).',
            'Each successful synthesis, DRAW 2 or TRADE ends your turn, and the CPU then takes its own turn.',
            'TRADE: press TRADE, then click one card in your hand to swap it for a random atom.',
            'Hand limit is 12 atoms. First to 150 points wins.',
        ],
    },
    ecosystem: {
        title: 'ECOSYSTEM BUILDER RULES',
        lines: [
            'You get 2 plays per season: deploy a species from your hand, or click a tile to remove it.',
            'Plants make energy. Herbivores share 10% of it, predators share 10% of what herbivores ate. Each tier header shows food vs need: red means someone starves.',
            'Species differ: clover fertilises other plants, oaks survive fire, small herbivores breed when well fed, and each predator only eats certain prey (hover a tile to see).',
            'WOLF is the keystone: while one lives, plants make 15% more energy. Diversity of 60%+ adds stability each season and makes disease less likely to bite.',
            'Kudzu is inedible and smothers a plant each season. Burn seeds in your hand or they blow in. Random droughts, fires and diseases happen too.',
            'Survive 10 seasons with stability above 0. Score = stability + biodiversity.',
        ],
    },
    immune: {
        title: 'IMMUNE DEFENSE RULES',
        lines: [
            'You have 3 AP per turn. Pick an ability, then click a pathogen (or a zone for B-Cells).',
            'MACROPHAGE (1 AP): 1 damage, 2 vs bacteria. T-CELL (2 AP): destroys any virus. B-CELL (2 AP): 1 damage to every pathogen in one zone.',
            'END TURN: pathogens in the Organ Core breach and deal damage equal to their HP x10. Everyone else moves one zone deeper and a new wave arrives.',
            'Survive 5 waves and clear the tracks to win. Organ health at 0 means game over.',
        ],
    },
    quantum: {
        title: 'QUANTUM LEAP CHESS RULES',
        lines: [
            'Cyan moves first. Click a piece, then click a highlighted square.',
            'ATOM moves 1 square any direction. PHOTON slides any distance in a straight line.',
            'ELECTRON jumps to any square within 2. Pick two different empty squares to put it in SUPERPOSITION, or the same square twice for a normal move.',
            'A superposed electron collapses to one square (50/50) the moment a rival piece ends next to it, or when it is attacked. Attack the wrong square and it was never there.',
            'Science note: in real physics any interaction that reveals where a particle is causes collapse, not just a neighbour. Adjacency is a simplification so the board stays readable.',
            'Capture the rival ATOM to win.',
        ],
    },
};
