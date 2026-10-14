# AGENTS.md

## Project

Static HTML5 Canvas clone of Asteroids (Spanish-language repo). No build system, no dependencies, no tests, no lint — don't invent npm commands or add tooling unless asked. All logic lives in a single `game.js`, loaded by `index.html` via a plain `<script>` tag.

## Running / verifying

No automated checks exist. Verify changes manually: open `index.html` in a browser, or `npx serve .` then visit `http://localhost:3000`.

## Gotchas

- Canvas size is declared in two places that must stay in sync: the `<canvas width/height>` attributes in `index.html` and the `W`/`H` constants in `game.js` (800×600).
- Two input mechanisms: `keys[code]` for held state (rotate/thrust) and `pressed(code)` for single-fire actions (shoot, restart) — `pressed` is consume-on-read via `justPressed`. Any new key that would scroll the page must also be added to the hardcoded `preventDefault` array in the `keydown` listener.
- Input uses `e.code` values (`'ArrowLeft'`, `'Space'`), not `e.key`.
- Space is toroidal: all positional updates must go through `wrap()`.
- Implemented extras beyond the base game (trust `game.js` over the README when they conflict): speed power-up (drop from destroyed asteroids, doubled thrust for 5 s), "estrella fugaz" fast golden asteroid (destroying it grants 5 s of triple shot via `ship.tripleShot`), a skin system (`KeyC` cycles 5 ship skins stored in `SKINS`, persisted in `localStorage`; skins may set `scale`/`scoreMult` — the purple "Titán" is 2× the size of the original and doubles all points via `addScore()`/`skinScale()`), an ovni that spawns every 12-20 s and shoots red `EnemyBullet`s into the separate `enemyBullets` array, and a shield (`ShiftLeft`/`ShiftRight`, 3 s active / 10 s cooldown) that blocks all ship damage while active.

## Conventions

- Comments, HUD text, and README are in Spanish — keep new strings and comments in Spanish.
- Asteroid `size` 1/2/3 (small/medium/large) indexes into the `RADII`/`SPEEDS`/`POINTS` lookup tables; larger sizes are worth fewer points.
- All updates are time-based (`dt` in seconds, clamped to 0.05 in the main loop).
