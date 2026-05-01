"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Ball } from "@/lib/balls";
import { getBallColors } from "@/lib/ballColor";
import { METRIC_LABELS } from "@/components/ReactionGraph";
import EmptyBallSlot from "@/components/EmptyBallSlot";

const TOTAL_CELLS = 11;

function SortableCard({
  ball,
  highlightColor,
  onCycleColor,
  onRemove,
  showZVL,
}: {
  ball: Ball;
  highlightColor: string;
  onCycleColor?: () => void;
  onRemove?: () => void;
  showZVL?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ball.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const colorCount = getBallColors(ball.color).length;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="relative bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {onRemove && (
        <button
          onClick={onRemove}
          onPointerDown={(e) => e.stopPropagation()}
          title="Remove"
          className="absolute top-1.5 right-2 text-gray-500 hover:text-white leading-none text-lg z-10"
        >
          ×
        </button>
      )}
      {/* Color swatch strip */}
      <div style={{ backgroundColor: highlightColor, height: 3 }} />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {ball.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ball.imageUrl}
              alt={ball.name}
              className="w-14 h-14 object-contain shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-white leading-snug">{ball.shortName ?? ball.name}</div>
            <a
              href={ball.url.startsWith("https://") ? ball.url : "#"}
              target="_blank"
              rel="noopener noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              className="text-[10px] text-gray-400 hover:text-red-400 block truncate"
            >
              stormbowling.com
            </a>
          </div>
        </div>
        {(ball.color || ball.fragrance || ball.coreType || ball.coverstockType || (showZVL && ball.zvlCategory)) && (
          <dl className="space-y-0.5 text-xs">
            {ball.color && (
              <div className="flex gap-1.5 items-center">
                <dt className="text-gray-500 shrink-0">Color</dt>
                <dd className="text-gray-200 flex items-center gap-1">
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
              <div className="flex gap-1.5">
                <dt className="text-gray-500 shrink-0">Fragrance</dt>
                <dd className="text-gray-200">{ball.fragrance}</dd>
              </div>
            )}
            {(ball.coreType || ball.coverstockType) && (
              <div className="flex gap-1.5">
                <dt className="text-gray-500 shrink-0">Core / Cover</dt>
                <dd className="text-gray-200">
                  {[ball.coreType, ball.coverstockType].filter(Boolean).join(" ")}
                </dd>
              </div>
            )}
            {showZVL && ball.zvlCategory && (
              <div className="flex gap-1.5">
                <dt className="text-gray-500 shrink-0">ZVL</dt>
                <dd className="text-gray-200">{ball.zvlCategory}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}

export default function StackedMetricLayout({
  balls,
  highlightColors,
  onCycleColor,
  onReorder,
  onRemove,
  allBalls,
  onAdd,
  showZVL,
}: {
  balls: Ball[];
  highlightColors: Record<string, string>;
  onCycleColor?: (ballId: string) => void;
  onReorder: (balls: Ball[]) => void;
  onRemove?: (ballId: string) => void;
  allBalls?: Ball[];
  onAdd?: (ball: Ball) => void;
  showZVL?: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  // Collect unique metric names in first-seen order across all balls
  const metricNames: string[] = [];
  for (const ball of balls) {
    for (const metric of ball.metrics) {
      if (!metricNames.includes(metric.name)) {
        metricNames.push(metric.name);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = balls.findIndex((b) => b.id === active.id);
      const newIndex = balls.findIndex((b) => b.id === over.id);
      onReorder(arrayMove(balls, oldIndex, newIndex));
    }
  }

  const totalSlots = balls.length === 3 ? 3 : balls.length + 1;
  const emptySlots = totalSlots - balls.length;
  const selectedIds = balls.map((b) => b.id);

  return (
    <div className="flex gap-6 min-w-0">
      {/* Left panel: draggable cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={balls.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="w-56 shrink-0 space-y-3">
            {balls.map((ball) => (
              <SortableCard
                key={ball.id}
                ball={ball}
                highlightColor={highlightColors[ball.id]}
                onCycleColor={onCycleColor ? () => onCycleColor(ball.id) : undefined}
                onRemove={onRemove ? () => onRemove(ball.id) : undefined}
                showZVL={showZVL}
              />
            ))}
            {allBalls && onAdd && Array.from({ length: emptySlots }, (_, i) => (
              <EmptyBallSlot
                key={`empty-${i}`}
                allBalls={allBalls}
                selectedIds={selectedIds}
                onAdd={onAdd}
                compact
                showZVL={showZVL}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Center panel: one section per metric */}
      <div className="flex-1 min-w-0 max-w-md space-y-6">
        {metricNames.map((metricName) => {
          const labels = METRIC_LABELS[metricName];
          const [left, mid, right] = labels
            ? labels.length === 3
              ? labels
              : [labels[0], null, labels[1]]
            : [null, null, null];

          return (
            <div key={metricName}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-28 shrink-0" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1 h-px bg-gray-700" />
                  <span className="text-xl font-semibold text-white shrink-0">{metricName}</span>
                  <div className="flex-1 h-px bg-gray-700" />
                </div>
              </div>
              <div className="space-y-1">
                {balls.map((ball) => {
                  const metric = ball.metrics.find((m) => m.name === metricName);
                  const highlightColor = highlightColors[ball.id];
                  return (
                    <div key={ball.id} className="flex items-center gap-2">
                      <div className="w-28 shrink-0 flex items-center justify-end gap-1.5">
                        <span className="text-xs text-gray-400 truncate">{ball.shortName ?? ball.name}</span>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: highlightColor }} />
                      </div>
                      <div className="flex gap-0.5 flex-1">
                        {Array.from({ length: TOTAL_CELLS }, (_, i) => {
                          const cell = i + 1;
                          const active = metric
                            ? cell >= metric.segmentStart && cell <= metric.segmentEnd
                            : false;
                          return (
                            <div
                              key={i}
                              className="h-4 flex-1 rounded-sm"
                              style={{ backgroundColor: active ? highlightColor : "#374151" }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              {labels && (
                <div className="flex items-start gap-2 mt-0.5">
                  <div className="w-28 shrink-0" />
                  <div className="flex justify-between flex-1 text-xs text-gray-400">
                    <span>{left}</span>
                    {mid && <span>{mid}</span>}
                    <span>{right}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
