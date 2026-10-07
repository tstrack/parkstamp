# ParkStamp

Stamp the U.S. state and national parks you’ve visited. Offline-friendly PWA with a passport / rubber-stamp look.

## Stack

- Vite + React + TypeScript
- MapLibre GL + OpenFreeMap basemap
- IndexedDB visit stamps (device-local)
- Park catalog from USGS PAD-US (`Des_Tp = SP` state parks, `NP` national parks)

## Develop

```bash
npm install
npm run data:build   # refresh park catalog from PAD-US (optional; data is committed)
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run data:build` | Rebuild `public/data` from PAD-US + county boundaries |

## Routes

- `/` — states + overall progress
- `/state/:code` — list or map (`?view=map`)
- `/state/:code/park/:parkId` — stamp a park
- `/about` — credits & privacy

## Data credits

Park inventory: [USGS PAD-US 4.1](https://doi.org/10.5066/P96WBCHS). Map tiles: OpenFreeMap / © OpenStreetMap contributors.
