#!/usr/bin/env node
/**
 * ZVL category automation script.
 *
 * Tier 1: Fetches ZVL's Google Sheets bowling ball database,
 *         maps numeric categories to string categories, and
 *         updates balls.json for any balls missing zvlCategory.
 *
 * Tier 2: Falls back to logging balls that need manual ZVL categorization.
 *
 * Usage: node scripts/zvl-scrape.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/balls.json");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ZVL numeric categories (1-7) map to these string categories
const ZVL_CATEGORIES = [
  "Strong/Smooth",   // 1
  "Strong/Sharp",    // 2
  "Medium/Smooth",   // 3
  "Medium/Sharp",    // 4
  "Weak/Smooth",     // 5
  "Weak/Sharp",      // 6
  "Urethane/Urethane-Like", // 7
];

/**
 * Extract the Google Sheets document ID from the ZVL database page.
 */
async function findSheetId() {
  const res = await fetch("https://www.zvlbowling.com/bowling-ball-database", {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ZVL database page`);
  const html = await res.text();

  // Look for Google Sheets/Drive link
  const match = html.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error("Could not find Google Sheets link on ZVL database page");

  return match[1];
}

/**
 * Fetch the spreadsheet as CSV using the gviz endpoint.
 */
async function fetchSheetCSV(sheetId) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching spreadsheet CSV`);
  return res.text();
}

/**
 * Parse CSV text into rows of objects.
 * Handles quoted fields with commas.
 */
function parseCSV(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const parseRow = (line) => {
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseRow(lines[0]);
  const nameIdx = headers.findIndex((h) => /name/i.test(h));
  const catIdx = headers.findIndex((h) => /category/i.test(h));

  if (nameIdx === -1 || catIdx === -1) {
    throw new Error(`Missing required columns. Found headers: ${headers.join(", ")}`);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseRow(lines[i]);
    const name = fields[nameIdx];
    const category = parseInt(fields[catIdx], 10);
    if (name && !isNaN(category) && category >= 1 && category <= 7) {
      rows.push({ name, category });
    }
  }
  return rows;
}

/**
 * Normalize a ball name for fuzzy matching.
 * Strips brand prefixes, "Bowling Ball" suffix, and normalizes whitespace/case.
 */
function normalizeName(name) {
  let s = name;
  // Strip brand prefixes
  s = s.replace(/^(storm|roto\s*grip|900\s*global)\s+/i, "");
  // Strip "Bowling Ball" suffix
  s = s.replace(/\s*bowling\s*ball\s*$/i, "");
  // Normalize whitespace and lowercase
  s = s.replace(/\s+/g, " ").trim().toLowerCase();
  // Normalize special characters
  s = s.replace(/[–—]/g, "-");
  // Remove dots from abbreviations like "A.I." → "AI"
  s = s.replace(/\./g, "");
  return s;
}

async function main() {
  console.log("=== ZVL Category Automation ===\n");

  const balls = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const missingZVL = balls.filter((b) => !b.zvlCategory);

  if (missingZVL.length === 0) {
    console.log("All balls already have ZVL categories. Nothing to do.");
    return;
  }

  console.log(`${missingZVL.length} ball(s) missing ZVL categorization.\n`);

  // Tier 1: Try Google Sheets
  let zvlData = null;
  try {
    console.log("Tier 1: Fetching ZVL Google Sheets database...");
    const sheetId = await findSheetId();
    console.log(`  Sheet ID: ${sheetId}`);
    const csv = await fetchSheetCSV(sheetId);
    zvlData = parseCSV(csv);
    console.log(`  Parsed ${zvlData.length} balls from spreadsheet.\n`);
  } catch (err) {
    console.log(`  Tier 1 failed: ${err.message}\n`);
  }

  let matched = 0;
  const stillMissing = [];

  if (zvlData && zvlData.length > 0) {
    // Build a lookup from normalized ZVL names to categories
    const zvlLookup = new Map();
    for (const row of zvlData) {
      zvlLookup.set(normalizeName(row.name), ZVL_CATEGORIES[row.category - 1]);
    }

    for (const ball of missingZVL) {
      // Try matching by shortName first, then full name
      const candidates = [
        ball.shortName ? normalizeName(ball.shortName) : null,
        normalizeName(ball.name),
      ].filter(Boolean);

      let found = false;
      for (const candidate of candidates) {
        const category = zvlLookup.get(candidate);
        if (category) {
          ball.zvlCategory = category;
          console.log(`  Matched: ${ball.name} → ${category}`);
          matched++;
          found = true;
          break;
        }
      }

      if (!found) stillMissing.push(ball);
    }

    if (matched > 0) {
      writeFileSync(DATA_PATH, JSON.stringify(balls, null, 2) + "\n");
      console.log(`\nUpdated ${matched} ball(s) with ZVL categories.`);
    }
  } else {
    stillMissing.push(...missingZVL);
  }

  // Tier 2: Report balls still missing
  if (stillMissing.length > 0) {
    console.log(`\n=== Balls needing manual ZVL categorization (${stillMissing.length}) ===`);
    for (const ball of stillMissing) {
      console.log(`  - ${ball.name} (${ball.id})`);
    }
    console.log(`\nAction: Check https://www.zvlbowling.com and update data/balls.json manually.`);
  } else {
    console.log("\nAll balls now have ZVL categories!");
  }
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
