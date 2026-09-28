import { ImageResponse } from "next/og";
import { DESCRIPTION } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "balldiff — bowling ball reaction specs, side by side";

const BG = "#030712";
const DIM = "#374151";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const PURPLE = "#A855F7";

// Same 4x3 grid as app/icon.svg, so the share card and the favicon read as one mark.
const GRID: string[][] = [
  [RED, DIM, DIM, DIM],
  [DIM, BLUE, BLUE, DIM],
  [DIM, DIM, DIM, PURPLE],
];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: BG,
          padding: "0 90px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {GRID.map((row, y) => (
            <div key={y} style={{ display: "flex", gap: 40 }}>
              {row.map((fill, x) => (
                <div key={x} style={{ width: 52, height: 52, background: fill }} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 108, fontWeight: 700, marginTop: 56 }}>
          <span style={{ color: "#F3F4F6" }}>ball</span>
          <span style={{ color: RED }}>diff</span>
        </div>
        <div style={{ display: "flex", fontSize: 36, color: "#9CA3AF", marginTop: 20, maxWidth: 900 }}>
          {DESCRIPTION}
        </div>
      </div>
    ),
    size,
  );
}
