#!/usr/bin/env node
/**
 * Usage: node scripts/ingest.mjs <storm-product-url>
 *
 * Fetches a Storm product page, extracts reaction spec data from the
 * ITEM_CLICKABLE_FILTERS JS variable, and appends the ball to data/balls.json.
 *
 * Also exports ingestBall(url) for programmatic use by discover.mjs.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DATA_PATH = join(__dirname, "../data/balls.json");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Helper: strip Storm's internal brand prefix (e.g. "S_AI" → "AI", "R_Nanostar Solid" → "Nanostar Solid")
const stripPrefix = (s) => s ? s.replace(/^[A-Z]_/, "").replace(/_/g, " ").trim() : null;

/**
 * Fetch and parse a Storm product page, returning the ball data.
 * Does NOT read/write balls.json — caller is responsible for persistence.
 * @param {string} url - Storm product page URL
 * @returns {{ ball: object }} The parsed ball object
 * @throws {Error} on fetch failure or missing data
 */
export async function parseBall(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  const html = await res.text();

  // Extract ITEM_CLICKABLE_FILTERS from an inline <script> block
  const match = html.match(/ITEM_CLICKABLE_FILTERS\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error("No ITEM_CLICKABLE_FILTERS found — this product may not have reaction spec data.");
  }

  let filters;
  try {
    filters = JSON.parse(match[1]);
  } catch {
    throw new Error("Failed to parse ITEM_CLICKABLE_FILTERS JSON.");
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
    throw new Error("Found ITEM_CLICKABLE_FILTERS but no segment data.");
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

  // Extract release date from product specs (format: MM/DD/YY)
  let releaseDate = null;
  const releaseDateMatch = html.match(/<strong>Release\s*Date:<\/strong>\s*([^<]+)/i);
  if (releaseDateMatch) {
    const raw = releaseDateMatch[1].trim();
    const dateMatch = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dateMatch) {
      const month = dateMatch[1].padStart(2, "0");
      const day = dateMatch[2].padStart(2, "0");
      let year = dateMatch[3];
      if (year.length === 2) year = (parseInt(year, 10) >= 70 ? "19" : "20") + year;
      releaseDate = `${year}-${month}-${day}`;
    }
  }

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

  const ball = {
    id, name, shortName, brand, url, imageUrl, color, fragrance,
    coreType, coreName, coreImageUrl, coverstockType, coverstockName,
    releaseDate, archived: false, metrics,
  };

  return { ball };
}

/**
 * Ingest a ball from a Storm product page URL into balls.json.
 * Preserves existing fields (zvlCategory, isNew, etc.) when updating.
 * @param {string} url - Storm product page URL
 * @returns {{ ball: object, isUpdate: boolean }}
 */
export async function ingestBall(url) {
  const { ball } = await parseBall(url);

  // Load existing data
  const existing = JSON.parse(readFileSync(DATA_PATH, "utf8"));

  const idx = existing.findIndex((b) => b.id === ball.id);
  let isUpdate = false;
  if (idx !== -1) {
    // Preserve fields that are manually set or come from other sources
    const prev = existing[idx];
    ball.zvlCategory = ball.zvlCategory ?? prev.zvlCategory ?? null;
    if (prev.isNew !== undefined) ball.isNew = prev.isNew;
    if (prev.releaseDate && !ball.releaseDate) ball.releaseDate = prev.releaseDate;
    existing[idx] = ball;
    isUpdate = true;
  } else {
    existing.push(ball);
  }

  writeFileSync(DATA_PATH, JSON.stringify(existing, null, 2) + "\n");

  return { ball, isUpdate };
}

// CLI entrypoint
const scriptPath = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && scriptPath.endsWith(process.argv[1].replace(/\\/g, "/").replace(/^\//, "")) ||
  scriptPath.replace(/\\/g, "/") === process.argv[1]?.replace(/\\/g, "/");

if (isMain) {
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

  try {
    const { ball, isUpdate } = await ingestBall(url);

    if (isUpdate) {
      console.log(`Ball "${ball.name}" already exists — updated entry.`);
    } else {
      console.log(`Added: ${ball.name}`);
    }

    console.log(`\nBall: ${ball.name}`);
    console.log(`ID:   ${ball.id}`);
    if (ball.releaseDate) console.log(`Release: ${ball.releaseDate}`);
    console.log(`Metrics (${ball.metrics.length}):`);
    for (const m of ball.metrics) {
      const bar = Array.from({ length: 11 }, (_, i) => {
        const c = i + 1;
        return c >= m.segmentStart && c <= m.segmentEnd ? "█" : "░";
      }).join("");
      console.log(`  ${m.name.padEnd(20)} [${bar}] ${m.segmentStart}–${m.segmentEnd}`);
    }
    console.log(`\nCore:       ${ball.coreName ?? "(none)"} (${ball.coreType ?? "unknown type"})`);
    console.log(`Coverstock: ${ball.coverstockName ?? "(none)"} (${ball.coverstockType ?? "unknown type"})`);
    if (ball.coreImageUrl) console.log(`Core image: ${ball.coreImageUrl}`);
    console.log(`\nSaved to data/balls.json`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
