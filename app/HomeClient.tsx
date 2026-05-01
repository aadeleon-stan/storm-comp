"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Ball } from "@/lib/balls";
import ReactionGraph from "@/components/ReactionGraph";

const MAX = 3;

function abbrevCore(coreType: string | null) {
  if (!coreType) return null;
  return coreType.toLowerCase().startsWith("asym") ? "Asym" : "Sym";
}

export default function HomeClient({ balls }: { balls: Ball[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBrand, setShowBrand] = useState(false);
  const [showZVL, setShowZVL] = useState(false);
  const [coreFilter, setCoreFilter] = useState<"all" | "sym" | "asym">("all");
  const [coverFilter, setCoverFilter] = useState("all");
  const [zvlFilter, setZvlFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const coverOptions = useMemo(
    () => ["all", ...Array.from(new Set(balls.map((b) => b.coverstockType).filter((t): t is string => !!t))).sort()],
    [balls]
  );
  const ZVL_ORDER = ["Strong/Smooth", "Strong/Sharp", "Medium/Smooth", "Medium/Sharp", "Weak/Smooth", "Weak/Sharp", "Urethane/Urethane-Like"];
  const zvlOptions = useMemo(
    () => ["all", ...Array.from(new Set(balls.map((b) => b.zvlCategory).filter((z): z is string => !!z))).sort((a, b) => ZVL_ORDER.indexOf(a) - ZVL_ORDER.indexOf(b))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [balls]
  );
  const brandOptions = useMemo(
    () => ["all", ...Array.from(new Set(balls.map((b) => b.brand).filter((b): b is string => !!b))).sort()],
    [balls]
  );

  function displayName(ball: Ball) {
    const short = ball.shortName ?? ball.name;
    return showBrand && ball.brand ? `${ball.brand} ${short}` : short;
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return balls.filter((b) => {
      if (q && !b.name.toLowerCase().includes(q)) return false;
      if (coreFilter === "sym" && !b.coreType?.toLowerCase().startsWith("sym")) return false;
      if (coreFilter === "asym" && !b.coreType?.toLowerCase().startsWith("asym")) return false;
      if (coverFilter !== "all" && b.coverstockType !== coverFilter) return false;
      if (zvlFilter !== "all" && b.zvlCategory !== zvlFilter) return false;
      if (brandFilter !== "all" && b.brand !== brandFilter) return false;
      return true;
    });
  }, [balls, query, coreFilter, coverFilter, zvlFilter, brandFilter]);

  function toggle(id: string) {
    const isSelected = selected.has(id);
    if (isSelected) {
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
      setPreviewId((pid) => {
        if (pid !== id) return pid;
        const remaining = [...selected].filter((i) => i !== id);
        return remaining.length > 0 ? remaining[remaining.length - 1] : null;
      });
    } else if (selected.size < MAX) {
      setSelected((prev) => { const next = new Set(prev); next.add(id); return next; });
      setPreviewId(id);
    }
  }

  function compare() {
    if (selected.size < 1) return;
    router.push(`/compare?balls=${[...selected].join(",")}`);
  }

  const previewBall = previewId ? balls.find((b) => b.id === previewId) ?? null : null;

  return (
    <div className="flex gap-8 items-start">
      {/* Sticky sidebar */}
      <div className="sticky top-8 w-56 shrink-0 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Compare balls</h1>
          <p className="text-gray-400 text-sm mt-1">Select up to 3.</p>
        </div>

        <input
          type="text"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
        />

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-700 text-xs">
            {(["all", "sym", "asym"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setCoreFilter(v)}
                className={`flex-1 py-1.5 transition-colors ${
                  coreFilter === v ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {v === "all" ? "All" : v === "sym" ? "Sym" : "Asym"}
              </button>
            ))}
          </div>

          {coverOptions.length > 2 && (
            <select
              value={coverFilter}
              onChange={(e) => setCoverFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-red-500"
            >
              {coverOptions.map((opt) => (
                <option key={opt} value={opt}>{opt === "all" ? "All covers" : opt}</option>
              ))}
            </select>
          )}

          {zvlOptions.length > 2 && (
            <select
              value={zvlFilter}
              onChange={(e) => setZvlFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-red-500"
            >
              {zvlOptions.map((opt) => (
                <option key={opt} value={opt}>{opt === "all" ? "All ZVL" : opt}</option>
              ))}
            </select>
          )}

          {brandOptions.length > 2 && (
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-red-500"
            >
              {brandOptions.map((opt) => (
                <option key={opt} value={opt}>{opt === "all" ? "All brands" : opt}</option>
              ))}
            </select>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={showBrand}
            onChange={(e) => setShowBrand(e.target.checked)}
            className="accent-red-500"
          />
          Show brand
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={showZVL}
            onChange={(e) => setShowZVL(e.target.checked)}
            className="accent-red-500"
          />
          Show ZVL
        </label>

        <div className="space-y-2">
          <button
            onClick={compare}
            disabled={selected.size === 0}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
          >
            {selected.size === 0
              ? "Compare"
              : `Compare ${selected.size} ${selected.size === 1 ? "ball" : "balls"}`}
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => { setSelected(new Set()); setPreviewId(null); }}
              className="w-full text-sm text-gray-400 hover:text-white py-1"
            >
              Clear selection
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <ul className="space-y-1">
            {[...selected].map((id) => {
              const ball = balls.find((b) => b.id === id);
              return ball ? (
                <li key={id} className="text-xs text-gray-300 flex items-center gap-2">
                  <span className="text-red-500">•</span>
                  <span className="truncate">{displayName(ball)}</span>
                  <button
                    onClick={() => toggle(id)}
                    className="text-gray-600 hover:text-white shrink-0"
                    aria-label={`Remove ${ball.name}`}
                  >
                    ×
                  </button>
                </li>
              ) : null;
            })}
          </ul>
        )}
      </div>

      {/* Ball list */}
      <div className="flex-1 min-w-0">
        {balls.length === 0 ? (
          <div className="text-gray-500 text-sm py-8 text-center border border-dashed border-gray-700 rounded-lg">
            No balls in the database yet.
            <br />
            Run <code className="text-red-400">node scripts/ingest.mjs &lt;storm-url&gt;</code> to add some.
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">No balls match your filters.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((ball) => {
              const isSelected = selected.has(ball.id);
              const atMax = !isSelected && selected.size >= MAX;
              const core = abbrevCore(ball.coreType);
              const cover = ball.coverstockType;
              const zvl = showZVL ? ball.zvlCategory : null;
              const coreCover = [core, cover].filter(Boolean).join(" ");
              const subtitle = coreCover || zvl
                ? `(${[coreCover || null, zvl].filter(Boolean).join(", ")})`
                : null;
              return (
                <li key={ball.id}>
                  <button
                    onClick={() => toggle(ball.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center gap-3 ${
                      isSelected
                        ? "border-red-500 bg-red-950 text-white"
                        : atMax
                        ? "border-gray-800 bg-gray-900 opacity-40 cursor-not-allowed"
                        : "border-gray-700 bg-gray-900 hover:border-gray-500"
                    }`}
                  >
                    {ball.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ball.imageUrl}
                        alt={ball.name}
                        className="w-12 h-12 object-contain flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium">{displayName(ball)}</div>
                      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
                    </div>
                    {isSelected && (
                      <span className="ml-auto text-xs text-red-400 shrink-0">✓ selected</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Preview panel */}
      {previewBall && (
        <div className="sticky top-8 w-72 shrink-0">
          <ReactionGraph ball={previewBall} onRemove={() => toggle(previewBall.id)} />
        </div>
      )}
    </div>
  );
}
