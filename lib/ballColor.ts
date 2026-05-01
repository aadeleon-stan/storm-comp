const COLOR_MAP: Record<string, string> = {
  "goldenrod":       "#DAA520",
  "cobalt":          "#4169E1",
  "neon pink":       "#F472B6",
  "dark green":      "#16A34A",
  "capri blue":      "#22D3EE",
  "navy":            "#3B82F6",
  "midnight":        "#818CF8",
  "black":           "#6B7280",
  "cherry":          "#E11D48",
  "teal":            "#14B8A6",
  "electric blue":   "#38BDF8",
  "emerald":         "#10B981",
  "crimson":         "#DC2626",
  "red":             "#EF4444",
  "midnight blue":   "#60A5FA",
  "chrome":          "#94A3B8",
  "ivory":           "#D1D5DB",
  "sapphire":        "#2563EB",
  "plum":            "#A855F7",
  "royal purple":    "#9333EA",
  "clear":           "#94A3B8",
  "indigo":          "#6366F1",
  "mango":           "#F97316",
  "space blue":      "#3B82F6",
  "smoke":           "#9CA3AF",
  "chili":           "#DC2626",
  // extended palette
  "aqua":            "#06B6D4",
  "deep violet":     "#7C3AED",
  "chromium":        "#A1A1AA",
  "carbon":          "#3F3F46",
  "steel":           "#71717A",
  "white":           "#E5E7EB",
  "magenta":         "#D946EF",
  "deep purple":     "#6D28D9",
  "wine":            "#881337",
  "ultramarine blue":"#3730A3",
  "anchor":          "#334155",
  "onyx":            "#1C1917",
  "old gold":        "#B7791F",
  "blue":            "#3B82F6",
  "pink":            "#EC4899",
  "purple":          "#A855F7",
  "violet":          "#8B5CF6",
  "slate":           "#64748B",
  "royal":           "#4338CA",
  "velvet":          "#9D174D",
  "ink":             "#1E3A5F",
  "raisen":          "#4C1130",
  "tanzanite":       "#312E81",
  "jet":             "#27272A",
  "obsidian":        "#1A1A2E",
  "yellow":          "#EAB308",
  "maroon":          "#9B1C1C",
  "raspberry":       "#BE185D",
  "imperial blue":   "#1D4ED8",
  "orange":          "#F97316",
  "copper":          "#B45309",
  "sand":            "#D4B483",
  "charcoal":        "#4B5563",
  "coal":            "#374151",
  "ash":             "#9CA3AF",
};

const FALLBACK = "#ef4444";

export function getBallColor(colorString: string | null): string {
  if (!colorString) return FALLBACK;
  const primary = colorString.split("/")[0].trim().toLowerCase();
  return COLOR_MAP[primary] ?? FALLBACK;
}

export function getBallColors(colorString: string | null): string[] {
  if (!colorString) return [FALLBACK];
  const resolved = colorString
    .split("/")
    .map((s) => COLOR_MAP[s.trim().toLowerCase()])
    .filter(Boolean) as string[];
  // deduplicate consecutive identical values
  const deduped = resolved.filter((c, i) => i === 0 || c !== resolved[i - 1]);
  return deduped.length > 0 ? deduped : [FALLBACK];
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

export function colorsSimilar(hex1: string, hex2: string): boolean {
  const [h1, s1] = hexToHsl(hex1);
  const [h2, s2] = hexToHsl(hex2);
  if (s1 < 15 || s2 < 15) return false;
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff) < 35;
}
