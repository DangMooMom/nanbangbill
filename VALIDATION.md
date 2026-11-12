# Heatwise validation

How to validate a change, and the latest result. Specification: [SPEC.md](SPEC.md).

## Full validation suite

Nothing runs automatically. There are no save hooks, VS Code tasks or git hooks. `npm run dev` runs no checks. Run these by hand once a change is final:

1. `npm run build`: `tsc --noEmit` (strict type-check) followed by `vite build`.
2. `npm test`: `vitest run` over `src/lib/calc.test.ts` and `src/state/reducer.test.ts`.
3. **Browser pass** against `npm run dev`, at 1280 px and 390 px, at the 25p example rate and at an own rate. Check the SPEC acceptance criteria, no horizontal page scroll, and no console errors.

## Latest run: 2026-11-11 (rename: Revised routine, screen names)

Renamed only: page 4 “Try a different routine” → “Revised routine”. Screen files and ids now match the page names: `MyHeaters` / `heaters`, `HeatingPatterns` / `patterns`, `CostAnalysis` / `cost`, `RevisedRoutine` / `revised`. No behaviour change.

| Check | Result |
|---|---|
| `npm run build` | Pass |
| `npm test` | Pass, 34/34 |
| Browser pass, 1280 px and 390 px, 25p | Pass: header reads My Heaters › Heating patterns › Cost analysis › Revised routine; h1 "Revised routine"; the "Try a different routine" button opens it; £54.11 → £46.61 → £39.11, kept after navigation, Reset → £54.11; no horizontal scroll; no console errors |

## Previous run: 2026-11-11 (four-screen design pass)

| Check | Result |
|---|---|
| `npm run build` | Pass |
| `npm test` | Pass, 34/34 (13 calc, 21 reducer) |
| Browser pass, 1280 px and 390 px × 25p and 30p | Pass, no console errors, no horizontal scroll |

| Behaviour | 25p (example) | 30p (own rate) |
|---|---|---|
| Baseline | £54.11 | £64.93 |
| Chart subtitle uses the selected rate | "at 25p per kWh" | "at 30p per kWh" |
| Chart at 4 h: Living room / Bedroom / Study room | £1.00 (+£0.50 more) / £0.50 / £0.50 (cheapest) | £1.20 (+£0.60 more) / £0.60 / £0.60 (cheapest) |
| Chart at 24 h (end labels) | £6.00 / £3.00 | £7.20 / £3.60 |
| Living room 3 → 2 h | £46.61 | £55.93 |
| Then Bedroom 8 → 6 h (changes add up) | £39.11, −£15.00 (−28%) | £46.93, −£18.00 (−28%) |
| Navigate away and back | Kept | Kept |
| Reset | £54.11, original usage restored | £64.93, original usage restored |
| Cost analysis and Heating patterns after trying changes | Unchanged | Unchanged |

Added tests in this pass:
- `runCost` at the selected rate.
- Several heaters changed together (£39.11 / £15.00).
- Revised routine screen guard, add-up, navigation and Reset.
- A real change on Revised routine clears results.

**Notes:**
- The browser pass was driven through headless Chrome with a throwaway script outside the repo. It isn't part of `npm test`.
- On phones, the usage and cost table scrolls sideways inside its card to reach the kWh, cost and share columns. The page itself doesn't scroll sideways.
