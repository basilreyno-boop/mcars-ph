# Same-Day Release — MCARS PH

2D arcade about Boss Jed and the last quarter on a Malabon lot.

TanStack Start + React 19 + Vite + canvas 2D. Auth and database stay off. Progress is `localStorage`.

## Run in Cursor

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:8080`).

| Command | What it does |
|---|---|
| `npm run dev` | Live game |
| `npm run typecheck` | TypeScript |
| `npm run build` | Production build |

Controls: **A** left, **D** right, **W / space** jump, **S** down. On phones: DualShock stick + ✕ / ○ / □ / △.

## What’s in here

- `src/game/` — lots engine, arcade modes (Rush, Survival, Invaders, Deal, Cells)
- `src/components/` — shell, DualShock pad, garage, wardrobe, missions
- `public/` — Jed stills, city maps, sprites, logo
- `docs/MCARS-PH-GROK-IMAGINE-MEGA-PROMPT.md` — Grok Imagine trailer bible

Lots: Malabon Showroom → EDSA → C5 Ortigas → BGC High Line → NLEX Nationwide → Timog Elite Agent → Cubao → Makati → Clark → Cebu → Davao → Alabang.

## Stack notes

This started as a Grok App Builder project. `scripts/` and `vite.config.ts` still wrap Vite with the original env plugin. You can leave that as-is.

Do not commit `node_modules`. Do not check in generated `dist`.
