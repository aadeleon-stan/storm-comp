"use client";

import { useState, useMemo } from "react";
import type { Ball } from "@/lib/balls";

function abbrevCore(coreType: string | null) {
  if (!coreType) return null;
  return coreType.toLowerCase().startsWith("asym") ? "Asym" : "Sym";
}

export default function EmptyBallSlot({
  allBalls,
  selectedIds,
  onAdd,
  compact = false,
  showZVL = false,
}: {
  allBalls: Ball[];
  selectedIds: string[];
  onAdd: (ball: Ball) => void;
  compact?: boolean;
  showZVL?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coreFilter, setCoreFilter] = useState<"all" | "sym" | "asym">("all");
  const [coverFilter, setCoverFilter] = useState("all");
  const [zvlFilter, setZvlFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  const coverOptions = useMemo(
    () => ["all", ...Array.from(new Set(allBalls.map((b) => b.coverstockType).filter((t): t is string => !!t))).sort()],
    [allBalls]
  );
  const ZVL_ORDER = ["Strong/Smooth", "Strong/Sharp", "Medium/Smooth", "Medium/Sharp", "Weak/Smooth", "Weak/Sharp", "Urethane/Urethane-Like"];
  const zvlOptions = useMemo(
    () => ["all", ...Array.from(new Set(allBalls.map((b) => b.zvlCategory).filter((z): z is string => !!z))).sort((a, b) => ZVL_ORDER.indexOf(a) - ZVL_ORDER.indexOf(b))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allBalls]
  );
  const brandOptions = useMemo(
    () => ["all", ...Array.from(new Set(allBalls.map((b) => b.brand).filter((b): b is string => !!b))).sort()],
    [allBalls]
  );

  const available = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allBalls
      .filter((b) => !selectedIds.includes(b.id))
      .filter((b) => !q || b.name.toLowerCase().includes(q))
      .filter((b) => coreFilter === "all" || (coreFilter === "sym" ? b.coreType?.toLowerCase().startsWith("sym") : b.coreType?.toLowerCase().startsWith("asym")))
      .filter((b) => coverFilter === "all" || b.coverstockType === coverFilter)
      .filter((b) => zvlFilter === "all" || b.zvlCategory === zvlFilter)
      .filter((b) => brandFilter === "all" || b.brand === brandFilter);
  }, [allBalls, selectedIds, query, coreFilter, coverFilter, zvlFilter, brandFilter]);

  function CorePills({ small }: { small?: boolean }) {
    const base = small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";
    return (
      <div className="flex rounded overflow-hidden border border-gray-700">
        {(["all", "sym", "asym"] as const).map((v) => (
          <button
            key={v}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setCoreFilter(v)}
            className={`flex-1 ${base} transition-colors ${
              coreFilter === v ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {v === "all" ? "All" : v === "sym" ? "Sym" : "Asym"}
          </button>
        ))}
      </div>
    );
  }

  if (compact) {
    if (!open) {
      return (
        <div className="bg-gray-900/40 rounded-xl border border-dashed border-gray-700/50 flex items-center justify-center py-5">
          <button
            onClick={() => setOpen(true)}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-14 h-14 flex items-center justify-center text-4xl text-gray-600 hover:text-gray-300 transition-colors leading-[0] rounded-full hover:bg-gray-700/30"
            title="Add a ball"
          >
            +
          </button>
        </div>
      );
    }

    return (
      <div className="bg-gray-900/40 rounded-xl border border-dashed border-gray-700/50 overflow-hidden">
        <div className="p-3 space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="Add a ball…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-red-500"
          />
          <CorePills small />
          {coverOptions.length > 2 && (
            <select
              value={coverFilter}
              onChange={(e) => setCoverFilter(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-300 focus:outline-none focus:border-red-500"
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
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-300 focus:outline-none focus:border-red-500"
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
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-300 focus:outline-none focus:border-red-500"
            >
              {brandOptions.map((opt) => (
                <option key={opt} value={opt}>{opt === "all" ? "All brands" : opt}</option>
              ))}
            </select>
          )}
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {available.map((ball) => {
              const core = abbrevCore(ball.coreType);
              const cover = ball.coverstockType;
              const zvl = showZVL ? ball.zvlCategory : null;
              const coreCover = [core, cover].filter(Boolean).join(" ");
              const subtitle = coreCover || zvl ? `(${[coreCover || null, zvl].filter(Boolean).join(", ")})` : null;
              return (
                <li key={ball.id}>
                  <button
                    onClick={() => { onAdd(ball); setQuery(""); setOpen(false); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-full text-left flex items-center gap-2 px-1.5 py-1 rounded hover:bg-gray-800 transition-colors"
                  >
                    {ball.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ball.imageUrl} alt={ball.name} className="w-8 h-8 object-contain shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs text-gray-200 truncate">{ball.shortName ?? ball.name}</div>
                      {subtitle && <div className="text-[10px] text-gray-500">{subtitle}</div>}
                    </div>
                  </button>
                </li>
              );
            })}
            {available.length === 0 && (
              <li className="text-xs text-gray-500 px-1.5 py-1">No balls available</li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="bg-gray-900/40 rounded-xl border border-dashed border-gray-700/50 w-full min-w-0 h-full flex items-center justify-center">
        <button
          onClick={() => setOpen(true)}
          className="w-20 h-20 flex items-center justify-center text-5xl text-gray-600 hover:text-gray-300 transition-colors leading-[0] rounded-full hover:bg-gray-700/30"
          title="Add a ball"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-dashed border-gray-700 w-full min-w-0 flex flex-col gap-3 h-full min-h-0">
      <input
        autoFocus
        type="text"
        placeholder="Add a ball…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 shrink-0"
      />
      <div className="flex flex-col gap-2 shrink-0">
        <CorePills />
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
      <ul className="space-y-1.5 overflow-y-auto flex-1 min-h-0">
        {available.map((ball) => {
          const core = abbrevCore(ball.coreType);
          const cover = ball.coverstockType;
          const zvl = showZVL ? ball.zvlCategory : null;
          const coreCover = [core, cover].filter(Boolean).join(" ");
          const subtitle = coreCover || zvl ? `(${[coreCover || null, zvl].filter(Boolean).join(", ")})` : null;
          return (
            <li key={ball.id}>
              <button
                onClick={() => { onAdd(ball); setQuery(""); setOpen(false); }}
                className="w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {ball.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ball.imageUrl} alt={ball.name} className="w-10 h-10 object-contain shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-sm text-gray-200">{ball.shortName ?? ball.name}</div>
                  {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
                </div>
              </button>
            </li>
          );
        })}
        {available.length === 0 && (
          <li className="text-sm text-gray-500 px-2 py-1.5">No balls available</li>
        )}
      </ul>
    </div>
  );
}
