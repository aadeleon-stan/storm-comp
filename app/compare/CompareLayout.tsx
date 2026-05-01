"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactionGraph from "@/components/ReactionGraph";
import StackedMetricLayout from "@/components/StackedMetricLayout";
import EmptyBallSlot from "@/components/EmptyBallSlot";
import type { Ball } from "@/lib/balls";
import { getBallColors, colorsSimilar } from "@/lib/ballColor";

function SortableBall({
  ball,
  highlightColor,
  onCycleColor,
  onRemove,
  showBrand,
  showZVL,
}: {
  ball: Ball;
  highlightColor: string;
  onCycleColor?: () => void;
  onRemove?: () => void;
  showBrand: boolean;
  showZVL: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ball.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ReactionGraph ball={ball} highlightColor={highlightColor} onCycleColor={onCycleColor} onRemove={onRemove} showBrand={showBrand} showZVL={showZVL} />
    </div>
  );
}

export default function CompareLayout({ balls: initialBalls, allBalls }: { balls: Ball[]; allBalls: Ball[] }) {
  const router = useRouter();
  const [balls, setBalls] = useState(initialBalls);
  const [colorIndices, setColorIndices] = useState<Record<string, number>>({});
  const [view, setView] = useState<"card" | "stacked">("card");
  const [showBrand, setShowBrand] = useState(false);
  const [showColors, setShowColors] = useState(true);
  const [showZVL, setShowZVL] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    const initialIndices: Record<string, number> = {};
    const resolved: string[] = [];
    for (const ball of balls) {
      const colors = getBallColors(ball.color);
      let idx = colorIndices[ball.id] ?? 0;
      while (idx < colors.length - 1 && resolved.some((c) => colorsSimilar(c, colors[idx]))) {
        idx++;
      }
      resolved.push(colors[idx]);
      initialIndices[ball.id] = idx;
    }
    setColorIndices(initialIndices);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balls]);

  useEffect(() => {
    const ids = balls.map((b) => b.id).join(",");
    router.replace(`/compare?balls=${ids}`, { scroll: false });
  }, [balls, router]);

  function cycleColor(ballId: string) {
    setColorIndices((prev) => {
      const ball = balls.find((b) => b.id === ballId);
      if (!ball) return prev;
      const colors = getBallColors(ball.color);
      const current = prev[ballId] ?? 0;
      return { ...prev, [ballId]: (current + 1) % colors.length };
    });
  }

  function removeBall(id: string) {
    setBalls((prev) => prev.filter((b) => b.id !== id));
    setColorIndices((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function addBall(ball: Ball) {
    setBalls((prev) => (prev.length < 3 ? [...prev, ball] : prev));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBalls((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  useEffect(() => {
    const sections = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>("[data-ball-features]") ?? []
    );
    if (sections.length < 2) return;
    sections.forEach((s) => (s.style.minHeight = ""));
    const maxH = Math.max(...sections.map((s) => s.offsetHeight));
    sections.forEach((s) => (s.style.minHeight = `${maxH}px`));
  }, [balls, view]);

  // Always render 3 columns; show 1 empty slot unless at 3 balls.
  // At 1 ball, show 2 total slots (1 real + 1 empty).
  const totalSlots = balls.length === 3 ? 3 : balls.length + 1;
  const emptySlots = totalSlots - balls.length;

  const highlightColors: Record<string, string> = {};
  for (const ball of balls) {
    const colors = getBallColors(ball.color);
    highlightColors[ball.id] = showColors ? colors[colorIndices[ball.id] ?? 0] : "#dc2626";
  }

  const selectedIds = balls.map((b) => b.id);

  return (
    <div>
      <div className="mb-6 space-y-2">
        <div className="flex gap-1">
          <button
            onClick={() => setView("card")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "card" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setView("stacked")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "stacked" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Stacked
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={showColors}
            onChange={(e) => setShowColors(e.target.checked)}
            className="accent-red-500"
          />
          Show colors
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
        {view === "card" && (
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={showBrand}
              onChange={(e) => setShowBrand(e.target.checked)}
              className="accent-red-500"
            />
            Show brand
          </label>
        )}
      </div>

      {view === "stacked" ? (
        <StackedMetricLayout
          balls={balls}
          highlightColors={highlightColors}
          onCycleColor={showColors ? cycleColor : undefined}
          onReorder={setBalls}
          onRemove={removeBall}
          allBalls={allBalls}
          onAdd={addBall}
          showZVL={showZVL}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToHorizontalAxis]}>
          <SortableContext items={balls.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
            <div ref={containerRef} className="grid gap-4 grid-cols-3">
              {balls.map((ball) => (
                <SortableBall
                  key={ball.id}
                  ball={ball}
                  highlightColor={highlightColors[ball.id]}
                  onCycleColor={showColors ? () => cycleColor(ball.id) : undefined}
                  onRemove={() => removeBall(ball.id)}
                  showBrand={showBrand}
                  showZVL={showZVL}
                />
              ))}
              {Array.from({ length: emptySlots }, (_, i) => (
                <div key={`empty-${i}`} className="relative">
                  <div className="absolute inset-0 flex">
                    <EmptyBallSlot
                      allBalls={allBalls}
                      selectedIds={selectedIds}
                      onAdd={addBall}
                      showZVL={showZVL}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
