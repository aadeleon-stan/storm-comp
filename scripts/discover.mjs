#!/usr/bin/env node
/**
 * Auto-discovery script: scrapes Storm's product listing to find new balls
 * and detect discontinued (archived) ones.
 *
 * Usage: node scripts/discover.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ingestBall, DATA_PATH } from "./ingest.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = "https://www.stormbowling.com/products/equipment/bowling-balls/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch a listing page and extract product URLs.
 * @param {string} pageUrl
 * @returns {string[]} Array of absolute product URLs
 */
async function fetchListingPage(pageUrl) {
  const res = await fetch(pageUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${pageUrl}`);
  const html = await res.text();

  // Extract product URLs from <h2 class="product-name"><a href="...">
  const urls = [];
  const re = /<h2[^>]*class="product-name"[^>]*>\s*<a[^>]*href="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let href = m[1];
    // Make absolute if relative
    if (href.startsWith("/")) href = "https://www.stormbowling.com" + href;
    urls.push(href);
  }

  // Check for next page: Storm pagination uses <li class="next"><a href="...">
  const hasNext = /class="next"[^>]*>\s*<a\s/i.test(html);

  return { urls, hasNext };
}

/**
 * Discover all ball URLs from the Storm product listing (all pages).
 */
async function discoverAllUrls() {
  const allUrls = [];
  let page = 1;
  let pageUrl = BASE_URL;

  while (true) {
    console.log(`Fetching listing page ${page}...`);
    const { urls, hasNext } = await fetchListingPage(pageUrl);
    allUrls.push(...urls);
    console.log(`  Found ${urls.length} products`);

    if (!hasNext || urls.length === 0) break;

    page++;
    pageUrl = `${BASE_URL}24/1/${page}/`;
    await sleep(1500);
  }

  // Deduplicate by URL
  return [...new Set(allUrls)];
}

/**
 * Derive a slug ID from a product URL (same logic as ingest.mjs).
 */
function urlToSlug(url) {
  const urlPath = new URL(url).pathname.replace(/\/$/, "");
  return urlPath.split("/").pop();
}

async function main() {
  console.log("=== Ball Discovery ===\n");

  // 1. Discover all currently-listed balls
  const discoveredUrls = await discoverAllUrls();
  console.log(`\nTotal discovered: ${discoveredUrls.length} balls across all pages\n`);

  const discoveredSlugs = new Set(discoveredUrls.map(urlToSlug));

  // 2. Load existing database
  const existing = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const existingSlugs = new Set(existing.map((b) => b.id));

  // 3. Find new balls (discovered but not in DB)
  const newUrls = discoveredUrls.filter((url) => !existingSlugs.has(urlToSlug(url)));

  if (newUrls.length > 0) {
    console.log(`Found ${newUrls.length} new ball(s):\n`);
    for (const url of newUrls) {
      console.log(`  Ingesting: ${url}`);
      try {
        const { ball } = await ingestBall(url);
        console.log(`    ✓ ${ball.name} (${ball.id}) — release: ${ball.releaseDate ?? "unknown"}`);
      } catch (err) {
        console.log(`    ✗ Failed: ${err.message}`);
      }
      await sleep(1500);
    }
  } else {
    console.log("No new balls found.");
  }

  // 4. Archive detection — reload DB after ingestion
  const updated = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  let archivedCount = 0;
  let unarchivedCount = 0;

  for (const ball of updated) {
    const isListed = discoveredSlugs.has(ball.id);

    if (!isListed && !ball.archived) {
      ball.archived = true;
      archivedCount++;
      console.log(`  Archived: ${ball.name} (${ball.id}) — no longer on Storm listing`);
    } else if (isListed && ball.archived) {
      ball.archived = false;
      unarchivedCount++;
      console.log(`  Un-archived: ${ball.name} (${ball.id}) — back on Storm listing`);
    }
  }

  if (archivedCount > 0 || unarchivedCount > 0) {
    writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2) + "\n");
    console.log(`\nArchive changes saved: ${archivedCount} archived, ${unarchivedCount} un-archived`);
  } else {
    console.log("\nNo archive changes needed.");
  }

  // 5. Summary
  const final = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const activeCount = final.filter((b) => !b.archived).length;
  const archivedTotal = final.filter((b) => b.archived).length;
  console.log(`\n=== Summary ===`);
  console.log(`Listed on Storm site: ${discoveredUrls.length}`);
  console.log(`New balls ingested: ${newUrls.length}`);
  console.log(`Database total: ${final.length} (${activeCount} active, ${archivedTotal} archived)`);
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
