"use client";
import { useState } from "react";
import type { Ball } from "@/lib/balls";
import { getBallColor, getBallColors } from "@/lib/ballColor";

const TOTAL_CELLS = 11;

export const METRIC_LABELS: Record<string, [string, string] | [string, string, string]> = {
  "Flare Potential": ["Low", "Medium", "High"],
  "Ball Shape":      ["Smooth", "Angular"],
  "Hook Length":     ["Early", "Mid-Lane", "Late"],
  "Oil Volume":      ["Light", "Medium", "Heavy"],
  "Pattern Length":  ["Short", "Medium", "Long"],
  "Lane Condition":  ["Fresh", "Transition", "Burn"],
};

export default function ReactionGraph({
  ball,
  highlightColor: highlightColorProp,
  onCycleColor,
  onRemove,
  showBrand,
  showZVL,
}: {
  ball: Ball;
  highlightColor?: string;
  onCycleColor?: () => void;
  onRemove?: () => void;
  showBrand?: boolean;
  showZVL?: boolean;
}) {
  const highlightColor = highlightColorProp ?? getBallColor(ball.color);
  const colorCount = getBallColors(ball.color).length;
  const [coreImgError, setCoreImgError] = useState(false);
  return (
    <div className="relative bg-gray-900 rounded-xl p-5 border border-gray-800 w-full min-w-0">
      {onRemove && (
        <button
          onClick={onRemove}
          onPointerDown={(e) => e.stopPropagation()}
          title="Remove"
          className="absolute top-2 right-2 text-gray-500 hover:text-white leading-none text-lg"
        >
          ×
        </button>
      )}
      <div data-ball-features>
        {ball.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ball.imageUrl}
            alt={ball.name}
            className="w-36 h-36 object-contain mx-auto mb-3"
          />
        )}
        <h2 className="text-lg font-bold mb-1 text-white">
          {showBrand && ball.brand ? `${ball.brand} ` : ""}
          {ball.shortName ?? ball.name}
        </h2>
        <a
          href={ball.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-red-400 block truncate"
        >
          {ball.url}
        </a>

        {(ball.color || ball.fragrance || ball.coreType || ball.coverstockType || (showZVL && ball.zvlCategory)) && (
          <dl className="mt-3 space-y-1 text-sm">
            {ball.color && (
              <div className="flex gap-2">
                <dt className="text-gray-500 shrink-0">Color</dt>
                <dd className="text-gray-200 flex items-center gap-1.5">
                  {ball.color}
                  {onCycleColor && colorCount > 1 && (
                    <button
                      onClick={onCycleColor}
                      onPointerDown={(e) => e.stopPropagation()}
                      title="Cycle color"
                      className="text-gray-500 hover:text-white leading-none"
                    >
                      ↻
                    </button>
                  )}
                </dd>
              </div>
            )}
            {ball.fragrance && (
              <div className="flex gap-2">
                <dt className="text-gray-500 shrink-0">Fragrance</dt>
                <dd className="text-gray-200">{ball.fragrance}</dd>
              </div>
            )}
            {(ball.coreType || ball.coverstockType) && (
              <div className="flex gap-2">
                <dt className="text-gray-500 shrink-0">Core / Cover</dt>
                <dd className="text-gray-200">
                  {[ball.coreType, ball.coverstockType].filter(Boolean).join(" ")}
                </dd>
              </div>
            )}
            {showZVL && ball.zvlCategory && (
              <div className="flex gap-2">
                <dt className="text-gray-500 shrink-0">ZVL</dt>
                <dd className="text-gray-200">{ball.zvlCategory}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="space-y-4 mt-5">
        {ball.metrics.map((metric) => (
          <div key={metric.name}>
            <div className="text-xs font-medium text-gray-300 mb-1.5">{metric.name}</div>
            <div className="flex gap-0.5">
              {Array.from({ length: TOTAL_CELLS }, (_, i) => {
                const cell = i + 1;
                const active = cell >= metric.segmentStart && cell <= metric.segmentEnd;
                return (
                  <div
                    key={i}
                    className="h-5 flex-1 rounded-sm transition-colors"
                    style={active ? { backgroundColor: highlightColor } : { backgroundColor: "#374151" }}
                  />
                );
              })}
            </div>
            {(() => {
              const labels = METRIC_LABELS[metric.name];
              if (!labels) return null;
              const [left, mid, right] = labels.length === 3 ? labels : [labels[0], null, labels[1]];
              return (
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>{left}</span>
                  {mid && <span>{mid}</span>}
                  <span>{right}</span>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {(ball.coreName || ball.coverstockName || ball.coreImageUrl) && (
        <div className="mt-5 space-y-2">
          {(ball.coreName || ball.coverstockName) && (
            <dl className="space-y-1 text-sm">
              {ball.coverstockName && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 shrink-0">Coverstock</dt>
                  <dd className="text-gray-200">{ball.coverstockName}</dd>
                </div>
              )}
              {ball.coreName && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 shrink-0">Core</dt>
                  <dd className="text-gray-200">{ball.coreName}</dd>
                </div>
              )}
            </dl>
          )}
          {ball.coreImageUrl && !coreImgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ball.coreImageUrl}
              alt="Core cross-section"
              className="w-full max-h-32 object-contain"
              onError={() => setCoreImgError(true)}
            />
          ) : (
            <svg
              viewBox="0 0 120 80"
              aria-label="Core cross-section unavailable"
              className="w-full max-h-24 opacity-20"
            >
              <circle cx="60" cy="40" r="36" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
              <circle cx="60" cy="40" r="24" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
              <circle cx="60" cy="40" r="13" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
              <circle cx="60" cy="40" r="4"  fill="#9ca3af" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
