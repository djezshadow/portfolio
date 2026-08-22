"use client";

import { useState, type ReactNode } from "react";

/**
 * Pedido: "poder mover de lugar las fotos... con drag and drop".
 *
 * Drag-and-drop nativo (HTML5) solo funciona con mouse — no existe en
 * touch (celular/tablet) ni es operable por teclado. Por eso los
 * botones de flechitas (ReorderButtons) que ya tenía cada foto NO se
 * sacan: quedan como la forma de reordenar en mobile y la única forma
 * accesible por teclado, cumpliendo la norma de accesibilidad de nunca
 * depender solo del arrastre para una acción (WCAG 2.5.7).
 */
export function DragReorderGrid<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
}: {
  items: T[];
  onReorder: (orderedIds: string[]) => Promise<void>;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  const [order, setOrder] = useState(items);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const fromIndex = order.findIndex((i) => i.id === dragId);
    const toIndex = order.findIndex((i) => i.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrder(next);
    setDragId(null);
    setOverId(null);
    void onReorder(next.map((i) => i.id));
  }

  return (
    <div className={className}>
      {order.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setDragId(item.id)}
          onDragOver={(e) => {
            e.preventDefault();
            if (overId !== item.id) setOverId(item.id);
          }}
          onDragLeave={() => setOverId((cur) => (cur === item.id ? null : cur))}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(item.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          className={`cursor-grab transition-opacity active:cursor-grabbing ${
            dragId === item.id ? "opacity-40" : ""
          } ${overId === item.id && dragId && dragId !== item.id ? "ring-2 ring-[var(--accent)]" : ""}`}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
