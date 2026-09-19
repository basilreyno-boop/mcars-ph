# Same-Day Release — MCARS PH

**Version 1.0.0** — DualShock pad, 12 lots, 5 arcade modes.

Play: https://same-day-release.vercel.app  
Source: https://github.com/basilreyno-boop/mcars-ph

2D arcade about Boss Jed and the last quarter on a Malabon lot.

TanStack Start + React 19 + Vite + canvas 2D. Auth and database stay off. Progress is `localStorage`.

## Run

```bash
npm install
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Live game |
| `npm run typecheck` | TypeScript |
| `npm run build` | Production build |

Controls: **A** left, **D** right, **W / space** jump, **S** down. On phones: DualShock stick + ✕ / ○ / □ / △.

## v1.0.0

- 12 lots: Malabon → EDSA → C5 Ortigas → BGC → NLEX → Timog → Cubao → Makati → Clark → Cebu → Davao → Alabang
- Arcade: EDSA Rush, Lot Survival, Quota Invaders, Jed's Deal, Replevin Cells
- PlayStation-style analog stick + diamond face buttons
- Used-car loadouts, wardrobe, quota missions, 3-star medals

## Deploy

Vercel production alias: `same-day-release.vercel.app`. Push `main` to this repo to ship.
