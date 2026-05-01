#!/usr/bin/env node
/**
 * Usage: node scripts/ingest.mjs <storm-product-url>
 *
 * Fetches a Storm product page, extracts reaction spec data from the
 * ITEM_CLICKABLE_FILTERS JS variable, and appends the ball to data/balls.json.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/balls.json");

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/ingest.mjs <storm-product-url>");
  process.exit(1);
}

if (!url.includes("stormbowling.com")) {
  console.error("Error: URL must be a stormbowling.com product page.");
  process.exit(1);
}

console.log(`Fetching: ${url}`);

let html;
try {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  html = await res.text();
} catch (err) {
  console.error("Fetch failed:", err.message);
  process.exit(1);
}

// Extract ITEM_CLICKABLE_FILTERS from an inline <script> block
const match = html.match(/ITEM_CLICKABLE_FILTERS\s*=\s*(\[[\s\S]*?\]);/);
if (!match) {
  console.error(
    "No ITEM_CLICKABLE_FILTERS found on this page. " +
      "This product may not have reaction spec data."
  );
  process.exit(1);
}

let filters;
try {
  filters = JSON.parse(match[1]);
} catch {
  console.error("Failed to parse ITEM_CLICKABLE_FILTERS JSON.");
  process.exit(1);
}

// Each filter looks like:
// { label: "Flare Potential", values: [{ id: "...", label: "9", value: "segment-9", selected: true }, ...] }
const metrics = [];

for (const filter of filters) {
  const label = (filter.name ?? filter.label ?? "").trim();
  if (!label) continue;

  // Find segment values — stored in name or urlName fields (e.g. "segment-9")
  const values = filter.values ?? [];
  const segmentValues = values
    .filter((v) => /segment-\d+/i.test(v.name ?? v.urlName ?? v.value ?? ""))
    .map((v) => {
      const raw = v.name ?? v.urlName ?? v.value ?? "";
      return parseInt(raw.match(/segment-(\d+)/i)[1], 10);
    });

  if (segmentValues.length === 0) continue;

  const segmentStart = Math.min(...segmentValues);
  const segmentEnd = Math.max(...segmentValues);

  metrics.push({ name: label, segmentStart, segmentEnd });
}

if (metrics.length === 0) {
  console.error(
    "Found ITEM_CLICKABLE_FILTERS but no segment data. " +
      "This product may not have reaction specs."
  );
  process.exit(1);
}

// Extract ball name from <title> or <h1>
let name = "Unknown Ball";
const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
if (titleMatch) {
  // Storm titles are often "Ball Name | Storm Bowling"
  name = titleMatch[1].split("|")[0].trim();
}
// Fallback: <h1>
if (name === "Unknown Ball") {
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) name = h1Match[1].trim();
}

// Extract product image, color, and fragrance
let imageUrl = null;
const imageMatch = html.match(/var\s+ITEM_IMAGE\s*=\s*"([^"]+)"/);
if (imageMatch) imageUrl = imageMatch[1];

let color = null;
const colorMatch = html.match(/<strong>Color:<\/strong>\s*([^<]+)/);
if (colorMatch) color = colorMatch[1].trim();

let fragrance = null;
const fragranceMatch = html.match(/<strong>Fragrance:<\/strong>\s*([^<]+)/);
if (fragranceMatch) fragrance = fragranceMatch[1].trim();

// Helper: strip Storm's internal brand prefix (e.g. "S_AI" → "AI", "R_Nanostar Solid" → "Nanostar Solid")
const stripPrefix = (s) => s ? s.replace(/^[A-Z]_/, "").replace(/_/g, " ").trim() : null;

// Extract core/coverstock data from the product spec block in HTML.
// Storm's spec fields: Weight Block = core model name, Symmetry = core type, Coverstock = coverstock name.
const wbMatch = html.match(/<strong>Weight\s*Block:<\/strong>\s*([^<]+)/i);
const coreName = wbMatch ? stripPrefix(wbMatch[1].trim()) : null;

const symMatch = html.match(/<strong>Symmetry:<\/strong>\s*([^<]+)/i);
let coreType = null;
if (symMatch) {
  const raw = symMatch[1].trim();
  if (/asym/i.test(raw)) coreType = "Asymmetric";
  else if (/sym/i.test(raw)) coreType = "Symmetric";
}

const coverstockMatch = html.match(/<strong>Coverstock:<\/strong>\s*([^<]+)/i);
const coverstockName = coverstockMatch ? stripPrefix(coverstockMatch[1].trim()) : null;

// Derive coverstock type from the name (e.g. "TX-16 Solid" → "Solid")
let coverstockType = null;
if (coverstockName) {
  const typeKeyword = coverstockName.match(/\b(Pearl|Solid|Hybrid|Urethane)\b/i);
  coverstockType = typeKeyword ? typeKeyword[1] : null;
}

// Build core image URL from the raw weight block identifier (keep prefix — it's part of the CDN path)
const rawWeightBlock = wbMatch ? wbMatch[1].trim() : null;
const coreKey = rawWeightBlock ? rawWeightBlock.replace(/ /g, "_") : null;
const coreImageUrl = coreKey
  ? `https://stormproducts.nyc3.cdn.digitaloceanspaces.com/product_pages/Balls/Coresequencing/${coreKey}/${coreKey}_00000.png`
  : null;

// Generate slug ID from URL path
const urlPath = new URL(url).pathname.replace(/\/$/, "");
const id = urlPath.split("/").pop() || name.toLowerCase().replace(/\s+/g, "-");

// Derive brand and shortName
let brand = null;
let shortName = null;

// Use \s to handle narrow no-break space (U+202F) and other Unicode whitespace
if (/^roto\sgrip\s/i.test(name)) {
  brand = "Roto Grip";
} else if (/\sby\sroto\sgrip$/i.test(name)) {
  brand = "Roto Grip";
} else if (/^storm\s/i.test(name)) {
  brand = "Storm";
} else if (/^900\sglobal\s/i.test(name)) {
  brand = "900 Global";
}

{
  let s = name;
  // Strip trailing " by Roto Grip"
  s = s.replace(/\sby\sroto\sgrip$/i, "");
  // Strip brand prefix
  if (brand === "Roto Grip") s = s.replace(/^roto\sgrip\s/i, "");
  else if (brand === "Storm") s = s.replace(/^storm\s/i, "");
  else if (brand === "900 Global") s = s.replace(/^900\sglobal\s/i, "");
  // Strip subtitle (everything from " – " or " — " onward) BEFORE stripping "Bowling Ball"
  // so "Phaze II Bowling Ball – subtitle" → "Phaze II Bowling Ball" → "Phaze II"
  s = s.replace(/\s+[–—].*$/, "");
  // Strip " Bowling Ball" (case-insensitive)
  s = s.replace(/\sbowling\sball$/i, "");
  s = s.trim();
  // Title-case if the result is ALL CAPS
  if (s === s.toUpperCase() && /[A-Z]{2}/.test(s)) {
    s = s.replace(/\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  shortName = s || null;
}

const newBall = { id, name, shortName, brand, url, imageUrl, color, fragrance, coreType, coreName, coreImageUrl, coverstockType, coverstockName, metrics };

// Load existing data
const existing = JSON.parse(readFileSync(DATA_PATH, "utf8"));

const idx = existing.findIndex((b) => b.id === id);
if (idx !== -1) {
  console.log(`Ball "${name}" already exists — updating entry.`);
  existing[idx] = newBall;
} else {
  existing.push(newBall);
  console.log(`Added: ${name}`);
}

writeFileSync(DATA_PATH, JSON.stringify(existing, null, 2) + "\n");

console.log(`\nBall: ${name}`);
console.log(`ID:   ${id}`);
console.log(`Metrics (${metrics.length}):`);
for (const m of metrics) {
  const bar = Array.from({ length: 11 }, (_, i) => {
    const c = i + 1;
    return c >= m.segmentStart && c <= m.segmentEnd ? "█" : "░";
  }).join("");
  console.log(`  ${m.name.padEnd(20)} [${bar}] ${m.segmentStart}–${m.segmentEnd}`);
}
console.log(`\nCore:       ${coreName ?? "(none)"} (${coreType ?? "unknown type"})`);
console.log(`Coverstock: ${coverstockName ?? "(none)"} (${coverstockType ?? "unknown type"})`);
if (coreImageUrl) console.log(`Core image: ${coreImageUrl}`);
console.log(`\nSaved to data/balls.json`);
