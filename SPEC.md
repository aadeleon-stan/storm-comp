# BallDiff — Product Spec

## Problem

Storm Bowling's website shows reaction spec graphics for individual balls but provides no way to compare two or more balls side-by-side. A bowler evaluating equipment must manually flip between product pages and hold the specs in their head — a poor experience when the data is right there.

## Solution

A focused web app that lets a user pick 1–3 Storm balls and view their reaction spec graphics simultaneously, in a single glance.

---

## Users

**Recreational and competitive bowlers** shopping for a new ball or deciding what to throw at an event. They understand bowling terminology (hook length, lane condition, flare potential) but are not necessarily technical users. They know what Storm ball names they're considering and want a quick, visual confirmation of how those balls differ.

---

## Data Model

Each ball record stored in `/data/balls.json`:

| Field | Type | Notes |
|---|---|---|
| `id` | string | URL slug, e.g. `storm-phaze-ii-bowling-ball` |
| `name` | string | Full product name as listed on Storm's site |
| `shortName` | string \| null | Concise display name, e.g. `Phaze II` (brand prefix + " Bowling Ball" + subtitle stripped) |
| `brand` | string \| null | `"Storm"` or `"Roto Grip"` |
| `url` | string | Canonical Storm product page URL |
| `imageUrl` | string \| null | Product image URL from Storm's site |
| `color` | string \| null | Slash-separated colorway, e.g. `Red/Blue/Purple` |
| `fragrance` | string \| null | e.g. `Grapefruit` |
| `metrics` | Metric[] | Reaction spec entries (see below) |

Each **Metric**:

| Field | Type | Notes |
|---|---|---|
| `name` | string | e.g. `Hook Length` |
| `segmentStart` | number | 1–11 |
| `segmentEnd` | number | 1–11, ≥ segmentStart |

Current metrics in the DB: Ball Shape, Flare Potential, Hook Length, Lane Condition, Oil Volume, Pattern Length.

The data file is checked into the repo. No runtime database is required; data only changes when Storm releases new balls.

---

## Features

### Search & Select (Home page `/`)

- Text search filters the ball list by name in real time (searches full `name`, not `shortName`)
- Ball list and sidebar display `shortName` when available, falling back to `name`
- A **Show brand** checkbox prepends the brand (e.g. "Storm", "Roto Grip") to displayed names
- User selects 1–3 balls from the filtered list; selected balls are highlighted and listed in a sidebar
- "Compare N balls" button navigates to `/compare?balls=id1,id2,...`
- Maximum of 3 balls enforced in the UI (additional balls are dimmed and unclickable)
- Ball thumbnail images are displayed in the list when available

### Comparison View (`/compare`)

Two view modes are available, toggled via a **Cards / Stacked** button pair at the top of the page. Ball order and highlight colors are shared between views.

Two checkboxes appear below the view toggle:

- **Show colors** (both views): when unchecked, all bar segments use a uniform red (`#dc2626`) and the ↻ cycle-color button is hidden
- **Show brand** (cards view only): prepends brand name to each card's heading

#### Cards view (default)

- Each selected ball is rendered as a card showing:
  - Ball image (if available)
  - Ball short name (optionally prefixed with brand) and link to Storm product page
  - Color and fragrance metadata
  - One bar graphic per metric: 11 cells, with the ball's segment range highlighted in color
  - Axis labels beneath each bar (e.g. Early / Mid-Lane / Late for Hook Length)
- Cards are displayed in a responsive grid (1, 2, or 3 columns depending on count)
- Feature section heights are equalized across cards so metric bars are vertically aligned
- Cards are drag-reorderable horizontally
- "← Back" link returns to the home page without losing the URL (browser back also works)

#### Stacked view

- A **left sidebar** shows a compact draggable card per ball (thumbnail, short name, color+↻, fragrance); cards are drag-reorderable vertically
- A **right panel** shows one section per metric, with all balls' bars overlaid for direct comparison:
  - Metric name is displayed as a centered label between two horizontal hairline rules, scoped over the bar column
  - Each ball row shows the ball's short name (right-aligned, truncated) and a small color dot to the left of its bar
  - The bar panel is width-capped (`max-w-md`) so bars stay compact regardless of viewport width
  - Bars are taller than in Cards view (`h-4` vs `h-5`) to aid readability at the narrower width
  - Axis labels appear below the bars, aligned under the bar column

### Highlight Color

- Each ball's bars are colored using its primary colorway color, mapped to a curated hex palette
- When comparing multiple balls, an **auto-contrast** algorithm runs on load: it steps through each ball's colorway segments in order and advances to the next segment color when the current one is perceptually similar to a color already assigned to another ball (similarity defined as hue difference < 35° with both colors having saturation > 15%)
- A **↻ cycle** button appears next to the color value for any ball with more than one resolvable colorway segment, letting the user manually step through the available colors
- Color state is keyed by ball ID, so it persists across drag reorders

### Data Ingestion (CLI, not user-facing)

```
node scripts/ingest.mjs <storm-product-url>
```

- Validates the URL is a `stormbowling.com` product page
- Fetches the page HTML, extracts the `ITEM_CLICKABLE_FILTERS` inline JSON variable
- Parses `segment-N` values to determine `segmentStart`/`segmentEnd` per metric
- Extracts name, image URL, color, and fragrance
- Derives `shortName` (strips brand prefix, " Bowling Ball", and " – …" subtitle; title-cases ALL-CAPS names) and `brand` (`"Storm"` or `"Roto Grip"`)
- Appends or updates the ball entry in `data/balls.json`
- Prints a visual ASCII bar chart of the ingested specs for quick verification

---

## Design

- Dark background (`gray-900` / `gray-800`) with white text — matches the aesthetic of bowling equipment contexts
- Storm red (`red-600`) as the primary accent color for interactive elements
- Ball bar graphics use the ball's own color as the highlight, making cards visually distinct from one another
- No external design system; plain Tailwind utility classes throughout

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS |
| Drag-and-drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Data | `/data/balls.json` flat JSON array, no runtime DB |
| Deployment | Vercel |
| Runtime | Node.js 24 LTS |

---

## Out of Scope (for now)

- **Other brands**: 900 Global, Hammer, and other Storm siblings are not included in the current DB (Roto Grip is included)
- **Automatic data sync**: new ball releases require manual ingestion via the CLI script
- **User accounts / saved comparisons**: the compare URL is shareable as-is
- **Mobile layout**: the comparison grid is designed for desktop; narrow viewports will scroll horizontally
- **Sorting / filtering by spec**: e.g. "show all balls with Hook Length > 8" — currently out of scope
