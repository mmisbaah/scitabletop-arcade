# SciTabletop Arcade 🕹️

Four retro 8-bit science strategy games in one arcade cabinet. Plain HTML, CSS and JavaScript modules. No framework, no bundler.

| Cartridge | Science | Mode |
|---|---|---|
| **Elemental Alchemy** | Chemistry: build molecules from atoms in the right ratios | 1 player vs CPU |
| **Ecosystem Builder** | Ecology: keep a 3-tier food web stable for 10 seasons | Solo sim |
| **Immune Defense** | Immunology: stop viruses and bacteria with Macrophages, T-Cells and B-Cells | Solo wave defense |
| **Quantum Leap Chess** | Physics: chess where electrons sit in superposition until observed | 2 player hotseat |

Rules for each game are in the in-game **RULES** button.

## Project layout

```
index.html              page shell and the markup for every screen
css/
  styles.css            arcade look: CRT scanlines, pixel buttons, board tiles
  tailwind.src.css      Tailwind entry point
  tailwind.css          compiled Tailwind (generated, committed)
js/
  main.js               router, global toggles, click delegation
  core/
    audio.js            Web Audio chiptune sound effects
    ui.js               toast, logs, meters, small helpers
  data/
    rules.js            hub cards + rules text
    chemistry-data.js   recipes and atom deck
    species.js          ecosystem species and tuning
    pathogens.js        pathogens, waves and immune abilities
  games/
    chemistry.js        Elemental Alchemy engine
    ecosystem.js        Ecosystem Builder engine
    immune.js           Immune Defense engine
    quantum.js          Quantum Leap Chess engine
vendor/lucide.min.js    icon library (copied from npm)
```

Each game module exports `init()` and `handle(action, arg, el)`. Buttons declare what they do with `data-action="game:verb"` and `main.js` routes the click, so there are no inline `onclick` handlers.

## Run locally

ES modules need a web server (opening the file directly won't work):

```bash
npm install        # only needed if you change Tailwind classes
npm run build      # rebuild css/tailwind.css and vendor/lucide.min.js
npm run serve      # http://localhost:8000
```

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`, which builds the CSS and publishes the site to GitHub Pages. In the repo go to **Settings → Pages** and set **Source** to **GitHub Actions** once.
