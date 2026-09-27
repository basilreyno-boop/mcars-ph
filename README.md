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

Controls: **A** left, **D** right, **W / space** jump, **S** down, **F** hit, **E** grab / swap / throw (mouse: left hit, right grab). On phones: DualShock stick + ✕ jump / ○ hit / □ down / △ grab.

**Weapons (lots):** tools lie on the lot and drop from every KO — Tire Iron, Torque Wrench, Price Tag Gun (8 tags), Plate Frisbee. One GRAB button picks up, swaps with the floor, or throws what you hold. Thrown tools and bare-hand shoves knock foes down; hit or stomp a downed foe to FINISH for double pay.

**Field Guide:** the first time a new foe, hazard or weapon appears, the lot freezes and briefs you. Pause → Replay tutorial resets it.

## v1.0.0

- 12 lots: Malabon → EDSA → C5 Ortigas → BGC → NLEX → Timog → Cubao → Makati → Clark → Cebu → Davao → Alabang
- Arcade: EDSA Rush, Lot Survival, Quota Invaders, Jed's Deal, Replevin Cells
- PlayStation-style analog stick + diamond face buttons
- Used-car loadouts, wardrobe, quota missions, 3-star medals

## Deploy

Vercel production alias: `same-day-release.vercel.app`. Push `main` to this repo to ship.
