# BallDiff

Compare Storm bowling ball reaction specs side by side.

Storm publishes a reaction-spec graphic for every ball — hook length, ball shape, lane
condition, flare potential — but their site only ever shows you **one ball at a time**.
Picking between two balls means opening two tabs and eyeballing back and forth.
BallDiff puts them on the same axes.

- **Cards view** — one column per ball, metrics aligned across columns.
- **Stacked view** — one section per metric, every ball overlaid on a shared scale.
- Drag to reorder, recolor any ball, share a comparison by URL (`/compare?balls=id1,id2`).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · `@dnd-kit` for drag-reorder.

Ball data lives in [`data/balls.json`](data/balls.json) — a flat JSON array checked into
the repo. The dataset is effectively static (it changes only when Storm releases a ball),
so there's no database and no runtime fetching: the whole site builds to static output.

## Local development

```bash
npm install
npm run dev
```

Then open the app at the path in `BASE_PATH` (`lib/site.ts`) — by default
<http://localhost:3000/projects/balldiff/app>. The app is served from a sub-path behind
a proxy in production, and `basePath` applies in dev too.

## Data pipeline

Specs are scraped rather than hand-entered. Storm embeds them in an
`ITEM_CLICKABLE_FILTERS` JSON blob in an inline `<script>` tag on each product page.

| Script | What it does |
| --- | --- |
| `scripts/ingest.mjs <url>` | Parses one Storm product page into a `balls.json` entry. Also exports `ingestBall()` / `parseBall()` for reuse. |
| `scripts/discover.mjs` | Walks Storm's paginated ball listing, ingests balls it hasn't seen, and flags ones that disappeared as `archived`. |
| `scripts/zvl-scrape.mjs` | Pulls the community ZVL ball-comparison sheet and fuzzy-matches its category ratings onto existing entries. |

[`.github/workflows/update-balls.yml`](.github/workflows/update-balls.yml) runs
`discover` + `zvl-scrape` every Monday and commits any changes, so the database keeps
itself current.

Not every ball has reaction specs — entry-level and polyester balls (Tropical Surge,
Mix, Hustle, Ice Storm) ship without them, and those are skipped.

---

Specs sourced from stormbowling.com. Not affiliated with or endorsed by
Storm Products, Inc.
