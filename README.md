<!-- LANG-NAV -->
**English** · [Português](README.pt.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md)

# 🪙 Trevi

> A wishlist manager for Obsidian. Toss a coin in the fountain and make a wish — every wish is an item kept in your own vault. No social features, no AI: local, portable and elegant.

Trevi turns your vault into a personal collection of wishlists. Create named lists, add items with a photo, price and link, keep a price history, and see it all on a light SVG dashboard — with everything stored in plain files you fully own and that sync trivially between devices, phone included.

## Features

- **Piazza** — a home screen with every list as a card (cover, item count, total value).
- **Lists & items** — full CRUD, text search, filters (status, priority, tag) and sorting (price, priority, date, title). Tap an item to open it.
- **"Toss a coin"** — the add-item flow, with **metadata capture from a URL** (Open Graph + JSON-LD, fetched via Obsidian's `requestUrl`, so it works on mobile and around CORS), and manual entry as a fallback.
- **Images** — stored in a flat folder, named by UUID, referenced only by UUID in the data file. Add from your device or download from a URL.
- **Prices** — manual updates only (per item or all at once). Each change appends to a price history that feeds trend sparklines.
- **Statistics** — totals per currency, counts by status/priority/tag, and price trends. Scope the dashboard to all lists or a single one.
- **List cover** — set a list's cover from a device image or from any item's photo.
- **Move · Duplicate · Mark as bought · Open link · Export** — one tap away from each item, or from a list's menu.
- **Export to Markdown** — turn any list into a note with a table of its items.
- **Trash** — safe, recoverable deletion with a configurable retention window; restore or purge; orphan images are cleaned only when you ask.
- **Palette** — the calm "Trevi" palette plus presets (Travertino, Acquamarina, Notturno) and per-color overrides. Color is applied to the data only; everything else inherits your theme, in light and dark.
- **Backups & recovery** — atomic writes, a `.bak`, rotating daily snapshots, automatic recovery from the newest readable backup, and a read-only safe mode that never overwrites unreadable data.
- **Internationalization** — English, Português, Español, Deutsch, Français, Italiano.
- **Accessible & mobile-first** — keyboard-navigable, theme-aware, responsive down to phone width.

## Screenshots

<p align="center">
  <img src="docs/en-piazza.png" width="24%" alt="Piazza">
  <img src="docs/en-list.png" width="24%" alt="List view">
  <img src="docs/en-stats.png" width="24%" alt="Statistics">
  <img src="docs/en-modal.png" width="24%" alt="Item editor">
</p>

## Getting started

**Manual install**

1. Copy `main.js`, `manifest.json` and `styles.css` into `<your vault>/.obsidian/plugins/trevi/`.
2. In Obsidian: Settings → Community plugins → enable **Trevi**.

**BRAT (beta)**

Add the repository in the BRAT plugin to receive updates without a manual copy.

**Community plugins**

Once listed, install it from Settings → Community plugins → Browse.

## Usage

1. Open **Trevi** from the ribbon (the fountain icon) or the command palette (`Trevi: Open Piazza`).
2. Create a list, then **Toss a coin** to add an item — paste a product URL and hit **Fetch**, or fill it in by hand.
3. Tap an item to edit it; use the **⋯** menu on an item to open its link, update its price, move, duplicate, set it as the list cover, or delete.
4. Use the list's **⋯** menu to set a cover, rename, export to Markdown, or delete.
5. Open **Statistics** for totals and price trends.

## Data, storage & privacy

- **Single source of truth**: one JSON file in your vault (default `core/trevi/trevi.json`), written atomically.
- **Images**: a flat folder (default `core/trevi/assets`), one file per UUID.
- **No network except on your action**: the only requests are metadata/price/image fetches you trigger, all through `requestUrl`. No telemetry, no background jobs, no accounts.
- **No AI, no social features** — no recommendations, sharing, reservations or gifting.
- Both paths are configurable in Settings; changing them safely migrates your existing data.

## Backups & recovery

- Every save keeps a `.bak` and, once per day, a rotating dated snapshot (the five most recent are kept).
- On startup Trevi loads the newest readable file, trying `trevi.json` → `.bak` → daily snapshots.
- If everything is unreadable, Trevi enters a **read-only safe mode** and never overwrites your files, so you can recover them by hand.
- If it detects sync-conflict files in the data folder, it warns you.

## Settings

| Setting | What it does |
|---|---|
| Data file | Path of the JSON in your vault (moves existing data when changed). |
| Images folder | Where images are stored, by UUID (moves existing images when changed). |
| Default currency | ISO 4217 code used for new items. |
| Language | UI language (6 supported). |
| Trash retention (days) | How long deleted items stay recoverable. |
| Seed initial price | Store the first price entry when creating an item, so trends have data. |
| Palette | Preset + per-color override for chart colors. |
| Clean orphan images | Remove unreferenced images — only when you ask. |

## Compatibility

- **Desktop and mobile.** `isDesktopOnly` is `false`; the plugin uses no Node modules, and all networking goes through `requestUrl`.
- Charts are hand-drawn SVG that inherit your theme's variables and work in light and dark.

## Development

Trevi ships as a single hand-written `main.js` (plus `manifest.json` and `styles.css`) — no build step required. The functional specification lives in `trevi-spec.md`.

## Non-goals

- No social features (sharing, gift reservations, secret-santa, money gifts).
- No AI (recommendations, discovery, content generation).
- No background processes — nothing runs while Obsidian is closed.

## License

[MIT](LICENSE) © Fagner Candido
