# SciTabletop Arcade 🕹️

Four retro 8-bit science strategy games in one arcade cabinet. Plain HTML, CSS and JavaScript modules. No framework, no bundler.

| Cartridge | Science | Mode |
|---|---|---|
| **Elemental Alchemy** | Chemistry: valence and bonding. Build molecules from atoms, fight the CPU over a shared atom market, race to discover each molecule first | 1 player vs CPU |
| **Ecosystem Builder** | Ecology: the 10% energy rule, keystone species, biodiversity. Keep a food web alive through droughts, fires, disease and invasive Kudzu | Solo sim |
| **Immune Defense** | Immunology: innate vs adaptive immunity and immune memory. Stop viruses and bacteria before they multiply | Solo wave defense |
| **Quantum Leap Chess** | Physics: superposition, measurement, photon absorption and emission | vs CPU or 2-player hotseat |

What every game has:
- **Lab Notes**: a science fact for whatever just happened
- **End screen**: your score, personal best, stats, and every fact you met that round
- **Easy / Normal / Hard** (header toggle; it applies the next time a game resets)
- **Best scores** on the hub
- A **How to play** popup the first time you open each game

Settings and best scores are saved in the browser's localStorage.

## Project layout

```
index.html                  page shell and the markup for every screen
css/
  styles.css                arcade look: CRT scanlines, pixel buttons, board tiles
  tailwind.src.css          Tailwind entry point (compiled to css/tailwind.css)
js/
  main.js                   router, settings, end screen, click delegation
  core/
    audio.js                Web Audio chiptune sound effects
    ui.js                   toast, logs, meters, inline icon renderer
    icons.js                the 14 Lucide icons used (generated)
    storage.js              localStorage settings and best scores
    difficulty.js           Easy/Normal/Hard lookup
    facts.js                Lab Notes and the "what you learned" list
    endscreen.js            results screen
  data/
    rules.js                hub cards and rules text
    chemistry-data.js       recipes, valence, atom facts, deck
    species.js              ecosystem species, events, tuning
    pathogens.js            pathogens, waves, abilities, memory facts
    quantum-data.js         quantum facts
  games/
    chemistry.js            Elemental Alchemy
    ecosystem.js            Ecosystem Builder
    immune.js               Immune Defense
    quantum.js              Quantum Leap Chess UI
    quantum-engine.js       Quantum chess rules and CPU (no DOM)
scripts/build-icons.mjs     regenerates js/core/icons.js from the lucide package
```

Each game module exports `init()`, `handle(action, arg, el)` and `setGameOverHandler(fn)`. Buttons declare what they do with `data-action="game:verb"` and `main.js` routes the click, so there are no inline `onclick` handlers.

## Run locally

ES modules need a web server (opening the file directly won't work):

```bash
npm install
npm run build      # compiles css/tailwind.css
npm run serve      # http://localhost:8000
```

`npm run watch:css` rebuilds Tailwind as you edit. `npm run build:icons` regenerates `js/core/icons.js` if you add an icon name to `scripts/build-icons.mjs`.

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`, which builds the CSS and publishes the site to GitHub Pages. One-time setup: in the repo go to **Settings → Pages** and set **Source** to **GitHub Actions**.
