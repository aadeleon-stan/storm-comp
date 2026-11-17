import { MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

const INTERACTIVE = "button, a, input, select, textarea, label";

function startsOnControl(event: Event) {
  return event.target instanceof Element && !!event.target.closest(INTERACTIVE);
}

// Mouse/Touch sensors that never start a drag from a button, link, or form field,
// so controls inside a draggable card (remove, cycle color, links) still receive their click.
class CardMouseSensor extends MouseSensor {
  static activators = MouseSensor.activators.map((a) => ({
    ...a,
    handler: (e: Parameters<typeof a.handler>[0], opts: Parameters<typeof a.handler>[1]) =>
      !startsOnControl(e.nativeEvent) && a.handler(e, opts),
  }));
}

class CardTouchSensor extends TouchSensor {
  static activators = TouchSensor.activators.map((a) => ({
    ...a,
    handler: (e: Parameters<typeof a.handler>[0], opts: Parameters<typeof a.handler>[1]) =>
      !startsOnControl(e.nativeEvent) && a.handler(e, opts),
  }));
}

/** Drag sensors for sortable ball cards: mouse drags immediately, touch needs a long-press so swipes scroll. */
export function useCardDragSensors() {
  return useSensors(
    useSensor(CardMouseSensor),
    useSensor(CardTouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );
}
